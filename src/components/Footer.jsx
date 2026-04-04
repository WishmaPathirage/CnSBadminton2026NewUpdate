import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { addSubscriber } from '../services/bookingService';

const Footer = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [statusMessage, setStatusMessage] = useState('');

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        setSubmitting(true);
        setStatus('idle');
        setStatusMessage('');

        try {
            await addSubscriber(email);
            setStatus('success');
            setStatusMessage('Successfully subscribed! Thank you.');
            setEmail('');
        } catch (error) {
            setStatus('error');
            setStatusMessage('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
            // Clear message after 5 seconds
            setTimeout(() => setStatusMessage(''), 5000);
        }
    };

    const handleNavClick = (id) => {
        if (location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/', { state: { targetId: id } });
        }
    };

    return (
        <footer style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            padding: 'var(--footer-padding-top, 80px) 0 0',
            marginTop: '4rem'
        }}>
            <div className="container">
                <div 
                    className="footer-grid"
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(var(--footer-grid-min, 250px), 1fr))', 
                        gap: 'var(--footer-grid-gap, 3rem)',
                        marginBottom: '60px'
                    }}
                >
                    
                    {/* Brand Section */}
                    <div>
                        <h2 className="text-gradient" style={{ 
                            fontSize: '1.8rem', 
                            fontWeight: '900', 
                            marginBottom: '1.5rem',
                            letterSpacing: '-1px'
                        }}>
                            C & S badminton Complex (PVT) Ltd
                        </h2>
                        <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '300px' }}>
                            Experience professional grade badminton courts with state of the art facilities in Sri Lanka. Your game, our passion.
                        </p>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Useful Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {[
                                { label: 'Home', id: 'home' },
                                { label: 'Book a Court', id: 'booking' },
                                { label: 'Memberships', id: 'memberships' },
                                { label: 'Services', id: 'services' },
                                { label: 'Events', id: 'events' },
                                { label: 'Contact Us', id: 'contact' },
                            ].map((link, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleNavClick(link.id)}
                                    style={{ 
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        color: 'var(--text-gray)', 
                                        fontSize: '0.9rem', 
                                        transition: 'color 0.3s' 
                                    }}
                                    onMouseOver={(e) => e.target.style.color = 'var(--brand-teal)'}
                                    onMouseOut={(e) => e.target.style.color = 'var(--text-gray)'}
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>For More Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <MapPin size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>No:38/2 Godaduwa Rd, Galle</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <Phone size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>+94 77 798 3264</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <Mail size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>cnsb233@gmail.com</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <Facebook size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>C & S Badminton Complex</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <Instagram size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>cnsbadminton</span>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Stay Updated</h3>
                        <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                            Subscribe for latest tournament news and updates.
                        </p>
                        <form 
                            onSubmit={handleSubscribe}
                            style={{ position: 'relative' }}
                        >
                            <input 
                                type="email" 
                                placeholder="Enter your email..." 
                                className="glass-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={submitting}
                                style={{ 
                                    paddingLeft: '1.5rem',
                                    paddingRight: '60px', 
                                    height: '54px',
                                    fontSize: '0.95rem',
                                    borderRadius: '100px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid ${status === 'success' ? 'var(--brand-teal)' : status === 'error' ? 'var(--brand-pink)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    opacity: submitting ? 0.7 : 1
                                }}
                            />
                            <button 
                                type="submit"
                                disabled={submitting || !email}
                                style={{ 
                                    position: 'absolute', 
                                    right: '6px', 
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '42px', 
                                    height: '42px',
                                    background: 'var(--brand-teal)', 
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#040b11',
                                    boxShadow: '0 4px 10px rgba(120, 220, 202, 0.2)',
                                    transition: 'all 0.2s ease',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting || !email ? 0.5 : 1
                                }}
                                onMouseOver={(e) => {
                                    if (!submitting && email) {
                                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                                        e.currentTarget.style.background = '#6cd1bf';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!submitting && email) {
                                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                        e.currentTarget.style.background = 'var(--brand-teal)';
                                    }
                                }}
                            >
                                {submitting ? (
                                    <div className="btn-spinner" style={{ width: '20px', height: '20px' }}></div>
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </form>
                        {statusMessage && (
                            <motion.p 
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ 
                                    fontSize: '0.8rem', 
                                    marginTop: '0.5rem', 
                                    paddingLeft: '1rem',
                                    color: status === 'success' ? 'var(--brand-teal)' : 'var(--brand-pink)'
                                }}
                            >
                                {statusMessage}
                            </motion.p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{ 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                padding: '25px 0', 
                background: 'rgba(0,0,0,0.3)' 
            }}>
                <div className="container" style={{ 
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                        &copy; C & S Badminton Complex (PVT) Ltd - 2026
                    </p>
                </div>
            </div>

            <style>{`
                :root {
                    --footer-padding-top: 80px;
                    --footer-grid-min: 250px;
                    --footer-grid-gap: 3rem;
                }
                @media (max-width: 768px) {
                    :root {
                        --footer-padding-top: 40px;
                        --footer-grid-min: 200px;
                        --footer-grid-gap: 1.5rem;
                    }
                    .footer-grid {
                        gap: 1.5rem !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default Footer;
