from django.contrib import admin
from .models import Package, PromoCode, Booking, CampaignConfig


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ('id', 'slug', 'name', 'category', 'price_ngn', 'price_foreigner_ngn', 'seats_booked', 'max_seats', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('id', 'slug', 'name', 'description')


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'discount_pct', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('id', 'code')


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'booking_ref',
        'full_name',
        'guest_count',
        'subtotal_display',
        'discounts_display',
        'final_total_display',
        'payment_method',
        'payment_status',
        'created_at',
    )
    list_filter = ('payment_method', 'payment_status', 'created_at')
    search_fields = ('booking_ref', 'full_name', 'email', 'phone', 'promo_code')
    readonly_fields = (
        'id',
        'booking_ref',
        'created_at',
        'updated_at',
        'subtotal_ngn',
        'group_discount_pct',
        'group_discount_ngn',
        'promo_code',
        'promo_discount_pct',
        'promo_discount_ngn',
        'final_total_ngn',
        'converted_total',
        'paid_at',
        'payment_url',
    )

    fieldsets = (
        ('Guest Information', {
            'fields': ('full_name', 'email', 'phone', 'country', 'guest_count', 'is_foreigner')
        }),
        ('Package Details', {
            'fields': ('selected_packages',)
        }),
        ('Financial Audit & Discount Breakdown', {
            'description': 'Itemized pricing breakdown: Base subtotal, 2% group discount (for 4+ guests), promo coupon discount, and final total.',
            'fields': (
                'subtotal_ngn',
                ('group_discount_pct', 'group_discount_ngn'),
                ('promo_code', 'promo_discount_pct', 'promo_discount_ngn'),
                'final_total_ngn',
                ('currency', 'converted_total'),
            )
        }),
        ('Payment & Gateway Details', {
            'fields': (
                ('payment_method', 'payment_status'),
                ('payment_reference', 'paid_at'),
                'payment_url',
                'booking_ref',
                'special_requests',
                ('created_at', 'updated_at'),
            )
        }),
    )

    def subtotal_display(self, obj):
        return f"₦{obj.subtotal_ngn:,}"
    subtotal_display.short_description = "Subtotal"

    def discounts_display(self, obj):
        discounts = []
        if obj.group_discount_ngn > 0:
            discounts.append(f"Group -{obj.group_discount_pct}% (-₦{obj.group_discount_ngn:,})")
        if obj.promo_discount_ngn > 0:
            discounts.append(f"{obj.promo_code} -{obj.promo_discount_pct}% (-₦{obj.promo_discount_ngn:,})")
        return " + ".join(discounts) if discounts else "None (0%)"
    discounts_display.short_description = "Discounts Applied"

    def final_total_display(self, obj):
        if obj.currency in ['USD', 'GBP'] and obj.converted_total:
            symbol = '$' if obj.currency == 'USD' else '£'
            return f"{symbol}{obj.converted_total:,.2f} (₦{obj.final_total_ngn:,})"
        return f"₦{obj.final_total_ngn:,}"
    final_total_display.short_description = "Final Total"


@admin.register(CampaignConfig)
class CampaignConfigAdmin(admin.ModelAdmin):
    list_display = (
        'early_bird_code',
        'early_bird_cap',
        'early_bird_baseline_claimed',
        'usd_to_ngn_rate',
        'gbp_to_ngn_rate',
        'early_bird_deadline',
        'is_active',
        'updated_at',
    )
    fieldsets = (
        ('Early Bird & Urgency Controls', {
            'fields': (
                'early_bird_code',
                'early_bird_discount_pct',
                'early_bird_cap',
                'early_bird_baseline_claimed',
                'early_bird_deadline',
                'is_active',
            )
        }),
        ('Currency & Exchange Rates', {
            'description': 'Configure fixed application-wide exchange rates for converting Naira (NGN) to USD ($) and GBP (£).',
            'fields': ('usd_to_ngn_rate', 'gbp_to_ngn_rate'),
        }),
        ('Event Dates & Capacity', {
            'fields': ('event_start_date', 'event_end_date', 'per_package_cap'),
        }),
    )
