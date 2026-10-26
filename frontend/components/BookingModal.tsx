'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { PACKAGES_DATA, Currency, formatPrice, calculateGroupDiscount, ExcursionPackage, ExchangeRates } from '@/data/packages';
import { validatePromo, submitBooking } from '@/lib/api';
import {
  X,
  CheckCircle2,
  CreditCard,
  Building,
  Phone,
  Ticket,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
  Info,
  Tag,
  ExternalLink,
} from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (err?: any) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackageId?: string;
  currentCurrency: Currency;
  packages?: ExcursionPackage[];
  exchangeRates?: ExchangeRates;
  onBookingSuccess?: () => void;
  earlyBirdCode?: string;
  initialPromoCode?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedPackageId,
  currentCurrency,
  packages = PACKAGES_DATA,
  exchangeRates,
  onBookingSuccess,
  earlyBirdCode,
  initialPromoCode,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [isForeigner, setIsForeigner] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPct: number } | null>(null);
  const [promoError, setPromoError] = useState<string>('');

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [country, setCountry] = useState<string>('UK');
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave' | 'whatsapp'>(
    currentCurrency === 'NGN' ? 'paystack' : 'flutterwave'
  );

  // Legal Agreement & Data Processing Consents
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [agreeDataProcessing, setAgreeDataProcessing] = useState<boolean>(false);
  const [termsError, setTermsError] = useState<string>('');

  // Security & Bot Defense (HIGH-02 & HIGH-03)
  const [honeypot, setHoneypot] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [existingRef, setExistingRef] = useState<string>('');
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  // Custom Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Step state
  const [step, setStep] = useState<'details' | 'success'>('details');
  const [copiedRef, setCopiedRef] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [isCheckingPromo, setIsCheckingPromo] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const vipBundle = packages.find((p) => p.category === 'bundle' || p.slug === 'all-inclusive-vip' || p.id === 'all-inclusive-vip');
  const vipId = vipBundle ? vipBundle.id : 'all-inclusive-vip';

  // Validation rules
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'fullName': {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) {
          return 'Full name is required to hold your reservation';
        }
        if (trimmed.length < 2) {
          return 'Full name must be at least 2 characters';
        }
        if (!/^[a-zA-Z\s'\-.]+$/.test(trimmed)) {
          return 'Please enter a valid personal name (letters and hyphens only)';
        }
        return '';
      }
      case 'email': {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) {
          return 'Email is required for your booking confirmation & itinerary';
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid email address (e.g. name@example.com)';
        }
        return '';
      }
      case 'phone': {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) {
          return 'WhatsApp or mobile number is required for booking confirmation & tour coordination';
        }
        const digits = trimmed.replace(/\D/g, '');
        const validPhoneFormat = /^\+?[0-9\s\-().]{7,20}$/.test(trimmed);
        if (!validPhoneFormat || digits.length < 7 || digits.length > 15) {
          return 'Please enter a valid phone number (e.g. +234 801 234 5678 or +44 7123 456789)';
        }
        return '';
      }
      case 'country': {
        const trimmed = typeof value === 'string' ? value.trim() : '';
        if (!trimmed) {
          return 'Please select your country of residence';
        }
        return '';
      }
      case 'selectedIds': {
        if (!Array.isArray(value) || value.length === 0) {
          return 'Please select at least one package or excursion to continue';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const validateAll = (data: {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    selectedIds: string[];
  }) => {
    const newErrors: Record<string, string> = {};

    const nameErr = validateField('fullName', data.fullName);
    if (nameErr) newErrors.fullName = nameErr;

    const emailErr = validateField('email', data.email);
    if (emailErr) newErrors.email = emailErr;

    const phoneErr = validateField('phone', data.phone);
    if (phoneErr) newErrors.phone = phoneErr;

    const countryErr = validateField('country', data.country);
    if (countryErr) newErrors.country = countryErr;

    const pkgErr = validateField('selectedIds', data.selectedIds);
    if (pkgErr) newErrors.selectedIds = pkgErr;

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  // Change handlers with real-time feedback
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    if (submitError) setSubmitError('');
    if (touched.fullName || submitAttempted) {
      const err = validateField('fullName', val);
      setErrors((prev) => ({ ...prev, fullName: err }));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (submitError) setSubmitError('');
    if (touched.email || submitAttempted) {
      const err = validateField('email', val);
      setErrors((prev) => ({ ...prev, email: err }));
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (submitError) setSubmitError('');
    if (touched.phone || submitAttempted) {
      const err = validateField('phone', val);
      setErrors((prev) => ({ ...prev, phone: err }));
    }
  };

  const handleCountryChange = (val: string) => {
    setCountry(val);
    if (submitError) setSubmitError('');
    if (touched.country || submitAttempted) {
      const err = validateField('country', val);
      setErrors((prev) => ({ ...prev, country: err }));
    }
  };

  const handleFieldBlur = (field: 'fullName' | 'email' | 'phone' | 'country') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val: any = '';
    if (field === 'fullName') val = fullName;
    else if (field === 'email') val = email;
    else if (field === 'phone') val = phone;
    else if (field === 'country') val = country;

    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  // Track if modal selection has been initialized on open to prevent periodic background polling from reverting user choices
  const isInitializedRef = React.useRef(false);

  // Ensure that if currency is USD or GBP, payment method automatically switches from paystack to flutterwave
  useEffect(() => {
    if (currentCurrency !== 'NGN' && paymentMethod === 'paystack') {
      setPaymentMethod('flutterwave');
    }
  }, [currentCurrency, paymentMethod]);

  // Clear all form state whenever modal closes, or initialize selection when opened
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      setSelectedIds([]);
      setFullName('');
      setEmail('');
      setPhone('');
      setCountry('UK');
      setSpecialRequests('');
      setPaymentMethod(currentCurrency === 'NGN' ? 'paystack' : 'flutterwave');
      setPromoCode('');
      setAppliedPromo(null);
      setPromoError('');
      setGuestCount(1);
      setIsForeigner(false);
      setStep('details');
      setBookingId('');
      setErrors({});
      setTouched({});
      setSubmitAttempted(false);
      setSubmitError('');
      setHoneypot('');
      setTurnstileToken('');
      setExistingRef('');
    } else if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      if (selectedPackageId) {
        const found = packages.find((p) => p.id === selectedPackageId || p.slug === selectedPackageId);
        setSelectedIds([found ? found.id : selectedPackageId]);
      } else {
        setSelectedIds([vipId]);
      }
      if (initialPromoCode) {
        const cleanCode = initialPromoCode.trim().toUpperCase();
        setPromoCode(cleanCode);
        validatePromo(cleanCode).then((res) => {
          if (res.valid && res.discountPct) {
            setAppliedPromo({ code: res.code || cleanCode, discountPct: res.discountPct });
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, selectedPackageId, packages, vipId, currentCurrency, initialPromoCode]);

  const handleClose = () => {
    isInitializedRef.current = false;
    setSelectedIds([]);
    setFullName('');
    setEmail('');
    setPhone('');
    setCountry('UK');
    setSpecialRequests('');
    setPaymentMethod(currentCurrency === 'NGN' ? 'paystack' : 'flutterwave');
    setPromoCode('');
    setAppliedPromo(null);
    setPromoError('');
    setGuestCount(1);
    setIsForeigner(false);
    setStep('details');
    setBookingId('');
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
    setSubmitError('');
    setHoneypot('');
    setTurnstileToken('');
    setExistingRef('');
    setAgreeTerms(false);
    setAgreeDataProcessing(false);
    setTermsError('');
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Turnstile CAPTCHA Mount & Lifecycle
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';
  useEffect(() => {
    if (!isOpen || step !== 'details') {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;

    const renderTurnstile = () => {
      if (typeof window === 'undefined' || !window.turnstile || !turnstileContainerRef.current) {
        return false;
      }
      if (turnstileWidgetIdRef.current) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
          return true;
        } catch {
          turnstileWidgetIdRef.current = null;
        }
      }
      try {
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'normal',
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'expired-callback': () => {
            setTurnstileToken('');
          },
          'error-callback': () => {
            console.warn('Turnstile challenge encountered an issue');
          },
        });
        return true;
      } catch (e) {
        console.warn('Failed to render Turnstile widget:', e);
        return false;
      }
    };

    if (!renderTurnstile()) {
      intervalId = setInterval(() => {
        if (renderTurnstile()) {
          if (intervalId) clearInterval(intervalId);
        }
      }, 250);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (turnstileWidgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {}
        turnstileWidgetIdRef.current = null;
      }
    };
  }, [isOpen, step, siteKey]);

  if (!isOpen) return null;

  // Toggle package selection
  const handleTogglePackage = (id: string) => {
    const targetPkg = packages.find((p) => p.id === id || p.slug === id);
    const isSoldOut = targetPkg && (
      targetPkg.seatsRemaining !== undefined
        ? targetPkg.seatsRemaining <= 0
        : (targetPkg.maxSeats - targetPkg.seatsBooked) <= 0
    );
    if (isSoldOut) return;

    let updated: string[];
    if (id === vipId || id === 'all-inclusive-vip') {
      updated = [vipId];
    } else {
      let filtered = selectedIds.filter((item) => item !== vipId && item !== 'all-inclusive-vip');
      if (filtered.includes(id)) {
        filtered = filtered.filter((item) => item !== id);
      } else {
        filtered.push(id);
      }
      updated = filtered;
    }

    setSelectedIds(updated);
    if (touched.selectedIds || submitAttempted) {
      const err = validateField('selectedIds', updated);
      setErrors((prev) => ({ ...prev, selectedIds: err }));
    }
  };

  // Calculate pricing
  const subtotalNGN = selectedIds.reduce((sum, id) => {
    const pkg = packages.find((p) => p.id === id || p.slug === id);
    if (!pkg) return sum;
    let price = pkg.priceNGN;
    if ((pkg.slug === 'badagry-heritage' || pkg.id === 'badagry-heritage') && isForeigner && pkg.priceForeignerNGN) {
      price = pkg.priceForeignerNGN;
    }
    return sum + price * guestCount;
  }, 0);

  // Group discount (2% for 4+ guests)
  const groupDiscountNGN = calculateGroupDiscount(subtotalNGN, guestCount);

  // Promo code discount
  let promoDiscountNGN = 0;
  if (appliedPromo) {
    promoDiscountNGN = Math.round((subtotalNGN - groupDiscountNGN) * (appliedPromo.discountPct / 100));
  }

  const finalTotalNGN = Math.max(0, subtotalNGN - groupDiscountNGN - promoDiscountNGN);
  const totalDiscountNGN = groupDiscountNGN + promoDiscountNGN;
  const hasDiscount = totalDiscountNGN > 0;

  const handleApplyPromo = async () => {
    setPromoError('');
    if (!promoCode.trim()) return;
    setIsCheckingPromo(true);
    try {
      const res = await validatePromo(promoCode.trim());
      if (res.valid && res.discountPct) {
        setAppliedPromo({ code: res.code || promoCode.trim().toUpperCase(), discountPct: res.discountPct });
      } else {
        setPromoError(res.error || `Invalid promo code. Try "${earlyBirdCode || 'EARLYBIRD17'}" for 2% off!`);
      }
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleClearPromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitAttempted(true);

    const validation = validateAll({
      fullName,
      email,
      phone,
      country,
      selectedIds,
    });

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      country: true,
      selectedIds: true,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstKey = Object.keys(validation.errors)[0];
      if (firstKey) {
        const el = document.getElementById(`field-${firstKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if ('focus' in el) {
            (el as HTMLElement).focus();
          }
        }
      }
      return;
    }

    // Enforce mandatory Terms & Conditions and Data Processing consent
    if (!agreeTerms || !agreeDataProcessing) {
      setTermsError('You must agree to both the Terms & Conditions and the Data Processing Agreement to proceed with your booking.');
      const el = document.getElementById('field-terms-agreement');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const callbackUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/booking/verify`
        : undefined;

      const res = await submitBooking({
        fullName,
        email,
        phone,
        country,
        guestCount,
        isForeigner,
        selectedPackages: selectedIds,
        currency: currentCurrency,
        promoCode: appliedPromo?.code,
        paymentMethod,
        specialRequests,
        callbackUrl,
        captchaToken: turnstileToken,
        honeypot,
      });

      const ref = res.bookingRef;
      setBookingId(ref);

      if (onBookingSuccess) {
        onBookingSuccess();
      }

      // If gateway returned a hosted checkout redirect URL (Paystack or Flutterwave), redirect immediately!
      if (paymentMethod === 'paystack' || paymentMethod === 'flutterwave') {
        if (res.checkoutUrl) {
          if (typeof window !== 'undefined') {
            try {
              // LOW-05: Store only reference and timestamp in sessionStorage, omitting sensitive PII
              sessionStorage.setItem('pending_checkout', JSON.stringify({
                bookingRef: res.bookingRef,
                timestamp: Date.now(),
              }));
            } catch {}
          }
          window.location.href = res.checkoutUrl;
          return;
        } else {
          // If checkoutUrl was not immediately available, direct guest to the booking lookup page
          // where the reservation is displayed with the live seat hold timer and fresh checkout link
          window.location.href = `/booking/lookup?ref=${encodeURIComponent(ref)}`;
          return;
        }
      }

      if (paymentMethod === 'whatsapp') {
        // LOW-02: Minimal PII in WhatsApp deep link query parameter
        const message = `Hello Incel Holidays & Prospiz Team! I have reserved seats via WhatsApp for Lagos Luxe 2026.%0A%0A*Booking Reference:* ${ref}%0A%0APlease provide bank transfer details so I can complete my payment.`;
        window.open(`https://wa.me/2348123456789?text=${message}`, '_blank');
      }

      setStep('success');
    } catch (err: any) {
      setSubmitError(err.message || 'Error completing booking. Please try again.');
      if (err.existingBookingRef) {
        setExistingRef(err.existingBookingRef);
      }
      if (turnstileWidgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
          setTurnstileToken('');
        } catch {}
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="booking-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        backgroundColor: 'rgba(9, 30, 66, 0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="booking-modal-container mobile-sheet-content"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-hover)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="mobile-drag-handle" style={{ display: 'none', width: '42px', height: '4px', borderRadius: '2px', backgroundColor: '#cbd5e1', margin: '10px auto 0' }} />

        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--blue-deep)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Incel Holidays × Prospiz Experience
            </div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--text-heading)', marginTop: '2px' }}>
              {step === 'details' ? 'Reserve Your Lagos Luxe 2026 Seats' : 'Booking Confirmation'}
            </h3>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close booking modal"
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-heading)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        {step === 'details' ? (
          <form noValidate onSubmit={handleCompleteBooking} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Security Honeypot: catches automated spam bots (hidden from human visitors) */}
            <div
              style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                opacity: 0,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
              tabIndex={-1}
            >
              <label htmlFor="booking_website_url">Website URL</label>
              <input
                id="booking_website_url"
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Step 1: Select Excursion / Package */}
              <div id="field-selectedIds">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--blue-deep)', textTransform: 'uppercase', display: 'block' }}>
                    1. Select Package or Excursions <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {selectedIds.length} selected
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {packages.map((pkg) => {
                    const isChecked = selectedIds.includes(pkg.id);
                    const remaining = pkg.seatsRemaining !== undefined ? pkg.seatsRemaining : (pkg.maxSeats - pkg.seatsBooked);
                    const isSoldOut = remaining <= 0;
                    let price = pkg.priceNGN;
                    if ((pkg.slug === 'badagry-heritage' || pkg.id === 'badagry-heritage') && isForeigner && pkg.priceForeignerNGN) {
                      price = pkg.priceForeignerNGN;
                    }

                    return (
                      <div
                        key={pkg.id}
                        onClick={() => !isSoldOut && handleTogglePackage(pkg.id)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: isSoldOut
                            ? '1px solid #e2e8f0'
                            : isChecked
                            ? '2px solid var(--blue-primary)'
                            : '1px solid var(--border-light)',
                          backgroundColor: isSoldOut ? '#f8fafc' : isChecked ? 'var(--blue-surface)' : '#ffffff',
                          cursor: isSoldOut ? 'not-allowed' : 'pointer',
                          opacity: isSoldOut ? 0.65 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked && !isSoldOut}
                            disabled={isSoldOut}
                            onChange={() => {}}
                            style={{ accentColor: 'var(--blue-deep)', width: '19px', height: '19px', cursor: isSoldOut ? 'not-allowed' : 'pointer' }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.94rem', color: isSoldOut ? 'var(--text-muted)' : 'var(--text-heading)' }}>
                                {pkg.name}
                              </span>
                              {isSoldOut && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: '#fee2e2',
                                  color: '#b91c1c',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                }}>
                                  Sold Out
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {pkg.duration} · {pkg.location}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: isSoldOut ? 'var(--text-muted)' : 'var(--blue-deep)' }}>
                            {formatPrice(price, currentCurrency, false, pkg, exchangeRates)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {isSoldOut ? 'Capacity reached' : 'per guest'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {touched.selectedIds && errors.selectedIds && (
                  <div
                    id="error-selectedIds"
                    className="field-error-msg"
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius-md)',
                    }}
                    role="alert"
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
                    <span>{errors.selectedIds}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Guest Count & Resident/Diaspora Switch */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '16px',
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
              }}>
                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: '8px' }}>
                    Number of Guests
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-heading)',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, minWidth: '32px', textAlign: 'center', color: 'var(--text-heading)' }}>
                      {guestCount}
                    </span>
                    <button
                      type="button"
                      disabled={guestCount >= 10}
                      onClick={() => setGuestCount(Math.min(10, guestCount + 1))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        color: guestCount >= 10 ? 'var(--text-muted)' : 'var(--text-heading)',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        cursor: guestCount >= 10 ? 'not-allowed' : 'pointer',
                        opacity: guestCount >= 10 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={guestCount >= 10 ? 'Maximum 10 guests per reservation' : 'Add guest'}
                    >
                      +
                    </button>
                    {guestCount >= 4 && (
                      <span className="badge-green" style={{ fontSize: '0.74rem' }}>
                        2% Group Discount
                      </span>
                    )}
                  </div>
                  {guestCount >= 10 && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
                      Maximum 10 guests per online reservation. For larger groups or corporate bookings, please contact our VIP concierge.
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-heading)', display: 'block', marginBottom: '8px' }}>
                    Guest Type
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsForeigner(false)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid var(--border-light)',
                        backgroundColor: !isForeigner ? 'var(--blue-deep)' : '#ffffff',
                        color: !isForeigner ? '#ffffff' : 'var(--text-secondary)',
                        flex: 1,
                      }}
                    >
                      Nigerian Resident
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsForeigner(true)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: '1px solid var(--border-light)',
                        backgroundColor: isForeigner ? 'var(--blue-deep)' : '#ffffff',
                        color: isForeigner ? '#ffffff' : 'var(--text-secondary)',
                        flex: 1,
                      }}
                    >
                      International Visitor
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: Guest Contact Information */}
              <div>
                <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--blue-deep)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  2. Primary Guest Information
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
                  <div>
                    <label htmlFor="field-fullName" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="field-fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      onBlur={() => handleFieldBlur('fullName')}
                      placeholder="e.g. Tunde Adeyemi"
                      className={`input-custom ${touched.fullName && errors.fullName ? 'has-error' : ''}`}
                      aria-invalid={Boolean(touched.fullName && errors.fullName)}
                      aria-describedby={touched.fullName && errors.fullName ? 'error-fullName' : undefined}
                    />
                    {touched.fullName && errors.fullName && (
                      <div id="error-fullName" className="field-error-msg" role="alert">
                        <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                        <span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="field-email" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="field-email"
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => handleFieldBlur('email')}
                      placeholder="tunde@example.com"
                      className={`input-custom ${touched.email && errors.email ? 'has-error' : ''}`}
                      aria-invalid={Boolean(touched.email && errors.email)}
                      aria-describedby={touched.email && errors.email ? 'error-email' : undefined}
                    />
                    {touched.email && errors.email && (
                      <div id="error-email" className="field-error-msg" role="alert">
                        <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="field-phone" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>
                      WhatsApp Phone Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      id="field-phone"
                      type="text"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={() => handleFieldBlur('phone')}
                      placeholder="+44 7123 456789 or +234 80..."
                      className={`input-custom ${touched.phone && errors.phone ? 'has-error' : ''}`}
                      aria-invalid={Boolean(touched.phone && errors.phone)}
                      aria-describedby={touched.phone && errors.phone ? 'error-phone' : undefined}
                    />
                    {touched.phone && errors.phone && (
                      <div id="error-phone" className="field-error-msg" role="alert">
                        <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                        <span>{errors.phone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="field-country" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)', display: 'block', marginBottom: '6px' }}>
                      Country of Residence <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      id="field-country"
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      onBlur={() => handleFieldBlur('country')}
                      className={`input-custom ${touched.country && errors.country ? 'has-error' : ''}`}
                      aria-invalid={Boolean(touched.country && errors.country)}
                      aria-describedby={touched.country && errors.country ? 'error-country' : undefined}
                    >
                      <option value="UK">United Kingdom</option>
                      <option value="US">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="Nigeria">Nigeria (Lagos / Abuja / etc)</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Other">Other International</option>
                    </select>
                    {touched.country && errors.country && (
                      <div id="error-country" className="field-error-msg" role="alert">
                        <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                        <span>{errors.country}</span>
                      </div>
                    )}
                  </div>

                  {/* LOW-06: Special Requests / Dietary Requirements with 1,000 max length */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label htmlFor="field-special-requests" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-body)' }}>
                        Special Requests / Dietary Requirements <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional)</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: specialRequests.length > 900 ? '#ea580c' : 'var(--text-muted)' }}>
                        {specialRequests.length}/1000
                      </span>
                    </div>
                    <textarea
                      id="field-special-requests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value.slice(0, 1000))}
                      maxLength={1000}
                      rows={2}
                      placeholder="e.g. Vegetarian meals, VIP airport transfer pickup timing, accessibility needs..."
                      className="input-custom"
                      style={{ resize: 'vertical', minHeight: '60px', fontFamily: 'inherit', fontSize: '0.86rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Promo Code Input */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: appliedPromo ? 'rgba(13, 71, 161, 0.04)' : 'var(--bg-subtle)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: promoError ? '1.5px solid #ef4444' : appliedPromo ? '1.5px solid var(--blue-primary)' : '1px solid var(--border-light)',
                  transition: 'all 0.25s ease',
                }}>
                  <Ticket size={18} style={{ color: promoError ? '#ef4444' : appliedPromo ? 'var(--blue-deep)' : 'var(--blue-primary)', flexShrink: 0 }} />
                  <input
                    type="text"
                    disabled={Boolean(appliedPromo)}
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      if (promoError) setPromoError('');
                    }}
                    placeholder={`Promo Code (e.g. ${earlyBirdCode || 'EARLYBIRD17'})`}
                    style={{
                      flexGrow: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-heading)',
                      fontSize: '16px',
                      outline: 'none',
                      filter: appliedPromo ? 'blur(1.5px)' : 'none',
                      opacity: appliedPromo ? 0.6 : 1,
                      cursor: appliedPromo ? 'not-allowed' : 'text',
                      userSelect: appliedPromo ? 'none' : 'auto',
                      transition: 'filter 0.25s ease, opacity 0.25s ease',
                      fontWeight: appliedPromo ? 700 : 400,
                      letterSpacing: appliedPromo ? '0.04em' : 'normal',
                    }}
                  />
                  {appliedPromo ? (
                    <button
                      type="button"
                      onClick={handleClearPromo}
                      title="Cancel and remove promo code"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fca5a5',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <X size={14} />
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isCheckingPromo || !promoCode.trim()}
                      onClick={handleApplyPromo}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        backgroundColor: promoCode.trim() ? 'var(--blue-deep)' : '#cbd5e1',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: promoCode.trim() ? 'pointer' : 'not-allowed',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isCheckingPromo ? 'Applying...' : 'Apply'}
                    </button>
                  )}
                </div>

                {promoError && (
                  <div className="field-error-msg" style={{ marginTop: '6px' }}>
                    <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                    <span>{promoError}</span>
                  </div>
                )}
                {appliedPromo && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.84rem',
                    color: '#059669',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <CheckCircle2 size={16} />
                    <span>Promo code &ldquo;{appliedPromo.code}&rdquo; applied: {appliedPromo.discountPct}% discount (-{formatPrice(promoDiscountNGN, currentCurrency, false, undefined, exchangeRates)})!</span>
                  </div>
                )}
              </div>

              {/* Price Breakdown with Original Price & Applied Discounts */}
              {selectedIds.length > 0 && (
                <div style={{
                  backgroundColor: hasDiscount ? '#f0fdf4' : 'var(--bg-subtle)',
                  border: hasDiscount ? '1.5px solid #86efac' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid ' + (hasDiscount ? '#bbf7d0' : 'var(--border-light)'),
                    paddingBottom: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={15} style={{ color: hasDiscount ? '#059669' : 'var(--blue-deep)' }} />
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: hasDiscount ? '#065f46' : 'var(--blue-deep)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        Price Summary
                      </span>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'} · {selectedIds.length} {selectedIds.length === 1 ? 'Tour' : 'Tours'}
                    </span>
                  </div>

                  {/* Normal Initial Price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Normal Initial Price:</span>
                    <span style={{
                      fontWeight: 700,
                      color: hasDiscount ? '#94a3b8' : 'var(--text-heading)',
                      textDecoration: hasDiscount ? 'line-through' : 'none',
                      textDecorationColor: hasDiscount ? '#ef4444' : undefined,
                      textDecorationThickness: hasDiscount ? '1.5px' : undefined,
                    }}>
                      {formatPrice(subtotalNGN, currentCurrency, false, undefined, exchangeRates)}
                    </span>
                  </div>

                  {/* Point out applied discounts */}
                  {groupDiscountNGN > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', color: '#059669' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          2% OFF
                        </span>
                        <span>Group Discount (4+ guests):</span>
                      </span>
                      <span style={{ fontWeight: 800 }}>
                        -{formatPrice(groupDiscountNGN, currentCurrency, false, undefined, exchangeRates)}
                      </span>
                    </div>
                  )}

                  {promoDiscountNGN > 0 && appliedPromo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', color: '#059669' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                          {appliedPromo.discountPct}% OFF
                        </span>
                        <span>Promo Code &ldquo;{appliedPromo.code}&rdquo;:</span>
                      </span>
                      <span style={{ fontWeight: 800 }}>
                        -{formatPrice(promoDiscountNGN, currentCurrency, false, undefined, exchangeRates)}
                      </span>
                    </div>
                  )}

                  {/* Final Payable with Cancelled Normal Price */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1.5px dashed ' + (hasDiscount ? '#86efac' : 'var(--border-light)'),
                    paddingTop: '10px',
                    marginTop: '2px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-heading)' }}>
                        {hasDiscount ? 'New Discounted Price:' : 'Total Amount:'}
                      </div>
                      {hasDiscount && (
                        <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <CheckCircle2 size={13} />
                          <span>Total Savings: {formatPrice(totalDiscountNGN, currentCurrency, false, undefined, exchangeRates)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {hasDiscount && (
                        <div style={{
                          fontSize: '0.88rem',
                          color: '#94a3b8',
                          textDecoration: 'line-through',
                          textDecorationColor: '#ef4444',
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}>
                          {formatPrice(subtotalNGN, currentCurrency, false, undefined, exchangeRates)}
                        </div>
                      )}
                      <div style={{
                        fontSize: '1.35rem',
                        fontWeight: 900,
                        color: hasDiscount ? '#059669' : 'var(--blue-deep)',
                        lineHeight: 1.1,
                      }}>
                        {formatPrice(finalTotalNGN, currentCurrency, false, undefined, exchangeRates)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Method Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--blue-deep)', textTransform: 'uppercase' }}>
                    3. Choose Payment Method
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {currentCurrency === 'NGN' ? 'Select Paystack or Flutterwave' : 'International Checkout via Flutterwave'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: currentCurrency === 'NGN' ? 'repeat(auto-fit, minmax(160px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
                  {/* Paystack: Shown only when currency is NGN */}
                  {currentCurrency === 'NGN' && (
                    <div
                      onClick={() => setPaymentMethod('paystack')}
                      style={{
                        padding: '16px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: paymentMethod === 'paystack' ? '2px solid var(--blue-deep)' : '1px solid var(--border-light)',
                        backgroundColor: paymentMethod === 'paystack' ? 'var(--blue-surface)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        justifyContent: 'space-between',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        boxShadow: paymentMethod === 'paystack' ? '0 4px 12px rgba(13, 71, 161, 0.12)' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <CreditCard size={22} style={{ color: 'var(--blue-deep)' }} />
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0d9488', backgroundColor: '#ccfbf1', padding: '2px 6px', borderRadius: '4px' }}>
                            NGN
                          </span>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-heading)' }}>Paystack</div>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        Cards, Apple Pay, Bank Transfer & USSD
                      </div>
                    </div>
                  )}

                  {/* Flutterwave: Shown for all currencies (NGN, USD, GBP) */}
                  <div
                    onClick={() => setPaymentMethod('flutterwave')}
                    style={{
                      padding: '16px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'flutterwave' ? '2px solid var(--blue-deep)' : '1px solid var(--border-light)',
                      backgroundColor: paymentMethod === 'flutterwave' ? 'var(--blue-surface)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      justifyContent: 'space-between',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: paymentMethod === 'flutterwave' ? '0 4px 12px rgba(13, 71, 161, 0.12)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <CreditCard size={22} style={{ color: '#f59e0b' }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#b45309', backgroundColor: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                          {currentCurrency === 'NGN' ? 'NGN' : `${currentCurrency} Global`}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                        {currentCurrency === 'NGN' ? 'Flutterwave' : `Flutterwave (${currentCurrency})`}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      {currentCurrency === 'NGN'
                        ? 'Debit/Credit Card, Bank & Multi-Channel'
                        : `International ${currentCurrency} Cards, Apple Pay, Google Pay`}
                    </div>
                  </div>

                  {/* WhatsApp / Direct Wire Transfer Fallback */}
                  <div
                    onClick={() => setPaymentMethod('whatsapp')}
                    style={{
                      padding: '16px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: paymentMethod === 'whatsapp' ? '2px solid #25D366' : '1px solid var(--border-light)',
                      backgroundColor: paymentMethod === 'whatsapp' ? 'var(--green-soft)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      justifyContent: 'space-between',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: paymentMethod === 'whatsapp' ? '0 4px 12px rgba(37, 211, 102, 0.15)' : 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <Phone size={22} style={{ color: '#059669' }} />
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#065f46', backgroundColor: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
                          Direct
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-heading)' }}>
                        Book via WhatsApp
                      </div>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                      Corporate bank wire & booking team assistance
                    </div>
                  </div>
                </div>

                {/* Gateway processing fee notice */}
                {(paymentMethod === 'paystack' || paymentMethod === 'flutterwave') && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)',
                      animation: 'fadeInError 0.2s ease-out',
                    }}
                    role="alert"
                  >
                    <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#92400e', marginBottom: '3px' }}>
                        Notice: Payment Gateway Processing Fee
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#78350f', lineHeight: 1.5 }}>
                        {paymentMethod === 'paystack' ? 'Paystack' : 'Flutterwave'} charges a small standard card processing fee. This fee will be automatically added to your reservation total on the secure checkout page.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Legal & Data Processing Consents */}
              <div
                id="field-terms-agreement"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >

                {/* Checkbox 1: Terms and Conditions */}
                <label
                  htmlFor="checkbox-agree-terms"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: submitAttempted && !agreeTerms ? '#fef2f2' : '#ffffff',
                    border: submitAttempted && !agreeTerms ? '1px solid #fca5a5' : '1px solid var(--border-light)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    id="checkbox-agree-terms"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (termsError) setTermsError('');
                    }}
                    style={{
                      marginTop: '3px',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--blue-deep)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    I confirm that I am at least 18 years old and have read, understood, and accept the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--blue-deep)', fontWeight: 800, textDecoration: 'underline' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms and Conditions
                    </a>{' '}
                    governing the Lagos Luxe 2026 Programme, including excursion guidelines, and the binding{' '}
                    <a
                      href="/terms#sec-7"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--blue-deep)', fontWeight: 800, textDecoration: 'underline' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Cancellation &amp; Refund Schedule
                    </a>.
                  </span>
                </label>

                {/* Checkbox 2: Data Processing Consent */}
                <label
                  htmlFor="checkbox-agree-data-processing"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: submitAttempted && !agreeDataProcessing ? '#fef2f2' : '#ffffff',
                    border: submitAttempted && !agreeDataProcessing ? '1px solid #fca5a5' : '1px solid var(--border-light)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    id="checkbox-agree-data-processing"
                    checked={agreeDataProcessing}
                    onChange={(e) => {
                      setAgreeDataProcessing(e.target.checked);
                      if (termsError) setTermsError('');
                    }}
                    style={{
                      marginTop: '3px',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--blue-deep)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-body)', lineHeight: 1.55 }}>
                    I formally consent to the collection, processing, and lawful transfer of my personal data by Incel Holidays &amp; Tourism Ltd and Prospiz Management Consulting Limited in strict compliance with the Nigeria Data Protection Act (NDPA) 2023 and the{' '}
                    <a
                      href="/terms#sec-17"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--blue-deep)', fontWeight: 800, textDecoration: 'underline' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Data Privacy Policy
                    </a>{' '}
                    for booking fulfillment, safety and security coordination, emergency assistance, and tour communications.
                  </span>
                </label>

                {termsError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700, marginTop: '2px' }}>
                    <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
                    <span>{termsError}</span>
                  </div>
                )}
              </div>

              {/* Cloudflare Turnstile CAPTCHA container */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '65px',
                  margin: '4px 0 0',
                }}
              >
                <div id="cf-turnstile-booking-widget" ref={turnstileContainerRef} />
              </div>

              {/* Form Level Error Alerts */}
              {submitError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    color: '#991b1b',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    animation: 'fadeInError 0.2s ease-out',
                  }}
                  role="alert"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span>{submitError}</span>
                  </div>
                  {existingRef && (
                    <div style={{ marginTop: '4px', paddingLeft: '28px' }}>
                      <a
                        href={`/booking/lookup?ref=${encodeURIComponent(existingRef)}`}
                        style={{
                          color: '#1d4ed8',
                          fontWeight: 700,
                          textDecoration: 'underline',
                          fontSize: '0.84rem',
                        }}
                      >
                        View or complete payment for existing reservation #{existingRef} &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}

              {submitAttempted && Object.values(errors).some(Boolean) && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fff7ed',
                    border: '1.5px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#9a3412',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    animation: 'fadeInError 0.2s ease-out',
                  }}
                  role="alert"
                >
                  <AlertCircle size={18} style={{ color: '#f97316', flexShrink: 0 }} />
                  <span>Please review and correct the highlighted fields before completing your reservation.</span>
                </div>
              )}
            </div>

            {/* Sticky Mobile & Desktop Action Checkout Bar */}
            <div
              className="checkout-action-bar"
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'sticky',
                bottom: 0,
                backgroundColor: '#ffffff',
                boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: '1 1 auto', minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Total for {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'}:
                  </span>
                  {hasDiscount && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#065f46',
                      backgroundColor: '#d1fae5',
                      border: '1px solid #a7f3d0',
                      padding: '1px 6px',
                      borderRadius: '4px',
                    }}>
                      Save {formatPrice(totalDiscountNGN, currentCurrency, false, undefined, exchangeRates)}
                    </span>
                  )}
                </div>

                {/* Normal initial price in cancelled space and new discount price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  {hasDiscount && (
                    <span
                      style={{
                        fontSize: '1.12rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        textDecoration: 'line-through',
                        textDecorationColor: '#ef4444',
                        textDecorationThickness: '2px',
                      }}
                      title="Initial price before discount"
                    >
                      {formatPrice(subtotalNGN, currentCurrency, false, undefined, exchangeRates)}
                    </span>
                  )}
                  <span style={{
                    fontSize: '1.65rem',
                    fontWeight: 900,
                    color: hasDiscount ? '#059669' : 'var(--blue-deep)',
                    lineHeight: 1.1,
                  }}>
                    {formatPrice(finalTotalNGN, currentCurrency, false, undefined, exchangeRates)}
                  </span>
                </div>

                {/* Point out the discounts being applied */}
                {hasDiscount && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                    {groupDiscountNGN > 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>2% Group Discount (4+ guests): -{formatPrice(groupDiscountNGN, currentCurrency, false, undefined, exchangeRates)}</span>
                      </div>
                    )}
                    {promoDiscountNGN > 0 && appliedPromo && (
                      <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>Promo Code &ldquo;{appliedPromo.code}&rdquo; ({appliedPromo.discountPct}% off): -{formatPrice(promoDiscountNGN, currentCurrency, false, undefined, exchangeRates)}</span>
                      </div>
                    )}
                  </div>
                )}
                {(paymentMethod === 'paystack' || paymentMethod === 'flutterwave') && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: '#92400e',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      width: 'fit-content',
                    }}
                  >
                    <AlertCircle size={12} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span>Gateway processing fee added at checkout</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms || !agreeDataProcessing}
                  className="btn-primary"
                  style={{
                    padding: '15px 32px',
                    fontSize: '0.98rem',
                    opacity: (isSubmitting || !agreeTerms || !agreeDataProcessing) ? 0.55 : 1,
                    cursor: (!agreeTerms || !agreeDataProcessing) ? 'not-allowed' : 'pointer',
                    filter: (!agreeTerms || !agreeDataProcessing) ? 'grayscale(0.3)' : 'none',
                    transition: 'all 0.25s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title={
                    !agreeTerms || !agreeDataProcessing
                      ? 'Please check both required consent checkboxes above to proceed'
                      : undefined
                  }
                >
                  <span>
                    {isSubmitting
                      ? paymentMethod === 'paystack'
                        ? 'Redirecting to Paystack...'
                        : paymentMethod === 'flutterwave'
                          ? 'Redirecting to Flutterwave...'
                          : 'Connecting to WhatsApp...'
                      : paymentMethod === 'paystack'
                        ? 'Pay with Paystack'
                        : paymentMethod === 'flutterwave'
                          ? 'Pay with Flutterwave'
                          : 'Book via WhatsApp'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Confirmation State */
          <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--green-soft)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}>
              <CheckCircle2 size={36} />
            </div>

            <div>
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
                    Booking Ref: <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{bookingId}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!bookingId) return;
                      navigator.clipboard.writeText(bookingId);
                      setCopiedRef(true);
                      setTimeout(() => setCopiedRef(false), 2200);
                    }}
                    id="modal-copy-ref-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: copiedRef ? '#059669' : '#ffffff',
                      color: copiedRef ? '#ffffff' : 'var(--blue-deep)',
                      border: copiedRef ? '1px solid #059669' : '1px solid var(--border-light)',
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
                    {copiedRef ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedRef ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <h3 style={{ fontSize: '1.75rem', color: 'var(--text-heading)', marginTop: '8px', marginBottom: '8px' }}>
                Your Seat is Held!
              </h3>
              <p style={{ color: 'var(--text-body)', maxWidth: '520px', margin: '0 auto', fontSize: '0.94rem', lineHeight: 1.6 }}>
                Thank you, <strong style={{ color: 'var(--text-heading)' }}>{fullName}</strong>. Your booking confirmation and trip details
                have been sent to <strong style={{ color: 'var(--text-heading)' }}>{email}</strong>.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.04em' }}>
                BOOKING SUMMARY:
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Guests:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{guestCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Selected Tours:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{selectedIds.length} Packages</span>
              </div>
              {hasDiscount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Normal Initial Price:</span>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textDecoration: 'line-through', textDecorationColor: '#ef4444' }}>
                    {formatPrice(subtotalNGN, currentCurrency, false, undefined, exchangeRates)}
                  </span>
                </div>
              )}
              {groupDiscountNGN > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', color: '#059669' }}>
                  <span>Group Discount (2%):</span>
                  <span style={{ fontWeight: 700 }}>
                    -{formatPrice(groupDiscountNGN, currentCurrency, false, undefined, exchangeRates)}
                  </span>
                </div>
              )}
              {promoDiscountNGN > 0 && appliedPromo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', color: '#059669' }}>
                  <span>Promo Discount ({appliedPromo.code}):</span>
                  <span style={{ fontWeight: 700 }}>
                    -{formatPrice(promoDiscountNGN, currentCurrency, false, undefined, exchangeRates)}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Option:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>
                  {paymentMethod === 'paystack'
                    ? 'Paystack'
                    : paymentMethod === 'flutterwave'
                      ? 'Flutterwave'
                      : 'Book via WhatsApp'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount:</span>
                <div style={{ textAlign: 'right' }}>
                  {hasDiscount && (
                    <span style={{ fontSize: '0.86rem', color: '#94a3b8', textDecoration: 'line-through', textDecorationColor: '#ef4444', marginRight: '8px', fontWeight: 600 }}>
                      {formatPrice(subtotalNGN, currentCurrency, false, undefined, exchangeRates)}
                    </span>
                  )}
                  <span style={{ fontWeight: 900, color: hasDiscount ? '#059669' : 'var(--blue-deep)', fontSize: '1.05rem' }}>
                    {formatPrice(finalTotalNGN, currentCurrency, false, undefined, exchangeRates)}
                  </span>
                </div>
              </div>
              {hasDiscount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.84rem', color: '#059669', fontWeight: 700 }}>
                  <span>Total Saved:</span>
                  <span>{formatPrice(totalDiscountNGN, currentCurrency, false, undefined, exchangeRates)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{ color: '#059669', fontWeight: 800 }}>Seat Reserved (Awaiting Payment)</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <a
                href={`https://wa.me/2348123456789?text=${encodeURIComponent(
                  `Hello Team! My Booking Reference is ${bookingId}. I would like to inquire about my reservation for Lagos Luxe 2026.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                style={{ padding: '14px 22px', fontSize: '0.94rem' }}
              >
                <Phone size={17} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`/booking/lookup?ref=${bookingId}`}
                className="btn-secondary"
                style={{ padding: '14px 22px', fontSize: '0.94rem', textDecoration: 'none' }}
              >
                View Booking Details
              </a>

              <button
                onClick={handleClose}
                className="btn-secondary"
                style={{ padding: '14px 22px', fontSize: '0.94rem' }}
              >
                Return to Site
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .booking-modal-overlay {
            align-items: flex-end !important;
            padding: 0 !important;
          }
          .booking-modal-container {
            max-height: 94vh !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-bottom: none !important;
          }
          .mobile-drag-handle {
            display: block !important;
          }
          .checkout-action-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .checkout-action-bar button {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="lazyOnload"
      />
    </div>
  );
};
