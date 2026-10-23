import uuid
import hmac
import hashlib
import json
import logging
import datetime
import requests
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from .models import Package, PromoCode, Booking, CampaignConfig
from .serializers import (
    PackageSerializer,
    PromoCodeValidateSerializer,
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingLookupSerializer,
)
from .payments import (
    initialize_paystack_payment,
    initialize_flutterwave_payment,
    verify_paystack_transaction,
    verify_flutterwave_transaction,
    confirm_booking_payment,
    validate_payment_amount_and_currency,
)

logger = logging.getLogger(__name__)


def expire_stale_pending_bookings():
    """
    Finds pending bookings whose hold window has elapsed,
    cancels them and atomically returns seats to inventory.
    """
    timeout_minutes = getattr(settings, 'BOOKING_HOLD_TIMEOUT_MINUTES', 30)
    cutoff = timezone.now() - datetime.timedelta(minutes=timeout_minutes)
    stale_bookings = list(Booking.objects.filter(payment_status='pending', created_at__lt=cutoff))
    count = 0
    for b in stale_bookings:
        if b.cancel_and_reallocate():
            count += 1
    return count


class PromoValidateRateThrottle(AnonRateThrottle):
    scope = 'promo_validate'
    rate = '10/minute'


class BookingCreateRateThrottle(AnonRateThrottle):
    scope = 'booking_create'
    rate = '10/minute'


class BookingLookupRateThrottle(AnonRateThrottle):
    scope = 'booking_lookup'
    rate = '15/minute'


class PaymentVerifyRateThrottle(AnonRateThrottle):
    scope = 'payment_verify'
    rate = '15/minute'


class PackageListView(generics.ListAPIView):
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageSerializer


class PackageDetailView(generics.RetrieveAPIView):
    queryset = Package.objects.filter(is_active=True)
    serializer_class = PackageSerializer

    def get_object(self):
        lookup = self.kwargs.get('id')
        try:
            val = uuid.UUID(str(lookup))
            return get_object_or_404(Package, id=val, is_active=True)
        except (ValueError, AttributeError):
            return get_object_or_404(Package, slug=lookup, is_active=True)


class PromoCodeValidateView(APIView):
    throttle_classes = [PromoValidateRateThrottle]
    def post(self, request, *args, **kwargs):
        serializer = PromoCodeValidateSerializer(data=request.data)
        if serializer.is_valid():
            promo = serializer.validated_data['code']
            return Response({
                'valid': True,
                'id': str(promo.id),
                'code': promo.code,
                'discountPct': promo.discount_pct,
            }, status=status.HTTP_200_OK)
        return Response({
            'valid': False,
            'error': serializer.errors.get('code', ['Invalid promo code'])[0],
        }, status=status.HTTP_400_BAD_REQUEST)


class CampaignStatsView(APIView):
    def get(self, request, *args, **kwargs):
        # Automatically clean up any stale pending bookings before calculating capacity
        expire_stale_pending_bookings()

        cfg = CampaignConfig.get_settings()

        # Calculate early bird claims: baseline + actual bookings with early bird code
        early_bird_booked_actual = Booking.objects.filter(
            promo_code__iexact=cfg.early_bird_code
        ).aggregate(total=models.Sum('guest_count'))['total'] or 0

        total_claimed = cfg.early_bird_baseline_claimed + early_bird_booked_actual
        claimed = min(cfg.early_bird_cap, total_claimed)
        remaining = max(0, cfg.early_bird_cap - claimed)

        now = timezone.now()
        is_early_bird_active = cfg.is_active and remaining > 0 and now < cfg.early_bird_deadline

        # Aggregate global capacity across all active packages
        package_stats = Package.objects.filter(is_active=True).aggregate(
            total_capacity=models.Sum('max_seats'),
            total_booked=models.Sum('seats_booked'),
        )
        total_capacity = package_stats['total_capacity'] or 0
        total_booked = package_stats['total_booked'] or 0
        total_remaining = max(0, total_capacity - total_booked)

        return Response({
            'earlyBird': {
                'code': cfg.early_bird_code,
                'discountPct': cfg.early_bird_discount_pct,
                'totalCap': cfg.early_bird_cap,
                'claimed': claimed,
                'remaining': remaining,
                'deadline': cfg.early_bird_deadline.isoformat(),
                'isActive': is_early_bird_active,
            },
            'globalCap': {
                'perPackageCap': cfg.per_package_cap,
                'totalCapacity': total_capacity,
                'totalBooked': total_booked,
                'totalRemaining': total_remaining,
            },
            'eventDates': {
                'start': cfg.event_start_date.isoformat(),
                'end': cfg.event_end_date.isoformat(),
                'display': '13–30 December 2026',
            },
            'exchangeRates': {
                'USD': float(cfg.usd_to_ngn_rate),
                'GBP': float(cfg.gbp_to_ngn_rate),
            }
        }, status=status.HTTP_200_OK)


