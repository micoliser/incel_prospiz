from unittest.mock import patch
from django.test import TestCase, override_settings
from django.utils import timezone
from core.models import Booking, Package
from core.emails.config import EmailConfig
from core.emails.services.booking_emails import (
    build_booking_email_context,
    send_customer_booking_confirmation,
    send_internal_team_notification,
    send_booking_confirmation_emails,
)
from core.payments import confirm_booking_payment


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_ENABLED=True,
    EMAIL_DEBUG=False,
    EMAIL_HOST='smtp.gmail.com',
    EMAIL_PORT=587,
    DEFAULT_FROM_EMAIL='info@inceltourism.com',
    EMAIL_SENDER_NAME='Incel Holidays and Tourism',
    INTERNAL_NOTIFICATION_EMAILS=['info@inceltourism.com', 'ops@inceltourism.com'],
    FRONTEND_BASE_URL='http://localhost:3000',
)
class EmailNotificationTests(TestCase):
    def setUp(self):
        self.pkg = Package.objects.create(
            slug='lekki-conservation-centre',
            name='Lekki Conservation Centre & Canopy Walkway',
            tagline='Traverse Africa’s longest canopy bridge',
            price_ngn=75000,
            max_seats=50,
            seats_booked=5,
            duration='Morning & Early Afternoon',
            dates='15 Dec 2026',
            location='Lekki Peninsula',
            category='excursion',
            is_active=True,
        )
        self.booking = Booking.objects.create(
            full_name='Samuel Iwelumo',
            email='samuel@example.com',
            phone='+2348012345678',
            country='UK',
            guest_count=2,
            is_foreigner=False,
            selected_packages=['lekki-conservation-centre'],
            subtotal_ngn=150000,
            group_discount_pct=5,
            group_discount_ngn=7500,
            promo_code='EARLYBIRD5',
            promo_discount_pct=5,
            promo_discount_ngn=7125,
            final_total_ngn=135375,
            currency='NGN',
            payment_method='paystack',
            payment_status='pending',
            payment_reference='DL-2026-6295',
            special_requests='Window seat preferences',
        )

    def test_email_config_helpers(self):
        self.assertTrue(EmailConfig.is_enabled())
        self.assertFalse(EmailConfig.is_debug_mode())
        self.assertEqual(EmailConfig.get_sender_name(), 'Incel Holidays and Tourism')
        self.assertEqual(EmailConfig.get_default_from_email(), 'info@inceltourism.com')
        self.assertEqual(EmailConfig.format_from_email(), 'Incel Holidays and Tourism <info@inceltourism.com>')
        self.assertEqual(
            EmailConfig.get_internal_recipients(),
            ['info@inceltourism.com', 'ops@inceltourism.com']
        )

    def test_build_booking_email_context(self):
        context = build_booking_email_context(self.booking)
        self.assertEqual(context['booking_ref'], self.booking.booking_ref)
        self.assertEqual(context['full_name'], 'Samuel Iwelumo')
        self.assertEqual(context['email'], 'samuel@example.com')
        self.assertEqual(context['guest_count'], 2)
        self.assertEqual(len(context['packages']), 1)
        self.assertEqual(context['packages'][0].slug, 'lekki-conservation-centre')
        self.assertIn('135,375', context['final_total_formatted'])
        self.assertIn(self.booking.booking_ref, context['lookup_url'])
        self.assertEqual(context['sender_name'], 'Incel Holidays and Tourism')
        self.assertEqual(context['sender_email'], 'info@inceltourism.com')

    def test_send_customer_booking_confirmation(self):
        from django.core import mail
        mail.outbox = []

        success = send_customer_booking_confirmation(self.booking, is_async=False)
        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]
        self.assertIn("Booking Confirmed: Detty December Lagos Luxe", email.subject)
        self.assertIn(self.booking.booking_ref, email.subject)
        self.assertEqual(email.to, ['samuel@example.com'])
        self.assertIn('Incel Holidays and Tourism <info@inceltourism.com>', email.from_email)
        self.assertEqual(email.reply_to, ['info@inceltourism.com'])
        # Verify both plain text and HTML alternative were attached
        self.assertIn(self.booking.booking_ref, email.body)
        self.assertEqual(len(email.alternatives), 1)
        html_content, mimetype = email.alternatives[0]
        self.assertEqual(mimetype, 'text/html')
        self.assertIn('Incel Holidays and Tourism', html_content)
        self.assertIn('Lekki Conservation Centre', html_content)

    def test_send_internal_team_notification(self):
        from django.core import mail
        mail.outbox = []

        success = send_internal_team_notification(self.booking, is_async=False)
        self.assertTrue(success)
        self.assertEqual(len(mail.outbox), 1)

        email = mail.outbox[0]
        self.assertIn("[New Paid Booking]", email.subject)
        self.assertIn(self.booking.booking_ref, email.subject)
        self.assertEqual(email.to, ['info@inceltourism.com', 'ops@inceltourism.com'])
        self.assertEqual(email.reply_to, ['samuel@example.com'])
        self.assertIn('Window seat preferences', email.body)

    def test_confirm_booking_payment_triggers_both_emails(self):
        from django.core import mail
        mail.outbox = []

        # Confirming pending booking triggers both emails synchronously if is_async=False
        with patch('core.emails.services.booking_emails.BaseEmailService.send_email') as mock_send:
            mock_send.return_value = True
            was_confirmed = confirm_booking_payment(self.booking, payment_reference='PAY-TEST-999')
            self.assertTrue(was_confirmed)
            self.booking.refresh_from_db()
            self.assertEqual(self.booking.payment_status, 'paid')
            self.assertEqual(mock_send.call_count, 2)

    def test_confirm_booking_payment_idempotency_prevents_duplicate_emails(self):
        with patch('core.emails.services.booking_emails.BaseEmailService.send_email') as mock_send:
            mock_send.return_value = True
            # First confirmation
            first = confirm_booking_payment(self.booking, payment_reference='REF-1')
            self.assertTrue(first)
            self.assertEqual(mock_send.call_count, 2)

            # Second confirmation (e.g. duplicate webhook or user callback)
            second = confirm_booking_payment(self.booking, payment_reference='REF-1')
            self.assertFalse(second)
            # Call count should still be 2, NOT 4!
            self.assertEqual(mock_send.call_count, 2)
