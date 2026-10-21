import uuid
from rest_framework import serializers
from django.db import models
from .models import Package, PromoCode, Booking, CampaignConfig


class PackageSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    slug = serializers.CharField()
    priceNGN = serializers.IntegerField(source='price_ngn')
    priceForeignerNGN = serializers.IntegerField(source='price_foreigner_ngn', required=False, allow_null=True)
    maxSeats = serializers.IntegerField(source='max_seats')
    seatsBooked = serializers.IntegerField(source='seats_booked')
    seatsRemaining = serializers.IntegerField(source='seats_remaining', read_only=True)
    highlightBadge = serializers.CharField(source='highlight_badge', required=False, allow_null=True, allow_blank=True)
    transportDetails = serializers.CharField(source='transport_details', required=False, allow_blank=True)
    securityDetails = serializers.CharField(source='security_details', required=False, allow_blank=True)

    class Meta:
        model = Package
        fields = [
            'id',
            'slug',
            'name',
            'tagline',
            'category',
            'priceNGN',
            'priceForeignerNGN',
            'image',
            'duration',
            'dates',
            'location',
            'maxSeats',
            'seatsBooked',
            'seatsRemaining',
            'highlightBadge',
            'description',
            'inclusions',
            'transportDetails',
            'securityDetails',
            'refreshments',
            'is_active',
        ]


class PromoCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)

    def validate_code(self, value):
        cleaned = value.strip().upper()
        try:
            promo = PromoCode.objects.get(code__iexact=cleaned, is_active=True)
            return promo
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired promo code.")


class BookingCreateSerializer(serializers.ModelSerializer):
    fullName = serializers.CharField(source='full_name')
    guestCount = serializers.IntegerField(source='guest_count', min_value=1)
    isForeigner = serializers.BooleanField(source='is_foreigner', default=False)
    selectedPackages = serializers.ListField(
        child=serializers.CharField(),
        source='selected_packages',
        allow_empty=False
    )
    paymentMethod = serializers.ChoiceField(
        choices=Booking.PAYMENT_METHOD_CHOICES,
        source='payment_method',
        default='card'
    )
    promoCode = serializers.CharField(
        source='promo_code',
        required=False,
        allow_blank=True,
        allow_null=True
    )
    specialRequests = serializers.CharField(
        source='special_requests',
        required=False,
        allow_blank=True
    )

    def validate_selectedPackages(self, value):
        if not value:
            raise serializers.ValidationError("Please select at least one package or excursion.")
        uuid_ids = []
        slug_ids = []
        for item in value:
            try:
                uuid_ids.append(uuid.UUID(str(item)))
            except (ValueError, TypeError, AttributeError):
                slug_ids.append(str(item))

        packages = Package.objects.filter(
            models.Q(id__in=uuid_ids) | models.Q(slug__in=slug_ids),
            is_active=True
        )
        if not packages.exists():
            raise serializers.ValidationError("None of the selected packages are valid or active.")
        return value

    def validate_promoCode(self, value):
        if value:
            cleaned = value.strip().upper()
            if not PromoCode.objects.filter(code__iexact=cleaned, is_active=True).exists():
                raise serializers.ValidationError(f"Promo code '{value}' is invalid or expired.")
            return cleaned
        return value

    class Meta:
        model = Booking
        fields = [
            'fullName',
            'email',
            'phone',
            'country',
            'guestCount',
            'isForeigner',
            'selectedPackages',
            'currency',
            'promoCode',
            'paymentMethod',
            'specialRequests',
        ]

    def create(self, validated_data):
        selected_package_ids = validated_data.get('selected_packages', [])
        guest_count = validated_data.get('guest_count', 1)
        is_foreigner = validated_data.get('is_foreigner', False)
        promo_code_str = validated_data.get('promo_code', '')

        # Resolve packages either by UUID or by slug
        uuid_ids = []
        slug_ids = []
        for item in selected_package_ids:
            try:
                uuid_ids.append(uuid.UUID(str(item)))
            except (ValueError, TypeError, AttributeError):
                slug_ids.append(str(item))

        packages = Package.objects.filter(
            models.Q(id__in=uuid_ids) | models.Q(slug__in=slug_ids),
            is_active=True
        )
        pkg_map = {}
        for p in packages:
            pkg_map[str(p.id)] = p
            pkg_map[p.slug] = p

        # Calculate subtotal
        subtotal = 0
        resolved_package_slugs = []
        for item in selected_package_ids:
            pkg = pkg_map.get(str(item))
            if not pkg:
                continue
            resolved_package_slugs.append(pkg.slug)
            unit_price = pkg.price_ngn
            if pkg.slug == 'badagry-heritage' and is_foreigner and pkg.price_foreigner_ngn:
                unit_price = pkg.price_foreigner_ngn
            subtotal += unit_price * guest_count

        # Group discount: 5% for 4 or more guests
        group_discount_pct = 5 if guest_count >= 4 else 0
        group_discount = round(subtotal * (group_discount_pct / 100)) if group_discount_pct > 0 else 0

        # Promo discount
        promo_discount_pct = 0
        promo_discount = 0
        if promo_code_str:
            promo = PromoCode.objects.filter(code__iexact=promo_code_str.strip(), is_active=True).first()
            if promo:
                promo_discount_pct = promo.discount_pct
                promo_discount = round((subtotal - group_discount) * (promo_discount_pct / 100))

        final_total = max(0, subtotal - group_discount - promo_discount)

        currency = validated_data.get('currency', 'NGN')
        converted_total = None
        exchange_rate = None
        if currency in ['USD', 'GBP']:
            cfg = CampaignConfig.get_settings()
            rate = float(cfg.usd_to_ngn_rate) if currency == 'USD' else float(cfg.gbp_to_ngn_rate)
            if rate > 0:
                converted_total = round(final_total / rate, 2)
                exchange_rate = rate

        booking = Booking.objects.create(
            full_name=validated_data['full_name'],
            email=validated_data['email'],
            phone=validated_data['phone'],
            country=validated_data.get('country', 'UK'),
            guest_count=guest_count,
            is_foreigner=is_foreigner,
            selected_packages=resolved_package_slugs or selected_package_ids,
            subtotal_ngn=subtotal,
            group_discount_pct=group_discount_pct,
            group_discount_ngn=group_discount,
            promo_code=promo_code_str.strip().upper() if promo_code_str else None,
            promo_discount_pct=promo_discount_pct,
            promo_discount_ngn=promo_discount,
            final_total_ngn=final_total,
            currency=currency,
            converted_total=converted_total,
            exchange_rate=exchange_rate,
            payment_method=validated_data.get('payment_method', 'card'),
            special_requests=validated_data.get('special_requests', ''),
            payment_status='pending',
        )

        return booking


class BookingDetailSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    fullName = serializers.CharField(source='full_name')
    bookingRef = serializers.CharField(source='booking_ref')
    guestCount = serializers.IntegerField(source='guest_count')
    isForeigner = serializers.BooleanField(source='is_foreigner')
    selectedPackages = serializers.JSONField(source='selected_packages')
    subtotalNGN = serializers.IntegerField(source='subtotal_ngn')
    groupDiscountPct = serializers.IntegerField(source='group_discount_pct')
    groupDiscountNGN = serializers.IntegerField(source='group_discount_ngn')
    promoCode = serializers.CharField(source='promo_code', allow_null=True)
    promoDiscountPct = serializers.IntegerField(source='promo_discount_pct')
    promoDiscountNGN = serializers.IntegerField(source='promo_discount_ngn')
    finalTotalNGN = serializers.IntegerField(source='final_total_ngn')
    convertedSubtotal = serializers.FloatField(source='converted_subtotal', read_only=True)
    convertedGroupDiscount = serializers.FloatField(source='converted_group_discount', read_only=True)
    convertedPromoDiscount = serializers.FloatField(source='converted_promo_discount', read_only=True)
    convertedTotalSavings = serializers.FloatField(source='converted_total_savings', read_only=True)
    convertedTotal = serializers.DecimalField(source='converted_total', max_digits=12, decimal_places=2, allow_null=True, required=False)
    exchangeRate = serializers.FloatField(source='effective_exchange_rate', read_only=True)
    paymentMethod = serializers.CharField(source='payment_method')
    paymentStatus = serializers.CharField(source='payment_status')
    paymentReference = serializers.CharField(source='payment_reference', allow_null=True, required=False)
    specialRequests = serializers.CharField(source='special_requests', allow_blank=True, required=False)
    checkoutUrl = serializers.CharField(source='payment_url', allow_null=True, required=False)
    paidAt = serializers.DateTimeField(source='paid_at', allow_null=True, required=False)
    createdAt = serializers.DateTimeField(source='created_at')
    expiresAt = serializers.SerializerMethodField()
    isExpired = serializers.SerializerMethodField()
    secondsRemaining = serializers.SerializerMethodField()
    packageDetails = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id',
            'bookingRef',
            'fullName',
            'email',
            'phone',
            'country',
            'guestCount',
            'isForeigner',
            'selectedPackages',
            'packageDetails',
            'subtotalNGN',
            'groupDiscountPct',
            'groupDiscountNGN',
            'promoCode',
            'promoDiscountPct',
            'promoDiscountNGN',
            'finalTotalNGN',
            'convertedSubtotal',
            'convertedGroupDiscount',
            'convertedPromoDiscount',
            'convertedTotalSavings',
            'convertedTotal',
            'exchangeRate',
            'currency',
            'paymentMethod',
            'paymentStatus',
            'paymentReference',
            'checkoutUrl',
            'paidAt',
            'specialRequests',
            'createdAt',
            'expiresAt',
            'isExpired',
            'secondsRemaining',
        ]

    def get_expiresAt(self, obj):
        if obj.created_at:
            return obj.hold_expires_at.isoformat()
        return None

    def get_isExpired(self, obj):
        return obj.is_hold_expired

    def get_secondsRemaining(self, obj):
        return obj.seconds_remaining

    def get_packageDetails(self, obj):
        raw_pkgs = obj.selected_packages or []
        uuid_ids = []
        slug_ids = []
        for item in raw_pkgs:
            try:
                uuid_ids.append(uuid.UUID(str(item)))
            except (ValueError, TypeError, AttributeError):
                slug_ids.append(str(item))

        packages = Package.objects.filter(
            models.Q(id__in=uuid_ids) | models.Q(slug__in=slug_ids)
        )
        return [
            {
                'id': str(p.id),
                'slug': p.slug,
                'name': p.name,
                'tagline': p.tagline,
                'category': p.category,
                'priceNGN': p.price_ngn,
                'priceForeignerNGN': p.price_foreigner_ngn,
                'duration': p.duration,
                'dates': p.dates,
                'location': p.location,
                'image': p.image,
                'highlightBadge': p.highlight_badge,
            }
            for p in packages
        ]
