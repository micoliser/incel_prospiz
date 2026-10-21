'use client';

import React from 'react';
import { ShieldCheck, Bus, Compass, CalendarCheck, Utensils, CheckCircle2, Sparkles } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const SortedForYou: React.FC = () => {
  const pillars = [
    {
      icon: ShieldCheck,
      badge: 'OFFICIAL MOPOL ESCORT',
      title: 'Dedicated Armed Security',
      description:
        'Peace of mind is non-negotiable. Every excursion vehicle and group transfer is escorted by vetted Mobile Police (MOPOL) personnel and professional security handlers from departure to drop-off.',
      specs: ['Armed police escort on all routes', 'Direct mainland & island clearance'],
    },
    {
      icon: Bus,
      badge: 'EXECUTIVE FLEET',
      title: 'Air-Conditioned VIP Transit',
      description:
        'No battling chaotic Lagos traffic on your own. Travel in air-conditioned 28-seat luxury coasters and executive Hiace vans with experienced drivers who know the fastest routes across the city.',
      specs: ['Air-conditioned coaster & Hiace fleet', 'Departures from VI & Lekki hubs'],
    },
    {
      icon: Compass,
      badge: 'CERTIFIED EXPERTS',
      title: 'Vetted Cultural Guides',
      description:
        'Learn the untold stories of ancient Abeokuta, Badagry’s coastal heritage, and Fela Kuti’s revolutionary Kalakuta from certified Nigerian cultural guides and native storytellers.',
      specs: ['Licensed Nigerian heritage guides', 'VIP queue-skip museum access'],
    },
    {
      icon: CalendarCheck,
      badge: 'FLAWLESS EXECUTION',
      title: 'Curated 7-Day Schedule',
      description:
        'Paced to perfection. Designed so you never feel exhausted or rushed between day explorations, restorative beach breaks, gourmet food trails, and electric VIP December parties.',
      specs: ['Built-in rest & wellness windows', 'Synchronized concert & tour timing'],
    },
  ];

  return (
    <section id="sorted" className="section-spacing" style={{
      backgroundColor: 'var(--bg-subtle)',
      position: 'relative',
      borderTop: '1px solid var(--border-light)',
      borderBottom: '1px solid var(--border-light)',
    }}>
      <div className="container">
        {/* Section Heading */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 52px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '14px',
            }}>
              <span className="badge-blue">
                <Sparkles size={13} />
                What&apos;s Included
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}>
              Sorted For You
            </h2>
            <p style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              The biggest headache of December in Lagos is getting around safely and avoiding traffic stress.
              Incel Holidays & Prospiz handle all the transportation, security, and planning so you just show up and enjoy.
            </p>
          </div>
        </ScrollReveal>

        {/* 4-Column Balanced Grid (Uniform Luxury Palette, Zero Rainbow Borders) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '24px',
          alignItems: 'stretch',
          marginBottom: '28px',
        }} className="sorted-grid">
          {pillars.map((item, index) => {
            const Icon = item.icon;
            return (
              <ScrollReveal
                key={index}
                delayMs={index * 80}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="card-modern sorted-card"
                  style={{
                    padding: '28px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xl)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Card Header: Icon & Verified Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '20px',
                  }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(1, 104, 167, 0.08) 0%, rgba(13, 71, 161, 0.12) 100%)',
                      border: '1px solid rgba(1, 104, 167, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--blue-deep)',
                      flexShrink: 0,
                    }}>
                      <Icon size={22} />
                    </div>

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--blue-deep)',
                      backgroundColor: 'var(--blue-surface)',
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(1, 104, 167, 0.15)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      <span className="beacon-dot" style={{ width: '6px', height: '6px' }} />
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginBottom: '20px' }}>
                    <h3 style={{
                      fontSize: '1.18rem',
                      lineHeight: 1.3,
                      marginBottom: '10px',
                      color: 'var(--text-heading)',
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.6,
                      flexGrow: 1,
                    }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Concrete Verified Specs at Bottom */}
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {item.specs.map((spec, sIdx) => (
                      <div key={sIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.78rem',
                        color: 'var(--text-heading)',
                        fontWeight: 600,
                      }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--green-emerald)', flexShrink: 0 }} />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Full-Width Complimentary On-Board Hospitality Banner */}
        <ScrollReveal delayMs={350}>
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid rgba(1, 104, 167, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '18px',
              boxShadow: '0 2px 12px rgba(1, 104, 167, 0.05)',
            }}
            className="hospitality-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: 'var(--blue-surface)',
                border: '1px solid rgba(1, 104, 167, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--blue-deep)',
                flexShrink: 0,
              }}>
                <Utensils size={20} />
              </div>
              <div>
                <div style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--blue-primary)',
                  marginBottom: '2px',
                }}>
                  Standard On Every Trip
                </div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                  Fresh Gourmet Small Chops & Chilled Refreshments
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '0.86rem',
              color: 'var(--text-body)',
              lineHeight: 1.5,
              flex: '2 1 360px',
            }}>
              Every excursion vehicle is catered with freshly boxed Nigerian small chops (warm puff puff, samosas, spring rolls), chilled bottled spring water, and soft drinks.
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'var(--green-soft)',
              borderRadius: 'var(--radius-full)',
              color: '#065f46',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}>
              <CheckCircle2 size={15} style={{ color: 'var(--green-emerald)' }} />
              <span>Complimentary On-Board</span>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <style jsx>{`
        .sorted-card:hover {
          border-color: rgba(1, 104, 167, 0.4) !important;
          box-shadow: 0 12px 28px -4px rgba(1, 104, 167, 0.12) !important;
          transform: translateY(-4px);
        }
        @media (max-width: 640px) {
          .hospitality-banner {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
};
