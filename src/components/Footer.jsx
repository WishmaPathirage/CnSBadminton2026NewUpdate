import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '80px 0 0',
            marginTop: '4rem'
        }}>
            <div className="container">
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '3rem',
                    marginBottom: '60px'
                }}>
                    
                    {/* Brand Section */}
                    <div>
                        <h2 className="text-gradient" style={{ 
                            fontSize: '1.8rem', 
                            fontWeight: '900', 
                            marginBottom: '1.5rem',
                            letterSpacing: '-1px'
                        }}>
                            C & S BADMINTON
                        </h2>
                        <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '300px' }}>
                            Experience professional-grade badminton courts with state-of-the-art facilities in Sri Lanka. Your game, our passion.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[
                                { icon: <Facebook size={20} />, link: '#' },
                                { icon: <Instagram size={20} />, link: '#' },
                                { icon: <MessageCircle size={20} />, link: '#' }, // WhatsApp
                                { icon: <Twitter size={20} />, link: '#' },
                            ].map((social, i) => (
                                <motion.a
                                    key={i}
                                    href={social.link}
                                    whileHover={{ y: -3, color: 'var(--brand-teal)' }}
                                    style={{ 
                                        color: 'rgba(255,255,255,0.6)', 
                                        transition: 'color 0.3s' 
                                    }}
                                >
                                    {social.icon}
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Useful Links */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Useful Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {[
                                { label: 'Home', path: '/' },
                                { label: 'Book a Court', path: '/#booking' },
                                { label: 'About Us', path: '#' },
                                { label: 'Contact Us', path: '#' },
                                { label: 'Privacy Policy', path: '#' },
                                { label: 'Terms & Conditions', path: '#' },
                            ].map((link, i) => (
                                <Link 
                                    key={i} 
                                    to={link.path} 
                                    style={{ 
                                        color: 'var(--text-gray)', 
                                        fontSize: '0.9rem', 
                                        transition: 'color 0.3s' 
                                    }}
                                    onMouseOver={(e) => e.target.style.color = 'var(--brand-teal)'}
                                    onMouseOut={(e) => e.target.style.color = 'var(--text-gray)'}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>For More Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <Phone size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>+94 77 123 4567</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <MapPin size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>123/E, Pittugala Junction,<br />New Kandy Road, Malabe</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                <Mail size={18} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>info@cnsbadminton.lk</span>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Stay Updated</h3>
                        <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                            Subscribe for latest tournament news and updates.
                        </p>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="email" 
                                placeholder="Your Email Site..." 
                                className="glass-input"
                                style={{ 
                                    paddingRight: '50px', 
                                    fontSize: '0.85rem',
                                    borderRadius: '30px'
                                }}
                            />
                            <button style={{ 
                                position: 'absolute', 
                                right: '5px', 
                                top: '5px', 
                                bottom: '5px', 
                                width: '40px', 
                                background: 'var(--brand-teal)', 
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#000'
                            }}>
                                <Send size={16} />
                            </button>
                        </div>
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
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                        &copy; {new Date().getFullYear()} C & S Badminton Complex (PVT) Ltd. All Rights Reserved.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <div style={{ color: 'rgba(255,255,255,0.4)' }}>
                            Design & Developed By <span style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>Antigravity</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
