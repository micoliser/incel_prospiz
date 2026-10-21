'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Currency } from '@/data/packages';
import { Phone, Menu, X, Globe, ChevronDown, Check, Search } from 'lucide-react';

interface NavbarProps {
  currentCurrency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onOpenBooking: (packageId?: string) => void;
}

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentCurrency,
  onCurrencyChange,
  onOpenBooking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCurrencyObj = CURRENCIES.find((c) => c.code === currentCurrency) || CURRENCIES[0];

  return (
    <header style={{
      position: 'relative',
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: '0 2px 12px rgba(1, 104, 167, 0.05)',
    }}>

      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        paddingBottom: '12px',
        flexWrap: 'nowrap',
      }}>
        {/* Left: Co-Branded Logos Side by Side (Bolder, No "x", Snug Spacing) */}
        <a
          href="#"
          className="nav-brand-group"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
          aria-label="Incel Holidays and Prospiz Management Consulting"
        >
          {/* Incel Holidays & Tourism Logo */}
          <div
            className="nav-logo-incel"
            style={{
              position: 'relative',
              width: '106px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Image
              src="/tourism-logo.png"
              alt="Incel Holidays and Tourism Ltd"
              fill
              sizes="(max-width: 480px) 92px, 106px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Prospiz Logo - Bolder & Clean */}
          <div
            className="nav-logo-prospiz"
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '9px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(15, 81, 50, 0.2)',
              border: '1.5px solid rgba(15, 81, 50, 0.25)',
              backgroundColor: '#ffffff',
              flexShrink: 0,
            }}
          >
            <Image
              src="/propiz-logo.png"
              alt="Prospiz Management Consulting Ltd"
              fill
              sizes="40px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        </a>

        {/* Center: Desktop Nav Links (No Wrap, Distinct Nav Link Styling) */}
        <nav
          className="desktop-nav"
          style={{
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
          }}
        >
          <a href="#packages" className="nav-link">
            Excursions & Pricing
          </a>
          <a href="#pillars" className="nav-link">
            The 4 Pillars
          </a>
          <a href="#sorted" className="nav-link">
            Sorted For You
          </a>
          <a href="#itinerary" className="nav-link">
            7-Day Itinerary
          </a>
          <a href="#faq" className="nav-link">
            FAQ
          </a>
        </nav>

        {/* Right: Desktop Actions (Currency Dropdown, Find Booking, WhatsApp, Book Seats) */}
        <div
          className="desktop-actions"
          style={{
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'nowrap',
            flexShrink: 0,
          }}
        >
          {/* Find Booking by Reference */}
          <Link
            href="/booking/lookup"
            className="find-booking-nav-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1.5px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--text-heading)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            title="Search a reservation by reference"
          >
            <Search size={14} style={{ color: 'var(--blue-primary)' }} />
            <span>Find Booking</span>
          </Link>

          {/* Custom Currency Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="currency-dropdown-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: 'var(--bg-subtle)',
                border: '1.5px solid var(--border-light)',
                borderRadius: 'var(--radius-full)',
                padding: '8px 14px',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--text-heading)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              aria-expanded={currencyDropdownOpen}
              aria-haspopup="listbox"
            >
              <Globe size={15} style={{ color: 'var(--blue-primary)' }} />
              <span>{activeCurrencyObj.code} ({activeCurrencyObj.symbol})</span>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transform: currencyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {/* Dropdown Menu Popover */}
            {currencyDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  minWidth: '150px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {CURRENCIES.map((cur) => {
                  const isSelected = cur.code === currentCurrency;
                  return (
                    <button
                      key={cur.code}
                      onClick={() => {
                        onCurrencyChange(cur.code);
                        setCurrencyDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isSelected ? 'var(--blue-surface)' : 'transparent',
                        color: isSelected ? 'var(--blue-deep)' : 'var(--text-heading)',
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      className="currency-option-item"
                    >
                      <span>{cur.label}</span>
                      {isSelected && <Check size={14} style={{ color: 'var(--blue-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Support Link */}
          <a
            href="https://wa.me/2348123456789?text=Hello%20Incel%20%26%20Prospiz%20Team!%20I%20am%20interested%20in%20the%20Detty%20December%20Lagos%20Luxe%202026%20package."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            style={{ padding: '9px 16px', fontSize: '0.86rem' }}
          >
            <Phone size={14} />
            <span>WhatsApp</span>
          </a>

          {/* Book Now Button */}
          <button
            onClick={() => onOpenBooking()}
            className="btn-primary"
            style={{ padding: '9px 18px', fontSize: '0.86rem' }}
          >
            Book Seats
          </button>
        </div>

        {/* Right on Mobile: ONLY the Hamburger Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)',
            borderRadius: '10px',
            color: 'var(--text-heading)',
            cursor: 'pointer',
            padding: '10px',
            width: '44px',
            height: '44px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu (Shows the rest when clicked) */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer"
          style={{
            backgroundColor: '#ffffff',
            borderBottom: '2px solid var(--blue-primary)',
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideUpDrawer 0.2s ease',
          }}
        >
          {/* Mobile Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <a
              href="#packages"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              Excursions & Pricing
            </a>
            <a
              href="#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              The 4 Experience Pillars
            </a>
            <a
              href="#sorted"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              Sorted For You (Transport & Security)
            </a>
            <a
              href="#itinerary"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              7-Day Curated Itinerary
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
            >
              Frequently Asked Questions
            </a>

            {/* Mobile Find Booking Link */}
            <Link
              href="/booking/lookup"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--blue-deep)',
                fontWeight: 800,
                backgroundColor: 'var(--blue-surface)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginTop: '6px',
              }}
            >
              <Search size={16} />
              <span>Find My Booking</span>
            </Link>
          </div>

          {/* Mobile Currency Dropdown Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-heading)' }}>
              <Globe size={16} style={{ color: 'var(--blue-primary)' }} />
              <span>Currency:</span>
            </div>

            <select
              value={currentCurrency}
              onChange={(e) => onCurrencyChange(e.target.value as Currency)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid rgba(1, 104, 167, 0.25)',
                backgroundColor: '#ffffff',
                color: 'var(--blue-deep)',
                fontWeight: 700,
                fontSize: '16px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Action CTAs */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '6px',
          }}>
            <a
              href="https://wa.me/2348123456789?text=Hello%20Incel%20%26%20Prospiz%20Team!%20I%20am%20interested%20in%20the%20Detty%20December%20Lagos%20Luxe%202026%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              style={{ justifyContent: 'center', minHeight: '48px', fontSize: '0.96rem' }}
            >
              <Phone size={17} />
              <span>Chat on WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', minHeight: '48px', fontSize: '0.96rem' }}
            >
              Book Experience Now
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Desktop Nav Link Styles */
        .desktop-nav {
          display: none;
        }
        .desktop-actions {
          display: none;
        }
        .mobile-toggle {
          display: flex;
        }

        .nav-link {
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-heading);
          transition: all 0.2s ease;
          display: inline-block;
          white-space: nowrap;
        }
        .nav-link:hover {
          background-color: var(--blue-surface);
          color: var(--blue-deep);
        }

        .currency-dropdown-btn:hover {
          border-color: var(--blue-primary);
          background-color: var(--blue-surface);
        }

        .currency-option-item:hover {
          background-color: var(--blue-surface) !important;
          color: var(--blue-deep) !important;
        }

        .mobile-nav-link {
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-heading);
          padding: 12px 6px;
          border-bottom: 1px solid var(--border-light);
          transition: color 0.15s ease;
          display: block;
        }
        .mobile-nav-link:last-child {
          border-bottom: none;
        }
        .mobile-nav-link:hover {
          color: var(--blue-primary);
        }

        /* Desktop Breakpoint */
        @media (min-width: 1024px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-actions {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .nav-brand-group {
            gap: 6px !important;
          }
          .nav-logo-incel {
            width: 92px !important;
            height: 38px !important;
          }
          .nav-logo-prospiz {
            width: 35px !important;
            height: 35px !important;
          }
        }
      `}</style>
    </header>
  );
};
