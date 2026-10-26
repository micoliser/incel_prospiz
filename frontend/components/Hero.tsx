import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Bus,
  Compass,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Tag,
  Users,
  Flame,
  Check,
  Copy,
} from 'lucide-react';
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
  const [copiedCode, setCopiedCode] = useState(false);

  const lowestExcursion = packages && packages.length > 0
    ? packages.filter((p) => p.category === 'excursion').reduce((min, p) => p.priceNGN < min ? p.priceNGN : min, 70000)
    : 70000;
  const bundlePrice = packages?.find((p) => p.id === 'all-inclusive-vip')?.priceNGN ?? 520000;

  const earlyBirdCode = stats?.earlyBird?.code || 'EARLYBIRD17';
  const discountPct = stats?.earlyBird?.discountPct ?? 2;
  const remainingSeats = stats?.earlyBird?.remaining ?? 10;

  const handleCopy = () => {
    navigator.clipboard.writeText(earlyBirdCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };


  return (
    <section style={{
      position: 'relative',
      minHeight: '88vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: '60px',
      paddingBottom: '80px',
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
          background: 'linear-gradient(180deg, rgba(3, 10, 22, 0.45) 0%, rgba(3, 10, 22, 0.6) 50%, rgba(3, 10, 22, 0.78) 100%)',
        }} />
      </div>

      <div className="hero-viewport-container" style={{ position: 'relative', zIndex: 1 }}>
        <ScrollReveal>
          <div className="hero-flank-wrapper">
            {/* Left Flank Card: Early-Bird Promo */}
            <aside className="hero-side-card-wrapper hero-side-card-left" aria-label="Early Bird Discount">
              <div className="hero-card-gradient-frame hero-card-frame-blue">
                <div className="hero-card-inner hero-card-inner-blue">
                  {/* Top Header Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span className="hero-card-badge hero-card-badge-blue">
                      <Flame size={12} style={{ color: '#38bdf8' }} />
                      <span>EARLY-BIRD OFFER</span>
                    </span>
                    <span className="hero-card-beacon-cyan" title="Active promotion" />
                  </div>

                  {/* Big Hero Discount Typography */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '2.35rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #7dd3fc 60%, #38bdf8 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      {discountPct}% OFF
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginTop: '4px' }}>
                      Pre-Season Priority Pass
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    lineHeight: 1.45,
                    margin: '0 0 14px',
                  }}>
                    Lock in early pricing across all 6 excursions & VIP passes before seat allocations fill up.
                  </p>

                  {/* High-Contrast Voucher Code Box */}
                  <div style={{
                    backgroundColor: 'rgba(14, 165, 233, 0.08)',
                    border: '1px dashed rgba(56, 189, 248, 0.45)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.62rem', color: '#7dd3fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Promo Voucher
                      </span>
                      <span style={{
                        display: 'block',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        color: '#f0f9ff',
                        fontSize: '1.02rem',
                        letterSpacing: '0.08em',
                        textShadow: '0 0 8px rgba(56, 189, 248, 0.35)',
                      }}>
                        {earlyBirdCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy voucher code"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '7px 12px',
                        borderRadius: '9px',
                        border: 'none',
                        backgroundColor: copiedCode ? '#059669' : 'rgba(2, 132, 199, 0.85)',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: copiedCode
                          ? '0 2px 8px rgba(5, 150, 105, 0.3)'
                          : '0 2px 8px rgba(2, 132, 199, 0.3)',
                        flexShrink: 0,
                      }}
                    >
                      {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Live Seats Left Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(3, 10, 22, 0.45)',
                    borderRadius: '9px',
                    border: '1px solid rgba(56, 189, 248, 0.16)',
                    marginBottom: '14px',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      ⚡ Allocation:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 800 }}>
                      ~{remainingSeats} seats left
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="hero-card-action-btn hero-card-action-blue"
                  >
                    <span>Claim {discountPct}% Off</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </aside>

            {/* Center Content Column */}
            <div className="hero-center-column">
              {/* Co-Branded Partnership Pill Tag */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                background: 'rgba(3, 10, 22, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-full)',
                padding: '7px 20px',
                marginBottom: '24px',
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
                fontSize: 'clamp(2.1rem, 5vw, 4.1rem)',
                fontWeight: 900,
                lineHeight: 1.08,
                marginBottom: '18px',
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
                fontSize: 'clamp(0.96rem, 1.7vw, 1.2rem)',
                color: '#f1f5f9',
                lineHeight: 1.55,
                maxWidth: '680px',
                margin: '0 auto 24px',
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
                padding: '11px 20px',
                marginBottom: '30px',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                maxWidth: '100%',
              }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.92rem' }}>
                  Day Excursions from <strong style={{ color: '#38bdf8' }}>{formatPrice(lowestExcursion, currentCurrency, false, undefined, stats?.exchangeRates)}</strong> · 7-Day All-Access Pass <strong style={{ color: '#7dd3fc' }}>{formatPrice(bundlePrice, currentCurrency, false, undefined, stats?.exchangeRates)}</strong>
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }} className="hide-mobile">|</span>
                <span style={{ color: stats?.earlyBird?.isActive !== false ? '#6ee7b7' : '#fca5a5', fontSize: '0.84rem', fontWeight: 800 }}>
                  {stats?.earlyBird?.isActive !== false
                    ? `⚡ ${stats?.earlyBird?.discountPct ?? 2}% Early-Bird Active`
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
                marginBottom: '36px',
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
                  href="https://wa.me/2348123456789?text=Hello%20Incel%20%26%20Prospiz%20Team!%20I%20am%20interested%20in%20the%20Lagos%20Luxe%202026%20package."
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                alignItems: 'stretch',
                paddingTop: '20px',
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

            {/* Right Flank Card: Group Squad Discount */}
            <aside className="hero-side-card-wrapper hero-side-card-right" aria-label="Group Discount">
              <div className="hero-card-gradient-frame hero-card-frame-green">
                <div className="hero-card-inner hero-card-inner-green">
                  {/* Top Header Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span className="hero-card-badge hero-card-badge-green">
                      <Users size={12} style={{ color: '#6ee7b7' }} />
                      <span>GROUP TRAVEL DEAL</span>
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#fef08a',
                      backgroundColor: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.45)',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                    }}>
                      4+ Guests
                    </span>
                  </div>

                  {/* Big Hero Discount Typography */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontSize: '2.35rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #6ee7b7 60%, #fde047 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      2% OFF
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginTop: '4px' }}>
                      Automatic Squad Discount
                    </div>
                  </div>

                  <p style={{
                    fontSize: '0.78rem',
                    color: '#94a3b8',
                    lineHeight: 1.45,
                    margin: '0 0 14px',
                  }}>
                    Traveling together as friends, family, or holiday group? Enjoy an automatic savings on every seat.
                  </p>

                  {/* High-Contrast Individual Group Perks Box (NO COMBINING) */}
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px dashed rgba(52, 211, 153, 0.45)',
                    borderRadius: '12px',
                    padding: '11px 12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                      <Sparkles size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: '#f0fdf4', fontWeight: 800 }}>
                        Instant Group Savings
                      </span>
                    </div>
                    <span style={{ display: 'block', fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                      Automatic 2% discount applied at checkout whenever you book 4 or more seats.
                    </span>
                  </div>

                  {/* Live Eligibility Tag */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    backgroundColor: 'rgba(3, 10, 22, 0.45)',
                    borderRadius: '9px',
                    border: '1px solid rgba(16, 185, 129, 0.16)',
                    marginBottom: '14px',
                  }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      ⚡ Activation:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#6ee7b7', fontWeight: 800 }}>
                      Auto-applied for 4+
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={onOpenBooking}
                    className="hero-card-action-btn hero-card-action-green"
                  >
                    <span>Book Squad Deals</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </ScrollReveal>
      </div>

      <style jsx>{`
        .hero-viewport-container {
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
          padding: 0 40px;
        }

        .hero-flank-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
          position: relative;
          width: 100%;
        }

        .hero-center-column {
          flex: 0 1 700px;
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-side-card-wrapper {
          flex: 0 0 280px;
          max-width: 290px;
        }

        .hero-card-gradient-frame {
          border-radius: 24px;
          padding: 2.5px;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease;
        }

        .hero-card-frame-blue {
          background: linear-gradient(145deg, rgba(56, 189, 248, 0.55) 0%, rgba(2, 132, 199, 0.3) 35%, rgba(13, 71, 161, 0.35) 70%, rgba(96, 165, 250, 0.55) 100%);
          box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 0 14px rgba(2, 132, 199, 0.12);
          animation: heroCardBreatheBlue 5.4s ease-in-out infinite;
        }

        .hero-card-frame-blue:hover {
          animation-play-state: paused;
          transform: scale(1.025) translateY(-4px);
          box-shadow: 0 20px 42px -6px rgba(0, 0, 0, 0.55), 0 0 30px rgba(56, 189, 248, 0.35);
        }

        .hero-card-frame-green {
          background: linear-gradient(145deg, rgba(52, 211, 153, 0.55) 0%, rgba(5, 150, 105, 0.3) 35%, rgba(217, 119, 6, 0.35) 70%, rgba(16, 185, 129, 0.55) 100%);
          box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 0 14px rgba(16, 185, 129, 0.12);
          animation: heroCardBreatheGreen 5.4s ease-in-out infinite 0.9s;
        }

        .hero-card-frame-green:hover {
          animation-play-state: paused;
          transform: scale(1.025) translateY(-4px);
          box-shadow: 0 20px 42px -6px rgba(0, 0, 0, 0.55), 0 0 30px rgba(52, 211, 153, 0.35);
        }

        .hero-card-inner {
          border-radius: 21.5px;
          padding: 20px 18px;
          backdrop-filter: blur(20px);
          text-align: left;
        }

        .hero-card-inner-blue {
          background: linear-gradient(180deg, rgba(8, 22, 46, 0.82) 0%, rgba(3, 10, 22, 0.88) 100%);
        }

        .hero-card-inner-green {
          background: linear-gradient(180deg, rgba(6, 26, 22, 0.82) 0%, rgba(2, 12, 16, 0.88) 100%);
        }

        .hero-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-card-badge-blue {
          background: rgba(2, 132, 199, 0.22);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #7dd3fc;
        }

        .hero-card-badge-green {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(52, 211, 153, 0.35);
          color: #6ee7b7;
        }

        .hero-card-beacon-cyan {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #38bdf8;
          box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.6);
          animation: beaconPulseCyan 2s infinite;
        }

        .hero-card-action-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .hero-card-action-blue {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.9) 0%, rgba(13, 71, 161, 0.95) 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.3);
        }

        .hero-card-action-blue:hover {
          background: linear-gradient(135deg, #0284c7 0%, #0d47a1 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.45);
        }

        .hero-card-action-green {
          background: linear-gradient(135deg, rgba(5, 150, 105, 0.9) 0%, rgba(4, 120, 87, 0.95) 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
        }

        .hero-card-action-green:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(5, 150, 105, 0.45);
        }

        @keyframes heroCardBreatheBlue {
          0%, 100% {
            transform: scale(1) translateY(0px);
            box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 0 14px rgba(2, 132, 199, 0.12);
          }
          50% {
            transform: scale(1.015) translateY(-2.5px);
            box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.42), 0 0 22px rgba(56, 189, 248, 0.22);
          }
        }

        @keyframes heroCardBreatheGreen {
          0%, 100% {
            transform: scale(1) translateY(0px);
            box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 0 14px rgba(16, 185, 129, 0.12);
          }
          50% {
            transform: scale(1.015) translateY(-2.5px);
            box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.42), 0 0 22px rgba(52, 211, 153, 0.22);
          }
        }

        @keyframes beaconPulseCyan {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 7px rgba(56, 189, 248, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
          }
        }

        @media (max-width: 1220px) {
          .hero-viewport-container {
            padding: 0 24px;
          }
          .hero-flank-wrapper {
            display: grid !important;
            grid-template-areas:
              "center center"
              "left right";
            gap: 24px !important;
            justify-content: center !important;
          }
          .hero-center-column {
            grid-area: center;
            width: 100% !important;
            max-width: 820px !important;
          }
          .hero-side-card-left {
            grid-area: left;
            width: 100% !important;
            max-width: 340px !important;
          }
          .hero-side-card-right {
            grid-area: right;
            width: 100% !important;
            max-width: 340px !important;
          }
          .hero-card-frame-blue,
          .hero-card-frame-green {
            animation: none !important;
          }
        }

        @media (max-width: 680px) {
          .hero-viewport-container {
            padding: 0 16px;
          }
          .hero-flank-wrapper {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
          }
          .hero-side-card-wrapper {
            width: 100% !important;
            max-width: 100% !important;
          }
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

