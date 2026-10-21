import { ExcursionPackage, PACKAGES_DATA } from '@/data/packages';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export interface BookingPayload {
  fullName: string;
  email: string;
  phone: string;
  country?: string;
  guestCount: number;
  isForeigner: boolean;
  selectedPackages: string[];
  currency: string;
  promoCode?: string;
  paymentMethod: 'paystack' | 'flutterwave' | 'whatsapp' | 'card' | 'transfer';
  specialRequests?: string;
  callbackUrl?: string;
}

export interface BookingPackageDetail {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  category?: string;
  priceNGN: number;
  priceForeignerNGN?: number | null;
  duration?: string;
  dates?: string;
  location?: string;
  image?: string;
  highlightBadge?: string | null;
}

export interface BookingResponse {
  bookingRef: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  guestCount: number;
  isForeigner: boolean;
  selectedPackages: string[];
  packageDetails?: BookingPackageDetail[];
  subtotalNGN: number;
  groupDiscountPct?: number;
  groupDiscountNGN: number;
  promoCode?: string | null;
  promoDiscountPct?: number;
  promoDiscountNGN: number;
  finalTotalNGN: number;
  convertedSubtotal?: number | null;
  convertedGroupDiscount?: number | null;
  convertedPromoDiscount?: number | null;
  convertedTotalSavings?: number | null;
  convertedTotal?: number | null;
  exchangeRate?: number | null;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string | null;
  specialRequests?: string;
  checkoutUrl?: string | null;
  paidAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  isExpired?: boolean;
  secondsRemaining?: number;
}

export interface CampaignStats {
  earlyBird: {
    code: string;
    discountPct: number;
    totalCap: number;
    claimed: number;
    remaining: number;
    deadline: string;
    isActive: boolean;
  };
  globalCap: {
    perPackageCap: number;
    totalCapacity: number;
    totalBooked: number;
    totalRemaining: number;
  };
  eventDates: {
    start: string;
    end: string;
    display: string;
  };
  exchangeRates: {
    USD: number;
    GBP: number;
  };
}

export const DEFAULT_CAMPAIGN_STATS: CampaignStats = {
  earlyBird: {
    code: 'EARLYBIRD17',
    discountPct: 5,
    totalCap: 20,
    claimed: 10,
    remaining: 10,
    deadline: '2026-11-15T23:59:59+01:00',
    isActive: true,
  },
  globalCap: {
    perPackageCap: 100,
    totalCapacity: 600,
    totalBooked: 195,
    totalRemaining: 405,
  },
  eventDates: {
    start: '2026-12-13T09:00:00+01:00',
    end: '2026-12-30T23:59:59+01:00',
    display: '13–30 December 2026',
  },
  exchangeRates: {
    USD: 1400,
    GBP: 1900,
  },
};

/**
 * Fetch campaign aggregated stats (early bird, capacity, dates) from backend.
 */
export async function getCampaignStats(): Promise<CampaignStats> {
  try {
    const res = await fetch(`${API_BASE}/stats/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data: CampaignStats = await res.json();
    return data;
  } catch (error) {
    console.warn('API /stats unavailable, falling back to local defaults:', error);
    return DEFAULT_CAMPAIGN_STATS;
  }
}

/**
 * Fetch packages from the Django REST API.
 * Falls back to PACKAGES_DATA if server is unreachable.
 */
export async function getPackages(): Promise<ExcursionPackage[]> {
  try {
    const res = await fetch(`${API_BASE}/packages/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data: ExcursionPackage[] = await res.json();
    return data && data.length > 0 ? data : PACKAGES_DATA;
  } catch (error) {
    console.warn('API /packages unavailable, falling back to local data:', error);
    return PACKAGES_DATA;
  }
}

/**
 * Validate a promo code against the Django REST API.
 */
export async function validatePromo(code: string): Promise<{ valid: boolean; code?: string; discountPct?: number; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/promo/validate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { valid: false, error: data.error || 'Invalid promo code' };
    }
    return data;
  } catch {
    // Graceful offline fallback
    const upper = code.trim().toUpperCase();
    if (upper === 'EARLYBIRD17' || upper === 'EARLYBIRD5' || upper === 'DETTY5') {
      return { valid: true, code: upper, discountPct: 5 };
    }
    if (upper === 'VIPLAGOS') {
      return { valid: true, code: upper, discountPct: 10 };
    }
    return { valid: false, error: 'Invalid or expired promo code.' };
  }
}

/**
 * Submit a booking to the Django backend PostgreSQL database.
 */
export async function submitBooking(payload: BookingPayload): Promise<BookingResponse> {
  try {
    const res = await fetch(`${API_BASE}/bookings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit booking');
    }
    return await res.json();
  } catch (error) {
    console.warn('Failed to submit booking to API, generating local reference:', error);
    // Fallback generation so guest flow never crashes
    const randomRef = `DL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      bookingRef: randomRef,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country || 'UK',
      guestCount: payload.guestCount,
      isForeigner: payload.isForeigner,
      selectedPackages: payload.selectedPackages,
      subtotalNGN: 0,
      groupDiscountNGN: 0,
      promoDiscountNGN: 0,
      finalTotalNGN: 0,
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
  }
}

export async function verifyPayment(params: {
  reference?: string;
  trxref?: string;
  tx_ref?: string;
  transaction_id?: string;
  gateway?: string;
}): Promise<BookingResponse> {
  const query = new URLSearchParams();
  if (params.reference) query.set('reference', params.reference);
  if (params.trxref) query.set('trxref', params.trxref);
  if (params.tx_ref) query.set('tx_ref', params.tx_ref);
  if (params.transaction_id) query.set('transaction_id', params.transaction_id);
  if (params.gateway) query.set('gateway', params.gateway);

  const res = await fetch(`${API_BASE}/payments/verify/?${query.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Payment verification failed.');
  }

  return await res.json();
}

/**
 * Retrieve booking details by booking reference (e.g. DL-2026-1234).
 */
export async function getBookingByRef(bookingRef: string): Promise<BookingResponse> {
  const cleanRef = encodeURIComponent(bookingRef.trim());
  const res = await fetch(`${API_BASE}/bookings/${cleanRef}/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `Booking reference '${bookingRef}' not found.`);
  }

  return await res.json();
}

/**
 * Request or refresh an online payment checkout URL for an active pending booking
 * using the booking's own selected payment method.
 */
export async function payBooking(
  bookingRef: string,
  callbackUrl?: string
): Promise<{ bookingRef: string; checkoutUrl: string; paymentMethod: string }> {
  const cleanRef = encodeURIComponent(bookingRef.trim());
  const res = await fetch(`${API_BASE}/bookings/${cleanRef}/pay/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ callbackUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.detail || 'Unable to generate checkout URL for this booking.');
  }

  return await res.json();
}

/**
 * Safely purge pending checkout session storage and notify all listeners across the app.
 */
export function clearPendingCheckout(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('pending_checkout');
      window.dispatchEvent(new Event('pending_checkout_updated'));
    } catch {}
  }
}
