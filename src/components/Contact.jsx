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
                        style={{
                            background: 'linear-gradient(135deg, var(--primary-green), #27ae60)',
                            padding: '3rem',
                            borderRadius: '24px',
                            color: '#000',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center'
                        }}
                    >
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>Standard Rate</h3>
                        <div style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1 }}>900</div>
                        <div style={{ fontSize: '1.2rem', marginBottom: '2rem', fontWeight: '600' }}>LKR / Hour</div>
                        <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
                            Book your court today and enjoy <br />premium flooring and lighting.
                        </p>
                        <button
                            onClick={() => {
                                const bookingSection = document.getElementById('booking');
                                if (bookingSection) {
                                    bookingSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            style={{
                                backgroundColor: '#000',
                                color: '#fff',
                                padding: '1rem 2.5rem',
                                borderRadius: '50px',
                                fontWeight: '700',
                                width: 'fit-content',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
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
                        </div>

                        {/* Social Media Links */}
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', paddingLeft: '4px' }}>
                            <a
                                href="https://www.facebook.com/share/1BjX2ZGFuA/?mibextid=wwXIfr"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Facebook color="var(--primary-green)" />
                                </div>
                            </a>
                            <a
                                href="https://www.instagram.com/cnsbadminton?igsh=MTA0eXVva2kwdzQ0ag%3D%3D&utm_source=qr"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ minWidth: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Instagram color="var(--primary-green)" />
                                </div>
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
        </section>
    );
};

export default Contact;
