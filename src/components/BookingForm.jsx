import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { getAvailability, createBooking } from '../services/bookingService';
import { Check, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const BookingForm = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [status, setStatus] = useState('idle');

    // Selection State
    const [selectedTime, setSelectedTime] = useState(null);
    const [duration, setDuration] = useState(60);
    const [selectedCourts, setSelectedCourts] = useState([]);
    const [userDetails, setUserDetails] = useState({ name: '', Phone: '' });

    // Auto-fill user details when logged in
    useEffect(() => {
        if (currentUser) {
            setUserDetails({
                name: currentUser.displayName || currentUser.name || '',
                Phone: currentUser.phone || ''
            });
        }
    }, [currentUser]);

    if (!currentUser) {
        return (
            <section id="booking" className="section-padding">
                <div className="container" style={{ textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="glass-panel"
                        style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}
                    >
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Login Required</h2>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
                            You must be logged in to book a court. This helps us manage bookings and contact you if needed.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link to="/login" className="btn-gradient" style={{ padding: '0.8rem 2rem', borderRadius: '50px', textDecoration: 'none', color: '#000', fontWeight: 'bold' }}>
                                Login
                            </Link>
                            <Link to="/register" style={{ padding: '0.8rem 2rem', border: '1px solid var(--brand-teal)', borderRadius: '50px', textDecoration: 'none', color: 'var(--brand-teal)', fontWeight: 'bold' }}>
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
        const today = new Date().toISOString().split('T')[0];

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

    useEffect(() => {
        setStatus('loading');
        getAvailability(date).then(data => {
            setSlots(data);
            setStatus('idle');
        });
    }, [date]);

    const isSlotAvailable = (time, courtId) => {
        // Check if this specific time + court is blocked by any booking
        // Simple logic: if a booking starts at 8:00 for 60 mins, it blocks 8:00 and 8:30
        return !slots.some(booking => {
            if (!booking.courts.includes(courtId)) return false;

            const bookingStart = parseInt(booking.startTime.replace(':', ''));
            const timeNum = parseInt(time.replace(':', ''));

            // Calculate end time of booking
            const bookHour = parseInt(booking.startTime.split(':')[0]);
            const bookMin = parseInt(booking.startTime.split(':')[1]);
            const totalBookMin = bookHour * 60 + bookMin + booking.duration;
            const bookingEndNum = parseInt(`${Math.floor(totalBookMin / 60)}${totalBookMin % 60 === 0 ? '00' : '30'}`);

            // Check overlap
            return timeNum >= bookingStart && timeNum < bookingEndNum;
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

        if (userDetails.Phone.length !== 10) {
            alert("Please enter a valid 10-digit phone number.");
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
        const orderId = `ORD-${Date.now()}`;

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
                    amount: totalAmount, // Store number in DB
                    orderId: orderId,
                    status: 'confirmed'
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
                time: `Start: ${selectedTime} | End: ${endTime}`, // Explicit Start & End
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
                        padding: '3rem',
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
                                            min={new Date().toISOString().split('T')[0]}
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

                            {/* Time Grid Scrollable Area */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.8rem',
                                maxHeight: '450px',
                                overflowY: 'auto',
                                paddingRight: '10px',
                                paddingBottom: '10px'
                            }}>
                                {allTimes.map((time) => (
                                    <div key={time} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ color: selectedTime === time ? 'var(--brand-teal)' : 'var(--text-gray)', fontWeight: selectedTime === time ? 'bold' : 'normal' }}>{time}</div>
                                        {[1, 2, 3].map(courtId => {
                                            const available = isSlotAvailable(time, courtId);
                                            const isSelected = selectedTime === time && selectedCourts.includes(courtId);

                                            return (
                                                <motion.button
                                                    key={courtId}
                                                    disabled={!available}
                                                    whileHover={available ? { scale: 1.02 } : {}}
                                                    whileTap={available ? { scale: 0.95 } : {}}
                                                    onClick={() => {
                                                        if (selectedTime !== time) {
                                                            setSelectedTime(time);
                                                            setSelectedCourts([courtId]);
                                                        } else {
                                                            handleCourtToggle(courtId);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '1rem',
                                                        borderRadius: '12px',
                                                        border: isSelected ? '1px solid var(--brand-teal)' : '1px solid transparent',
                                                        backgroundColor: isSelected ? 'rgba(120, 220, 202, 0.15)' : (available ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)'),
                                                        color: available ? (isSelected ? 'var(--brand-teal)' : 'white') : 'rgba(255,255,255,0.2)',
                                                        cursor: available ? 'pointer' : 'not-allowed',
                                                        fontSize: '0.9rem',
                                                        fontWeight: isSelected ? '600' : 'normal',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: isSelected ? '0 0 15px rgba(120, 220, 202, 0.1)' : 'none'
                                                    }}
                                                >
                                                    {available ? (isSelected ? 'Selected' : 'Available') : 'Booked'}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    disabled={selectedCourts.length === 0}
                                    onClick={() => setStep(2)}
                                    className="btn-gradient"
                                    style={{
                                        padding: '1rem 3.5rem',
                                        borderRadius: '50px',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        cursor: selectedCourts.length === 0 ? 'not-allowed' : 'pointer',
                                        opacity: selectedCourts.length === 0 ? 0.5 : 1,
                                        boxShadow: selectedCourts.length === 0 ? 'none' : '0 10px 30px rgba(120, 220, 202, 0.3)'
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

                            <div className="form-group" style={{ marginBottom: '3rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.8rem', marginLeft: '0.5rem' }}>Phone Number <span style={{ fontSize: '0.85em', color: 'var(--text-gray)' }}>(for WhatsApp)</span></label>
                                <input
                                    required
                                    type="tel"
                                    maxLength="10"
                                    pattern="[0-9]{10}"
                                    className="glass-input"
                                    style={{
                                        borderColor: userDetails.Phone && !/^\d{10}$/.test(userDetails.Phone) ? '#ff4444' : 'rgba(255,255,255,0.1)'
                                    }}
                                    value={userDetails.Phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setUserDetails({ ...userDetails, Phone: val });
                                    }}
                                    placeholder="077xxxxxxx (10 digits)"
                                />
                                {userDetails.Phone && userDetails.Phone.length === 10 && (
                                    <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <a
                                            href={`https://wa.me/94${userDetails.Phone.substring(1)}`}
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
                                            <i className="fab fa-whatsapp"></i> Test on WhatsApp →
                                        </a>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>Click to verify if this is a valid WhatsApp number</span>
                                    </div>
                                )}
                                {userDetails.Phone && userDetails.Phone.length !== 10 && (
                                    <span style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block', marginLeft: '0.5rem' }}>
                                        Please enter a valid 10-digit mobile number
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
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

                    {/* Step 3 Removed - Redirects to PayHere */}

                </motion.div>
            </div>
        </section>
    );
};

export default BookingForm;
