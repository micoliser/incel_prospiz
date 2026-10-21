'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Bus, Compass, MessageCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Currency, formatPrice, ExcursionPackage } from '@/data/packages';
import { CampaignStats } from '@/lib/api';
import { ScrollReveal } from './ScrollReveal';

interface HeroProps {
  currentCurrency: Currency;
  onOpenBooking: () => void;
  packages?: ExcursionPackage[];
  stats?: CampaignStats | null;
}

export const Hero: React.FC<HeroProps> = ({ currentCurrency, onOpenBooking, packages, stats }) => {
  const lowestExcursion = packages && packages.length > 0
    ? packages.filter((p) => p.category === 'excursion').reduce((min, p) => p.priceNGN < min ? p.priceNGN : min, 70000)
    : 70000;
  const bundlePrice = packages?.find((p) => p.id === 'all-inclusive-vip')?.priceNGN ?? 520000;
  return (
    <section style={{
      position: 'relative',
      minHeight: '88vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '80px',
      paddingBottom: '90px',
      overflow: 'hidden',
    }}>
      {/* Background Image Only — Full Bleed & Cinematic */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}>
        <Image
          src="/images/hero-lagos.jpg"
          alt="Lagos Nigeria Lekki-Ikoyi Link Bridge at Twilight"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
          priority
        />

        {/* Minimal Contrast Scrim to Ensure Text Legibility While Keeping the Image 100% Punchy & Visible */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(3, 10, 22, 0.45) 0%, rgba(3, 10, 22, 0.6) 50%, rgba(3, 10, 22, 0.75) 100%)',
        }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <ScrollReveal>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            {/* Co-Branded Partnership Pill Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              background: 'rgba(3, 10, 22, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-full)',
              padding: '7px 20px',
              marginBottom: '26px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}>
              <span className="beacon-dot" />
              <span style={{ fontSize: '0.86rem', color: '#ffffff', fontWeight: 700, letterSpacing: '0.02em' }}>
                Incel Holidays & Tourism × Prospiz Management Consulting
              </span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(2.2rem, 5.5vw, 4.4rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              marginBottom: '20px',
              letterSpacing: '-0.035em',
              color: '#ffffff',
              textTransform: 'uppercase',
              textShadow: '0 2px 16px rgba(0, 0, 0, 0.6)',
            }}>
              Come Home, <br />
              <span style={{ color: '#38bdf8' }}>
                Experience Lagos
              </span> <br />
              in December.
            </h1>

            {/* Subtitle from Word Document */}
            <p style={{
              fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
              color: '#f1f5f9',
              lineHeight: 1.6,
              maxWidth: '720px',
              margin: '0 auto 28px',
              textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
              fontWeight: 500,
            }}>
              <strong style={{ color: '#ffffff', fontWeight: 800 }}>{stats?.eventDates?.display ?? '13–30 December 2026'}</strong> · 7 days of curated tours,
              world-class food, wellness and VIP nights. Air-conditioned transport, expert local guides, and
              dedicated MOPOL security sorted.
            </p>

            {/* Transparent Package Rates Box */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '12px',
              background: 'rgba(3, 10, 22, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 22px',
              marginBottom: '34px',
              backdropFilter: 'blur(14px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
              maxWidth: '100%',
            }}>
              <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.94rem' }}>
                Day Excursions from <strong style={{ color: '#38bdf8' }}>{formatPrice(lowestExcursion, currentCurrency, false, undefined, stats?.exchangeRates)}</strong> · 7-Day All-Access Pass <strong style={{ color: '#7dd3fc' }}>{formatPrice(bundlePrice, currentCurrency, false, undefined, stats?.exchangeRates)}</strong>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }} className="hide-mobile">|</span>
              <span style={{ color: stats?.earlyBird?.isActive !== false ? '#6ee7b7' : '#fca5a5', fontSize: '0.84rem', fontWeight: 800 }}>
                {stats?.earlyBird?.isActive !== false
                  ? `⚡ ${stats?.earlyBird?.discountPct ?? 5}% Early-Bird Active (${stats?.earlyBird?.remaining ?? 2} left)`
                  : '⚡ Official Capacity Active'}
              </span>
            </div>

            {/* Dual Action CTAs from Word Document */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              marginBottom: '42px',
            }} className="hero-cta-group">
              <button
                onClick={onOpenBooking}
                className="btn-primary"
                style={{ fontSize: '1.02rem', padding: '16px 34px' }}
              >
                <span>Book Your Experience</span>
                <ArrowRight size={18} />
              </button>

              <a
                href="https://wa.me/2348123456789?text=Hello%20Incel%20%26%20Prospiz%20Team!%20I%20am%20interested%20in%20the%20Detty%20December%20Lagos%20Luxe%202026%20package."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                style={{ fontSize: '0.98rem', padding: '15px 28px' }}
              >
                <MessageCircle size={18} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Trust Reassurance Tokens */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              alignItems: 'stretch',
              paddingTop: '22px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            }} className="hero-trust-grid">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '100%' }}>
                <ShieldCheck size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  Armed MOPOL Escort
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '100%' }}>
                <Bus size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  AC Executive Coasters
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '100%' }}>
                <Compass size={18} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  Vetted Cultural Guides
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', height: '100%' }}>
                <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                  Small Chops & Drinks
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .hero-cta-group {
            flex-direction: column !important;
            width: 100%;
          }
          .hero-cta-group button,
          .hero-cta-group a {
            width: 100% !important;
            justify-content: center !important;
          }
          .hide-mobile {
            display: none !important;
          }
        }
        @media (max-width: 480px) {
          .hero-trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            text-align: left;
          }
        }
      `}</style>
    </section>
  );
};
