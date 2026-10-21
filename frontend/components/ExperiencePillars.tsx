'use client';

import React from 'react';
import Image from 'next/image';
import { Compass, UtensilsCrossed, Flower2, PartyPopper, CheckCircle } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const ExperiencePillars: React.FC = () => {
  const pillars = [
    {
      title: 'Sites & Tours',
      icon: Compass,
      tagline: 'Olumo Rock, Lekki Conservation Centre, Badagry & Kalakuta with local storytellers',
      description:
        'Touch centuries of ancient Yoruba fortress history, walk across Africa’s longest rainforest canopy suspension bridge, and honor the sacred Afrobeat roots of Fela Kuti with expert local guides and dedicated security.',
      image: '/images/lekki-canopy.jpg',
      badge: 'Heritage & Wonders',
      perks: ['Canopy walkway & wildlife', 'Olumo Rock mountain climb', 'Badagry Point of No Return trail'],
      iconColor: 'var(--blue-deep)',
      iconBg: 'var(--blue-soft)',
    },
    {
      title: 'Food & Dining',
      icon: UtensilsCrossed,
      tagline: 'Jollof, suya, amala and guaranteed reservations at the most coveted tables in Lagos',
      description:
        'Skip the impossible reservation queues. Experience smoky wood-fired party jollof, tender charcoal-grilled peppered suya, authentic hot amala with rich ewedu and gbegiri, and curated tasting menus at Lagos’ top waterfront venues.',
      image: '/images/lagos-food.jpg',
      badge: 'Culinary Heritage',
      perks: ['Authentic Lagos street food gems', 'Coveted waterfront table reservations', 'Private group tastings & cocktail pairings'],
      iconColor: 'var(--blue-deep)',
      iconBg: 'var(--blue-soft)',
    },
    {
      title: 'Spa & Ocean Yoga',
      icon: Flower2,
      tagline: 'Slow down between the parties with restorative spa days and beach yoga sessions',
      description:
        'December in Lagos is legendary, but you cannot pour from an empty cup. Recharge your mind and body with luxury hydrotherapy, deep tissue massages, and sunrise oceanfront yoga to stay radiant throughout the holidays.',
      image: '/images/tarkwa-bay.jpg',
      badge: 'Rest & Recovery',
      perks: ['Deep tissue detox massages', 'Private Tarkwa Bay beach cabana lounge', 'Morning coastal mindfulness & yoga'],
      iconColor: 'var(--green-emerald)',
      iconBg: 'var(--green-soft)',
    },
    {
      title: 'Events & VIP Nights',
      icon: PartyPopper,
      tagline: 'Comedy specials, live Afrobeats concerts and priority access to December’s hottest nights',
      description:
        'No waiting outside venues in chaotic lines. We secure your VIP table guestlist, premium concert tickets, and exclusive comedy show seats so you immerse yourself directly in the pulse of global African entertainment.',
      image: '/images/lagos-nightlife.jpg',
      badge: 'Nightlife & Concerts',
      perks: ['Pre-vetted VIP concert entry passes', 'Reserved club tables in Victoria Island', 'Security escort to and from venues'],
      iconColor: '#7c3aed',
      iconBg: '#f3e8ff',
    },
  ];

  return (
    <section id="pillars" className="section-spacing" style={{
      backgroundColor: '#ffffff',
      position: 'relative',
    }}>
      <div className="container">
        {/* Section Heading */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 52px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}>
              The 4 Experience Pillars
            </h2>
            <p style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Crafted for visitors and locals who want rich culture, great food, wellness,
              and celebration seamlessly blended into one unforgettable December.
            </p>
          </div>
        </ScrollReveal>

        {/* 2x2 Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '32px',
          alignItems: 'stretch',
        }} className="pillars-grid">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal
                key={index}
                delayMs={index * 100}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="card-modern"
                  style={{
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  {/* Visual Header */}
                  <div style={{ position: 'relative', width: '100%', height: '240px', flexShrink: 0 }}>
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 550px"
                      style={{ objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(9, 30, 66, 0.05) 0%, rgba(9, 30, 66, 0.65) 100%)',
                    }} />

                    {/* Pillar Icon and Tag */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: pillar.iconColor,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}>
                        <Icon size={20} />
                      </div>
                      <span className="badge-blue" style={{
                        background: '#ffffff',
                        color: 'var(--blue-deep)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}>
                        {pillar.badge}
                      </span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div style={{
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}>
                    <div style={{ flexGrow: 1 }}>
                      <h3 style={{
                        fontSize: '1.4rem',
                        marginBottom: '8px',
                        color: 'var(--text-heading)',
                      }}>
                        {pillar.title}
                      </h3>
                      <div style={{
                        fontSize: '0.92rem',
                        color: 'var(--blue-deep)',
                        fontWeight: 700,
                        marginBottom: '14px',
                        lineHeight: 1.45,
                      }}>
                        {pillar.tagline}
                      </div>
                      <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-body)',
                        lineHeight: 1.6,
                        marginBottom: '20px',
                      }}>
                        {pillar.description}
                      </p>
                    </div>

                    {/* Highlights Bullet points */}
                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '9px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-light)',
                    }}>
                      {pillar.perks.map((perk, pIdx) => (
                        <div key={pIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.85rem',
                          color: 'var(--text-heading)',
                          fontWeight: 600,
                        }}>
                          <CheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
