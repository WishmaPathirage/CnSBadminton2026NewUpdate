import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Star, ShieldCheck } from 'lucide-react'; // Added ShieldCheck for Admin
import { motion } from 'framer-motion';
import { getBookingByOrderId } from '../services/bookingService';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [booking, setBooking] = useState(null);

    const navigate = useNavigate(); // Add useNavigate

    useEffect(() => {
        // Redirect if no order ID provided (prevent ghost view)
        if (!orderId) {
            navigate('/', { replace: true });
            return;
        }

        const fetchBooking = async () => {
            if (orderId) {
                const data = await getBookingByOrderId(orderId);
                setBooking(data);
            }
        };
        fetchBooking();
    }, [orderId, navigate]);

    // Calculate End Time if booking exists
    const getEndTime = (startTime, duration) => {
        if (!startTime || !duration) return '';
        const [h, m] = startTime.split(':').map(Number);
        const totalMins = h * 60 + m + duration;
        const endH = Math.floor(totalMins / 60);
        const endM = totalMins % 60;
        return `${endH < 10 ? '0' + endH : endH}:${endM < 10 ? '0' + endM : endM}`;
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorations */}
            <div style={{ position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px', background: 'var(--brand-teal)', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '300px', height: '300px', background: 'var(--brand-pink)', filter: 'blur(150px)', opacity: 0.2, borderRadius: '50%' }}></div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="glass-panel"
                style={{
                    padding: '4rem 3rem',
                    textAlign: 'center',
                    maxWidth: '600px',
                    width: '100%',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--brand-teal), #2ecc71)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(46, 204, 113, 0.4)'
                        }}
                    >
                        <Check size={50} color="white" strokeWidth={3} />
                    </motion.div>

                    {/* Floating Stars */}
                    <motion.div animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ position: 'absolute', top: -10, right: -10, color: 'var(--brand-yellow)' }}>
                        <Star size={24} fill="currentColor" />
                    </motion.div>
                    <motion.div animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} style={{ position: 'absolute', bottom: 0, left: -20, color: 'var(--brand-pink)' }}>
                        <Star size={20} fill="currentColor" />
                    </motion.div>
                </div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #ccc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Booking Confirmed!
                </h1>

                <p style={{ color: 'var(--text-gray)', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    Your courts are reserved. Our admin will accept it, and you will receive your confirmation shortly.
                </p>

                {booking && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        marginBottom: '2rem',
                        textAlign: 'left',
                        display: 'inline-block',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-gray)' }}>Booking ID:</span>
                            <span style={{ fontWeight: 'bold' }}>{orderId}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-gray)' }}>Date:</span>
                            <span>{booking.date}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-gray)' }}>Time:</span>
                            <span>{booking.startTime} - {getEndTime(booking.startTime, booking.duration)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: booking.needRackets || (booking.shuttleType && booking.shuttleType !== 'none') ? '0.5rem' : '0' }}>
                            <span style={{ color: 'var(--text-gray)' }}>Court No:</span>
                            <span style={{ color: 'var(--brand-teal)' }}>{booking.courts.map(c => `Court ${c}`).join(', ')}</span>
                        </div>
                        {booking.needRackets && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: booking.shuttleType && booking.shuttleType !== 'none' ? '0.5rem' : '0' }}>
                                <span style={{ color: 'var(--text-gray)' }}>Racket Rental:</span>
                                <span>{booking.racketQty} {booking.racketQty === 1 ? 'Racket' : 'Rackets'} (Rs. {booking.racketCost ? booking.racketCost.toFixed(2) : (booking.racketQty * 150 * (booking.duration / 60)).toFixed(2)})</span>
                            </div>
                        )}
                        {booking.shuttleType && booking.shuttleType !== 'none' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-gray)' }}>Shuttlecocks:</span>
                                <span>{booking.shuttleQty} × {booking.shuttleType === 'nylon' ? 'Nylon' : 'Feather'} (Rs. {booking.shuttleCost ? booking.shuttleCost.toFixed(2) : (booking.shuttleQty * (booking.shuttleType === 'nylon' ? 800 : 900)).toFixed(2)})</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem', marginTop: '0.8rem' }}>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>Total Paid:</span>
                            <span style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>Rs. {booking.amount ? booking.amount.toFixed(2) : '0.00'}</span>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link
                        to="/"
                        className="btn-gradient"
                        style={{
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            boxShadow: '0 4px 15px rgba(120, 220, 202, 0.3)'
                        }}
                    >
                        Back to Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
