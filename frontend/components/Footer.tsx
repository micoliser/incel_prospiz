'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MapPin, ShieldCheck, Search } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: '#02060f',
      borderTop: '1px solid rgba(1, 104, 167, 0.25)',
      paddingTop: '68px',
      paddingBottom: '40px',
      color: '#cbd5e1',
    }}>
      <div className="container">
        {/* Top Footer Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '40px',
          marginBottom: '54px',
        }}>
          {/* Brand Info & Collaboration */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <div style={{ position: 'relative', width: '110px', height: '46px' }}>
                <Image
                  src="/tourism-logo.png"
                  alt="Incel Holidays & Tourism Ltd"
                  fill
                  sizes="110px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '9px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(15, 81, 50, 0.35)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                backgroundColor: '#ffffff',
                flexShrink: 0,
              }}>
                <Image
                  src="/propiz-logo.png"
                  alt="Prospiz Management Consulting Ltd"
                  fill
                  sizes="40px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '16px' }}>
              <strong style={{ color: '#ffffff' }}>Lagos Luxe 2026</strong> is an exclusive joint travel & culture initiative
              co-hosted by Incel Holidays & Tourism Ltd and Prospiz Management Consulting Limited.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
              <ShieldCheck size={17} />
              <span>Accredited Nigerian Tourism & Management Partnership</span>
            </div>
          </div>

          {/* Experience Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Excursion Packages
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
              <li>
                <a href="#packages" className="footer-link" style={{ color: '#cbd5e1', transition: 'color 0.2s' }}>
                  Abeokuta Heritage & Olumo Rock (₦75k)
                </a>
              </li>
              <li>
                <a href="#packages" className="footer-link" style={{ color: '#cbd5e1', transition: 'color 0.2s' }}>
                  Badagry Slave Route Expedition (₦70k/₦90k)
                </a>
              </li>
              <li>
                <a href="#packages" className="footer-link" style={{ color: '#cbd5e1', transition: 'color 0.2s' }}>
                  Tarkwa Bay Beach Day & Boat Cruise (₦75k)
                </a>
              </li>
              <li>
                <a href="#packages" className="footer-link" style={{ color: '#cbd5e1', transition: 'color 0.2s' }}>
                  Kalakuta Afrobeat Museum & Fela Shrine (₦85k)
                </a>
              </li>
              <li>
                <a href="#packages" className="footer-link" style={{ color: '#cbd5e1', transition: 'color 0.2s' }}>
                  Lekki Conservation Centre Canopy Walk (₦75k)
                </a>
              </li>
              <li>
                <a href="#packages" className="footer-link" style={{ color: '#38bdf8', fontWeight: 700 }}>
                  7-Day All-Access Lagos Luxe VIP Pass (₦520k)
                </a>
              </li>
            </ul>
          </div>

          {/* Operational Guarantees */}
          <div>
            <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Guest Support & Safety
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldCheck size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                <span>Dedicated armed MOPOL police escort on all excursions</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                <span>Departures from Victoria Island & Lekki meeting points</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Phone size={18} style={{ color: '#25D366', flexShrink: 0, marginTop: '2px' }} />
                <span>24/7 WhatsApp Support Hotline for registered guests</span>
              </li>
              <li style={{ paddingTop: '6px' }}>
                <Link
                  href="/booking/lookup"
                  className="footer-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#38bdf8',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Search size={15} />
                  <span>Find My Booking</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct Support Contact */}
          <div>
            <h4 style={{ fontSize: '0.98rem', color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Contact Our Team
            </h4>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginBottom: '16px', lineHeight: 1.5 }}>
              Have questions about foreign currency payments, airport pickups, or group reservations? Chat directly with our host team.
            </p>
            <a
              href="https://wa.me/2348123456789?text=Hello%20Incel%20%26%20Prospiz%20Team!%20I%20have%20an%20inquiry%20regarding%20Lagos%20Luxe%202026."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.92rem' }}
            >
              <Phone size={16} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '28px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '0.84rem',
          color: '#64748b',
        }}>
          <div>
            © 2026 Incel Holidays & Tourism Ltd × Prospiz Management Consulting Limited. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <Link href="/terms" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
            <Link href="/terms#sec-7" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none' }}>Cancellation &amp; Refund Policy</Link>
            <Link href="/terms#sec-9" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none' }}>MOPOL Security Protocol</Link>
            <Link href="/terms#sec-17" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none' }}>NDPA 2023 Privacy</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-link:hover {
          color: #ffffff !important;
        }
      `}</style>
    </footer>
  );
};
