import { useState, useEffect, useRef } from 'react';
import { subscribeToBookings, updateBookingStatus, deleteBooking, createBooking, subscribeToPermanentBookings, createPermanentBooking, deletePermanentBooking } from '../services/bookingService';
import { db } from '../firebaseConfig';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Calendar, Clock, LogOut, Download, Copy, Plus, X, UserX, ShieldAlert, CalendarX, Info, Home } from 'lucide-react';
import emailjs from '@emailjs/browser';
import * as XLSX from 'xlsx';

const AdminPanel = () => {
    const [bookings, setBookings] = useState([]);
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();
    const prevBookingsRef = useRef([]);

    // Day-Wise Admin Date State
    const [selectedAdminDate, setSelectedAdminDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // Manual Booking State
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualForm, setManualForm] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        duration: '60',
        court: '1',
        name: ''
    });
    const [manualLoading, setManualLoading] = useState(false);

    const handleDeleteClick = async (e, id) => {
        e.stopPropagation();
        setDeletingId(id);
        try {
            await deleteBooking(id);
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete booking.");
        } finally {
            setDeletingId(null);
        }
    };

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    const playNotificationSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple chime
        audio.play().catch(e => console.log('Audio play failed:', e));
    };

    useEffect(() => {
        if (!loading) {
            if (!currentUser || currentUser.role !== 'admin') {
                navigate('/login');
            } else {
                // Subscribe to real-time updates
                const unsubscribe = subscribeToBookings((data) => {
                    // Check for new pending bookings
                    const prevBookings = prevBookingsRef.current;
                    if (prevBookings.length > 0) { // Only check after initial load
                        const newPending = data.find(b =>
                            b.status === 'pending' &&
                            !prevBookings.find(pb => pb.id === b.id)
                        );

                        if (newPending) {
                            playNotificationSound();
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification('New Booking Received! 🏸', {
                                    body: `${newPending.userName} booked a court for ${newPending.date} at ${newPending.startTime}`,
                                    icon: '/logo.jpg'
                                });
                            }
                        }
                    } else if (data.length > 0 && prevBookings.length === 0) {
                        // Initial load, no notification to avoid spam on refresh
                    }

                    // Update ref
                    prevBookingsRef.current = data;

                    const sorted = data.sort((a, b) => {
                        if (a.status === 'pending' && b.status !== 'pending') return -1;
                        if (a.status !== 'pending' && b.status === 'pending') return 1;
                        return new Date(a.date) - new Date(b.date);
                    });
                    setBookings(sorted);
                });

                return () => unsubscribe();
            }
        }
    }, [currentUser, loading, navigate]);

    const handleStatusChange = async (id, newStatus) => {
        const booking = bookings.find(b => b.id === id);

        // 1. WhatsApp Logic (Trigger immediately to avoid Popup Blockers)
        if (newStatus === 'confirmed' && booking) {
            const message = `Booking Confirmation - C & S Badminton Complex (PVT) Ltd\n\nPlayer Name: ${booking.userName}\nDate: ${booking.date}\nTime Slot: ${booking.startTime}\nDuration: ${booking.duration} mins\nCourt No: ${booking.courts.join(', ')}\nOther: Ref #${booking.id}\n\nPlease arrive and depart on time. Smoking is prohibited. For cancellations, inform us at least 3 hours in advance. Your e-invoice will follow shortly.\n\nThank you for your cooperation!\n\nBest Regards,\nC & S Badminton Complex (PVT) Ltd\nPhone: +94 777 98 32 64\nEmail: cnsb233@gmail.com\nWebsite: www.cnsbadminton.lk`;

            let phone = booking.userPhone || '';
            phone = phone.replace(/\D/g, '');
            if (phone.startsWith('0')) phone = '94' + phone.substring(1);

            // Open WhatsApp immediately
            const waWindow = window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
            if (!waWindow) alert("⚠️ WhatsApp Popup was blocked! Please allow popups for this site.");
        }

        // 2. Database Update
        try {
            await updateBookingStatus(id, newStatus);
        } catch (err) {
            alert("Error updating database: " + err.message);
            return; // Stop if DB fails
        }

        // 3. Email Logic (Background)
        if (newStatus === 'confirmed' && booking) {

            if (booking.userEmail) {
                // Corrected keys based on your screenshot
                // Calculate End Time
                const [hours, minutes] = booking.startTime.split(':').map(Number);
                const totalMinutes = hours * 60 + minutes + parseInt(booking.duration);
                const endHour = Math.floor(totalMinutes / 60);
                const endMinute = totalMinutes % 60;
                const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

                const emailParams = {
                    to_email: booking.userEmail,
                    user_name: booking.userName,
                    booking_date: booking.date,
                    booking_time: booking.startTime,

                    // Sending multiple variations 
                    end_time: endTime,
                    endTime: endTime,
                    EndTime: endTime,

                    duration: booking.duration,
                    Duration: booking.duration,
                    duration_mins: booking.duration,

                    courts: booking.courts.join(', '),
                    user_phone: booking.userPhone || 'N/A',
                    reply_to: 'cnsb233@gmail.com'
                };

                const SERVICE_ID = 'service_i25io04';
                const TEMPLATE_ID = 'template_x9qs76e';
                const PUBLIC_KEY = 'cmyBcHcHxEP2ggwV3';

                emailjs.send(
                    SERVICE_ID,
                    TEMPLATE_ID,
                    emailParams,
                    PUBLIC_KEY
                ).then((response) => {
                    console.log('SUCCESS!', response.status, response.text);
                    alert(`✅ Email Sent!\n\nSent Data:\nEnd Time: ${endTime}\nDuration: ${booking.duration}\n\nPlease check if these are filled in the email now.`);
                }).catch((err) => {
                    console.error('FAILED...', err);
                    alert(`❌ Email Failed!\n\nUsed Service: ${SERVICE_ID}\nUsed Template: ${TEMPLATE_ID}\n\nError: ${JSON.stringify(err)}`);
                });
            } else {
                alert(`⚠️ Email Skipped.\n\nReason: No email address found for this user.\n\nBooking ID: ${booking.id}\nUser Name: ${booking.userName}\nStatus: Confirmed`);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const [permanentBookings, setPermanentBookings] = useState([]);
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'upcoming'

    useEffect(() => {
        // Subscribe to Permanent Bookings too
        const unsubPerm = subscribeToPermanentBookings((data) => {
            setPermanentBookings(data);
        });
        return () => unsubPerm();
    }, []);

    // Manual Form Update
    const [bookingType, setBookingType] = useState('one-time'); // 'one-time' or 'permanent'

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setManualLoading(true);

        try {
            if (!manualForm.name) {
                alert('Please fill in Name.');
                setManualLoading(false);
                return;
            }

            // Strict Overlap Check
            const timeToMin = (t) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const newStart = timeToMin(manualForm.startTime);
            const newEnd = newStart + parseInt(manualForm.duration);
            const selectedDate = manualForm.date;
            const selectedCourt = parseInt(manualForm.court);

            if (bookingType === 'permanent') {
                // Permanent Booking Logic
                const dayOfWeek = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });

                // Check conflicts with other permanent bookings
                const permConflict = permanentBookings.some(b => {
                    if ((b.dayOfWeek || '').toLowerCase() !== dayOfWeek.toLowerCase()) return false;
                    if (!b.courts.includes(selectedCourt)) return false;
                    const existStart = timeToMin(b.startTime);
                    const existEnd = existStart + parseInt(b.duration);
                    return (newStart < existEnd && existStart < newEnd);
                });

                if (permConflict) {
                    alert('⚠️ This slot conflicts with an existing PERMANENT booking!');
                    setManualLoading(false);
                    return;
                }

                await createPermanentBooking({
                    dayOfWeek,
                    startTime: manualForm.startTime,
                    duration: parseInt(manualForm.duration),
                    courts: [selectedCourt],
                    userName: manualForm.name,
                    userPhone: 'N/A', // No phone in manual form
                });
                alert('Permanent Booking successfully added for every ' + dayOfWeek + '!');

            } else {
                // Check Regular Conflicts
                const hasConflict = bookings.some(b => {
                    if (b.date !== selectedDate || b.status === 'rejected') return false;
                    if (!b.courts.includes(selectedCourt)) return false;
                    const existStart = timeToMin(b.startTime);
                    const existEnd = existStart + parseInt(b.duration);
                    return (newStart < existEnd && existStart < newEnd);
                });

                if (hasConflict) {
                    alert('⚠️ This slot conflicts with an existing ONE-TIME booking!');
                    setManualLoading(false);
                    return;
                }

                // Check Permanent Conflicts (New Validation)
                const dayOfWeek = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
                const hasPermConflict = permanentBookings.some(b => {
                    if ((b.dayOfWeek || '').toLowerCase() !== dayOfWeek.toLowerCase()) return false;
                    if (!b.courts.includes(selectedCourt)) return false;
                    const existStart = timeToMin(b.startTime);
                    const existEnd = existStart + parseInt(b.duration);
                    return (newStart < existEnd && existStart < newEnd);
                });

                if (hasPermConflict) {
                    alert('⚠️ This slot conflicts with an existing PERMANENT booking!');
                    setManualLoading(false);
                    return;
                }

                // Create Standard Booking
                await createBooking({
                    date: manualForm.date,
                    startTime: manualForm.startTime,
                    duration: parseInt(manualForm.duration),
                    courts: [selectedCourt],
                    userName: manualForm.name,
                    userPhone: 'N/A', // No phone in manual form
                    userId: 'admin-manual',
                    status: 'confirmed'
                });
                alert('Booking successfully added!');
            }

            setShowManualModal(false);
            // Reset Form
            setManualForm({
                date: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                duration: '60',
                court: '1',
                name: ''
            });

        } catch (err) {
            console.error(err);
            alert('Failed to create booking: ' + err.message);
        } finally {
            setManualLoading(false);
        }
    };

    const handleDeletePermanent = async (id) => {
        if (window.confirm("Are you sure you want to delete this PERMANENT booking? This will free up all future slots.")) {
            await deletePermanentBooking(id);
        }
    };

    if (loading) {
        return <div style={{ paddingTop: '100px', textAlign: 'center', color: 'white' }}>Loading...</div>;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return null;
    }

    const handleExportExcel = () => {
        if (bookings.length === 0) {
            alert("No data to export!");
            return;
        }

        const dataToExport = bookings.map(b => {
            // Calculate End Time for Export
            const [hours, minutes] = b.startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + parseInt(b.duration);
            const endHour = Math.floor(totalMinutes / 60);
            const endMinute = totalMinutes % 60;
            const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

            return {
                "Booking ID": b.id,
                "Order ID": b.orderId || 'N/A',
                "Date": b.date,
                "Start Time": b.startTime,
                "End Time": endTime,
                "Duration (mins)": b.duration,
                "Courts": b.courts.join(', '),
                "Customer Name": b.userName,
                "Phone": b.userPhone || 'N/A',
                "Email": b.userEmail || 'N/A',
                "Amount": b.amount || 'N/A',
                "Status": b.status,
                "Created At": b.createdAt || 'N/A'
            };
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(workbook, worksheet, "All Bookings");
        XLSX.writeFile(workbook, `CNS_Bookings_Full_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px', position: 'relative' }}>
            {/* ... Modal ... */}
            <AnimatePresence>
                {showManualModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onClick={() => setShowManualModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass-panel"
                            style={{ padding: '2rem', width: '90%', maxWidth: '500px', background: '#1a1a1a' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', color: 'var(--brand-teal)' }}>New Manual Booking</h2>
                                <button onClick={() => setShowManualModal(false)} style={{ background: 'none', color: '#666' }}><X /></button>
                            </div>

                            <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Type Toggle */}
                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', marginBottom: '1.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setBookingType('one-time')}
                                        style={{
                                            flex: 1, padding: '0.8rem', borderRadius: '6px', border: 'none',
                                            background: bookingType === 'one-time' ? 'var(--brand-teal)' : 'transparent',
                                            color: bookingType === 'one-time' ? '#000' : '#aaa', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        One-Time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBookingType('permanent')}
                                        style={{
                                            flex: 1, padding: '0.8rem', borderRadius: '6px', border: 'none',
                                            background: bookingType === 'permanent' ? 'var(--brand-pink)' : 'transparent',
                                            color: bookingType === 'permanent' ? '#fff' : '#aaa', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        Permanent (Weekly)
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                                        <input
                                            type="date"
                                            className="glass-input"
                                            value={manualForm.date}
                                            onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Time</label>
                                        <select
                                            className="glass-input"
                                            value={manualForm.startTime}
                                            onChange={e => setManualForm({ ...manualForm, startTime: e.target.value })}
                                        >
                                            {Array.from({ length: 48 }, (_, i) => {
                                                const h = Math.floor(i / 2);
                                                const m = i % 2 === 0 ? '00' : '30';
                                                return `${String(h).padStart(2, '0')}:${m}`;
                                            }).map(t => (
                                                <option key={t} value={t} style={{ color: 'black' }}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Duration</label>
                                        <select
                                            className="glass-input"
                                            value={manualForm.duration}
                                            onChange={e => setManualForm({ ...manualForm, duration: e.target.value })}
                                        >
                                            <option value="60" style={{ color: 'black' }}>1 Hour</option>
                                            <option value="90" style={{ color: 'black' }}>1.5 Hours</option>
                                            <option value="120" style={{ color: 'black' }}>2 Hours</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Court</label>
                                        <select
                                            className="glass-input"
                                            value={manualForm.court}
                                            onChange={e => setManualForm({ ...manualForm, court: e.target.value })}
                                        >
                                            <option value="1" style={{ color: 'black' }}>Court 1</option>
                                            <option value="2" style={{ color: 'black' }}>Court 2</option>
                                            <option value="3" style={{ color: 'black' }}>Court 3</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Customer Name</label>
                                    <input
                                        type="text"
                                        className="glass-input"
                                        placeholder="Enter name"
                                        value={manualForm.name}
                                        onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                                        required
                                    />
                                </div>



                                <button
                                    type="submit"
                                    disabled={manualLoading}
                                    className="btn-gradient"
                                    style={{ marginTop: '1rem', padding: '1rem', fontWeight: 'bold' }}
                                >
                                    {manualLoading ? 'Checking...' : 'Confirm Booking'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dashboard Header & Toolbar */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ color: 'var(--primary-green)', margin: 0, fontSize: '2.2rem' }}>
                        Admin Dashboard
                        <span style={{ fontSize: '0.9rem', opacity: 0.5, color: '#aaa', marginLeft: '1rem', fontWeight: 'normal' }}>v1.34 (UI Polish)</span>
                    </h1>
                </div>

                {/* Glass Toolbar */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '1rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }}>


                    {/* Group 2: Actions */}
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleExportExcel}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.7rem 1.2rem',
                                background: 'rgba(39, 174, 96, 0.15)',
                                color: '#2ecc71',
                                border: '1px solid rgba(39, 174, 96, 0.3)',
                                borderRadius: '10px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(39, 174, 96, 0.25)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(39, 174, 96, 0.15)'}
                        >
                            <Download size={18} /> Export History
                        </button>

                        <button
                            onClick={() => setShowManualModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.7rem 1.2rem',
                                background: 'rgba(120, 220, 202, 0.15)',
                                color: 'var(--brand-teal)',
                                border: '1px solid rgba(120, 220, 202, 0.3)',
                                borderRadius: '10px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'rgba(120, 220, 202, 0.25)';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'rgba(120, 220, 202, 0.15)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <Plus size={18} /> New Booking
                        </button>
                    </div>

                    {/* Spacer to push Group 3 to right */}
                    <div style={{ flex: 1 }}></div>

                    {/* Group 3: System */}
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>

                        <button
                            onClick={() => {
                                const latest = [...bookings].sort((a, b) => b.createdAt?.localeCompare(a.createdAt))[0];
                                if (latest) {
                                    alert(`🕵️ LATEST BOOKING DATA:\n\nID: ${latest.id}\nCreated: ${latest.createdAt}\nUser: ${latest.userName}\nEmail: ${latest.userEmail}\n\nRAW JSON:\n${JSON.stringify(latest, null, 2)}`);
                                } else {
                                    alert("No bookings found!");
                                }
                            }}
                            title="Debug Data"
                            style={{
                                padding: '0.7rem',
                                background: 'transparent',
                                border: '1px solid rgba(255, 215, 0, 0.3)',
                                color: 'gold',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Info size={20} />
                        </button>

                        <button
                            onClick={() => navigate('/')}
                            title="Back to Site"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.7rem 1.2rem',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#aaa',
                                borderRadius: '10px',
                                cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'; }}
                            onMouseOut={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = '#aaa'; }}
                        >
                            <Home size={18} /> Site
                        </button>

                        <button
                            onClick={handleLogout}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.7rem 1.2rem',
                                background: 'rgba(231, 76, 60, 0.1)',
                                border: '1px solid rgba(231, 76, 60, 0.3)',
                                color: '#e74c3c',
                                borderRadius: '10px',
                                cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(231, 76, 60, 0.2)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(231, 76, 60, 0.1)'}
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '12px', width: 'fit-content' }}>
                <button
                    onClick={() => setViewMode('daily')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: viewMode === 'daily' ? 'var(--brand-teal)' : 'transparent',
                        color: viewMode === 'daily' ? '#000' : '#888',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Calendar size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Daily Schedule
                </button>
                <button
                    onClick={() => setViewMode('upcoming')}
                    style={{
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: viewMode === 'upcoming' ? 'var(--brand-teal)' : 'transparent',
                        color: viewMode === 'upcoming' ? '#000' : '#888',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Clock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Upcoming Bookings
                </button>
            </div>

            {/* Content Switch */}
            <div>
                {/* DAILY VIEW SECTION */}
                {viewMode === 'daily' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                        {viewMode === 'combined' && (
                            <div style={{ padding: '1rem', background: 'rgba(120, 220, 202, 0.1)', borderRadius: '12px', marginBottom: '-2rem', border: '1px solid rgba(120, 220, 202, 0.2)' }}>
                                <h2 style={{ color: 'var(--brand-teal)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <Calendar size={20} /> Daily Bookings
                                </h2>
                            </div>
                        )}

                        {/* Date Picker Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '1.5rem 2rem',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, color: 'white', fontSize: '1.4rem' }}>Day-Wise Schedule</h2>
                                <p style={{ margin: '0.3rem 0 0 0', color: '#888', fontSize: '0.9rem' }}>Select a date to view both regular and recurring bookings.</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ color: '#aaa', fontWeight: 'bold' }}>Select Date:</label>
                                <input
                                    type="date"
                                    value={selectedAdminDate}
                                    onChange={(e) => setSelectedAdminDate(e.target.value)}
                                    style={{
                                        padding: '0.8rem 1.2rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(120, 220, 202, 0.5)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'white',
                                        fontFamily: 'inherit',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const now = new Date();
                                        const year = now.getFullYear();
                                        const month = String(now.getMonth() + 1).padStart(2, '0');
                                        const day = String(now.getDate()).padStart(2, '0');
                                        setSelectedAdminDate(`${year}-${month}-${day}`);
                                    }}
                                    style={{
                                        padding: '0.8rem 1.2rem',
                                        background: 'var(--brand-teal)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Today
                                </button>
                            </div>
                        </div>

                        {/* Rendering the Selected Date's Bookings */}
                        {(() => {
                            // 1. Get Regular Bookings for Selected Date
                            const selectedDateRegular = bookings.filter(b => b.date === selectedAdminDate);

                            // 2. Get Permanent Bookings for Selected Date's Day of Week
                            const selectedDayOfWeek = new Date(selectedAdminDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
                            const selectedDatePermanent = permanentBookings
                                .filter(b => (b.dayOfWeek || '').toLowerCase() === selectedDayOfWeek.toLowerCase())
                                .map(b => ({
                                    ...b,
                                    date: selectedAdminDate,
                                    status: 'permanent', // Unique status to identify them in daily view
                                    userName: `[RECURRING] ${b.userName}`,
                                    id: `perm-${b.id}-${selectedAdminDate}` // Fake ID just for React key mapping
                                }));

                            // 3. Merge them
                            const mergedDayBookings = [...selectedDateRegular, ...selectedDatePermanent];

                            // Group by Court (1, 2, 3)
                            const courtBookings = { 1: [], 2: [], 3: [] };
                            mergedDayBookings.forEach(b => {
                                b.courts.forEach(c => {
                                    if (courtBookings[c]) courtBookings[c].push(b);
                                });
                            });

                            return (
                                <motion.div
                                    key={selectedAdminDate}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-panel"
                                    style={{ padding: '2.5rem', marginBottom: '2rem' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{
                                                background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-yellow))',
                                                color: '#000',
                                                padding: '0.8rem 1.5rem',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '1.2rem',
                                                boxShadow: '0 4px 15px rgba(120, 220, 202, 0.3)'
                                            }}>
                                                {selectedDayOfWeek}, {selectedAdminDate}
                                            </div>
                                            <div style={{ color: 'var(--text-gray)', fontSize: '1.1rem' }}>
                                                {mergedDayBookings.length} Bookings ({selectedDateRegular.length} Regular, {selectedDatePermanent.length} Recurring)
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'combined' ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                                        {[1, 2, 3].map(courtId => (
                                            <div key={courtId} style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '20px',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                <div style={{
                                                    padding: '1.2rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-teal)', fontWeight: '700', fontSize: '1.1rem' }}>
                                                        🏸 Court {courtId}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        padding: '0.2rem 0.8rem',
                                                        borderRadius: '20px',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        color: 'rgba(255,255,255,0.6)'
                                                    }}>
                                                        {courtBookings[courtId].length} slots
                                                    </span>
                                                </div>

                                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                                    {courtBookings[courtId].length === 0 ? (
                                                        <div style={{
                                                            flex: 1,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '3rem 0',
                                                            color: 'rgba(255,255,255,0.1)'
                                                        }}>
                                                            <CalendarX size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                                            <span style={{ fontSize: '0.9rem' }}>No bookings</span>
                                                        </div>
                                                    ) : (
                                                        courtBookings[courtId]
                                                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                            .map(booking => {
                                                                // Calculate End Time
                                                                const [hours, minutes] = booking.startTime.split(':').map(Number);
                                                                const totalMinutes = hours * 60 + minutes + parseInt(booking.duration);
                                                                const endHour = Math.floor(totalMinutes / 60);
                                                                const endMinute = totalMinutes % 60;
                                                                const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

                                                                // WhatsApp Link
                                                                let phoneCode = booking.userPhone || '';
                                                                phoneCode = phoneCode.replace(/\D/g, '');
                                                                if (phoneCode.startsWith('0')) phoneCode = '94' + phoneCode.substring(1);
                                                                const whatsappLink = `https://wa.me/${phoneCode}`;

                                                                return (
                                                                    <motion.div
                                                                        key={`${booking.id}-${courtId}`}
                                                                        layout
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        style={{
                                                                            background: booking.status === 'pending' ? 'rgba(255, 180, 0, 0.08)' : 'rgba(255,255,255,0.03)',
                                                                            border: booking.status === 'pending' ? '1px solid rgba(255, 180, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                                            borderRadius: '16px',
                                                                            padding: '1.2rem',
                                                                            position: 'relative',
                                                                            overflow: 'hidden'
                                                                        }}
                                                                    >
                                                                        {/* Status Badge */}
                                                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                                                            <span style={{
                                                                                fontSize: '0.75rem',
                                                                                fontWeight: 'bold',
                                                                                textTransform: 'uppercase',
                                                                                padding: '0.25rem 0.75rem',
                                                                                borderRadius: '20px',
                                                                                background: booking.status === 'confirmed' ? 'rgba(46, 204, 113, 0.2)'
                                                                                    : (booking.status === 'permanent' ? 'rgba(255, 105, 180, 0.2)'
                                                                                        : (booking.status === 'rejected' ? 'rgba(231, 76, 60, 0.2)'
                                                                                            : (booking.status === 'no-show' ? 'rgba(150, 150, 150, 0.2)'
                                                                                                : 'rgba(241, 196, 15, 0.2)'))),
                                                                                color: booking.status === 'confirmed' ? '#2ecc71'
                                                                                    : (booking.status === 'permanent' ? '#ff69b4'
                                                                                        : (booking.status === 'rejected' ? '#e74c3c'
                                                                                            : (booking.status === 'no-show' ? '#aaaaaa'
                                                                                                : '#f1c40f'))),
                                                                                border: `1px solid ${booking.status === 'confirmed' ? 'rgba(46, 204, 113, 0.3)'
                                                                                    : (booking.status === 'permanent' ? 'rgba(255, 105, 180, 0.3)'
                                                                                        : (booking.status === 'rejected' ? 'rgba(231, 76, 60, 0.3)'
                                                                                            : (booking.status === 'no-show' ? 'rgba(150, 150, 150, 0.3)'
                                                                                                : 'rgba(241, 196, 15, 0.3)')))}`,
                                                                                letterSpacing: '0.5px'
                                                                            }}>
                                                                                {booking.status}
                                                                            </span>
                                                                        </div>

                                                                        {/* Time Range */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--brand-teal)' }}>
                                                                            <div style={{ fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
                                                                                {booking.startTime}
                                                                            </div>
                                                                            <div style={{ opacity: 0.5, fontSize: '0.9rem', paddingTop: '4px' }}>➔</div>
                                                                            <div style={{ fontWeight: '600', fontSize: '1.1rem', opacity: 0.8, paddingTop: '2px' }}>
                                                                                {endTime}
                                                                            </div>
                                                                        </div>

                                                                        {/* User Details */}
                                                                        <div style={{ marginBottom: '1.2rem' }}>
                                                                            <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.3rem' }}>{booking.userName}</h4>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                <a
                                                                                    href={whatsappLink}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    style={{
                                                                                        color: 'rgba(255,255,255,0.6)',
                                                                                        fontSize: '0.9rem',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '0.4rem',
                                                                                        textDecoration: 'none',
                                                                                        transition: 'color 0.2s',
                                                                                        cursor: 'pointer'
                                                                                    }}
                                                                                    onMouseOver={(e) => e.target.style.color = '#25D366'}
                                                                                    onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                                                                                >
                                                                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                                                    {booking.userPhone}
                                                                                </a>
                                                                            </div>
                                                                        </div>

                                                                        {/* Actions */}
                                                                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                            {booking.status === 'pending' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                                                        style={{ flex: 1, padding: '0.6rem', background: 'var(--brand-teal)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: '#000' }}
                                                                                    >
                                                                                        Accept
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleStatusChange(booking.id, 'rejected')}
                                                                                        style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontSize: '0.9rem' }}
                                                                                    >
                                                                                        Reject
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                            {booking.status === 'confirmed' && (
                                                                                <button
                                                                                    onClick={() => handleStatusChange(booking.id, 'no-show')}
                                                                                    title="Mark as No-Show"
                                                                                    style={{
                                                                                        padding: '0.6rem',
                                                                                        background: 'rgba(100, 100, 100, 0.2)',
                                                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                                        borderRadius: '8px',
                                                                                        cursor: 'pointer',
                                                                                        color: '#ccc',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        flex: 1
                                                                                    }}
                                                                                >
                                                                                    <UserX size={16} style={{ marginRight: '6px' }} /> No Show
                                                                                </button>
                                                                            )}

                                                                            {/* Ban & Delete */}
                                                                            {booking.status !== 'permanent' && (
                                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                                    <button
                                                                                        onClick={async () => {
                                                                                            if (window.confirm(`Are you sure you want to PERMANENTLY BAN ${booking.userName}? They will utilize no longer be able to book.`)) {
                                                                                                const { banUser } = await import('../services/authService');
                                                                                                const result = await banUser(booking.userId); // Ensure booking has userId
                                                                                                if (result.success) alert('User has been banned.');
                                                                                                else alert('Failed to ban: ' + result.message);
                                                                                            }
                                                                                        }}
                                                                                        title="Ban User"
                                                                                        style={{
                                                                                            padding: '0.6rem',
                                                                                            background: 'rgba(0, 0, 0, 0.3)',
                                                                                            border: '1px solid rgba(255, 0, 0, 0.3)',
                                                                                            borderRadius: '8px',
                                                                                            cursor: 'pointer',
                                                                                            color: '#ff4444',
                                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                            minWidth: '40px'
                                                                                        }}
                                                                                    >
                                                                                        <ShieldAlert size={18} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => handleDeleteClick(e, booking.id)}
                                                                                        disabled={deletingId === booking.id}
                                                                                        title="Delete Booking"
                                                                                        style={{
                                                                                            padding: '0.6rem',
                                                                                            background: 'rgba(231, 76, 60, 0.1)',
                                                                                            border: '1px solid rgba(231, 76, 60, 0.2)',
                                                                                            borderRadius: '8px',
                                                                                            cursor: 'pointer',
                                                                                            color: '#e74c3c',
                                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                            minWidth: '40px'
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 size={18} />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                );
                                                            })
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })()}

                        {bookings.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
                                <h3>No Bookings Found</h3>
                            </div>
                        )}
                    </div>
                )}

                {/* UPCOMING VIEW SECTION */}
                {viewMode === 'upcoming' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                        <div>
                            <div style={{ padding: '1rem', background: 'rgba(120, 220, 202, 0.1)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(120, 220, 202, 0.2)' }}>
                                <h2 style={{ color: 'var(--brand-teal)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <Clock size={20} /> Upcoming One-Time Bookings
                                </h2>
                            </div>

                            {(() => {
                                const todayStr = new Date().toISOString().split('T')[0];
                                const upcomingBookings = bookings
                                    .filter(b => b.date >= todayStr)
                                    .sort((a, b) => {
                                        if (a.date !== b.date) return a.date.localeCompare(b.date);
                                        return a.startTime.localeCompare(b.startTime);
                                    });

                                if (upcomingBookings.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                                            <CalendarX size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                            <p>No upcoming bookings found.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {upcomingBookings.map(booking => {
                                            const [hours, minutes] = booking.startTime.split(':').map(Number);
                                            const totalMinutes = hours * 60 + minutes + parseInt(booking.duration);
                                            const endH = Math.floor(totalMinutes / 60);
                                            const endM = totalMinutes % 60;
                                            const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

                                            return (
                                                <div key={booking.id} style={{
                                                    background: 'rgba(255,255,255,0.03)',
                                                    padding: '1.5rem',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    flexWrap: 'wrap', gap: '1rem'
                                                }}>
                                                    <div style={{ flex: '1 1 300px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                                            <div style={{ color: 'var(--brand-teal)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                                {booking.date} | {booking.startTime} - {endTime}
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '12px',
                                                                background: booking.status === 'confirmed' ? 'rgba(46, 204, 113, 0.2)' : (booking.status === 'pending' ? 'rgba(241, 196, 15, 0.2)' : 'rgba(255,255,255,0.1)'),
                                                                color: booking.status === 'confirmed' ? '#2ecc71' : (booking.status === 'pending' ? '#f1c40f' : '#ccc')
                                                            }}>
                                                                {booking.status}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.3rem' }}>
                                                            {booking.userName} • Court {booking.courts.join(', ')}
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                                                            Phone: {booking.userPhone} • Order: {booking.orderId || 'N/A'}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        {booking.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleStatusChange(booking.id, 'confirmed')} style={{ padding: '0.6rem 1rem', background: 'var(--brand-teal)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}>Accept</button>
                                                                <button onClick={() => handleStatusChange(booking.id, 'rejected')} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white' }}>Reject</button>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDeleteClick(e, booking.id)}
                                                            style={{ padding: '0.6rem 1rem', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: '1px solid rgba(231, 76, 60, 0.2)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        <div>
                            <div style={{ padding: '1rem', background: 'rgba(255, 105, 180, 0.1)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid rgba(255, 105, 180, 0.2)' }}>
                                <h2 style={{ color: 'var(--brand-pink)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                    <Clock size={20} /> Manage Recurring Bookings (Templates)
                                </h2>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                                    const dayBookings = permanentBookings.filter(b => (b.dayOfWeek || '').toLowerCase() === day.toLowerCase());
                                    if (dayBookings.length === 0) return null;

                                    return (
                                        <motion.div key={day} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid var(--brand-pink)' }}>
                                            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {day} <span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 'normal' }}>({dayBookings.length})</span>
                                            </h3>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(booking => {
                                                    const [hours, minutes] = booking.startTime.split(':').map(Number);
                                                    const totalMinutes = hours * 60 + minutes + parseInt(booking.duration);
                                                    const endH = Math.floor(totalMinutes / 60);
                                                    const endM = totalMinutes % 60;
                                                    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

                                                    return (
                                                        <div key={booking.id} style={{
                                                            background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                        }}>
                                                            <div>
                                                                <div style={{ color: 'var(--brand-pink)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                                    {booking.startTime} - {endTime}
                                                                </div>
                                                                <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.3rem' }}>
                                                                    {booking.userName} • Court {booking.courts.join(', ')}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm("Delete this PERMANENT template?")) {
                                                                        await deletePermanentBooking(booking.id);
                                                                    }
                                                                }}
                                                                style={{ padding: '0.5rem', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {permanentBookings.length === 0 && (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#666' }}>
                                        <CalendarX size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p>No recurring bookings found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );


};

export default AdminPanel;