def verify_turnstile_token(token: str, remote_ip: str = None) -> tuple[bool, str]:
    """
    Verifies a Cloudflare Turnstile token via Cloudflare's siteverify API.
    Every token is checked with Cloudflare (NEW-02: no hardcoded bypass tokens).
    For local dev, use Cloudflare's universal test secret, which Cloudflare itself always passes.
    """
    secret = getattr(settings, 'TURNSTILE_SECRET_KEY', '')
    if not secret:
        if settings.DEBUG:
            return True, ""
        logger.error("TURNSTILE_SECRET_KEY is not configured; rejecting booking (fail closed).")
        return False, "Security verification is temporarily unavailable. Please try again later."

    # Normalize universal test secret key to Cloudflare's official test secret
    if secret.startswith('1x0000000000000000000000000000000'):
        secret = '1x0000000000000000000000000000000AA'

    if not token:
        return False, "Security verification token is missing. Please complete the security check."

    try:
        payload = {
            'secret': secret,
            'response': token,
        }
        # Only include remoteip if it is a public IP (Cloudflare rejects private/loopback IPs like 127.0.0.1)
        if remote_ip and not (remote_ip.startswith('127.') or remote_ip.startswith('192.168.') or remote_ip.startswith('10.') or remote_ip in ('localhost', '::1')):
            payload['remoteip'] = remote_ip

        resp = requests.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data=payload,
            timeout=8,
        )
        data = resp.json()
        if data.get('success'):
            return True, ""
        error_codes = data.get('error-codes', [])
        logger.warning("Turnstile verification failed: %s", error_codes)
        return False, "Security verification failed. Please try again."
    except Exception as exc:
        logger.exception("Error verifying Turnstile token: %s", exc)
        if settings.DEBUG:
            return True, ""
        return False, "Security verification temporarily unavailable. Please try again."


