import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, Calendar, X, CheckCircle } from 'lucide-react';

const TournamentPopup = () => {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Expiry check: Expires after today (October 10, 2026) at 12:00 Midnight (SL Time UTC+5:30)
        const expiryTimestamp = new Date('2026-10-10T23:59:59+05:30').getTime();

        // Calculate current date in Sri Lanka Time (UTC+5:30)
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const slTime = new Date(utc + (3600000 * 5.5));
        const year = slTime.getFullYear();
        const month = String(slTime.getMonth() + 1).padStart(2, '0');
        const day = String(slTime.getDate()).padStart(2, '0');
        const slDateStr = `${year}-${month}-${day}`;

        // Stop showing popup if past today (Oct 11 onwards) or past midnight expiry
        if (Date.now() > expiryTimestamp || slDateStr > '2026-10-10') {
            setShowPopup(false);
            return;
        }

        // Check if user has already dismissed this specific tournament notice
        const hasSeenPopup = localStorage.getItem('tournament_popup_2026_10_10_seen');
        if (!hasSeenPopup) {
            setShowPopup(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('tournament_popup_2026_10_10_seen', 'true');
        setShowPopup(false);
    };

    const handleBookNow = () => {
        handleClose();
        const bookingEl = document.getElementById('booking');
        if (bookingEl) {
            bookingEl.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <AnimatePresence>
            {showPopup && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.88)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                        padding: '1rem'
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(145deg, #181c19 0%, #0d1210 100%)',
                            border: '1px solid rgba(255, 184, 0, 0.35)',
                            borderRadius: '20px',
                            padding: '2.5rem 2rem',
                            maxWidth: '560px',
                            width: '100%',
                            maxHeight: '92vh',
                            overflowY: 'auto',
                            textAlign: 'center',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 184, 0, 0.15)',
                            position: 'relative'
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            aria-label="Close Notice"
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                zIndex: 2
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <X size={18} />
                        </button>

                        {/* Tournament Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'linear-gradient(90deg, rgba(255, 184, 0, 0.18), rgba(255, 140, 0, 0.28))',
                            border: '1px solid rgba(255, 184, 0, 0.5)',
                            padding: '6px 16px',
                            borderRadius: '50px',
                            color: '#FFB800',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            letterSpacing: '1.2px',
                            textTransform: 'uppercase',
                            marginBottom: '1.2rem'
                        }}>
                            <Trophy size={16} color="#FFB800" />
                            Tournament Notice
                        </div>

                        {/* Title */}
                        <h2 style={{
                            fontSize: '2rem',
                            fontWeight: '800',
                            color: '#ffffff',
                            lineHeight: '1.25',
                            marginBottom: '0.75rem'
                        }}>
                            Badminton Tournament <span style={{ color: '#FFB800' }}>Today</span>
                        </h2>

                        <p style={{
                            fontSize: '1.05rem',
                            color: 'rgba(255, 255, 255, 0.85)',
                            lineHeight: '1.6',
                            marginBottom: '1.6rem'
                        }}>
                            We are hosting a tournament at <strong>C &amp; S Badminton Complex</strong> today. Please note our court schedule adjustments below:
                        </p>

                        {/* Detailed Notice Card */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.45)',
                            border: '1px solid rgba(255, 184, 0, 0.25)',
                            borderRadius: '14px',
                            padding: '1.4rem',
                            marginBottom: '1.8rem',
                            textAlign: 'left'
                        }}>
                            {/* Date */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 184, 0, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Calendar size={20} color="#FFB800" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>Today • Saturday, October 10, 2026</div>
                                </div>
                            </div>

                            {/* Blocked Times */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Clock size={20} color="#F87171" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tournament Slots (Disabled)</div>
                                    <div style={{ fontSize: '1rem', fontWeight: '700', color: '#F87171' }}>5:00 PM – 12:00 Midnight</div>
                                </div>
                            </div>

                            {/* Booking Notice */}
                            <div style={{
                                background: 'rgba(255, 184, 0, 0.08)',
                                borderLeft: '3px solid #FFB800',
                                padding: '10px 14px',
                                borderRadius: '0 8px 8px 0',
                                marginBottom: '0.8rem'
                            }}>
                                <div style={{ fontSize: '0.9rem', color: '#fef3c7', lineHeight: '1.5' }}>
                                    ⚠️ <strong>Public booking is closed between 5:00 PM &amp; 12:00 Midnight</strong> for tournament matches.
                                </div>
                            </div>

                            {/* Available slots */}
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                borderLeft: '3px solid #10B981',
                                padding: '10px 14px',
                                borderRadius: '0 8px 8px 0'
                            }}>
                                <div style={{ fontSize: '0.9rem', color: '#d1fae5', lineHeight: '1.5' }}>
                                    ✅ <strong>Court bookings before 5:00 PM are available</strong> for public play as normal.
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleBookNow}
                                style={{
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    padding: '0.85rem 1.8rem',
                                    borderRadius: '50px',
                                    fontSize: '0.95rem',
                                    fontWeight: '700',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                                    transition: 'all 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <CheckCircle size={16} />
                                Book Before 5:00 PM
                            </button>

                            <button
                                onClick={handleClose}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: '#ffffff',
                                    padding: '0.85rem 1.8rem',
                                    borderRadius: '50px',
                                    fontSize: '0.95rem',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                Understood
                            </button>
                        </div>

                        {/* Auto-expire footer note */}
                        <div style={{ marginTop: '1.2rem', fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic' }}>
                            Notice automatically expires tonight at 12:00 Midnight
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TournamentPopup;
