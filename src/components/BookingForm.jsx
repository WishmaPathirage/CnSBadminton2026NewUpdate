import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { updateDoc, doc } from 'firebase/firestore';
import { getAvailability, createBooking } from '../services/bookingService';
import { getAuth } from 'firebase/auth'; // Import getAuth
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

const BookingForm = () => {
    // Helper for Local Date (YYYY-MM-DD) - Forced to Sri Lanka Time (UTC+5:30)
    const getLocalDate = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const slTime = new Date(utc + (3600000 * 5.5)); // Add 5.5 hours for SL

        const year = slTime.getFullYear();
        const month = String(slTime.getMonth() + 1).padStart(2, '0');
        const day = String(slTime.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getLocalDate());
    const [duration, setDuration] = useState(30); // Default 30 minutes
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedCourts, setSelectedCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [userDetails, setUserDetails] = useState({ name: '', email: '', Phone: '' });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [step, setStep] = useState(1); // 1: Select Time, 2: Details, 3: Payment/Success

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
            // If user hits Back Button
            if (step === 2) {
                // Prevent default back (which might leave site) if we just want to go to Step 1
                // But history.back() already happened, so we just update UI
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
        setStatus('loading');
        getAvailability(date).then(data => {
            setSlots(data);
            setStatus('idle');
        });
    }, [date]);

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
            const now = new Date();
            const currentHour = now.getHours();
            const currentMin = now.getMinutes();

            return times.filter(t => {
                const [h, m] = t.split(':').map(Number);
                // Allow booking if slot IS in the future
                // e.g. if now is 9:12, 9:30 is allowed. 9:00 is not.
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
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const proposedStart = timeToMinutes(time);
        const proposedEnd = proposedStart + duration;

        return !slots.some(booking => {
            if (!booking.courts.includes(courtId)) return false;

            const bookingStart = timeToMinutes(booking.startTime);
            const bookingEnd = bookingStart + booking.duration;

            // Check for overlap:
            // Two time ranges (StartA, EndA) and (StartB, EndB) overlap if:
            // StartA < EndB && EndA > StartB
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

    const handleSubmit = async (e) => {
        e.preventDefault();

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
        // Duration is in minutes (30, 60, 90, 120)
        const pricePerHour = 900;
        const totalAmount = (pricePerHour * (duration / 60)) * selectedCourts.length;
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

                await createBooking({
                    date,
                    startTime: selectedTime,
                    duration,
                    courts: selectedCourts,
                    userId: userId, // Link booking to user
                    userName: userDetails.name,
                    userPhone: userDetails.Phone,
                    userEmail: userDetails.email, // Save strictly validated email
                    amount: totalAmount, // Store number in DB
                    orderId: orderId,
                    status: 'pending' // PREVIOUSLY 'confirmed'. Changed to 'pending' to require Admin Approval.
                });
            } catch (e) {
                console.warn("Booking save failed (Demo mode - proceeding to payment):", e);
            }


            // Calculate End Time
            const [startHour, startMin] = selectedTime.split(':').map(Number);
            const totalStartMins = startHour * 60 + startMin;
            const totalEndMins = totalStartMins + duration;
            const endHour = Math.floor(totalEndMins / 60);
            const endMin = totalEndMins % 60;
            const endTime = `${endHour < 10 ? '0' + endHour : endHour}:${endMin < 10 ? '0' + endMin : endMin}`;

            // 3. Send Admin Email Notification (Pre-payment)
            const templateParams = {
                order_id: orderId,
                customer_name: userDetails.name,
                customer_phone: userDetails.Phone,
                date: date,

                // Sending multiple variations to match potential template variables
                start_time: selectedTime,
                startTime: selectedTime,
                starting_time: selectedTime,

                end_time: endTime,
                endTime: endTime,
                ending_time: endTime,

                time: `Start: ${selectedTime} | End: ${endTime}`,
                duration: duration + " mins",
                courts: selectedCourts.map(c => `Court ${c}`).join(', '),
                amount: `Rs. ${amountFormatted}`,
            };

            try {
                // Debugging: Alert to confirm attempt
                // alert("Attempting to send email..."); 

                await emailjs.send('service_i25io04', 'template_bv3pwbr', templateParams, 'cmyBcHcHxEP2ggwV3');
                console.log("Admin Notification Sent!");
                // alert("Email Sent Successfully!"); // Uncomment if you want to verify success
            } catch (emailErr) {
                console.error("Failed to send admin notification:", emailErr);
                alert("Email Notification Failed: " + JSON.stringify(emailErr));
                // We still proceed to payment, but now user knows email failed
            }

            // 3. Redirect to Success Page directly
            navigate(`/payment/success?order_id=${orderId}`);

        } catch (error) {
            console.error("Booking Error:", error);
            alert("Something went wrong. Please try again.");
            setStatus('idle');
        }
    };



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
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Book a Court</h2>
                        <p style={{ color: 'var(--brand-teal)', fontSize: '1.1rem' }}>Select your preferred courts and time</p>
                    </div>

                    {step === 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="booking-step-1"
                        >
                            {/* Controls */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
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
                                            <option value={30}>30 Minutes</option>
                                            <option value={60}>1 Hour</option>
                                            <option value={90}>1.5 Hours</option>
                                            <option value={120}>2 Hours</option>
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
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 105, 180, 0.2)', border: '1px solid #ff69b4' }}></div>
                                            <span style={{ color: '#aaa' }}>Permanent (Recurring)</span>
                                        </div>
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
                                                        const [h, m] = t.split(':').map(Number);
                                                        return h * 60 + m;
                                                    };
                                                    const slotStart = timeToMinutes(time);
                                                    const slotEnd = slotStart + 30;

                                                    let isOccupied = false;
                                                    let isPermanent = false;

                                                    slots.forEach(booking => {
                                                        if (!booking.courts.includes(courtId)) return;
                                                        const bookingStart = timeToMinutes(booking.startTime);
                                                        const bookingEnd = bookingStart + booking.duration;

                                                        if (Math.max(slotStart, bookingStart) < Math.min(slotEnd, bookingEnd)) {
                                                            isOccupied = true;
                                                            if (booking.type === 'permanent') isPermanent = true;
                                                        }
                                                    });

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
                                                            label = 'Permanent'; // Or 'Booked' if preferred, but user said 'Pink - Permanent'
                                                            bgColor = 'rgba(255, 105, 180, 0.15)'; // Pink bg
                                                            borderColor = 'rgba(255, 105, 180, 0.4)'; // Pink border
                                                            textColor = '#ff69b4'; // HotPink text
                                                        }
                                                    }

                                                    // Select Override
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
                                                            onClick={() => {
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
                                    disabled={selectedCourts.length === 0 || selectedCourts.some(c => !isSlotAvailable(selectedTime, c))}
                                    onClick={() => setStep(2)}
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

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        // Manually go back in history to keep sync
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
