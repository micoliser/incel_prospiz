import datetime
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package, Booking
from core.views import expire_stale_pending_bookings


class SeatHoldAndExpiryTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.abeokuta = Package.objects.create(
            slug='abeokuta-heritage',
            name='Abeokuta Heritage & Scenic Rail',
            category='excursion',
            price_ngn=75000,
            max_seats=100,
            seats_booked=10,
            is_active=True,
        )

        self.badagry = Package.objects.create(
            slug='badagry-heritage',
            name='Badagry Slave Route',
            category='excursion',
            price_ngn=70000,
            max_seats=100,
            seats_booked=5,
            is_active=True,
        )

        self.bundle = Package.objects.create(
            slug='all-inclusive-vip-pass',
            name='All-Inclusive VIP Pass',
            category='bundle',
            price_ngn=550000,
            max_seats=50,
            seats_booked=4,
            is_active=True,
        )

    def test_cancel_and_reallocate_restores_seats(self):
        # Create booking for 3 guests
        booking = Booking.objects.create(
            full_name='Chidi Okafor',
            email='chidi@example.com',
            phone='+2348011112222',
            guest_count=3,
            selected_packages=['abeokuta-heritage'],
            final_total_ngn=225000,
            payment_status='pending',
        )
        self.abeokuta.seats_booked += 3
        self.abeokuta.save()
        self.assertEqual(self.abeokuta.seats_booked, 13)

        success = booking.cancel_and_reallocate()
        self.assertTrue(success)
        self.assertEqual(booking.payment_status, 'cancelled')

        self.abeokuta.refresh_from_db()
        self.assertEqual(self.abeokuta.seats_booked, 10)

    def test_cancel_bundle_restores_all_packages(self):
        booking = Booking.objects.create(
            full_name='Adaobi Eze',
            email='adaobi@example.com',
            phone='+2348022223333',
            guest_count=2,
            selected_packages=['all-inclusive-vip-pass'],
            final_total_ngn=1100000,
            payment_status='pending',
        )
        self.bundle.seats_booked += 2
        self.bundle.save()
        self.abeokuta.seats_booked += 2
        self.abeokuta.save()
        self.badagry.seats_booked += 2
        self.badagry.save()

        booking.cancel_and_reallocate()

        self.bundle.refresh_from_db()
        self.abeokuta.refresh_from_db()
        self.badagry.refresh_from_db()

        self.assertEqual(self.bundle.seats_booked, 4)
        self.assertEqual(self.abeokuta.seats_booked, 10)
        self.assertEqual(self.badagry.seats_booked, 5)

    def test_expired_booking_auto_cancels_on_lookup(self):
        booking = Booking.objects.create(
            full_name='Femi Kuti',
            email='femi@example.com',
            phone='+2348033334444',
            guest_count=2,
            selected_packages=['abeokuta-heritage'],
            final_total_ngn=150000,
            payment_status='pending',
        )
        self.abeokuta.seats_booked += 2
        self.abeokuta.save()

        # Simulate creation 35 minutes ago (hold expired)
        Booking.objects.filter(id=booking.id).update(
            created_at=timezone.now() - datetime.timedelta(minutes=35)
        )

        res = self.client.get(f'/api/bookings/{booking.booking_ref}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()

        self.assertEqual(data['paymentStatus'], 'cancelled')
        self.assertTrue(data['isExpired'])
        self.assertEqual(data['secondsRemaining'], 0)

        # Seats must have been returned
        self.abeokuta.refresh_from_db()
        self.assertEqual(self.abeokuta.seats_booked, 10)

    def test_expire_stale_pending_bookings_helper(self):
        # Create 2 stale bookings and 1 fresh booking
        b1 = Booking.objects.create(
            full_name='Old 1',
            email='old1@example.com',
            phone='111',
            guest_count=1,
            selected_packages=['badagry-heritage'],
            payment_status='pending',
        )
        b2 = Booking.objects.create(
            full_name='Old 2',
            email='old2@example.com',
            phone='222',
            guest_count=1,
            selected_packages=['badagry-heritage'],
            payment_status='pending',
        )
        b3 = Booking.objects.create(
            full_name='Fresh',
            email='fresh@example.com',
            phone='333',
            guest_count=1,
            selected_packages=['badagry-heritage'],
            payment_status='pending',
        )

        self.badagry.seats_booked += 3
        self.badagry.save()

        Booking.objects.filter(id__in=[b1.id, b2.id]).update(
            created_at=timezone.now() - datetime.timedelta(minutes=40)
        )

        expired_count = expire_stale_pending_bookings()
        self.assertEqual(expired_count, 2)

        b1.refresh_from_db()
        b2.refresh_from_db()
        b3.refresh_from_db()

        self.assertEqual(b1.payment_status, 'cancelled')
        self.assertEqual(b2.payment_status, 'cancelled')
        self.assertEqual(b3.payment_status, 'pending')

        self.badagry.refresh_from_db()
        # Initial was 5, +3 = 8, -2 returned = 6
        self.assertEqual(self.badagry.seats_booked, 6)
