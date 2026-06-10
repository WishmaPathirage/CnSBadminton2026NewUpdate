import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Zap, Shield, Clock, Award } from 'lucide-react';

const StringingBooking = () => {
    const cleanNumber = '+94764160217';

    const features = [
        {
            icon: <Zap size={24} style={{ color: 'var(--brand-yellow)' }} />,
            title: 'Precision Electronic Tensioning',
            desc: 'Calibrated electronic machine tensioning for exact tension consistency across every main and cross.'
        },
        {
            icon: <Award size={24} style={{ color: 'var(--brand-teal)' }} />,
            title: 'Premium Brand Strings',
            desc: 'Stocked with Yonex, Li-Ning, and Victor strings. Choose from control, durability, or repulsion power.'
        },
        {
            icon: <Clock size={24} style={{ color: 'var(--brand-pink)' }} />,
            title: '24-Hour Quick Turnaround',
            desc: 'Drop off your racket and have it freshly re-strung and ready for your next session within 24 hours.'
        },
        {
            icon: <Shield size={24} style={{ color: 'var(--brand-teal)' }} />,
            title: 'Expert Consultation',
            desc: 'Not sure about your tension? Our certified stringers will guide you based on your skill level and playstyle.'
        }
    ];

    const popularStrings = [
        'Yonex BG 65',
        'Yonex BG 65 Titanium',
        'Gosen Ryzonic 65',
        'Li-Ning N65',
        'Li-Ning N68'
    ];

    return (
        <section id="stringing" className="section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Subtle glow background */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(251, 202, 63, 0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '4rem' }}
                >
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        <span className="text-gradient">Racket Stringing & Customization</span>
                    </h2>
                    <p style={{ color: 'var(--text-gray)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
                        Get pro-level stringing services at C&S. Maximize your performance on court with perfect string tension and premium alignment.
                    </p>
                </motion.div>

                {/* Content Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    alignItems: 'stretch'
                }}>
                    {/* Left Column: Why String With Us */}
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-light)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap size={22} style={{ color: 'var(--brand-teal)' }} /> Why String With Us?
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {features.map((feat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        viewport={{ once: true }}
                                        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                                    >
                                        <div style={{
                                            marginTop: '3px',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {feat.icon}
                                        </div>
                                        <div>
                                            <h4 style={{ color: 'var(--text-light)', fontWeight: '600', marginBottom: '0.25rem' }}>{feat.title}</h4>
                                            <p style={{ color: 'var(--text-gray)', fontSize: '0.85rem', lineHeight: '1.5' }}>{feat.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle Column: Book An Appointment */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel"
                        style={{
                            padding: '2rem',
                            border: '1px solid rgba(251, 202, 63, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            position: 'relative',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ width: '100%' }}>
                            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-light)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                                Book An Appointment
                            </h3>
                            <p style={{ color: 'var(--brand-teal)', fontWeight: '600', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                Choose a contact method below to secure your slot
                            </p>
                        </div>

                        {/* Premium Visual Asset */}
                        <div style={{
                            width: '100%',
                            height: '160px',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <img 
                                src="/racket_stringing.png" 
                                alt="Racket Stringing Machine" 
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem', marginTop: 'auto' }}>
                            {/* WhatsApp CTA */}
                            <a
                                href={`https://wa.me/94764160217?text=Hi!%20I'd%20like%20to%20book%20a%20racket%20stringing%20appointment.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-gradient"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    padding: '0.9rem 1.5rem',
                                    borderRadius: '50px',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    textDecoration: 'none',
                                    background: '#25D366', // WhatsApp color override
                                    color: '#fff',
                                    boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#20ba5a';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#25D366';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(37, 211, 102, 0.3)';
                                }}
                            >
                                <MessageCircle size={18} fill="#fff" /> Chat on WhatsApp
                            </a>

                            {/* Direct Call CTA */}
                            <a
                                href={`tel:${cleanNumber}`}
                                className="btn-gradient"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    padding: '0.9rem 1.5rem',
                                    borderRadius: '50px',
                                    fontWeight: '700',
                                    fontSize: '0.95rem',
                                    textDecoration: 'none',
                                    background: 'var(--brand-teal)',
                                    color: '#000',
                                    boxShadow: '0 4px 15px rgba(120, 220, 202, 0.3)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Phone size={18} fill="#000" /> Call Directly
                            </a>
                        </div>
                    </motion.div>

                    {/* Right Column: Popular Strings & Pricing */}
                    <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-light)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                                Popular Strings
                            </h3>
                            <p style={{ color: 'var(--brand-yellow)', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                                Pricing starts from LKR 1,500 upwards
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {popularStrings.map((stringName, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <span style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'var(--brand-teal)',
                                            display: 'inline-block'
                                        }} />
                                        <span style={{ color: 'var(--text-gray)', fontSize: '0.95rem', fontWeight: '500' }}>{stringName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StringingBooking;
