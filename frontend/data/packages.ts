export type Currency = 'NGN' | 'USD' | 'GBP';

export interface ExcursionPackage {
  id: string;
  slug?: string;
  name: string;
  tagline: string;
  category: 'excursion' | 'bundle';
  priceNGN: number;
  priceForeignerNGN?: number; // Badagry specific local vs foreigner rate
  image: string;
  duration: string;
  dates: string;
  location: string;
  maxSeats: number;
  seatsBooked: number;
  seatsRemaining?: number;
  highlightBadge?: string;
  description: string;
  inclusions: string[];
  transportDetails: string;
  securityDetails: string;
  refreshments: string;
}

export const PACKAGES_DATA: ExcursionPackage[] = [
  {
    id: 'all-inclusive-vip',
    name: 'The Ultimate "Lagos Luxe" 7-Day All-Access Pass',
    tagline: 'The complete Lagos Luxe 2026 experience — all 5 excursions, food, wellness & VIP nights',
    category: 'bundle',
    priceNGN: 520000, // From Word doc & Strategy deck
    image: '/images/hero-lagos.jpg',
    duration: '7 Days Curated Experience',
    dates: '13–30 December 2026',
    location: 'Lagos & Historic Regional Excursions',
    maxSeats: 100,
    seatsBooked: 82,
    highlightBadge: 'MOST POPULAR · 2% EARLY-BIRD',
    description:
      'Experience the pulse of Lagos without a single logistics headache. Includes all 5 premium excursions, reservations at the best tables (jollof, suya, amala feasts), spa & recovery yoga sessions, and priority VIP entry to December comedy specials and concert nights.',
    inclusions: [
      'All 5 Excursions: Abeokuta, Badagry, Tarkwa Bay, Kalakuta, Lekki CC',
      'VIP Priority Access to December concerts and comedy shows',
      'Lagos Gourmet Dining Tour: Jollof, peppered suya, amala feasts',
      'Spa day and revitalizing morning ocean yoga sessions',
      'Dedicated air-conditioned luxury transport throughout',
      'MOPOL armed security escort on all trips',
      'Vetted local cultural guides & dedicated personal host on call',
      'Daily gourmet small chops, water, and chilled refreshments',
    ],
    transportDetails: 'Dedicated AC Luxury Coaster & Hiace fleet from Victoria Island / Lekki',
    securityDetails: 'Continuous MOPOL armed security escort & professional logistics team',
    refreshments: 'Daily Lagos small chops, premium drinks, and authentic local feast reservations',
  },
  {
    id: 'abeokuta-olumo-rock',
    name: 'Abeokuta Heritage & Scenic Rail Excursion',
    tagline: 'Climb the sacred Olumo Rock, ride the modern Lagos-Ibadan train, and touch ancient roots',
    category: 'excursion',
    priceNGN: 75000, // Ground truth from packages.jpeg
    image: '/images/olumo-rock.jpg',
    duration: 'Full Day (8:00 AM – 6:00 PM)',
    dates: 'Selected dates between 13–30 Dec 2026',
    location: 'Abeokuta, Ogun State',
    maxSeats: 100,
    seatsBooked: 74,
    highlightBadge: 'CULTURE & HISTORY',
    description:
      'A thrilling day trip out of Lagos into the historic fortress city of Abeokuta. Ascend the legendary Olumo Rock via ancient carved stone steps or the mountain elevator, discover centuries of Egba history, and explore local artisanal adire textile markets.',
    inclusions: [
      'Comfortable 28-passenger luxury coaster transport',
      'Olumo Rock entry tickets and elevator pass',
      'Modern scenic train ticket (Lagos to Abeokuta corridor)',
      'Dedicated MOPOL armed security escort',
      'Vetted local historian guide',
      'Gourmet Lagos small chops, chilled bottled water & soft drinks',
    ],
    transportDetails: '28-passenger executive coaster (₦150,000 group charter)',
    securityDetails: 'Dedicated MOPOL armed police escort throughout journey',
    refreshments: 'Fresh small chops, chilled water & soft drinks included',
  },
  {
    id: 'badagry-heritage',
    name: 'Badagry Slave Route & Coastal Heritage Tour',
    tagline: 'Walk the historic Point of No Return trail and uncover the deep history of the Atlantic route',
    category: 'excursion',
    priceNGN: 70000, // Local rate from packages.jpeg
    priceForeignerNGN: 90000, // Foreigner rate from packages.jpeg
    image: '/images/badagry-heritage.jpg',
    duration: 'Full Day (7:30 AM – 5:30 PM)',
    dates: 'Selected dates between 13–30 Dec 2026',
    location: 'Badagry Coastal District',
    maxSeats: 100,
    seatsBooked: 68,
    highlightBadge: 'SACRED HERITAGE',
    description:
      'An emotionally resonant, deeply moving journey to Nigeria’s primary historic trading outpost. Visit the first story building in Nigeria, the Seriki Faremi Williams Abass slave barracoon, and journey across the lagoon to the Point of No Return on Gberefu Island.',
    inclusions: [
      'Executive Hiace / 30-seat coaster from Victoria Island',
      'Guided historical city tour & museum entry fees',
      'Lagoon boat ferry to Gberefu Island (Point of No Return)',
      'MOPOL security escort for total peace of mind',
      'Expert heritage narrator & local community guides',
      'Hot small chops, chilled spring water & soft drinks',
    ],
    transportDetails: 'Executive Hiace with MOPOL (Option: 30-seat coaster from VI)',
    securityDetails: 'MOPOL escort from departure to return',
    refreshments: 'Fresh small chops, bottled water & soft drinks',
  },
  {
    id: 'tarkwa-bay-beach',
    name: 'Tarkwa Bay Luxury Beach Cruise & Cabana Day',
    tagline: 'Private boat cruise across Lagos Harbour into an exclusive beach lounge with games & cocktails',
    category: 'excursion',
    priceNGN: 75000, // Ground truth from packages.jpeg
    image: '/images/tarkwa-bay.jpg',
    duration: 'Day & Sunset (11:00 AM – 7:00 PM)',
    dates: 'Selected dates between 13–30 Dec 2026',
    location: 'Tarkwa Bay Island, Lagos',
    maxSeats: 100,
    seatsBooked: 89,
    highlightBadge: 'BEACH & VIBES',
    description:
      'Escape the Lagos traffic and cruise out to the sheltered sands of Tarkwa Bay. Relax under private shaded cabanas, play beach volleyball, soak in the warm Atlantic surf, and vibe to live DJ sets with tropical refreshments and barbecue.',
    inclusions: [
      'Return private boat cruise from upscale Lagos jetty',
      'Private shaded beach cabana / tent lounge for groups',
      'Island entry passes & environmental permits',
      'Beach games, volleyball & music setup',
      'Dedicated marine security & lifeguard coordination',
      'Gourmet small chops, grilled finger food & chilled drinks',
    ],
    transportDetails: 'Private passenger boat charter from Victoria Island jetty',
    securityDetails: 'Jetty and island security coordination',
    refreshments: 'Gourmet small chops, grilled bites, cocktails/drinks',
  },
  {
    id: 'kalakuta-museum',
    name: 'Kalakuta Afrobeat Shrine & Fela Kuti Heritage',
    tagline: 'Immerse yourself in the revolutionary pulse of Afrobeat at Fela Kuti’s iconic residence',
    category: 'excursion',
    priceNGN: 85000, // Ground truth from packages.jpeg
    image: '/images/kalakuta-museum.jpg',
    duration: 'Afternoon & Evening (1:00 PM – 8:00 PM)',
    dates: 'Selected dates between 13–30 Dec 2026',
    location: 'Ikeja, Lagos',
    maxSeats: 100,
    seatsBooked: 61,
    highlightBadge: 'AFROBEAT ROOTS',
    description:
      'Step directly into the living shrine of Afrobeat music and Pan-African revolutionary thought. Tour Fela Anikulapo Kuti’s preserved personal rooms, saxophone collection, historic album covers, and rooftop lounge with live musical selections.',
    inclusions: [
      'VIP AC Hiace bus transport from Island/Mainland meeting points',
      'Kalakuta Museum VIP entry ticket & curated docent tour',
      'Afrobeat archive & Fela personal quarters exploration',
      'Dedicated MOPOL armed security escort',
      'Rooftop lounge experience with signature music playlist',
      'Artisanal small chops, chilled beverages & water',
    ],
    transportDetails: 'Executive air-conditioned Hiace transport',
    securityDetails: 'Dedicated MOPOL escort provided throughout',
    refreshments: 'Fresh small chops, soft drinks and cold bottled water',
  },
  {
    id: 'lekki-conservation-centre',
    name: 'Lekki Conservation Centre & Canopy Walkway',
    tagline: 'Traverse Africa’s longest canopy bridge high above coastal tropical wetlands and wildlife',
    category: 'excursion',
    priceNGN: 75000, // Ground truth from packages.jpeg
    image: '/images/lekki-canopy.jpg',
    duration: 'Morning & Early Afternoon (9:00 AM – 2:00 PM)',
    dates: 'Selected dates between 13–30 Dec 2026',
    location: 'Lekki Peninsula, Lagos',
    maxSeats: 100,
    seatsBooked: 79,
    highlightBadge: 'NATURE & ADVENTURE',
    description:
      'Walk across Africa’s longest suspension canopy walkway, 22.5 meters above a rich 78-hectare coastal nature reserve. Spot Mona monkeys, exotic bird species, giant tortoises, and unwind in the lush picnic forest before your afternoon celebrations.',
    inclusions: [
      'Lekki Conservation Centre entry ticket',
      'Canopy Walkway access ticket',
      'Executive Hiace transport with MOPOL escort',
      'Expert nature guide and park ranger briefing',
      'Picnic lawn relaxation and giant chessboard games',
      'Fresh small chops, cold water & soft drinks',
    ],
    transportDetails: 'Executive Hiace with MOPOL escort',
    securityDetails: 'MOPOL armed escort & park ranger presence',
    refreshments: 'Small chops, chilled spring water & refreshments',
  },
];

