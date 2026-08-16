import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TournamentPopup = () => {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Only show if haven't seen this notice yet
        const hasSeenPopup = localStorage.getItem('road_maintenance_popup_seen');
        if (!hasSeenPopup) {
            setShowPopup(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('road_maintenance_popup_seen', 'true');
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
                            background: '#222222', // Darker background
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '3rem',
                            maxWidth: '550px',
                            width: '90%',
                            textAlign: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
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
                            style={{
                                fontSize: '2.2rem',
                                marginBottom: '1.5rem',
                                color: '#FFA500', // Orange text
                                fontWeight: '800',
                                lineHeight: '1.2'
                            }}
                        >
                            Important Notice
                        </motion.h2>

                        <p style={{ fontSize: '1.15rem', color: '#FFFFFF', lineHeight: '1.6', marginBottom: '2rem' }}>
                            Dear players, our <strong>normal access road to our complex is temporarily closed</strong> due to maintenance.
                        </p>

                        <div style={{
                            background: '#332D24', // Brown-ish background
                            border: '1px solid #5A4A30',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            textAlign: 'left'
                        }}>
                            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 'bold' }}>
                                <span style={{ color: '#FFD700', fontSize: '1.4rem' }}>⚠️</span> Temporary Access Road Closure
                            </h3>
                            <p style={{ color: '#E0E0E0', fontSize: '1rem', lineHeight: '1.6', margin: 0, marginBottom: '1rem' }}>
                                Please be aware of the road maintenance and ensure you <strong>use alternative access roads</strong> to reach the badminton complex.
                            </p>
                            <p style={{ color: '#A0A0A0', fontSize: '0.95rem', fontStyle: 'italic', marginBottom: 0, lineHeight: '1.5' }}>
                                We appreciate your understanding and cooperation!
                            </p>
                        </div>

                        <button
                            onClick={handleClose}
                            style={{
                                background: '#70D6C1', // Mint green button
                                color: '#000000',
                                padding: '0.8rem 3rem',
                                borderRadius: '50px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 0 20px rgba(112, 214, 193, 0.4)'
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
