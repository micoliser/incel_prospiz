import uuid
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from core.models import Package


class PackageAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create active excursions
        self.pkg_excursion_1 = Package.objects.create(
            slug='abeokuta-heritage',
            name='Abeokuta Heritage & Scenic Rail',
            category='excursion',
            price_ngn=75000,
            price_foreigner_ngn=None,
            image='/images/olumo-rock.jpg',
            duration='Full Day (8:00 AM – 6:00 PM)',
            dates='13–30 December 2026',
            location='Abeokuta, Ogun State',
            max_seats=100,
            seats_booked=74,
            highlight_badge='CULTURE & HISTORY',
            description='Historic fortress city of Abeokuta.',
            inclusions=['Train ticket', 'Security escort', 'Small chops'],
            transport_details='Luxury coaster',
            security_details='Dedicated security escort',
            refreshments='Fresh small chops and drinks',
            display_order=2,
            is_active=True,
        )

        self.pkg_badagry = Package.objects.create(
            slug='badagry-heritage',
            name='Badagry Slave Route',
            category='excursion',
            price_ngn=70000,
            price_foreigner_ngn=90000,
            image='/images/badagry.jpg',
            duration='Full Day',
            dates='13–30 December 2026',
            location='Badagry Coastal District',
            max_seats=100,
            seats_booked=92,
            description='Point of No Return.',
            inclusions=['Boat ferry', 'Museum ticket'],
            display_order=3,
            is_active=True,
        )

        # Create active bundle
        self.pkg_bundle = Package.objects.create(
            slug='all-inclusive-vip',
            name='The Ultimate "Lagos Luxe" 7-Day All-Access Pass',
            category='bundle',
            price_ngn=520000,
            image='/images/hero.jpg',
            duration='7 Days Curated Experience',
            dates='13–30 December 2026',
            location='Lagos & Historic Regional Excursions',
            max_seats=100,
            seats_booked=10,
            highlight_badge='MOST POPULAR',
            description='All 5 excursions included.',
            inclusions=['All excursions', 'VIP Access', 'Dining'],
            display_order=1,
            is_active=True,
        )

        # Create an inactive package (should be hidden)
        self.pkg_inactive = Package.objects.create(
            slug='secret-private-tour',
            name='Secret Private Tour',
            category='excursion',
            price_ngn=150000,
            image='/images/secret.jpg',
            duration='Half Day',
            dates='Private',
            location='Lagos',
            max_seats=10,
            seats_booked=0,
            is_active=False,
            display_order=99,
        )

    def test_list_packages_returns_only_active(self):
        res = self.client.get('/api/packages/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertEqual(len(data), 3)

        slugs = [p['slug'] for p in data]
        self.assertIn('all-inclusive-vip', slugs)
        self.assertIn('abeokuta-heritage', slugs)
        self.assertIn('badagry-heritage', slugs)
        self.assertNotIn('secret-private-tour', slugs)

    def test_list_packages_ordered_correctly(self):
        res = self.client.get('/api/packages/')
        data = res.json()
        # display_order: bundle (1), abeokuta (2), badagry (3)
        self.assertEqual(data[0]['slug'], 'all-inclusive-vip')
        self.assertEqual(data[1]['slug'], 'abeokuta-heritage')
        self.assertEqual(data[2]['slug'], 'badagry-heritage')

    def test_list_packages_serialization_fields(self):
        res = self.client.get('/api/packages/')
        bundle_data = res.json()[0]
        self.assertEqual(bundle_data['slug'], 'all-inclusive-vip')
        self.assertEqual(bundle_data['priceNGN'], 520000)
        self.assertIsNone(bundle_data['priceForeignerNGN'])
        self.assertEqual(bundle_data['category'], 'bundle')
        self.assertIsInstance(bundle_data['inclusions'], list)
        self.assertEqual(bundle_data['highlightBadge'], 'MOST POPULAR')

        badagry_data = [p for p in res.json() if p['slug'] == 'badagry-heritage'][0]
        self.assertEqual(badagry_data['priceForeignerNGN'], 90000)

    def test_bundle_seats_remaining_reflects_bottleneck_in_api(self):
        # Badagry has 100 max and 92 booked -> 8 seats remaining
        # Abeokuta has 100 max and 74 booked -> 26 seats remaining
        # Bundle has 100 max and 10 booked -> 90 seats
        # Therefore bundle seatsRemaining must be 8 in the API response!
        res = self.client.get('/api/packages/')
        bundle_data = res.json()[0]
        self.assertEqual(bundle_data['seatsRemaining'], 8)

    def test_retrieve_package_by_uuid(self):
        pkg_id = str(self.pkg_excursion_1.id)
        res = self.client.get(f'/api/packages/{pkg_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['slug'], 'abeokuta-heritage')
        self.assertEqual(res.json()['name'], 'Abeokuta Heritage & Scenic Rail')

    def test_retrieve_package_by_slug(self):
        res = self.client.get('/api/packages/badagry-heritage/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['priceForeignerNGN'], 90000)

    def test_retrieve_package_not_found_by_random_uuid(self):
        random_uuid = str(uuid.uuid4())
        res = self.client.get(f'/api/packages/{random_uuid}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_package_not_found_by_nonexistent_slug(self):
        res = self.client.get('/api/packages/non-existent-tour/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_inactive_package_returns_404_by_uuid(self):
        inactive_id = str(self.pkg_inactive.id)
        res = self.client.get(f'/api/packages/{inactive_id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_inactive_package_returns_404_by_slug(self):
        res = self.client.get(f'/api/packages/{self.pkg_inactive.slug}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
