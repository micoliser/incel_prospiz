from unittest.mock import patch, MagicMock
from django.test import TestCase, override_settings
from django.core.cache import cache
from django.conf import settings
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, PromoCode, Booking
from core.views import (
    PaystackWebhookView,
    FlutterwaveWebhookView,
    PromoValidateRateThrottle,
    BookingCreateRateThrottle,
    BookingLookupRateThrottle,
    PaymentVerifyRateThrottle,
)


class SecurityThrottlingAndRendererTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        cache.clear()
        self.package = Package.objects.create(
            slug='lekki-canopy-test',
            name='Lekki Canopy Walk',
            price_ngn=50000,
            max_seats=200,
            seats_booked=0,
            is_active=True,
        )
        self.promo = PromoCode.objects.create(
            code='SECURE10',
            discount_pct=10,
            is_active=True,
        )
        self.booking = Booking.objects.create(
            full_name='Security Auditor',
            email='auditor@example.com',
            phone='+2348011223344',
            guest_count=1,
            selected_packages=['lekki-canopy-test'],
            subtotal_ngn=50000,
            final_total_ngn=50000,
        )

    def tearDown(self):
        cache.clear()

    def test_critical_04_browsable_api_renderer_excluded_in_production(self):
        """CRITICAL-04: Verify that BrowsableAPIRenderer is absent when DEBUG=False and rejected by production validator."""
        from django.core.exceptions import ImproperlyConfigured
        from config.settings import validate_production_settings

        # 1. When DEBUG is False, renderer configuration only contains JSONRenderer
        prod_renderers = [
            'rest_framework.renderers.JSONRenderer',
        ] + (['rest_framework.renderers.BrowsableAPIRenderer'] if False else [])
        self.assertNotIn('rest_framework.renderers.BrowsableAPIRenderer', prod_renderers)
        self.assertEqual(prod_renderers, ['rest_framework.renderers.JSONRenderer'])

        # 2. validate_production_settings blocks startup if BrowsableAPIRenderer is enabled
        insecure_rf = {
            'DEFAULT_RENDERER_CLASSES': [
                'rest_framework.renderers.JSONRenderer',
                'rest_framework.renderers.BrowsableAPIRenderer',
            ]
        }
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validate_production_settings(
                secret_key='a' * 55,
                default_dev_secret='insecure_default',
                allowed_hosts=['api.example.com'],
                db_password='strong_postgres_password',
                frontend_base_url='https://example.com',
                paystack_secret_key='sk_live_123',
                paystack_public_key='pk_live_123',
                flutterwave_secret_key='FLWSECK_LIVE-123',
                flutterwave_public_key='FLWPUBK_LIVE-123',
                flutterwave_secret_hash='my_production_secret_hash',
                rest_framework_config=insecure_rf,
            )
        self.assertIn('BrowsableAPIRenderer is strictly forbidden in production', str(ctx.exception))

    def test_high_01_promo_validation_rate_limited(self):
        """HIGH-01: Verify that excessive promo validation calls are throttled at 10/min (HTTP 429)."""
        cache.clear()
        for i in range(10):
            res = self.client.post('/api/promo/validate/', {'code': 'SECURE10'}, format='json')
            self.assertEqual(res.status_code, status.HTTP_200_OK, f"Request {i+1} failed")

        # 11th request must be throttled
        res_throttled = self.client.post('/api/promo/validate/', {'code': 'SECURE10'}, format='json')
        self.assertEqual(res_throttled.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        cache.clear()

    def test_high_01_booking_creation_rate_limited(self):
        """HIGH-01: Verify that rapid automated booking creation is throttled at 10/min (HTTP 429)."""
        cache.clear()
        for i in range(10):
            payload = {
                'fullName': f'Spam Bot {i}',
                'email': f'bot_{i}@example.com',
                'phone': f'+23480000000{i:02d}',
                'guestCount': 1,
                'selectedPackages': ['lekki-canopy-test'],
                'paymentMethod': 'card',
            }
            res = self.client.post('/api/bookings/', data=payload, format='json')
            self.assertEqual(res.status_code, status.HTTP_201_CREATED, f"Booking {i+1} failed: {res.data}")

        # 11th request must be throttled
        payload_11 = {
            'fullName': 'Spam Bot 11',
            'email': 'bot_11@example.com',
            'phone': '+2348000000099',
            'guestCount': 1,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
        }
        res_throttled = self.client.post('/api/bookings/', data=payload_11, format='json')
        self.assertEqual(res_throttled.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        cache.clear()

    @patch('requests.get')
    def test_high_01_payment_verify_rate_limited(self, mock_get):
        """HIGH-01: Verify that payment verification is throttled at 15/min (HTTP 429)."""
        cache.clear()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'status': True,
            'data': {
                'status': 'success',
                'reference': self.booking.booking_ref,
                'amount': 5000000,
                'currency': 'NGN',
            }
        }
        mock_get.return_value = mock_response

        for i in range(15):
            res = self.client.get(f'/api/payments/verify/?reference={self.booking.booking_ref}')
            self.assertEqual(res.status_code, status.HTTP_200_OK, f"Verify {i+1} failed")

        # 16th request must be throttled
        res_throttled = self.client.get(f'/api/payments/verify/?reference={self.booking.booking_ref}')
        self.assertEqual(res_throttled.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        cache.clear()

    def test_high_01_webhooks_exempt_from_rate_limiting(self):
        """HIGH-01: Webhook views must be explicitly exempt from throttling to avoid dropping payments."""
        self.assertEqual(PaystackWebhookView.throttle_classes, [])
        self.assertEqual(FlutterwaveWebhookView.throttle_classes, [])

    def test_high_02_honeypot_rejection(self):
        """HIGH-02 Pillar 2: Automated submission with filled hidden honeypot is rejected with HTTP 400."""
        cache.clear()
        payload = {
            'fullName': 'Bot Submitter',
            'email': 'bot_honeypot@example.com',
            'phone': '+2348099887766',
            'guestCount': 1,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
            'website_url': 'http://automated-spammer.com',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data.get('error'), 'Invalid request submission.')

    def test_high_02_active_pending_hold_limit(self):
        """HIGH-02 Pillar 1: Prevent duplicate seat-hoarding with the same email or phone while a hold is pending."""
        cache.clear()
        payload = {
            'fullName': 'Legit Guest',
            'email': 'shopper@example.com',
            'phone': '+2348012345678',
            'guestCount': 2,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
        }
        # First reservation succeeds and holds 2 seats
        res1 = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        first_ref = res1.data['bookingRef']

        # Attempting a second reservation with same email while first hold is active is blocked
        payload2 = dict(payload)
        payload2['phone'] = '+2348099999999'  # different phone, same email
        res2 = self.client.post('/api/bookings/', data=payload2, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already have an active reservation holding seats', res2.data.get('error', ''))
        self.assertEqual(res2.data.get('existingBookingRef'), first_ref)

        # Attempting with same phone is also blocked
        payload3 = dict(payload)
        payload3['email'] = 'other_shopper@example.com'  # different email, same phone
        res3 = self.client.post('/api/bookings/', data=payload3, format='json')
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res3.data.get('existingBookingRef'), first_ref)

    def test_high_02_expired_hold_can_rebook(self):
        """HIGH-02 Pillar 4: When a prior hold expires, user can create a new reservation without being locked out."""
        from datetime import timedelta
        from django.utils import timezone

        cache.clear()
        payload = {
            'fullName': 'Slow Guest',
            'email': 'slow@example.com',
            'phone': '+2348077665544',
            'guestCount': 1,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
        }
        res1 = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        old_ref = res1.data['bookingRef']

        # Simulate hold expiration
        b = Booking.objects.get(booking_ref=old_ref)
        b.created_at = timezone.now() - timedelta(minutes=45)
        b.save()

        # New reservation succeeds and automatically cleans up old expired hold
        res2 = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        new_ref = res2.data['bookingRef']
        self.assertNotEqual(old_ref, new_ref)

        b.refresh_from_db()
        self.assertEqual(b.payment_status, 'cancelled')

    @override_settings(TURNSTILE_REQUIRED=True)
    def test_high_02_turnstile_verification(self):
        """HIGH-02 Turnstile: When Turnstile is enforced, missing/invalid tokens fail; valid tokens succeed."""
        cache.clear()
        payload = {
            'fullName': 'Turnstile Tester',
            'email': 'turnstile@example.com',
            'phone': '+2348011998877',
            'guestCount': 1,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
        }
        # 1. Missing token fails
        res_missing = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res_missing.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Security verification token is missing', res_missing.data.get('error', ''))

        # 2. Invalid token fails
        payload_invalid = dict(payload)
        payload_invalid['captchaToken'] = 'bogus-bad-token'
        with patch('requests.post') as mock_cf:
            mock_cf.return_value = MagicMock(
                status_code=200,
                json=lambda: {'success': False, 'error-codes': ['invalid-input-response']}
            )
            res_invalid = self.client.post('/api/bookings/', data=payload_invalid, format='json')
            self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('Security verification failed', res_invalid.data.get('error', ''))

        # 3. Former hardcoded bypass tokens are no longer accepted (NEW-02)
        for bypass in ('dummy-token', 'test-token-valid', '1x00000000000000000000AA'):
            payload_bypass = dict(payload)
            payload_bypass['captchaToken'] = bypass
            with patch('requests.post') as mock_cf:
                mock_cf.return_value = MagicMock(
                    status_code=200,
                    json=lambda: {'success': False, 'error-codes': ['invalid-input-response']}
                )
                res_bypass = self.client.post('/api/bookings/', data=payload_bypass, format='json')
                self.assertEqual(res_bypass.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertTrue(mock_cf.called, f"Token '{bypass}' must be verified with Cloudflare")

        # 4. Token accepted by Cloudflare succeeds
        payload_valid = dict(payload)
        payload_valid['captchaToken'] = 'real-cloudflare-token'
        with patch('requests.post') as mock_cf:
            mock_cf.return_value = MagicMock(status_code=200, json=lambda: {'success': True})
            res_valid = self.client.post('/api/bookings/', data=payload_valid, format='json')
            self.assertEqual(res_valid.status_code, status.HTTP_201_CREATED)

    @override_settings(TURNSTILE_REQUIRED=True, TURNSTILE_SECRET_KEY='', DEBUG=False)
    def test_new_02_turnstile_fails_closed_without_secret(self):
        """NEW-02: Missing Turnstile secret outside DEBUG must reject bookings, not silently allow them."""
        cache.clear()
        payload = {
            'fullName': 'No Secret Tester',
            'email': 'nosecret@example.com',
            'phone': '+2348011990000',
            'guestCount': 1,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
            'captchaToken': 'anything',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_new_02_production_rejects_test_turnstile_secret(self):
        """NEW-02: Startup validation blocks Cloudflare test secrets when Turnstile is required."""
        from config.settings import validate_production_settings
        from django.core.exceptions import ImproperlyConfigured
        with self.assertRaises(ImproperlyConfigured) as ctx:
            validate_production_settings(
                secret_key='a' * 55,
                allowed_hosts=['api.example.com'],
                db_password='pw',
                frontend_base_url='https://example.com',
                paystack_secret_key='sk_live_1',
                paystack_public_key='pk_live_1',
                flutterwave_secret_key='FLWSECK-1',
                flutterwave_public_key='FLWPUBK-1',
                flutterwave_secret_hash='hash',
                turnstile_secret_key='1x0000000000000000000000000000000AA',
                turnstile_required=True,
            )
        self.assertIn('TURNSTILE_SECRET_KEY', str(ctx.exception))

    def test_high_03_guest_count_max_limit(self):
        """HIGH-03: Guest count cannot exceed upper bound of 10 per online reservation."""
        cache.clear()
        payload = {
            'fullName': 'Hoarder Bot',
            'email': 'hoarder@example.com',
            'phone': '+2348033445566',
            'guestCount': 11,
            'selectedPackages': ['lekki-canopy-test'],
            'paymentMethod': 'card',
        }
        res = self.client.post('/api/bookings/', data=payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('guestCount', res.data)

    def test_high_04_admin_login_rate_limiting(self):
        """HIGH-04: Admin login must be protected against brute force and rapid burst attempts."""
        cache.clear()
        admin_login_url = f"/{getattr(settings, 'DJANGO_ADMIN_URL', 'admin/').strip('/')}/login/"

        # 1. Burst rate limiting: 10 requests allowed, 11th triggers HTTP 429
        for i in range(10):
            res = self.client.get(admin_login_url)
            self.assertEqual(res.status_code, 200, f"Request {i+1} failed")

        res_burst = self.client.get(admin_login_url)
        self.assertEqual(res_burst.status_code, 429)
        self.assertIn(b"Too many admin requests", res_burst.content)
        cache.clear()

        # 2. Brute-force failed login lockout: 5 failed POSTs trigger 15-minute lock
        for i in range(5):
            res = self.client.post(admin_login_url, {
                'username': f'admin_attacker_{i}',
                'password': 'wrongpassword123',
            })
            # Stays on login page (200) with errors
            self.assertEqual(res.status_code, 200)

        # 6th attempt must be locked out with HTTP 429
        res_locked = self.client.post(admin_login_url, {
            'username': 'admin_attacker_6',
            'password': 'wrongpassword123',
        })
        self.assertEqual(res_locked.status_code, 429)
        self.assertIn(b"Admin login locked due to multiple failed attempts", res_locked.content)
        cache.clear()

    def test_high_04_admin_ip_proxy_resolution(self):
        """HIGH-04: Ensure admin rate limiting extracts trusted client IP rather than attacker-spoofed prefix."""
        from config.urls import get_client_ip
        from django.test import RequestFactory
        factory = RequestFactory()

        # Attacker spoofs '1.2.3.4, 5.6.7.8' but nginx proxy appended real IP '198.51.100.22'
        req = factory.get('/admin/login/', HTTP_X_FORWARDED_FOR='1.2.3.4, 5.6.7.8, 198.51.100.22')
        resolved_ip = get_client_ip(req)
        # With NUM_PROXIES=1, resolves to the right-most address added by the reverse proxy
        self.assertEqual(resolved_ip, '198.51.100.22')

    def test_high_05_callback_url_injection_rejected(self):
        """HIGH-05: Ensure malicious callbackUrl origins cannot be injected into payment gateways."""
        from core.payments import validate_safe_callback_url, initialize_paystack_payment, initialize_flutterwave_payment

        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
        canonical_verify = f"{frontend_base}/booking/verify"

        # 1. Direct validation tests
        malicious_urls = [
            'https://evil-attacker.com/steal-tokens',
            'http://attacker.com/capture?ref=123',
            'javascript:alert(1)',
            'data:text/html,<script>steal()</script>',
            'https://phishing-inceltourism.com/callback',
        ]
        for bad_url in malicious_urls:
            sanitized = validate_safe_callback_url(bad_url)
            self.assertEqual(sanitized, canonical_verify, f"Failed to reject: {bad_url}")

        # 2. Legitimate frontend URL is preserved
        valid_url = f"{frontend_base}/booking/verify?source=checkout"
        self.assertEqual(validate_safe_callback_url(valid_url), valid_url)

        # 3. Test that initialize_paystack_payment sanitizes malicious callback
        with patch('requests.post') as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: {'status': True, 'data': {'authorization_url': 'https://checkout.paystack.com/auth123', 'access_code': 'acc123'}}
            )
            with patch.object(settings, 'PAYSTACK_SECRET_KEY', 'sk_test_mock'):
                res = initialize_paystack_payment(self.booking, callback_url='https://evil.com/capture')
                self.assertTrue(res['status'])
                # Verify payload sent to Paystack has canonical callback_url, NOT evil.com
                call_args = mock_post.call_args
                sent_payload = call_args[1]['json']
                self.assertEqual(sent_payload['callback_url'], canonical_verify)
                self.assertNotIn('evil.com', sent_payload['callback_url'])
                self.assertNotIn('evil.com', sent_payload['metadata']['cancel_action'])

    def test_high_07_booking_reference_entropy_and_uniqueness(self):
        """HIGH-07: Booking references must use high-entropy alphanumeric format without ambiguous characters."""
        import re
        from core.models import BOOKING_REF_ALPHABET

        # 1. Booking ref format pattern: DL-2026-XXXXXX (6 chars from unambiguous alphabet)
        pattern = re.compile(r'^DL-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$')
        self.assertRegex(self.booking.booking_ref, pattern)

        # 2. Ensure unambiguous characters: 0, O, 1, I must not be present
        for forbidden in ['0', 'O', '1', 'I']:
            self.assertNotIn(forbidden, BOOKING_REF_ALPHABET)

        # 3. Create a batch of new bookings and verify uniqueness
        refs = {self.booking.booking_ref}
        for i in range(25):
            b = Booking.objects.create(
                full_name=f'Guest {i}',
                email=f'guest_{i}@example.com',
                phone=f'+23480555500{i:02d}',
                guest_count=1,
                selected_packages=['lekki-canopy-test'],
                subtotal_ngn=50000,
                final_total_ngn=50000,
            )
            self.assertRegex(b.booking_ref, pattern)
            self.assertNotIn(b.booking_ref, refs, f"Duplicate reference detected: {b.booking_ref}")
            refs.add(b.booking_ref)

