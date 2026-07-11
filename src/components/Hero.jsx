import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WeeklyBusyGraph from './WeeklyBusyGraph';

const slideshowImages = [
    '/hero_slideshow/court1.jpg',
    '/hero_slideshow/court2.jpg',
    '/hero_slideshow/court3.jpg',
    '/hero_slideshow/court4.jpg'
];

const Hero = () => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="home" style={{
            minHeight: '100vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            marginTop: 'var(--hero-margin-top, -115px)',
            paddingTop: '100px',
            paddingBottom: '80px',
            boxSizing: 'border-box'
        }}>
            {/* Background Slideshow */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                overflow: 'hidden'
            }}>
                <AnimatePresence initial={false}>
                    <motion.div
                        key={currentImageIndex}
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1.02 }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                            opacity: { duration: 1.5, ease: 'easeInOut' },
                            scale: { duration: 6, ease: 'linear' }
                        }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${slideshowImages[currentImageIndex]})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                </AnimatePresence>
            </div>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.85))',
                zIndex: 0
            }} />

            <div className="container hero-grid" style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 clamp(1rem, 5vw, 2rem)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-gradient" style={{
                        fontSize: 'clamp(0.8rem, 3vw, 1.2rem)',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '1rem',
                        display: 'inline-block' 
                    }}>
                        Welcome to C & S Badminton Complex (PVT) Ltd, Galle
                    </h2>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 10vw, 5rem)',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1,
                        color: 'white'
                    }}>
                        ELEVATE YOUR <br />
                        <span style={{
                            color: 'transparent',
                            WebkitTextStroke: 'clamp(1px, 0.5vw, 2px) white',
                            fontStyle: 'italic'
                        }}>GAME</span>
                    </h1>
                    <p style={{
                        maxWidth: '600px',
                        fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
                        color: 'var(--text-gray)',
                        marginBottom: '2rem'
                    }}>
                        Experience Galle's premium 24/7 indoor badminton facility.
                        Professional courts, expert services, and a community of champions.
                    </p>

                    <motion.button
                        onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-hero-cta"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'inline-block',
                            padding: '0.8rem 2rem',
                            borderRadius: '50px',
                            fontSize: '1rem',
                            textDecoration: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Book A Court
                    </motion.button>
                </motion.div>

                {/* Shipped Real-time Weekly Busy Graph Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="hero-graph-wrapper"
                >
                    <WeeklyBusyGraph />
                </motion.div>
            </div>

            <style>{`
                :root {
                    --hero-margin-top: -115px;
                }
                @media (max-width: 768px) {
                    :root {
                        --hero-margin-top: -120px;
                    }
                }
                .hero-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                    align-items: center;
                    padding-top: 110px;
                    padding-bottom: 60px;
                }
                .hero-graph-wrapper {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }
                @media (min-width: 992px) {
                    .hero-grid {
                        grid-template-columns: 1.1fr 0.9fr;
                        gap: 3rem;
                        padding-top: 120px;
                        padding-bottom: 80px;
                    }
                    .hero-graph-wrapper {
                        justify-content: flex-end;
                    }
                }
            `}</style>

            {/* Scroll indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{
                    position: 'absolute',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'var(--text-gray)'
                }}
            >
                ↓ Scroll Down
            </motion.div>

            {/* Slideshow Indicator Dots */}
            <div style={{
                position: 'absolute',
                bottom: '2.5rem',
                right: '4%',
                display: 'flex',
                gap: '8px',
                zIndex: 2
            }}>
                {slideshowImages.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: 'none',
                            background: currentImageIndex === index ? 'var(--brand-teal)' : 'rgba(255, 255, 255, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            padding: 0
                        }}
                        title={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default Hero;
