from urllib.parse import urlparse
import logging
import requests
from django.conf import settings
from django.db import transaction, IntegrityError
from django.utils import timezone
from .models import Booking

logger = logging.getLogger(__name__)


def validate_safe_callback_url(callback_url: str) -> str:
    """
    HIGH-05: Validates client-provided payment callback/redirect URLs to prevent Open Redirect
    and payment reference exfiltration attacks.
    Only allows domains that match FRONTEND_BASE_URL or CORS_ALLOWED_ORIGINS.
    Falls back to the canonical '{FRONTEND_BASE_URL}/booking/verify'.
    """
    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
    safe_default = f"{frontend_base}/booking/verify"

    if not callback_url:
        return safe_default

    try:
        parsed = urlparse(callback_url)
        # If relative URL was passed (e.g., '/booking/verify')
        if not parsed.scheme or not parsed.netloc:
            if callback_url.startswith('/'):
                return f"{frontend_base}{callback_url}"
            return safe_default

        provided_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip('/').lower()

        allowed_origins = set()
        if frontend_base:
            p_base = urlparse(frontend_base)
            allowed_origins.add(f"{p_base.scheme}://{p_base.netloc}".rstrip('/').lower())

        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        for o in cors_origins:
            p_cors = urlparse(o)
            if p_cors.scheme and p_cors.netloc:
                allowed_origins.add(f"{p_cors.scheme}://{p_cors.netloc}".rstrip('/').lower())

        if settings.DEBUG:
            allowed_origins.update([
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'http://localhost:8000',
                'http://127.0.0.1:8000',
            ])

        if provided_origin in allowed_origins:
            return callback_url

        logger.warning(
            "HIGH-05 Open Redirect Prevented: Untrusted callback URL '%s' rejected. Falling back to '%s'",
            callback_url, safe_default
        )
        return safe_default
    except Exception as exc:
        logger.warning("Error parsing callback URL %s: %s", callback_url, exc)
        return safe_default


def initialize_paystack_payment(booking: Booking, callback_url: str = None) -> dict:
    """
    Initializes a Paystack transaction and returns the hosted redirect checkout URL.
    """
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
    if not secret_key:
        logger.error("Paystack Secret Key is not configured in settings.")
        return {"status": False, "error": "Paystack is not configured on the server."}

    target_callback = validate_safe_callback_url(callback_url)

    # Amount in kobo (1 NGN = 100 kobo)
    amount_kobo = int(booking.final_total_ngn * 100)

    cancel_url = f"{target_callback}?status=cancelled&reference={booking.booking_ref}"
    payload = {
        "email": booking.email,
        "amount": amount_kobo,
        "reference": booking.booking_ref,
        "callback_url": target_callback,
        "currency": "NGN",
        "metadata": {
            "booking_id": str(booking.id),
            "booking_ref": booking.booking_ref,
            "full_name": booking.full_name,
            "phone": booking.phone,
            "guest_count": booking.guest_count,
            "selected_packages": booking.selected_packages,
            "cancel_action": cancel_url,
        },
    }

    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        resp = requests.post(
            "https://api.paystack.co/transaction/initialize",
            json=payload,
            headers=headers,
            timeout=15,
        )
        data = resp.json()

        if resp.status_code == 200 and data.get("status") is True:
            auth_url = data["data"]["authorization_url"]
            booking.payment_reference = booking.booking_ref
            booking.payment_url = auth_url
            booking.save(update_fields=['payment_reference', 'payment_url'])
            return {
                "status": True,
                "checkout_url": auth_url,
                "access_code": data["data"].get("access_code"),
                "reference": booking.booking_ref,
            }
        else:
            err_msg = data.get("message", "Paystack initialization failed.")
            logger.warning("Paystack init failed: %s (status %s)", err_msg, resp.status_code)
            return {"status": False, "error": err_msg}
    except Exception as exc:
        logger.exception("Exception initializing Paystack transaction: %s", exc)
        return {"status": False, "error": str(exc)}


