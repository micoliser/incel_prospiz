import uuid
import hmac
import hashlib
import json
import logging
import datetime
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
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
)
from .payments import (
    initialize_paystack_payment,
    initialize_flutterwave_payment,
    verify_paystack_transaction,
    verify_flutterwave_transaction,
    confirm_booking_payment,
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


class BookingCreateView(generics.CreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
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
    serializer_class = BookingDetailSerializer
    lookup_field = 'booking_ref'

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

        booking = None
        if ref:
            booking = Booking.objects.filter(booking_ref=ref).first()

        # 1. Paystack Verification
        if (ref and not flw_tx_id) or gateway == 'paystack':
            res = verify_paystack_transaction(ref)
            if res.get('verified'):
                if not booking:
                    raw_ref = res.get('reference') or ref
                    booking = Booking.objects.filter(booking_ref=raw_ref).first()
                if booking:
                    confirm_booking_payment(booking, payment_reference=ref)
                    return Response(BookingDetailSerializer(booking).data, status=status.HTTP_200_OK)
                return Response({'error': f'Booking reference {ref} not found on server.'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({
                    'error': res.get('error', 'Paystack payment verification failed or uncompleted.'),
                    'status': res.get('status', 'failed')
                }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Flutterwave Verification
        if flw_tx_id:
            res = verify_flutterwave_transaction(str(flw_tx_id))
            if res.get('verified'):
                tx_ref = res.get('reference') or ref
                if not booking and tx_ref:
                    booking = Booking.objects.filter(booking_ref=tx_ref).first()
                if booking:
                    confirm_booking_payment(booking, payment_reference=str(flw_tx_id))
                    return Response(BookingDetailSerializer(booking).data, status=status.HTTP_200_OK)
                return Response({'error': f'Booking for transaction {flw_tx_id} not found.'}, status=status.HTTP_404_NOT_FOUND)
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

        if computed_hash != paystack_signature:
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
                if booking:
                    confirm_booking_payment(booking, payment_reference=ref)

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class FlutterwaveWebhookView(APIView):
    """
    Receives Flutterwave webhook notifications.
    """
    def post(self, request, *args, **kwargs):
        verif_hash = request.headers.get('verif-hash')
        expected_hash = getattr(settings, 'FLUTTERWAVE_SECRET_HASH', '')

        if expected_hash and verif_hash != expected_hash:
            logger.warning("Invalid Flutterwave webhook hash detected.")
            return Response({'error': 'Invalid signature hash.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = request.data
        status_str = payload.get('status') or (payload.get('data') or {}).get('status')
        if status_str in ['successful', 'success']:
            tx_ref = payload.get('txRef') or payload.get('tx_ref') or (payload.get('data') or {}).get('tx_ref')
            flw_id = payload.get('id') or (payload.get('data') or {}).get('id')
            if tx_ref:
                booking = Booking.objects.filter(booking_ref=tx_ref).first()
                if booking:
                    confirm_booking_payment(booking, payment_reference=str(flw_id or tx_ref))

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)

