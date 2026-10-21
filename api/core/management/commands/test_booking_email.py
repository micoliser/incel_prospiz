"""
Management command to test and preview booking confirmation emails.

Usage examples:
  python manage.py test_booking_email --ref DL-2026-6295 --email your_email@example.com
  python manage.py test_booking_email --type customer --email test@example.com
  python manage.py test_booking_email --type internal
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from core.models import Booking
from core.emails.config import EmailConfig
from core.emails.services.booking_emails import (
    send_customer_booking_confirmation,
    send_internal_team_notification,
    build_booking_email_context,
)


class Command(BaseCommand):
    help = "Test and preview customer & internal team booking confirmation emails"

    def add_arguments(self, parser):
        parser.add_argument(
            '--ref',
            type=str,
            help='Booking reference code to test (e.g. DL-2026-6295). Defaults to the latest booking.',
        )
        parser.add_argument(
            '--email',
            type=str,
            help='Override recipient email address for testing delivery safely.',
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['both', 'customer', 'internal'],
            default='both',
            help='Which email to test: "customer", "internal", or "both" (default).',
        )
        parser.add_argument(
            '--sync',
            action='store_true',
            default=True,
            help='Send synchronously in foreground to output SMTP connection status.',
        )

    def handle(self, *args, **options):
        ref = options.get('ref')
        override_email = options.get('email')
        email_type = options.get('type')
        is_sync = options.get('sync')

        self.stdout.write(self.style.MIGRATE_HEADING("=" * 65))
        self.stdout.write(self.style.MIGRATE_HEADING("📧 DETTY DECEMBER LAGOS LUXE - EMAIL SYSTEM TEST"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 65))

        self.stdout.write(f"Email Backend:  {getattr(settings, 'EMAIL_BACKEND', 'Not configured')}")
        self.stdout.write(f"SMTP Host:      {getattr(settings, 'EMAIL_HOST', 'Not configured')}:{getattr(settings, 'EMAIL_PORT', '')}")
        self.stdout.write(f"Sender:         {EmailConfig.format_from_email()}")
        self.stdout.write(f"Email Enabled:  {EmailConfig.is_enabled()}")
        self.stdout.write(f"Debug Mode:     {EmailConfig.is_debug_mode()}")
        self.stdout.write(f"Internal Team:  {', '.join(EmailConfig.get_internal_recipients())}")
        self.stdout.write("-" * 65)

        # Locate target booking
        booking = None
        if ref:
            booking = Booking.objects.filter(booking_ref__iexact=ref.strip()).first()
            if not booking:
                raise CommandError(f"Booking reference '{ref}' not found in database.")
        else:
            booking = Booking.objects.filter(payment_status='paid').order_by('-created_at').first()
            if not booking:
                booking = Booking.objects.order_by('-created_at').first()

        if not booking:
            raise CommandError("No bookings found in database. Create a booking first to test emails.")

        self.stdout.write(f"Target Booking:  {booking.booking_ref} ({booking.full_name}, Status: {booking.payment_status})")
        if override_email:
            self.stdout.write(self.style.WARNING(f"Recipient Override: {override_email}"))
            booking.email = override_email

        # Test 1: Customer Confirmation Email
        if email_type in ('both', 'customer'):
            self.stdout.write("\n1. Sending Customer Confirmation Email...")
            success = send_customer_booking_confirmation(booking, is_async=not is_sync)
            if success:
                self.stdout.write(self.style.SUCCESS(f"   ✓ Customer confirmation email sent to {booking.email}"))
            else:
                self.stdout.write(self.style.ERROR(f"   ✗ Customer confirmation email failed or logged (check logs/config)"))

        # Test 2: Internal Team Operational Alert
        if email_type in ('both', 'internal'):
            self.stdout.write("\n2. Sending Internal Team Operational Alert...")
            success = send_internal_team_notification(booking, is_async=not is_sync)
            if success:
                recipients = EmailConfig.get_internal_recipients()
                self.stdout.write(self.style.SUCCESS(f"   ✓ Internal team alert sent to {', '.join(recipients)}"))
            else:
                self.stdout.write(self.style.ERROR("   ✗ Internal team notification failed or logged (check logs/config)"))

        self.stdout.write(self.style.MIGRATE_HEADING("\n" + "=" * 65))
        self.stdout.write(self.style.SUCCESS("✓ Email testing completed!"))
        self.stdout.write(self.style.MIGRATE_HEADING("=" * 65))
