import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from core.models import Package, PromoCode

PACKAGES_DATA = [
    {
        "slug": "all-inclusive-vip",
        "name": 'The Ultimate "Lagos Luxe" 7-Day All-Access Pass',
        "tagline": 'The complete Detty December experience — all 5 excursions, food, wellness & VIP nights',
        "category": "bundle",
        "price_ngn": 520000,
        "image": "/images/hero-lagos.jpg",
        "duration": "7 Days Curated Experience",
        "dates": "13–30 December 2026",
        "location": "Lagos & Historic Regional Excursions",
        "max_seats": 100,
        "seats_booked": 82,
        "highlight_badge": "MOST POPULAR · 5% EARLY-BIRD",
        "description": "Experience the pulse of Lagos without a single logistics headache. Includes all 5 premium excursions, reservations at the best tables (jollof, suya, amala feasts), spa & recovery yoga sessions, and priority VIP entry to December comedy specials and concert nights.",
        "inclusions": [
            "All 5 Excursions: Abeokuta, Badagry, Tarkwa Bay, Kalakuta, Lekki CC",
            "VIP Priority Access to December concerts and comedy shows",
            "Lagos Gourmet Dining Tour: Jollof, peppered suya, amala feasts",
            "Spa day and revitalizing morning ocean yoga sessions",
            "Dedicated air-conditioned luxury transport throughout",
            "MOPOL armed security escort on all trips",
            "Vetted local cultural guides & dedicated personal host on call",
            "Daily gourmet small chops, water, and chilled refreshments",
        ],
        "transport_details": "Dedicated AC Luxury Coaster & Hiace fleet from Victoria Island / Lekki",
        "security_details": "Continuous MOPOL armed security escort & professional logistics team",
        "refreshments": "Daily Lagos small chops, premium drinks, and authentic local feast reservations",
        "display_order": 1,
    },
    {
        "slug": "abeokuta-olumo-rock",
        "name": "Abeokuta Heritage & Scenic Rail Excursion",
        "tagline": "Climb the sacred Olumo Rock, ride the modern Lagos-Ibadan train, and touch ancient roots",
        "category": "excursion",
        "price_ngn": 75000,
        "image": "/images/olumo-rock.jpg",
        "duration": "Full Day (8:00 AM – 6:00 PM)",
        "dates": "Selected dates between 13–30 Dec 2026",
        "location": "Abeokuta, Ogun State",
        "max_seats": 100,
        "seats_booked": 74,
        "highlight_badge": "CULTURE & HISTORY",
        "description": "A thrilling day trip out of Lagos into the historic fortress city of Abeokuta. Ascend the legendary Olumo Rock via ancient carved stone steps or the mountain elevator, discover centuries of Egba history, and explore local artisanal adire textile markets.",
        "inclusions": [
            "Comfortable 28-passenger luxury coaster transport",
            "Olumo Rock entry tickets and elevator pass",
            "Modern scenic train ticket (Lagos to Abeokuta corridor)",
            "Dedicated MOPOL armed security escort",
            "Vetted local historian guide",
            "Gourmet Lagos small chops, chilled bottled water & soft drinks",
        ],
        "transport_details": "28-passenger executive coaster (₦150,000 group charter)",
        "security_details": "Dedicated MOPOL armed police escort throughout journey",
        "refreshments": "Fresh small chops, chilled water & soft drinks included",
        "display_order": 2,
    },
    {
        "slug": "badagry-heritage",
        "name": "Badagry Slave Route & Coastal Heritage Tour",
        "tagline": "Walk the historic Point of No Return trail and uncover the deep history of the Atlantic route",
        "category": "excursion",
        "price_ngn": 70000,
        "price_foreigner_ngn": 90000,
        "image": "/images/badagry-heritage.jpg",
        "duration": "Full Day (7:30 AM – 5:30 PM)",
        "dates": "Selected dates between 13–30 Dec 2026",
        "location": "Badagry Coastal District",
        "max_seats": 100,
        "seats_booked": 68,
        "highlight_badge": "SACRED HERITAGE",
        "description": "An emotionally resonant, deeply moving journey to Nigeria’s primary historic trading outpost. Visit the first story building in Nigeria, the Seriki Faremi Williams Abass slave barracoon, and journey across the lagoon to the Point of No Return on Gberefu Island.",
        "inclusions": [
            "Executive Hiace / 30-seat coaster from Victoria Island",
            "Guided historical city tour & museum entry fees",
            "Lagoon boat ferry to Gberefu Island (Point of No Return)",
            "MOPOL security escort for total peace of mind",
            "Expert heritage narrator & local community guides",
            "Hot small chops, chilled spring water & soft drinks",
        ],
        "transport_details": "Executive Hiace with MOPOL (Option: 30-seat coaster from VI)",
        "security_details": "MOPOL escort from departure to return",
        "refreshments": "Fresh small chops, bottled water & soft drinks",
        "display_order": 3,
    },
    {
        "slug": "tarkwa-bay-beach",
        "name": "Tarkwa Bay Luxury Beach Cruise & Cabana Day",
        "tagline": "Private boat cruise across Lagos Harbour into an exclusive beach lounge with games & cocktails",
        "category": "excursion",
        "price_ngn": 75000,
        "image": "/images/tarkwa-bay.jpg",
        "duration": "Day & Sunset (11:00 AM – 7:00 PM)",
        "dates": "Selected dates between 13–30 Dec 2026",
        "location": "Tarkwa Bay Island, Lagos",
        "max_seats": 100,
        "seats_booked": 89,
        "highlight_badge": "BEACH & VIBES",
        "description": "Escape the Lagos traffic and cruise out to the sheltered sands of Tarkwa Bay. Relax under private shaded cabanas, play beach volleyball, soak in the warm Atlantic surf, and vibe to live DJ sets with tropical refreshments and barbecue.",
        "inclusions": [
            "Return private boat cruise from upscale Lagos jetty",
            "Private shaded beach cabana / tent lounge for groups",
            "Island entry passes & environmental permits",
            "Beach games, volleyball & music setup",
            "Dedicated marine security & lifeguard coordination",
            "Gourmet small chops, grilled finger food & chilled drinks",
        ],
        "transport_details": "Private passenger boat charter from Victoria Island jetty",
        "security_details": "Jetty and island security coordination",
        "refreshments": "Gourmet small chops, grilled bites, cocktails/drinks",
        "display_order": 4,
    },
    {
        "slug": "kalakuta-museum",
        "name": "Kalakuta Afrobeat Shrine & Fela Kuti Heritage",
        "tagline": "Immerse yourself in the revolutionary pulse of Afrobeat at Fela Kuti’s iconic residence",
        "category": "excursion",
        "price_ngn": 85000,
        "image": "/images/kalakuta-museum.jpg",
        "duration": "Afternoon & Evening (1:00 PM – 8:00 PM)",
        "dates": "Selected dates between 13–30 Dec 2026",
        "location": "Ikeja, Lagos",
        "max_seats": 100,
        "seats_booked": 61,
        "highlight_badge": "AFROBEAT ROOTS",
        "description": "Step directly into the living shrine of Afrobeat music and Pan-African revolutionary thought. Tour Fela Anikulapo Kuti’s preserved personal rooms, saxophone collection, historic album covers, and rooftop lounge with live musical selections.",
        "inclusions": [
            "VIP AC Hiace bus transport from Island/Mainland meeting points",
            "Kalakuta Museum VIP entry ticket & curated docent tour",
            "Afrobeat archive & Fela personal quarters exploration",
            "Dedicated MOPOL armed security escort",
            "Rooftop lounge experience with signature music playlist",
            "Artisanal small chops, chilled beverages & water",
        ],
        "transport_details": "Executive air-conditioned Hiace transport",
        "security_details": "Dedicated MOPOL escort provided throughout",
        "refreshments": "Fresh small chops, soft drinks and cold bottled water",
        "display_order": 5,
    },
    {
        "slug": "lekki-conservation-centre",
        "name": "Lekki Conservation Centre & Canopy Walkway",
        "tagline": "Traverse Africa’s longest canopy bridge high above coastal tropical wetlands and wildlife",
        "category": "excursion",
        "price_ngn": 75000,
        "image": "/images/lekki-canopy.jpg",
        "duration": "Morning & Early Afternoon (9:00 AM – 2:00 PM)",
        "dates": "Selected dates between 13–30 Dec 2026",
        "location": "Lekki Peninsula, Lagos",
        "max_seats": 100,
        "seats_booked": 79,
        "highlight_badge": "NATURE & ADVENTURE",
        "description": "Walk across Africa’s longest suspension canopy walkway, 22.5 meters above a rich 78-hectare coastal nature reserve. Spot Mona monkeys, exotic bird species, giant tortoises, and unwind in the lush picnic forest before your afternoon celebrations.",
        "inclusions": [
            "Lekki Conservation Centre entry ticket",
            "Canopy Walkway access ticket",
            "Executive Hiace transport with MOPOL escort",
            "Expert nature guide and park ranger briefing",
            "Picnic lawn relaxation and giant chessboard games",
            "Fresh small chops, cold water & soft drinks",
        ],
        "transport_details": "Executive Hiace with MOPOL escort",
        "security_details": "MOPOL armed escort & park ranger presence",
        "refreshments": "Small chops, chilled spring water & refreshments",
        "display_order": 6,
    },
]

