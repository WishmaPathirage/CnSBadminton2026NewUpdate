import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { currentUser } = useAuth(); // Use AuthContext
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const links = [
        { name: 'Home', href: '/#home' },
        { name: 'Book Now', href: '/#booking' },
        { name: 'Memberships', href: '/#memberships' },
        { name: 'Services', href: '/#services' },
        { name: 'Events', href: '/#events' },
        { name: 'Contact', href: '/#contact' },
    ];

    return (
        <nav
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                backgroundColor: scrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                borderBottom: scrolled ? '1px solid transparent' : 'none',
                borderImage: scrolled ? 'linear-gradient(to right, var(--brand-teal), var(--brand-pink), var(--brand-yellow)) 1' : 'none',
                transition: 'all 0.3s ease',
                padding: '1rem 0'
            }}
        >
            <div className="container flex-center" style={{ justifyContent: 'space-between' }}>
                <Link to="/" style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--brand-yellow)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', backgroundColor: 'white' }}
                    >
                        <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </motion.div>
                    <span>
                        C & S <span style={{ color: 'white' }}>Badminton Complex (PVT) Ltd</span>
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="desktop-menu" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    {links.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            style={{
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                position: 'relative',
                                color: 'white',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                letterSpacing: '0.5px'
                            }}
                            className="nav-link"
                        >
                            {link.name}
                        </a>
                    ))}

                    {/* Auth Section */}
                    {currentUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--brand-teal)' }}>
                                <User size={18} />
                                <span style={{ fontWeight: 'bold' }}>{currentUser.name || currentUser.email.split('@')[0]}</span>
                            </div>
                            {currentUser.role === 'admin' && (
                                <Link to="/admin" style={{ fontSize: '0.9rem', color: 'var(--brand-pink)', fontWeight: 'bold' }}>
                                    Dashboard
                                </Link>
                            )}
                            <button onClick={handleLogout} style={{ background: 'none', color: 'var(--text-gray)', cursor: 'pointer' }} title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="btn-gradient"
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '50px',
                                fontSize: '0.9rem',
                                fontWeight: '700',
                                textDecoration: 'none'
                            }}
                        >
                            Login
                        </Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="mobile-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ color: 'white', background: 'none', fontSize: '1.5rem' }}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            overflow: 'hidden',
                            backgroundColor: 'rgba(10, 10, 10, 0.98)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div className="container" style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0' }}>
                            {links.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    {link.name}
                                </a>
                            ))}
                            {currentUser ? (
                                <>
                                    <div style={{ padding: '1rem 0', color: 'var(--brand-teal)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        Signed in as {currentUser.name || currentUser.email}
                                    </div>
                                    {currentUser.role === 'admin' && (
                                        <Link to="/admin" onClick={() => setIsOpen(false)} style={{ padding: '1rem 0', color: 'var(--brand-pink)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <button onClick={() => { handleLogout(); setIsOpen(false); }} style={{ padding: '1rem 0', textAlign: 'left', background: 'none', color: 'var(--text-gray)' }}>
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" onClick={() => setIsOpen(false)} style={{ padding: '1rem 0', color: 'var(--brand-yellow)', fontWeight: 'bold' }}>
                                    Login / Register
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-toggle { display: none !important; }
        }
        .nav-link:hover { color: var(--primary-green); }
      `}</style>
        </nav >
    );
};

export default Navbar;
