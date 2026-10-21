'use client';

import React from 'react';
import { MousePointerClick, CreditCard, TicketCheck, PartyPopper, ArrowRight } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const HowItWorks: React.FC<{ onBookNow: () => void }> = ({ onBookNow }) => {
  const steps = [
    {
      num: '01',
      icon: MousePointerClick,
      title: 'Choose Your Experience',
      description:
        'Select individual day excursions (Abeokuta, Badagry, Tarkwa Bay, Kalakuta, Lekki CC) or choose the 7-Day All-Access Pass.',
    },
    {
      num: '02',
      icon: CreditCard,
      title: 'Book Online or on WhatsApp',
      description:
        'Pay securely with card or direct bank transfer. Prefer a personal touch? Reserve directly with our team on WhatsApp.',
    },
    {
      num: '03',
      icon: TicketCheck,
      title: 'Get Your Ticket & Details',
      description:
        'Receive your digital tickets, trip details, pickup location, and our 24/7 WhatsApp support contact.',
    },
    {
      num: '04',
      icon: PartyPopper,
      title: 'Arrive in Lagos & Enjoy',
      description:
        'Step off the plane into air-conditioned transport with MOPOL security escort. Live the most unforgettable Detty December of your life.',
    },
  ];

  return (
    <section className="section-spacing" style={{
      backgroundColor: 'var(--bg-subtle)',
      position: 'relative',
      borderTop: '1px solid var(--border-light)',
      borderBottom: '1px solid var(--border-light)',
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
              How It Works
            </h2>
            <p style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              From booking your seat today to arriving in Lagos, our team takes care of every detail so you can simply enjoy.
            </p>
          </div>
        </ScrollReveal>

        {/* 4-Step Flow */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          alignItems: 'stretch',
          position: 'relative',
        }}>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <ScrollReveal
                key={idx}
                delayMs={idx * 90}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <div
                  className="card-modern"
                  style={{
                    padding: '36px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    gap: '16px',
                    position: 'relative',
                  }}
                >
                  {/* Step Number Stamp */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '14px',
                      backgroundColor: 'var(--blue-surface)',
                      border: '1px solid rgba(1, 104, 167, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--blue-deep)',
                    }}>
                      <Icon size={24} />
                    </div>

                    <span style={{
                      fontSize: '1.9rem',
                      fontWeight: 900,
                      color: 'rgba(1, 104, 167, 0.2)',
                      fontFamily: 'monospace',
                    }}>
                      {step.num}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      color: 'var(--text-heading)',
                      lineHeight: 1.3,
                      marginBottom: '10px',
                    }}>
                      {step.title}
                    </h3>

                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.6,
                      flex: 1,
                    }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* CTA bar */}
        <ScrollReveal delayMs={300}>
          <div style={{
            marginTop: '48px',
            textAlign: 'center',
          }}>
            <button
              onClick={onBookNow}
              className="btn-primary"
              style={{ padding: '16px 36px', fontSize: '1.02rem' }}
            >
              <span>Start Your Booking</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
