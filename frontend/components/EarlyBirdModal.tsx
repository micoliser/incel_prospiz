'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, ArrowRight, Tag, Users, Flame } from 'lucide-react';
import { CampaignStats } from '@/lib/api';

interface EarlyBirdModalProps {
  stats?: CampaignStats | null;
  onClaim?: (code?: string) => void;
}

export const EarlyBirdModal: React.FC<EarlyBirdModalProps> = ({ stats, onClaim }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic values directly from backend CampaignStats
  const earlyBirdCode = stats?.earlyBird?.code || 'EARLYBIRD17';
  const discountPct = stats?.earlyBird?.discountPct ?? 5;
  const remainingSeats = stats?.earlyBird?.remaining ?? 10;
  const totalCap = stats?.earlyBird?.totalCap ?? 20;

  useEffect(() => {
    // Show popup with smooth entrance delay after page loads
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(earlyBirdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClaim = () => {
    setIsOpen(false);
    if (onClaim) {
      onClaim(earlyBirdCode);
    } else {
      const el = document.getElementById('packages');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(3, 10, 22, 0.72)',
        backdropFilter: 'blur(8px)',
        animation: 'ebFadeIn 0.3s ease-out',
      }}
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-bird-title"
    >
      {/* Outer Wrapper for 4-Sided Gradient Border */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(135deg, #0d47a1 0%, #0168a7 35%, #059669 70%, #d97706 100%)',
          borderRadius: '26px',
          padding: '3px', // Continuous gradient border on all four sides
          boxShadow: '0 25px 60px -12px rgba(1, 104, 167, 0.4), 0 0 35px rgba(5, 150, 105, 0.2)',
          animation: 'ebScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner Content Card */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '23px',
            overflow: 'hidden',
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close promotion modal"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#0a192f';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X size={18} />
          </button>

          {/* Header Hero Area */}
          <div
            style={{
              padding: '32px 32px 20px',
              background: 'linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%)',
              textAlign: 'center',
            }}
          >
            {/* Micro Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#e0f2fe',
                color: '#0d47a1',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '14px',
              }}
            >
              <Sparkles size={14} style={{ color: '#0168a7' }} />
              <span>Festive Season Exclusive</span>
            </div>

            <h2
              id="early-bird-title"
              style={{
                fontSize: '1.85rem',
                fontWeight: 900,
                color: '#091e42',
                lineHeight: 1.15,
                letterSpacing: '-0.025em',
                margin: '0 0 10px',
              }}
            >
              Claim Your <span style={{ color: '#0168a7' }}>{discountPct}% Early-Bird</span> Discount 🌴
            </h2>

            <p
              style={{
                fontSize: '0.94rem',
                color: '#475569',
                lineHeight: 1.5,
                margin: '0 auto',
                maxWidth: '420px',
              }}
            >
              Plan your December in Lagos early. Lock in premium curated excursions, vetted security, and VIP access before allocations fill up.
            </p>
          </div>

          {/* Voucher Code Box */}
          <div style={{ padding: '0 32px 20px' }}>
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '2px dashed #93c5fd',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0d47a1',
                    flexShrink: 0,
                  }}
                >
                  <Tag size={20} />
                </div>
                <div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Checkout Promo Voucher
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '1.35rem',
                      fontWeight: 900,
                      color: '#0d47a1',
                      fontFamily: 'monospace',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {earlyBirdCode}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: copied ? '#059669' : '#0168a7',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  boxShadow: copied
                    ? '0 2px 8px rgba(5, 150, 105, 0.3)'
                    : '0 2px 8px rgba(1, 104, 167, 0.25)',
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Perks Grid */}
          <div style={{ padding: '0 32px 24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Users size={16} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.82rem', color: '#091e42' }}>
                    Stackable with Groups
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Save an extra 5% for parties of 4+
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Flame size={16} style={{ color: '#e5531d', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.82rem', color: '#091e42' }}>
                    Limited Allocation
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Only ~{remainingSeats} seats left (of {totalCap})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '20px 32px 28px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <button
              onClick={handleClaim}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '15px 24px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: '#0168a7',
                color: '#ffffff',
                fontSize: '0.98rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(1, 104, 167, 0.35)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0d47a1';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0168a7';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Explore Packages & Claim {discountPct}% Off</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#091e42')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              Continue browsing without discount
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ebFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes ebScaleUp {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
