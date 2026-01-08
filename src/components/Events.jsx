import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Events = () => {
    const [showPopup, setShowPopup] = useState(false);

    return (
        <section id="events" style={{ overflow: 'hidden', padding: '100px 0', background: 'linear-gradient(45deg, #000, #1a1a1a)' }}>
            <div className="container">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ flex: '1 1 400px', marginBottom: '2rem' }}
                    >
                        <h4 style={{ color: 'var(--accent-neon)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>Upcoming Event</h4>
                        <h2 style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: '1.5rem', color: 'white' }}>
                            C & S Badminton Complex (PVT) Ltd <br />
                            <span style={{ color: 'var(--primary-green)' }}>SMASH FIESTA</span> <br />
                            SEASON 2
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem', maxWidth: '500px' }}>
                            Join the biggest badminton tournament in Galle! Categories for Men's Doubles, Women's Doubles, and Mixed Doubles.
                        </p>
                        <button
                            onClick={() => setShowPopup(true)}
                            style={{
                                padding: '1rem 2rem',
                                border: '2px solid var(--primary-green)',
                                backgroundColor: 'transparent',
                                color: 'var(--primary-green)',
                                fontSize: '1rem',
                                fontWeight: '700',
                                borderRadius: '50px',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}>
                            Register Now
                        </button>
                    </motion.div>

                    {/* Abstract Graphic or Shuttlecock */}
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{
                            flex: '1 1 400px',
                            height: '400px',
                            background: 'radial-gradient(circle, rgba(46,204,113,0.3) 0%, rgba(0,0,0,0) 70%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        {/* Simple decorative shuttlecock shape or text */}
                        <div style={{
                            fontSize: '10rem',
                            fontWeight: '900',
                            color: 'rgba(255,255,255,0.05)',
                            transform: 'rotate(-45deg)'
                        }}>
                            2026
                        </div>
                    </motion.div>
                </div>
            </div>

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
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(5px)'
                        }}
                        onClick={() => setShowPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass-panel"
                            style={{
                                padding: '3rem',
                                borderRadius: '24px',
                                textAlign: 'center',
                                maxWidth: '400px',
                                position: 'relative',
                                border: '1px solid rgba(120, 220, 202, 0.3)'
                            }}
                        >
                            <button
                                onClick={() => setShowPopup(false)}
                                style={{
                                    position: 'absolute',
                                    top: '15px',
                                    right: '15px',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-gray)',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Coming Soon!</h3>
                            <p style={{ color: 'var(--text-gray)', lineHeight: '1.6', marginBottom: '2rem' }}>
                                Registration for <strong>SMASH FIESTA Season 2</strong> will open shortly. Stay tuned to our social media for updates!
                            </p>

                            <button
                                onClick={() => setShowPopup(false)}
                                className="btn-gradient"
                                style={{
                                    padding: '0.8rem 2rem',
                                    borderRadius: '50px',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}
                            >
                                Got it!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default Events;
