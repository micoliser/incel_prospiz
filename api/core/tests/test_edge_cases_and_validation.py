from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, PromoCode, Booking


class EdgeCasesAndValidationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()

        self.excursion = Package.objects.create(
            slug='abeokuta-heritage',
            name='Abeokuta Heritage & Scenic Rail',
            category='excursion',
            price_ngn=75000,
            max_seats=100,
            seats_booked=10,
            is_active=True,
        )

        self.active_promo = PromoCode.objects.create(
            code='VALID5',
            discount_pct=5,
            is_active=True,
        )

        self.inactive_promo = PromoCode.objects.create(
            code='INACTIVE5',
            discount_pct=5,
            is_active=False,
        )

    def tearDown(self):
        cache.clear()

    def test_missing_full_name_rejected(self):
        payload = {
            'email': 'user@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('fullName', res.json())

    def test_missing_email_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.json())

    def test_invalid_email_format_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'not-an-email-address',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.json())

    def test_missing_phone_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', res.json())

    def test_missing_guest_count_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('guestCount', res.json())

    def test_zero_guest_count_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': 0,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('guestCount', res.json())

    def test_negative_guest_count_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': -3,
            'selectedPackages': ['abeokuta-heritage'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('guestCount', res.json())

    def test_empty_selected_packages_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': [],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('selectedPackages', res.json())

    def test_nonexistent_selected_packages_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['non-existent-excursion-xyz'],
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('selectedPackages', res.json())

    def test_invalid_payment_method_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'paymentMethod': 'crypto_bitcoin',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('paymentMethod', res.json())

    def test_invalid_promo_code_in_booking_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'promoCode': 'FAKECODE99',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('promoCode', res.json())

    def test_inactive_promo_code_in_booking_rejected(self):
        payload = {
            'fullName': 'Adebayo Salami',
            'email': 'adebayo@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'promoCode': 'INACTIVE5',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('promoCode', res.json())

    def test_client_cannot_tamper_with_subtotal_or_final_price(self):
        # Client tries to pass subtotalNGN=1 and finalTotalNGN=1
        payload = {
            'fullName': 'Malicious Actor',
            'email': 'hacker@example.com',
            'phone': '+2348012345678',
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'subtotalNGN': 1,
            'finalTotalNGN': 1,
            'groupDiscountNGN': 99999,
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        # Must calculate true price from DB (75,000), not client injected values
        self.assertEqual(data['subtotalNGN'], 75000)
        self.assertEqual(data['finalTotalNGN'], 75000)
        self.assertEqual(data['groupDiscountNGN'], 0)

    def test_unicode_and_special_character_inputs(self):
        payload = {
            'fullName': "Chukwuma O'Connor-Smith",
            'email': 'chukwuma@example.com',
            'phone': '+234 801-234-5678',
            'country': "Côte d'Ivoire",
            'guestCount': 1,
            'selectedPackages': ['abeokuta-heritage'],
            'specialRequests': 'Vegetarian food 🌱 & wheel-chair access ♿!',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['fullName'], "Chukwuma O'Connor-Smith")
        self.assertEqual(res.json()['country'], "Côte d'Ivoire")
