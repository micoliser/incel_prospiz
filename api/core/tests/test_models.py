import uuid
import datetime
from django.test import TestCase
from django.utils import timezone
from core.models import Package, PromoCode, CampaignConfig, Booking


class PackageModelTest(TestCase):
    def setUp(self):
        self.excursion_1 = Package.objects.create(
            slug='test-excursion-1',
            name='Test Excursion 1',
            category='excursion',
            price_ngn=75000,
            image='/images/test1.jpg',
            duration='Full Day',
            dates='15 Dec 2026',
            location='Lagos',
            max_seats=100,
            seats_booked=90,
            description='Test excursion description',
            inclusions=['Transport', 'Security'],
            display_order=1,
            is_active=True,
        )
        self.excursion_2 = Package.objects.create(
            slug='test-excursion-2',
            name='Test Excursion 2',
            category='excursion',
            price_ngn=85000,
            image='/images/test2.jpg',
            duration='Afternoon',
            dates='16 Dec 2026',
            location='Lagos',
            max_seats=100,
            seats_booked=95,
            description='Test excursion description 2',
            inclusions=['Refreshments'],
            display_order=2,
            is_active=True,
        )
        self.bundle = Package.objects.create(
            slug='test-bundle',
            name='Test VIP Bundle',
            category='bundle',
            price_ngn=500000,
            image='/images/bundle.jpg',
            duration='7 Days',
            dates='13-30 Dec 2026',
            location='Lagos',
            max_seats=100,
            seats_booked=10,
            description='Test VIP Bundle description',
            inclusions=['All excursions', 'VIP Access'],
            display_order=0,
            is_active=True,
        )

    def test_package_creation_has_uuid(self):
        self.assertIsInstance(self.excursion_1.id, uuid.UUID)
        self.assertIsInstance(self.bundle.id, uuid.UUID)

    def test_excursion_seats_remaining(self):
        # Excursion 1 has 100 max and 90 booked -> 10 remaining
        self.assertEqual(self.excursion_1.seats_remaining, 10)
        # Excursion 2 has 100 max and 95 booked -> 5 remaining
        self.assertEqual(self.excursion_2.seats_remaining, 5)

    def test_excursion_seats_remaining_floor_at_zero(self):
        self.excursion_1.seats_booked = 105
        self.excursion_1.save()
        self.assertEqual(self.excursion_1.seats_remaining, 0)

    def test_bundle_seats_remaining_constrained_by_bottleneck_excursion(self):
        # Bundle has 100 - 10 = 90 own remaining seats
        # Excursion 1 has 10 remaining seats
        # Excursion 2 has 5 remaining seats (the bottleneck)
        # So bundle seats remaining MUST be 5!
        self.assertEqual(self.bundle.seats_remaining, 5)

    def test_bundle_seats_remaining_zero_when_excursion_sold_out(self):
        # Set Excursion 2 to sold out (100 booked)
        self.excursion_2.seats_booked = 100
        self.excursion_2.save()
        self.assertEqual(self.bundle.seats_remaining, 0)

    def test_bundle_seats_remaining_bounded_by_own_quota(self):
        # If the bundle itself has only 2 seats remaining, even if excursions have 10 seats left
        self.bundle.seats_booked = 98
        self.bundle.save()
        # Bundle own remaining = 2, excursion min remaining = 5 -> min is 2
        self.assertEqual(self.bundle.seats_remaining, 2)

    def test_package_str_representation(self):
        self.assertEqual(str(self.excursion_1), 'Test Excursion 1 (₦75,000)')


class PromoCodeModelTest(TestCase):
    def setUp(self):
        self.promo = PromoCode.objects.create(
            code='DETTY10',
            discount_pct=10,
            is_active=True,
        )

    def test_promo_code_str(self):
        self.assertEqual(str(self.promo), 'DETTY10 (10% off)')

    def test_promo_code_has_uuid(self):
        self.assertIsInstance(self.promo.id, uuid.UUID)


class CampaignConfigModelTest(TestCase):
    def test_get_settings_creates_singleton_if_none_exists(self):
        CampaignConfig.objects.all().delete()
        self.assertEqual(CampaignConfig.objects.count(), 0)
        cfg = CampaignConfig.get_settings()
        self.assertIsNotNone(cfg)
        self.assertEqual(CampaignConfig.objects.count(), 1)
        self.assertEqual(cfg.early_bird_code, 'EARLYBIRD5')
        self.assertEqual(cfg.early_bird_cap, 20)
        self.assertEqual(cfg.early_bird_baseline_claimed, 18)

    def test_get_settings_returns_existing_record(self):
        cfg1 = CampaignConfig.get_settings()
        cfg1.early_bird_cap = 50
        cfg1.save()
        cfg2 = CampaignConfig.get_settings()
        self.assertEqual(cfg2.early_bird_cap, 50)
        self.assertEqual(CampaignConfig.objects.count(), 1)

    def test_str_representation(self):
        cfg = CampaignConfig.get_settings()
        self.assertEqual(str(cfg), f"Campaign Settings ({cfg.early_bird_code})")


class BookingModelTest(TestCase):
    def test_booking_auto_generates_unique_booking_ref(self):
        booking1 = Booking.objects.create(
            full_name='Babatunde Fashola',
            email='babatunde@example.com',
            phone='+2348012345678',
            selected_packages=['test-pkg'],
            subtotal_ngn=75000,
            final_total_ngn=75000,
        )
        self.assertTrue(booking1.booking_ref.startswith('DL-2026-'))
        self.assertIsInstance(booking1.id, uuid.UUID)

        booking2 = Booking.objects.create(
            full_name='Funke Akindele',
            email='funke@example.com',
            phone='+2348087654321',
            selected_packages=['test-pkg'],
            subtotal_ngn=75000,
            final_total_ngn=75000,
        )
        self.assertTrue(booking2.booking_ref.startswith('DL-2026-'))
        self.assertNotEqual(booking1.booking_ref, booking2.booking_ref)

    def test_booking_preserves_existing_booking_ref_on_update(self):
        booking = Booking.objects.create(
            full_name='Wizkid Balogun',
            email='wizkid@example.com',
            phone='+2348099887766',
            selected_packages=['test-pkg'],
        )
        original_ref = booking.booking_ref
        booking.full_name = 'Ayodeji Balogun'
        booking.save()
        self.assertEqual(booking.booking_ref, original_ref)

    def test_booking_str_representation(self):
        booking = Booking.objects.create(
            full_name='Tiwa Savage',
            email='tiwa@example.com',
            phone='+2348011223344',
            selected_packages=['test-pkg'],
            payment_status='pending',
        )
        self.assertEqual(str(booking), f"{booking.booking_ref} - Tiwa Savage (pending)")
