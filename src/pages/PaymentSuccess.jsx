import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Star, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { subscribeToBookingByOrderId, updateBookingStatus } from '../services/bookingService';
import { jsPDF } from 'jspdf';
import emailjs from '@emailjs/browser';

// Helper to calculate End Time
const getEndTime = (startTime, duration) => {
    if (!startTime || !duration) return '';
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + duration;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${endH < 10 ? '0' + endH : endH}:${endM < 10 ? '0' + endM : endM}`;
};

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [booking, setBooking] = useState(null);
    const [status, setStatus] = useState('verifying'); // 'verifying', 'confirmed', 'failed'
    const emailSentRef = useRef(false);
    const navigate = useNavigate();

    const handleDownloadPDF = () => {
        if (!booking) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // 1. Draw "PAID" Watermark in the background
        doc.setTextColor(255, 225, 230); // Very light red/pink for the watermark stamp
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(80);
        doc.text('PAID', 105, 150, { angle: 315, align: 'center' });

        // 2. Header and Logo area
        doc.setFillColor(18, 18, 18);
        doc.rect(0, 0, 210, 40, 'F');

        // Brand Title
        doc.setTextColor(120, 220, 202); // Teal color
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('C & S BADMINTON COMPLEX', 15, 22);

        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Court Booking Confirmation Receipt', 15, 30);

        // Date & Order ID on the top right
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(`Receipt Date: ${new Date().toLocaleDateString()}`, 195, 20, { align: 'right' });
        doc.text(`Booking Ref: ${orderId}`, 195, 26, { align: 'right' });

        // Reset styles for text details
        doc.setTextColor(30, 30, 30);

        // 3. Document Content
        let yPos = 55;

        // Section Title: Booking Details
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Booking Details', 15, yPos);
        yPos += 3;
        
        // Horizontal divider line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;

        // Details grid helper function
        const drawDetailRow = (label, value) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.text(label, 15, yPos);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            doc.text(String(value), 65, yPos);
            yPos += 8;
        };

        const getShuttleDisplayName = (type) => {
            const SHUTTLE_NAMES = {
                nylon: 'Nylon Shuttlecock',
                feather: 'Feather Shuttlecock',
                yonex_mavis_600: 'Yonex Mavis 600 (Nylon)',
                lining_future_10: 'Li-ning Future 10 (Nylon)',
                lining_champ: 'Li-ning Champ (Nylon)',
                lining_d8: 'Li-ning Feather D8 (Feather)'
            };
            return SHUTTLE_NAMES[type] || type;
        };

        const getShuttleDefaultPrice = (type) => {
            const SHUTTLE_PRICES = {
                yonex_mavis_600: 900,
                lining_future_10: 700,
                lining_champ: 700,
                lining_d8: 900,
                nylon: 800,
                feather: 900
            };
            return SHUTTLE_PRICES[type] || 0;
        };

        // Name
        drawDetailRow('Customer Name:', booking.userName || 'Valued Customer');
        
        // No of Courts
        drawDetailRow('No of Courts:', booking.courts ? booking.courts.length : 1);
        
        // Court No
        drawDetailRow('Court No:', booking.courts ? booking.courts.map(c => `Court ${c}`).join(', ') : 'N/A');
        
        // Date
        drawDetailRow('Booking Date:', booking.date || 'N/A');
        
        // Time
        const timeVal = booking.startTime ? `${booking.startTime} - ${getEndTime(booking.startTime, booking.duration)}` : 'N/A';
        drawDetailRow('Booking Time:', timeVal);

        // Additional Requirements
        let additionalReqs = [];
        if (booking.needRackets) {
            additionalReqs.push(`${booking.racketQty} x Rackets Rent`);
        }
        if (booking.shuttleType && booking.shuttleType !== 'none') {
            additionalReqs.push(`${booking.shuttleQty} x ${getShuttleDisplayName(booking.shuttleType)} Purchase`);
        }
        
        drawDetailRow('Additional Reqs:', additionalReqs.length > 0 ? additionalReqs.join(', ') : 'None');

        yPos += 5;

        // Section Title: Payment Summary
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.text('Payment Summary', 15, yPos);
        yPos += 3;
        doc.line(15, yPos, 195, yPos);
        yPos += 8;

        // Draw Cost Row helper
        const drawCostRow = (label, value) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.text(label, 15, yPos);
            doc.text(value, 195, yPos, { align: 'right' });
            yPos += 7;
        };

        // Court Rental Cost
        const courtCostVal = booking.courtCost || (900 * ((booking.duration || 60) / 60)) * (booking.courts ? booking.courts.length : 1);
        drawCostRow(`Court Rental Fee (Rs. 900/hr x ${(booking.duration || 60) / 60} hrs)`, `Rs. ${courtCostVal.toFixed(2)}`);

        // Rackets
        if (booking.needRackets) {
            const racketCostVal = booking.racketCost || (booking.racketQty * 150 * ((booking.duration || 60) / 60));
            drawCostRow(`Racket Rental (${booking.racketQty} rackets x Rs. 150/hr x ${(booking.duration || 60) / 60} hrs)`, `Rs. ${racketCostVal.toFixed(2)}`);
        }

        // Shuttles
        if (booking.shuttleType && booking.shuttleType !== 'none') {
            const shuttleCostVal = booking.shuttleCost || (booking.shuttleQty * getShuttleDefaultPrice(booking.shuttleType));
            drawCostRow(`Shuttlecock Purchase (${booking.shuttleQty} x ${getShuttleDisplayName(booking.shuttleType)})`, `Rs. ${shuttleCostVal.toFixed(2)}`);
        }

        yPos += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;

        // Total Paid
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(18, 18, 18);
        doc.text('Total Paid (LKR):', 15, yPos);
        doc.setTextColor(12, 168, 140); // Teal color for amount
        doc.setFontSize(14);
        const totalAmountStr = `Rs. ${booking.amount ? booking.amount.toFixed(2) : '0.00'}`;
        doc.text(totalAmountStr, 195, yPos, { align: 'right' });

        yPos += 25;

        // Footer block
        doc.setDrawColor(230, 230, 230);
        doc.line(15, yPos, 195, yPos);
        yPos += 6;
        
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for booking with C & S Badminton Complex!', 105, yPos, { align: 'center' });
        yPos += 5;
        doc.text('Please present this receipt at the counter upon arrival.', 105, yPos, { align: 'center' });

        // Save PDF
        doc.save(`CNS_Booking_${orderId}.pdf`);
    };

    useEffect(() => {
        // Redirect if no order ID provided (prevent ghost view)
        if (!orderId) {
            navigate('/', { replace: true });
            return;
        }

        const getShuttleDisplayName = (type) => {
            const SHUTTLE_NAMES = {
                nylon: 'Nylon Shuttlecock',
                feather: 'Feather Shuttlecock',
                yonex_mavis_600: 'Yonex Mavis 600 (Nylon)',
                lining_future_10: 'Li-ning Future 10 (Nylon)',
                lining_champ: 'Li-ning Champ (Nylon)',
                lining_d8: 'Li-ning Feather D8 (Feather)'
            };
            return SHUTTLE_NAMES[type] || type;
        };

        const getShuttleDefaultPrice = (type) => {
            const SHUTTLE_PRICES = {
                yonex_mavis_600: 900,
                lining_future_10: 700,
                lining_champ: 700,
                lining_d8: 900,
                nylon: 800,
                feather: 900
            };
            return SHUTTLE_PRICES[type] || 0;
        };

        // Subscribe to real-time status of the booking in Firestore
        const unsubscribe = subscribeToBookingByOrderId(orderId, (data) => {
            if (!data) {
                setStatus('verifying');
                return;
            }

            setBooking(data);

            if (data.status === 'pending_payment') {
                // Since the user successfully paid and returned to the Success URL, confirm it immediately!
                console.log("Returned to success page. Confirming booking in Firestore...");
                updateBookingStatus(data.id, 'confirmed').catch(err => {
                    console.error("Failed to confirm booking client-side:", err);
                });
                return;
            }

            if (data.status === 'confirmed') {
                setStatus('confirmed');

                // Trigger EmailJS exactly once when status shifts to 'confirmed'
                if (!emailSentRef.current) {
                    emailSentRef.current = true;

                    const courtCostVal = data.courtCost || (900 * (data.duration / 60)) * data.courts.length;
                    const racketCostVal = data.racketCost || (data.needRackets ? (data.racketQty * 150 * (data.duration / 60)) : 0);
                    const shuttleCostVal = data.shuttleCost || (data.shuttleType && data.shuttleType !== 'none' ? (data.shuttleQty * getShuttleDefaultPrice(data.shuttleType)) : 0);

                    const templateParams = {
                        order_id: orderId,
                        orderId: orderId,
                        booking_id: data.id,
                        bookingId: data.id,
                        customer_name: data.userName,
                        user_name: data.userName,
                        userName: data.userName,
                        phone: data.userPhone,
                        userPhone: data.userPhone,
                        date: data.date,
                        booking_date: data.date,
                        starting_time: data.startTime,
                        ending_time: data.ending_time || getEndTime(data.startTime, data.duration),
                        duration: `${data.duration} mins`,
                        courts_booked: data.courts.join(', '),
                        courts: data.courts.join(', '),
                        amount: data.amount.toFixed(2),
                        total_amount: data.amount.toFixed(2),
                        totalAmount: data.amount.toFixed(2),
                        user_email: data.userEmail,
                        userEmail: data.userEmail,
                        booking_time: `${data.startTime} - ${getEndTime(data.startTime, data.duration)}`,
                        
                        court_cost: `Rs. ${courtCostVal.toFixed(2)}`,
                        rackets_info: data.needRackets ? `${data.racketQty} Rackets (Rs. ${racketCostVal.toFixed(2)})` : 'None',
                        shuttles_info: data.shuttleType && data.shuttleType !== 'none' ? `${data.shuttleQty} ${getShuttleDisplayName(data.shuttleType)} (Rs. ${shuttleCostVal.toFixed(2)})` : 'None'
                    };

                    console.log("Sending Webhook Confirmation Email...", templateParams);

                    emailjs.send(
                        'service_i25io04',
                        'template_bv3pwbr',
                        templateParams,
                        'cmyBcHcHxEP2ggwV3'
                    ).catch(err => {
                        console.error("EmailJS alert failed inside webhook verification:", err);
                        emailSentRef.current = false; // Reset to allow retry on next snapshot
                    });
                }
            } else if (data.status === 'failed') {
                setStatus('failed');
            } else {
                setStatus('verifying');
            }
        });

        return () => unsubscribe();
    }, [orderId, navigate]);

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
                {status === 'verifying' && (
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                            <Loader2 size={60} color="var(--brand-teal)" className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
                        </div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '1.2rem', color: 'white' }}>
                            Verifying Payment...
                        </h1>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            We are securely verifying your transaction with PayHere. <br />
                            Please do not close or refresh this page.
                        </p>
                        <style>{`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                )}

                {status === 'failed' && (
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--brand-pink), #ff4757)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 10px 30px rgba(255, 71, 87, 0.4)'
                            }}>
                                <AlertCircle size={50} color="white" strokeWidth={2.5} />
                            </div>
                        </div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '1.2rem', color: 'white' }}>
                            Payment Declined
                        </h1>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            Your transaction could not be completed successfully or was cancelled. <br />
                            The court slots have been released.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link
                                to="/"
                                className="btn-gradient"
                                style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 15px rgba(120, 220, 202, 0.3)',
                                    color: '#000'
                                }}
                            >
                                Try Booking Again
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'confirmed' && (
                    <div>
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
                                {booking.shuttleType && booking.shuttleType !== 'none' && (() => {
                                    const getShuttleDisplayName = (type) => {
                                        const SHUTTLE_NAMES = {
                                            nylon: 'Nylon Shuttlecock',
                                            feather: 'Feather Shuttlecock',
                                            yonex_mavis_600: 'Yonex Mavis 600 (Nylon)',
                                            lining_future_10: 'Li-ning Future 10 (Nylon)',
                                            lining_champ: 'Li-ning Champ (Nylon)',
                                            lining_d8: 'Li-ning Feather D8 (Feather)'
                                        };
                                        return SHUTTLE_NAMES[type] || type;
                                    };
                                    const getShuttleDefaultPrice = (type) => {
                                        const SHUTTLE_PRICES = {
                                            yonex_mavis_600: 900,
                                            lining_future_10: 700,
                                            lining_champ: 700,
                                            lining_d8: 900,
                                            nylon: 800,
                                            feather: 900
                                        };
                                        return SHUTTLE_PRICES[type] || 0;
                                    };
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-gray)' }}>Shuttlecocks:</span>
                                            <span>{booking.shuttleQty} × {getShuttleDisplayName(booking.shuttleType)} (Rs. {booking.shuttleCost ? booking.shuttleCost.toFixed(2) : (booking.shuttleQty * getShuttleDefaultPrice(booking.shuttleType)).toFixed(2)})</span>
                                        </div>
                                    );
                                })()}
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
                                    boxShadow: '0 4px 15px rgba(120, 220, 202, 0.3)',
                                    color: '#000'
                                }}
                            >
                                Back to Home
                            </Link>
                            <button
                                onClick={handleDownloadPDF}
                                style={{
                                    padding: '1rem 2rem',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: 'var(--brand-pink)',
                                    color: '#000',
                                    boxShadow: '0 4px 15px rgba(255, 105, 180, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 105, 180, 0.5)';
                                    e.currentTarget.style.background = '#ff80bf';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 105, 180, 0.3)';
                                    e.currentTarget.style.background = 'var(--brand-pink)';
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Receipt (PDF)
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
