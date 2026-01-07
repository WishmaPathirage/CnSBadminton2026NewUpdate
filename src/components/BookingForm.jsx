import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAvailability, createBooking } from '../services/bookingService';
import { Check, Clock, Calendar } from 'lucide-react';
import { PAYHERE_MERCHANT_ID, PAYHERE_URL, generatePaymentHash } from '../utils/payhereConfig';

const BookingForm = () => {

    const [step, setStep] = useState(1);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [status, setStatus] = useState('idle');

    // Selection State
    const [selectedTime, setSelectedTime] = useState(null);
    const [duration, setDuration] = useState(60);
    const [selectedCourts, setSelectedCourts] = useState([]);
    const [userDetails, setUserDetails] = useState({ name: '', Phone: '' });



    // Generate time slots 6am to 10pm
    const generateTimeSlots = () => {
        const times = [];
        for (let i = 6; i < 22; i++) {
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
                // Allow booking only if slot is at least 30 mins in future
                // roughly: if current is 9:15, allow 10:00 onwards
                if (h > currentHour) return true;
                if (h === currentHour && m > currentMin + 30) return true;
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

        // Calculate Amount: Rs. 2500 per hour per court
        // Duration is in minutes (30, 60, 90, 120)
        const pricePerHour = 2500;
        const totalAmount = (pricePerHour * (duration / 60)) * selectedCourts.length;

        // 1. Create Booking in Firestore as 'PENDING_PAYMENT' (or 'CONFIRMED' if you trust the flow)
        // For simplicity, we are creating it as confirmed but you might want to create a temporary order
        // In a real app, you'd create an Order first, get an Order ID, then payment.

        // We'll generate a random Order ID for this demo
        const orderId = `ORD-${Date.now()}`;

        try {
            // Save booking details to Firestore (optional step before payment)
            try {
                await createBooking({
                    date,
                    startTime: selectedTime,
                    duration,
                    courts: selectedCourts,
                    userName: userDetails.name,
                    userPhone: userDetails.Phone,
                    amount: totalAmount,
                    orderId: orderId,
                    status: 'PENDING'
                });
            } catch (e) {
                console.warn("Booking save failed (Demo mode - proceeding to payment):", e);
            }

            // 2. Generate PayHere Hash
            const hash = generatePaymentHash(orderId, totalAmount);

            // 3. Create a form dynamically and submit it to PayHere
            const form = document.createElement('form');
            form.setAttribute('method', 'POST');
            form.setAttribute('action', PAYHERE_URL);
            form.setAttribute('style', 'display: none;');

            const params = {
                merchant_id: PAYHERE_MERCHANT_ID,
                return_url: `${window.location.origin}/payment/success`,
                cancel_url: `${window.location.origin}/payment/cancel`,
                notify_url: `${window.location.origin}/api/payhere/notify`, // This would need a real backend
                order_id: orderId,
                items: `Court Booking - ${date} @ ${selectedTime}`,
                currency: 'LKR',
                amount: totalAmount.toFixed(2),
                first_name: userDetails.name.split(' ')[0],
                last_name: userDetails.name.split(' ')[1] || '',
                email: 'user@example.com', // Optional: collect email
                phone: userDetails.Phone,
                address: 'No 123, Badminton St',
                city: 'Colombo',
                country: 'Sri Lanka',
                hash: hash
            };

            for (const key in params) {
                const input = document.createElement('input');
                input.setAttribute('type', 'hidden');
                input.setAttribute('name', key);
                input.setAttribute('value', params[key]);
                form.appendChild(input);
            }

            document.body.appendChild(form);
            form.submit();

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
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '20px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Book a Court</h2>
                        <p style={{ color: 'var(--primary-green)' }}>Select your preferred courts and time</p>
                    </div>

                    {step === 1 && (
                        <div className="booking-step-1">
                            {/* Controls */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-gray)' }}>Date</label>
                                    <div style={{ position: 'relative' }}>
                                        <Calendar size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-gray)' }} />
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-gray)' }}>Duration</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-gray)' }} />
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value))}
                                            style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                                        >
                                            <option value={30}>30 Minutes</option>
                                            <option value={60}>1 Hour</option>
                                            <option value={90}>1.5 Hours</option>
                                            <option value={120}>2 Hours</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Time Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    <div>Time</div>
                                    <div style={{ textAlign: 'center' }}>Court 1</div>
                                    <div style={{ textAlign: 'center' }}>Court 2</div>
                                    <div style={{ textAlign: 'center' }}>Court 3</div>
                                </div>

                                {allTimes.map((time) => (
                                    <div key={time} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ color: selectedTime === time ? 'var(--primary-green)' : 'var(--text-gray)' }}>{time}</div>
                                        {[1, 2, 3].map(courtId => {
                                            const available = isSlotAvailable(time, courtId);
                                            const isSelected = selectedTime === time && selectedCourts.includes(courtId);

                                            return (
                                                <motion.button
                                                    key={courtId}
                                                    disabled={!available}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        if (selectedTime !== time) {
                                                            setSelectedTime(time);
                                                            setSelectedCourts([courtId]);
                                                        } else {
                                                            handleCourtToggle(courtId);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '0.8rem',
                                                        borderRadius: '8px',
                                                        border: isSelected ? '2px solid var(--primary-green)' : '1px solid rgba(255,255,255,0.1)',
                                                        backgroundColor: isSelected ? 'rgba(46, 204, 113, 0.2)' : (available ? 'rgba(255,255,255,0.05)' : '#333'),
                                                        color: available ? 'white' : '#555',
                                                        cursor: available ? 'pointer' : 'not-allowed',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {available ? (isSelected ? 'Selected' : 'Available') : 'Booked'}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    disabled={selectedCourts.length === 0}
                                    onClick={() => setStep(2)}
                                    style={{
                                        backgroundColor: selectedCourts.length === 0 ? 'gray' : 'var(--primary-green)',
                                        color: '#000',
                                        padding: '1rem 3rem',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: selectedCourts.length === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Next Details →
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleSubmit}
                        >
                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Confirm Booking Details</h3>

                            <div style={{ background: 'rgba(46, 204, 113, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>Date:</span>
                                    <span>{date}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>Time:</span>
                                    <span>{selectedTime} ({duration} mins)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-gray)' }}>Courts:</span>
                                    <span>{selectedCourts.map(c => `Court ${c}`).join(', ')}</span>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                                <input
                                    required
                                    type="text"
                                    style={inputStyle}
                                    value={userDetails.name}
                                    onChange={e => setUserDetails({ ...userDetails, name: e.target.value })}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number (for WhatsApp)</label>
                                <input
                                    required
                                    type="tel"
                                    maxLength="10"
                                    pattern="[0-9]{10}"
                                    style={{
                                        ...inputStyle,
                                        borderColor: userDetails.Phone && !/^\d{10}$/.test(userDetails.Phone) ? '#ff4444' : 'rgba(255,255,255,0.1)'
                                    }}
                                    value={userDetails.Phone}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setUserDetails({ ...userDetails, Phone: val });
                                    }}
                                    placeholder="077xxxxxxx (10 digits)"
                                />
                                {userDetails.Phone && userDetails.Phone.length !== 10 && (
                                    <span style={{ color: '#ff4444', fontSize: '0.8rem', marginTop: '0.2rem', display: 'block' }}>
                                        Please enter a valid 10-digit mobile number
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        backgroundColor: 'transparent',
                                        border: '1px solid var(--text-gray)',
                                        color: 'white',
                                        borderRadius: '8px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    style={{
                                        flex: 2,
                                        padding: '1rem',
                                        backgroundColor: 'var(--primary-green)',
                                        border: 'none',
                                        color: '#000',
                                        borderRadius: '8px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {status === 'submitting' ? 'Redirecting...' : 'Pay & Confirm Booking'}
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

const inputStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    fontFamily: 'var(--font-main)'
};

export default BookingForm;
