import uuid
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, PromoCode, Booking


class BookingCreationAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

        self.abeokuta = Package.objects.create(
            slug='abeokuta-heritage',
            name='Abeokuta Heritage & Scenic Rail',
            category='excursion',
            price_ngn=75000,
            price_foreigner_ngn=None,
            max_seats=100,
            seats_booked=10,
            is_active=True,
        )

        self.badagry = Package.objects.create(
            slug='badagry-heritage',
            name='Badagry Slave Route',
            category='excursion',
            price_ngn=70000,
            price_foreigner_ngn=90000,
            max_seats=100,
            seats_booked=5,
            is_active=True,
        )

        self.tarkwa = Package.objects.create(
            slug='tarkwa-bay-beach',
            name='Tarkwa Bay Luxury Beach Cruise',
            category='excursion',
            price_ngn=75000,
            price_foreigner_ngn=None,
            max_seats=100,
            seats_booked=20,
            is_active=True,
        )

        self.promo_5 = PromoCode.objects.create(
            code='EARLYBIRD5',
            discount_pct=2,
            is_active=True,
        )

        self.promo_10 = PromoCode.objects.create(
            code='DETTY10',
            discount_pct=10,
            is_active=True,
        )

    def tearDown(self):
        cache.clear()

    def test_create_standard_single_booking(self):
        payload = {
            'fullName': 'Tunde Adeyemi',
            'email': 'tunde@example.com',
            'phone': '+2348012345678',
            'country': 'Nigeria',
            'guestCount': 1,
            'isForeigner': False,
            'selectedPackages': ['abeokuta-heritage'],
            'paymentMethod': 'card',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()

        self.assertTrue(data['bookingRef'].startswith('DL-2026-'))
        self.assertEqual(data['fullName'], 'Tunde Adeyemi')
        self.assertEqual(data['guestCount'], 1)
        self.assertEqual(data['subtotalNGN'], 75000)
        self.assertEqual(data['groupDiscountPct'], 0)
        self.assertEqual(data['groupDiscountNGN'], 0)
        self.assertIsNone(data['promoCode'])
        self.assertEqual(data['promoDiscountPct'], 0)
        self.assertEqual(data['promoDiscountNGN'], 0)
        self.assertEqual(data['finalTotalNGN'], 75000)
        self.assertEqual(data['paymentStatus'], 'pending')

        # Check seats booked incremented in database
        self.abeokuta.refresh_from_db()
        self.assertEqual(self.abeokuta.seats_booked, 11)

    def test_create_multi_package_booking(self):
        payload = {
            'fullName': 'Folake Coker',
            'email': 'folake@example.com',
            'phone': '+2348098765432',
            'country': 'Nigeria',
            'guestCount': 2,
            'isForeigner': False,
            'selectedPackages': ['abeokuta-heritage', 'tarkwa-bay-beach'],
            'paymentMethod': 'transfer',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()

        # (75,000 + 75,000) * 2 = 300,000
        self.assertEqual(data['subtotalNGN'], 300000)
        self.assertEqual(data['finalTotalNGN'], 300000)

        # Check both packages incremented by 2
        self.abeokuta.refresh_from_db()
        self.tarkwa.refresh_from_db()
        self.assertEqual(self.abeokuta.seats_booked, 12)
        self.assertEqual(self.tarkwa.seats_booked, 22)

    def test_badagry_foreigner_tier_pricing(self):
        # Local resident rate: 70,000 NGN
        payload_local = {
            'fullName': 'Emeka Obi',
            'email': 'emeka@example.com',
            'phone': '+2348011111111',
            'country': 'Nigeria',
            'guestCount': 1,
            'isForeigner': False,
            'selectedPackages': ['badagry-heritage'],
        }
        res_local = self.client.post('/api/bookings/', data=payload_local, format='json')
        self.assertEqual(res_local.json()['subtotalNGN'], 70000)

        # Diaspora / Foreigner rate: 90,000 NGN
        payload_foreigner = {
            'fullName': 'Marcus Sterling',
            'email': 'marcus@example.co.uk',
            'phone': '+447123456789',
            'country': 'UK',
            'guestCount': 1,
            'isForeigner': True,
            'selectedPackages': ['badagry-heritage'],
        }
        res_foreigner = self.client.post('/api/bookings/', data=payload_foreigner, format='json')
        self.assertEqual(res_foreigner.json()['subtotalNGN'], 90000)

    def test_other_package_unaffected_by_foreigner_flag(self):
        payload_foreigner = {
            'fullName': 'Sarah Jenkins',
            'email': 'sarah@example.com',
            'phone': '+12025550199',
            'country': 'USA',
            'guestCount': 1,
            'isForeigner': True,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload_foreigner, format='json')
        self.assertEqual(res.json()['subtotalNGN'], 75000)

    def test_group_discount_thresholds(self):
        # 3 guests: NO group discount
        payload_3 = {
            'fullName': 'Group of Three',
            'email': 'group3@example.com',
            'phone': '+2348012345003',
            'guestCount': 3,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res3 = self.client.post('/api/bookings/', data=payload_3, format='json')
        self.assertEqual(res3.json()['subtotalNGN'], 225000)
        self.assertEqual(res3.json()['groupDiscountPct'], 0)
        self.assertEqual(res3.json()['groupDiscountNGN'], 0)
        self.assertEqual(res3.json()['finalTotalNGN'], 225000)

        # 4 guests: 2% group discount applied
        payload_4 = {
            'fullName': 'Group of Four',
            'email': 'group4@example.com',
            'phone': '+2348012345004',
            'guestCount': 4,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res4 = self.client.post('/api/bookings/', data=payload_4, format='json')
        subtotal_4 = 4 * 75000  # 300,000
        discount_4 = round(subtotal_4 * 0.02)  # 6,000
        self.assertEqual(res4.json()['subtotalNGN'], 300000)
        self.assertEqual(res4.json()['groupDiscountPct'], 2)
        self.assertEqual(res4.json()['groupDiscountNGN'], discount_4)
        self.assertEqual(res4.json()['finalTotalNGN'], subtotal_4 - discount_4)

        # 8 guests: 2% group discount applied
        payload_8 = {
            'fullName': 'Group of Eight',
            'email': 'group8@example.com',
            'phone': '+2348012345008',
            'guestCount': 8,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res8 = self.client.post('/api/bookings/', data=payload_8, format='json')
        subtotal_8 = 8 * 75000  # 600,000
        discount_8 = round(subtotal_8 * 0.02)  # 12,000
        self.assertEqual(res8.json()['groupDiscountPct'], 2)
        self.assertEqual(res8.json()['groupDiscountNGN'], discount_8)
        self.assertEqual(res8.json()['finalTotalNGN'], subtotal_8 - discount_8)

    def test_stacked_group_and_promo_discount_audit_trail(self):
        # 4 guests (2% group) + EARLYBIRD5 (2% promo)
        self.promo_5.discount_pct = 2
        self.promo_5.save()
        payload = {
            'fullName': 'Audit Test Group',
            'email': 'audit@example.com',
            'phone': '+2348012345678',
            'guestCount': 4,
            'selectedPackages': ['abeokuta-heritage'],
            'promoCode': 'EARLYBIRD5',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()

        # Math breakdown:
        # Subtotal: 4 * 75,000 = 300,000
        # Group discount (2%): 6,000
        # Remainder: 294,000
        # Promo discount (2% of 294,000): 5,880
        # Final Total: 300,000 - 6,000 - 5,880 = 288,120
        self.assertEqual(data['subtotalNGN'], 300000)
        self.assertEqual(data['groupDiscountPct'], 2)
        self.assertEqual(data['groupDiscountNGN'], 6000)
        self.assertEqual(data['promoCode'], 'EARLYBIRD5')
        self.assertEqual(data['promoDiscountPct'], 2)
        self.assertEqual(data['promoDiscountNGN'], 5880)
        self.assertEqual(data['finalTotalNGN'], 288120)

        # Confirm persisted record in DB
        booking = Booking.objects.get(booking_ref=data['bookingRef'])
        self.assertEqual(booking.subtotal_ngn, 300000)
        self.assertEqual(booking.group_discount_pct, 2)
        self.assertEqual(booking.group_discount_ngn, 6000)
        self.assertEqual(booking.promo_code, 'EARLYBIRD5')
        self.assertEqual(booking.promo_discount_pct, 2)
        self.assertEqual(booking.promo_discount_ngn, 5880)
        self.assertEqual(booking.final_total_ngn, 288120)

    def test_booking_with_uuid_package_identifier(self):
        pkg_uuid = str(self.abeokuta.id)
        payload = {
            'fullName': 'UUID Test User',
            'email': 'uuid@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': [pkg_uuid],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['subtotalNGN'], 75000)

    def test_payment_method_options(self):
        for idx, method in enumerate(['paystack', 'flutterwave', 'whatsapp', 'card', 'transfer']):
            payload = {
                'fullName': f'User {method}',
                'email': f'{method}@example.com',
                'phone': f'+234801234560{idx}',
                'guestCount': 1,
                'selectedPackages': ['abeokuta-heritage'],
                'paymentMethod': method,
            }
            res = self.client.post('/api/bookings/', data=payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            self.assertEqual(res.json()['paymentMethod'], method)

    def test_booking_multi_currency_conversion(self):
        # USD Booking: 75,000 NGN / 1600 = 46.88 USD
        payload_usd = {
            'fullName': 'American Tourist',
            'email': 'us@example.com',
            'phone': '+12025550188',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'currency': 'USD',
            'paymentMethod': 'flutterwave',
        }
        res_usd = self.client.post('/api/bookings/', data=payload_usd, format='json')
        self.assertEqual(res_usd.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(res_usd.json()['convertedTotal']), 46.88)
        self.assertEqual(res_usd.json()['currency'], 'USD')

        # GBP Booking: 75,000 NGN / 2050 = 36.59 GBP
        payload_gbp = {
            'fullName': 'British Tourist',
            'email': 'uk@example.co.uk',
            'phone': '+447123456789',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'currency': 'GBP',
            'paymentMethod': 'flutterwave',
        }
        res_gbp = self.client.post('/api/bookings/', data=payload_gbp, format='json')
        self.assertEqual(res_gbp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(res_gbp.json()['convertedTotal']), 36.59)
        self.assertEqual(res_gbp.json()['currency'], 'GBP')

    def test_special_requests_stored_and_returned(self):
        payload = {
            'fullName': 'Dietary Guest',
            'email': 'diet@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'specialRequests': 'Vegetarian meal only, wheelchair assistance requested.',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        ref = res.json()['bookingRef']
        booking = Booking.objects.get(booking_ref=ref)
        self.assertEqual(booking.special_requests, 'Vegetarian meal only, wheelchair assistance requested.')
