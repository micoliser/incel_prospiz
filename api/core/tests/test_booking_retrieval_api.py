from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Booking


class BookingRetrievalAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.booking = Booking.objects.create(
            full_name='Kolawole Ajayi',
            email='kola@example.com',
            phone='+2348055667788',
            country='Nigeria',
            guest_count=4,
            is_foreigner=False,
            selected_packages=['abeokuta-heritage'],
            subtotal_ngn=300000,
            group_discount_pct=5,
            group_discount_ngn=15000,
            promo_code='EARLYBIRD5',
            promo_discount_pct=5,
            promo_discount_ngn=14250,
            final_total_ngn=270750,
            currency='NGN',
            payment_method='card',
            payment_status='pending',
            special_requests='Window seats on bus please.',
        )

    def test_retrieve_booking_success(self):
        ref = self.booking.booking_ref
        res = self.client.get(f'/api/bookings/{ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertEqual(data['bookingRef'], ref)
        self.assertEqual(data['fullName'], 'Kolawole Ajayi')
        self.assertEqual(data['email'], 'kola@example.com')
        self.assertEqual(data['phone'], '+2348055667788')
        self.assertEqual(data['country'], 'Nigeria')
        self.assertEqual(data['guestCount'], 4)
        self.assertFalse(data['isForeigner'])
        self.assertEqual(data['selectedPackages'], ['abeokuta-heritage'])
        self.assertEqual(data['subtotalNGN'], 300000)
        self.assertEqual(data['groupDiscountPct'], 5)
        self.assertEqual(data['groupDiscountNGN'], 15000)
        self.assertEqual(data['promoCode'], 'EARLYBIRD5')
        self.assertEqual(data['promoDiscountPct'], 5)
        self.assertEqual(data['promoDiscountNGN'], 14250)
        self.assertEqual(data['finalTotalNGN'], 270750)
        self.assertEqual(data['paymentMethod'], 'card')
        self.assertEqual(data['paymentStatus'], 'pending')
        self.assertEqual(data['specialRequests'], 'Window seats on bus please.')
        self.assertIn('packageDetails', data)
        self.assertIn('createdAt', data)

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
