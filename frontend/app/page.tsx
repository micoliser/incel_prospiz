'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Currency, ExcursionPackage, PACKAGES_DATA } from '@/data/packages';
import { getPackages, getCampaignStats, CampaignStats } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { UrgencyTicker } from '@/components/UrgencyTicker';
import { Hero } from '@/components/Hero';
import { PackageSelector } from '@/components/PackageSelector';
import { ExperiencePillars } from '@/components/ExperiencePillars';
import { SortedForYou } from '@/components/SortedForYou';
import { ItineraryTimeline } from '@/components/ItineraryTimeline';
import { HowItWorks } from '@/components/HowItWorks';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { BookingModal } from '@/components/BookingModal';

export default function Home() {
  const [currency, setCurrency] = useState<Currency>('NGN');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activePackageId, setActivePackageId] = useState<string | undefined>(undefined);
  const [packages, setPackages] = useState<ExcursionPackage[]>(PACKAGES_DATA);
  const [stats, setStats] = useState<CampaignStats | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      const [pkgs, st] = await Promise.all([getPackages(), getCampaignStats()]);
      if (pkgs && pkgs.length > 0) {
        setPackages(pkgs);
      }
      if (st) {
        setStats(st);
      }
    } catch (e) {
      console.warn('Could not refresh live numbers:', e);
    }
  }, []);

  useEffect(() => {
    refreshAll();

    // 30-second periodic polling for live booking counts & capacity
    const interval = setInterval(() => {
      refreshAll();
    }, 30000);

    // Instant revalidation when tab regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshAll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshAll]);

  const handleOpenBooking = (packageId?: string) => {
    setActivePackageId(packageId);
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
    setActivePackageId(undefined);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Urgency Ticker Banner with live early bird seats and countdown */}
      <UrgencyTicker stats={stats} />

      {/* Navigation Header */}
      <Navbar
        currentCurrency={currency}
        onCurrencyChange={setCurrency}
        onOpenBooking={() => handleOpenBooking()}
      />

      {/* Main Content Area */}
      <main style={{ flexGrow: 1 }}>
        {/* Hero Section */}
        <Hero
          currentCurrency={currency}
          onOpenBooking={() => handleOpenBooking()}
          packages={packages}
          stats={stats}
        />

        {/* Packages & Excursions Selector (Live booking numbers & capacity bars) */}
        <PackageSelector
          currentCurrency={currency}
          onSelectPackage={(id) => handleOpenBooking(id)}
          packages={packages}
          exchangeRates={stats?.exchangeRates}
        />

        {/* The 4 Experience Pillars from Word Doc */}
        <ExperiencePillars />

        {/* Sorted For You (Transport, Guides, Armed MOPOL Security, 7-Day Pacing) */}
        <SortedForYou />

        {/* 7-Day Day-by-Day Interactive Itinerary */}
        <ItineraryTimeline onBookNow={() => handleOpenBooking()} />

        {/* 4-Step How It Works Flow from Word Doc */}
        <HowItWorks onBookNow={() => handleOpenBooking()} />

        {/* Frequently Asked Questions */}
        <Faq />
      </main>

      {/* Co-Branded Footer */}
      <Footer />

      {/* Interactive Booking & Payment Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        selectedPackageId={activePackageId}
        currentCurrency={currency}
        packages={packages}
        exchangeRates={stats?.exchangeRates}
        onBookingSuccess={refreshAll}
      />
    </div>
  );
}