PROMO_CODES = [
    {"code": "EARLYBIRD5", "discount_pct": 5},
    {"code": "DETTY5", "discount_pct": 5},
    {"code": "VIPLAGOS", "discount_pct": 10},
]

def run():
    print("Populating packages with UUID ids...")
    for pkg_data in PACKAGES_DATA:
        slug = pkg_data["slug"]
        defaults = {k: v for k, v in pkg_data.items() if k != "slug"}
        obj, created = Package.objects.update_or_create(
            slug=slug,
            defaults=defaults,
        )
        status = "Created" if created else "Updated"
        print(f"  [{status}] {obj.name} (UUID: {obj.id}, Slug: {obj.slug}, ₦{obj.price_ngn:,})")

    print("\nPopulating promo codes with UUID ids...")
    for promo in PROMO_CODES:
        obj, created = PromoCode.objects.update_or_create(
            code=promo["code"],
            defaults={"discount_pct": promo["discount_pct"], "is_active": True},
        )
        status = "Created" if created else "Updated"
        print(f"  [{status}] {obj.code} (UUID: {obj.id}, {obj.discount_pct}% off)")

    print(f"\nTotal packages in DB: {Package.objects.count()}")
    print(f"Total promo codes in DB: {PromoCode.objects.count()}")

if __name__ == '__main__':
    run()