def initialize_flutterwave_payment(booking: Booking, redirect_url: str = None) -> dict:
    """
    Initializes a Flutterwave payment and returns the hosted redirect checkout URL.
    Supports NGN, USD, and GBP.
    """
    secret_key = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
    if not secret_key:
        logger.error("Flutterwave Secret Key is not configured in settings.")
        return {"status": False, "error": "Flutterwave is not configured on the server."}

    target_redirect = validate_safe_callback_url(redirect_url)

    # Currency and amount handling
    if booking.currency in ['USD', 'GBP'] and booking.converted_total:
        charge_amount = float(booking.converted_total)
        charge_currency = booking.currency
    else:
        charge_amount = float(booking.final_total_ngn)
        charge_currency = 'NGN'

    payload = {
        "tx_ref": booking.booking_ref,
        "amount": charge_amount,
        "currency": charge_currency,
        "redirect_url": target_redirect,
        "customer": {
            "email": booking.email,
            "phonenumber": booking.phone,
            "name": booking.full_name,
        },
        "customizations": {
            "title": "Lagos Luxe 2026",
            "description": f"Official Experience Reservation ({booking.booking_ref})",
        },
        "meta": {
            "booking_ref": booking.booking_ref,
            "guest_count": booking.guest_count,
            "currency": charge_currency,
        },
    }

    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        resp = requests.post(
            "https://api.flutterwave.com/v3/payments",
            json=payload,
            headers=headers,
            timeout=15,
        )
        data = resp.json()

        if resp.status_code in [200, 201] and data.get("status") == "success":
            payment_link = data["data"]["link"]
            booking.payment_reference = booking.booking_ref
            booking.payment_url = payment_link
            booking.save(update_fields=['payment_reference', 'payment_url'])
            return {
                "status": True,
                "checkout_url": payment_link,
                "reference": booking.booking_ref,
            }
        else:
            err_msg = data.get("message", "Flutterwave initialization failed.")
            logger.warning("Flutterwave init failed: %s (status %s)", err_msg, resp.status_code)
            return {"status": False, "error": err_msg}
    except Exception as exc:
        logger.exception("Exception initializing Flutterwave transaction: %s", exc)
        return {"status": False, "error": str(exc)}


def verify_paystack_transaction(reference: str) -> dict:
    """
    Queries Paystack's transaction verify API.
    """
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
    if not secret_key:
        return {"verified": False, "error": "Paystack Secret Key is not configured."}

    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Accept": "application/json",
    }

    try:
        resp = requests.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers=headers,
            timeout=15,
        )
        data = resp.json()
        if resp.status_code == 200 and data.get("status") is True:
            tx_data = data.get("data", {})
            is_success = tx_data.get("status") == "success"
            return {
                "verified": is_success,
                "status": tx_data.get("status"),
                "amount": tx_data.get("amount"),
                "currency": tx_data.get("currency"),
                "reference": tx_data.get("reference"),
                "gateway_response": tx_data.get("gateway_response"),
                "raw": tx_data,
            }
        return {"verified": False, "error": data.get("message", "Paystack verification unsuccessful.")}
    except Exception as exc:
        logger.exception("Error verifying Paystack transaction %s: %s", reference, exc)
        return {"verified": False, "error": str(exc)}


def verify_flutterwave_transaction(transaction_id: str) -> dict:
    """
    Queries Flutterwave's transaction verify API by transaction ID.
    """
    secret_key = getattr(settings, 'FLUTTERWAVE_SECRET_KEY', '')
    if not secret_key:
        return {"verified": False, "error": "Flutterwave Secret Key is not configured."}

    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Accept": "application/json",
    }

    try:
        resp = requests.get(
            f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify",
            headers=headers,
            timeout=15,
        )
        data = resp.json()
        if resp.status_code == 200 and data.get("status") == "success":
            tx_data = data.get("data", {})
            is_success = tx_data.get("status") == "successful"
            return {
                "verified": is_success,
                "status": tx_data.get("status"),
                "amount": tx_data.get("amount"),
                "currency": tx_data.get("currency"),
                "reference": tx_data.get("tx_ref"),
                "flw_id": tx_data.get("id"),
                "raw": tx_data,
            }
        return {"verified": False, "error": data.get("message", "Flutterwave verification unsuccessful.")}
    except Exception as exc:
        logger.exception("Error verifying Flutterwave transaction %s: %s", transaction_id, exc)
        return {"verified": False, "error": str(exc)}


def confirm_booking_payment(booking: Booking, payment_reference: str = None) -> bool:
    """
    Marks booking as paid and stores paid_at timestamp.
    Uses select_for_update inside an atomic transaction to ensure strict idempotency
    under concurrent webhook and verification callback arrivals (MEDIUM-03).
    Triggers automated customer receipt and internal team notification emails once.
    """
    try:
        with transaction.atomic():
            locked_booking = Booking.objects.select_for_update().get(id=booking.id)
            if locked_booking.payment_status == 'paid':
                logger.info("Booking %s is already marked as PAID (skipping duplicate confirmation).", locked_booking.booking_ref)
                return False

            # NEW-01: A single gateway transaction may only ever pay for one booking (replay protection)
            if payment_reference and Booking.objects.filter(
                payment_reference=payment_reference, payment_status='paid'
            ).exclude(id=locked_booking.id).exists():
                logger.warning(
                    "Replay blocked: transaction %s already paid another booking; refusing to confirm %s.",
                    payment_reference, locked_booking.booking_ref,
                )
                return False

            locked_booking.payment_status = 'paid'
            locked_booking.paid_at = timezone.now()
            if payment_reference:
                locked_booking.payment_reference = payment_reference
            locked_booking.save(update_fields=['payment_status', 'paid_at', 'payment_reference'])

            # Keep caller's in-memory instance synchronized
            booking.payment_status = locked_booking.payment_status
            booking.paid_at = locked_booking.paid_at
            booking.payment_reference = locked_booking.payment_reference

    except IntegrityError:
        logger.warning(
            "Concurrent replay collision blocked: transaction %s already claimed by another paid booking.",
            payment_reference
        )
        return False

    logger.info("Booking %s marked as PAID.", booking.booking_ref)

    # Trigger confirmation emails (Customer + Internal Operations Team)
    try:
        from core.emails.services.booking_emails import send_booking_confirmation_emails
        send_booking_confirmation_emails(booking, is_async=True)
    except Exception as exc:
        logger.exception("Failed to dispatch confirmation emails for %s: %s", booking.booking_ref, exc)

    return True


