import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import NotificationBar from './components/NotificationBar';
import Hero from './components/Hero';
import BookingForm from './components/BookingForm';
import Memberships from './components/Memberships';
import Services from './components/Services';
import Events from './components/Events';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import DevelopmentProgress from './components/DevelopmentProgress';

const LandingPage = () => {
  const [showGreeting, setShowGreeting] = React.useState(() => {
    return !localStorage.getItem('greeting_shown_2026');
  });

  const handleCloseGreeting = () => {
    localStorage.setItem('greeting_shown_2026', 'true');
    setShowGreeting(false);
  };

  const location = useLocation();

  React.useEffect(() => {
    // Auto-scroll to section based on path
    const path = location.pathname.replace('/', '');
    if (path) {
      const element = document.getElementById(path);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100); // Small delay to ensure render
      }
    } else {
      window.scrollTo(0, 0); // Scroll to top if home
    }
  }, [location]);

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      {/* Happy New Year Overlay */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.85)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
            onClick={handleCloseGreeting}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '30px',
                padding: '3rem',
                maxWidth: '500px',
                textAlign: 'center',
                boxShadow: '0 0 50px rgba(120, 220, 202, 0.3)',
                position: 'relative'
              }}
            >
              <button
                onClick={handleCloseGreeting}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  opacity: 0.7
                }}
              >
                ×
              </button>

              <motion.img
                src="/logo.jpg"
                alt="CS Badminton Logo"
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid var(--brand-teal)',
                  marginBottom: '1.5rem',
                  boxShadow: '0 0 30px rgba(120, 220, 202, 0.4)'
                }}
              />

              <motion.h1
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem',
                  background: 'linear-gradient(to right, #FBCA3F, #E94E8F, #78DCCA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '800'
                }}
              >
                Happy New Year 2026!
              </motion.h1>

              <p style={{ fontSize: '1.2rem', color: '#eee', lineHeight: '1.6' }}>
                Wishing you a smash-hit year filled with health, happiness, and great badminton! 🏸✨
              </p>

              <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                - C & S Badminton Complex Team
              </p>

              <button
                onClick={handleCloseGreeting}
                className="btn-gradient"
                style={{
                  marginTop: '2rem',
                  padding: '0.8rem 2rem',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Let's Play!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      <Navbar />
      <NotificationBar />
      <div id="home"><Hero /></div>

      <div id="booking"><BookingForm /></div>
      <div id="memberships"><Memberships /></div>
      <div id="services"><Services /></div>
      <div id="events"><Events /></div>
      <DevelopmentProgress />
      <div id="reviews"><Reviews /></div>
      <div id="contact"><Contact /></div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Section Routes that render LandingPage and scroll */}
        <Route path="/booking" element={<LandingPage />} />
        <Route path="/memberships" element={<LandingPage />} />
        <Route path="/services" element={<LandingPage />} />
        <Route path="/events" element={<LandingPage />} />
        <Route path="/contact" element={<LandingPage />} />
        <Route path="/reviews" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
      </Routes>
    </Router>
  );
}

export default App;