export interface ExchangeRates {
  USD: number;
  GBP: number;
}

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1600,
  GBP: 2050,
};

// Currency formatting helper using global fixed exchange rates
export function formatPrice(
  amountNGN: number,
  currency: Currency,
  isForeigner = false,
  packageItem?: ExcursionPackage,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): string {
  let effectiveNGN = amountNGN;
  if (isForeigner && packageItem?.priceForeignerNGN) {
    effectiveNGN = packageItem.priceForeignerNGN;
  }

  if (currency === 'NGN') {
    return `₦${effectiveNGN.toLocaleString()}`;
  } else if (currency === 'USD') {
    const usdRate = rates?.USD > 0 ? rates.USD : 1600;
    const usd = Math.round(effectiveNGN / usdRate);
    return `$${usd.toLocaleString()}`;
  } else {
    const gbpRate = rates?.GBP > 0 ? rates.GBP : 2050;
    const gbp = Math.round(effectiveNGN / gbpRate);
    return `£${gbp.toLocaleString()}`;
  }
}

// Early bird helper (2% off first 20 seats until Nov 15)
export function calculateEarlyBirdDiscount(amountNGN: number): number {
  return Math.round(amountNGN * 0.98);
}

// Group discount helper (2% off for 4+ guests as per Strategy slide 6)
export function calculateGroupDiscount(totalAmountNGN: number, guestCount: number): number {
  if (guestCount >= 4) {
    return Math.round(totalAmountNGN * 0.02);
  }
  return 0;
}
