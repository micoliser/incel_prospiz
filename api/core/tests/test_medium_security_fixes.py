import hmac
import hashlib
import json
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.conf import settings
from rest_framework import status
from rest_framework.test import APIClient
from core.models import Booking, Package
from core.payments import confirm_booking_payment


@override_settings(
    PAYSTACK_SECRET_KEY='sk_test_fake_paystack_key',
    FLUTTERWAVE_SECRET_KEY='FLWSECK_TEST-fake-key-X',
    FLUTTERWAVE_SECRET_HASH='test_secret_hash',
)
class MediumSecurityFixesTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.package = Package.objects.create(
            name="Test Excursion",
            slug="test-excursion-med",
            price_ngn=50000,
            max_seats=20,
            seats_booked=5,
            is_active=True,
        )
        self.booking = Booking.objects.create(
            booking_ref="DL-2026-MED001",
            full_name="Medium Security Test",
            email="medium-test@example.com",
            phone="08012345678",
            guest_count=2,
            currency="NGN",
            final_total_ngn=100000,
            payment_status="pending",
            payment_method="paystack",
            selected_packages=[str(self.package.id)],
        )

    def test_medium_01_security_headers_configured(self):
        """MEDIUM-01: Verify required security headers are set in settings."""
        self.assertTrue(getattr(settings, 'SECURE_CONTENT_TYPE_NOSNIFF', False))
        self.assertEqual(getattr(settings, 'SECURE_REFERRER_POLICY', ''), 'strict-origin-when-cross-origin')
        self.assertEqual(getattr(settings, 'X_FRAME_OPTIONS', ''), 'DENY')

    def test_medium_02_paystack_webhook_unknown_booking_returns_404(self):
        """MEDIUM-02: Paystack webhook with valid signature but unknown booking returns 404."""
        payload = {
            'event': 'charge.success',
            'data': {
                'reference': 'DL-2026-NONEXISTENT',
                'amount': 10000000,
                'status': 'success',
            }
        }
        body_bytes = json.dumps(payload).encode('utf-8')
        secret = settings.PAYSTACK_SECRET_KEY
        signature = hmac.new(secret.encode('utf-8'), body_bytes, hashlib.sha512).hexdigest()

        res = self.client.post(
            '/api/payments/paystack/webhook/',
            data=body_bytes,
            content_type='application/json',
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found", res.data.get('error', '').lower())

    def test_medium_02_flutterwave_webhook_unknown_booking_returns_404(self):
        """MEDIUM-02: Flutterwave webhook with valid hash but unknown booking returns 404."""
        payload = {
            'event': 'charge.completed',
            'status': 'successful',
            'txRef': 'DL-2026-UNKNOWNREF',
            'id': 999999,
        }
        res = self.client.post(
            '/api/payments/flutterwave/webhook/',
            data=payload,
            format='json',
            HTTP_VERIF_HASH=settings.FLUTTERWAVE_SECRET_HASH,
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("not found", res.data.get('error', '').lower())

    @patch('core.emails.services.booking_emails.send_booking_confirmation_emails')
    def test_medium_03_confirm_booking_payment_idempotency(self, mock_send_email):
        """MEDIUM-03: confirm_booking_payment is strictly idempotent and sends emails only once."""
        # First confirmation
        first_call = confirm_booking_payment(self.booking, payment_reference="PAY-123456")
        self.assertTrue(first_call)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.payment_status, 'paid')
        self.assertEqual(self.booking.payment_reference, 'PAY-123456')
        self.assertEqual(mock_send_email.call_count, 1)

        # Duplicate concurrent / second confirmation
        second_call = confirm_booking_payment(self.booking, payment_reference="PAY-123456-DUP")
        self.assertFalse(second_call)
        # Email must NOT have been dispatched a second time
        self.assertEqual(mock_send_email.call_count, 1)

    @override_settings(EMAIL_ENABLED=True)
    def test_medium_06_async_email_closes_db_connection(self):
        """MEDIUM-06: Async email worker calls connection.close() in finally block."""
        import threading
        from core.emails.services.base import BaseEmailService
        done_event = threading.Event()

        def fake_close():
            done_event.set()

        with patch.object(BaseEmailService, 'close_connection', side_effect=fake_close), \
             patch.object(BaseEmailService, '_send_sync', return_value=True):
            result = BaseEmailService.send_email(
                subject="Test Subject",
                recipients=["test@example.com"],
                template_name="emails/booking_confirmation.html",
                context={},
                is_async=True,
            )
            self.assertTrue(result)
            called = done_event.wait(timeout=2.0)
            self.assertTrue(called, "connection.close() was not called within timeout")

    def test_medium_08_cancel_and_reallocate_greatest_never_negative(self):
        """MEDIUM-08: cancel_and_reallocate never sets seats_booked below 0 even with large guest counts."""
        self.package.seats_booked = 1
        self.package.save()

        # Booking had guest_count = 2 (more than package.seats_booked = 1)
        cancelled = self.booking.cancel_and_reallocate()
        self.assertTrue(cancelled)

        self.package.refresh_from_db()
        self.assertEqual(self.package.seats_booked, 0)
        self.assertGreaterEqual(self.package.seats_booked, 0)
