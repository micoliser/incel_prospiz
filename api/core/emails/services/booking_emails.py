import logging
import uuid
from typing import Dict, Any, List
from django.conf import settings
from django.db.models import Q
from core.models import Booking, Package
from core.emails.config import EmailConfig
from core.emails.services.base import BaseEmailService

logger = logging.getLogger(__name__)


def build_booking_email_context(booking: Booking) -> Dict[str, Any]:
    """
    Assembles a complete, rich context dictionary for booking email templates.
    Resolves package records, pricing breakdowns, and operational deep-links.
    """
    selected_raw = booking.selected_packages or []
    uuid_ids = []
    slug_ids = []
    for item in selected_raw:
        try:
            uuid_ids.append(uuid.UUID(str(item)))
        except (ValueError, TypeError, AttributeError):
            slug_ids.append(str(item))

    packages = list(
        Package.objects.filter(
            Q(id__in=uuid_ids) | Q(slug__in=slug_ids)
        ).order_by('category', 'price_ngn')
    )

    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
    if not frontend_base:
        frontend_base = 'http://localhost:3000'
    frontend_base = frontend_base.rstrip('/')

    lookup_url = f"{frontend_base}/booking/lookup?ref={booking.booking_ref}"

    # WhatsApp link for direct team-to-customer communication (LOW-02: minimal PII in URL query)
    clean_phone = ''.join(c for c in str(booking.phone) if c.isdigit() or c == '+')
    if clean_phone.startswith('0'):
        clean_phone = '234' + clean_phone[1:]
    clean_phone = clean_phone.lstrip('+')
    whatsapp_url = f"https://wa.me/{clean_phone}?text=Hello,%20this%20is%20the%20Incel%20Holidays%20team%20regarding%20your%20Lagos%20Luxe%202026%20booking%20{booking.booking_ref}."

    # Format payment method label
    method_raw = (booking.payment_method or '').lower()
    if method_raw == 'paystack':
        method_label = 'Paystack (Instant Card / Bank)'
    elif method_raw == 'flutterwave':
        method_label = 'Flutterwave (Global Card / Multi-Currency)'
    elif method_raw == 'whatsapp':
        method_label = 'Book via WhatsApp'
    else:
        method_label = method_raw.title()

    total_discount_ngn = (booking.group_discount_ngn or 0) + (booking.promo_discount_ngn or 0)
    has_discount = total_discount_ngn > 0

    is_foreign = booking.currency in ['USD', 'GBP']
    currency_code = booking.currency if is_foreign else 'NGN'
    currency_sym = '$' if booking.currency == 'USD' else '£' if booking.currency == 'GBP' else '₦'

    if is_foreign:
        rate = booking.effective_exchange_rate
        subtotal_num = booking.converted_subtotal if booking.converted_subtotal is not None else (round(booking.subtotal_ngn / rate, 2) if rate > 0 else 0)
        group_disc_num = booking.converted_group_discount if booking.converted_group_discount is not None else (round(booking.group_discount_ngn / rate, 2) if (booking.group_discount_ngn and rate > 0) else None)
        promo_disc_num = booking.converted_promo_discount if booking.converted_promo_discount is not None else (round(booking.promo_discount_ngn / rate, 2) if (booking.promo_discount_ngn and rate > 0) else None)
        total_disc_num = booking.converted_total_savings if booking.converted_total_savings is not None else (round(total_discount_ngn / rate, 2) if (total_discount_ngn and rate > 0) else None)
        final_total_num = float(booking.converted_total) if booking.converted_total is not None else (round(booking.final_total_ngn / rate, 2) if rate > 0 else 0)

        subtotal_str = f"{currency_sym}{subtotal_num:,.2f}"
        group_disc_str = f"{currency_sym}{group_disc_num:,.2f}" if group_disc_num else None
        promo_disc_str = f"{currency_sym}{promo_disc_num:,.2f}" if promo_disc_num else None
        total_disc_str = f"{currency_sym}{total_disc_num:,.2f}" if total_disc_num else None
        final_total_str = f"{currency_sym}{final_total_num:,.2f}"
        exchange_rate_str = f"₦{rate:,.2f} / {booking.currency}" if rate > 0 else None
    else:
        subtotal_str = f"₦{booking.subtotal_ngn:,}"
        group_disc_str = f"₦{booking.group_discount_ngn:,}" if booking.group_discount_ngn else None
        promo_disc_str = f"₦{booking.promo_discount_ngn:,}" if booking.promo_discount_ngn else None
        total_disc_str = f"₦{total_discount_ngn:,}" if total_discount_ngn else None
        final_total_str = f"₦{booking.final_total_ngn:,}"
        exchange_rate_str = None

    # Formatted date strings
    paid_at_str = booking.paid_at.strftime('%d %B %Y, %I:%M %p GMT+1') if booking.paid_at else 'Confirmed'

    return {
        'booking': booking,
        'booking_ref': booking.booking_ref,
        'full_name': booking.full_name,
        'email': booking.email,
        'phone': booking.phone,
        'country': booking.country,
        'guest_count': booking.guest_count,
        'is_foreigner': booking.is_foreigner,
        'is_foreign': is_foreign,
        'packages': packages,
        'currency_symbol': currency_sym,
        'subtotal_formatted': subtotal_str,
        'group_discount_pct': booking.group_discount_pct,
        'group_discount_formatted': group_disc_str,
        'promo_code': booking.promo_code,
        'promo_discount_pct': booking.promo_discount_pct,
        'promo_discount_formatted': promo_disc_str,
        'total_discount_formatted': total_disc_str,
        'has_discount': has_discount,
        'final_total_formatted': final_total_str,
        'base_subtotal_ngn_formatted': f"₦{booking.subtotal_ngn:,}",
        'base_final_total_ngn_formatted': f"₦{booking.final_total_ngn:,}",
        'exchange_rate_formatted': exchange_rate_str,
        'currency': booking.currency,
        'converted_total_formatted': f"{booking.converted_total:,.2f}" if booking.converted_total else None,
        'payment_method_label': method_label,
        'payment_reference': booking.payment_reference or 'N/A',
        'paid_at_formatted': paid_at_str,
        'special_requests': booking.special_requests.strip() if booking.special_requests else '',
        'frontend_url': frontend_base,
        'lookup_url': lookup_url,
        'whatsapp_url': whatsapp_url,
        'sender_name': EmailConfig.get_sender_name(),
        'sender_email': EmailConfig.get_default_from_email(),
        'support_email': EmailConfig.get_default_from_email(),
        'support_phone': '+234 812 345 6789',
        'event_dates': '13th – 30th December 2026',
        'event_location': 'Lagos, Nigeria',
    }


