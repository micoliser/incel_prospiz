'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What armed security and logistics protection is provided?',
      a: 'Safety and comfort are our highest operational priorities. Every excursion trip—including travel to Abeokuta, Badagry, and around Lagos—is escorted by vetted Mobile Police (MOPOL) personnel and professional logistics security handlers. All travel is conducted in dedicated, air-conditioned executive Coasters and Hiace buses.',
    },
    {
      q: 'Can I book individual day excursions or only the full 7-day pass?',
      a: 'You have total flexibility! You can book individual day excursions (such as the Abeokuta Olumo Rock tour for ₦75,000, Badagry Slave Route from ₦70,000, Tarkwa Bay Beach Day for ₦75,000, etc.) or choose the full 7-day All-Access "Lagos Luxe" VIP pass for ₦520,000 which includes all 5 excursions, culinary feasts, and concert/comedy access.',
    },
    {
      q: 'How does payment work for diaspora guests paying in USD or GBP?',
      a: 'We support international cards, bank transfers, and virtual payment links in NGN, USD, and GBP. All payments are securely processed through our collaborative central collection account managed by Incel Holidays and Prospiz.',
    },
    {
      q: 'What is the group discount policy?',
      a: 'As established in our operational strategy, groups of 4 to 9 guests automatically receive a 5% discount on their total booking. For large corporate retreats or groups of 10+, please contact our team directly on WhatsApp for a custom package quote.',
    },
    {
      q: 'Can you assist with airport pickup and luxury lodging?',
      a: 'Yes. Incel Holidays & Tourism Ltd is an accredited full-service travel operator. If you need executive airport protocol, VIP airport transfers from Murtala Muhammed International Airport (LOS), or curated boutique hotel/shortlet accommodations in Victoria Island or Ikoyi, simply mention it in your booking notes or chat with us on WhatsApp.',
    },
    {
      q: 'When do ticket bookings close?',
      a: 'The campaign closes strictly on 15 December 2026, or as soon as each 100-passenger package cap is reached. Early-bird pricing (5% off the first 20 seats) is valid until 15 November.',
    },
  ];

  return (
    <section id="faq" className="section-spacing" style={{
      backgroundColor: 'var(--bg-subtle)',
      position: 'relative',
      borderTop: '1px solid var(--border-light)',
    }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        {/* Section Heading */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Everything you need to know about safety, logistics, payments, and booking your Detty December experience.
            </p>
          </div>
        </ScrollReveal>

        {/* Accordion list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <ScrollReveal key={idx} delayMs={idx * 60}>
                <div
                  className="card-modern faq-item-card"
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    borderColor: isOpen ? 'var(--blue-primary)' : 'var(--border-light)',
                    boxShadow: isOpen ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    backgroundColor: '#ffffff',
                  }}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}>
                    <h3 style={{
                      fontSize: '1.08rem',
                      color: isOpen ? 'var(--blue-deep)' : 'var(--text-heading)',
                      fontWeight: 700,
                      lineHeight: 1.35,
                    }}>
                      {faq.q}
                    </h3>
                    <div style={{
                      color: isOpen ? 'var(--blue-deep)' : 'var(--text-muted)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                    }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {isOpen && (
                    <p style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-light)',
                      fontSize: '0.92rem',
                      color: 'var(--text-body)',
                      lineHeight: 1.65,
                    }}>
                      {faq.a}
                    </p>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .faq-item-card {
            padding: 18px 16px !important;
          }
        }
      `}</style>
    </section>
  );
};
