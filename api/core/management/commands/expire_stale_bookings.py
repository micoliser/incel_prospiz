from django.core.management.base import BaseCommand
from core.views import expire_stale_pending_bookings


class Command(BaseCommand):
    help = 'Expires stale pending reservations and returns held seats back to excursion capacity.'

    def handle(self, *args, **options):
        self.stdout.write("Checking for expired pending reservations...")
        cancelled_count = expire_stale_pending_bookings()
        if cancelled_count > 0:
            self.stdout.write(self.style.SUCCESS(f"Successfully cancelled {cancelled_count} expired reservation(s) and returned held seats."))
        else:
            self.stdout.write(self.style.SUCCESS("No stale reservations found. All active seat holds are within the allowed window."))
