import datetime
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, CampaignConfig, Booking


class CampaignStatsAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        tz = timezone.get_current_timezone()
        self.now = timezone.now()
        self.future_deadline = self.now + datetime.timedelta(days=30)
        self.start_dt = self.now + datetime.timedelta(days=60)
        self.end_dt = self.now + datetime.timedelta(days=80)

        # Ensure single clean config
        CampaignConfig.objects.all().delete()
        self.cfg = CampaignConfig.objects.create(
            early_bird_code='EARLYBIRD5',
            early_bird_discount_pct=2,
            early_bird_cap=20,
            early_bird_baseline_claimed=18,
            early_bird_deadline=self.future_deadline,
            event_start_date=self.start_dt,
            event_end_date=self.end_dt,
            per_package_cap=100,
            is_active=True,
        )

        # Create packages
        self.pkg1 = Package.objects.create(
            slug='pkg-1',
            name='Package 1',
            price_ngn=50000,
            max_seats=100,
            seats_booked=40,
            is_active=True,
        )
        self.pkg2 = Package.objects.create(
            slug='pkg-2',
            name='Package 2',
            price_ngn=60000,
            max_seats=100,
            seats_booked=60,
            is_active=True,
        )
        self.pkg_inactive = Package.objects.create(
            slug='pkg-inactive',
            name='Inactive Package',
            price_ngn=80000,
            max_seats=50,
            seats_booked=10,
            is_active=False,
        )

    def test_stats_initial_counts(self):
        res = self.client.get('/api/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        # Early bird checks
        eb = data['earlyBird']
        self.assertEqual(eb['code'], 'EARLYBIRD5')
        self.assertEqual(eb['discountPct'], 2)
        self.assertEqual(eb['totalCap'], 20)
        self.assertEqual(eb['claimed'], 18)
        self.assertEqual(eb['remaining'], 2)
        self.assertTrue(eb['isActive'])

        # Global cap checks (active packages only: 100+100=200 max, 40+60=100 booked)
        gc = data['globalCap']
        self.assertEqual(gc['totalCapacity'], 200)
        self.assertEqual(gc['totalBooked'], 100)
        self.assertEqual(gc['totalRemaining'], 100)

        # Event dates checks
        ed = data['eventDates']
        self.assertIn('start', ed)
        self.assertIn('end', ed)
        self.assertEqual(ed['display'], '13–30 December 2026')

        # Exchange rates checks
        xr = data['exchangeRates']
        self.assertEqual(xr['USD'], 1600.0)
        self.assertEqual(xr['GBP'], 2050.0)

    def test_stats_dynamic_early_bird_claims(self):
        # Create a booking with EARLYBIRD5 code for 1 guest
        Booking.objects.create(
            full_name='Simi Ogunleye',
            email='simi@example.com',
            phone='+2348011223344',
            guest_count=1,
            selected_packages=['pkg-1'],
            promo_code='EARLYBIRD5',
            subtotal_ngn=50000,
            final_total_ngn=47500,
        )

        res = self.client.get('/api/stats/')
        eb = res.json()['earlyBird']
        # 18 baseline + 1 actual booking = 19 claimed, 1 remaining
        self.assertEqual(eb['claimed'], 19)
        self.assertEqual(eb['remaining'], 1)
        self.assertTrue(eb['isActive'])

    def test_stats_early_bird_sold_out_marks_is_active_false(self):
        # Create booking for 2 guests to exhaust remaining early bird seats
        Booking.objects.create(
            full_name='Adekunle Gold',
            email='ag@example.com',
            phone='+2348022334455',
            guest_count=2,
            selected_packages=['pkg-1'],
            promo_code='EARLYBIRD5',
            subtotal_ngn=100000,
            final_total_ngn=95000,
        )

        res = self.client.get('/api/stats/')
        eb = res.json()['earlyBird']
        # 18 baseline + 2 actual = 20 claimed (cap reached)
        self.assertEqual(eb['claimed'], 20)
        self.assertEqual(eb['remaining'], 0)
        self.assertFalse(eb['isActive'])

    def test_stats_early_bird_capped_when_bookings_exceed_cap(self):
        # Create bookings for 10 guests with EARLYBIRD5 (exceeding cap of 20)
        Booking.objects.create(
            full_name='Davido Adeleke',
            email='davido@example.com',
            phone='+2348033445566',
            guest_count=10,
            selected_packages=['pkg-1'],
            promo_code='EARLYBIRD5',
            subtotal_ngn=500000,
            final_total_ngn=475000,
        )

        res = self.client.get('/api/stats/')
        eb = res.json()['earlyBird']
        # Claimed must not exceed totalCap (20)
        self.assertEqual(eb['claimed'], 20)
        self.assertEqual(eb['remaining'], 0)
        self.assertFalse(eb['isActive'])

    def test_stats_past_deadline_marks_is_active_false(self):
        # Set deadline to the past
        self.cfg.early_bird_deadline = self.now - datetime.timedelta(hours=1)
        self.cfg.save()

        res = self.client.get('/api/stats/')
        eb = res.json()['earlyBird']
        self.assertFalse(eb['isActive'])

    def test_stats_inactive_config_marks_is_active_false(self):
        self.cfg.is_active = False
        self.cfg.save()

        res = self.client.get('/api/stats/')
        eb = res.json()['earlyBird']
        self.assertFalse(eb['isActive'])
