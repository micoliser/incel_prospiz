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
  const earlyBirdCode = stats?.earlyBird?.code || 'EARLYBIRD5';
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
      className="eb-overlay"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-bird-title"
    >
      {/* Outer Wrapper for 4-Sided Gradient Border */}
      <div
        className="eb-card-outer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inner Content Card */}
        <div className="eb-card-inner">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close promotion modal"
            className="eb-close-btn"
          >
            <X size={17} />
          </button>

          {/* Header Hero Area */}
          <div className="eb-header">
            {/* Micro Pill Badge */}
            <div className="eb-badge">
              <Sparkles size={13} style={{ color: '#0168a7', flexShrink: 0 }} />
              <span>Festive Season Exclusive</span>
            </div>

            <h2 id="early-bird-title" className="eb-title">
              Claim Your <span className="eb-title-highlight">{discountPct}% Early-Bird</span> Discount 🌴
            </h2>

            <p className="eb-desc">
              Plan your December in Lagos early. Lock in premium curated excursions, vetted security, and VIP access before allocations fill up.
            </p>
          </div>

          {/* Voucher Code Box */}
          <div className="eb-voucher-container">
            <div className="eb-voucher-box">
              <div className="eb-voucher-info">
                <div className="eb-voucher-icon">
                  <Tag size={19} />
                </div>
                <div className="eb-voucher-text">
                  <span className="eb-voucher-label">Checkout Promo Voucher</span>
                  <span className="eb-voucher-code">{earlyBirdCode}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className={`eb-copy-btn ${copied ? 'copied' : ''}`}
                aria-label="Copy promotion voucher code to clipboard"
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
          <div className="eb-perks-container">
            <div className="eb-perks-grid">
              <div className="eb-perk-card">
                <Users size={16} className="eb-perk-icon green" />
                <div className="eb-perk-body">
                  <strong className="eb-perk-title">Stackable with Groups</strong>
                  <span className="eb-perk-sub">Save an extra 5% for parties of 4+</span>
                </div>
              </div>

              <div className="eb-perk-card">
                <Flame size={16} className="eb-perk-icon orange" />
                <div className="eb-perk-body">
                  <strong className="eb-perk-title">Limited Allocation</strong>
                  <span className="eb-perk-sub">
                    {remainingSeats > 0
                      ? `Only ~${remainingSeats} seats left (of ${totalCap})`
                      : `Final allocations remaining (of ${totalCap})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="eb-footer">
            <button
              type="button"
              onClick={handleClaim}
              className="eb-claim-btn"
            >
              <span>Explore Packages & Claim {discountPct}% Off</span>
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="eb-dismiss-btn"
            >
              Continue browsing without discount
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .eb-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2.5vh, 20px) 12px;
          background-color: rgba(3, 10, 22, 0.76);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          animation: ebFadeIn 0.3s ease-out;
        }

        .eb-card-outer {
          position: relative;
          width: 100%;
          max-width: 500px;
          margin: auto; /* Centers when fits, allows top-to-bottom scroll without top clipping when overflowed */
          background: linear-gradient(135deg, #0d47a1 0%, #0168a7 35%, #059669 70%, #d97706 100%);
          border-radius: 24px;
          padding: 3px;
          box-shadow: 0 25px 60px -12px rgba(1, 104, 167, 0.4), 0 0 35px rgba(5, 150, 105, 0.2);
          animation: ebScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: calc(100dvh - 24px);
          display: flex;
          flex-direction: column;
        }

        .eb-card-inner {
          position: relative;
          width: 100%;
          background-color: #ffffff;
          border-radius: 21px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          max-height: calc(100dvh - 30px);
          display: flex;
          flex-direction: column;
        }

        .eb-card-inner::-webkit-scrollbar {
          width: 5px;
        }
        .eb-card-inner::-webkit-scrollbar-thumb {
          background-color: rgba(1, 104, 167, 0.2);
          border-radius: 9999px;
        }

        .eb-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 20;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(241, 245, 249, 0.95);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }
        .eb-close-btn:hover {
          background-color: #e2e8f0;
          color: #091e42;
          transform: scale(1.05);
        }

        .eb-header {
          padding: 28px 24px 16px;
          background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);
          text-align: center;
        }

        .eb-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          background-color: #e0f2fe;
          color: #0d47a1;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .eb-title {
          font-size: clamp(1.35rem, 5vw, 1.8rem);
          font-weight: 900;
          color: #091e42;
          line-height: 1.18;
          letter-spacing: -0.025em;
          margin: 0 0 8px;
        }

        .eb-title-highlight {
          color: #0168a7;
        }

        .eb-desc {
          font-size: clamp(0.82rem, 3vw, 0.92rem);
          color: #475569;
          line-height: 1.48;
          margin: 0 auto;
          max-width: 420px;
        }

        .eb-voucher-container {
          padding: 0 24px 16px;
        }

        .eb-voucher-box {
          background-color: #f8fafc;
          border: 2px dashed #93c5fd;
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .eb-voucher-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .eb-voucher-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background-color: #e0f2fe;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d47a1;
          flex-shrink: 0;
        }

        .eb-voucher-text {
          min-width: 0;
        }

        .eb-voucher-label {
          display: block;
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .eb-voucher-code {
          display: block;
          font-size: clamp(1.1rem, 4vw, 1.35rem);
          font-weight: 900;
          color: #0d47a1;
          font-family: monospace;
          letter-spacing: 0.08em;
          line-height: 1.15;
        }

        .eb-copy-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 15px;
          border-radius: 10px;
          border: none;
          background-color: #0168a7;
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(1, 104, 167, 0.25);
          white-space: nowrap;
        }

        .eb-copy-btn.copied {
          background-color: #059669;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
        }

        .eb-copy-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .eb-perks-container {
          padding: 0 24px 18px;
        }

        .eb-perks-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .eb-perk-card {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background-color: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .eb-perk-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .eb-perk-icon.green {
          color: #059669;
        }
        .eb-perk-icon.orange {
          color: #e5531d;
        }

        .eb-perk-body {
          min-width: 0;
        }

        .eb-perk-title {
          display: block;
          font-size: 0.78rem;
          color: #091e42;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 2px;
        }

        .eb-perk-sub {
          display: block;
          font-size: 0.72rem;
          color: #64748b;
          line-height: 1.35;
        }

        .eb-footer {
          padding: 16px 24px 22px;
          background-color: #ffffff;
          border-top: 1px solid #f1f5f9;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .eb-claim-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          border-radius: 14px;
          border: none;
          background-color: #0168a7;
          color: #ffffff;
          font-size: clamp(0.86rem, 3.2vw, 0.96rem);
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(1, 104, 167, 0.35);
          transition: all 0.2s ease;
        }

        .eb-claim-btn:hover {
          background-color: #0d47a1;
          transform: translateY(-1px);
        }

        .eb-dismiss-btn {
          background: none;
          border: none;
          color: #64748b;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          padding: 6px;
          transition: color 0.2s ease;
        }

        .eb-dismiss-btn:hover {
          color: #091e42;
        }

        /* Mobile adaptation for phones (< 460px) */
        @media (max-width: 460px) {
          .eb-header {
            padding: 22px 16px 12px;
          }
          .eb-close-btn {
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
          }
          .eb-voucher-container {
            padding: 0 16px 12px;
          }
          .eb-voucher-box {
            flex-direction: column;
            align-items: stretch;
            padding: 12px 14px;
            gap: 10px;
          }
          .eb-voucher-info {
            justify-content: flex-start;
          }
          .eb-copy-btn {
            width: 100%;
            padding: 10px 14px;
            font-size: 0.84rem;
          }
          .eb-perks-container {
            padding: 0 16px 14px;
          }
          .eb-perks-grid {
            gap: 8px;
          }
          .eb-perk-card {
            padding: 8px 10px;
          }
          .eb-footer {
            padding: 12px 16px 18px;
            gap: 6px;
          }
          .eb-claim-btn {
            padding: 12px 16px;
          }
        }

        /* Extremely narrow devices (< 340px) */
        @media (max-width: 340px) {
          .eb-perks-grid {
            grid-template-columns: 1fr;
          }
        }

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
