'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Clock } from 'lucide-react';
import { CampaignStats, DEFAULT_CAMPAIGN_STATS } from '@/lib/api';

interface UrgencyTickerProps {
  stats?: CampaignStats | null;
}

export const UrgencyTicker: React.FC<UrgencyTickerProps> = ({ stats }) => {
  const currentStats = stats || DEFAULT_CAMPAIGN_STATS;
  const targetDateStr = currentStats.eventDates?.start || '2026-12-13T09:00:00+01:00';

  const [timeLeft, setTimeLeft] = useState({
    days: 54,
    hours: 12,
    minutes: 45,
    seconds: 30,
  });

  const deadlineStr = useMemo(() => {
    try {
      const dt = new Date(currentStats.earlyBird.deadline);
      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return '15 Nov';
    }
  }, [currentStats.earlyBird.deadline]);

  useEffect(() => {
    const targetDate = new Date(targetDateStr).getTime();

    const updateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  return (
    <div style={{
      background: 'linear-gradient(90deg, #f0f7ff 0%, #e0f2fe 50%, #f0f7ff 100%)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '8px 14px',
      fontSize: '0.82rem',
      color: 'var(--text-heading)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Urgent offer text in Dominant Blue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--blue-deep)',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            fontWeight: 800,
            fontSize: '0.7rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 6px rgba(13, 71, 161, 0.25)',
          }}>
            <Flame size={11} style={{ color: '#38bdf8' }} /> Early-Bird Offer
          </span>
          <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: '0.8rem' }}>
            {currentStats.earlyBird.isActive ? (
              <>
                <strong style={{ color: 'var(--blue-deep)' }}>{currentStats.earlyBird.discountPct}% Off</strong> First {currentStats.earlyBird.totalCap} Seats until {deadlineStr} · Strictly {currentStats.globalCap.perPackageCap} Seats Per Package Cap
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--blue-deep)' }}>Official Allocation Active</strong> · Strictly {currentStats.globalCap.perPackageCap} Seats Per Package Cap
              </>
            )}
          </span>
        </div>

        {/* Live seat status & Countdown */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '0.8rem',
        }}>
          {/* Seat counter indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="beacon-dot" />
            <span style={{ color: 'var(--text-body)', fontWeight: 600, fontSize: '0.78rem' }}>
              {currentStats.earlyBird.isActive ? (
                <>
                  Seats Left: <strong style={{ color: currentStats.earlyBird.remaining <= 3 ? '#dc2626' : 'var(--blue-deep)' }}>
                    {currentStats.earlyBird.remaining} of {currentStats.earlyBird.totalCap}
                  </strong>
                </>
              ) : (
                <>
                  General Seats Left: <strong style={{ color: 'var(--blue-deep)' }}>
                    {currentStats.globalCap.totalRemaining} of {currentStats.globalCap.totalCapacity}
                  </strong>
                </>
              )}
            </span>
          </div>

          {/* Countdown timer */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '5px',
            background: '#ffffff',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(1, 104, 167, 0.2)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }} className="countdown-container">
            <Clock size={12} style={{ color: 'var(--blue-primary)' }} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue-deep)', fontSize: '0.78rem' }}>
              {timeLeft.days}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .countdown-container {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
