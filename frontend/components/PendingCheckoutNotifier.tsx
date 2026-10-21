'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getBookingByRef, clearPendingCheckout, BookingResponse } from '@/lib/api';
import { Clock, AlertCircle, ArrowRight, X, CreditCard } from 'lucide-react';

function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const PendingCheckoutNotifier: React.FC = () => {
  const pathname = usePathname();
  const [pendingBooking, setPendingBooking] = useState<BookingResponse | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const checkPendingSession = async () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = sessionStorage.getItem('pending_checkout');
      if (!raw) {
        setPendingBooking(null);
        return;
      }

      const data = JSON.parse(raw);
      if (!data?.bookingRef || !data?.timestamp) {
        clearPendingCheckout();
        setPendingBooking(null);
        return;
      }

      // Check if older than 30 minutes
      const elapsed = Date.now() - Number(data.timestamp);
      if (elapsed > 30 * 60 * 1000) {
        clearPendingCheckout();
        setPendingBooking(null);
        return;
      }

      // Query server for live status
      const booking = await getBookingByRef(data.bookingRef);
      if (!booking || booking.paymentStatus === 'paid' || booking.paymentStatus === 'cancelled') {
        clearPendingCheckout();
        setPendingBooking(null);
        return;
      }

      if (booking.paymentStatus === 'pending') {
        setPendingBooking(booking);
        setSecondsRemaining(booking.secondsRemaining ?? Math.max(0, Math.floor((30 * 60 * 1000 - elapsed) / 1000)));
      } else {
        clearPendingCheckout();
        setPendingBooking(null);
      }
    } catch {
      // Ignore parse/fetch errors
    }
  };

  useEffect(() => {
    // Check on route change and initial mount
    checkPendingSession();

    // Check on pageshow event (triggered when user clicks Browser Back/Forward buttons from payment gateway)
    const handlePageShow = (e: PageTransitionEvent) => {
      checkPendingSession();
    };

    // Check on visibility change (triggered when switching back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPendingSession();
      }
    };

    // Listen to custom notification when payment is cleared anywhere in the app
    const handleCustomUpdate = () => {
      checkPendingSession();
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('pending_checkout_updated', handleCustomUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('pending_checkout_updated', handleCustomUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);

  // Live countdown ticker
  useEffect(() => {
    if (!pendingBooking || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearPendingCheckout();
          setPendingBooking(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingBooking, secondsRemaining]);

  const handleDismiss = () => {
    setDismissed(true);
    setPendingBooking(null);
    clearPendingCheckout();
  };

  // Do not show on verify or lookup pages since those pages already provide dedicated in-page booking feedback
  if (pathname?.startsWith('/booking/verify') || pathname?.startsWith('/booking/lookup')) {
    return null;
  }

  if (!pendingBooking || secondsRemaining <= 0 || dismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9998,
        maxWidth: '460px',
        width: 'calc(100% - 48px)',
        backgroundColor: '#ffffff',
        border: '1.5px solid #fde68a',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 16px 40px -8px rgba(9, 30, 66, 0.22), 0 0 0 1px rgba(245, 158, 11, 0.1)',
        padding: '16px 18px',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1.2 }}>
              Incomplete Checkout Detected
            </div>
            <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>
              Hold Active: {formatTimer(secondsRemaining)} Remaining
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Dismiss notice"
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 12px' }}>
        You navigated back from checkout. Your seats for reservation{' '}
        <strong style={{ color: 'var(--blue-deep)', fontFamily: 'monospace' }}>
          {pendingBooking.bookingRef}
        </strong>{' '}
        are temporarily reserved.
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Link
          href={`/booking/lookup?ref=${encodeURIComponent(pendingBooking.bookingRef)}`}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '0.82rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
          onClick={handleDismiss}
        >
          <span>Resume & Complete Payment</span>
          <ArrowRight size={14} />
        </Link>

        {pendingBooking.checkoutUrl && (
          <a
            href={pendingBooking.checkoutUrl}
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              color: 'var(--blue-deep)',
              backgroundColor: 'var(--blue-surface)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CreditCard size={14} />
            <span>Pay Directly</span>
          </a>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '6px 8px',
            textDecoration: 'underline',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
