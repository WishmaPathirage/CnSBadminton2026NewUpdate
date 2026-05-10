import { motion } from 'framer-motion';
import heroBg from '../assets/hero-bg.png';

const Hero = () => {
    return (
        <section id="home" style={{
            height: '100vh',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            marginTop: 'var(--hero-margin-top, -115px)' 
        }}>
            {/* Background with overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: -1
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
                zIndex: 0
            }} />

            <div className="container hero-content-wrapper" style={{ 
                position: 'relative', 
                zIndex: 1, 
                width: '100%', 
                padding: '0 clamp(1rem, 5vw, 2rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap-reverse',
                gap: '3rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ flex: '1 1 500px', zIndex: 2 }}
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

                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.3, type: "spring" }}
                    style={{ 
                        flex: '1 1 400px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    <div style={{
                        width: '100%',
                        maxWidth: '600px',
                        aspectRatio: '16/9',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(120, 220, 202, 0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: '#000'
                    }}>
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://www.youtube.com/embed/xrMo4zoScCg?autoplay=1&mute=1&loop=1&playlist=xrMo4zoScCg&controls=0&modestbranding=1&showinfo=0&rel=0"
                            title="Badminton Smash Slow Motion"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ 
                                pointerEvents: 'none',
                                transform: 'scale(1.05)' // Slightly scale up to hide iframe borders/title sometimes shown
                            }}
                        ></iframe>
                    </div>
                </motion.div>
            </div>

            <style>{`
                :root {
                    --hero-margin-top: -115px;
                }
                @media (max-width: 768px) {
                    :root {
                        --hero-margin-top: -80px;
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
        </section>
    );
};

export default Hero;