class BookingCreateView(generics.CreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer
    throttle_classes = [BookingCreateRateThrottle]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # 1. Honeypot check (Pillar 2)
        honeypot = request.data.get('website_url') or request.data.get('honeypot')
        if honeypot:
            logger.warning("Bot honeypot triggered on booking creation: %s", honeypot)
            return Response({'error': 'Invalid request submission.'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Cloudflare Turnstile CAPTCHA verification
        turnstile_token = request.data.get('captchaToken') or request.data.get('turnstileToken')
        require_turnstile = getattr(settings, 'TURNSTILE_REQUIRED', not settings.DEBUG)
        if turnstile_token or require_turnstile:
            client_ip = request.META.get('REMOTE_ADDR')
            is_valid_captcha, captcha_err = verify_turnstile_token(turnstile_token, remote_ip=client_ip)
            if not is_valid_captcha:
                return Response({'error': captcha_err}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Automatically flush stale pending holds so expired seats return to inventory (Pillar 4)
        expire_stale_pending_bookings()

        # 4. Check active pending booking cap per email and phone (Pillar 1)
        email = (request.data.get('email') or '').strip().lower()
        phone = (request.data.get('phone') or '').strip()
        if email or phone:
            active_holds = Booking.objects.filter(payment_status='pending').filter(
                models.Q(email__iexact=email) | models.Q(phone=phone)
            )
            for pending_b in active_holds:
                if pending_b.is_hold_expired:
                    pending_b.cancel_and_reallocate()
                else:
                    return Response({
                        'error': f"You already have an active reservation holding seats (Ref: {pending_b.booking_ref}). "
                                 f"Please complete payment for your existing reservation or wait for your hold timer to expire before reserving additional seats.",
                        'existingBookingRef': pending_b.booking_ref,
                    }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        guest_count = serializer.validated_data.get('guest_count', 1)
        selected_package_ids = serializer.validated_data.get('selected_packages', [])

        # Validate overbooking before creating booking
        uuid_ids = []
        slug_ids = []
        for item in selected_package_ids:
            try:
                uuid_ids.append(uuid.UUID(str(item)))
            except (ValueError, TypeError, AttributeError):
                slug_ids.append(str(item))

        locked_pkgs = list(Package.objects.select_for_update().filter(
            models.Q(id__in=uuid_ids) | models.Q(slug__in=slug_ids),
            is_active=True
        ))

        # If any selected package is a bundle (e.g. All-Inclusive VIP),
        # all individual excursion packages are included and must also be locked and checked!
        has_bundle = any(pkg.category == 'bundle' for pkg in locked_pkgs)
        if has_bundle:
            excursion_pkgs = list(Package.objects.select_for_update().filter(
                category='excursion',
                is_active=True
            ))
            locked_ids = {p.id for p in locked_pkgs}
            for ep in excursion_pkgs:
                if ep.id not in locked_ids:
                    locked_pkgs.append(ep)
                    locked_ids.add(ep.id)

        for pkg in locked_pkgs:
            if pkg.seats_booked + guest_count > pkg.max_seats:
                if pkg.category == 'bundle':
                    msg = f"The VIP bundle '{pkg.name}' is sold out (only {pkg.seats_remaining} seats remaining)."
                else:
                    msg = f"Cannot complete booking: Excursion '{pkg.name}' is sold out or does not have enough capacity (only {pkg.seats_remaining} seats remaining)."
                return Response({
                    'error': msg
                }, status=status.HTTP_400_BAD_REQUEST)

        booking = serializer.save()

        # Update package booked seat counts atomically:
        # If a bundle was booked, locked_pkgs includes both the bundle (for VIP sales tracking)
        # and all included excursion packages (updating their physical seats booked).
        for pkg in locked_pkgs:
            Package.objects.filter(id=pkg.id).update(
                seats_booked=models.F('seats_booked') + guest_count
            )

        # Initialize Payment Gateway Redirect URL if Paystack or Flutterwave
        callback_url = request.data.get('callbackUrl')
        if booking.payment_method == 'paystack':
            init_res = initialize_paystack_payment(booking, callback_url=callback_url)
            if not init_res.get('status'):
                logger.warning("Could not initialize Paystack redirect for %s: %s", booking.booking_ref, init_res.get('error'))
        elif booking.payment_method == 'flutterwave':
            init_res = initialize_flutterwave_payment(booking, redirect_url=callback_url)
            if not init_res.get('status'):
                logger.warning("Could not initialize Flutterwave redirect for %s: %s", booking.booking_ref, init_res.get('error'))

        # Refresh from DB to include updated payment_url and payment_reference
        booking.refresh_from_db()
        response_serializer = BookingDetailSerializer(booking)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class BookingDetailView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingLookupSerializer
    lookup_field = 'booking_ref'
    throttle_classes = [BookingLookupRateThrottle]

    def get_object(self):
        booking_ref = self.kwargs.get(self.lookup_field, '').strip()
        booking = Booking.objects.filter(booking_ref__iexact=booking_ref).first()
        if not booking:
            raise Http404(f"Booking reference '{booking_ref}' not found.")
        # If pending and the hold period has expired, cancel and release seats
        if booking.payment_status == 'pending' and booking.is_hold_expired:
            booking.cancel_and_reallocate()
            booking.refresh_from_db()
        elif booking.payment_status == 'pending':
            # If payment_url is empty for online gateway, automatically generate a fresh checkout URL
            method = booking.payment_method
            if method == 'card':
                method = 'flutterwave' if booking.currency in ['USD', 'GBP'] else 'paystack'
            if method in ['paystack', 'flutterwave'] and not booking.payment_url:
                try:
                    if method == 'paystack':
                        initialize_paystack_payment(booking)
                    elif method == 'flutterwave':
                        initialize_flutterwave_payment(booking)
                    booking.refresh_from_db()
                except Exception as exc:
                    logger.warning("Auto-init payment_url on detail view failed for %s: %s", booking.booking_ref, exc)
        return booking


class BookingPayView(APIView):
    """
    Returns or re-generates an online payment redirect checkout URL for an active pending booking
    using the payment method that was originally chosen for the reservation.
    """
    throttle_classes = [BookingLookupRateThrottle]
    def post(self, request, booking_ref):
        booking_ref = booking_ref.strip()
        booking = Booking.objects.filter(booking_ref__iexact=booking_ref).first()
        if not booking:
            return Response({'error': f"Booking '{booking_ref}' not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.payment_status == 'paid':
            return Response({'error': "This booking has already been paid.", 'paid': True}, status=status.HTTP_400_BAD_REQUEST)

        if booking.is_hold_expired or booking.payment_status == 'cancelled':
            if booking.payment_status != 'cancelled':
                booking.cancel_and_reallocate()
                booking.refresh_from_db()
            return Response({'error': "Seat hold has expired and reservation was cancelled.", 'expired': True}, status=status.HTTP_400_BAD_REQUEST)

        # If booking already has a valid payment_url, return it
        if booking.payment_url:
            return Response({
                'bookingRef': booking.booking_ref,
                'checkoutUrl': booking.payment_url,
                'paymentMethod': booking.payment_method,
            }, status=status.HTTP_200_OK)

        callback_url = request.data.get('callbackUrl')

        # Generate fresh checkout URL for the booking's own payment method
        method = booking.payment_method
        if method == 'card':
            method = 'flutterwave' if booking.currency in ['USD', 'GBP'] else 'paystack'

        if method == 'paystack':
            res = initialize_paystack_payment(booking, callback_url=callback_url)
            if not res.get('status'):
                return Response({'error': res.get('error', 'Unable to connect to Paystack.')}, status=status.HTTP_502_BAD_GATEWAY)
        elif method == 'flutterwave':
            res = initialize_flutterwave_payment(booking, redirect_url=callback_url)
            if not res.get('status'):
                return Response({'error': res.get('error', 'Unable to connect to Flutterwave.')}, status=status.HTTP_502_BAD_GATEWAY)
        else:
            return Response({'error': f"Payment method '{booking.payment_method}' does not support online card checkout."}, status=status.HTTP_400_BAD_REQUEST)

        booking.refresh_from_db()
        return Response({
            'bookingRef': booking.booking_ref,
            'checkoutUrl': booking.payment_url,
            'paymentMethod': booking.payment_method,
        }, status=status.HTTP_200_OK)


class PaymentVerifyView(APIView):
    """
    Verifies a Paystack or Flutterwave transaction and confirms the booking.
    Called when user is redirected back to /booking/verify?reference=... or ?tx_ref=...
    """
    throttle_classes = [PaymentVerifyRateThrottle]
    def get(self, request, *args, **kwargs):
        ref = (
            request.query_params.get('reference')
            or request.query_params.get('trxref')
            or request.query_params.get('tx_ref')
        )
        flw_tx_id = request.query_params.get('transaction_id')
        gateway = request.query_params.get('gateway')

        if not ref and not flw_tx_id:
            return Response({'error': 'Missing transaction reference or transaction_id.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Paystack Verification
        if (ref and not flw_tx_id) or gateway == 'paystack':
            res = verify_paystack_transaction(ref)
            if res.get('verified'):
                # NEW-01: The verified transaction must belong to the booking being confirmed
                gw_ref = res.get('reference') or ref
                if ref and gw_ref != ref:
                    logger.warning("Paystack transaction reference mismatch: requested %s, gateway returned %s", ref, gw_ref)
                    return Response({'error': 'This transaction does not belong to this booking.'}, status=status.HTTP_400_BAD_REQUEST)
                booking = Booking.objects.filter(booking_ref=gw_ref).first()
                if not booking:
                    return Response({'error': f'Booking reference {ref} not found on server.'}, status=status.HTTP_404_NOT_FOUND)

                # Cross-validate verified amount and currency against expected booking total (CRITICAL-02)
                raw_tx = res.get('raw') or {}
                is_valid, err_msg = validate_payment_amount_and_currency(
                    booking=booking,
                    gateway='paystack',
                    amount=res.get('amount'),
                    currency=res.get('currency'),
                    fees=raw_tx.get('fees'),
                    requested_amount=raw_tx.get('requested_amount'),
                )
                if not is_valid:
                    logger.warning("Paystack verification amount/currency mismatch for %s: %s", booking.booking_ref, err_msg)
                    return Response({
                        'error': f'Payment verification failed: {err_msg}',
                        'status': 'mismatch'
                    }, status=status.HTTP_400_BAD_REQUEST)

                confirm_booking_payment(booking, payment_reference=gw_ref)
                if booking.payment_status != 'paid':
                    return Response({'error': 'This transaction has already been used for another booking.'}, status=status.HTTP_400_BAD_REQUEST)
                return Response(BookingLookupSerializer(booking).data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': res.get('error', 'Paystack payment verification failed or uncompleted.'),
                    'status': res.get('status', 'failed')
                }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Flutterwave Verification
        if flw_tx_id:
            res = verify_flutterwave_transaction(str(flw_tx_id))
            if res.get('verified'):
                # NEW-01: Always resolve the booking from the gateway-verified tx_ref, never from the
                # client-supplied ref alone, otherwise one payment could confirm a different booking.
                tx_ref = res.get('reference')
                if not tx_ref:
                    return Response({'error': 'Verified transaction has no booking reference.'}, status=status.HTTP_400_BAD_REQUEST)
                if ref and tx_ref != ref:
                    logger.warning("Flutterwave transaction %s belongs to %s, not %s (possible replay).", flw_tx_id, tx_ref, ref)
                    return Response({'error': 'This transaction does not belong to this booking.'}, status=status.HTTP_400_BAD_REQUEST)
                booking = Booking.objects.filter(booking_ref=tx_ref).first()
                if not booking:
                    return Response({'error': f'Booking for transaction {flw_tx_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

                # Cross-validate verified amount and currency against expected booking total (CRITICAL-02)
                raw_tx = res.get('raw') or {}
                is_valid, err_msg = validate_payment_amount_and_currency(
                    booking=booking,
                    gateway='flutterwave',
                    amount=res.get('amount'),
                    currency=res.get('currency'),
                    fees=raw_tx.get('app_fee'),
                    settled_amount=raw_tx.get('amount_settled'),
                )
                if not is_valid:
                    logger.warning("Flutterwave verification amount/currency mismatch for %s: %s", booking.booking_ref, err_msg)
                    return Response({
                        'error': f'Payment verification failed: {err_msg}',
                        'status': 'mismatch'
                    }, status=status.HTTP_400_BAD_REQUEST)

                confirm_booking_payment(booking, payment_reference=str(flw_tx_id))
                if booking.payment_status != 'paid':
                    return Response({'error': 'This transaction has already been used for another booking.'}, status=status.HTTP_400_BAD_REQUEST)
                return Response(BookingLookupSerializer(booking).data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': res.get('error', 'Flutterwave verification failed or uncompleted.'),
                    'status': res.get('status', 'failed')
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response({'error': 'Unable to verify payment with provided parameters.'}, status=status.HTTP_400_BAD_REQUEST)


class PaystackWebhookView(APIView):
    """
    Receives Paystack webhook notifications.
    """
    throttle_classes = []  # Exempt webhooks from rate limiting
    def post(self, request, *args, **kwargs):
        paystack_signature = request.headers.get('x-paystack-signature')
        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')

        if not paystack_signature or not secret_key:
            return Response({'error': 'Missing signature or configuration.'}, status=status.HTTP_400_BAD_REQUEST)

        raw_body = request.body
        computed_hash = hmac.new(
            secret_key.encode('utf-8'),
            raw_body,
            hashlib.sha512
        ).hexdigest()

        # Timing-safe signature comparison
        if not hmac.compare_digest(computed_hash, paystack_signature):
            logger.warning("Invalid Paystack webhook signature detected.")
            return Response({'error': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = json.loads(raw_body.decode('utf-8'))
        except Exception:
            payload = request.data

        event = payload.get('event')
        if event == 'charge.success':
            data = payload.get('data', {})
            ref = data.get('reference')
            if ref:
                booking = Booking.objects.filter(booking_ref=ref).first()
                if not booking:
                    logger.warning("Paystack webhook received for non-existent booking: %s", ref)
                    return Response({'error': f"Booking '{ref}' not found."}, status=status.HTTP_404_NOT_FOUND)

                # Validate amount & currency from webhook data (CRITICAL-02)
                is_valid, err_msg = validate_payment_amount_and_currency(
                    booking=booking,
                    gateway='paystack',
                    amount=data.get('amount'),
                    currency=data.get('currency'),
                    fees=data.get('fees'),
                    requested_amount=data.get('requested_amount'),
                )
                if not is_valid:
                    logger.warning("Paystack webhook amount mismatch for %s: %s", booking.booking_ref, err_msg)
                    return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

                confirm_booking_payment(booking, payment_reference=ref)
            else:
                logger.warning("Paystack webhook charge.success missing reference in payload.")
                return Response({'error': 'Missing transaction reference in payload.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class FlutterwaveWebhookView(APIView):
    """
    Receives Flutterwave webhook notifications.
    """
    throttle_classes = []  # Exempt webhooks from rate limiting
    def post(self, request, *args, **kwargs):
        verif_hash = request.headers.get('verif-hash')
        expected_hash = getattr(settings, 'FLUTTERWAVE_SECRET_HASH', '')

        # CRITICAL-01: Reject if secret hash is not configured, or if signature is missing/invalid
        if not expected_hash:
            logger.error("FLUTTERWAVE_SECRET_HASH is not configured on the server.")
            return Response({'error': 'Webhook signature configuration error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Timing-safe signature comparison
        if not verif_hash or not hmac.compare_digest(verif_hash, expected_hash):
            logger.warning("Invalid Flutterwave webhook hash detected.")
            return Response({'error': 'Invalid signature hash.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data
        status_str = payload.get('status') or (payload.get('data') or {}).get('status')
        if status_str in ['successful', 'success']:
            data = payload.get('data') or payload
            tx_ref = data.get('txRef') or data.get('tx_ref') or payload.get('txRef') or payload.get('tx_ref')
            flw_id = data.get('id') or payload.get('id')
            if tx_ref:
                booking = Booking.objects.filter(booking_ref=tx_ref).first()
                if not booking:
                    logger.warning("Flutterwave webhook received for non-existent booking: %s", tx_ref)
                    return Response({'error': f"Booking '{tx_ref}' not found."}, status=status.HTTP_404_NOT_FOUND)

                # Validate amount and currency if present in webhook payload (CRITICAL-02)
                paid_amount = data.get('amount') or payload.get('amount')
                paid_currency = data.get('currency') or payload.get('currency')
                if paid_amount is not None:
                    is_valid, err_msg = validate_payment_amount_and_currency(
                        booking=booking,
                        gateway='flutterwave',
                        amount=paid_amount,
                        currency=paid_currency,
                        fees=data.get('app_fee') or payload.get('app_fee'),
                        settled_amount=data.get('amount_settled') or payload.get('amount_settled'),
                    )
                    if not is_valid:
                        logger.warning("Flutterwave webhook amount mismatch for %s: %s", booking.booking_ref, err_msg)
                        return Response({'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

                confirm_booking_payment(booking, payment_reference=str(flw_id or tx_ref))
            else:
                logger.warning("Flutterwave webhook successful charge missing txRef in payload.")
                return Response({'error': 'Missing transaction reference in payload.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)

