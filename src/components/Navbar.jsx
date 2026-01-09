import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { useNavigate, Link, useLocation } from 'react-router-dom';

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
        window.location.href = '/'; // Force reload to prevent state issues
    };

    const location = useLocation();

    const links = [
        { name: 'Home', id: 'home' },
        { name: 'Book Now', id: 'booking' },
        { name: 'Memberships', id: 'memberships' },
        { name: 'Services', id: 'services' },
        { name: 'Events', id: 'events' },
        { name: 'Contact', id: 'contact' },
    ];

    const handleNavClick = (id) => {
        if (location.pathname === '/') {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/', { state: { targetId: id } });
        }
        setIsOpen(false);
    };

    return (
        <nav
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 2000,
                backgroundColor: scrolled ? 'rgba(10, 10, 10, 0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                borderBottom: scrolled ? '1px solid transparent' : 'none',
                borderImage: scrolled ? 'linear-gradient(to right, var(--brand-teal), var(--brand-pink), var(--brand-yellow)) 1' : 'none',
                transition: 'all 0.3s ease',
                padding: '1rem 0'
            }}
        >
            <div className="container flex-center" style={{ justifyContent: 'space-between' }}>
                <Link
                    to="/"
                    onClick={() => {
                        window.scrollTo(0, 0);
                        setIsOpen(false);
                    }}
                    style={{ fontSize: '1.2rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--brand-yellow)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}
                >
                    <motion.div
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', backgroundColor: 'white', flexShrink: 0 }}
                    >
                        <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </motion.div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                        <span style={{ fontSize: '1.2rem' }}>C & S</span>
                        <span className="desktop-only-text" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Badminton Complex (PVT) Ltd</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="desktop-menu" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    {links.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => handleNavClick(link.id)}
                            style={{
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                position: 'relative',
                                color: 'white',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                                textDecoration: 'none',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                            }}
                            className="nav-link"
                        >
                            {link.name}
                        </button>
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
                            background: 'rgba(10, 10, 10, 0.8)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div className="container" style={{ display: 'flex', flexDirection: 'column', padding: '1rem 0' }}>
                            {links.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => handleNavClick(link.id)}
                                    style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', color: 'white', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', fontSize: '1rem' }}
                                >
                                    {link.name}
                                </button>
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
        .nav-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          bottom: -4px;
          left: 0;
          background-color: var(--brand-yellow);
          transition: width 0.3s ease-in-out;
        }
        .nav-link:hover::after {
          width: 100%;
        }
        @media (max-width: 480px) {
            .desktop-only-text { display: none; }
        }
      `}</style>
        </nav >
    );
};

export default Navbar;
