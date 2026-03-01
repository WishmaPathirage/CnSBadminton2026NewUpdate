import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TournamentPopup = () => {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Only show if haven't seen it yet
        const hasSeenPopup = localStorage.getItem('tournament_popup_2026_seen');
        if (!hasSeenPopup) {
            setShowPopup(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('tournament_popup_2026_seen', 'true');
        setShowPopup(false);
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
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 10000, // Higher than other popups
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                    }}
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 50 }}
                        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
                        style={{
                            background: 'linear-gradient(145deg, rgba(20,20,20,0.9), rgba(40,40,40,0.95))',
                            border: '1px solid rgba(255,165,0,0.3)',
                            borderRadius: '24px',
                            padding: '3rem',
                            maxWidth: '550px',
                            width: '90%',
                            textAlign: 'center',
                            boxShadow: '0 0 50px rgba(255, 165, 0, 0.2)',
                            position: 'relative'
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '1.5rem',
                                cursor: 'pointer',
                                opacity: 0.7,
                                transition: 'opacity 0.2s',
                                zIndex: 2
                            }}
                            onMouseOver={(e) => e.target.style.opacity = 1}
                            onMouseOut={(e) => e.target.style.opacity = 0.7}
                        >
                            ×
                        </button>

                        <motion.h2
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            style={{
                                fontSize: '2rem',
                                marginBottom: '1.5rem',
                                color: '#ffa500', // Orange for visual distinction
                                fontWeight: '800',
                                lineHeight: '1.2'
                            }}
                        >
                            Upcoming Event Notice
                        </motion.h2>

                        <p style={{ fontSize: '1.1rem', color: '#eee', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            We are excited to host the <strong>SPBA All Island Open Badminton Championships 2026</strong>!
                        </p>

                        <div style={{
                            background: 'rgba(255, 165, 0, 0.1)',
                            border: '1px solid rgba(255, 165, 0, 0.2)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            textAlign: 'left'
                        }}>
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#ffa500' }}>⚠️</span> Important Booking Info
                            </h3>
                            <ul style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.8', margin: 0, paddingLeft: '1.5rem' }}>
                                <li><strong>Dates:</strong> March 1, 2, and 3, 2026</li>
                                <li><strong>Affected Time:</strong> 8:00 AM to 8:00 PM</li>
                            </ul>
                            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '1rem', fontStyle: 'italic', marginBottom: 0 }}>
                                Courts will be unavailable for public booking during these hours. Bookings outside these hours remain open!
                            </p>
                        </div>

                        <button
                            onClick={handleClose}
                            className="btn-gradient"
                            style={{
                                padding: '0.8rem 2.5rem',
                                borderRadius: '50px',
                                fontSize: '1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Understood
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TournamentPopup;
