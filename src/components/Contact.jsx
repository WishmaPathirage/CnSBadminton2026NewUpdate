import { motion } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';

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
                        <a href="#booking" style={{
                            backgroundColor: '#000',
                            color: '#fff',
                            padding: '1rem 2.5rem',
                            borderRadius: '50px',
                            fontWeight: '700'
                        }}>
                            Book Now
                        </a>
                    </motion.div>

                    {/* Contact Info & Map */}
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'white' }}>Visit Us</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <MapPin color="var(--primary-green)" />
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Galle, Sri Lanka</span>
                            </div>
                            <a href="tel:+94771234567" className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                                <Phone color="var(--primary-green)" />
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>+94 77 123 4567</span>
                            </a>
                            <a href="mailto:info@csbadminton.lk" className="contact-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                                <Mail color="var(--primary-green)" />
                                <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>info@csbadminton.lk</span>
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
