import { motion } from 'framer-motion';

const Memberships = () => {
    const plans = [
        { title: 'Silver', price: 'Rs. 5,000/mo', features: ['4 Hours/Month', 'Off-peak Access', 'Equipment Rental'], color: '#bdc3c7' },
        { title: 'Gold', price: 'Rs. 9,000/mo', features: ['8 Hours/Month', 'Anytime Access', 'Free Locker'], color: '#f1c40f' },
        { title: 'Platinum', price: 'Rs. 15,000/mo', features: ['Unlimited Access', 'Free Coaching Session', 'Priority Booking'], color: '#e5e4e2' }, // Platinum color logic
    ];

    return (
        <section id="memberships" className="section-padding">
            <div className="container">
                <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '3rem', color: 'white' }}>Memberships</h2>

                <div style={{ position: 'relative' }}>
                    {/* Blur Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        padding: '1rem', // Added padding to prevent edge touching
                    }}>
                        <motion.h3
                            initial={{ scale: 0.8, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            style={{
                                fontSize: 'clamp(2rem, 8vw, 3.5rem)', // Responsive font size
                                fontWeight: '800',
                                background: 'linear-gradient(to right, #78dcca, #e94e8f)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '2px',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                transform: 'rotate(-5deg)',
                                textShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                lineHeight: '1.2', // Improved line height for wrapping
                                maxWidth: '100%' // Ensure it doesn't overflow container
                            }}
                        >
                            Coming Soon !
                        </motion.h3>
                        <p style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: 'clamp(1rem, 4vw, 1.2rem)', // Responsive font size
                            marginTop: '1rem',
                            fontWeight: '500',
                            textAlign: 'center',
                            maxWidth: '90%'
                        }}>
                            We are working on something exciting.
                        </p>
                    </div>

                    {/* Plans Grid (Blurred) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        filter: 'blur(4px)', // Additional CSS blur for browsers that struggle with backdrop-filter or for artistic effect
                        pointerEvents: 'none', // Disable interaction
                        opacity: 0.8
                    }}>
                        {plans.map((plan, index) => (
                            <motion.div
                                key={plan.title}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2, duration: 0.5 }}
                                viewport={{ once: true }}
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    padding: '2rem',
                                    borderRadius: '16px',
                                    borderTop: `4px solid ${plan.color}`,
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                                }}
                            >
                                <h3 style={{ fontSize: '1.8rem', color: plan.color, marginBottom: '0.5rem' }}>{plan.title}</h3>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem', color: 'white' }}>{plan.price}</div>
                                <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                                    {plan.features.map((feature) => (
                                        <li key={feature} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255, 255, 255, 0.8)' }}>
                                            • {feature}
                                        </li>
                                    ))}
                                </ul>
                                <button style={{
                                    width: '100%',
                                    padding: '1rem',
                                    backgroundColor: 'transparent',
                                    border: `1px solid ${plan.color}`,
                                    color: plan.color,
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    transition: 'all 0.3s ease'
                                }}
                                >
                                    Choose Plan
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Memberships;
