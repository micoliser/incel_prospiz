# Detty December Lagos Luxe — Frontend Web Application 🌴✨

Modern luxury travel and excursion booking web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and an **Impeccable Vanilla CSS design system**.

Designed to cater to high-net-worth Nigerian diaspora and international festivalgoers returning to Lagos, providing instant multi-currency price recalculations, responsive mobile drawer booking checkout, self-service dossier lookups, and real-time payment recovery.

---

## 🏛️ Application Architecture & Directory Layout

```text
frontend/
├── app/                             # Next.js 16 App Router
│   ├── booking/
│   │   ├── lookup/                  # Self-service public booking dossier
│   │   │   └── page.tsx             # Reference lookup, live status & itinerary view
│   │   └── verify/                  # Payment verification & gateway return handler
│   │       └── page.tsx             # Polling verification, auto-retry & confirmation
│   ├── globals.css                  # Core design tokens, CSS variables & typography
│   ├── layout.tsx                   # Root HTML shell, SEO metadata, fonts
│   └── page.tsx                     # Main luxury landing page & catalog
│
├── components/                      # Modular UI components
│   ├── BookingModal.tsx             # Dual-mode modal & mobile bottom drawer (<640px)
│   ├── ExperiencePillars.tsx        # Brand authority, security & logistics pillars
│   ├── Faq.tsx                      # Frequently asked questions accordion
│   ├── Footer.tsx                   # Trust badges, copyright, partnership credentials
│   ├── Hero.tsx                     # Cinematic hero header with direct CTA
│   ├── HowItWorks.tsx               # 3-step luxury booking walkthrough
│   ├── ItineraryTimeline.tsx        # Day-by-day festival calendar & excursion schedule
│   ├── LeadCapture.tsx              # VIP newsletter & exclusive release registration
│   ├── Navbar.tsx                   # Sticky glassmorphism header & currency switcher
│   ├── PackageSelector.tsx          # Interactive package grid with category filtering
│   ├── PendingCheckoutNotifier.tsx  # Persistent session recovery banner
│   ├── ScrollReveal.tsx             # Micro-interaction scroll intersection observer
│   ├── SortedForYou.tsx             # Curated traveler persona recommendations
│   └── UrgencyTicker.tsx            # Live inventory countdown & scarcity indicators
│
├── data/                            # Client-side data models & specifications
│   └── packages.ts                  # Package definitions, images, inclusions & pricing
│
├── lib/                             # Utility & service libraries
│   └── api.ts                       # Type-safe DRF API communication client
│
├── public/                          # Optimized static assets
│   ├── images/                      # High-definition excursion photography
│   ├── propiz-logo.png              # Prospiz Management Consulting brand logo
│   └── tourism-logo.png             # Incel Holidays and Tourism brand logo
│
├── next.config.ts                   # Next.js configuration
├── package.json                     # NPM dependencies & scripts
└── tsconfig.json                    # TypeScript compiler options
```

---

## 🎨 Design System & Aesthetic Foundation

The frontend follows an **Impeccable** editorial luxury travel aesthetic (reminiscent of Aman, Condé Nast Traveler, and Airbnb Luxe) with high-contrast, sun-drenched coastal tones:

### 1. Brand Authority Color Palette
- **Deep Sapphire Blue (`#0d47a1`)**: Primary brand anchor, dominant titles, active badges.
- **Ocean Atlantic Blue (`#0168a7`)**: Primary conversion CTA buttons and focus rings.
- **Deep Navy Ink (`#091e42`)**: High-contrast typography with >12:1 readability against white.
- **Prospiz Emerald Green (`#0f5132` / `#059669`)**: Trust markers, inclusion checks, and live availability beacons.
- **Scarcity Coral (`#e5531d`)**: Reserved strictly for critical urgency alerts (< 10 seats remaining).

### 2. Modern Light Surfaces
- Crisp white ground (`#ffffff`) paired with soft slate-sky background tints (`#f8fafc` and `#f0f7ff`) for clean section separation.
- Ambient layered shadows with zero harsh borderlines.

