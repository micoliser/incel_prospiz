"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getBookingByRef,
  payBooking,
  clearPendingCheckout,
  BookingResponse,
} from "@/lib/api";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Phone,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileText,
  Loader2,
} from "lucide-react";

function formatTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function BookingLookupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [queryRef, setQueryRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const lastSearchedRef = useRef<string | null>(null);

  const fetchBooking = async (refToSearch: string) => {
    const trimmed = refToSearch.trim();
    if (!trimmed) {
      setError("Please enter a booking reference (e.g. DL-2026-K7M9P2).");
      return;
    }

    if (
      trimmed.toUpperCase() === lastSearchedRef.current?.toUpperCase() &&
      booking
    ) {
      return;
    }

    lastSearchedRef.current = trimmed;
    setLoading(true);
    setError(null);
    setBooking(null);

    // Update browser URL query string without triggering Next.js route re-renders
    if (typeof window !== "undefined") {
      const newUrl = `${window.location.pathname}?ref=${encodeURIComponent(trimmed)}`;
      window.history.replaceState(null, "", newUrl);
    }

    try {
      const data = await getBookingByRef(trimmed);
      setBooking(data);
      if (data.secondsRemaining !== undefined) {
        setCountdown(data.secondsRemaining);
      }
      if (data.paymentStatus === "paid" || data.paymentStatus === "cancelled") {
        clearPendingCheckout();
      }
    } catch (err: any) {
      setError(
        err.message ||
          `No booking found for reference '${trimmed}'. Please check the code and try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramRef = searchParams.get("ref");
    if (
      paramRef &&
      paramRef.trim().toUpperCase() !== lastSearchedRef.current?.toUpperCase()
    ) {
      setQueryRef(paramRef);
      fetchBooking(paramRef);
    }
  }, [searchParams]);

  // Live countdown timer for active seat hold
  useEffect(() => {
    if (!booking || booking.paymentStatus !== "pending") {
      setCountdown(0);
      return;
    }
    const initial = booking.secondsRemaining ?? 0;
    setCountdown(initial);
    if (initial <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (booking.bookingRef) {
            getBookingByRef(booking.bookingRef)
              .then(setBooking)
              .catch(() => {});
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.bookingRef, booking?.paymentStatus, booking?.secondsRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooking(queryRef);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCheckoutRedirect = (url: string) => {
    if (typeof window !== "undefined" && booking) {
      try {
        // LOW-05: Store only reference and timestamp in sessionStorage
        sessionStorage.setItem(
          "pending_checkout",
          JSON.stringify({
            bookingRef: booking.bookingRef,
            timestamp: Date.now(),
          }),
        );
      } catch {}
    }
  };

  const handlePayNow = async () => {
    if (!booking) return;

    if (booking.checkoutUrl) {
      handleCheckoutRedirect(booking.checkoutUrl);
      window.location.href = booking.checkoutUrl;
      return;
    }

    setPayLoading(true);
    setPayError(null);
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/booking/verify`
          : undefined;

      const res = await payBooking(booking.bookingRef, callbackUrl);
      if (res.checkoutUrl) {
        if (typeof window !== "undefined") {
          try {
            // LOW-05: Store only reference and timestamp in sessionStorage
            sessionStorage.setItem(
              "pending_checkout",
              JSON.stringify({
                bookingRef: booking.bookingRef,
                timestamp: Date.now(),
              }),
            );
          } catch {}
        }
        setBooking((prev) =>
          prev ? { ...prev, checkoutUrl: res.checkoutUrl } : null,
        );
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error("No checkout URL returned by payment gateway.");
      }
    } catch (err: any) {
      console.error("Failed to generate checkout URL:", err);
      setPayError(
        err.message ||
          "Unable to connect to payment gateway. Please try again or chat with our team on WhatsApp.",
      );
      setPayLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const isPaid = booking?.paymentStatus === "paid";
  const isPending = booking?.paymentStatus === "pending";

  const subtotal = booking
    ? booking.subtotalNGN || booking.finalTotalNGN || 0
    : 0;
  const groupDiscount = booking?.groupDiscountNGN || 0;
  const promoDiscount = booking?.promoDiscountNGN || 0;
  const totalDiscount = groupDiscount + promoDiscount;
  const hasDiscount = totalDiscount > 0;

  const isUSD = booking?.currency === "USD";
  const isGBP = booking?.currency === "GBP";
  const isForeign = isUSD || isGBP;
  const sym = isUSD ? "$" : isGBP ? "£" : "₦";

  const rate =
    booking?.exchangeRate ||
    (booking?.convertedTotal && booking?.finalTotalNGN
      ? Number(booking.finalTotalNGN) / Number(booking.convertedTotal)
      : 1);

  const formatCurrencyVal = (ngnVal: number, convertedVal?: number | null) => {
    if (isForeign) {
      const val =
        convertedVal != null ? convertedVal : rate > 0 ? ngnVal / rate : 0;
      return `${sym}${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${Number(ngnVal).toLocaleString()}`;
  };

  const displaySubtotal = formatCurrencyVal(
    subtotal,
    booking?.convertedSubtotal,
  );
  const displayGroupDiscount = formatCurrencyVal(
    groupDiscount,
    booking?.convertedGroupDiscount,
  );
  const displayPromoDiscount = formatCurrencyVal(
    promoDiscount,
    booking?.convertedPromoDiscount,
  );
  const displayTotalSavings = formatCurrencyVal(
    totalDiscount,
    booking?.convertedTotalSavings,
  );
  const displayFinalTotal =
    isForeign && booking?.convertedTotal != null
      ? `${sym}${Number(booking.convertedTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `₦${Number(booking?.finalTotalNGN || 0).toLocaleString()}`;

  // LOW-02: Clean, reference-only WhatsApp message without cleartext PII, financial totals, or email/phone

  // LOW-02: Reference-only WhatsApp message without cleartext PII
  const whatsappMsg = booking
    ? booking.paymentMethod === "whatsapp" && isPending
      ? `Hello Incel Holidays & Prospiz Team! I reserved a seat via WhatsApp and would like to complete my booking payment:%0A%0A*Reference:* ${booking.bookingRef}%0A*Status:* ${booking.paymentStatus.toUpperCase()}%0A%0APlease provide bank transfer details so I can complete my booking.`
      : `Hello Incel Holidays & Prospiz Team! I am inquiring about my booking:%0A%0A*Reference:* ${booking.bookingRef}%0A*Status:* ${booking.paymentStatus.toUpperCase()}`
    : `Hello Incel Holidays & Prospiz Team! I need assistance looking up my reservation for Lagos Luxe 2026.`;

  return (
    <div
      style={{
        minHeight: "90vh",
        padding: "36px 16px 80px",
        backgroundColor: "var(--bg-subtle)",
      }}
    >
      <div
        className="container"
        style={{ maxWidth: "860px", margin: "0 auto" }}
      >
        {/* Top Navigation Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
          }}
        >
          <Link
            href="/"
            className="btn-secondary"
            style={{
              padding: "8px 16px",
              fontSize: "0.86rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
              backgroundColor: "#ffffff",
            }}
          >
            <ArrowLeft size={15} />
            <span>Return to Site</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{ position: "relative", width: "84px", height: "34px" }}
            >
              <Image
                src="/tourism-logo.png"
                alt="Incel Holidays"
                fill
                sizes="84px"
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
            <div
              style={{
                position: "relative",
                width: "30px",
                height: "30px",
                borderRadius: "6px",
                overflow: "hidden",
                border: "1px solid var(--border-light)",
              }}
            >
              <Image
                src="/propiz-logo.png"
                alt="Prospiz Consulting"
                fill
                sizes="30px"
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          </div>
        </div>

        {/* Hero Search Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1.5px solid var(--border-light)",
            borderRadius: "var(--radius-xl)",
            padding: "36px 28px",
            boxShadow: "0 12px 32px -8px rgba(9, 30, 66, 0.08)",
            marginBottom: "32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--blue-surface)",
              color: "var(--blue-deep)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <Search size={28} />
          </div>

          <h1
            style={{
              fontSize: "clamp(1.6rem, 3.2vw, 2.1rem)",
              fontWeight: 900,
              color: "var(--text-heading)",
              marginBottom: "8px",
            }}
          >
            Find Your Booking
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              maxWidth: "520px",
              margin: "0 auto 24px",
              lineHeight: 1.6,
            }}
          >
            Enter your booking reference code to view your trip details, payment
            status, and booked tour dates.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSubmit}
            style={{ maxWidth: "540px", margin: "0 auto" }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                backgroundColor: "var(--bg-subtle)",
                padding: "6px",
                borderRadius: "var(--radius-lg)",
                border: "1.5px solid var(--border-light)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "14px",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  value={queryRef}
                  onChange={(e) => setQueryRef(e.target.value)}
                  placeholder="e.g. DL-2026-K7M9P2"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    border: "none",
                    backgroundColor: "transparent",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    outline: "none",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: "12px 22px",
                  fontSize: "0.92rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <span>Searching...</span>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Find Booking</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message Banner */}
          {error && (
            <div
              style={{
                marginTop: "20px",
                padding: "14px 18px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                color: "#dc2626",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                textAlign: "left",
                fontSize: "0.9rem",
                lineHeight: 1.5,
                maxWidth: "540px",
                margin: "20px auto 0",
              }}
            >
              <AlertCircle
                size={20}
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <div>
                <strong style={{ display: "block", marginBottom: "2px" }}>
                  Reservation Not Located
                </strong>
                <span>{error}</span>
                <div style={{ marginTop: "8px" }}>
                  <a
                    href={`https://wa.me/2348123456789?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#dc2626",
                      fontWeight: 700,
                      textDecoration: "underline",
                    }}
                  >
                    Need human assistance? Chat with Tour Coordination on
                    WhatsApp →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Found Booking Details Dossier */}
        {booking && (
          <div
            id="printable-dossier"
            style={{
              backgroundColor: "#ffffff",
              border: "1.5px solid var(--border-light)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              boxShadow: "0 20px 40px -12px rgba(9, 30, 66, 0.12)",
            }}
          >
            {/* Dossier Header Status Banner */}
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid var(--border-light)",
                backgroundColor: isPaid
                  ? "rgba(16, 185, 129, 0.08)"
                  : isPending
                    ? "rgba(245, 158, 11, 0.08)"
                    : "rgba(239, 68, 68, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      backgroundColor: isPaid
                        ? "#10b981"
                        : isPending && countdown > 0
                          ? "#f59e0b"
                          : "#ef4444",
                      color: "#ffffff",
                    }}
                  >
                    {isPaid ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <AlertCircle size={13} />
                    )}
                    {isPaid
                      ? "Payment Confirmed"
                      : isPending && countdown > 0
                        ? "Seat Reserved (Awaiting Payment)"
                        : "Reservation Cancelled / Hold Expired"}
                  </span>
                  <span
                    style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    Booked on{" "}
                    {new Date(booking.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    color: "var(--text-heading)",
                  }}
                >
                  {booking.fullName}
                </div>
              </div>

              {/* Booking Reference Pill with Copy Button */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#ffffff",
                  border: "1.5px solid var(--border-light)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                    letterSpacing: "0.04em",
                  }}
                >
                  REF:{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 900 }}>
                    {booking.bookingRef}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(booking.bookingRef)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    backgroundColor: copied ? "#059669" : "var(--blue-surface)",
                    color: copied ? "#ffffff" : "var(--blue-deep)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  aria-label="Copy booking reference"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Dossier Body */}
            <div style={{ padding: "28px" }}>
              {/* Active Seat Hold Countdown Banner */}
              {isPending && countdown > 0 && (
                <div
                  style={{
                    marginBottom: "28px",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "#fffbeb",
                    border: "1.5px solid #fde68a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "14px",
                    boxShadow: "0 4px 14px rgba(217, 119, 6, 0.08)",
                  }}
                  role="alert"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <Clock
                      size={22}
                      style={{
                        color: "#d97706",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 800,
                          color: "#92400e",
                          marginBottom: "3px",
                        }}
                      >
                        Seat Hold Active: {formatTimer(countdown)} Left to
                        Complete Payment
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#78350f",
                          lineHeight: 1.5,
                          maxWidth: "560px",
                        }}
                      >
                        {booking.paymentMethod === "whatsapp"
                          ? "Your reservation seats are temporarily reserved for offline booking. Please contact our tour agent on WhatsApp before this countdown reaches zero to provide payment proof and complete your reservation."
                          : "Your reservation seats are temporarily reserved. Please complete your payment before this countdown reaches zero, or this booking will be automatically cancelled and seats returned to public availability."}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "#92400e",
                          marginTop: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <ShieldCheck size={13} style={{ flexShrink: 0 }} />
                        <span>
                          Governed by the official{" "}
                          <Link href="/terms" target="_blank" style={{ color: "#92400e", fontWeight: 700, textDecoration: "underline" }}>
                            Terms &amp; Conditions
                          </Link>{" "}
                          and{" "}
                          <Link href="/terms#sec-17" target="_blank" style={{ color: "#92400e", fontWeight: 700, textDecoration: "underline" }}>
                            NDPA 2023 Privacy Policy
                          </Link>.
                        </span>
                      </div>
                    </div>
                  </div>

                  {booking.paymentMethod !== "whatsapp" ? (
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={payLoading}
                      className="btn-primary"
                      style={{
                        padding: "10px 20px",
                        fontSize: "0.86rem",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(1, 104, 167, 0.25)",
                        opacity: payLoading ? 0.75 : 1,
                        cursor: payLoading ? "wait" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {payLoading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Connecting to Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={15} />
                          <span>Complete Online Payment Now →</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <a
                      href={`https://wa.me/2348123456789?text=${encodeURIComponent(whatsappMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp"
                      style={{
                        padding: "10px 20px",
                        fontSize: "0.86rem",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Phone size={15} />
                      <span>Contact Agent on WhatsApp →</span>
                    </a>
                  )}

                  {payError && (
                    <div
                      style={{
                        width: "100%",
                        fontSize: "0.82rem",
                        color: "#b91c1c",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertCircle size={15} style={{ flexShrink: 0 }} />
                      <span>{payError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* WhatsApp Booking Instructions Notification */}
              {isPending && countdown > 0 && booking.paymentMethod === "whatsapp" && (
                <div
                  style={{
                    marginBottom: "28px",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "rgba(37, 211, 102, 0.08)",
                    border: "1.5px solid rgba(37, 211, 102, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                  role="status"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <Phone
                      size={22}
                      style={{
                        color: "#16a34a",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 800,
                          color: "#15803d",
                          marginBottom: "3px",
                        }}
                      >
                        WhatsApp Booking — Contact Agent to Finalize Reservation
                      </div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#166534",
                          lineHeight: 1.5,
                          maxWidth: "600px",
                        }}
                      >
                        Because this booking was created via WhatsApp, online card checkout is disabled.
                        Please reach out to our tour coordination agent on WhatsApp with your booking reference{" "}
                        <strong style={{ fontFamily: "monospace" }}>{booking.bookingRef}</strong> to complete your payment (bank transfer or cash) and confirm your seats.
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/2348123456789?text=${encodeURIComponent(whatsappMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp"
                    style={{
                      padding: "10px 18px",
                      fontSize: "0.84rem",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Phone size={15} />
                    <span>Contact Agent on WhatsApp →</span>
                  </a>
                </div>
              )}

              {/* Expired Seat Hold Banner */}
              {(booking.paymentStatus === "cancelled" ||
                (isPending && countdown <= 0)) && (
                <div
                  style={{
                    marginBottom: "28px",
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "#fef2f2",
                    border: "1.5px solid #fecaca",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                  role="alert"
                >
                  <AlertCircle
                    size={22}
                    style={{
                      color: "#ef4444",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: 800,
                        color: "#991b1b",
                        marginBottom: "3px",
                      }}
                    >
                      Reservation Cancelled — Seat Hold Expired
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "#7f1d1d",
                        lineHeight: 1.5,
                      }}
                    >
                      The temporary 30-minute hold window for this reservation
                      has ended. Any held seats have been automatically released
                      back to public tour capacity. To join this excursion,
                      please start a fresh booking below.
                    </div>
                  </div>
                </div>
              )}
              {/* Grid 1: Guest Information */}
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "14px",
                  }}
                >
                  Guest Information
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "14px",
                    backgroundColor: "var(--bg-subtle)",
                    padding: "18px",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Email Address
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-heading)",
                        fontSize: "0.9rem",
                        wordBreak: "break-all",
                      }}
                    >
                      {booking.email}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Phone / WhatsApp
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-heading)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {booking.phone}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Country of Residence
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-heading)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {booking.country || "Not specified"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Guests
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-heading)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {booking.guestCount}{" "}
                      {booking.guestCount === 1 ? "Guest" : "Guests"} •{" "}
                      {booking.isForeigner
                        ? "International Visitor"
                        : "Nigerian Resident"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 2: Reserved Excursions */}
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "14px",
                  }}
                >
                  Booked Tours ({booking.selectedPackages.length})
                </div>

                {booking.packageDetails && booking.packageDetails.length > 0 ? (
                  <div style={{ display: "grid", gap: "12px" }}>
                    {booking.packageDetails.map((pkg) => (
                      <div
                        key={pkg.id || pkg.slug}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                          padding: "16px 20px",
                          border: "1.5px solid var(--border-light)",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "#ffffff",
                          transition: "border-color 0.2s ease",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "220px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                color: "var(--text-heading)",
                                fontSize: "1rem",
                              }}
                            >
                              {pkg.name}
                            </span>
                            {pkg.highlightBadge && (
                              <span
                                className="badge-blue"
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "2px 8px",
                                }}
                              >
                                {pkg.highlightBadge}
                              </span>
                            )}
                          </div>
                          {pkg.tagline && (
                            <p
                              style={{
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                                margin: 0,
                              }}
                            >
                              {pkg.tagline}
                            </p>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            flexWrap: "wrap",
                          }}
                        >
                          {pkg.dates && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <Calendar
                                size={14}
                                style={{ color: "var(--blue-primary)" }}
                              />
                              <span>{pkg.dates}</span>
                            </div>
                          )}
                          {pkg.duration && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <Clock
                                size={14}
                                style={{ color: "var(--blue-primary)" }}
                              />
                              <span>{pkg.duration}</span>
                            </div>
                          )}
                          {pkg.location && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.82rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <MapPin
                                size={14}
                                style={{ color: "var(--blue-primary)" }}
                              />
                              <span>{pkg.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {booking.selectedPackages.map((slug, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "var(--bg-subtle)",
                          border: "1px solid var(--border-light)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.86rem",
                          fontWeight: 700,
                          color: "var(--text-heading)",
                        }}
                      >
                        {slug}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid 3: Payment Summary */}
              <div style={{ marginBottom: "28px" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    color: "var(--blue-deep)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "14px",
                  }}
                >
                  Payment Summary
                </div>

                <div
                  style={{
                    backgroundColor: "var(--bg-subtle)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>
                      Normal Initial Price:
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: hasDiscount ? "#94a3b8" : "var(--text-heading)",
                        textDecoration: hasDiscount ? "line-through" : "none",
                        textDecorationColor: hasDiscount
                          ? "#ef4444"
                          : undefined,
                      }}
                    >
                      {displaySubtotal}
                    </span>
                  </div>

                  {booking.groupDiscountNGN > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "0.9rem",
                        color: "#059669",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#d1fae5",
                            color: "#065f46",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {booking.groupDiscountPct || 2}% OFF
                        </span>
                        <span>
                          Group Discount ({booking.groupDiscountPct || 2}% for
                          4+ Guests):
                        </span>
                      </span>
                      <span style={{ fontWeight: 700 }}>
                        -{displayGroupDiscount}
                      </span>
                    </div>
                  )}

                  {booking.promoDiscountNGN > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "0.9rem",
                        color: "#059669",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "#d1fae5",
                            color: "#065f46",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {booking.promoDiscountPct || 5}% OFF
                        </span>
                        <span>Promo Voucher ({booking.promoCode}):</span>
                      </span>
                      <span style={{ fontWeight: 700 }}>
                        -{displayPromoDiscount}
                      </span>
                    </div>
                  )}

                  {hasDiscount && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "0.86rem",
                        color: "#059669",
                        fontWeight: 700,
                        backgroundColor: "#d1fae5",
                        padding: "6px 12px",
                        borderRadius: "6px",
                      }}
                    >
                      <span>Total Savings Applied:</span>
                      <span>-{displayTotalSavings}</span>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: "1.5px dashed var(--border-light)",
                      paddingTop: "12px",
                      marginTop: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "1rem",
                          color: "var(--text-heading)",
                        }}
                      >
                        {isPaid ? "Final Paid Price:" : "Final Payable Amount:"}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {hasDiscount && (
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "#94a3b8",
                            textDecoration: "line-through",
                            textDecorationColor: "#ef4444",
                            fontWeight: 700,
                          }}
                        >
                          {displaySubtotal}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "1.45rem",
                          fontWeight: 900,
                          color: hasDiscount ? "#059669" : "var(--blue-deep)",
                        }}
                      >
                        {displayFinalTotal}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: isPaid ? "#059669" : "#d97706",
                          fontWeight: 800,
                        }}
                      >
                        {booking.paymentStatus.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method & Transaction Reference */}
                  <div
                    style={{
                      marginTop: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--border-light)",
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--text-secondary)" }}>
                        Payment Method:{" "}
                      </span>
                      <strong
                        style={{
                          color: "var(--text-heading)",
                          textTransform: "capitalize",
                        }}
                      >
                        {booking.paymentMethod}
                        {booking.paymentMethod === "whatsapp" && (
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              color: "#15803d",
                              backgroundColor: "rgba(37, 211, 102, 0.12)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              textTransform: "none",
                            }}
                          >
                            Offline / Agent Assisted
                          </span>
                        )}
                      </strong>
                    </div>

                    {booking.paymentReference && (
                      <div>
                        <span style={{ color: "var(--text-secondary)" }}>
                          Transaction Ref:{" "}
                        </span>
                        <code
                          style={{ color: "var(--blue-deep)", fontWeight: 700 }}
                        >
                          {booking.paymentReference}
                        </code>
                      </div>
                    )}

                    {booking.paidAt && (
                      <div>
                        <span style={{ color: "var(--text-secondary)" }}>
                          Paid on:{" "}
                        </span>
                        <strong style={{ color: "var(--text-heading)" }}>
                          {new Date(booking.paidAt).toLocaleString("en-GB")}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Special Requests / Notes */}
              {booking.specialRequests && (
                <div style={{ marginBottom: "28px" }}>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 800,
                      color: "var(--blue-deep)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "8px",
                    }}
                  >
                    Special Requests
                  </div>
                  <div
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fef3c7",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 16px",
                      fontSize: "0.88rem",
                      color: "#92400e",
                      lineHeight: 1.5,
                    }}
                  >
                    {booking.specialRequests}
                  </div>
                </div>
              )}

              {/* Operations Guarantee / Security Assurance */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  backgroundColor: "rgba(1, 104, 167, 0.05)",
                  border: "1px solid rgba(1, 104, 167, 0.15)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px",
                  marginBottom: "28px",
                }}
              >
                <ShieldCheck
                  size={24}
                  style={{ color: "var(--blue-primary)", flexShrink: 0 }}
                />
                <div
                  style={{
                    fontSize: "0.84rem",
                    color: "var(--text-body)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "var(--text-heading)" }}>
                    What&apos;s Included with Every Tour:
                  </strong>{" "}
                  Executive air-conditioned buses, certified guides, armed MOPOL
                  police escort, and departures from Victoria Island and Lekki.
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="dossier-actions"
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                {/* Complete Payment Button if Pending with Active Countdown */}
                {isPending &&
                  countdown > 0 &&
                  booking.paymentMethod !== "whatsapp" && (
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={payLoading}
                      className="btn-primary"
                      style={{
                        padding: "12px 24px",
                        fontSize: "0.92rem",
                        textDecoration: "none",
                        opacity: payLoading ? 0.75 : 1,
                        cursor: payLoading ? "wait" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {payLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Connecting to Gateway...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={16} />
                          <span>Complete Online Payment Now</span>
                        </>
                      )}
                    </button>
                  )}

                {/* Make New Reservation if Cancelled or Expired */}
                {(booking.paymentStatus === "cancelled" ||
                  (isPending && countdown <= 0)) && (
                  <Link
                    href="/#packages"
                    className="btn-primary"
                    style={{
                      padding: "12px 24px",
                      fontSize: "0.92rem",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Make New Reservation</span>
                  </Link>
                )}

                <a
                  href={`https://wa.me/2348123456789?text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                  style={{
                    padding: "12px 24px",
                    fontSize: "0.92rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Phone size={16} />
                  <span>
                    {isPending && countdown > 0 && booking.paymentMethod === "whatsapp"
                      ? "Contact Agent to Complete Booking"
                      : "Chat on WhatsApp"}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn-secondary"
                  style={{
                    padding: "12px 20px",
                    fontSize: "0.92rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Printer size={16} />
                  <span>Print Booking Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    lastSearchedRef.current = null;
                    setBooking(null);
                    setQueryRef("");
                    setError(null);
                    if (typeof window !== "undefined") {
                      window.history.replaceState(
                        null,
                        "",
                        window.location.pathname,
                      );
                    }
                  }}
                  className="btn-secondary"
                  style={{
                    padding: "12px 20px",
                    fontSize: "0.92rem",
                    cursor: "pointer",
                  }}
                >
                  <span>Search Another Booking</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @media print {
          body {
            background-color: #ffffff !important;
          }
          .dossier-actions,
          form,
          nav,
          header,
          footer {
            display: none !important;
          }
          #printable-dossier {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function BookingLookupPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--blue-deep)", fontWeight: 800 }}>
            Loading Lookup System...
          </div>
        </div>
      }
    >
      <BookingLookupContent />
    </Suspense>
  );
}
