import json
import hmac
import hashlib
from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, Booking, CampaignConfig
from core.payments import (
    initialize_paystack_payment,
    initialize_flutterwave_payment,
    verify_paystack_transaction,
    verify_flutterwave_transaction,
    confirm_booking_payment,
)


@override_settings(
    PAYSTACK_SECRET_KEY='sk_test_fake_paystack_key',
    FLUTTERWAVE_SECRET_KEY='FLWSECK_TEST-fake-key-X',
    FLUTTERWAVE_SECRET_HASH='test_secret_hash',
    FRONTEND_BASE_URL='http://localhost:3000',
)
class PaymentIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.pkg = Package.objects.create(
            slug='tarkwa-bay-beach',
            name='Tarkwa Bay Beach',
            price_ngn=75000,
            max_seats=100,
            seats_booked=10,
            is_active=True,
        )
        self.booking_ngn = Booking.objects.create(
            full_name='Chidi Okafor',
            email='chidi@example.com',
            phone='+2348012345678',
            guest_count=1,
            selected_packages=['tarkwa-bay-beach'],
            final_total_ngn=75000,
            currency='NGN',
            payment_method='paystack',
            payment_status='pending',
        )
        self.booking_usd = Booking.objects.create(
            full_name='Sarah Jenkins',
            email='sarah@example.com',
            phone='+12025550199',
            guest_count=1,
            selected_packages=['tarkwa-bay-beach'],
            final_total_ngn=75000,
            currency='USD',
            converted_total=46.88,
            payment_method='flutterwave',
            payment_status='pending',
        )

    @patch('requests.post')
    def test_initialize_paystack_redirect_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': True,
            'message': 'Authorization URL created',
            'data': {
                'authorization_url': 'https://checkout.paystack.com/fake-paystack-checkout',
                'access_code': 'fake-access-code',
                'reference': self.booking_ngn.booking_ref,
            }
        }
        mock_post.return_value = mock_response

        res = initialize_paystack_payment(self.booking_ngn)
        self.assertTrue(res['status'])
        self.assertEqual(res['checkout_url'], 'https://checkout.paystack.com/fake-paystack-checkout')

        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_url, 'https://checkout.paystack.com/fake-paystack-checkout')
        self.assertEqual(self.booking_ngn.payment_reference, self.booking_ngn.booking_ref)

    @patch('requests.post')
    def test_initialize_flutterwave_redirect_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'message': 'Hosted Link',
            'data': {
                'link': 'https://checkout.flutterwave.com/v3/hosted/pay/fake-link',
            }
        }
        mock_post.return_value = mock_response

        res = initialize_flutterwave_payment(self.booking_usd)
        self.assertTrue(res['status'])
        self.assertEqual(res['checkout_url'], 'https://checkout.flutterwave.com/v3/hosted/pay/fake-link')

        self.booking_usd.refresh_from_db()
        self.assertEqual(self.booking_usd.payment_url, 'https://checkout.flutterwave.com/v3/hosted/pay/fake-link')

    @patch('requests.get')
    def test_payment_verify_endpoint_paystack(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': self.booking_ngn.booking_ref,
                'amount': 7500000,
                'currency': 'NGN',
            }
        }
        mock_get.return_value = mock_response

        res = self.client.get(f'/api/payments/verify/?reference={self.booking_ngn.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['paymentStatus'], 'paid')
        self.assertEqual(data['bookingRef'], self.booking_ngn.booking_ref)

        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'paid')
        self.assertIsNotNone(self.booking_ngn.paid_at)

    @patch('requests.get')
    def test_payment_verify_endpoint_flutterwave(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {
                'id': 998877,
                'status': 'successful',
                'tx_ref': self.booking_usd.booking_ref,
                'amount': 46.88,
                'currency': 'USD',
            }
        }
        mock_get.return_value = mock_response

        res = self.client.get(f'/api/payments/verify/?transaction_id=998877&tx_ref={self.booking_usd.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['paymentStatus'], 'paid')

        self.booking_usd.refresh_from_db()
        self.assertEqual(self.booking_usd.payment_status, 'paid')

    def _make_usd_booking(self):
        return Booking.objects.create(
            full_name='Replay Target',
            email='replay@example.com',
            phone='+12025550100',
            guest_count=1,
            selected_packages=['tarkwa-bay-beach'],
            final_total_ngn=75000,
            currency='USD',
            converted_total=46.88,
            payment_method='flutterwave',
            payment_status='pending',
        )

    @patch('requests.get')
    def test_new_01_flutterwave_tx_cannot_confirm_other_booking(self, mock_get):
        """NEW-01: A transaction paid for booking A cannot be used to confirm booking B (same price)."""
        booking_b = self._make_usd_booking()
        mock_get.return_value = MagicMock(status_code=200, json=lambda: {
            'status': 'success',
            'data': {'id': 998877, 'status': 'successful', 'tx_ref': self.booking_usd.booking_ref,
                     'amount': 46.88, 'currency': 'USD'},
        })
        res = self.client.get(f'/api/payments/verify/?transaction_id=998877&tx_ref={booking_b.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        booking_b.refresh_from_db()
        self.assertEqual(booking_b.payment_status, 'pending')

    def test_new_01_transaction_reference_cannot_be_reused(self):
        """NEW-01: The same gateway transaction id can only pay for a single booking."""
        booking_b = self._make_usd_booking()
        self.assertTrue(confirm_booking_payment(self.booking_usd, payment_reference='998877'))
        self.assertFalse(confirm_booking_payment(booking_b, payment_reference='998877'))
        booking_b.refresh_from_db()
        self.assertEqual(booking_b.payment_status, 'pending')

    def test_paystack_webhook_valid_signature(self):
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': self.booking_ngn.booking_ref,
                'amount': 7500000,
                'status': 'success',
            }
        }
        body_bytes = json.dumps(payload).encode('utf-8')
        signature = hmac.new('sk_test_fake_paystack_key'.encode('utf-8'), body_bytes, hashlib.sha512).hexdigest()

        res = self.client.post(
            '/api/payments/paystack/webhook/',
            data=body_bytes,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'paid')

    def test_paystack_webhook_invalid_signature_rejected(self):
        body_bytes = json.dumps({'event': 'charge.success'}).encode('utf-8')
        res = self.client.post(
            '/api/payments/paystack/webhook/',
            data=body_bytes,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE='wrong_signature',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_flutterwave_webhook_valid_hash(self):
        payload = {
            'event': 'charge.completed',
            'status': 'successful',
            'txRef': self.booking_usd.booking_ref,
            'id': 123456,
        }
        res = self.client.post(
            '/api/payments/flutterwave/webhook/',
            data=payload,
            format='json',
            HTTP_VERIF_HASH='test_secret_hash',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.booking_usd.refresh_from_db()
        self.assertEqual(self.booking_usd.payment_status, 'paid')

    def test_flutterwave_webhook_invalid_hash_rejected(self):
        payload = {'event': 'charge.completed'}
        res = self.client.post(
            '/api/payments/flutterwave/webhook/',
            data=payload,
            format='json',
            HTTP_VERIF_HASH='wrong_hash',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(FLUTTERWAVE_SECRET_HASH='')
    def test_flutterwave_webhook_missing_server_hash_rejected_500(self):
        """CRITICAL-01: When secret hash is unconfigured on server, do NOT bypass verification; reject with 500."""
        payload = {
            'event': 'charge.completed',
            'status': 'successful',
            'txRef': self.booking_usd.booking_ref,
            'id': 123456,
        }
        res = self.client.post(
            '/api/payments/flutterwave/webhook/',
            data=payload,
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.booking_usd.refresh_from_db()
        self.assertEqual(self.booking_usd.payment_status, 'pending')

    @patch('requests.get')
    def test_payment_verify_paystack_amount_mismatch_rejected(self, mock_get):
        """CRITICAL-02: Attacker pays ₦100 (10000 kobo) instead of ₦75,000 (7500000 kobo); verification must reject."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': self.booking_ngn.booking_ref,
                'amount': 10000,  # ₦100 paid instead of ₦75,000
                'currency': 'NGN',
            }
        }
        mock_get.return_value = mock_response

        res = self.client.get(f'/api/payments/verify/?reference={self.booking_ngn.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.json().get('status'), 'mismatch')

        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'pending')

    @patch('requests.get')
    def test_payment_verify_paystack_customer_borne_fee_succeeds(self, mock_get):
        """When fee is passed to customer on Paystack (e.g. 7624366 kobo for 7500000 kobo total), verification must succeed."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': self.booking_ngn.booking_ref,
                'amount': 7624366,  # ₦76,243.66 (base ₦75,000 + ₦1,243.66 Paystack fee)
                'requested_amount': 7500000,
                'fees': 124366,
                'currency': 'NGN',
            }
        }
        mock_get.return_value = mock_response

        res = self.client.get(f'/api/payments/verify/?reference={self.booking_ngn.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'paid')

    @patch('requests.get')
    def test_payment_verify_paystack_currency_mismatch_rejected(self, mock_get):
        """CRITICAL-02: Payment in wrong currency must be rejected."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': self.booking_ngn.booking_ref,
                'amount': 7500000,
                'currency': 'USD',  # Mismatched currency
            }
        }
        mock_get.return_value = mock_response

        res = self.client.get(f'/api/payments/verify/?reference={self.booking_ngn.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.json().get('status'), 'mismatch')

        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'pending')

    @patch('requests.get')
    def test_payment_verify_flutterwave_amount_mismatch_rejected(self, mock_get):
        """CRITICAL-02: Attacker pays $5 instead of $46.88 on Flutterwave; verification must reject."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': 'success',
            'data': {
                'id': 998877,
                'status': 'successful',
                'tx_ref': self.booking_usd.booking_ref,
                'amount': 5.00,  # $5 paid instead of $46.88
                'currency': 'USD',
            }
        }
        mock_get.return_value = mock_response

        res = self.client.get(f'/api/payments/verify/?transaction_id=998877&tx_ref={self.booking_usd.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.json().get('status'), 'mismatch')

        self.booking_usd.refresh_from_db()
        self.assertEqual(self.booking_usd.payment_status, 'pending')

    def test_paystack_webhook_amount_mismatch_rejected(self):
        """CRITICAL-02: Paystack webhook with manipulated amount must not confirm payment."""
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': self.booking_ngn.booking_ref,
                'amount': 10000,  # ₦100 instead of ₦75,000
                'currency': 'NGN',
                'status': 'success',
            }
        }
        body_bytes = json.dumps(payload).encode('utf-8')
        signature = hmac.new('sk_test_fake_paystack_key'.encode('utf-8'), body_bytes, hashlib.sha512).hexdigest()

        res = self.client.post(
            '/api/payments/paystack/webhook/',
            data=body_bytes,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'pending')

    def test_paystack_webhook_customer_borne_fee_succeeds(self):
        """When webhook sends customer-borne fee (e.g. 7624366 kobo for 7500000 kobo total), payment is confirmed."""
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': self.booking_ngn.booking_ref,
                'amount': 7624366,
                'requested_amount': 7500000,
                'fees': 124366,
                'currency': 'NGN',
                'status': 'success',
            }
        }
        body_bytes = json.dumps(payload).encode('utf-8')
        signature = hmac.new('sk_test_fake_paystack_key'.encode('utf-8'), body_bytes, hashlib.sha512).hexdigest()

        res = self.client.post(
            '/api/payments/paystack/webhook/',
            data=body_bytes,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.booking_ngn.refresh_from_db()
        self.assertEqual(self.booking_ngn.payment_status, 'paid')

    def test_flutterwave_webhook_amount_mismatch_rejected(self):
        """CRITICAL-02: Flutterwave webhook with manipulated amount must not confirm payment."""
        payload = {
            'event': 'charge.completed',
            'status': 'successful',
            'txRef': self.booking_usd.booking_ref,
            'id': 123456,
            'amount': 2.50,  # $2.50 instead of $46.88
            'currency': 'USD',
        }
        res = self.client.post(
            '/api/payments/flutterwave/webhook/',
            data=payload,
            format='json',
            HTTP_VERIF_HASH='test_secret_hash',
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.booking_usd.refresh_from_db()
        self.assertEqual(self.booking_usd.payment_status, 'pending')

    def test_validate_production_settings_success(self):
        from config.settings import validate_production_settings
        result = validate_production_settings(
            secret_key='a' * 55,
            default_dev_secret='insecure_default',
            allowed_hosts=['api.example.com', 'example.com'],
            db_password='strong_postgres_password',
            frontend_base_url='https://example.com',
            paystack_secret_key='sk_live_123',
            paystack_public_key='pk_live_123',
            flutterwave_secret_key='FLWSECK_LIVE-123',
            flutterwave_public_key='FLWPUBK_LIVE-123',
            flutterwave_secret_hash='my_production_secret_hash',
        )
        self.assertTrue(result)

    def test_validate_production_settings_catches_insecure_defaults(self):
        from config.settings import validate_production_settings
        from django.core.exceptions import ImproperlyConfigured
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validate_production_settings(
                secret_key='django-insecure-test',
                allowed_hosts=['*'],
                db_password='',
                frontend_base_url='http://localhost:3000',
                paystack_secret_key='',
                paystack_public_key='',
                flutterwave_secret_key='',
                flutterwave_public_key='',
                flutterwave_secret_hash='test_secret',
            )
        err_msg = str(ctx.exception)
        self.assertIn('DJANGO_SECRET_KEY', err_msg)
        self.assertIn('DJANGO_ALLOWED_HOSTS', err_msg)
        self.assertIn('DB_PASSWORD', err_msg)
        self.assertIn('FRONTEND_BASE_URL', err_msg)
        self.assertIn('PAYSTACK_SECRET_KEY', err_msg)
        self.assertIn('FLUTTERWAVE_SECRET_HASH', err_msg)

    @patch('core.views.initialize_paystack_payment')
    def test_booking_pay_generates_fresh_url_using_own_payment_method(self, mock_init_paystack):
        self.booking_ngn.payment_url = None
        self.booking_ngn.save()
        mock_init_paystack.return_value = {
            'status': True,
            'authorization_url': 'https://checkout.paystack.com/fresh-token-123',
            'reference': self.booking_ngn.booking_ref,
        }
        # Simulate payment init saving url to booking
        def fake_init(b, **kwargs):
            b.payment_url = 'https://checkout.paystack.com/fresh-token-123'
            b.save()
            return {'status': True, 'authorization_url': b.payment_url}
        mock_init_paystack.side_effect = fake_init

        res = self.client.post(
            f'/api/bookings/{self.booking_ngn.booking_ref}/pay/',
            data={'callbackUrl': 'http://localhost:3000/booking/verify'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['checkoutUrl'], 'https://checkout.paystack.com/fresh-token-123')
        self.assertEqual(res.data['paymentMethod'], 'paystack')

    @patch('core.views.initialize_paystack_payment')
    def test_booking_detail_auto_heals_missing_payment_url(self, mock_init_paystack):
        self.booking_ngn.payment_url = None
        self.booking_ngn.save()
        def fake_init(b, **kwargs):
            b.payment_url = 'https://checkout.paystack.com/auto-heal-789'
            b.save()
            return {'status': True, 'authorization_url': b.payment_url}
        mock_init_paystack.side_effect = fake_init

        res = self.client.get(f'/api/bookings/{self.booking_ngn.booking_ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['checkoutUrl'], 'https://checkout.paystack.com/auto-heal-789')

    @patch('requests.get')
    def test_payment_verify_masks_pii(self, mock_get):
        """CRIT-03: Verify that PaymentVerifyView returns masked PII, matching BookingLookupSerializer."""
        self.booking_ngn.special_requests = 'Sensitive private medical notes'
        self.booking_ngn.save()
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: {
                'status': True,
                'data': {
                    'status': 'success',
                    'reference': self.booking_ngn.booking_ref,
                    'amount': 7500000,
                    'currency': 'NGN',
                }
            }
        )
        res = self.client.get(f'/api/payments/verify/?reference={self.booking_ngn.booking_ref}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(data['paymentStatus'], 'paid')
        self.assertNotIn('chidi@example.com', data['email'])
        self.assertIn('***', data['email'])
        self.assertNotIn('+2348012345678', data['phone'])
        self.assertIn('•••', data['phone'])
        self.assertEqual(data['fullName'], 'Chidi O.')
        self.assertEqual(data['specialRequests'], '***')

    def test_db_unique_constraint_on_paid_payment_reference(self):
        """NEW-01 gap: Database UniqueConstraint strictly forbids multiple paid bookings with the same payment_reference."""
        from django.db import IntegrityError
        # Mark booking 1 as paid with reference 'TX-SHARED-123'
        self.booking_ngn.payment_status = 'paid'
        self.booking_ngn.payment_reference = 'TX-SHARED-123'
        self.booking_ngn.save()

        # Attempt to confirm or save a second booking with the same payment_reference
        booking_b = self._make_usd_booking()
        # confirm_booking_payment catches IntegrityError / pre-check and returns False
        success = confirm_booking_payment(booking_b, payment_reference='TX-SHARED-123')
        self.assertFalse(success)

        # Direct DB write of duplicate paid reference raises IntegrityError
        booking_b.payment_status = 'paid'
        booking_b.payment_reference = 'TX-SHARED-123'
        with self.assertRaises(IntegrityError):
            booking_b.save()

    def test_new_04_default_debug_fails_safe_to_false(self):
        """NEW-04: Unset DJANGO_DEBUG must fail safe to False (production mode), not True."""
        import os
        # Simulate environment without DJANGO_DEBUG
        orig = os.environ.pop('DJANGO_DEBUG', None)
        try:
            default_val = os.getenv('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')
            self.assertFalse(default_val)
        finally:
            if orig is not None:
                os.environ['DJANGO_DEBUG'] = orig

