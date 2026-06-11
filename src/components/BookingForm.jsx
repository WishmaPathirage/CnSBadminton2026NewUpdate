import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { getAvailability, subscribeToAvailability, createBooking, checkUserBlacklist, deleteBooking } from '../services/bookingService';
import { getAuth } from 'firebase/auth'; // Import getAuth
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import CryptoJS from 'crypto-js';

const SHUTTLE_OPTIONS = {
    none: { name: 'No, thank you', price: 0, label: 'No, thank you' },
    yonex_mavis_600: { name: 'Yonex Mavis 600 (Nylon)', price: 900, label: 'Yonex Mavis 600 (Nylon) — Rs. 900 per shuttle' },
    lining_future_10: { name: 'Li-ning Future 10 (Nylon)', price: 700, label: 'Li-ning Future 10 (Nylon) — Rs. 700 per shuttle' },
    lining_champ: { name: 'Li-ning Champ (Nylon)', price: 700, label: 'Li-ning Champ (Nylon) — Rs. 700 per shuttle' },
    lining_d8: { name: 'Li-ning Feather D8 (Feather)', price: 900, label: 'Li-ning Feather D8 (Feather) — Rs. 900 per shuttle' }
};

const BookingForm = () => {
    // Helper for Local Date (YYYY-MM-DD) - Forced to Sri Lanka Time (UTC+5:30)
    const getSLTime = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * 5.5)); // Added 5.5 hours for SL Time
    };

    const getLocalDate = () => {
        const slTime = getSLTime();
        const year = slTime.getFullYear();
        const month = String(slTime.getMonth() + 1).padStart(2, '0');
        const day = String(slTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const tournamentSettings = {
        '2026-03-01': { start: 480, end: 1200 },
        '2026-03-02': { start: 480, end: 1200 },
        '2026-03-03': { start: 480, end: 1200 },
        '2026-05-22': { start: 0, end: 1440 },
        '2026-05-23': { start: 0, end: 1140 },
        '2026-05-24': { start: 0, end: 1140 },
        '2026-05-25': { start: 0, end: 1140 }
    };
    const isTournamentDate = (d) => !!tournamentSettings[d];

    const [date, setDate] = useState(getLocalDate());
    const [duration, setDuration] = useState(30); // Default 30 minutes
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedCourts, setSelectedCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [userDetails, setUserDetails] = useState({ name: '', email: '', Phone: '' });
    
    // Add-on options
    const [needRackets, setNeedRackets] = useState(false);
    const [racketQty, setRacketQty] = useState(1);
    const [shuttleType, setShuttleType] = useState('none'); // 'none', 'nylon', 'feather'
    const [shuttleQty, setShuttleQty] = useState(1);

    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [step, setStep] = useState(1); // 1: Select Time, 2: Details

    // Auth State
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const navigate = useNavigate();

    // Handle Mobile Back Button
    useEffect(() => {
        // When component mounts or step changes
        if (step === 2) {
            // Push state when entering Step 2 so "Back" works
            window.history.pushState({ step: 2 }, '', '');
        }

        const handlePopState = (event) => {
            // Check if we are moving BACK to a state where step 2 is no longer valid
            // Since we pushed state on entry to Step 2, popping it means we should go to Step 1
            if (step === 2) {
                setStep(1);
            }
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [step]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged(user => {
            setCurrentUser(user);
            if (user) {
                // Pre-fill email if available
                setUserDetails(prev => ({
                    ...prev,
                    name: user.displayName || '',
                    email: user.email || '',
                    // We might not have phone yet, unless we stored it in Firestore 'users' collection
                }));
            }
            setLoadingAuth(false);
        })
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!currentUser) {
            setSlots([]);
            return;
        }

        setStatus('loading');
        const unsubscribe = subscribeToAvailability(date, (data) => {
            setSlots(data);
            setStatus('idle');
        });
        
        return () => unsubscribe();
    }, [date, currentUser]);

    // Redirect or Show Login Prompt if not logged in
    if (loadingAuth) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading...</div>;

    if (!currentUser) {
        return (
            <section id="booking" className="section-padding" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel"
                        style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}
                    >
                        <Info size={48} color="var(--brand-teal)" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Login Required</h2>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
                            You must be logged in to make a booking. Please sign in or create an account to continue.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/login" className="btn-gradient" style={{ padding: '0.8rem 1.5rem', borderRadius: '50px', textDecoration: 'none', color: '#000', fontWeight: 'bold' }}>
                                Login
                            </Link>
                            <Link to="/register" style={{ padding: '0.8rem 1.5rem', border: '1px solid var(--brand-teal)', borderRadius: '50px', textDecoration: 'none', color: 'var(--brand-teal)', fontWeight: 'bold' }}>
                                Create Account
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
    }



    // Generate time slots 00:00 to 23:30 (24 hours)
    const generateTimeSlots = () => {
        const times = [];
        for (let i = 0; i < 24; i++) {
            times.push(`${i < 10 ? '0' + i : i}:00`);
            times.push(`${i < 10 ? '0' + i : i}:30`);
        }
        return times;
    };

    // Filter times based on current time if date is today
    const getFilteredTimes = () => {
        const times = generateTimeSlots();
        const today = getLocalDate();

        if (date === today) {
            const slTime = getSLTime();
            const currentHour = slTime.getHours();
            const currentMin = slTime.getMinutes();

            return times.filter(t => {
                const [h, m] = t.split(':').map(Number);
                // Slot is visible if its START time is after current time
                if (h > currentHour) return true;
                if (h === currentHour && m > currentMin) return true;
                return false;
            });
        }
        return times;
    };

    const allTimes = getFilteredTimes();



    // Auto-deselect removed to show visual conflict instead.

    const isSlotAvailable = (time, courtId) => {
        const timeToMinutes = (t) => {
            if (!t) return 0;
            const str = String(t).toUpperCase().trim();
            const isPM = str.includes('PM');
            const isAM = str.includes('AM');
            const clean = str.replace(/[A-Z\s]/g, '');
            let [h, m] = clean.split(':').map(Number);
            if (isNaN(m)) m = 0;
            if (isPM && h < 12) h += 12;
            if (isAM && h === 12) h = 0;
            return h * 60 + m;
        };

        const proposedStart = timeToMinutes(time);
        const proposedEnd = proposedStart + duration;

        // Tournament Restriction Logic
        if (tournamentSettings[date]) {
            const { start: tournamentStart, end: tournamentEnd } = tournamentSettings[date];
            if (proposedStart < tournamentEnd && proposedEnd > tournamentStart) return false;
        }

        return !slots.some(booking => {
            if (!booking.courts.some(c => Number(c) === Number(courtId))) return false;
            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = bookingStart + booking.duration;
            return proposedStart < bookingEnd && proposedEnd > bookingStart;
        });
    };

    const handleCourtToggle = (courtId) => {
        if (selectedCourts.includes(courtId)) {
            setSelectedCourts(selectedCourts.filter(c => c !== courtId));
        } else {
            setSelectedCourts([...selectedCourts, courtId]);
        }
    };

    const handleNextStep = () => {
        if (selectedCourts.length === 0 || selectedCourts.some(c => !isSlotAvailable(selectedTime, c))) {
            alert("One or more selected slots are no longer available. Please refresh and try again.");
            return;
        }
        setStep(2);
    };

    const startPayHerePayment = async (bookingId, orderId, totalAmount, courtCost, racketCost, shuttleCost, needRackets, racketQty, shuttleType, shuttleQty, userDetails, date, selectedTime, duration, selectedCourts) => {
        const merchantId = import.meta.env.VITE_PAYHERE_MERCHANT_ID || '252134';
        const merchantSecret = import.meta.env.VITE_PAYHERE_MERCHANT_SECRET || 'MTU3MzA5NDAxMDMxMTA2NjcyMzMxMjIzNDc5OTIyMTIxNjQ3ODUzNw==';
        const isSandbox = import.meta.env.VITE_PAYHERE_SANDBOX !== undefined
            ? import.meta.env.VITE_PAYHERE_SANDBOX === 'true'
            : false;

        const amountFormatted = totalAmount.toFixed(2);
        const currency = 'LKR';

        // Generate the signature hash
        const hashedSecret = CryptoJS.MD5(merchantSecret).toString().toUpperCase();
        const concatenatedString = merchantId + orderId + amountFormatted + currency + hashedSecret;
        const generatedHash = CryptoJS.MD5(concatenatedString).toString().toUpperCase();

        const [startH, startM] = selectedTime.split(':').map(Number);
        const totalMins = startH * 60 + startM + parseInt(duration);
        const endH = Math.floor(totalMins / 60);
        const endM = totalMins % 60;
        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        // Construct dynamic list of items for the checkout dialog
        let itemDescription = `Court Booking`;
        if (needRackets) itemDescription += ` + ${racketQty} Rackets Rent`;
        if (shuttleType !== 'none' && SHUTTLE_OPTIONS[shuttleType]) itemDescription += ` + ${shuttleQty} ${SHUTTLE_OPTIONS[shuttleType].name}`;

        const payment = {
            sandbox: isSandbox,
            merchant_id: merchantId,
            return_url: `${window.location.origin}/#/payment/success?order_id=${orderId}`,
            cancel_url: `${window.location.origin}/#/payment/cancel?order_id=${orderId}`,
            notify_url: 'https://cnsbadminton.lk/notify', // placeholder
            order_id: orderId,
            items: itemDescription,
            amount: amountFormatted,
            currency: currency,
            first_name: userDetails.name.split(' ')[0] || 'Customer',
            last_name: userDetails.name.split(' ').slice(1).join(' ') || 'User',
            email: userDetails.email,
            phone: userDetails.Phone,
            address: 'No.1, Galle Road',
            city: 'Colombo',
            country: 'Sri Lanka',
            hash: generatedHash
        };

        console.log("Starting PayHere payment with object:", payment);

        // Bind SDK handlers
        window.payhere.onCompleted = async (completedOrderId) => {
            console.log("PayHere: Payment completed for order", completedOrderId);
            setStatus('submitting');
            try {
                // Update booking status to 'confirmed'
                await updateDoc(doc(db, 'bookings', bookingId), {
                    status: 'confirmed'
                });

                // Trigger EmailJS notifications
                const templateParams = {
                    order_id: orderId,
                    orderId: orderId,
                    booking_id: bookingId,
                    bookingId: bookingId,
                    customer_name: userDetails.name,
                    user_name: userDetails.name,
                    userName: userDetails.name,
                    phone: userDetails.Phone,
                    userPhone: userDetails.Phone,
                    date: date,
                    booking_date: date,
                    starting_time: selectedTime,
                    ending_time: endTimeStr,
                    duration: `${duration} mins`,
                    courts_booked: selectedCourts.join(', '),
                    courts: selectedCourts.join(', '),
                    amount: amountFormatted,
                    total_amount: amountFormatted,
                    totalAmount: amountFormatted,
                    user_email: userDetails.email,
                    userEmail: userDetails.email,
                    booking_time: `${selectedTime} - ${endTimeStr}`,
                    
                    // Details about equipment/shuttle attachments
                    court_cost: `Rs. ${courtCost.toFixed(2)}`,
                    rackets_info: needRackets ? `${racketQty} Rackets (Rs. ${racketCost.toFixed(2)})` : 'None',
                    shuttles_info: shuttleType !== 'none' && SHUTTLE_OPTIONS[shuttleType] ? `${shuttleQty} ${SHUTTLE_OPTIONS[shuttleType].name} (Rs. ${shuttleCost.toFixed(2)})` : 'None'
                };

                console.log("Sending Confirmation Emails...", templateParams);

                emailjs.send(
                    'service_i25io04',
                    'template_bv3pwbr',
                    templateParams,
                    'cmyBcHcHxEP2ggwV3'
                ).catch(err => console.error("EmailJS alert failed:", err));

                setStatus('success');
                navigate(`/payment/success?order_id=${orderId}`);
            } catch (err) {
                console.error("Failed to update booking status on payment success:", err);
                alert("Payment was successful, but we encountered an error updating your booking. Please contact support.");
            }
        };

        window.payhere.onDismissed = async () => {
            console.log("PayHere: Payment modal dismissed");
            setStatus('idle');
            try {
                // Delete the temporary pending_payment booking to release slots
                await deleteBooking(bookingId);
                alert("Payment was cancelled. Your booking has been cancelled and slots released.");
            } catch (err) {
                console.error("Failed to delete pending booking on dismiss:", err);
            }
        };

        window.payhere.onError = async (error) => {
            console.error("PayHere error:", error);
            setStatus('idle');
            try {
                await deleteBooking(bookingId);
            } catch (err) {
                console.error("Failed to delete booking on error:", err);
            }
            alert(`Payment error occurred: ${error}. Your booking has been cancelled.`);
        };

        // Open the modal
        window.payhere.startPayment(payment);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 0. CHECK BLACKLIST
        if (currentUser) {
            const isBlacklisted = await checkUserBlacklist(currentUser.uid);
            if (isBlacklisted) {
                alert("🚫 ACCOUNT RESTRICTED\n\nYour account has been flagged due to multiple no-shows. You are temporarily restricted from making new bookings.\n\nPlease contact the administration at 077 123 4567 to resolve this issue.");
                return;
            }
        }

        // 1. Strict Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(userDetails.email)) {
            alert("Strict Evaluation: Please enter a VALID email address.");
            return;
        }

        // 2. Strict Phone Validation (International Format)
        const phoneRegex = /^\+[1-9]\d{7,14}$/;
        if (!phoneRegex.test(userDetails.Phone)) {
            alert("Strict Evaluation: Phone Number MUST include Country Code (e.g. +94...)");
            return;
        }

        // Final Validation: Check for overlaps before submitting
        const hasOverlap = selectedCourts.some(courtId => !isSlotAvailable(selectedTime, courtId));
        if (hasOverlap) {
            alert("One or more selected slots are no longer available. Please choose another time.");
            // Refresh slots to show latest status
            getAvailability(date).then(setSlots);
            return;
        }

        setStatus('submitting');

        // Calculate Amount: Rs. 900 per hour per court
        const courtCost = (900 * (duration / 60)) * selectedCourts.length;
        const racketCost = needRackets ? (Math.min(10, Math.max(1, racketQty)) * 150 * (duration / 60)) : 0;
        const shuttleCost = shuttleType !== 'none' && SHUTTLE_OPTIONS[shuttleType]
            ? (Math.min(10, Math.max(1, shuttleQty)) * SHUTTLE_OPTIONS[shuttleType].price)
            : 0;
        const totalAmount = courtCost + racketCost + shuttleCost;
        const amountFormatted = totalAmount.toFixed(2); // Ensure 2 decimal places string

        // 1. Create Booking in Firestore as 'PENDING_PAYMENT' (or 'CONFIRMED' if you trust the flow)
        // For simplicity, we are creating it as confirmed but you might want to create a temporary order
        // In a real app, you'd create an Order first, get an Order ID, then payment.

        // We'll generate a random Order ID for this demo
        const orderId = `CNS-${Date.now()}`;

        try {
            // Save booking details to Firestore (optional step before payment)
            try {
                // Determine user ID (use authenticated user's ID)
                const userId = currentUser.uid;

                // Update user phone in Firestore if it wasn't there and they provided it now
                if (!currentUser.phone && userDetails.Phone) {
                    try {
                        const userRef = doc(db, 'users', userId);
                        await updateDoc(userRef, {
                            phone: userDetails.Phone
                        });
                    } catch (err) {
                        console.warn("Failed to update user phone profile:", err);
                    }
                }

                // Final availability check before creating the formal request
                const stillAvailable = selectedCourts.every(c => isSlotAvailable(selectedTime, c));
                if (!stillAvailable) {
                    alert("Sorry, one or more of your selected slots have just been taken by another user. Please choose another time.");
                    setStep(1);
                    setStatus('idle');
                    return;
                }

                // Calculate End Time for Firestore record (used by potential automated email triggers)
                const [startH, startM] = selectedTime.split(':').map(Number);
                const totalMins = startH * 60 + startM + parseInt(duration);
                const endH = Math.floor(totalMins / 60);
                const endM = totalMins % 60;
                const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

                const result = await createBooking({
                    // CamelCase (App Core)
                    date,
                    startTime: selectedTime,
                    duration,
                    courts: selectedCourts,
                    userId: userId,
                    userName: userDetails.name,
                    userPhone: userDetails.Phone,
                    userEmail: userDetails.email,
                    amount: totalAmount,
                    orderId: orderId,
                    status: 'pending_payment',
                    
                    // Add-on Selections
                    needRackets,
                    racketQty: needRackets ? Math.min(10, Math.max(1, racketQty)) : 0,
                    shuttleType,
                    shuttleQty: shuttleType !== 'none' ? Math.min(10, Math.max(1, shuttleQty)) : 0,
                    courtCost,
                    racketCost,
                    shuttleCost,

                    // Snake_Case (Exhaustive fields for Automated Email Triggers)
                    order_id: orderId,
                    customer_name: userDetails.name,
                    phone: userDetails.Phone,
                    starting_time: selectedTime,
                    ending_time: endTimeStr,
                    courts_booked: selectedCourts.join(', '),
                    total_amount: totalAmount.toFixed(2),
                    user_id: userId,
                    user_name: userDetails.name,
                    user_phone: userDetails.Phone,
                    user_email: userDetails.email,
                    booking_date: date,
                    booking_time: `${selectedTime} - ${endTimeStr}`
                });
                console.log("Booking created with ID:", result.id, "OrderId:", orderId);
                
                // Trigger PayHere payment popup
                startPayHerePayment(
                    result.id, 
                    orderId, 
                    totalAmount, 
                    courtCost, 
                    racketCost, 
                    shuttleCost, 
                    needRackets, 
                    racketQty, 
                    shuttleType, 
                    shuttleQty, 
                    userDetails, 
                    date, 
                    selectedTime, 
                    duration, 
                    selectedCourts
                );
            } catch (e) {
                console.error("Booking submission error:", e);
                alert("Something went wrong with the booking. Please try again.");
                setStatus('idle');
            }
        } catch (error) {
            console.error("Outer Booking Error:", error);
            alert("Something went wrong. Please try again.");
            setStatus('idle');
        }
    };



    const finalTotal = ((900 * (duration / 60)) * selectedCourts.length) +
        (needRackets ? (racketQty * 150 * (duration / 60)) : 0) +
        (shuttleType !== 'none' && SHUTTLE_OPTIONS[shuttleType] ? (shuttleQty * SHUTTLE_OPTIONS[shuttleType].price) : 0);

    return (
        <section id="booking" className="section-padding" style={{ position: 'relative' }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-panel"
                    style={{
                        padding: 'clamp(1.5rem, 5vw, 3rem)',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 8vw, 3rem)' }}>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '1rem' }}>Book a Court</h2>
                        <p style={{ color: 'var(--brand-teal)', fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Select your preferred courts and time</p>
                    </div>

                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="booking-step-1"
                        >
                            {/* Controls */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 40vw, 250px), 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-gray)', fontWeight: '500' }}>Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)' }} />
                                        <input
                                            type="date"
                                            min={getLocalDate()}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="glass-input"
                                            style={{ paddingLeft: '3rem' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-gray)', fontWeight: '500' }}>Duration</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-gray)' }} />
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            className="glass-input"
                                            style={{ paddingLeft: '3rem', appearance: 'none' }}
                                        >
                                            {Array.from({ length: 18 }, (_, i) => (i + 1) * 30).map(min => (
                                                <option key={min} value={min}>
                                                    {min < 60 ? `${min} Minutes` : `${min / 60} ${min / 60 === 1 ? 'Hour' : 'Hours'}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Container for Mobile */}
                            <div style={{ overflowX: 'auto', paddingBottom: '1rem', margin: '0 -1rem' }}>
                                <div style={{ minWidth: '600px', padding: '0 1rem' }}>
                                    {/* Auto-scroll to selected time on mount (Web/Mobile friendly) */}
                                    <div ref={el => {
                                        if (el && selectedTime) {
                                            // Find the selected time element
                                            // Simple heuristic: find element by checking children text or ID
                                            // Since we map allTimes, we can't easily grab the node directly without refs map.
                                            // Alternatively, we just rely on user scrolling or maintain it.
                                            // Let's actually leave natural top scroll for now to avoid jumpiness.
                                        }
                                    }}></div>

                                    {/* Time Grid Header */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '80px 1fr 1fr 1fr',
                                        gap: '1rem',
                                        marginBottom: '1rem',
                                        padding: '0 1rem',
                                        color: 'var(--text-gray)',
                                        fontSize: '0.9rem',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase'
                                    }}>
                                        <div>Time</div>
                                        <div style={{ textAlign: 'center' }}>Court 1</div>
                                        <div style={{ textAlign: 'center' }}>Court 2</div>
                                        <div style={{ textAlign: 'center' }}>Court 3</div>
                                    </div>

                                    {/* Legend */}
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.2)', border: '1px solid #2ecc71' }}></div>
                                            <span style={{ color: '#aaa' }}>Available</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c' }}></div>
                                            <span style={{ color: '#aaa' }}>Booked</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(251, 202, 63, 0.2)', border: '1px solid #FBCA3F' }}></div>
                                            <span style={{ color: '#aaa' }}>Pending / Hold</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 105, 180, 0.2)', border: '1px solid #ff69b4' }}></div>
                                            <span style={{ color: '#aaa' }}>Permanent</span>
                                        </div>
                                        {isTournamentDate(date) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 165, 0, 0.2)', border: '1px solid #ffa500' }}></div>
                                                <span style={{ color: '#aaa' }}>Tournament</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Grid Scrollable Area */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.8rem',
                                        maxHeight: '450px',
                                        overflowY: 'auto',
                                        paddingRight: '10px',
                                        paddingLeft: '1rem', // Match Header Padding
                                        paddingBottom: '10px'
                                    }}>
                                        {allTimes.map((time) => (
                                            <div key={time} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ color: selectedTime === time ? 'var(--brand-teal)' : 'var(--text-gray)', fontWeight: selectedTime === time ? 'bold' : 'normal' }}>{time}</div>
                                                {[1, 2, 3].map(courtId => {
                                                    // 1. Strict Occupancy Check
                                                    const timeToMinutes = (t) => {
                                                        if (!t) return 0;
                                                        const str = String(t).toUpperCase().trim();
                                                        const isPM = str.includes('PM');
                                                        const isAM = str.includes('AM');
                                                        const clean = str.replace(/[A-Z\s]/g, '');
                                                        let [h, m] = clean.split(':').map(Number);
                                                        if (isNaN(m)) m = 0;
                                                        if (isPM && h < 12) h += 12;
                                                        if (isAM && h === 12) h = 0;
                                                        return h * 60 + m;
                                                    };
                                                    const slotStart = timeToMinutes(time);
                                                    const slotEnd = slotStart + 30;

                                                    let isOccupied = false;
                                                    let isPermanent = false;
                                                    let isHeld = false;

                                                    slots.forEach(booking => {
                                                        if (!booking.courts.some(c => Number(c) === Number(courtId))) return;
                                                        const bookingStart = timeToMinutes(booking.startTime);
                                                        const bookingEnd = bookingStart + booking.duration;

                                                        if (Math.max(slotStart, bookingStart) < Math.min(slotEnd, bookingEnd)) {
                                                            isOccupied = true;
                                                            if (booking.type === 'permanent') isPermanent = true;
                                                            
                                                            // Determine if it should be shown as Yellow "Hold" (for pending status)
                                                            if ((booking.status && booking.status.toLowerCase() === 'pending')) {
                                                                isHeld = true;
                                                            }
                                                        }
                                                    });

                                                    // Tournament Logic
                                                    let isTournament = false;
                                                    if (tournamentSettings[date]) {
                                                        const { start: tournamentStart, end: tournamentEnd } = tournamentSettings[date];
                                                        if (Math.max(slotStart, tournamentStart) < Math.min(slotEnd, tournamentEnd)) {
                                                            isTournament = true;
                                                            isOccupied = true; // Force occupied behavior
                                                        }
                                                    }

                                                    // 2. Fits Duration Check
                                                    const fitsDuration = isSlotAvailable(time, courtId);
                                                    const isSelected = selectedTime === time && selectedCourts.includes(courtId);

                                                    // Visual State Logic
                                                    let label = 'Available';
                                                    let bgColor = 'rgba(46, 204, 113, 0.1)';
                                                    let borderColor = 'rgba(46, 204, 113, 0.3)';
                                                    let textColor = '#2ecc71';
                                                    let cursor = 'pointer';

                                                    if (isOccupied) {
                                                        label = 'Booked';
                                                        bgColor = 'rgba(231, 76, 60, 0.15)';
                                                        borderColor = 'rgba(231, 76, 60, 0.3)';
                                                        textColor = '#e74c3c';
                                                        cursor = 'not-allowed';

                                                        // Pink Override for Permanent
                                                        if (isPermanent) {
                                                            label = 'Permanent';
                                                            bgColor = 'rgba(255, 105, 180, 0.15)';
                                                            borderColor = 'rgba(255, 105, 180, 0.4)';
                                                            textColor = '#ff69b4';
                                                        }

                                                        // Yellow Override for Pending / Hold
                                                        if (isHeld) {
                                                            label = 'Hold';
                                                            bgColor = 'rgba(251, 202, 63, 0.15)';
                                                            borderColor = 'rgba(251, 202, 63, 0.4)';
                                                            textColor = '#FBCA3F';
                                                        }

                                                        // Orange Override for Tournament
                                                        if (isTournament) {
                                                            label = 'Tournament';
                                                            bgColor = 'rgba(255, 165, 0, 0.15)';
                                                            borderColor = 'rgba(255, 165, 0, 0.4)';
                                                            textColor = '#ffa500';
                                                        }
                                                    }

                                                    // Select Override (manual selection in Step 1)
                                                    if (isSelected) {
                                                        if (!fitsDuration) {
                                                            label = 'Conflict';
                                                            bgColor = 'rgba(255, 68, 68, 0.2)';
                                                            borderColor = '#ff4444';
                                                            textColor = '#ff4444';
                                                        } else {
                                                            label = 'Selected';
                                                            bgColor = 'rgba(120, 220, 202, 0.15)';
                                                            borderColor = 'var(--brand-teal)';
                                                            textColor = 'var(--brand-teal)';
                                                        }
                                                        cursor = 'pointer';
                                                    }

                                                    return (
                                                        <motion.button
                                                            key={courtId}
                                                            disabled={isOccupied && !isSelected}
                                                            whileHover={!isOccupied ? { scale: 1.02 } : {}}
                                                            whileTap={!isOccupied ? { scale: 0.95 } : {}}
                                                            onClick={async () => {
                                                                if (selectedTime !== time) {
                                                                    if (!isOccupied) {
                                                                        setSelectedTime(time);
                                                                        setSelectedCourts([courtId]);
                                                                    }
                                                                } else {
                                                                    handleCourtToggle(courtId);
                                                                }
                                                            }}
                                                            style={{
                                                                padding: '0.8rem',
                                                                borderRadius: '8px',
                                                                border: isSelected ? (label === 'Conflict' ? '2px solid #ff4444' : '2px solid var(--brand-teal)') : '1px solid',
                                                                borderColor: borderColor,
                                                                backgroundColor: bgColor,
                                                                color: textColor,
                                                                cursor: cursor,
                                                                fontSize: '0.8rem',
                                                                fontWeight: isSelected ? '600' : 'normal',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: isSelected ? `0 0 15px ${borderColor}` : 'none',
                                                                opacity: isOccupied && !isSelected ? 0.8 : 1,
                                                                height: '100%',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                        >
                                                            {label}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* visual conflict warning */}
                            {selectedTime && selectedCourts.some(c => !isSlotAvailable(selectedTime, c)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        color: '#ff4444',
                                        background: 'rgba(255, 68, 68, 0.1)',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        marginTop: '1rem',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        textAlign: 'center',
                                        fontWeight: '500'
                                    }}
                                >
                                    ⚠️ Selected time overlaps with an existing booking. Please shorten duration or select another time.
                                </motion.div>
                            )}

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    disabled={selectedCourts.length === 0 || selectedCourts.some(c => !isSlotAvailable(selectedTime, c)) || status === 'submitting'}
                                    onClick={handleNextStep}
                                    className="btn-gradient"
                                    style={{
                                        padding: '1rem 2rem',
                                        borderRadius: '50px',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        cursor: (selectedCourts.length === 0 || selectedCourts.some(c => !isSlotAvailable(selectedTime, c))) ? 'not-allowed' : 'pointer',
                                        opacity: (selectedCourts.length === 0 || selectedCourts.some(c => !isSlotAvailable(selectedTime, c))) ? 0.5 : 1,
                                        boxShadow: selectedCourts.length === 0 ? 'none' : '0 10px 30px rgba(120, 220, 202, 0.3)',
                                        filter: selectedCourts.some(c => !isSlotAvailable(selectedTime, c)) ? 'grayscale(1)' : 'none'
                                    }}
                                >
                                    Next Details →
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleSubmit}
                        >
                            <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', textAlign: 'center' }}>Confirm Details</h3>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                marginBottom: '2.5rem',
                                border: '1px solid rgba(120, 220, 202, 0.2)',
                                display: 'grid',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>Date</span>
                                    <span style={{ fontWeight: 600 }}>{date}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>Time</span>
                                    <span style={{ fontWeight: 600 }}>{selectedTime} ({duration} mins)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>Selected Courts</span>
                                    <span style={{ color: 'var(--brand-teal)', fontWeight: 600 }}>{selectedCourts.map(c => `Court ${c}`).join(', ')}</span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.8rem', marginLeft: '0.5rem' }}>Full Name</label>
                                <input
                                    required
                                    type="text"
                                    className="glass-input"
                                    value={userDetails.name}
                                    onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.8rem', marginLeft: '0.5rem' }}>Email Address <span style={{ color: '#ff4444' }}>*</span></label>
                                <input
                                    required
                                    type="email"
                                    className="glass-input"
                                    value={userDetails.email}
                                    onChange={e => setUserDetails({ ...userDetails, email: e.target.value })}
                                    placeholder="example@domain.com"
                                    style={{
                                        borderColor: userDetails.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userDetails.email) ? '#ff4444' : 'rgba(255,255,255,0.1)'
                                    }}
                                />
                                {userDetails.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(userDetails.email) && (
                                    <span style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block', marginLeft: '0.5rem' }}>
                                        Please enter a valid email address (e.g. user@example.com)
                                    </span>
                                )}
                            </div>

                            <div className="form-group" style={{ marginBottom: '3rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.8rem', marginLeft: '0.5rem' }}>
                                    Phone Number <span style={{ color: '#ff4444' }}>*</span>
                                    <span style={{ fontSize: '0.85em', color: 'var(--text-gray)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                                        (with Country Code, e.g. +94)
                                    </span>
                                </label>
                                <input
                                    required
                                    type="tel"
                                    className="glass-input"
                                    style={{
                                        borderColor: userDetails.Phone && !/^\+[1-9]\d{7,14}$/.test(userDetails.Phone) ? '#ff4444' : 'rgba(255,255,255,0.1)'
                                    }}
                                    value={userDetails.Phone}
                                    onChange={e => {
                                        // Allow + only at start, then digits
                                        let val = e.target.value;
                                        if (val.length > 0 && val[0] !== '+') {
                                            val = '+' + val.replace(/\D/g, '');
                                        } else {
                                            val = val.replace(/[^0-9+]/g, '');
                                            // Ensure only one plus at start
                                            if (val.indexOf('+', 1) !== -1) {
                                                val = val.substring(0, 1) + val.substring(1).replace(/\+/g, '');
                                            }
                                        }
                                        setUserDetails({ ...userDetails, Phone: val });
                                    }}
                                    placeholder="+94771234567"
                                />
                                {userDetails.Phone && !/^\+[1-9]\d{7,14}$/.test(userDetails.Phone) && (
                                    <span style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block', marginLeft: '0.5rem' }}>
                                        Must be a valid international number starting with + (e.g. +94...)
                                    </span>
                                )}
                                {userDetails.Phone && /^\+[1-9]\d{7,14}$/.test(userDetails.Phone) && (
                                    <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <a
                                            href={`https://wa.me/${userDetails.Phone.replace('+', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                fontSize: '0.9rem',
                                                color: '#25D366',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <i className="fab fa-whatsapp"></i> Verify on WhatsApp →
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Equipment & Shuttlecock Options */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '20px',
                                padding: '1.8rem',
                                marginBottom: '2.5rem'
                            }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--brand-teal)', fontWeight: '600' }}>
                                    Optional Add-ons
                                </h3>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '1.5rem'
                                }}>
                                    {/* Racket Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        onClick={() => setNeedRackets(!needRackets)}
                                        style={{
                                            background: needRackets ? 'rgba(120, 220, 202, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                                            border: needRackets ? '2px solid var(--brand-teal)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
                                            boxShadow: needRackets ? '0 0 20px rgba(120, 220, 202, 0.1)' : 'none',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: needRackets ? 'var(--brand-teal)' : 'rgba(255, 255, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: needRackets ? 'var(--brand-teal)' : 'transparent',
                                            transition: 'all 0.2s',
                                            position: 'absolute',
                                            top: '1.2rem',
                                            right: '1.2rem'
                                        }}>
                                            {needRackets && <CheckCircle size={14} color="#000" strokeWidth={3} />}
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="15.5" cy="8.5" r="5.5" />
                                                    <path d="M11.5 12.5L3 21" />
                                                    <path d="M15 6v5" />
                                                    <path d="M13 8h5" />
                                                </svg>
                                                <span style={{ color: 'white', fontWeight: '600', fontSize: '1.05rem' }}>Racket Rental</span>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', margin: 0, paddingRight: '24px' }}>
                                                Rent premium rackets for your session. <br /><strong>Rs. 150 per racket per hour.</strong>
                                            </p>
                                        </div>

                                        <AnimatePresence>
                                            {needRackets && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '15px', overflow: 'hidden' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>Quantity:</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '30px', padding: '4px', border: '1px solid rgba(255,255,255,0.15)' }}>
                                                        <button
                                                            type="button"
                                                            disabled={racketQty <= 1}
                                                            onClick={(e) => { e.stopPropagation(); setRacketQty(Math.max(1, racketQty - 1)); }}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: racketQty <= 1 ? 'transparent' : 'rgba(255,255,255,0.1)',
                                                                color: racketQty <= 1 ? 'rgba(255,255,255,0.3)' : 'white',
                                                                cursor: racketQty <= 1 ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 'bold',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            -
                                                        </button>
                                                        <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>
                                                            {racketQty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={racketQty >= 10}
                                                            onClick={(e) => { e.stopPropagation(); setRacketQty(Math.min(10, racketQty + 1)); }}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                background: racketQty >= 10 ? 'transparent' : 'rgba(255,255,255,0.1)',
                                                                color: racketQty >= 10 ? 'rgba(255,255,255,0.3)' : 'white',
                                                                cursor: racketQty >= 10 ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '1.2rem',
                                                                fontWeight: 'bold',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    {/* Shuttlecock Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        onClick={() => setShuttleType(shuttleType === 'none' ? 'yonex_mavis_600' : 'none')}
                                        style={{
                                            background: shuttleType !== 'none' ? 'rgba(255, 105, 180, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                                            border: shuttleType !== 'none' ? '2px solid var(--brand-pink)' : '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '16px',
                                            padding: '1.5rem',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.2s, background-color 0.2s, box-shadow 0.2s',
                                            boxShadow: shuttleType !== 'none' ? '0 0 20px rgba(255, 105, 180, 0.1)' : 'none',
                                            position: 'relative',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: shuttleType !== 'none' ? 'var(--brand-pink)' : 'rgba(255, 255, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: shuttleType !== 'none' ? 'var(--brand-pink)' : 'transparent',
                                            transition: 'all 0.2s',
                                            position: 'absolute',
                                            top: '1.2rem',
                                            right: '1.2rem'
                                        }}>
                                            {shuttleType !== 'none' && <CheckCircle size={14} color="#000" strokeWidth={3} />}
                                        </div>

                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-pink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M7 10l5-7 5 7" />
                                                    <path d="M12 3v17" />
                                                    <path d="M12 20a4 4 0 0 1-4-4v-6h8v6a4 4 0 0 1-4 4z" />
                                                </svg>
                                                <span style={{ color: 'white', fontWeight: '600', fontSize: '1.05rem' }}>Shuttlecocks <span style={{ fontSize: '0.8rem', color: 'var(--brand-pink)' }}>(For Sale)</span></span>
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', margin: 0, paddingRight: '24px' }}>
                                                Purchase non-reusable shuttlecocks for your game.
                                            </p>
                                        </div>

                                        <AnimatePresence>
                                            {shuttleType !== 'none' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    style={{ marginTop: '1rem', overflow: 'hidden' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                                                        {Object.entries(SHUTTLE_OPTIONS).filter(([key]) => key !== 'none').map(([key, opt]) => {
                                                            const isSelected = shuttleType === key;
                                                            return (
                                                                <motion.div
                                                                    key={key}
                                                                    whileHover={{ scale: 1.02 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setShuttleType(key);
                                                                    }}
                                                                    style={{
                                                                        background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                                                                        border: isSelected ? '1.5px solid var(--brand-pink)' : '1px solid rgba(255, 255, 255, 0.1)',
                                                                        borderRadius: '10px',
                                                                        padding: '0.5rem',
                                                                        textAlign: 'center',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.8rem',
                                                                        color: isSelected ? 'white' : 'var(--text-gray)',
                                                                        transition: 'all 0.2s',
                                                                        boxShadow: isSelected ? '0 0 10px rgba(255, 105, 180, 0.1)' : 'none',
                                                                        fontWeight: isSelected ? '600' : 'normal'
                                                                    }}
                                                                >
                                                                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                                        {opt.name.replace(' (Nylon)', '').replace(' (Feather)', '')}
                                                                    </div>
                                                                    <div style={{ fontSize: '0.7rem', color: isSelected ? 'var(--brand-pink)' : 'var(--text-gray)', marginTop: '2px', fontWeight: 'bold' }}>
                                                                        Rs. {opt.price}
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-gray)' }}>Quantity:</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '30px', padding: '4px', border: '1px solid rgba(255,255,255,0.15)' }}>
                                                            <button
                                                                type="button"
                                                                disabled={shuttleQty <= 1}
                                                                onClick={(e) => { e.stopPropagation(); setShuttleQty(Math.max(1, shuttleQty - 1)); }}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    border: 'none',
                                                                    background: shuttleQty <= 1 ? 'transparent' : 'rgba(255,255,255,0.1)',
                                                                    color: shuttleQty <= 1 ? 'rgba(255,255,255,0.3)' : 'white',
                                                                    cursor: shuttleQty <= 1 ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '1.2rem',
                                                                    fontWeight: 'bold',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                -
                                                            </button>
                                                            <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem', color: 'white' }}>
                                                                {shuttleQty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={shuttleQty >= 10}
                                                                onClick={(e) => { e.stopPropagation(); setShuttleQty(Math.min(10, shuttleQty + 1)); }}
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    borderRadius: '50%',
                                                                    border: 'none',
                                                                    background: shuttleQty >= 10 ? 'transparent' : 'rgba(255,255,255,0.1)',
                                                                    color: shuttleQty >= 10 ? 'rgba(255,255,255,0.3)' : 'white',
                                                                    cursor: shuttleQty >= 10 ? 'not-allowed' : 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    fontSize: '1.2rem',
                                                                    fontWeight: 'bold',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Detailed Price Summary Box */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '20px',
                                padding: '1.8rem',
                                marginBottom: '2.5rem',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <h4 style={{ fontSize: '1.05rem', color: 'white', marginBottom: '1.2rem', fontWeight: '600' }}>
                                    Payment Summary
                                </h4>
                                
                                {/* Court Cost */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.92rem' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>
                                        Court Rental (Rs. 900/hr × {duration / 60} hrs × {selectedCourts.length} {selectedCourts.length === 1 ? 'court' : 'courts'})
                                    </span>
                                    <span style={{ color: 'white', fontWeight: '500' }}>
                                        Rs. {((900 * (duration / 60)) * selectedCourts.length).toFixed(2)}
                                    </span>
                                </div>

                                {/* Racket Rent Cost */}
                                <AnimatePresence>
                                    {needRackets && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.92rem', overflow: 'hidden' }}
                                        >
                                            <span style={{ color: 'var(--text-gray)' }}>
                                                Racket Rent (Rs. 150/hr × {racketQty} rackets × {duration / 60} hrs)
                                            </span>
                                            <span style={{ color: 'white', fontWeight: '500' }}>
                                                Rs. {(racketQty * 150 * (duration / 60)).toFixed(2)}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Shuttlecock Cost */}
                                <AnimatePresence>
                                    {shuttleType !== 'none' && SHUTTLE_OPTIONS[shuttleType] && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.92rem', overflow: 'hidden' }}
                                        >
                                            <span style={{ color: 'var(--text-gray)' }}>
                                                Shuttlecock Purchase ({shuttleQty} × {SHUTTLE_OPTIONS[shuttleType].name} @ Rs. {SHUTTLE_OPTIONS[shuttleType].price} each)
                                            </span>
                                            <span style={{ color: 'white', fontWeight: '500' }}>
                                                Rs. {(shuttleQty * SHUTTLE_OPTIONS[shuttleType].price).toFixed(2)}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div style={{
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                    marginTop: '1.2rem',
                                    paddingTop: '1.2rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>Total Final Payment</span>
                                    <motion.span
                                        key={finalTotal}
                                        initial={{ scale: 0.95, opacity: 0.8 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ color: 'var(--brand-teal)', fontSize: '1.5rem', fontWeight: '800', display: 'inline-block' }}
                                    >
                                        Rs. {finalTotal.toFixed(2)}
                                    </motion.span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        // Manually go back in history to keep browser sync
                                        window.history.back();
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        backgroundColor: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white',
                                        borderRadius: '50px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.target.style.background = 'transparent'}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="btn-gradient"
                                    style={{
                                        flex: 2,
                                        padding: '1rem',
                                        borderRadius: '50px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 10px 30px rgba(120, 220, 202, 0.3)'
                                    }}
                                >
                                    {status === 'submitting' ? 'Processing...' : 'Confirm Booking'}
                                </button>
                            </div>
                        </motion.form>
                    )}

                </motion.div>
            </div>
        </section>
    );
};

export default BookingForm;
