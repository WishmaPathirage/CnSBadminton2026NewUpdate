import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import NotificationBar from './components/NotificationBar';
import Hero from './components/Hero';
import BookingForm from './components/BookingForm';
import Memberships from './components/Memberships';
import Services from './components/Services';
import Events from './components/Events';
import Directors from './components/Directors';
import Reviews from './components/Reviews';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Profile from './pages/Profile';
import DevelopmentProgress from './components/DevelopmentProgress';
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import StringingBooking from './components/StringingBooking';

const LandingPage = () => {
  const location = useLocation();

  React.useEffect(() => {
    // Check for targetId in location state (from Navbar navigation)
    if (location.state && location.state.targetId) {
      const element = document.getElementById(location.state.targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      // If simply navigating to /, scroll to top
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div className="app-container" style={{ position: 'relative', width: '100%', overflowX: 'hidden' }}>
      <NotificationBar />

      <div id="home"><Hero /></div>
      <div id="booking"><BookingForm /></div>
      <div id="memberships"><Memberships /></div>
      <div id="services"><Services /></div>
      <div id="stringing"><StringingBooking /></div>
      <div id="events"><Events /></div>
      <Directors />
      <DevelopmentProgress />
      <div id="reviews"><Reviews /></div>
      <div id="contact"><Contact /></div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
