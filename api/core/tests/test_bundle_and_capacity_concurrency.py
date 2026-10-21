from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, Booking


class BundleAndCapacityConcurrencyTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create the 5 excursions
        self.abeokuta = Package.objects.create(
            slug='abeokuta-heritage',
            name='Abeokuta Heritage & Scenic Rail',
            category='excursion',
            price_ngn=75000,
            max_seats=100,
            seats_booked=10,
            is_active=True,
        )
        self.badagry = Package.objects.create(
            slug='badagry-heritage',
            name='Badagry Slave Route',
            category='excursion',
            price_ngn=70000,
            max_seats=100,
            seats_booked=8,
            is_active=True,
        )
        self.tarkwa = Package.objects.create(
            slug='tarkwa-bay-beach',
            name='Tarkwa Bay Luxury Beach Cruise',
            category='excursion',
            price_ngn=75000,
            max_seats=100,
            seats_booked=15,
            is_active=True,
        )
        self.kalakuta = Package.objects.create(
            slug='kalakuta-museum',
            name='Kalakuta Afrobeat Shrine',
            category='excursion',
            price_ngn=85000,
            max_seats=100,
            seats_booked=18,
            is_active=True,
        )
        self.lekki = Package.objects.create(
            slug='lekki-conservation-centre',
            name='Lekki Conservation Centre',
            category='excursion',
            price_ngn=75000,
            max_seats=100,
            seats_booked=13,
            is_active=True,
        )

        # Create VIP Bundle
        self.vip_bundle = Package.objects.create(
            slug='all-inclusive-vip',
            name='The Ultimate "Lagos Luxe" 7-Day All-Access Pass',
            category='bundle',
            price_ngn=520000,
            max_seats=50,
            seats_booked=4,
            is_active=True,
        )

    def test_booking_bundle_increments_all_excursions(self):
        payload = {
            'fullName': 'VIP Guest',
            'email': 'vip@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['all-inclusive-vip'],
            'paymentMethod': 'card',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Refresh from DB
        self.vip_bundle.refresh_from_db()
        self.abeokuta.refresh_from_db()
        self.badagry.refresh_from_db()
        self.tarkwa.refresh_from_db()
        self.kalakuta.refresh_from_db()
        self.lekki.refresh_from_db()

        # Bundle itself incremented from 4 to 5
        self.assertEqual(self.vip_bundle.seats_booked, 5)

        # All 5 excursions incremented by 1
        self.assertEqual(self.abeokuta.seats_booked, 11)
        self.assertEqual(self.badagry.seats_booked, 9)
        self.assertEqual(self.tarkwa.seats_booked, 16)
        self.assertEqual(self.kalakuta.seats_booked, 19)
        self.assertEqual(self.lekki.seats_booked, 14)

    def test_booking_bundle_multi_guests_increments_all_excursions_proportionally(self):
        payload = {
            'fullName': 'VIP Family of Four',
            'email': 'vipfamily@example.com',
            'phone': '+2348012345678',
            'guestCount': 4,
            'selectedPackages': ['all-inclusive-vip'],
            'paymentMethod': 'card',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.vip_bundle.refresh_from_db()
        self.abeokuta.refresh_from_db()
        self.badagry.refresh_from_db()
        self.tarkwa.refresh_from_db()
        self.kalakuta.refresh_from_db()
        self.lekki.refresh_from_db()

        self.assertEqual(self.vip_bundle.seats_booked, 8)  # was 4 + 4
        self.assertEqual(self.abeokuta.seats_booked, 14)   # was 10 + 4
        self.assertEqual(self.badagry.seats_booked, 12)    # was 8 + 4
        self.assertEqual(self.tarkwa.seats_booked, 19)     # was 15 + 4
        self.assertEqual(self.kalakuta.seats_booked, 22)   # was 18 + 4
        self.assertEqual(self.lekki.seats_booked, 17)      # was 13 + 4

    def test_bundle_booking_fails_when_one_excursion_exceeds_capacity(self):
        # Set Tarkwa Bay to 98 booked (only 2 seats remaining)
        self.tarkwa.seats_booked = 98
        self.tarkwa.save()

        # Attempt to book bundle for 3 guests
        payload = {
            'fullName': 'Denied Group',
            'email': 'denied@example.com',
            'phone': '+2348012345678',
            'guestCount': 3,
            'selectedPackages': ['all-inclusive-vip'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        data = res.json()
        self.assertIn('error', data)
        self.assertIn('Tarkwa Bay Luxury Beach Cruise', data['error'])
        self.assertIn('only 2 seats remaining', data['error'])

        # Verify atomic rollback: no seats booked modified
        self.vip_bundle.refresh_from_db()
        self.tarkwa.refresh_from_db()
        self.abeokuta.refresh_from_db()
        self.assertEqual(self.vip_bundle.seats_booked, 4)
        self.assertEqual(self.tarkwa.seats_booked, 98)
        self.assertEqual(self.abeokuta.seats_booked, 10)
        self.assertEqual(Booking.objects.filter(email='denied@example.com').count(), 0)

    def test_bundle_booking_fails_when_one_excursion_sold_out(self):
        # Set Kalakuta to 100/100 (sold out)
        self.kalakuta.seats_booked = 100
        self.kalakuta.save()

        payload = {
            'fullName': 'Solo Guest',
            'email': 'solo@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['all-inclusive-vip'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Kalakuta Afrobeat Shrine', res.json()['error'])
        self.assertIn('sold out', res.json()['error'])

    def test_bundle_booking_fails_when_bundle_own_cap_exceeded(self):
        # Bundle has max_seats=50, set seats_booked=49 (1 seat remaining)
        self.vip_bundle.seats_booked = 49
        self.vip_bundle.save()

        # Excursions all have plenty of seats, but bundle cap is only 1 left
        payload = {
            'fullName': 'Two VIPs',
            'email': 'twovips@example.com',
            'phone': '+2348012345678',
            'guestCount': 2,
            'selectedPackages': ['all-inclusive-vip'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('sold out', res.json()['error'])
        self.assertIn('All-Access Pass', res.json()['error'])

    def test_single_excursion_overbooking_prevention(self):
        # Abeokuta has 99/100 booked
        self.abeokuta.seats_booked = 99
        self.abeokuta.save()

        payload = {
            'fullName': 'Overbook Attempt',
            'email': 'overbook@example.com',
            'phone': '+2348012345678',
            'guestCount': 2,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Abeokuta Heritage & Scenic Rail', res.json()['error'])
        self.assertIn('only 1 seats remaining', res.json()['error'])

        # Confirm seat count untouched
        self.abeokuta.refresh_from_db()
        self.assertEqual(self.abeokuta.seats_booked, 99)
