'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Clock, MapPin, CheckCircle, ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

export const ItineraryTimeline: React.FC<{ onBookNow: () => void }> = ({ onBookNow }) => {
  const [activeDay, setActiveDay] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollPillsRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const itineraryDays = [
    {
      day: 1,
      title: 'Arrival, Homecoming & Sunset Island Mixer',
      time: 'Evening (5:00 PM – 10:00 PM)',
      location: 'Victoria Island Waterfront',
      image: '/images/hero-lagos.jpg',
      summary:
        'Touch down in Lagos, check into your accommodation, and join fellow diaspora travelers and hosts for an exclusive sunset welcome cocktail mixer overlooking the Lagos Harbour.',
      highlights: [
        'VIP welcome drink and tour team briefing',
        'Meet your guides, security team, and fellow travelers',
        'Rooftop sunset views of the illuminated Lekki-Ikoyi bridge',
        'Light tapas, networking, and trip itinerary orientation',
      ],
    },
    {
      day: 2,
      title: 'Abeokuta Heritage Tour & Olumo Rock Ascend',
      time: 'Full Day (8:00 AM – 6:00 PM)',
      location: 'Abeokuta, Ogun State',
      image: '/images/olumo-rock.jpg',
      summary:
        'Journey on our executive 28-seat coaster escorted by MOPOL to ancient Abeokuta. Climb Olumo Rock, visit ancient sacred caves, ride the modern train, and shop for authentic handmade adire fabric.',
      highlights: [
        'Olumo Rock summit climb and elevator pass',
        'Historic Lagos-Ibadan rail line ride',
        'Yoruba Egba history tour by certified heritage docent',
        'Gourmet small chops, chilled soft drinks, and local delicacies',
      ],
    },
    {
      day: 3,
      title: 'Badagry Slave Route & Coastal Reflections',
      time: 'Full Day (7:30 AM – 5:30 PM)',
      location: 'Badagry Coastal District',
      image: '/images/badagry-heritage.jpg',
      summary:
        'An unforgettable, deeply moving cultural expedition along the historic coastal slave trade corridor. Visit Nigeria’s first story building and cross the tranquil lagoon to the Point of No Return.',
      highlights: [
        'Point of No Return sacred pilgrimage on Gberefu Island',
        'First Story Building in Nigeria (built in 1845)',
        'Seriki Williams Abass historical museum & relic displays',
        'Executive Hiace / Coaster with dedicated MOPOL escort',
      ],
    },
    {
      day: 4,
      title: 'Tarkwa Bay Luxury Beach Day & Boat Cruise',
      time: 'Day & Sunset (11:00 AM – 7:00 PM)',
      location: 'Tarkwa Bay Island',
      image: '/images/tarkwa-bay.jpg',
      summary:
        'Leave city traffic behind on a private boat cruise across Lagos Harbour. Unwind under shaded private cabanas with beach volleyball, water sports, warm Atlantic surf, and live DJ sets.',
      highlights: [
        'Return boat cruise departing from private upscale VI jetty',
        'Reserved private group beach cabanas on golden sand',
        'Beach barbecue, fresh grilled fish, suya, and chilled cocktails',
        'Sunset chillout session before returning to the mainland',
      ],
    },
    {
      day: 5,
      title: 'Kalakuta Afrobeat Shrine & Lagos Gourmet Feast',
      time: 'Afternoon & Evening (1:00 PM – 9:00 PM)',
      location: 'Ikeja & Top Lagos Restaurant',
      image: '/images/kalakuta-museum.jpg',
      summary:
        'Celebrate the legendary life of Afrobeat pioneer Fela Kuti at his preserved Kalakuta Republic home, followed by a curated Lagos culinary tour featuring smoky party jollof, suya, and amala.',
      highlights: [
        'Kalakuta Museum curated private tour and vinyl archive view',
        'Fela Kuti personal chambers and legendary musical legacy',
        'Reserved dining feast at an acclaimed Lagos dining hotspot',
        'Authentic tasting of smoky party jollof and tender suya',
      ],
    },
    {
      day: 6,
      title: 'Lekki Canopy Walkway & Restorative Spa Day',
      time: 'Morning & Afternoon (9:00 AM – 4:00 PM)',
      location: 'Lekki Peninsula',
      image: '/images/lekki-canopy.jpg',
      summary:
        'Walk Africa’s longest suspension canopy bridge high over coastal mangroves. In the afternoon, recharge your body before the big weekend parties with hydrotherapy, massages, and yoga.',
      highlights: [
        'Lekki Conservation Centre canopy walkway thrill',
        'Coastal nature trail walk with wild monkeys and tortoises',
        'Restorative luxury spa treatment and massage session',
        'Revitalizing oceanfront breathwork and mindfulness',
      ],
    },
    {
      day: 7,
      title: 'Detty December VIP Night & Concert Finale',
      time: 'Night (9:00 PM – Late)',
      location: 'Victoria Island Nightlife Hub',
      image: '/images/lagos-nightlife.jpg',
      summary:
        'The grand finale! Priority VIP entry and reserved club tables at December’s most anticipated concert and comedy show. Celebrate in the electric center of global African entertainment.',
      highlights: [
        'VIP queue-skip guestlist and reserved club/concert table',
        'Live Afrobeats star performances and top comedy acts',
        'Dedicated VIP transport and security escort back to lodging',
        'Farewell champagne toast with the Incel & Prospiz hosts',
      ],
    },
  ];

  // Pause auto-sliding when section is not in viewport to save resources and avoid off-screen churn
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-slide to next day every 5 seconds (5000ms) by default when in view and not paused
  useEffect(() => {
    if (isPaused || !isInView) return;

    const timer = setInterval(() => {
      setActiveDay((prev) => (prev >= 7 ? 1 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, isInView, activeDay]);

  // Keep active day pill centered inside the horizontal pills scroll container ONLY (never scrolls the page/window)
  useEffect(() => {
    const container = scrollPillsRef.current;
    const activeBtn = pillRefs.current[activeDay - 1];
    if (container && activeBtn) {
      const scrollOffset =
        activeBtn.offsetLeft - (container.clientWidth / 2) + (activeBtn.clientWidth / 2);
      container.scrollTo({ left: scrollOffset, behavior: 'smooth' });
    }
  }, [activeDay]);

  const handleNext = () => {
    setActiveDay((prev) => (prev >= 7 ? 1 : prev + 1));
  };

  const handlePrev = () => {
    setActiveDay((prev) => (prev <= 1 ? 7 : prev - 1));
  };

  const handleSelectDay = (day: number) => {
    setActiveDay(day);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      id="itinerary"
      className="section-spacing"
      style={{
        backgroundColor: '#ffffff',
        position: 'relative',
      }}
    >
      <div className="container">
        {/* Section Heading */}
        <ScrollReveal>
          <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 44px' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              color: 'var(--text-heading)',
            }}>
              7-Day Curated Itinerary
            </h2>
            <p style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              Experience the perfect balance of adventure, deep culture, beach relaxation, and legendary nightlife.
              Available as single day tickets or the all-inclusive 7-day pass.
            </p>
          </div>
        </ScrollReveal>

        {/* Carousel Day Navigation Bar */}
        <ScrollReveal delayMs={100}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '32px',
          }}>
            {/* Prev Day Pill Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Day"
              className="itinerary-nav-pill-btn"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-heading)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Scrollable Day Pills */}
            <div
              ref={scrollPillsRef}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                maxWidth: 'calc(100% - 96px)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '4px',
              }}
              className="no-scrollbar"
            >
              {itineraryDays.map((d, index) => {
                const isActive = activeDay === d.day;
                return (
                  <button
                    key={d.day}
                    ref={(el) => { pillRefs.current[index] = el; }}
                    onClick={() => handleSelectDay(d.day)}
                    style={{
                      background: isActive ? 'var(--blue-deep)' : 'var(--bg-subtle)',
                      color: isActive ? '#ffffff' : 'var(--text-body)',
                      border: isActive ? '1px solid var(--blue-deep)' : '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-full)',
                      padding: '10px 20px',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      whiteSpace: 'nowrap',
                      boxShadow: isActive ? '0 4px 14px rgba(13, 71, 161, 0.25)' : 'none',
                    }}
                  >
                    Day {d.day}
                  </button>
                );
              })}
            </div>

            {/* Next Day Pill Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Day"
              className="itinerary-nav-pill-btn"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-heading)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </ScrollReveal>

        {/* Carousel Viewport Container */}
        <ScrollReveal delayMs={150}>
          <div
            className="itinerary-carousel-viewport"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'relative',
              width: '100%',
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: '#ffffff',
            }}
          >
            {/* Floating Left Arrow */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Slide to previous day"
              className="carousel-floating-arrow carousel-arrow-left"
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 25,
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(1, 104, 167, 0.22)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
                color: 'var(--blue-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <ChevronLeft size={22} />
            </button>

            {/* Floating Right Arrow */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Slide to next day"
              className="carousel-floating-arrow carousel-arrow-right"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 25,
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(8px)',
                border: '1.5px solid rgba(1, 104, 167, 0.22)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
                color: 'var(--blue-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <ChevronRight size={22} />
            </button>

            {/* Horizontal Sliding Track */}
            <div
              style={{
                display: 'flex',
                width: '100%',
                transition: 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)',
                transform: `translateX(-${(activeDay - 1) * 100}%)`,
                willChange: 'transform',
              }}
            >
              {itineraryDays.map((d) => (
                <div
                  key={d.day}
                  style={{
                    minWidth: '100%',
                    width: '100%',
                    flexShrink: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                    alignItems: 'stretch',
                  }}
                  className="itinerary-slide-card"
                >
                  {/* Left: Day Photographic Visual */}
                  <div style={{ position: 'relative', minHeight: '340px' }} className="slide-image-container">
                    <Image
                      src={d.image}
                      alt={d.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 550px"
                      style={{ objectFit: 'cover' }}
                      priority={d.day <= 2}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(9, 30, 66, 0.05) 0%, rgba(9, 30, 66, 0.65) 100%)',
                    }} />

                    {/* Day Badge & Counter */}
                    <div style={{
                      position: 'absolute',
                      top: '18px',
                      left: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <span className="badge-blue" style={{
                        fontSize: '0.84rem',
                        padding: '7px 16px',
                        background: 'var(--blue-deep)',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      }}>
                        Day 0{d.day} of 07
                      </span>
                    </div>

                    {/* Mobile indicator on image */}
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      left: '18px',
                      right: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      color: '#ffffff',
                      textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                      fontWeight: 600,
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={15} style={{ color: '#38bdf8' }} />
                        {d.location}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={15} style={{ color: '#7dd3fc' }} />
                        {d.time.split('(')[0]}
                      </span>
                    </div>
                  </div>

                  {/* Right: Detailed Content Area */}
                  <div style={{
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      {/* Meta Tags */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '0.84rem',
                        color: 'var(--text-muted)',
                        marginBottom: '14px',
                        flexWrap: 'wrap',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <Clock size={15} style={{ color: 'var(--blue-primary)' }} />
                          {d.time}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <MapPin size={15} style={{ color: 'var(--blue-light)' }} />
                          {d.location}
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: '1.45rem',
                        lineHeight: 1.25,
                        marginBottom: '12px',
                        color: 'var(--text-heading)',
                      }}>
                        {d.title}
                      </h3>

                      <p style={{
                        fontSize: '0.92rem',
                        color: 'var(--text-body)',
                        lineHeight: 1.6,
                        marginBottom: '22px',
                      }}>
                        {d.summary}
                      </p>

                      <div style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--blue-deep)',
                        marginBottom: '12px',
                      }}>
                        Key Day Highlights:
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        marginBottom: '26px',
                      }}>
                        {d.highlights.map((h, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontSize: '0.86rem',
                            color: 'var(--text-heading)',
                            fontWeight: 500,
                          }}>
                            <CheckCircle size={16} style={{ color: 'var(--green-emerald)', flexShrink: 0, marginTop: '2px' }} />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom CTA Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '18px',
                      borderTop: '1px solid var(--border-light)',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        Transport, security & catering included
                      </span>
                      <button
                        onClick={onBookNow}
                        className="btn-primary"
                        style={{ padding: '11px 22px', fontSize: '0.88rem' }}
                      >
                        <span>Book This Day</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Progress & Auto-Slide Status Ribbon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              backgroundColor: 'var(--bg-subtle)',
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                  title={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
                >
                  {isPaused ? <Play size={13} style={{ color: 'var(--blue-primary)' }} /> : <Pause size={13} />}
                  <span>{isPaused ? 'Auto-slide paused' : 'Auto-slides every 5s'}</span>
                </button>
              </div>

              {/* Progress Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {itineraryDays.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => handleSelectDay(d.day)}
                    aria-label={`Jump to Day ${d.day}`}
                    style={{
                      width: activeDay === d.day ? '22px' : '7px',
                      height: '7px',
                      borderRadius: '4px',
                      backgroundColor: activeDay === d.day ? 'var(--blue-deep)' : '#cbd5e1',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      <style jsx>{`
        .carousel-floating-arrow:hover {
          background-color: #ffffff !important;
          color: var(--blue-primary) !important;
          border-color: var(--blue-primary) !important;
          transform: translateY(-50%) scale(1.08) !important;
          box-shadow: 0 6px 20px rgba(1, 104, 167, 0.25) !important;
        }

        .itinerary-nav-pill-btn:hover {
          background-color: var(--blue-surface) !important;
          color: var(--blue-deep) !important;
          border-color: var(--blue-primary) !important;
          transform: scale(1.06);
        }

        @media (max-width: 768px) {
          .carousel-floating-arrow {
            top: 170px !important;
            width: 38px !important;
            height: 38px !important;
          }
          .carousel-arrow-left {
            left: 10px !important;
          }
          .carousel-arrow-right {
            right: 10px !important;
          }
        }
      `}</style>
    </section>
  );
};
