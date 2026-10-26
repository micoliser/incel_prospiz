'use client';

import React, { useState } from 'react';
import { Mail, Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

interface LeadCaptureProps {
  earlyBirdCode?: string;
}

export const LeadCapture: React.FC<LeadCaptureProps> = ({ earlyBirdCode = 'EARLYBIRD17' }) => {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; whatsapp?: boolean }>({});

  const validate = (emailVal: string, phoneVal: string) => {
    const errs: { email?: string; whatsapp?: string } = {};
    const trimmedEmail = emailVal.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required to join the first-access list';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g. name@domain.com)';
    }

    const trimmedPhone = phoneVal.trim();
    if (trimmedPhone) {
      const digits = trimmedPhone.replace(/\D/g, '');
      if (!/^\+?[0-9\s\-().]{7,20}$/.test(trimmedPhone) || digits.length < 7 || digits.length > 15) {
        errs.whatsapp = 'Please enter a valid phone number (e.g. +234... or +44...)';
      }
    }

    return errs;
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (touched.email) {
      const errs = validate(val, whatsapp);
      setErrors((prev) => ({ ...prev, email: errs.email }));
    }
  };

  const handleWhatsappChange = (val: string) => {
    setWhatsapp(val);
    if (touched.whatsapp) {
      const errs = validate(email, val);
      setErrors((prev) => ({ ...prev, whatsapp: errs.whatsapp }));
    }
  };

  const handleBlur = (field: 'email' | 'whatsapp') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(email, whatsapp);
    setErrors(errs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, whatsapp: true });
    const errs = validate(email, whatsapp);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      setSubmitted(true);
    }
  };

  return (
    <section className="section-spacing" style={{
      backgroundColor: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '650px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(1, 104, 167, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <ScrollReveal>
          <div style={{
            maxWidth: '760px',
            margin: '0 auto',
            textAlign: 'center',
            backgroundColor: 'var(--bg-subtle)',
            border: '1.5px solid rgba(1, 104, 167, 0.2)',
            borderRadius: 'var(--radius-xl)',
            padding: '44px 28px',
            boxShadow: 'var(--shadow-lg)',
          }} className="lead-capture-card">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}>
              <span className="badge-blue">
                <Sparkles size={13} />
                First-Access Waitlist
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.4rem)',
              marginBottom: '14px',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}>
              Coming Home This December?
            </h2>

            <p style={{
              fontSize: '1.02rem',
              color: 'var(--text-body)',
              lineHeight: 1.6,
              marginBottom: '28px',
              maxWidth: '580px',
              margin: '0 auto 28px',
            }}>
              Not ready to book your package just yet? Join the private first-access list to lock in your
              <strong style={{ color: 'var(--blue-deep)' }}> 2% early-bird discount</strong> before November 15.
            </p>

            {submitted ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: 'var(--green-soft)',
                border: '1px solid #10b981',
                borderRadius: 'var(--radius-md)',
                padding: '16px 24px',
                color: '#064e23',
                fontSize: '0.96rem',
                fontWeight: 700,
              }}>
                <CheckCircle2 size={22} style={{ color: '#059669' }} />
                <span>You’re on the list! Check your inbox for your 2% discount code: <strong>{earlyBirdCode}</strong></span>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                maxWidth: '520px',
                margin: '0 auto',
                textAlign: 'left',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
                  <div>
                    <input
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => handleBlur('email')}
                      placeholder="Enter your email address *"
                      className={`input-custom ${touched.email && errors.email ? 'has-error' : ''}`}
                      aria-invalid={Boolean(touched.email && errors.email)}
                    />
                    {touched.email && errors.email && (
                      <div className="field-error-msg" role="alert">
                        <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      inputMode="tel"
                      value={whatsapp}
                      onChange={(e) => handleWhatsappChange(e.target.value)}
                      onBlur={() => handleBlur('whatsapp')}
                      placeholder="WhatsApp number (optional)"
                      className={`input-custom ${touched.whatsapp && errors.whatsapp ? 'has-error' : ''}`}
                      aria-invalid={Boolean(touched.whatsapp && errors.whatsapp)}
                    />
                    {touched.whatsapp && errors.whatsapp && (
                      <div className="field-error-msg" role="alert">
                        <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                        <span>{errors.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '15px 28px', fontSize: '1rem', width: '100%' }}
                >
                  <span>Claim 2% Off & First Access</span>
                  <ArrowRight size={18} />
                </button>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  🔒 Zero spam. We only send verified itinerary drops and priority seat alerts.
                </div>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .lead-capture-card {
            padding: 32px 18px !important;
          }
        }
      `}</style>
    </section>
  );
};
