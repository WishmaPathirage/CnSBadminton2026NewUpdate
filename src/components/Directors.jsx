import { motion } from 'framer-motion';
import manoharaImg from '../assets/directors/manohara.png';
import jayaruwanImg from '../assets/directors/jayaruwan.png';

const Directors = () => {
    return (
        <section className="section-padding" style={{ position: 'relative' }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 8vw, 4rem)' }}
                >
                    <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '1rem', color: 'white' }}>
                        Message from the <span className="text-gradient">Directors</span>
                    </h2>
                    <p style={{ color: 'var(--text-gray)', maxWidth: '600px', margin: '0 auto', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>
                        Driving excellence in badminton through visionary leadership and passion.
                    </p>
                </motion.div>

                <div 
                    className="directors-grid"
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--dir-grid-min, 320px), 1fr))', 
                        gap: 'var(--dir-grid-gap, 3rem)' 
                    }}
                >

                    {/* Director 1 */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ y: -10 }}
                        className="glass-panel"
                        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, borderColor: '#2ecc71', boxShadow: '0 0 30px rgba(46, 204, 113, 0.6)' }}
                            transition={{ type: "spring", stiffness: 300 }}
                            style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                marginBottom: '1.5rem',
                                overflow: 'hidden',
                                border: '3px solid var(--primary-green)',
                                boxShadow: '0 0 20px rgba(46, 204, 113, 0.2)',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={manoharaImg} alt="M K A Manohara" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </motion.div>
                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>M K A Manohara</h3>
                        <span style={{ color: 'var(--primary-green)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Director</span>
                        <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontStyle: 'italic' }}>
                            "Our mission is to provide a world-class facility that nurtures talent and promotes a healthy lifestyle through badminton. We are committed to excellence in every aspect of your experience here."
                        </p>
                    </motion.div>

                    {/* Director 2 */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        whileHover={{ y: -10 }}
                        className="glass-panel"
                        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                    >
                        <motion.div
                            whileHover={{ scale: 1.1, borderColor: '#2ecc71', boxShadow: '0 0 30px rgba(46, 204, 113, 0.6)' }}
                            transition={{ type: "spring", stiffness: 300 }}
                            style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                marginBottom: '1.5rem',
                                overflow: 'hidden',
                                border: '3px solid var(--primary-green)',
                                boxShadow: '0 0 20px rgba(46, 204, 113, 0.2)',
                                cursor: 'pointer'
                            }}
                        >
                            <img src={jayaruwanImg} alt="D P I Jayaruwan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </motion.div>
                        <h3 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>D P I Jayaruwan</h3>
                        <span style={{ color: 'var(--primary-green)', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Director</span>
                        <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontStyle: 'italic' }}>
                            "Sports builds character. At C & S, we strive to create a community where players of all levels can come together, compete, and grow in a supportive and professional environment."
                        </p>
                    </motion.div>

                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    :root {
                        --dir-grid-min: 280px;
                        --dir-grid-gap: 1.5rem;
                    }
                    .directors-grid {
                        gap: 1.5rem !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default Directors;
