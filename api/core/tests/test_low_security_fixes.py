from django.test import TestCase
from rest_framework.exceptions import ValidationError
from core.models import Booking, Package
from core.serializers import BookingCreateSerializer
from core.emails.services.booking_emails import send_booking_confirmation_emails


class LowSecurityFixesTestCase(TestCase):
    def setUp(self):
        self.package = Package.objects.create(
            name="Excursion Low Test",
            slug="excursion-low-test",
            price_ngn=50000,
            max_seats=20,
            seats_booked=1,
            is_active=True,
        )
        self.booking = Booking.objects.create(
            booking_ref="DL-2026-LOW001",
            full_name="Alice Smith",
            email="alice@example.com",
            phone="08012345678",
            guest_count=1,
            currency="NGN",
            final_total_ngn=50000,
            payment_status="paid",
            payment_method="card",
            selected_packages=[str(self.package.id)],
        )

    def test_low_02_email_whatsapp_url_omits_full_name_pii(self):
        """LOW-02: WhatsApp deep link in confirmation emails omits customer full name from query string."""
        from unittest.mock import patch
        with patch('core.emails.services.base.BaseEmailService.send_email') as mock_send:
            send_booking_confirmation_emails(self.booking, is_async=False)
            self.assertTrue(mock_send.called)
            # Find customer confirmation email call
            customer_call = mock_send.call_args_list[0]
            context = customer_call[1].get('context') or customer_call[0][3]
            whatsapp_url = context.get('whatsapp_url', '')
            # URL must not contain the customer's full name in cleartext
            self.assertNotIn("Alice%20Smith", whatsapp_url)
            self.assertNotIn("Alice Smith", whatsapp_url)
            self.assertIn(self.booking.booking_ref, whatsapp_url)

    def test_low_03_promo_code_validation_returns_uniform_error(self):
        """LOW-03: Booking creation returns uniform 'Invalid or expired promo code.' error message."""
        serializer = BookingCreateSerializer(data={
            'fullName': 'Test User',
            'email': 'test@example.com',
            'phone': '08012345678',
            'guestCount': 1,
            'selectedPackages': [str(self.package.id)],
            'promoCode': 'NONEXISTENT_CODE_123',
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('promoCode', serializer.errors)
        self.assertEqual(serializer.errors['promoCode'][0], "Invalid or expired promo code.")

    def test_low_06_special_requests_exceeding_1000_chars_rejected(self):
        """LOW-06: specialRequests field rejects inputs exceeding 1,000 characters."""
        oversized_text = "A" * 1001
        serializer = BookingCreateSerializer(data={
            'fullName': 'Test User',
            'email': 'test@example.com',
            'phone': '08012345678',
            'guestCount': 1,
            'selectedPackages': [str(self.package.id)],
            'specialRequests': oversized_text,
        })
        self.assertFalse(serializer.is_valid())
        self.assertIn('specialRequests', serializer.errors)
        self.assertIn("1000 characters", str(serializer.errors['specialRequests'][0]).lower())

    def test_low_06_special_requests_within_1000_chars_accepted(self):
        """LOW-06: specialRequests field accepts valid inputs within 1,000 characters."""
        valid_text = "Please reserve vegetarian meal and aisle seat."
        serializer = BookingCreateSerializer(data={
            'fullName': 'Test User',
            'email': 'test@example.com',
            'phone': '08012345678',
            'guestCount': 1,
            'selectedPackages': [str(self.package.id)],
            'specialRequests': valid_text,
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_low_01_campaign_config_default_baseline_is_zero(self):
        """LOW-01: Auto-created CampaignConfig starts with 0 baseline claimed (real bookings) instead of synthetic 18."""
        from core.models import CampaignConfig
        CampaignConfig.objects.all().delete()
        cfg = CampaignConfig.get_settings()
        self.assertEqual(cfg.early_bird_baseline_claimed, 0)
