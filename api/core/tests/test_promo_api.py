from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import PromoCode


class PromoCodeAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.active_promo = PromoCode.objects.create(
            code='EARLYBIRD5',
            discount_pct=5,
            is_active=True,
        )
        self.vip_promo = PromoCode.objects.create(
            code='VIPLAGOS15',
            discount_pct=15,
            is_active=True,
        )
        self.expired_promo = PromoCode.objects.create(
            code='EXPIRED50',
            discount_pct=50,
            is_active=False,
        )

    def test_validate_active_promo_success(self):
        res = self.client.post('/api/promo/validate/', {'code': 'EARLYBIRD5'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(data['valid'])
        self.assertEqual(data['code'], 'EARLYBIRD5')
        self.assertEqual(data['discountPct'], 5)
        self.assertEqual(data['id'], str(self.active_promo.id))

    def test_validate_promo_case_insensitive(self):
        # lowercase
        res = self.client.post('/api/promo/validate/', {'code': 'earlybird5'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()['valid'])

        # mixed case
        res2 = self.client.post('/api/promo/validate/', {'code': 'VipLagos15'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.json()['discountPct'], 15)

    def test_validate_promo_trims_whitespace(self):
        res = self.client.post('/api/promo/validate/', {'code': '  EARLYBIRD5  '}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()['valid'])

    def test_validate_inactive_promo_rejected(self):
        res = self.client.post('/api/promo/validate/', {'code': 'EXPIRED50'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        data = res.json()
        self.assertFalse(data['valid'])
        self.assertIn('Invalid or expired promo code', data['error'])

    def test_validate_nonexistent_promo_rejected(self):
        res = self.client.post('/api/promo/validate/', {'code': 'NOTAREALCODE'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        data = res.json()
        self.assertFalse(data['valid'])
        self.assertIn('Invalid or expired promo code', data['error'])

    def test_validate_empty_code_rejected(self):
        res = self.client.post('/api/promo/validate/', {'code': ''}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.json()['valid'])

    def test_validate_missing_code_field_rejected(self):
        res = self.client.post('/api/promo/validate/', {}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.json()['valid'])

    def test_get_method_not_allowed(self):
        res = self.client.get('/api/promo/validate/')
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
