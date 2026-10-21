import uuid
import random
import string
import datetime
from django.db import models, transaction
from django.utils import timezone
from django.conf import settings


class Package(models.Model):
    CATEGORY_CHOICES = [
        ('bundle', 'Bundle'),
        ('excursion', 'Excursion'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(max_length=64, unique=True, help_text="Human-readable identifier")
    name = models.CharField(max_length=255)
    tagline = models.CharField(max_length=500, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='excursion')
    price_ngn = models.PositiveIntegerField(help_text="Price in Nigerian Naira (NGN)")
    price_foreigner_ngn = models.PositiveIntegerField(null=True, blank=True, help_text="Foreigner tier price in NGN (optional)")
    image = models.CharField(max_length=500)
    duration = models.CharField(max_length=100)
    dates = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    max_seats = models.PositiveIntegerField(default=100)
    seats_booked = models.PositiveIntegerField(default=0)
    highlight_badge = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField()
    inclusions = models.JSONField(default=list, help_text="List of string items included in the package")
    transport_details = models.CharField(max_length=500, blank=True)
    security_details = models.CharField(max_length=500, blank=True)
    refreshments = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'price_ngn']

    def __str__(self):
        return f"{self.name} (₦{self.price_ngn:,})"

    @property
    def seats_remaining(self):
        own_remaining = max(0, self.max_seats - self.seats_booked)
        if self.category == 'bundle':
            # For bundle, capacity is strictly bounded by the excursion with the lowest remaining seats
            excursions = Package.objects.filter(category='excursion', is_active=True)
            if excursions.exists():
                min_excursion_remaining = min(
                    (max(0, p.max_seats - p.seats_booked) for p in excursions),
                    default=0
                )
                return min(own_remaining, min_excursion_remaining)
        return own_remaining


class PromoCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    discount_pct = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_pct}% off)"


class CampaignConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    early_bird_code = models.CharField(max_length=50, default='EARLYBIRD5', help_text="Promo code used for early bird claims")
    early_bird_discount_pct = models.PositiveIntegerField(default=5)
    early_bird_cap = models.PositiveIntegerField(default=20, help_text="Total allocation of early bird seats")
    early_bird_baseline_claimed = models.PositiveIntegerField(default=18, help_text="Starting baseline claimed count")
    early_bird_deadline = models.DateTimeField(help_text="Deadline for early bird discount")
    event_start_date = models.DateTimeField(help_text="Main event start datetime")
    event_end_date = models.DateTimeField(help_text="Main event end datetime")
    per_package_cap = models.PositiveIntegerField(default=100)
    usd_to_ngn_rate = models.DecimalField(max_digits=10, decimal_places=2, default=1600.00, help_text="Fixed exchange rate: 1 USD in NGN (e.g. 1600.00)")
    gbp_to_ngn_rate = models.DecimalField(max_digits=10, decimal_places=2, default=2050.00, help_text="Fixed exchange rate: 1 GBP in NGN (e.g. 2050.00)")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Campaign Configuration"
        verbose_name_plural = "Campaign Configuration"

    def __str__(self):
        return f"Campaign Settings ({self.early_bird_code})"

    @classmethod
    def get_settings(cls):
        from django.utils import timezone
        import datetime
        cfg = cls.objects.first()
        if not cfg:
            tz = timezone.get_current_timezone()
            deadline = timezone.make_aware(datetime.datetime(2026, 11, 15, 23, 59, 59), tz)
            start_dt = timezone.make_aware(datetime.datetime(2026, 12, 13, 9, 0, 0), tz)
            end_dt = timezone.make_aware(datetime.datetime(2026, 12, 30, 23, 59, 59), tz)
            cfg = cls.objects.create(
                early_bird_code='EARLYBIRD5',
                early_bird_discount_pct=5,
                early_bird_cap=20,
                early_bird_baseline_claimed=18,
                early_bird_deadline=deadline,
                event_start_date=start_dt,
                event_end_date=end_dt,
                per_package_cap=100,
                usd_to_ngn_rate=1600.00,
                gbp_to_ngn_rate=2050.00,
            )
        return cfg


class Booking(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('paystack', 'Paystack'),
        ('flutterwave', 'Flutterwave'),
        ('whatsapp', 'WhatsApp Booking / Direct Wire'),
        ('card', 'Online Card'),
        ('transfer', 'Bank Transfer'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_ref = models.CharField(max_length=30, unique=True, editable=False)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    country = models.CharField(max_length=100, default='UK')
    guest_count = models.PositiveIntegerField(default=1)
    is_foreigner = models.BooleanField(default=False)
    
    selected_packages = models.JSONField(help_text="List of package IDs/slugs selected")
    
    subtotal_ngn = models.PositiveIntegerField(default=0)
    group_discount_pct = models.PositiveIntegerField(default=0, help_text="Group discount percentage (e.g. 5)")
    group_discount_ngn = models.PositiveIntegerField(default=0)
    promo_code = models.CharField(max_length=50, blank=True, null=True)
    promo_discount_pct = models.PositiveIntegerField(default=0, help_text="Promo voucher discount percentage")
    promo_discount_ngn = models.PositiveIntegerField(default=0)
    final_total_ngn = models.PositiveIntegerField(default=0)
    
    currency = models.CharField(max_length=10, default='NGN')
    converted_total = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, help_text="Total in chosen foreign currency (USD or GBP)")
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='card')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_reference = models.CharField(max_length=150, blank=True, null=True, db_index=True, help_text="Gateway transaction reference / tx_ref")
    payment_url = models.URLField(max_length=600, blank=True, null=True, help_text="Hosted redirect checkout URL")
    paid_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp when payment was confirmed")
    
    special_requests = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.booking_ref:
            # Generate reference like DL-2026-7841
            random_suffix = ''.join(random.choices(string.digits, k=4))
            self.booking_ref = f"DL-2026-{random_suffix}"
            while Booking.objects.filter(booking_ref=self.booking_ref).exists():
                random_suffix = ''.join(random.choices(string.digits, k=4))
                self.booking_ref = f"DL-2026-{random_suffix}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_ref} - {self.full_name} ({self.payment_status})"

    @property
    def hold_expires_at(self):
        timeout_minutes = getattr(settings, 'BOOKING_HOLD_TIMEOUT_MINUTES', 30)
        if not self.created_at:
            return timezone.now() + datetime.timedelta(minutes=timeout_minutes)
        return self.created_at + datetime.timedelta(minutes=timeout_minutes)

    @property
    def is_hold_expired(self):
        if self.payment_status == 'paid':
            return False
        return timezone.now() > self.hold_expires_at

    @property
    def seconds_remaining(self):
        if self.payment_status == 'paid':
            return 0
        diff = (self.hold_expires_at - timezone.now()).total_seconds()
        return max(0, int(diff))

    def cancel_and_reallocate(self):
        """
        Cancels a pending booking and returns held seats back to package availability.
        Returns True if cancelled and reallocated, False otherwise.
        """
        if self.payment_status != 'pending':
            return False

        with transaction.atomic():
            locked = Booking.objects.select_for_update().filter(id=self.id).first()
            if not locked or locked.payment_status != 'pending':
                return False

            guest_count = locked.guest_count
            selected_package_ids = locked.selected_packages or []

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
                new_booked = max(0, pkg.seats_booked - guest_count)
                Package.objects.filter(id=pkg.id).update(seats_booked=new_booked)

            locked.payment_status = 'cancelled'
            locked.save(update_fields=['payment_status', 'updated_at'])
            self.payment_status = 'cancelled'
            return True
