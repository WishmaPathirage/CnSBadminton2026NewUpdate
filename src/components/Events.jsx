import { motion } from 'framer-motion';

const Events = () => {
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
                        <button style={{
                            padding: '1rem 2rem',
                            border: '2px solid var(--primary-green)',
                            backgroundColor: 'transparent',
                            color: 'var(--primary-green)',
                            fontSize: '1rem',
                            fontWeight: '700',
                            borderRadius: '50px'
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
        </section>
    );
};

export default Events;
