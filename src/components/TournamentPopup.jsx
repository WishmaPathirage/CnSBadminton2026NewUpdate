import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mapImg from '../assets/alternative_route_map.jpg';

const TournamentPopup = () => {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        // Show for users who haven't seen this updated road map notice
        const hasSeenPopup = localStorage.getItem('road_maintenance_map_popup_seen');
        if (!hasSeenPopup) {
            setShowPopup(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem('road_maintenance_map_popup_seen', 'true');
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
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 50 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#222222',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '650px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
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
                                top: '15px',
                                right: '15px',
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                color: 'white',
                                fontSize: '1.3rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                zIndex: 2
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            ×
                        </button>

                        <motion.h2
                            style={{
                                fontSize: '2rem',
                                marginBottom: '1.2rem',
                                color: '#FFA500',
                                fontWeight: '800',
                                lineHeight: '1.2'
                            }}
                        >
                            ⚠️ Temporary Access Road Closure Notice
                        </motion.h2>

                        <p style={{ fontSize: '1.1rem', color: '#FFFFFF', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                            Dear players, our <strong>normal access road to our complex is temporarily closed</strong> due to road maintenance. Please be aware and <strong>use alternative access roads</strong> to reach the complex.
                        </p>

                        {/* Alternative Route Map */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{
                                position: 'relative',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 165, 0, 0.3)',
                                background: '#111'
                            }}>
                                <img
                                    src={mapImg}
                                    alt="Alternative Access Routes Map"
                                    style={{
                                        width: '100%',
                                        maxHeight: '320px',
                                        objectFit: 'contain',
                                        display: 'block',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(mapImg, '_blank')}
                                />
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#A0A0A0', fontStyle: 'italic', display: 'block', marginTop: '0.4rem' }}>
                                💡 Click on the map image to view in full resolution
                            </span>
                        </div>

                        {/* Contact & Signature Box */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '1.2rem 1.5rem',
                            marginBottom: '1.5rem',
                            textAlign: 'left'
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#FFFFFF', fontSize: '1rem' }}>
                                Best Regards,
                            </p>
                            <p style={{ margin: '0.2rem 0 0.8rem 0', fontWeight: 'bold', color: '#70D6C1', fontSize: '1.05rem' }}>
                                C & S Badminton Complex (PVT) Ltd
                            </p>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '0.5rem',
                                fontSize: '0.9rem',
                                color: '#D0D0D0'
                            }}>
                                <div>📞 <strong>Phone:</strong> <a href="tel:+94777983264" style={{ color: '#70D6C1', textDecoration: 'none' }}>+94 777 98 32 64</a></div>
                                <div>✉️ <strong>Email:</strong> <a href="mailto:cnsb233@gmail.com" style={{ color: '#70D6C1', textDecoration: 'none' }}>cnsb233@gmail.com</a></div>
                                <div>🌐 <strong>Website:</strong> <a href="https://www.cnsbadminton.lk" target="_blank" rel="noopener noreferrer" style={{ color: '#70D6C1', textDecoration: 'none' }}>www.cnsbadminton.lk</a></div>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            style={{
                                background: '#70D6C1',
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
