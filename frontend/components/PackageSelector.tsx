'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PACKAGES_DATA, Currency, formatPrice, ExcursionPackage, ExchangeRates } from '@/data/packages';
import { Clock, MapPin, Check, ArrowRight, Sparkles } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface PackageSelectorProps {
  currentCurrency: Currency;
  onSelectPackage: (packageId: string) => void;
  packages?: ExcursionPackage[];
  exchangeRates?: ExchangeRates;
}

export const PackageSelector: React.FC<PackageSelectorProps> = ({
  currentCurrency,
  onSelectPackage,
  packages = PACKAGES_DATA,
  exchangeRates,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'excursion' | 'bundle'>('all');
  const [badagryForeigner, setBadagryForeigner] = useState(false);

  const filteredPackages = packages.filter((pkg) => {
    if (activeTab === 'all') return true;
    return pkg.category === activeTab;
  });

  return (
    <section id="packages" className="section-spacing" style={{
      backgroundColor: 'var(--bg-subtle)',
      position: 'relative',
      borderTop: '1px solid var(--border-light)',
      borderBottom: '1px solid var(--border-light)',
    }}>
      <div className="container">
        {/* Section Heading */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '14px',
            }}>
              <span className="badge-blue">
                <Sparkles size={13} /> Official Tour Rates & Inclusions
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}>
              Pick Your Experience
            </h2>
            <p style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Every excursion includes executive air-conditioned transport, armed MOPOL police escorts,
              entry passes, certified local guides, and chilled catering. Choose single days or the full 7-Day Pass.
            </p>
          </div>
        </ScrollReveal>

        {/* Filter Controls & Visitor Rate Toggle */}
        <ScrollReveal delayMs={100}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '36px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-light)',
          }}>
            {/* Tab Filters (Scrollable on mobile) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              maxWidth: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
            }} className="no-scrollbar">
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  background: activeTab === 'all' ? 'var(--blue-deep)' : 'transparent',
                  color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  boxShadow: activeTab === 'all' ? '0 2px 8px rgba(13, 71, 161, 0.25)' : 'none',
                }}
              >
                All Packages ({packages.length})
              </button>
              <button
                onClick={() => setActiveTab('excursion')}
                style={{
                  background: activeTab === 'excursion' ? 'var(--blue-deep)' : 'transparent',
                  color: activeTab === 'excursion' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  boxShadow: activeTab === 'excursion' ? '0 2px 8px rgba(13, 71, 161, 0.25)' : 'none',
                }}
              >
                Day Excursions ({packages.filter((p) => p.category === 'excursion').length})
              </button>
              <button
                onClick={() => setActiveTab('bundle')}
                style={{
                  background: activeTab === 'bundle' ? 'var(--blue-deep)' : 'transparent',
                  color: activeTab === 'bundle' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  boxShadow: activeTab === 'bundle' ? '0 2px 8px rgba(13, 71, 161, 0.25)' : 'none',
                }}
              >
                All-Access 7-Day Pass ({packages.filter((p) => p.category === 'bundle').length})
              </button>
            </div>

            {/* Badagry Diaspora / International Visitor Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 10px',
              boxShadow: 'var(--shadow-sm)',
              maxWidth: '100%',
              overflowX: 'auto',
            }} className="no-scrollbar">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-body)', fontWeight: 700, whiteSpace: 'nowrap', paddingLeft: '4px' }}>
                Guest Type:
              </span>
              <button
                onClick={() => setBadagryForeigner(false)}
                style={{
                  background: !badagryForeigner ? 'var(--blue-surface)' : 'transparent',
                  color: !badagryForeigner ? 'var(--blue-deep)' : 'var(--text-muted)',
                  border: !badagryForeigner ? '1px solid rgba(1, 104, 167, 0.25)' : 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Nigerian Resident
              </button>
              <button
                onClick={() => setBadagryForeigner(true)}
                style={{
                  background: badagryForeigner ? 'var(--blue-surface)' : 'transparent',
                  color: badagryForeigner ? 'var(--blue-deep)' : 'var(--text-muted)',
                  border: badagryForeigner ? '1px solid rgba(1, 104, 167, 0.25)' : 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                International Visitor
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Packages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '28px',
          alignItems: 'stretch',
        }}>
          {filteredPackages.map((pkg, idx) => {
            const isBundle = pkg.category === 'bundle';
            const displayPrice = formatPrice(
              pkg.priceNGN,
              currentCurrency,
              badagryForeigner,
              pkg,
              exchangeRates
            );
            const remainingSeats = pkg.seatsRemaining !== undefined ? pkg.seatsRemaining : Math.max(0, pkg.maxSeats - pkg.seatsBooked);
            const isSoldOut = remainingSeats <= 0;

            return (
              <ScrollReveal
                key={pkg.id}
                delayMs={idx * 75}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="card-modern"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    borderColor: isBundle ? 'rgba(1, 104, 167, 0.45)' : undefined,
                    boxShadow: isBundle ? '0 12px 36px -6px rgba(1, 104, 167, 0.22)' : undefined,
                  }}
                >
                  {/* Image and Badges */}
                  <div style={{ position: 'relative', width: '100%', height: '230px', flexShrink: 0 }}>
                    <Image
                      src={pkg.image}
                      alt={pkg.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(9, 30, 66, 0.1) 0%, rgba(9, 30, 66, 0.7) 100%)',
                    }} />

                    {/* Highlight Badge */}
                    {pkg.highlightBadge && (
                      <div style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                      }}>
                        <span className="badge-blue" style={{
                          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                          background: isBundle ? 'var(--blue-deep)' : 'var(--blue-primary)',
                          color: '#ffffff',
                          border: 'none',
                        }}>
                          {pkg.highlightBadge}
                        </span>
                      </div>
                    )}

                    {/* Capacity Counter */}
                    <div style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      background: isSoldOut ? 'rgba(239, 68, 68, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      color: isSoldOut ? '#ffffff' : (remainingSeats < 10 ? '#dc2626' : 'var(--blue-deep)'),
                      backdropFilter: 'blur(8px)',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                    }}>
                      {isSoldOut ? 'SOLD OUT' : `${remainingSeats} seats left of ${pkg.maxSeats}`}
                    </div>

                    {/* Location & Duration floating on image bottom */}
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '14px',
                      right: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: '#ffffff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                      fontWeight: 600,
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} style={{ color: '#38bdf8' }} />
                        {pkg.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} style={{ color: '#7dd3fc' }} />
                        {pkg.duration}
                      </span>
                    </div>
                  </div>

                  {/* Content Box */}
                  <div style={{
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      {/* Title & Tagline */}
                      <h3 style={{
                        fontSize: '1.25rem',
                        lineHeight: 1.25,
                        marginBottom: '8px',
                        color: 'var(--text-heading)',
                      }}>
                        {pkg.name}
                      </h3>
                      <p style={{
                        fontSize: '0.88rem',
                        color: 'var(--text-body)',
                        lineHeight: 1.55,
                        marginBottom: '18px',
                      }}>
                        {pkg.tagline}
                      </p>

                      {/* Capacity Progress Bar */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.76rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                          fontWeight: 600,
                        }}>
                          <span>Live Booking ({pkg.seatsBooked}/{pkg.maxSeats})</span>
                          <span style={{ color: 'var(--green-emerald)', fontWeight: 700 }}>
                            {pkg.maxSeats} Max Limit
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '7px',
                          backgroundColor: '#e2e8f0',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${(pkg.seatsBooked / pkg.maxSeats) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, var(--blue-primary) 0%, var(--blue-deep) 100%)',
                            borderRadius: '4px',
                          }} />
                        </div>
                      </div>

                      {/* Key Inclusions List */}
                      <div style={{ marginBottom: '22px', flexGrow: 1 }}>
                        <div style={{
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--blue-deep)',
                          marginBottom: '10px',
                        }}>
                          Inclusions & Guarantees:
                        </div>
                        <ul style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}>
                          {pkg.inclusions.slice(0, 4).map((inc: string, i: number) => (
                            <li key={i} style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '9px',
                              fontSize: '0.85rem',
                              color: 'var(--text-body)',
                              lineHeight: 1.4,
                            }}>
                              <Check size={16} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Price & CTA Action */}
                    <div style={{
                      marginTop: 'auto',
                      paddingTop: '18px',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Per Guest {pkg.id === 'badagry-heritage' && (badagryForeigner ? '(Diaspora Rate)' : '(Resident Rate)')}
                        </div>
                        <div style={{
                          fontSize: '1.45rem',
                          fontWeight: 900,
                          color: 'var(--blue-deep)',
                          lineHeight: 1.1,
                        }}>
                          {displayPrice}
                        </div>
                      </div>

                      {isSoldOut ? (
                        <button
                          disabled
                          style={{
                            padding: '12px 20px',
                            fontSize: '0.88rem',
                            backgroundColor: '#e2e8f0',
                            color: '#94a3b8',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'not-allowed',
                          }}
                        >
                          <span>Sold Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectPackage(pkg.id)}
                          className="btn-primary"
                          style={{ padding: '12px 20px', fontSize: '0.88rem' }}
                        >
                          <span>Reserve Seat</span>
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
