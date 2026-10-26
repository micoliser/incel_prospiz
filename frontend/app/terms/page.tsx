"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUp,
  FileText,
  Search,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { ExcursionPackage, PACKAGES_DATA } from "@/data/packages";
import { getPackages } from "@/lib/api";

interface Section {
  id: string;
  number: string;
  title: string;
  tag?: string;
  content: React.ReactNode;
}

export default function TermsAndConditionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("sec-1");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(69);
  const [packages, setPackages] = useState<ExcursionPackage[]>(PACKAGES_DATA);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Fetch live package pricing from database and auto-refresh on window focus
  useEffect(() => {
    let isMounted = true;
    const fetchLatestPackages = () => {
      getPackages()
        .then((data) => {
          if (isMounted && data && data.length > 0) {
            setPackages(data);
            setLoadingPackages(false);
          }
        })
        .catch((err) => {
          console.warn(
            "Failed to load package prices from database for Terms & Conditions:",
            err,
          );
          if (isMounted) setLoadingPackages(false);
        });
    };

    fetchLatestPackages();

    if (typeof window !== "undefined") {
      window.addEventListener("focus", fetchLatestPackages);
      return () => {
        isMounted = false;
        window.removeEventListener("focus", fetchLatestPackages);
      };
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => {
      if (a.category === "bundle" && b.category !== "bundle") return 1;
      if (a.category !== "bundle" && b.category === "bundle") return -1;
      return 0;
    });
  }, [packages]);

  // Measure fixed header height dynamically
  useEffect(() => {
    if (!headerRef.current) return;
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(headerRef.current);
    window.addEventListener("resize", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Keyboard shortcut listener: press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll progress & back-to-top trigger
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile TOC details dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const detailsEl = document.querySelector(
        ".mobile-toc-details",
      ) as HTMLDetailsElement | null;
      if (
        detailsEl &&
        detailsEl.open &&
        !detailsEl.contains(e.target as Node)
      ) {
        detailsEl.open = false;
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // IntersectionObserver for active TOC section scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -65% 0px",
        threshold: 0,
      },
    );

    const sectionElements = document.querySelectorAll(
      "article.legal-section-card",
    );
    sectionElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [searchQuery]);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const sections: Section[] = useMemo(
    () => [
      {
        id: "sec-1",
        number: "1",
        title: "Introduction and Acceptance",
        tag: "Core Terms",
        content: (
          <div className="clause-flow">
            <p>
              <strong>1.1</strong> These Terms and Conditions govern all
              bookings and participation in Lagos Luxe 2026, the Programme, a
              joint travel and culture initiative run between 15 and 21 December
              2026 by Incel Holidays &amp; Tourism Ltd RC 2007085 of 4th Floor,
              Right Wing, Mulliner Towers, Plot 39, Alfred Rewane Road, Ikoyi,
              Lagos, Nigeria and Prospiz Management Consulting Limited (RC
              [number]) of [address] (together, the &ldquo;Organisers&rdquo;,
              &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p>
              <strong>1.2</strong> By making a booking, paying for a seat, using
              our website at prospiz &amp; inceltourism.com, or booking through
              WhatsApp, you confirm that you have read, understood and agreed to
              these Terms on behalf of yourself and everyone included in your
              booking.
            </p>
            <div className="callout-card age-card">
              <p>
                <strong>1.3</strong> You must be at least 18 years old to make
                a booking. Guests under 18 may only attend when accompanied by
                a parent or legal guardian who accepts these Terms on their
                behalf. Certain VIP night events may be restricted to guests
                aged 18 and over.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "sec-2",
        number: "2",
        title: "Definitions",
        tag: "Interpretation",
        content: (
          <div className="clause-flow">
            <p>
              <strong>Guest:</strong> any person who holds a confirmed seat in
              the Programme.
            </p>
            <p>
              <strong>Booker:</strong> the person who makes the booking and
              payment, who may also be a Guest.
            </p>
            <p>
              <strong>Excursion:</strong> any single-day experience listed on
              the website.
            </p>
            <p>
              <strong>All-Access Pass:</strong> the 7-Day &ldquo;Lagos
              Luxe&rdquo; package covering all five Excursions plus the
              additional experiences described in Section 3.
            </p>
            <p>
              <strong>Booking Confirmation:</strong> the written or digital
              confirmation, including a booking reference and ticket, that we
              send after receiving payment.
            </p>
            <p>
              <strong>Third-Party Providers:</strong> venues, event promoters,
              boat operators, spas, restaurants, attractions, ferry operators,
              rail operators and other suppliers who are not owned or controlled
              by the Organisers.
            </p>
          </div>
        ),
      },
      {
        id: "sec-3",
        number: "3",
        title: "The Programme and What Is Included",
        tag: "Catalog & Inclusions",
        content: (
          <div className="clause-flow">
            <p>
              <strong>3.1</strong> The Programme offers the following packages.
              Prices are per Guest, in Nigerian Naira, and were correct at the
              time of drafting:
            </p>

            <div className="table-responsive">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th>Duration</th>
                    <th>Price per Guest</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPackages.map((pkg) => {
                    const isVip = pkg.category === "bundle";
                    const hasForeignerPrice =
                      pkg.priceForeignerNGN &&
                      pkg.priceForeignerNGN !== pkg.priceNGN;

                    return (
                      <tr
                        key={pkg.id || pkg.slug}
                        className={isVip ? "vip-row" : ""}
                      >
                        <td>{pkg.name}</td>
                        <td>{pkg.duration}</td>
                        <td className={`price-cell ${isVip ? "vip-price" : ""}`}>
                          {hasForeignerPrice ? (
                            <>
                              ₦{Number(pkg.priceNGN).toLocaleString()} (Nigerian Resident) / ₦
                              {Number(pkg.priceForeignerNGN).toLocaleString()} (International Visitor)
                            </>
                          ) : (
                            <>₦{Number(pkg.priceNGN).toLocaleString()}</>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="inclusion-box">
              <p>
                <strong>3.2</strong> Standard inclusions on each Excursion, as
                described on the website: air-conditioned transport (executive
                coaster or Hiace), entry tickets listed for that Excursion, a
                certified local guide, and on-board small chops and
                refreshments. Specific inclusions are set out on each package
                page and in your Booking Confirmation. Anything not expressly
                listed is excluded.
              </p>
            </div>

            <p>
              <strong>3.3</strong> The All-Access Pass includes all five
              Excursions, the Lagos gourmet dining experience, a spa day and
              ocean yoga sessions, and VIP priority access to selected December
              concerts and comedy shows, as described in the itinerary. Access
              to specific named artists, shows or venues depends on what is
              scheduled and on the policies of the relevant Third-Party Provider
              (see Section 13).
            </p>

            <div className="exclusion-box">
              <p>
                <strong>3.4</strong> Exclusions unless stated otherwise in your
                Booking Confirmation: international and domestic flights,
                accommodation, airport transfers, visas, travel and medical
                insurance, personal spending, alcoholic or premium drinks beyond
                those stated, tips and gratuities, personal shopping, and any
                optional upgrades.
              </p>
            </div>

            <p>
              <strong>3.5</strong> Airport pickup and accommodation assistance,
              where offered, are separate services priced on request and subject
              to their own written confirmation.
            </p>
          </div>
        ),
      },
      {
        id: "sec-4",
        number: "4",
        title: "Bookings and Reservations",
        tag: "Capacity & Policies",
        content: (
          <div className="clause-flow">
            <p>
              <strong>4.1</strong> Bookings can be made on our website or
              through our WhatsApp team. A booking is only confirmed once we
              have received full payment (or the agreed deposit) and have issued
              a Booking Confirmation with a booking reference.
            </p>

            <div className="callout-card capacity-card">
              <p>
                <strong>4.2</strong> Seats are limited to a maximum of 100 per
                package and a minimum of 10 per package. Seat counters shown on
                the website are indicative and update in real time; we do not
                guarantee availability until your booking is confirmed.
              </p>
            </div>

            <p>
              <strong>4.3</strong> The Booker is responsible for ensuring that
              the names, contact details and any special requirements (including
              dietary and accessibility needs) supplied for every Guest are
              accurate and complete. We may charge a reasonable administrative
              fee for corrections made close to the travel date.
            </p>
            <p>
              <strong>4.4</strong> Ticket bookings close on [date], or earlier
              if seats sell out. After closing, bookings are subject to
              availability and our discretion.
            </p>
            <p>
              <strong>4.5</strong> We reserve the right to decline or cancel any
              booking where we reasonably suspect fraud, misrepresentation, or a
              breach of these Terms. In that case, we will refund any amount
              received, less any sums already irrecoverably spent on your
              behalf.
            </p>
          </div>
        ),
      },
      {
        id: "sec-5",
        number: "5",
        title: "Pricing, Promotions and Discounts",
        tag: "Pricing & Offers",
        content: (
          <div className="clause-flow">
            <p>
              <strong>5.1</strong> Prices are quoted in Nigerian Naira (₦).
              Guests who pay in USD, GBP or another currency will be charged at
              the exchange rate we publish or confirm at the time of payment.
              Currency conversion, bank and card charges are the Guest’s
              responsibility.
            </p>

            <p>
              <strong>5.2 Early-Bird Offer:</strong> a 2% discount applies
              to the first 20 seats booked using the voucher code shown on
              the website, valid until 15 November 2026 or until the 20
              seats are taken, whichever occurs first.
            </p>
            <p>
              <strong>5.3 Group Discount:</strong> an automatic 2% discount
              applies when four (4) or more seats are booked in a single
              transaction.
            </p>

            <p>
              <strong>5.4</strong> Unless expressly stated otherwise, promotions
              and discounts cannot be combined, are not redeemable for cash, are
              not retroactive, and cannot be applied to bookings already made.
              [Confirm whether the Early-Bird and Group discounts may be
              stacked.]
            </p>
            <p>
              <strong>5.5</strong> We may correct any pricing or description
              errors on the website. If a correction affects a confirmed
              booking, we will contact you, and you may either accept the
              corrected price or cancel for a full refund.
            </p>
            <p>
              <strong>5.6</strong> the Guest’s status determines Resident and
              International rates at the time of booking. We may ask for proof
              (for example, a valid passport, residence permit or national ID),
              and may charge the difference if the wrong rate was selected.
            </p>
          </div>
        ),
      },
      {
        id: "sec-6",
        number: "6",
        title: "Payment Terms",
        tag: "Gateways & Transfers",
        content: (
          <div className="clause-flow">
            <p>
              <strong>6.1</strong> Payment may be made by debit or credit card
              through our secure online checkout, by direct bank transfer to the
              account named on your invoice, or as otherwise agreed with our
              team on WhatsApp.
            </p>
            <p>
              <strong>6.2</strong> Payment must be made in full at the time of
              booking unless we have agreed a payment plan in writing.
              [Optional: A minimum deposit of []% secures your seat, with the
              balance due not later than [] days before the Programme start
              date.] Failure to pay on time may result in automatic release of
              your seat without refund of any non-refundable portion.
            </p>
            <div className="callout-card bank-transfer-card">
              <p>
                <strong>6.3</strong> Bank transfers must only be made to
                accounts officially provided by the Organisers. We will not be
                responsible for money sent to any other account. If you are
                unsure, verify details through our official WhatsApp line
                before paying.
              </p>
            </div>
            <p>
              <strong>6.4</strong> We will issue a receipt and Booking
              Confirmation after payment is verified. Please keep your booking
              reference; it may be used to retrieve your booking through the
              “Find Booking” page.
            </p>
            <p>
              <strong>6.5</strong> Chargebacks or payment reversals made in
              breach of these Terms may result in cancellation of your booking
              and recovery of reasonable costs.
            </p>
          </div>
        ),
      },
      {
        id: "sec-7",
        number: "7",
        title: "Cancellations, Changes and Refunds",
        tag: "Refund Schedule",
        content: (
          <div className="clause-flow">
            <p>
              <strong>7.1 Cancellation by the Guest.</strong> All cancellation
              requests must be sent in writing (email or WhatsApp) to us quoting
              your booking reference. The refund schedule below applies,
              measured from the date and time we receive your request relative
              to the first day of the booked Excursion or Programme:
            </p>

            <div className="table-responsive">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Notice Given</th>
                    <th>Refund</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>30 days or more</td>
                    <td>90% of the amount paid</td>
                  </tr>
                  <tr>
                    <td>15 to 29 days</td>
                    <td>50% of the amount paid</td>
                  </tr>
                  <tr>
                    <td>7 to 14 days</td>
                    <td>25% of the amount paid</td>
                  </tr>
                  <tr>
                    <td>Fewer than 7 days, or no-show</td>
                    <td>No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              <strong>7.2 Name changes and transfers.</strong> A confirmed seat
              may be transferred to another person, free of charge, if requested
              in writing at least 72 hours before the Excursion, and provided
              the new Guest accepts these Terms. A different rate (Resident or
              International) may apply.
            </p>
            <p>
              <strong>7.3 Date changes.</strong> Where an alternative date is
              available, changes requested at least 48 hours before departure
              may be accommodated subject to availability and a change fee.
            </p>
            <p>
              <strong>7.4 Partially used packages.</strong> Unused parts of the
              All-Access Pass, or Excursions missed by a Guest who is late or
              absent, are not refundable.
            </p>
            <p>
              <strong>7.5 Cancellation or changes by us.</strong> If we cancel
              an Excursion for reasons within our control, we will offer you a
              choice of a full refund of that Excursion’s price, or a credit or
              alternative date of equal value. If we must change a material part
              of the itinerary (for example, the venue or day), we will inform
              you as soon as reasonably possible, and you may accept the change
              or cancel for a refund of the affected portion.
            </p>
            <p>
              <strong>7.6</strong> We may cancel an Excursion if fewer than 50
              Guests have booked, in which case a full refund or transfer will
              be offered.
            </p>
            <p>
              <strong>7.7 Refund processing.</strong> Approved refunds will be
              paid within 7 business days to the original payment method where
              possible. Bank and payment-processor fees may be deducted where
              they cannot be recovered.
            </p>
            <p>
              <strong>7.8</strong> Third-party tickets, once purchased on your
              behalf (for example, concert tickets or table reservations), may
              be non-refundable, in which case 7.1 applies only to the portion
              of the price that can be recovered.
            </p>
          </div>
        ),
      },
      {
        id: "sec-8",
        number: "8",
        title: "Itinerary Changes, Delays and Force Majeure",
        tag: "Operations",
        content: (
          <div className="clause-flow">
            <p>
              <strong>8.1</strong> The itinerary is carefully planned but is
              subject to traffic, weather, venue availability, regulatory
              directions, security considerations and other factors. We may
              change timings, routes, meeting points, venues or sequences where
              reasonably necessary, while keeping the overall standard of the
              experience.
            </p>
            <div className="callout-card timing-alert-card">
              <p>
                <strong>8.2</strong> Departure times are fixed. Guests must
                arrive at the meeting point at least 30 to 45 minutes before
                the stated departure. We cannot wait beyond 20 minutes, and a
                Guest who misses departure through their own lateness is not
                entitled to a refund.
              </p>
            </div>
            <p>
              <strong>8.3 Force Majeure.</strong> We are not liable for failure
              or delay in performing our obligations caused by events beyond our
              reasonable control, including natural disasters, severe weather,
              flooding, rough sea or lagoon conditions, pandemic or public
              health restrictions, civil unrest, strikes, road closures,
              government or police directives, terrorism, power or fuel
              shortages, transport suspensions or acts of third parties. Where
              an Excursion cannot proceed for these reasons, we will offer a
              reasonable alternative or credit, or refund the portion we can
              recover after costs already incurred.
            </p>
          </div>
        ),
      },
      {
        id: "sec-9",
        number: "9",
        title: "Security and Escort Arrangements",
        tag: "Security & MOPOL",
        content: (
          <div className="clause-flow">
            <div className="mopol-command-banner">
              <p className="mopol-lead">
                <strong>9.1</strong> We arrange security for Excursions,
                including coordination with Mobile Police (MOPOL) personnel
                and professional security handlers, as described on our
                website.
              </p>
            </div>
            <p>
              <strong>9.2</strong> Police escort and security arrangements
              depend on approvals, availability and operational decisions of the
              relevant authorities and security providers. We will use
              reasonable efforts to provide the escorts described, but we may
              substitute, reduce or adjust them where required for safety or by
              official directive. This will not, on its own, entitle Guests to a
              refund, provided we have arranged comparable security.
            </p>
            <p>
              <strong>9.3</strong> Guests must follow all instructions from
              security personnel, guides and drivers at all times. Security
              personnel are present for the protection of the group and are not
              personal bodyguards or concierge staff.
            </p>
            <p>
              <strong>9.4</strong> Security and travel are not a guarantee of
              absolute safety. Guests acknowledge that travel in any major city
              involves inherent risks, and agree to keep personal belongings
              secure and exercise ordinary caution.
            </p>
            <div className="callout-card prohibited-alert-card">
              <p>
                <strong>9.5</strong> Guests must not attempt to bring weapons,
                illegal substances, or prohibited items on any vehicle or to
                any venue. We reserve the right to refuse boarding or entry to
                anyone who does.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "sec-10",
        number: "10",
        title: "Transport and Meeting Points",
        tag: "Transit",
        content: (
          <div className="clause-flow">
            <p>
              <strong>10.1</strong> Transport is provided in air-conditioned
              executive coaster buses and Hiace vehicles from the departure
              points stated in your Booking Confirmation (principally Victoria
              Island and Lekki hubs, or Island and Mainland meeting points for
              certain Excursions).
            </p>
            <p>
              <strong>10.2</strong> Journey times may vary significantly because
              of Lagos traffic, road conditions and checkpoints. Timings shown
              are estimates.
            </p>
            <p>
              <strong>10.3</strong> Seat belts must be worn where fitted. Guests
              must not distract the driver, leave rubbish in the vehicle, or
              damage it. Guests are liable for damage to vehicles or venue
              property caused by them.
            </p>
            <p>
              <strong>10.4</strong> We are not responsible for transport between
              a Guest’s accommodation and the meeting point unless a pickup
              service has been separately confirmed in writing.
            </p>
          </div>
        ),
      },
      {
        id: "sec-11",
        number: "11",
        title: "Health, Safety and Assumption of Risk",
        tag: "Safety & Risk",
        content: (
          <div className="clause-flow">
            <p>
              <strong>11.1</strong> Some activities, including climbing Olumo
              Rock, the Lekki canopy walkway, boat and ferry travel (Badagry
              lagoon and Tarkwa Bay), beach and water activities, and massage or
              spa treatments, carry physical risks.
            </p>
            <p>
              <strong>11.2</strong> Guests confirm that they are in suitable
              physical health to take part, and must tell us in advance about
              any medical condition, allergy, disability, pregnancy or mobility
              limitation that may affect participation. We may refuse
              participation in an activity where we reasonably believe it is
              unsafe for the Guest or others.
            </p>
            <div className="callout-card water-safety-card">
              <p>
                <strong>11.3 Water activities:</strong> Guests participate in
                boat travel and beach activities at their own risk. Life
                jackets are provided on boats and must be worn when
                instructed. Guests who are unable to swim should tell the
                guide. Guests must not swim after consuming alcohol or in
                areas marked unsafe.
              </p>
            </div>
            <div className="callout-card insurance-notice-card">
              <p>
                <strong>11.4</strong> Guests are responsible for their own
                medical and travel insurance. We strongly recommend
                comprehensive travel insurance covering medical expenses,
                evacuation, personal belongings, cancellation and
                interruption.
              </p>
            </div>
            <p>
              <strong>11.5</strong> Emergency medical assistance will be
              arranged where reasonably possible. Costs of medical treatment,
              hospital care and evacuation are the Guest’s responsibility.
            </p>
            <p>
              <strong>11.6</strong> To the extent permitted by law, each Guest
              voluntarily accepts the ordinary risks inherent in the activities
              described. This does not remove our responsibility to exercise
              reasonable care and skill.
            </p>
          </div>
        ),
      },
      {
        id: "sec-12",
        number: "12",
        title: "Guest Conduct",
        tag: "Conduct",
        content: (
          <div className="clause-flow">
            <p>
              <strong>12.1</strong> All Guests are expected to behave
              respectfully towards other Guests, staff, security personnel,
              drivers, guides, venue staff, local communities and heritage
              sites.
            </p>
            <p>
              <strong>12.2</strong> Out of respect for sacred and historic
              locations (including Olumo Rock, Badagry’s Point of No Return and
              Kalakuta), Guests must follow site rules, dress codes, photography
              restrictions and the instructions of guides.
            </p>
            <div className="callout-card conduct-warning-card">
              <p>
                <strong>12.3</strong> We may remove any Guest without refund
                where their behaviour is, in our reasonable opinion, abusive,
                threatening, discriminatory, unlawful, disruptive, dangerous,
                or seriously affects the enjoyment or safety of others.
                Examples include intoxication, harassment, illegal drug use,
                or ignoring security instructions.
              </p>
            </div>
            <p>
              <strong>12.4</strong> Guests are responsible for their own
              personal conduct and for any fines, penalties or damages arising
              from their actions. Guests who are removed are responsible for
              their own onward transport and accommodation.
            </p>
          </div>
        ),
      },
      {
        id: "sec-13",
        number: "13",
        title: "VIP Nights, Concerts and Third-Party Events",
        tag: "Concerts & Venues",
        content: (
          <div className="clause-flow">
            <p>
              <strong>13.1</strong> VIP access, concert tickets, comedy shows,
              reserved tables and restaurant bookings are provided through or in
              cooperation with Third-Party Providers. Their entry policies, age
              limits, dress codes, capacity rules, security searches and house
              rules apply in addition to these Terms.
            </p>
            <p>
              <strong>13.2</strong> We do not control the content, scheduling,
              line-up or cancellation of third-party events. Line-ups and times
              may change or be cancelled. Where an event is cancelled or
              materially changed by the promoter or venue, we will make
              reasonable efforts to provide a comparable alternative or share
              any refund we receive, but we are not otherwise liable.
            </p>
            <p>
              <strong>13.3</strong> Entry to a venue is at the discretion of the
              venue and can be refused. Where a Guest is refused entry because
              of their own conduct, dress, age or intoxication, no refund will
              be due.
            </p>
            <p>
              <strong>13.4</strong> Guests are responsible for the responsible
              consumption of alcohol, which must comply with Nigerian law.
              Guests must not drive after consuming alcohol.
            </p>
          </div>
        ),
      },
      {
        id: "sec-14",
        number: "14",
        title: "Food, Drink and Dietary Requirements",
        tag: "Catering",
        content: (
          <div className="clause-flow">
            <p>
              <strong>14.1</strong> Catering consists of small chops,
              refreshments and meals as described for each Excursion. Menus may
              vary by availability.
            </p>
            <p>
              <strong>14.2</strong> Guests must notify us of dietary
              requirements and allergies at the time of booking. While we will
              make reasonable efforts to accommodate them, we cannot guarantee
              an allergen-free environment, particularly at street-food vendors,
              beach venues and third-party restaurants.
            </p>
          </div>
        ),
      },
      {
        id: "sec-15",
        number: "15",
        title: "Travel Documents, Visas and Entry Requirements",
        tag: "Visas & Travel ID",
        content: (
          <div className="clause-flow">
            <p>
              <strong>15.1</strong> International Guests are solely responsible
              for holding a valid passport, visa or entry permission for
              Nigeria, any required health documentation, and for meeting the
              entry rules of any country they travel through.
            </p>
            <p>
              <strong>15.2</strong> We can provide supporting information on
              request, but we do not provide immigration advice and are not
              liable if a Guest is refused entry or cannot travel.
            </p>
            <p>
              <strong>15.3</strong> Guests should carry a valid photo ID on
              Excursions, since some sites and checkpoints may require it.
            </p>
          </div>
        ),
      },
      {
        id: "sec-16",
        number: "16",
        title: "Liability and Indemnity",
        tag: "Liability",
        content: (
          <div className="clause-flow">
            <p>
              <strong>16.1</strong> We will provide the Programme with
              reasonable care and skill.
            </p>
            <div className="callout-card consumer-protection-card">
              <p>
                <strong>16.2</strong> Nothing in these Terms excludes or limits
                our liability for death or personal injury caused by our
                negligence, for fraud or fraudulent misrepresentation, or for
                any liability that cannot be excluded or limited under Nigerian
                law, including the rights Guests have as consumers under the
                Federal Competition and Consumer Protection Act 2018.
              </p>
            </div>
            <p>
              <strong>16.3</strong> Subject to 16.2, our total liability to a
              Guest in connection with a booking is limited to the amount paid
              by or for that Guest for the affected package. We are not liable
              for indirect or consequential loss, loss of enjoyment beyond what
              is allowed by law, loss of profit, or loss resulting from
              circumstances outside our reasonable control.
            </p>
            <p>
              <strong>16.4</strong> We are not liable for the acts, omissions or
              failures of Third-Party Providers, but we will assist Guests in
              good faith in pursuing any claim where reasonable.
            </p>
            <p>
              <strong>16.5</strong> We are not responsible for loss, theft or
              damage to personal belongings, money, electronics or documents.
              Guests are responsible for the safekeeping of their items.
            </p>
            <p>
              <strong>16.6</strong> Each Guest agrees to indemnify the
              Organisers against reasonable losses, claims and costs arising
              from that Guest’s breach of these Terms, unlawful conduct, or
              damage they cause to persons or property.
            </p>
          </div>
        ),
      },
      {
        id: "sec-17",
        number: "17",
        title: "Personal Data and Privacy",
        tag: "Data Protection & NDPA",
        content: (
          <div className="clause-flow">
            <div className="callout-card ndpa-privacy-card">
              <p>
                <strong>17.1</strong> We process personal data in line with
                the Nigeria Data Protection Act 2023 and applicable
                regulations. Insert the name and contact details of your Data
                Protection Officer or privacy contact.
              </p>
            </div>
            <p>
              <strong>17.2</strong> We collect information you provide (such as
              name, contact details, nationality, ID or passport details where
              needed, payment information, dietary and health information you
              choose to share, and emergency contacts) to process bookings,
              provide the Programme, arrange security, communicate with you,
              meet legal obligations, and improve our services.
            </p>
            <p>
              <strong>17.3</strong> We may share necessary information with
              suppliers, venues, transport and security providers, payment
              processors and authorities, but only to the extent required to
              deliver the Programme or comply with the law. We do not sell your
              personal data.
            </p>
            <p>
              <strong>17.4</strong> Payment card details are handled by our
              payment processor and are not stored on our own servers. [Confirm
              with your processor.]
            </p>
            <p>
              <strong>17.5</strong> You may ask to access, correct or delete
              your data, to object to certain processing, or to withdraw
              consent, by contacting us at the details in Section 24. We keep
              data only as long as necessary for the purposes described or as
              required by law.
            </p>
            <p>
              <strong>17.6</strong> Guests booking for others must have
              permission to give us those individuals’ data.
            </p>
          </div>
        ),
      },
      {
        id: "sec-18",
        number: "18",
        title: "Photography, Video and Media",
        tag: "Media & Drones",
        content: (
          <div className="clause-flow">
            <p>
              <strong>18.1</strong> We may photograph and film Excursions and
              events for promotional use, including on our websites and social
              media. By participating, Guests consent to appearing in such
              content. A Guest who does not wish to appear should tell the team
              at the start of the day or in writing before travel; we will make
              reasonable efforts to respect this.
            </p>
            <div className="callout-card media-rules-card">
              <p>
                <strong>18.2</strong> Guests may take photographs for personal
                use but must not film or photograph in areas where it is
                prohibited, nor commercially use content featuring other Guests,
                staff or security personnel without permission. Drone use is not
                permitted without our written approval and the necessary
                regulatory clearance.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "sec-19",
        number: "19",
        title: "Intellectual Property and Website Use",
        tag: "IP Rights",
        content: (
          <div className="clause-flow">
            <p>
              <strong>19.1</strong> All content on our website, including text,
              logos, images, itineraries, designs and trademarks, belongs to the
              Organisers or their licensors and may not be copied, modified or
              reused without written permission.
            </p>
            <p>
              <strong>19.2</strong> You must use the website lawfully and must
              not attempt to disrupt it, gain unauthorised access, scrape data,
              or submit false information.
            </p>
            <p>
              <strong>19.3</strong> We try to keep the website accurate and
              available but do not guarantee uninterrupted access or error-free
              content.
            </p>
          </div>
        ),
      },
      {
        id: "sec-20",
        number: "20",
        title: "Complaints and Dispute Resolution",
        tag: "Dispute Resolution",
        content: (
          <div className="clause-flow">
            <div className="dispute-step-card">
              <span className="dispute-step-tag">Initial Escalation</span>
              <p>
                <strong>20.1</strong> If something is not right during the
                Programme, please tell your guide or the host team immediately
                so that we can try to fix it on the spot.
              </p>
            </div>
            <div className="dispute-step-card">
              <span className="dispute-step-tag">Written Complaint</span>
              <p>
                <strong>20.2</strong> Any further complaint should be sent in
                writing to us within [14] days after the end of the relevant
                Excursion, with your booking reference and details. We will
                acknowledge it within [3] business days and aim to respond
                substantively within [14] business days.
              </p>
            </div>
            <div className="dispute-step-card mediation-card">
              <span className="dispute-step-tag">
                Mediation &amp; Arbitration
              </span>
              <p>
                <strong>20.3</strong> If a dispute cannot be resolved by
                discussion, the parties will first try in good faith to settle
                it through mediation. If that fails, the dispute shall be
                referred to arbitration in Lagos, Nigeria, under the Arbitration
                and Mediation Act 2023, before a single arbitrator. This does
                not prevent a Guest from exercising statutory consumer rights or
                approaching the Federal Competition and Consumer Protection
                Commission or the courts where the law gives that right.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "sec-21",
        number: "21",
        title: "Governing Law and Jurisdiction",
        tag: "Jurisdiction",
        content: (
          <div className="clause-flow">
            <p>
              These Terms, and any dispute arising from them, are governed by
              the laws of the Federal Republic of Nigeria. Subject to Section
              20, the courts of Lagos State have jurisdiction.
            </p>
          </div>
        ),
      },
      {
        id: "sec-22",
        number: "22",
        title: "Notices and Communications",
        tag: "Notices",
        content: (
          <div className="clause-flow">
            <p>
              We will contact you using the email address or WhatsApp number you
              provide. Guests are responsible for keeping these details up to
              date and for checking messages before travel. Official notices to
              us must be sent to the contact details below.
            </p>
          </div>
        ),
      },
      {
        id: "sec-23",
        number: "23",
        title: "General",
        tag: "General Provisions",
        content: (
          <div className="clause-flow">
            <p>
              <strong>23.1 Entire agreement.</strong> These Terms, together with
              your Booking Confirmation, make up the entire agreement between
              you and the Organisers for the Programme.
            </p>
            <p>
              <strong>23.2 Changes.</strong> We may update these Terms from time
              to time. The version that applies to your booking is the one in
              force when your booking was confirmed, unless a change is required
              by law or you agree otherwise.
            </p>
            <p>
              <strong>23.3 Severability.</strong> If any part of these Terms is
              found to be unenforceable, the remainder stays in effect.
            </p>
            <p>
              <strong>23.4 No waiver.</strong> A delay or failure to enforce a
              right is not a waiver of it.
            </p>
            <p>
              <strong>23.5 Assignment.</strong> We may assign our rights and
              obligations to a successor or co-organiser. You may not assign
              your booking except as permitted under Section 7.2.
            </p>
            <p>
              <strong>23.6 Joint organisers.</strong> Incel Holidays &amp;
              Tourism Ltd and Prospiz Management Consulting Limited co-host the
              Programme. [Specify here which entity contracts with the Guest and
              receives payment, and whether their responsibilities are joint or
              several.]
            </p>
            <p>
              <strong>23.7 Language.</strong> These Terms are written in
              English, and the English version prevails.
            </p>
          </div>
        ),
      },
      {
        id: "sec-24",
        number: "24",
        title: "Contact Us",
        tag: "Directory",
        content: (
          <div className="clause-flow">
            <div className="contact-directory-grid">
              <div className="contact-dir-card">
                <span className="contact-card-badge">
                  Co-Host &bull; Tourism Logistics
                </span>
                <h4 className="contact-card-title">
                  Incel Holidays &amp; Tourism Ltd
                </h4>
                <div className="contact-card-lines">
                  <p>
                    4th Floor, Right Wing, Mulliner Towers, Plot 39, Alfred
                    Rewane Road, Ikoyi, Lagos, Nigeria
                  </p>
                  <p>
                    <a href="mailto:enquiries@inceltourism.com">
                      enquiries@inceltourism.com
                    </a>{" "}
                    /{" "}
                    <a href="mailto:info@inceltourism.com">
                      info@inceltourism.com
                    </a>
                  </p>
                  <p>+234 708 859 9941, +234 818 085 0745</p>
                </div>
              </div>

              <div className="contact-dir-card">
                <span className="contact-card-badge">
                  Co-Host &bull; Advisory
                </span>
                <h4 className="contact-card-title">
                  Prospiz Management Consulting Limited
                </h4>
                <div className="contact-card-lines">
                  <p>address | email | phone</p>
                  <p>
                    Website:{" "}
                    <a
                      href="https://prospiz.inceltourism.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      prospiz.inceltourism.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="whatsapp-official-banner">
              <div className="wa-banner-text">
                <strong>WhatsApp (24/7 for registered Guests):</strong>
                <p>+234 812 345 6789</p>
              </div>
              <a
                href="https://wa.me/2348123456789?text=Hello%20Incel%20%26%20Prospiz%20Team!%20I%20have%20an%20inquiry%20regarding%20Lag%20Luxe%202026%20Terms%20and%20Conditions."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa-chat"
              >
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <p
              style={{
                marginTop: "8px",
                fontSize: "0.86rem",
                color: "var(--text-secondary)",
              }}
            >
              Website:{" "}
              <a
                href="https://prospiz.inceltourism.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--blue-primary)", fontWeight: 600 }}
              >
                prospiz.inceltourism.com
              </a>
            </p>
          </div>
        ),
      },
    ],
    [sortedPackages],
  );

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter((s) => {
      const titleMatch = s.title.toLowerCase().includes(q);
      const tagMatch = s.tag?.toLowerCase().includes(q);
      const numMatch = s.number.includes(q);
      return titleMatch || tagMatch || numMatch;
    });
  }, [searchQuery, sections]);

  return (
    <div className="terms-page-root">
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-container" aria-hidden="true">
        <div
          className="scroll-progress-fill"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="terms-header" ref={headerRef}>
        <div className="container header-container">
          {/* Left: Co-Branded Logos Side-by-Side (Matching Main Page) */}
          <Link
            href="/"
            className="nav-brand-group"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              flexShrink: 0,
            }}
            aria-label="Incel Holidays and Prospiz Management Consulting"
          >
            {/* Incel Holidays & Tourism Logo */}
            <div
              className="nav-logo-incel"
              style={{
                position: "relative",
                width: "106px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Image
                src="/tourism-logo.png"
                alt="Incel Holidays and Tourism Ltd"
                fill
                sizes="(max-width: 480px) 82px, (max-width: 768px) 96px, 106px"
                style={{ objectFit: "contain" }}
                priority
              />
            </div>

            {/* Prospiz Logo */}
            <div
              className="nav-logo-prospiz"
              style={{
                position: "relative",
                width: "40px",
                height: "40px",
                borderRadius: "9px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(15, 81, 50, 0.2)",
                border: "1.5px solid rgba(15, 81, 50, 0.25)",
                backgroundColor: "#ffffff",
                flexShrink: 0,
              }}
            >
              <Image
                src="/propiz-logo.png"
                alt="Prospiz Management Consulting Ltd"
                fill
                sizes="(max-width: 480px) 30px, (max-width: 768px) 36px, 40px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </Link>

          {/* Right: Actions styled like main page navigation */}
          <nav className="header-nav-links">
            <Link
              href="/"
              className="btn-nav-back"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                cursor: "pointer",
                borderRadius: "9999px",
              }}
              title="Return to Lagos Luxe experiences overview"
            >
              <ArrowLeft
                size={16}
                className="btn-nav-icon"
              />
              <span className="nav-btn-text-desktop">Back to Experiences</span>
              <span className="nav-btn-text-mobile">Back</span>
            </Link>

            <Link
              href="/#packages"
              className="btn-nav-book"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                cursor: "pointer",
                borderRadius: "9999px",
              }}
              title="Reserve seats for Lagos Luxe 2026"
            >
              <Sparkles size={15} className="btn-book-icon" />
              <span className="nav-btn-text-desktop">Book Excursion</span>
              <span className="nav-btn-text-mobile">Book</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Spacer so page content starts cleanly beneath the fixed header */}
      <div style={{ height: `${headerHeight}px` }} aria-hidden="true" />

      {/* Hero Header Section */}
      <section className="terms-hero">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">Lagos Luxe 2026: Terms and Conditions</h1>

            <p className="hero-lead">
              Official Programme Regulations governing all reservations, guest
              allocations, MOPOL security protocols, and operational policies
              for the Lagos Luxe 2026 initiative co-hosted by{" "}
              <strong style={{ color: "#ffffff" }}>
                Incel Holidays &amp; Tourism Ltd
              </strong>{" "}
              (RC 2007085) and{" "}
              <strong style={{ color: "#ffffff" }}>
                Prospiz Management Consulting Limited
              </strong>
              .
            </p>

            <div className="hero-meta-bar">
              <div className="meta-card">
                <span className="meta-card-label">Document Version</span>
                <span className="meta-card-value">Version 1.0</span>
              </div>
              <div className="meta-card-divider" />
              <div className="meta-card">
                <span className="meta-card-label">Effective Date</span>
                <span className="meta-card-value">22 November 2026</span>
              </div>
              <div className="meta-card-divider" />
              <div className="meta-card">
                <span className="meta-card-label">Programme Window</span>
                <span className="meta-card-value">
                  15&ndash;21 December 2026
                </span>
              </div>
              <div className="meta-card-divider" />
              <div className="meta-card">
                <span className="meta-card-label">Jurisdiction</span>
                <span className="meta-card-value">Lagos State, Nigeria</span>
              </div>
            </div>

            {/* Curated Fast-jump dock */}
            <div className="hero-quick-dock">
              <span className="dock-title">Quick Navigation:</span>
              <div className="dock-pills">
                <a href="#sec-3" className="dock-pill catalog-pill">
                  <span>Packages &amp; Inclusions (Sec 3)</span>
                </a>
                <a href="#sec-7" className="dock-pill refund-pill">
                  <span>Refund Schedule (Sec 7)</span>
                </a>
                <a href="#sec-9" className="dock-pill security-pill">
                  <span>Security &amp; MOPOL (Sec 9)</span>
                </a>
                <a href="#sec-17" className="dock-pill privacy-pill">
                  <span>Personal Data &amp; Privacy (Sec 17)</span>
                </a>
                <a href="#sec-20" className="dock-pill dispute-pill">
                  <span>Dispute Resolution (Sec 20)</span>
                </a>
                <a href="#sec-24" className="dock-pill contact-pill">
                  <span>Contact Us (Sec 24)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Legal Content Section */}
      <section className="terms-main-section">
        <div className="container">
          {/* Search & Stats Bar */}
          <div className="search-filter-bar">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search legal clauses (e.g., refund, MOPOL, cancellation, dietary, arbitration, data)..."
                className="search-input"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="search-clear-btn"
                >
                  Clear
                </button>
              ) : (
                <kbd
                  className="search-kbd"
                  title="Press / on your keyboard to search"
                >
                  /
                </kbd>
              )}
            </div>

            <div className="search-counter">
              Showing <strong>{filteredSections.length}</strong> of{" "}
              <strong>{sections.length}</strong> clauses
            </div>
          </div>

          {/* Mobile Table of Contents Accordion (Visible on < 960px) */}
          <div
            className="mobile-toc-wrapper"
            style={{
              top: headerHeight ? `${headerHeight}px` : "56px",
            }}
          >
            <details className="mobile-toc-details">
              <summary className="mobile-toc-summary">
                <div className="mobile-toc-summary-left">
                  <FileText size={16} className="mobile-toc-icon" />
                  <span>Table of Contents ({sections.length} Clauses)</span>
                </div>
                <div className="mobile-toc-summary-right">
                  <span className="mobile-toc-current-label">
                    {sections.find((s) => s.id === activeSectionId)?.number}.{" "}
                    {sections.find((s) => s.id === activeSectionId)?.title}
                  </span>
                  <ChevronDown size={15} className="mobile-toc-chevron" />
                </div>
              </summary>
              <div className="mobile-toc-dropdown">
                <div className="mobile-toc-links-grid">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={(e) => {
                        setActiveSectionId(sec.id);
                        const details = e.currentTarget.closest("details");
                        if (details) details.open = false;
                      }}
                      className={`mobile-toc-link ${activeSectionId === sec.id ? "active" : ""}`}
                    >
                      <span className="mobile-toc-num">{sec.number}.</span>
                      <span className="mobile-toc-name">{sec.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            </details>
          </div>

          <div className="legal-layout-grid">
            {/* Sticky Table of Contents Sidebar */}
            <aside className="legal-sidebar" aria-label="Table of contents">
              <div className="toc-sticky-card">
                <div className="toc-header">
                  <FileText size={16} />
                  <span>Table of Contents</span>
                </div>

                <nav className="toc-nav">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`toc-link ${activeSectionId === sec.id ? "active" : ""}`}
                    >
                      <span className="toc-number">{sec.number}.</span>
                      <span className="toc-title">{sec.title}</span>
                    </a>
                  ))}
                </nav>

                <div className="toc-featured-links">
                  <a href="#sec-7" className="toc-feat-link feat-refund">
                    <span>View Section 7 Refund Schedule</span>
                    <ChevronRight size={14} />
                  </a>
                  <a href="#sec-9" className="toc-feat-link feat-mopol">
                    <span>Section 9 Security &amp; MOPOL</span>
                    <ChevronRight size={14} />
                  </a>
                  <a href="#sec-17" className="toc-feat-link feat-privacy">
                    <span>Section 17 Data &amp; Privacy</span>
                    <ChevronRight size={14} />
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Legal Clauses Articles */}
            <main className="legal-content-main">
              {filteredSections.length === 0 ? (
                <div className="no-results-card">
                  <AlertTriangle size={36} className="no-results-icon" />
                  <h3>No matching clauses found</h3>
                  <p>
                    No clause matched your search &ldquo;{searchQuery}&rdquo;.
                    Try another term such as &ldquo;refund&rdquo;,
                    &ldquo;MOPOL&rdquo;, &ldquo;payment&rdquo;, or
                    &ldquo;insurance&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="btn-reset-search"
                  >
                    View All 24 Clauses
                  </button>
                </div>
              ) : (
                filteredSections.map((sec) => (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="legal-section-card"
                  >
                    <div className="card-top-bar">
                      <h2 className="section-heading">
                        {sec.number}. {sec.title}
                      </h2>
                      {sec.tag && (
                        <span className="section-tag-pill">{sec.tag}</span>
                      )}
                    </div>

                    <div className="section-content-wrapper">{sec.content}</div>
                  </article>
                ))
              )}
            </main>
          </div>
        </div>
      </section>

      {/* Floating Back-to-Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="btn-back-to-top"
          aria-label="Scroll back to top"
          title="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}

      {/* Standard Footer */}
      <Footer />

      <style jsx>{`
        .terms-page-root {
          background-color: var(--bg-main);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--text-body);
          width: 100%;
          max-width: 100vw;
          overflow-x: clip;
        }

        /* Scroll Progress Bar */
        .scroll-progress-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: rgba(0, 0, 0, 0.05);
          z-index: 101;
        }

        .scroll-progress-fill {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--blue-primary) 0%,
            var(--blue-sky) 100%
          );
          transition: width 0.1s linear;
        }

        /* Top Header */
        .terms-header {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 100 !important;
          background-color: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-light);
          box-shadow: 0 2px 12px rgba(1, 104, 167, 0.05);
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          padding-bottom: 12px;
          gap: 16px;
          width: 100%;
        }

        :global(.nav-brand-group),
        .nav-brand-group {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 8px !important;
          text-decoration: none !important;
          flex-shrink: 0 !important;
        }

        .nav-logo-incel {
          position: relative;
          width: 106px;
          height: 44px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: width 0.2s ease, height 0.2s ease;
        }

        .nav-logo-prospiz {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 9px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(15, 81, 50, 0.2);
          border: 1.5px solid rgba(15, 81, 50, 0.25);
          background-color: #ffffff;
          flex-shrink: 0;
          transition: width 0.2s ease, height 0.2s ease;
        }

        .header-nav-links {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        :global(.btn-nav-back),
        .btn-nav-back {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          background-color: var(--bg-subtle, #f8fafc) !important;
          border: 1.5px solid var(--border-light, #e2e8f0) !important;
          border-radius: 9999px !important;
          padding: 8px 18px !important;
          font-size: 0.88rem !important;
          font-weight: 700 !important;
          color: var(--text-heading, #091e42) !important;
          text-decoration: none !important;
          box-shadow: 0 1px 3px rgba(9, 30, 66, 0.04) !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          white-space: nowrap !important;
          min-height: 40px !important;
          cursor: pointer !important;
        }

        :global(.btn-nav-back:hover),
        .btn-nav-back:hover {
          background-color: var(--blue-surface, #f0f7ff) !important;
          border-color: var(--blue-primary, #0168a7) !important;
          color: var(--blue-deep, #0d47a1) !important;
          box-shadow: 0 4px 12px rgba(1, 104, 167, 0.12) !important;
          transform: translateY(-1px);
        }

        :global(.btn-nav-book),
        .btn-nav-book {
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
          background: linear-gradient(135deg, #0168a7 0%, #0d47a1 100%) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 9999px !important;
          padding: 9px 22px !important;
          font-size: 0.88rem !important;
          font-weight: 700 !important;
          text-decoration: none !important;
          box-shadow: 0 4px 14px rgba(1, 104, 167, 0.28) !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
          white-space: nowrap !important;
          min-height: 40px !important;
          cursor: pointer !important;
        }

        :global(.btn-nav-book:hover),
        .btn-nav-book:hover {
          background: linear-gradient(
            135deg,
            #0277bd 0%,
            #0168a7 100%
          ) !important;
          box-shadow: 0 6px 20px rgba(1, 104, 167, 0.45) !important;
          transform: translateY(-1px);
        }

        :global(.btn-nav-icon),
        .btn-nav-icon {
          color: var(--blue-primary, #0168a7) !important;
          flex-shrink: 0;
        }

        :global(.btn-book-icon),
        .btn-book-icon {
          color: #ffd54f !important;
          flex-shrink: 0;
        }

        :global(.nav-btn-text-desktop),
        .nav-btn-text-desktop {
          display: inline !important;
        }

        :global(.nav-btn-text-mobile),
        .nav-btn-text-mobile {
          display: none !important;
        }

        /* Hero Header */
        .terms-hero {
          background: radial-gradient(
            120% 140% at 50% 0%,
            #0d3878 0%,
            #08214d 50%,
            #05132b 100%
          );
          color: #ffffff;
          padding-top: 54px;
          padding-bottom: 46px;
          position: relative;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          width: 100%;
          max-width: 100%;
          overflow-x: clip;
        }

        .hero-container {
          width: 100%;
          max-width: 920px;
          min-width: 0;
        }

        .hero-content {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .hero-title {
          font-size: clamp(1.65rem, 4.2vw, 3.2rem);
          font-weight: 900;
          line-height: 1.16;
          color: #ffffff;
          margin-bottom: 14px;
          letter-spacing: -0.025em;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .hero-lead {
          font-size: 1.02rem;
          line-height: 1.65;
          color: #cbd5e1;
          margin-bottom: 24px;
          max-width: 820px;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .hero-meta-bar {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-md);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .meta-card {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 140px;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .meta-card-label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }

        .meta-card-value {
          font-size: 0.88rem;
          font-weight: 800;
          color: #ffffff;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .meta-card-divider {
          width: 1px;
          height: 32px;
          background-color: rgba(255, 255, 255, 0.12);
        }

        .hero-quick-dock {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 16px;
          border-top: 1px dashed rgba(255, 255, 255, 0.12);
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .dock-title {
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          flex-shrink: 0;
        }

        .dock-pills {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .dock-pill {
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .catalog-pill {
          background-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
          border-color: rgba(255, 255, 255, 0.18);
        }
        .catalog-pill:hover {
          background-color: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }

        .refund-pill {
          background-color: rgba(16, 185, 129, 0.16);
          color: #6ee7b7;
          border-color: rgba(16, 185, 129, 0.32);
        }
        .refund-pill:hover {
          background-color: rgba(16, 185, 129, 0.26);
          color: #a7f3d0;
        }

        .security-pill {
          background-color: rgba(56, 189, 248, 0.16);
          color: #7dd3fc;
          border-color: rgba(56, 189, 248, 0.32);
        }
        .security-pill:hover {
          background-color: rgba(56, 189, 248, 0.26);
          color: #bae6fd;
        }

        .privacy-pill {
          background-color: rgba(167, 139, 250, 0.16);
          color: #c4b5fd;
          border-color: rgba(167, 139, 250, 0.32);
        }
        .privacy-pill:hover {
          background-color: rgba(167, 139, 250, 0.26);
          color: #ddd6fe;
        }

        .dispute-pill {
          background-color: rgba(245, 158, 11, 0.16);
          color: #fcd34d;
          border-color: rgba(245, 158, 11, 0.32);
        }
        .dispute-pill:hover {
          background-color: rgba(245, 158, 11, 0.26);
          color: #fde68a;
        }

        .contact-pill {
          background-color: rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
          border-color: rgba(255, 255, 255, 0.18);
        }
        .contact-pill:hover {
          background-color: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }

        /* Terms Content Section */
        .terms-main-section {
          padding: 36px 0 64px 0;
          flex: 1;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .search-filter-bar {
          background-color: var(--bg-subtle);
          border: 1.5px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 14px 18px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
          width: 100%;
        }

        .search-icon {
          color: var(--blue-primary);
          flex-shrink: 0;
        }

        .search-input {
          width: 100%;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          font-size: 0.94rem;
          color: var(--text-heading);
          font-family: inherit;
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-clear-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .search-kbd {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.74rem;
          font-family: monospace;
          color: var(--text-muted);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .search-counter {
          font-size: 0.84rem;
          color: var(--text-secondary);
        }

        /* Mobile TOC Accordion */
        .mobile-toc-wrapper {
          display: none;
          margin-bottom: 22px;
          width: 100%;
          max-width: 100%;
        }

        .mobile-toc-details {
          background-color: #ffffff;
          border: 1.5px solid var(--border-light);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
          max-width: 100%;
        }

        .mobile-toc-details[open] {
          border-color: var(--blue-primary);
          box-shadow: 0 4px 16px rgba(1, 104, 167, 0.12);
        }

        .mobile-toc-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          cursor: pointer;
          list-style: none;
          user-select: none;
          background-color: var(--bg-subtle);
          gap: 10px;
          width: 100%;
          box-sizing: border-box;
        }

        .mobile-toc-summary::-webkit-details-marker {
          display: none;
        }

        .mobile-toc-summary-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.86rem;
          font-weight: 800;
          color: var(--blue-deep);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .mobile-toc-icon {
          color: var(--blue-primary);
          flex-shrink: 0;
        }

        .mobile-toc-summary-right {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          overflow: hidden;
          flex: 1;
          justify-content: flex-end;
        }

        .mobile-toc-current-label {
          font-size: 0.78rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
          font-weight: 600;
        }

        .mobile-toc-chevron {
          color: var(--blue-primary);
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .mobile-toc-details[open] .mobile-toc-chevron {
          transform: rotate(180deg);
        }

        .mobile-toc-dropdown {
          padding: 10px;
          max-height: min(380px, calc(100vh - 160px));
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          border-top: 1px solid var(--border-light);
          background-color: #ffffff;
        }

        .mobile-toc-links-grid {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .mobile-toc-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          text-decoration: none;
          color: var(--text-body);
          font-size: 0.86rem;
          transition: all 0.15s ease;
        }

        .mobile-toc-link:hover,
        .mobile-toc-link.active {
          background-color: var(--blue-surface);
          color: var(--blue-deep);
          font-weight: 700;
        }

        .mobile-toc-num {
          font-weight: 700;
          color: var(--blue-primary);
          min-width: 22px;
          flex-shrink: 0;
        }

        .mobile-toc-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Layout Grid */
        .legal-layout-grid {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 36px;
          align-items: stretch !important;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          position: relative;
        }

        .legal-sidebar {
          width: 280px;
          min-width: 0;
          position: relative;
        }

        .legal-content-main {
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        @media (max-width: 960px) {
          .legal-layout-grid {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
          .legal-sidebar {
            display: none !important;
          }
          .mobile-toc-wrapper {
            display: block !important;
            position: sticky !important;
            top: 56px;
            z-index: 95 !important;
            background-color: rgba(255, 255, 255, 0.96) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
            margin-bottom: 18px !important;
          }
          .legal-section-card {
            scroll-margin-top: 120px !important;
          }
          .legal-content-main {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
          }
        }

        /* Sidebar */
        .toc-sticky-card {
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 20px 16px;
          box-shadow: var(--shadow-sm);
          position: sticky !important;
          top: 84px !important;
          height: calc(100vh - 104px);
          max-height: calc(100vh - 104px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          display: flex;
          flex-direction: column;
        }

        .toc-header {
          font-size: 0.84rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--blue-deep);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .toc-nav {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-right: 4px;
        }

        .toc-link {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 7px 9px;
          border-radius: 6px;
          font-size: 0.82rem;
          color: var(--text-body);
          text-decoration: none;
          line-height: 1.35;
          transition: all 0.2s ease;
        }

        .toc-link:hover {
          background-color: var(--bg-subtle);
          color: var(--blue-primary);
        }

        .toc-link.active {
          background-color: var(--blue-surface);
          color: var(--blue-deep);
          font-weight: 700;
        }

        .toc-number {
          font-weight: 800;
          color: var(--blue-primary);
          flex-shrink: 0;
        }

        .toc-featured-links {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toc-feat-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.15s ease;
        }

        .toc-feat-link:hover {
          transform: translateX(2px);
        }

        .feat-refund {
          background-color: #ecfdf5;
          color: #065f46;
        }

        .feat-mopol {
          background-color: #eff6ff;
          color: #1e40af;
        }

        .feat-privacy {
          background-color: #fef3c7;
          color: #92400e;
        }

        /* Section Cards */
        .legal-section-card {
          background-color: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 28px 26px;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
          scroll-margin-top: 86px;
        }

        .card-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }

        .section-heading {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-heading);
          line-height: 1.25;
          margin: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .section-tag-pill {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--blue-primary);
          background-color: var(--blue-surface);
          border: 1px solid var(--blue-border);
          padding: 3px 9px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .section-content-wrapper {
          color: var(--text-body);
          font-size: 0.94rem;
          line-height: 1.72;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Spacing between clause numbers (1.1, 1.2, etc.) and their contents, matching Table of Contents (gap: 8px) */
        :global(.section-content-wrapper p > strong:first-child),
        :global(.clause-flow p > strong:first-child) {
          display: inline-block !important;
          margin-right: 8px !important;
        }

        .clause-flow {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .clause-flow p {
          margin: 0;
          line-height: 1.72;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }

        /* Callout Cards */
        .callout-card {
          border-radius: 10px;
          padding: 16px 18px;
          margin: 4px 0;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .age-card {
          background-color: #f0f7ff;
          border: 1.5px solid var(--blue-border);
        }

        .capacity-card {
          background-color: var(--bg-subtle);
          border: 1.5px solid var(--border-light);
        }

        .bank-transfer-card {
          background-color: #eff6ff;
          border: 1.5px solid #bfdbfe;
        }

        .timing-alert-card {
          background-color: #fffbeb;
          border: 1.5px solid #fde68a;
        }

        .prohibited-alert-card {
          background-color: #fff1f2;
          border: 1.5px solid #fecdd3;
        }

        .water-safety-card {
          background-color: #f0f9ff;
          border: 1.5px solid #bae6fd;
        }

        .insurance-notice-card {
          background-color: #eff6ff;
          border: 1.5px solid #bfdbfe;
        }

        .conduct-warning-card {
          background-color: #fff1f2;
          border: 1.5px solid #fecdd3;
        }

        .consumer-protection-card {
          background-color: #f0fdf4;
          border: 1.5px solid #bbf7d0;
        }

        .ndpa-privacy-card {
          background-color: #faf5ff;
          border: 1.5px solid #e9d5ff;
        }

        .media-rules-card {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
        }

        /* Legal Table */
        .table-responsive {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          margin: 8px 0;
          display: block;
        }

        :global(.legal-table),
        .legal-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
          border: 1px solid var(--border-light, #cbd5e1);
          margin: 10px 0;
          background-color: #ffffff;
        }

        :global(.legal-table th),
        :global(.legal-table td),
        .legal-table th,
        .legal-table td {
          border: 1px solid var(--border-light, #cbd5e1) !important;
          padding: 12px 14px;
          text-align: left !important;
          vertical-align: middle;
        }

        :global(.legal-table th),
        .legal-table th {
          background-color: #f8fafc !important;
          font-weight: 700;
          color: var(--text-heading);
          white-space: nowrap;
        }

        :global(.legal-table .price-cell),
        .price-cell {
          font-weight: 700;
          color: var(--blue-deep);
          white-space: nowrap;
        }

        :global(.legal-table .vip-row),
        .vip-row {
          background-color: #f0fdf4;
        }

        :global(.legal-table .vip-price),
        .vip-price {
          color: #059669;
          font-weight: 800;
        }

        .inclusion-box {
          background-color: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          border-radius: 10px;
          padding: 16px 18px;
          width: 100%;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .exclusion-box {
          background-color: #f8fafc;
          border: 1.5px solid var(--border-light);
          border-radius: 10px;
          padding: 16px 18px;
          width: 100%;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* MOPOL Command Banner */
        .mopol-command-banner {
          background: linear-gradient(135deg, #091e42 0%, #0d47a1 100%);
          color: #ffffff;
          border-radius: 12px;
          padding: 20px 22px;
          margin: 6px 0;
          width: 100%;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .mopol-lead {
          font-size: 0.94rem;
          color: #f1f5f9;
          line-height: 1.55;
          margin: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Dispute Step Cards */
        .dispute-step-card {
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 14px 16px;
          width: 100%;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .dispute-step-tag {
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--blue-primary);
          display: inline-block;
          margin-bottom: 4px;
        }

        .mediation-card {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
        }

        /* Contact Directory Grid */
        .contact-directory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin: 8px 0;
          width: 100%;
          box-sizing: border-box;
        }

        .contact-dir-card {
          background-color: var(--bg-subtle);
          border: 1.5px solid var(--border-light);
          border-radius: 10px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .contact-card-badge {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--blue-primary);
          background-color: var(--blue-surface);
          padding: 2px 8px;
          border-radius: 4px;
          width: fit-content;
        }

        .contact-card-title {
          font-size: 1.02rem;
          font-weight: 800;
          color: var(--text-heading);
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .contact-card-lines {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.84rem;
          margin-top: 4px;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .contact-card-lines a {
          color: var(--blue-primary);
          text-decoration: none;
          font-weight: 600;
          word-break: break-all;
        }

        .contact-card-lines a:hover {
          text-decoration: underline;
        }

        /* WhatsApp Official Banner */
        .whatsapp-official-banner {
          background-color: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 14px;
          width: 100%;
          box-sizing: border-box;
        }

        .wa-banner-text {
          flex: 1;
          min-width: 220px;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .wa-banner-text strong {
          font-size: 0.92rem;
          color: #065f46;
          display: block;
        }

        .wa-banner-text p {
          font-size: 0.86rem;
          color: #047857;
          margin: 2px 0 0 0;
          font-weight: 700;
        }

        .btn-wa-chat {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: #25d366;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: var(--radius-sm);
          font-size: 0.84rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-wa-chat:hover {
          background-color: #1eb954;
        }

        /* Back to top button */
        .btn-back-to-top {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 80;
          background-color: var(--blue-primary);
          color: #ffffff;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(1, 104, 167, 0.35);
          transition: all 0.2s ease;
        }

        .btn-back-to-top:hover {
          background-color: var(--blue-deep);
          transform: translateY(-2px);
        }

        /* Tablet Responsive Breakpoints (<= 960px) */
        @media (max-width: 960px) {
          .terms-hero {
            padding-top: 40px;
            padding-bottom: 34px;
          }
          .hero-lead {
            font-size: 0.98rem;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .hero-meta-bar {
            padding: 12px 16px;
            gap: 12px;
            margin-bottom: 20px;
          }
          .meta-card-divider {
            display: none;
          }
          .search-kbd {
            display: none;
          }
        }

        /* Mobile Responsive Breakpoints (<= 640px) */
        @media (max-width: 640px) {
          .header-container {
            padding-top: 10px !important;
            padding-bottom: 10px !important;
            gap: 8px !important;
          }
          :global(.nav-brand-group),
          .nav-brand-group {
            gap: 6px !important;
          }
          .nav-logo-incel {
            width: 84px !important;
            height: 35px !important;
          }
          .nav-logo-prospiz {
            width: 32px !important;
            height: 32px !important;
          }
          .header-nav-links {
            gap: 6px !important;
          }
          :global(.btn-nav-back),
          .btn-nav-back {
            padding: 7px 11px !important;
            font-size: 0.8rem !important;
            gap: 5px !important;
            min-height: 36px !important;
          }
          :global(.btn-nav-book),
          .btn-nav-book {
            padding: 7px 13px !important;
            font-size: 0.8rem !important;
            gap: 5px !important;
            min-height: 36px !important;
          }
          :global(.nav-btn-text-desktop),
          .nav-btn-text-desktop {
            display: none !important;
          }
          :global(.nav-btn-text-mobile),
          .nav-btn-text-mobile {
            display: inline !important;
          }
          .terms-hero {
            padding-top: 26px;
            padding-bottom: 24px;
          }
          .hero-title {
            font-size: clamp(1.4rem, 5.5vw, 1.95rem);
            margin-bottom: 10px;
            line-height: 1.22;
          }
          .hero-lead {
            font-size: 0.88rem;
            line-height: 1.58;
            margin-bottom: 16px;
          }
          .hero-meta-bar {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
          }
          .meta-card {
            min-width: 0;
          }
          .meta-card-label {
            font-size: 0.68rem;
          }
          .meta-card-value {
            font-size: 0.8rem;
            word-break: break-word;
          }
          .hero-quick-dock {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding-top: 12px;
          }
          .dock-title {
            font-size: 0.72rem;
          }
          .dock-pills {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .dock-pills::-webkit-scrollbar {
            display: none;
          }
          .dock-pill {
            flex-shrink: 0;
            font-size: 0.76rem;
            padding: 5px 10px;
          }
          .terms-main-section {
            padding: 20px 0 44px 0;
          }
          .search-filter-bar {
            padding: 10px 12px;
            margin-bottom: 16px;
            gap: 8px;
          }
          .search-input-wrap {
            min-width: 0;
            width: 100%;
            gap: 8px;
          }
          .search-input {
            font-size: 0.88rem;
          }
          .search-counter {
            width: 100%;
            text-align: right;
            font-size: 0.76rem;
          }
          .legal-section-card {
            padding: 16px 14px;
            border-radius: 10px;
            margin-bottom: 16px;
          }
          .card-top-bar {
            margin-bottom: 14px;
            gap: 8px;
          }
          .section-heading {
            font-size: 1.05rem;
            line-height: 1.35;
          }
          .section-tag-pill {
            font-size: 0.68rem;
            padding: 2px 7px;
          }
          .section-content-wrapper {
            font-size: 0.9rem;
            line-height: 1.66;
          }
          .callout-card {
            padding: 12px 12px;
            border-radius: 8px;
            font-size: 0.88rem;
          }
          .inclusion-box,
          .exclusion-box {
            padding: 14px 12px;
            border-radius: 8px;
          }
          .mopol-command-banner {
            padding: 16px 14px;
            border-radius: 10px;
          }
          .mopol-lead {
            font-size: 0.88rem;
            line-height: 1.5;
          }
          .contact-directory-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .contact-dir-card {
            padding: 14px 12px;
          }
          .whatsapp-official-banner {
            flex-direction: column;
            align-items: stretch;
            padding: 14px;
            gap: 12px;
          }
          .wa-banner-text {
            min-width: 0;
            width: 100%;
          }
          .btn-wa-chat {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
          }
          .table-responsive {
            margin: 6px 0;
            border-radius: 6px;
            border: 1px solid var(--border-light, #cbd5e1);
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            display: block;
          }
          :global(.legal-table),
          .legal-table {
            min-width: 480px;
            font-size: 0.8rem !important;
            border: none !important;
            margin: 0 !important;
          }
          :global(.legal-table th),
          :global(.legal-table td),
          .legal-table th,
          .legal-table td {
            padding: 8px 10px !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          :global(.legal-table .price-cell),
          .price-cell {
            white-space: normal !important;
            word-break: break-word !important;
          }
          .btn-back-to-top {
            bottom: max(16px, env(safe-area-inset-bottom, 16px));
            right: 16px;
            width: 40px;
            height: 40px;
          }
        }

        /* Extra narrow screens (<= 360px) */
        @media (max-width: 360px) {
          .nav-logo-incel {
            width: 74px !important;
            height: 32px !important;
          }
          .nav-logo-prospiz {
            width: 28px !important;
            height: 28px !important;
          }
          :global(.btn-nav-back),
          .btn-nav-back {
            padding: 6px 8px !important;
            font-size: 0.74rem !important;
          }
          :global(.btn-nav-book),
          .btn-nav-book {
            padding: 6px 10px !important;
            font-size: 0.74rem !important;
          }
          .hero-meta-bar {
            grid-template-columns: 1fr;
          }
          .legal-section-card {
            padding: 14px 10px;
          }
        }

        /* No Results Card */
        .no-results-card {
          background-color: #ffffff;
          border: 1.5px dashed var(--border-light);
          border-radius: var(--radius-md);
          padding: 48px 24px;
          text-align: center;
        }

        .no-results-icon {
          color: var(--coral-primary);
          margin-bottom: 12px;
        }

        .no-results-card h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-heading);
          margin-bottom: 8px;
        }

        .no-results-card p {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .btn-reset-search {
          padding: 8px 16px;
          font-size: 0.84rem;
          font-weight: 700;
          background-color: var(--bg-subtle);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--text-heading);
        }

        /* Print Optimization */
        @media print {
          .terms-header,
          .scroll-progress-container,
          .search-filter-bar,
          .legal-sidebar,
          .btn-back-to-top,
          .hero-quick-dock,
          .btn-book,
          .btn-back {
            display: none !important;
          }

          .terms-hero {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px 0 !important;
            border-bottom: none !important;
          }

          .hero-title {
            color: #000000 !important;
          }

          .hero-lead {
            color: #333333 !important;
          }

          .hero-meta-bar {
            background: #f8fafc !important;
            border: 1px solid #ccc !important;
            color: #000000 !important;
          }

          .meta-card-label {
            color: #666666 !important;
          }

          .meta-card-value {
            color: #000000 !important;
          }

          .legal-layout-grid {
            grid-template-columns: 1fr !important;
          }

          .legal-section-card {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
