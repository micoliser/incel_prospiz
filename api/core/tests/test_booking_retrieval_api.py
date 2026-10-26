from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Booking, BOOKING_REF_ALPHABET


class BookingRetrievalAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()
        self.booking = Booking.objects.create(
            full_name='Kolawole Ajayi',
            email='kola@example.com',
            phone='+2348055667788',
            country='Nigeria',
            guest_count=4,
            is_foreigner=False,
            selected_packages=['abeokuta-heritage'],
            subtotal_ngn=300000,
            group_discount_pct=2,
            group_discount_ngn=6000,
            promo_code='EARLYBIRD5',
            promo_discount_pct=2,
            promo_discount_ngn=5880,
            final_total_ngn=288120,
            currency='NGN',
            payment_method='card',
            payment_status='pending',
            special_requests='Window seats on bus please.',
        )

    def tearDown(self):
        cache.clear()

    def test_retrieve_booking_success(self):
        ref = self.booking.booking_ref
        res = self.client.get(f'/api/bookings/{ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertEqual(data['bookingRef'], ref)
        self.assertEqual(data['fullName'], 'Kolawole A.')
        self.assertEqual(data['email'], 'k***a@example.com')
        self.assertEqual(data['phone'], '+234 ••• ••• 7788')
        self.assertEqual(data['country'], 'Nigeria')
        self.assertEqual(data['guestCount'], 4)
        self.assertFalse(data['isForeigner'])
        self.assertEqual(data['selectedPackages'], ['abeokuta-heritage'])
        self.assertEqual(data['subtotalNGN'], 300000)
        self.assertEqual(data['groupDiscountPct'], 2)
        self.assertEqual(data['groupDiscountNGN'], 6000)
        self.assertEqual(data['promoCode'], 'EARLYBIRD5')
        self.assertEqual(data['promoDiscountPct'], 2)
        self.assertEqual(data['promoDiscountNGN'], 5880)
        self.assertEqual(data['finalTotalNGN'], 288120)
        self.assertEqual(data['paymentMethod'], 'card')
        self.assertEqual(data['paymentStatus'], 'pending')
        self.assertEqual(data['specialRequests'], '***')
        self.assertIn('packageDetails', data)
        self.assertIn('createdAt', data)

    def test_booking_detail_masks_pii(self):
        """Verify that public booking lookup never returns unmasked personal email, phone or full name"""
        res = self.client.get(f'/api/bookings/{self.booking.booking_ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertNotIn('kola@example.com', data['email'])
        self.assertIn('***', data['email'])
        self.assertIn('example.com', data['email'])
        self.assertNotIn('+2348055667788', data['phone'])
        self.assertIn('•••', data['phone'])
        self.assertIn('7788', data['phone'])
        self.assertEqual(data['fullName'], 'Kolawole A.')

    def test_booking_high_entropy_reference(self):
        """Verify that newly generated bookings use 6-character high entropy references"""
        new_booking = Booking.objects.create(
            full_name='Amina Bello',
            email='amina@example.com',
            phone='+2348011223344',
            guest_count=1,
            selected_packages=['lagos-vip'],
            subtotal_ngn=50000,
            final_total_ngn=50000,
        )
        ref = new_booking.booking_ref
        self.assertTrue(ref.startswith('DL-2026-'))
        suffix = ref.replace('DL-2026-', '')
        self.assertEqual(len(suffix), 6)
        for char in suffix:
            self.assertIn(char, BOOKING_REF_ALPHABET)

    def test_booking_lookup_rate_limiting(self):
        """Verify that excessive requests to the lookup endpoint get rate limited with HTTP 429"""
        cache.clear()
        ref = self.booking.booking_ref
        for i in range(15):
            res = self.client.get(f'/api/bookings/{ref}/')
            self.assertEqual(res.status_code, status.HTTP_200_OK, f"Request {i+1} failed")

        # 16th request within the minute must be throttled
        res_throttled = self.client.get(f'/api/bookings/{ref}/')
        self.assertEqual(res_throttled.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        cache.clear()

    def test_retrieve_booking_case_insensitive(self):
        ref = self.booking.booking_ref.lower()
        res = self.client.get(f'/api/bookings/{ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['bookingRef'], self.booking.booking_ref)

    def test_retrieve_booking_with_whitespace(self):
        ref = f"  {self.booking.booking_ref}  "
        res = self.client.get(f'/api/bookings/{ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['bookingRef'], self.booking.booking_ref)

    def test_retrieve_booking_not_found(self):
        res = self.client.get('/api/bookings/DL-2026-999999/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_booking_invalid_slug_format(self):
        res = self.client.get('/api/bookings/random-string-not-a-ref/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

