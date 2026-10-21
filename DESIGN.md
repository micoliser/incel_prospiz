# Design System

<!-- impeccable:design-schema 1 -->

## Visual World

**Detty December Lagos Luxe** combines high-energy diaspora celebration with world-class light luxury hospitality. The aesthetic is clean, luminous, and sun-drenched—reminiscent of modern luxury editorial travel publications (Aman, Conde Nast Traveler, Airbnb Luxe). High-contrast deep sapphire and Atlantic blues (`#0168a7`, `#0d47a1`, `#091e42`) form the dominant brand authority across buttons, headings, card borders, and primary price structures, while subtle Prospiz emerald greens (`#0f5132`, `#059669`) inject verified operational trust and safety. Festive warm accents are strictly reserved for subtle scarcity micro-badges.

## Color Palette

### Primary Dominant Blues (Brand Core)
- `var(--blue-deep)`: `#0d47a1` (Sapphire Blue, dominant authority, primary prices, active tabs, heading accents)
- `var(--blue-primary)`: `#0168a7` (Ocean Atlantic Blue, primary conversion CTA buttons, selection borders)
- `var(--blue-navy)`: `#091e42` (Deep Navy Ink, primary typography with >12:1 contrast against white)
- `var(--blue-light)`: `#0284c7` (Subtle MapPin indicators, icons, and highlight badges)
- `var(--blue-sky)`: `#38bdf8` (Hero headline emphasis and photographic contrast accents)
- `var(--blue-soft)`: `#e0f2fe` (Subtle icon containers and light pill badges)
- `var(--blue-surface)`: `#f0f7ff` (Airy card background tints and selected states)

### Partner Brand Accents (Prospiz & Security)
- `var(--green-prospiz)`: `#0f5132` (Forest Green, honoring Prospiz Management Consulting identity)
- `var(--green-emerald)`: `#059669` (Verified trust badges, inclusion checkmarks, live availability beacon)
- `var(--green-soft)`: `#ecfdf5` (Reassurance pill tags and success backgrounds)
- `var(--gold-accent)`: `#b48608` (Subtle gold underline and luxury accents)

### Micro-Accents (Scarcity & Alerts Only)
- `var(--coral-dark)`: `#e5531d` (Strictly used for critical urgency < 10 seats remaining)
- `var(--coral-soft)`: `#ff8659` (Subtle countdown indicator)

### Modern Light Surfaces & Cards
- `var(--bg-main)`: `#ffffff` (Crisp white base ground)
- `var(--bg-subtle)`: `#f8fafc` (Soft cool slate-sky background for alternating sections)
- `var(--bg-card)`: `#ffffff` (Elevated card surfaces with layered ambient shadows)
- `var(--border-light)`: `#e2e8f0` (Hairline crisp borders)

## Responsive & Mobile Architecture

- **Mobile Drawer Modal**: On viewport < 640px, the booking modal transforms into an ergonomic bottom sheet drawer with drag handle, scrollable packages, and a sticky bottom checkout bar positioned directly over the thumb.
- **Scrollable Filter Pills**: Horizontal touch-scrolling (`-webkit-overflow-scrolling: touch`) with hidden scrollbars for all tab filters and day selectors.
- **Zero iOS Safari Zoom**: All mobile form inputs and selects set to `16px` minimum font-size.
- **Touch Targets**: All interactive buttons, pill switches, and modal close triggers adhere to ≥ 44px touch target standards.
- **Fluid Grid Scaling**: Card grids use `minmax(min(100%, 340px), 1fr)` preventing horizontal scrollbar emergence on 320px–390px mobile screens.

## Typography

- **Headings & Display**: `Plus Jakarta Sans`, sans-serif (800 / 900 weight, -0.025em tracking for bold presence)
- **Body & Controls**: `Plus Jakarta Sans`, system-ui (500 / 600 weight, 1.65 line height for maximum legibility)
- **Data & Numbers**: Monospace and tabular numbers for countdown clock, currency figures, and capacity meters.

## Motion & Scroll Animations

- **Scroll Reveal System**: IntersectionObserver-based staggered entrances (`reveal-on-scroll`) using exponential ease-out curves (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Tactile Micro-Interactions**: Smooth card hover elevation (`translateY(-5px)` on desktop, disabled on touch), luminous button glow expansions, and pulsing live beacon indicators.
- **Dynamic Multi-Currency Engine**: Instant, smooth price recalculation across NGN (₦), USD ($), and GBP (£).