def send_customer_booking_confirmation(booking: Booking, is_async: bool = True) -> bool:
    """
    Sends a personalized luxury confirmation and receipt email to the customer.
    """
    try:
        context = build_booking_email_context(booking)
        subject = f"Booking Confirmed: Lagos Luxe 2026 [Ref: {booking.booking_ref}]"
        recipients = [booking.email]
        reply_to = EmailConfig.get_default_from_email()

        return BaseEmailService.send_email(
            subject=subject,
            recipients=recipients,
            template_name='emails/customer_booking_confirmation.html',
            context=context,
            reply_to=reply_to,
            is_async=is_async,
        )
    except Exception as exc:
        logger.exception("Failed to prepare customer confirmation email for %s: %s", booking.booking_ref, exc)
        return False


def send_internal_team_notification(booking: Booking, is_async: bool = True) -> bool:
    """
    Sends an operational alert email to the internal Incel Holidays team
    containing customer contact info, booked excursions, and payment audit details.
    """
    try:
        context = build_booking_email_context(booking)
        recipients = EmailConfig.get_internal_recipients()
        
        guest_label = f"{booking.guest_count} Guest{'s' if booking.guest_count > 1 else ''}"
        subject = f"[New Paid Booking] {booking.booking_ref} - {booking.full_name} ({guest_label}) - {booking.currency} {context['final_total_formatted']}"

        return BaseEmailService.send_email(
            subject=subject,
            recipients=recipients,
            template_name='emails/internal_team_booking_notification.html',
            context=context,
            reply_to=booking.email,
            is_async=is_async,
        )
    except Exception as exc:
        logger.exception("Failed to prepare internal team notification for %s: %s", booking.booking_ref, exc)
        return False


def send_booking_confirmation_emails(booking: Booking, is_async: bool = True) -> Dict[str, bool]:
    """
    Dispatches both customer receipt and internal operations alert.
    Safe to invoke from payment confirmation callbacks and admin actions.
    """
    logger.info("Initiating booking confirmation emails for %s", booking.booking_ref)
    customer_sent = send_customer_booking_confirmation(booking, is_async=is_async)
    internal_sent = send_internal_team_notification(booking, is_async=is_async)
    return {
        'customer_email': customer_sent,
        'internal_email': internal_sent,
    }
