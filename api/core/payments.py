import logging
import requests
from django.conf import settings
from django.utils import timezone
from .models import Booking

logger = logging.getLogger(__name__)


def initialize_paystack_payment(booking: Booking, callback_url: str = None) -> dict:
    """
    Initializes a Paystack transaction and returns the hosted redirect checkout URL.
    """
    secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
    if not secret_key:
        logger.error("Paystack Secret Key is not configured in settings.")
        return {"status": False, "error": "Paystack is not configured on the server."}

    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
    target_callback = callback_url or f"{frontend_base}/booking/verify"

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

    frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
    target_redirect = redirect_url or f"{frontend_base}/booking/verify"

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
            "title": "Detty December Lagos Luxe",
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
    Triggers automated customer receipt and internal team notification emails.
    """
    if booking.payment_status != 'paid':
        booking.payment_status = 'paid'
        booking.paid_at = timezone.now()
        if payment_reference:
            booking.payment_reference = payment_reference
        booking.save(update_fields=['payment_status', 'paid_at', 'payment_reference'])
        logger.info("Booking %s marked as PAID.", booking.booking_ref)

        # Trigger confirmation emails (Customer + Internal Operations Team)
        try:
            from core.emails.services.booking_emails import send_booking_confirmation_emails
            send_booking_confirmation_emails(booking, is_async=True)
        except Exception as exc:
            logger.exception("Failed to dispatch confirmation emails for %s: %s", booking.booking_ref, exc)

        return True
    return False