def validate_payment_amount_and_currency(
    booking: Booking,
    gateway: str,
    amount,
    currency,
    fees=None,
    requested_amount=None,
    settled_amount=None,
) -> tuple[bool, str]:
    """
    Validates that the amount and currency returned by the payment gateway
    satisfy what is expected for the given booking. Prevents payment underpayment / manipulation (CRITICAL-02)
    while gracefully supporting setups where transaction fees are passed to the customer.
    """
    if amount is None:
        return False, "Missing transaction amount from payment gateway."

    gateway_norm = gateway.lower()

    if gateway_norm == 'paystack':
        # Paystack operates in kobo (1 NGN = 100 kobo)
        expected_kobo = int(booking.final_total_ngn * 100)
        try:
            paid_kobo = int(amount)
        except (ValueError, TypeError):
            return False, f"Invalid Paystack amount format: {amount}"

        paid_currency = str(currency).upper() if currency else 'NGN'
        if paid_currency != 'NGN':
            return False, f"Paystack currency mismatch: expected NGN, received {currency}."

        # Case 1: Exact match (standard merchant-borne fee)
        if paid_kobo == expected_kobo:
            return True, ""

        # Case 2: Paystack provides requested_amount (pre-fee base amount requested)
        if requested_amount is not None:
            try:
                if int(requested_amount) == expected_kobo:
                    return True, ""
            except (ValueError, TypeError):
                pass

        # Case 3: Net settlement match via fees breakdown (paid_amount - fees == expected_kobo)
        if fees is not None:
            try:
                if paid_kobo - int(fees) == expected_kobo:
                    return True, ""
            except (ValueError, TypeError):
                pass

        # Case 4: Customer bears the fee on Paystack (customer paid more than expected to cover gateway fee)
        if paid_kobo >= expected_kobo:
            logger.info(
                "Paystack payment for %s verified with customer-borne fee: expected %s kobo, received %s kobo (fee: %s kobo)",
                booking.booking_ref, expected_kobo, paid_kobo, paid_kobo - expected_kobo
            )
            return True, ""

        # Strictly reject underpayment (paid_kobo < expected_kobo)
        return False, f"Paystack underpayment detected: expected at least {expected_kobo} kobo, received {paid_kobo} kobo."

    elif gateway_norm == 'flutterwave':
        # Flutterwave operates in standard currency units (e.g. 520000.00 NGN or 325.00 USD)
        try:
            paid_amount = float(amount)
        except (ValueError, TypeError):
            return False, f"Invalid Flutterwave amount format: {amount}"

        if booking.currency in ['USD', 'GBP'] and booking.converted_total:
            expected_amount = float(booking.converted_total)
            expected_currency = booking.currency
        else:
            expected_amount = float(booking.final_total_ngn)
            expected_currency = 'NGN'

        paid_currency = str(currency).upper() if currency else expected_currency
        if paid_currency != expected_currency:
            return False, f"Flutterwave currency mismatch: expected {expected_currency}, received {currency}."

        # Case 1: Close match within 0.05 currency units
        if abs(paid_amount - expected_amount) <= 0.05:
            return True, ""

        # Case 2: Settled amount match (merchant proceeds)
        if settled_amount is not None:
            try:
                if abs(float(settled_amount) - expected_amount) <= 0.05:
                    return True, ""
            except (ValueError, TypeError):
                pass

        # Case 3: Net settlement match via fees breakdown (paid_amount - fees == expected_amount)
        if fees is not None:
            try:
                if abs((paid_amount - float(fees)) - expected_amount) <= 0.05:
                    return True, ""
            except (ValueError, TypeError):
                pass

        # Case 4: Customer bears fee on Flutterwave (paid_amount >= expected_amount)
        if paid_amount >= expected_amount:
            logger.info(
                "Flutterwave payment for %s verified with customer-borne fee: expected %s %s, received %s %s",
                booking.booking_ref, expected_amount, expected_currency, paid_amount, paid_currency
            )
            return True, ""

        return False, f"Flutterwave underpayment detected: expected at least {expected_amount} {expected_currency}, received {paid_amount} {currency}."

    return False, f"Unsupported payment gateway: {gateway}"

