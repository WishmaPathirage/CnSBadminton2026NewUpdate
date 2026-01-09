import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';

const Contact = () => {
    return (
        <section id="contact" className="section-padding">
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>

                    {/* Pricing Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring' }}
                        className="glass-panel"
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '3rem',
                            borderRadius: '24px',
                            border: '1px solid rgba(46, 204, 113, 0.2)',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            boxShadow: '0 0 30px rgba(46, 204, 113, 0.1), inset 0 0 20px rgba(46, 204, 113, 0.05)'
                        }}
                    >
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                            <motion.div
                                initial={{ y: -100, opacity: 0, rotate: -45 }}
                                whileInView={{ y: 0, opacity: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15,
                                    delay: 0.2
                                }}
                                style={{
                                    fontSize: '3rem',
                                    filter: 'drop-shadow(0 0 10px rgba(46, 204, 113, 0.5))',
                                    zIndex: 2
                                }}
                            >
                                🏸
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                whileInView={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(46,204,113,0.8) 0%, transparent 70%)',
                                    zIndex: 1
                                }}
                            />
                        </div>

                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>Standard Rate</h3>

                        <div style={{
                            fontSize: '5rem',
                            fontWeight: '800',
                            lineHeight: 1,
                            marginBottom: '0.5rem',
                            color: 'transparent',
                            WebkitBackgroundClip: 'text',
                            backgroundImage: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                            filter: 'drop-shadow(0 4px 10px rgba(46, 204, 113, 0.3))'
                        }}>
                            900
                        </div>

                        <div style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: '600', color: '#888' }}>
                            LKR / Hour
                        </div>

                        <p style={{ marginBottom: '2.5rem', opacity: 0.7, lineHeight: '1.6', fontSize: '0.95rem' }}>
                            Book your court today and enjoy <br />premium flooring and lighting.
                        </p>

                        <button
                            onClick={() => {
                                const bookingSection = document.getElementById('booking');
                                if (bookingSection) {
                                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="btn-gradient"
                            style={{
                                padding: '1rem 3rem',
                                borderRadius: '50px',
                                fontWeight: '700',
                                width: 'fit-content',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 20px rgba(46, 204, 113, 0.2)',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Book Now
                        </button>
                    </motion.div>

                    {/* Contact Info & Map */}
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'white' }}>Visit Us</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin color="var(--primary-green)" />
                                </div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>No:38/2 Godaduwa Rd, Galle</span>
                            </div>
                            <a href="tel:+94777983264" className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Phone color="var(--primary-green)" />
                                </div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>+94 77 798 3264</span>
                            </a>
                            <a href="mailto:cnsb233@gmail.com" className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Mail color="var(--primary-green)" />
                                </div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>cnsb233@gmail.com</span>
                            </a>

                            {/* Social Media Links merged into list */}
                            <a
                                href="https://www.facebook.com/share/1BjX2ZGFuA/?mibextid=wwXIfr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="contact-item"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}
                            >
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Facebook color="var(--primary-green)" />
                                </div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>C & S Badminton Complex</span>
                            </a>

                            <a
                                href="https://www.instagram.com/cnsbadminton?igsh=MTA0eXVva2kwdzQ0ag%3D%3D&utm_source=qr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="contact-item"
                                style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}
                            >
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Instagram color="var(--primary-green)" />
                                </div>
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>cnsbadminton</span>
                            </a>
                        </div>

                        {/* Map Placeholder */}
                        <div style={{
                            width: '100%',
                            height: '300px',
                            backgroundColor: '#222',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            <iframe
                                src="https://maps.google.com/maps?q=C%20%26%20S%20Badminton%20Complex%20Galle&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </section >
    );
};

export default Contact;
