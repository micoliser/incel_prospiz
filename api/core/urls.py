from django.urls import path
from .views import (
    PackageListView,
    PackageDetailView,
    PromoCodeValidateView,
    CampaignStatsView,
    BookingCreateView,
    BookingDetailView,
    BookingPayView,
    PaymentVerifyView,
    PaystackWebhookView,
    FlutterwaveWebhookView,
)

urlpatterns = [
    path('packages/', PackageListView.as_view(), name='package-list'),
    path('packages/<str:id>/', PackageDetailView.as_view(), name='package-detail'),
    path('stats/', CampaignStatsView.as_view(), name='campaign-stats'),
    path('promo/validate/', PromoCodeValidateView.as_view(), name='promo-validate'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/<str:booking_ref>/', BookingDetailView.as_view(), name='booking-detail'),
    path('bookings/<str:booking_ref>/pay/', BookingPayView.as_view(), name='booking-pay'),
    path('payments/verify/', PaymentVerifyView.as_view(), name='payment-verify'),
    path('payments/paystack/webhook/', PaystackWebhookView.as_view(), name='paystack-webhook'),
    path('payments/flutterwave/webhook/', FlutterwaveWebhookView.as_view(), name='flutterwave-webhook'),
]
