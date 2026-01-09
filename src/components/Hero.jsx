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
            marginTop: '-80px' // Pull up behind navbar
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

            <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-gradient" style={{
                        fontSize: '1.2rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '1rem',
                        display: 'inline-block' // needed for gradient text sometimes
                    }}>
                        Welcome to C & S Badminton Complex (PVT) Ltd, Galle
                    </h2>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 5vw, 5rem)',
                        marginBottom: '1.5rem',
                        lineHeight: 1.1,
                        color: 'white'
                    }}>
                        ELEVATE YOUR <br />
                        <span style={{
                            color: 'transparent',
                            WebkitTextStroke: '2px white',
                            fontStyle: 'italic'
                        }}>GAME</span>
                    </h1>
                    <p style={{
                        maxWidth: '600px',
                        fontSize: '1.1rem',
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
            </div>

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