### 3. Responsive Mobile Drawer Architecture
- On viewports `< 640px`, the reservation checkout modal dynamically morphs into an ergonomic **bottom sheet drawer**.
- Features an accessible top drag handle, scrollable itemized packages, and a sticky bottom checkout bar positioned directly over the thumb zone for effortless one-handed mobile payment.

---

## ⚡ Core Client Features

### 1. Dynamic Dual-Currency Switcher (NGN, USD, GBP)
- Global currency switcher in the navigation bar dynamically re-evaluates all displayed prices across the catalog and active modal carts.
- Accurately respects dual-tier rates (local resident rates vs. international diaspora rates).
- Persists user selection for a seamless browsing experience.

### 2. Interactive Package Catalog & Filtering
- Filter packages by travel interest:
  - `All Experiences`
  - `VIP Nightlife`
  - `Afrobeat & Culture`
  - `Island & Beach`
  - `Fine Dining & Culinary`
  - `Excursions & Skywalk`
- Live seat counters and scarcity badges ("Only 4 seats remaining") encourage decisive conversion.

### 3. Smart Booking Modal & Multi-Guest Cart
- Real-time guest party size adjustments (`1` to `20+` passengers).
- **Automatic Group Discounts**: Automatically applies a **5% group discount** for bookings with 4 or more guests.
- **Promotional Code Redemption**: Instant validation for campaign codes (`EARLYBIRD5`, `DETTY5`, `VIPLAGOS`) with immediate breakdown of original subtotal, discount, and final payable amount.
- **Dual Payment Selector**: Guests choose between **Paystack** (Instant Card, Bank Transfer, USSD) and **Flutterwave** (Global Cards, International, Mobile Money).

### 4. Self-Service Booking Dossier (`/booking/lookup`)
- Guests can retrieve their verified reservation at any time using their booking reference code (`DL-YYYY-XXXX`).
- Displays live booking status (`CONFIRMED`, `HELD`, `PENDING`), party size, booked packages, lead guest details, and financial audit with payment timestamp.
- Provides direct **"Add to Google Calendar"** and **"WhatsApp Operations Desk"** action buttons.

### 5. Payment Return & Verification Engine (`/booking/verify`)
- Handles return redirects from Paystack and Flutterwave.
- Features multi-step verification:
  1. Instant client verification query to the backend API.
  2. Automatic polling fallback if the payment gateway webhook is currently processing.
  3. Clear error messaging with recovery buttons if a user manually cancelled the payment.

### 6. Abandoned Checkout Recovery Banner
- The `PendingCheckoutNotifier` component watches for active pending holds in local storage.
- If a guest accidentally closes the gateway or navigates back, an elegant floating banner offers:
  - The remaining hold countdown (e.g., "Seat hold expires in 18 minutes").
  - A one-click **"Resume Checkout"** button that requests a fresh gateway URL without forcing the user to re-enter their details.

---

## 🛠️ Development & Build Commands

### Install Dependencies
```bash
cd frontend
npm install
```

### Local Development Server
```bash
npm run dev
```
Starts Next.js development server at `http://localhost:3000`.

### Type-Check & Linter
```bash
npm run lint
```

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `.next` directory.

### Production Runner
```bash
npm run start
```
Starts the production server on port 3000.

---

## 🌐 Environment Configuration

Configure `frontend/.env.local` for local development:

```dotenv
# API Base URL for backend communication
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

For production builds (e.g., in Docker or CI/CD):

```dotenv
NEXT_PUBLIC_API_URL=https://api.inceltourism.com/api
```

> [!IMPORTANT]
> Because `NEXT_PUBLIC_*` variables are statically embedded into client JavaScript bundles during `next build`, the `NEXT_PUBLIC_API_URL` variable must be supplied as a build argument (`--build-arg NEXT_PUBLIC_API_URL=...`) during Docker image creation.
