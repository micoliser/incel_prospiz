'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyPayment, getBookingByRef, clearPendingCheckout, BookingResponse } from '@/lib/api';
import { CheckCircle2, AlertCircle, ArrowLeft, Phone, Loader2, Calendar, MapPin, Users, Copy, Check, Search, Clock } from 'lucide-react';

function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelledRef, setCancelledRef] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    const tx_ref = searchParams.get('tx_ref');
    const transaction_id = searchParams.get('transaction_id');
    const statusParam = searchParams.get('status');

    const ref = tx_ref || reference || trxref;

    let isMounted = true;

    if (statusParam === 'cancelled' || statusParam === 'failed') {
      setIsCancelled(true);
      setLoading(false);
      clearPendingCheckout();
      if (ref) {
        setCancelledRef(ref);
        getBookingByRef(ref)
          .then((b) => {
            if (isMounted && b) {
              setBooking(b);
              if (b.secondsRemaining !== undefined) {
                setSecondsRemaining(b.secondsRemaining);
              }
            }
          })
          .catch(() => {});
      }
      return;
    }

    if (!ref && !transaction_id) {
      setError('No transaction reference found in callback URL.');
      setLoading(false);
      return;
    }

    async function checkVerification() {
      try {
        const res = await verifyPayment({
          reference: reference || undefined,
          trxref: trxref || undefined,
          tx_ref: tx_ref || undefined,
          transaction_id: transaction_id || undefined,
        });
        if (isMounted) {
          clearPendingCheckout();
          setBooking(res);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to confirm payment verification.');
          setLoading(false);
          if (ref) {
            setCancelledRef(ref);
            getBookingByRef(ref)
              .then((b) => {
                if (isMounted && b) {
                  setBooking(b);
                  if (b.paymentStatus === 'paid') {
                    clearPendingCheckout();
                  }
                  if (b.secondsRemaining !== undefined) {
                    setSecondsRemaining(b.secondsRemaining);
                  }
                }
              })
              .catch(() => {});
          }
        }
      }
    }

    checkVerification();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Live countdown timer for active seat hold on cancellation
  useEffect(() => {
    if (!isCancelled || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isCancelled, secondsRemaining]);

  const handleCopy = (refToCopy?: string) => {
    const text = refToCopy || booking?.bookingRef || cancelledRef;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--blue-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--blue-deep)' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
          Confirming Your Payment...
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.94rem', lineHeight: 1.6 }}>
          We are confirming your payment with the gateway and saving your seats.
        </p>
      </div>
    );
  }

  if (isCancelled) {
    const displayRef = cancelledRef || booking?.bookingRef;
    const isHoldActive = secondsRemaining > 0;

    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#fffbeb',
          border: '2px solid #f59e0b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: '#d97706',
        }}>
          <AlertCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
          Payment Cancelled / Incomplete
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '20px' }}>
          Your payment was not completed and no money was deducted. Your seats are currently held so you don&apos;t lose your spot.
        </p>

        {/* Booking Reference with Copy Action */}
        {displayRef && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#ffffff',
              border: '1.5px solid var(--border-light)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--blue-deep)' }}>
              Booking Reference: <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{displayRef}</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopy(displayRef)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: copied ? '#059669' : 'var(--blue-surface)',
                color: copied ? '#ffffff' : 'var(--blue-deep)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 9px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              aria-label="Copy booking reference"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Seat Hold Countdown Alert */}
        {isHoldActive ? (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 20px',
              maxWidth: '520px',
              width: '100%',
              margin: '0 auto 28px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
            }}
          >
            <Clock size={22} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', marginBottom: '2px' }}>
                Seat Hold Active: {formatTimer(secondsRemaining)} Remaining
              </div>
              <div style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5 }}>
                Your seats are reserved for 30 minutes. You can search your booking reference on our booking lookup page anytime before this timer reaches zero to complete your payment before seats are released back to the public.
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: 'var(--radius-lg)',
              padding: '12px 18px',
              maxWidth: '520px',
              width: '100%',
              margin: '0 auto 28px',
              fontSize: '0.84rem',
              color: '#991b1b',
              lineHeight: 1.5,
            }}
          >
            <strong>Note:</strong> The temporary seat hold window has expired and seats have been returned to inventory. You can select your tour packages again on the website.
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {displayRef && (
            <Link
              href={`/booking/lookup?ref=${encodeURIComponent(displayRef)}`}
              className="btn-primary"
              style={{ padding: '12px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Resume & Complete Payment →</span>
            </Link>
          )}

          <Link
            href="/booking/lookup"
            className="btn-secondary"
            style={{ padding: '12px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff' }}
          >
            <Search size={15} />
            <span>Search Booking</span>
          </Link>

          <Link href="/#packages" className="btn-secondary" style={{ padding: '12px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#ffffff' }}>
            <ArrowLeft size={15} />
            <span>View Packages</span>
          </Link>

          <a
            href={`https://wa.me/2348123456789?text=${encodeURIComponent(
              displayRef
                ? `Hello Team! My payment for booking reference ${displayRef} was cancelled or interrupted. I would like assistance completing my reservation.`
                : `Hello Team! I experienced an issue with my checkout for Lagos Luxe 2026.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            style={{ padding: '12px 22px', textDecoration: 'none' }}
          >
            <Phone size={15} />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#fff7ed',
          border: '2px solid #f97316',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: '#ea580c',
        }}>
          <AlertCircle size={36} />
        </div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
          Checking Your Payment
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', fontSize: '0.94rem', lineHeight: 1.6, marginBottom: '24px' }}>
          {error || 'We could not confirm your payment right away. If your account was debited, your booking will be confirmed automatically shortly.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/" className="btn-secondary" style={{ padding: '12px 24px', textDecoration: 'none' }}>
            <span>Back to Home</span>
          </Link>
          <a
            href="https://wa.me/2348123456789?text=Hello%20Team!%20I%20just%20completed%20payment%20for%20Lagos%20Luxe%202026%20and%20would%20like%20to%20confirm%20my%20status."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            style={{ padding: '12px 24px', textDecoration: 'none' }}
          >
            <Phone size={16} />
            <span>Verify via WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  const isPaid = booking.paymentStatus === 'paid';
  const subtotal = booking.subtotalNGN || booking.finalTotalNGN || 0;
  const groupDiscount = booking.groupDiscountNGN || 0;
  const promoDiscount = booking.promoDiscountNGN || 0;
  const totalDiscount = groupDiscount + promoDiscount;
  const hasDiscount = totalDiscount > 0;

  const isUSD = booking.currency === 'USD';
  const isGBP = booking.currency === 'GBP';
  const isForeign = isUSD || isGBP;
  const sym = isUSD ? '$' : isGBP ? '£' : '₦';

  const rate = booking.exchangeRate || (booking.convertedTotal && booking.finalTotalNGN ? Number(booking.finalTotalNGN) / Number(booking.convertedTotal) : 1);

  const formatCurrencyVal = (ngnVal: number, convertedVal?: number | null) => {
    if (isForeign) {
      const val = convertedVal != null ? convertedVal : (rate > 0 ? ngnVal / rate : 0);
      return `${sym}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${Number(ngnVal).toLocaleString()}`;
  };

  const displaySubtotal = formatCurrencyVal(subtotal, booking.convertedSubtotal);
  const displayGroupDiscount = formatCurrencyVal(groupDiscount, booking.convertedGroupDiscount);
  const displayPromoDiscount = formatCurrencyVal(promoDiscount, booking.convertedPromoDiscount);
  const displayTotalSavings = formatCurrencyVal(totalDiscount, booking.convertedTotalSavings);
  const displayFinalTotal = isForeign && booking.convertedTotal != null
    ? `${sym}${Number(booking.convertedTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `₦${Number(booking.finalTotalNGN || 0).toLocaleString()}`;

  // LOW-02: Clean, reference-only WhatsApp message without cleartext PII, financial totals, or email/phone
  const whatsappMsg = `Hello Incel Holidays & Prospiz Team! I have completed payment for Lagos Luxe 2026.%0A%0A*Booking Reference:* ${booking.bookingRef}%0A*Status:* ${booking.paymentStatus.toUpperCase()}`;

  return (
    <div style={{ minHeight: '85vh', padding: '48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        maxWidth: '680px',
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 20px 48px -12px rgba(9, 30, 66, 0.15)',
        padding: '36px 28px',
        textAlign: 'center',
      }}>
        {/* Success Icon */}
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          backgroundColor: 'var(--green-soft)',
          border: '2px solid #10b981',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#059669',
          marginBottom: '20px',
        }}>
          <CheckCircle2 size={42} />
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--blue-surface)',
                border: '1.5px solid rgba(1, 104, 167, 0.25)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--blue-deep)', letterSpacing: '0.04em' }}>
                Booking Ref: <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{booking.bookingRef}</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy()}
                id="copy-booking-ref-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: copied ? '#059669' : '#ffffff',
                  color: copied ? '#ffffff' : 'var(--blue-deep)',
                  border: copied ? '1px solid #059669' : '1px solid var(--border-light)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                aria-label="Copy booking reference"
                title="Copy booking reference"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.3rem)',
            fontWeight: 900,
            color: 'var(--text-heading)',
            marginTop: '12px',
            marginBottom: '8px',
          }}>
            {isPaid ? 'Payment Confirmed!' : 'Booking Received'}
          </h1>
          <p style={{ color: 'var(--text-body)', fontSize: '0.98rem', lineHeight: 1.6, maxWidth: '540px', margin: '0 auto' }}>
            Congratulations, <strong style={{ color: 'var(--text-heading)' }}>{booking.fullName}</strong>. Your payment via{' '}
            <strong style={{ color: 'var(--text-heading)', textTransform: 'capitalize' }}>{booking.paymentMethod}</strong> has been confirmed.
            A confirmation receipt and trip details have been sent to{' '}
            <strong style={{ color: 'var(--text-heading)' }}>{booking.email}</strong>.
          </p>
        </div>

        {/* Detailed Breakdown Card */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          textAlign: 'left',
          marginBottom: '28px',
        }}>
          <div style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--blue-deep)',
            textTransform: 'uppercase',
            marginBottom: '14px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '8px',
          }}>
            Booking Summary
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Guest Contact</div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.92rem' }}>{booking.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{booking.phone}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Party Size</div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.92rem' }}>
                {booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {booking.isForeigner ? 'International Visitor' : 'Nigerian Resident'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Final Paid Price</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                {hasDiscount && (
                  <span style={{ fontSize: '0.88rem', color: '#94a3b8', textDecoration: 'line-through', textDecorationColor: '#ef4444', fontWeight: 700 }}>
                    {displaySubtotal}
                  </span>
                )}
                <span style={{ fontWeight: 900, color: hasDiscount ? '#059669' : 'var(--blue-deep)', fontSize: '1.15rem' }}>
                  {displayFinalTotal}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
                Status: {booking.paymentStatus.toUpperCase()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Payment Method</div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.92rem', textTransform: 'capitalize' }}>
                {booking.paymentMethod}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Confirmed Transaction</div>
            </div>
          </div>

          {/* Full Itemized Price Description */}
          <div style={{
            backgroundColor: hasDiscount ? '#f0fdf4' : '#ffffff',
            border: hasDiscount ? '1px solid #86efac' : '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: hasDiscount ? '#065f46' : 'var(--blue-deep)', textTransform: 'uppercase' }}>
                Price Description
              </span>
              {hasDiscount && (
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#065f46', backgroundColor: '#d1fae5', padding: '1px 6px', borderRadius: '4px' }}>
                  Total Savings: {displayTotalSavings}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Normal Initial Price:</span>
              <span style={{
                fontWeight: 700,
                color: hasDiscount ? '#94a3b8' : 'var(--text-heading)',
                textDecoration: hasDiscount ? 'line-through' : 'none',
                textDecorationColor: hasDiscount ? '#ef4444' : undefined,
              }}>
                {displaySubtotal}
              </span>
            </div>

            {groupDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px', color: '#059669' }}>
                <span>Group Discount ({booking.groupDiscountPct || 5}% for 4+ Guests):</span>
                <span style={{ fontWeight: 700 }}>-{displayGroupDiscount}</span>
              </div>
            )}

            {promoDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px', color: '#059669' }}>
                <span>Promo Discount ({booking.promoCode}{booking.promoDiscountPct ? ` · ${booking.promoDiscountPct}% off` : ''}):</span>
                <span style={{ fontWeight: 700 }}>-{displayPromoDiscount}</span>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTop: '1px dashed ' + (hasDiscount ? '#86efac' : 'var(--border-light)'),
              paddingTop: '6px',
              marginTop: '4px',
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                Final Paid Price:
              </span>
              <div style={{ textAlign: 'right' }}>
                {hasDiscount && (
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', textDecoration: 'line-through', textDecorationColor: '#ef4444', marginRight: '6px' }}>
                    {displaySubtotal}
                  </span>
                )}
                <span style={{ fontWeight: 900, color: hasDiscount ? '#059669' : 'var(--blue-deep)', fontSize: '1.05rem' }}>
                  {displayFinalTotal}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Booked Tours:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {booking.selectedPackages.map((pkgId, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border-light)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-heading)',
                  }}
                >
                  {pkgId}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href={`https://wa.me/2348123456789?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            style={{ padding: '14px 24px', fontSize: '0.94rem', textDecoration: 'none' }}
          >
            <Phone size={18} />
            <span>Chat on WhatsApp</span>
          </a>

          <Link
            href={`/booking/lookup?ref=${booking.bookingRef}`}
            className="btn-secondary"
            style={{ padding: '14px 20px', fontSize: '0.94rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={16} />
            <span>View Booking Details</span>
          </Link>

          <Link
            href="/"
            className="btn-secondary"
            style={{ padding: '14px 22px', fontSize: '0.94rem', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Site</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--blue-deep)' }} />
        </div>
      }
    >
      <VerifyPaymentContent />
    </Suspense>
  );
}
