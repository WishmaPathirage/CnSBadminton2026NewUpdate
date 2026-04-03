import { useState, useEffect, useRef } from 'react';
import { subscribeToBookings, updateBooking, updateBookingStatus, deleteBooking, createBooking, subscribeToPermanentBookings, createPermanentBooking, deletePermanentBooking, updatePermanentBooking } from '../services/bookingService';
import { db } from '../firebaseConfig';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Calendar, Clock, LogOut, Download, Copy, Plus, X, UserX, ShieldAlert, CalendarX, Info, Home, Edit, Phone, Pause, Play } from 'lucide-react';
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
    const [manualLoading, setManualLoading] = useState(false);
    const [manualForm, setManualForm] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00',
        duration: '60',
        court: '1',
        name: '',
        userPhone: '',
        userEmail: ''
    });
    // Edit Booking State
    const [editModal, setEditModal] = useState({ isOpen: false, booking: null });
    const [editLoading, setEditLoading] = useState(false);

    const [deletingId, setDeletingId] = useState(null);
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
                        // Only check non-session-hold bookings for new pending alerts
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

                    const filtered = data;

                    const sorted = filtered.sort((a, b) => {
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
        let booking = bookings.find(b => b.id === id);

        // If it's a permanent booking, find it in the permanentBookings array 
        // to get its email/phone (even if we are just "confirming" a template)
        if (!booking && id.toString().startsWith('perm-')) {
            const realId = id.split('-')[1];
            const permBase = permanentBookings.find(pb => pb.id === realId);
            if (permBase) {
                booking = {
                    ...permBase,
                    date: selectedAdminDate, 
                    id: id // Keep the virtual ID
                };
            }
        }

        // 1. Notification Logic (WhatsApp + Email) - Shared for both types
        if (newStatus === 'confirmed' && booking) {
            // WhatsApp
            const message = `Booking Confirmation - C & S Badminton Complex (PVT) Ltd\n\nPlayer Name: ${booking.userName}\nDate: ${booking.date}\nTime Slot: ${booking.startTime}\nDuration: ${booking.duration} mins\nCourt No: ${booking.courts.join(', ')}\nOther: Ref #${booking.id}\n\nPlease arrive and depart on time. Smoking is prohibited. For cancellations, inform us at least 3 hours in advance. Your e-invoice will follow shortly.\n\nThank you for your cooperation!\n\nBest Regards,\nC & S Badminton Complex (PVT) Ltd\nPhone: +94 777 98 32 64\nEmail: cnsb233@gmail.com\nWebsite: www.cnsbadminton.lk`;

            let phone = booking.userPhone || '';
            phone = phone.replace(/\D/g, '');
            if (phone.startsWith('0')) phone = '94' + phone.substring(1);

            if (phone && phone !== 'N/A') {
                const waWindow = window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                if (!waWindow) alert("⚠️ WhatsApp Popup was blocked! Please allow popups for this site.");
            }

            // Email (Background)
            if (booking.userEmail) {
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
                    end_time: endTime,
                    duration_mins: booking.duration,
                    courts: booking.courts.join(', '),
                    user_phone: booking.userPhone || 'N/A',
                    reply_to: 'cnsb233@gmail.com'
                };

                const SERVICE_ID = 'service_i25io04';
                const TEMPLATE_ID = 'template_x9qs76e';
                const PUBLIC_KEY = 'cmyBcHcHxEP2ggwV3';

                emailjs.send(SERVICE_ID, TEMPLATE_ID, emailParams, PUBLIC_KEY)
                    .then(() => console.log('SUCCESS: Confirmation Email Sent'))
                    .catch((err) => console.error('FAILED: Confirmation Email', err));
            }
        }

        // 2. Database Update Logic
        if (id.toString().startsWith('perm-')) {
            const realId = id.split('-')[1];
            try {
                const permRef = doc(db, 'permanent_bookings', realId);
                if (newStatus === 'held') {
                    await updateDoc(permRef, { heldDates: arrayUnion(selectedAdminDate) });
                    alert(`Held for ${selectedAdminDate} only!`);
                } else {
                    await updateDoc(permRef, { heldDates: arrayRemove(selectedAdminDate) });
                    alert(`Released for ${selectedAdminDate} onwards!`);
                }
            } catch (err) {
                alert("Error updating permanent booking: " + err.message);
            }
        } else {
            try {
                await updateBookingStatus(id, newStatus);
                // If confirming, you might want to show a success alert too
                if (newStatus === 'confirmed') alert('Booking confirmed and user notified!');
            } catch (err) {
                alert("Error updating database: " + err.message);
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

    useEffect(() => {
        // Subscribe to Permanent Bookings too
        const unsubPerm = subscribeToPermanentBookings((data) => {
            setPermanentBookings(data);
        });
        return () => unsubPerm();
    }, []);

    // Manual Form Update
    const [bookingType, setBookingType] = useState('one-time'); // 'one-time' or 'permanent'

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            if (!editModal.booking.userName) {
                alert("Name cannot be empty");
                return;
            }

            const isPerm = editModal.booking.status === 'permanent';
            const timeToMin = (t) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const newStart = timeToMin(editModal.booking.startTime);
            const newEnd = newStart + parseInt(editModal.booking.duration);
            const selectedCourt = parseInt(editModal.booking.courts[0]);

            if (isPerm) {
                // Determine true ID and check perm conflicts
                const realId = editModal.booking.id.split('-')[1] || editModal.booking.id;
                const permConflict = permanentBookings.some(b => {
                    if (b.id === realId) return false;
                    if ((b.dayOfWeek || '').toLowerCase() !== (editModal.booking.dayOfWeek || '').toLowerCase()) return false;
                    if (!b.courts.includes(selectedCourt)) return false;

                    const existStart = timeToMin(b.startTime);
                    const existEnd = existStart + parseInt(b.duration);
                    return (newStart < existEnd && existStart < newEnd);
                });

                if (permConflict) {
                    alert('⚠️ Conflict: This updated time overlaps with another PERMANENT booking!');
                    return;
                }

                // Update permanent booking directly (requires an update function in service if not already there, 
                // but since we just wrote updateBooking generic, we can use it on the perm collection if we had one.
                // Update permanent booking directly
                const { doc, updateDoc } = await import('firebase/firestore');
                const permRef = doc(db, 'permanent_bookings', realId);
                await updateDoc(permRef, {
                    userName: editModal.booking.userName,
                    userPhone: editModal.booking.userPhone,
                    userEmail: editModal.booking.userEmail || '',
                    startTime: editModal.booking.startTime,
                    duration: parseInt(editModal.booking.duration),
                    courts: [selectedCourt],
                });
                alert('Permanent template updated!');

            } else {
                // Check One-Time Conflicts
                const hasConflict = bookings.some(b => {
                    if (b.id === editModal.booking.id) return false;
                    if (b.date !== editModal.booking.date || b.status === 'rejected') return false;
                    if (!b.courts.includes(selectedCourt)) return false;

                    const existStart = timeToMin(b.startTime);
                    const existEnd = existStart + parseInt(b.duration);
                    return (newStart < existEnd && existStart < newEnd);
                });

                if (hasConflict) {
                    alert('⚠️ Conflict: This updated time overlaps with another booking on this date!');
                    return;
                }

                await updateBooking(editModal.booking.id, {
                    userName: editModal.booking.userName,
                    userPhone: editModal.booking.userPhone,
                    userEmail: editModal.booking.userEmail || '',
                    startTime: editModal.booking.startTime,
                    duration: parseInt(editModal.booking.duration),
                    courts: [selectedCourt],
                    date: editModal.booking.date
                });
                alert('Booking updated successfully!');
            }

            setEditModal({ isOpen: false, booking: null });
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to update booking. See console.");
        } finally {
            setEditLoading(false);
        }
    };

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
            const selectedCourts = manualForm.courts.map(Number);

            if (selectedCourts.length === 0) {
                alert('Please select at least one court.');
                setManualLoading(false);
                return;
            }

            if (bookingType === 'permanent') {
                // Permanent Booking Logic
                const d = new Date(selectedDate + 'T12:00:00');
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayOfWeek = dayNames[d.getDay()];

                // Check conflicts with other permanent bookings
                const permConflict = permanentBookings.some(b => {
                    if ((b.dayOfWeek || '').toLowerCase() !== dayOfWeek.toLowerCase()) return false;
                    if (!b.courts.some(c => selectedCourts.includes(Number(c)))) return false;
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
                    courts: selectedCourts,
                    userName: manualForm.name,
                    userPhone: manualForm.userPhone || 'N/A',
                    userEmail: manualForm.userEmail || ''
                });

            } else {
                // Check Regular Conflicts
                const hasConflict = bookings.some(b => {
                    if (b.date !== selectedDate || b.status === 'rejected') return false;
                    if (!b.courts.some(c => selectedCourts.includes(Number(c)))) return false;
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
                    if (!b.courts.some(c => selectedCourts.includes(Number(c)))) return false;
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
                    courts: selectedCourts,
                    userName: manualForm.name,
                    userPhone: manualForm.userPhone || 'N/A',
                    userEmail: manualForm.userEmail || '',
                    userId: 'admin-manual',
                    status: 'confirmed'
                });
            }

            setShowManualModal(false);
            // Reset Form
            setManualForm({
                date: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                duration: '60',
                courts: [1],
                name: '',
                userPhone: '',
                userEmail: ''
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
        <div style={{ 
            padding: 'var(--admin-padding, 2rem)', 
            maxWidth: '1200px', 
            margin: '0 auto', 
            paddingTop: 'clamp(80px, 12vw, 100px)', 
            position: 'relative' 
        }}>
            <style>{`
                :root {
                    --admin-padding: clamp(1rem, 3vw, 2rem);
                    --admin-header-size: clamp(1.5rem, 5vw, 2.2rem);
                    --admin-panel-padding: clamp(1rem, 4vw, 2.5rem);
                }
                
                @media (max-width: 768px) {
                    .admin-toolbar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                    }
                    .admin-toolbar-actions {
                        width: 100% !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 0.8rem !important;
                    }
                    .admin-toolbar-actions button {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                    .admin-toolbar-system {
                        width: 100% !important;
                        justify-content: space-between !important;
                    }
                    .day-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 1rem !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .admin-toolbar-actions {
                        grid-template-columns: 1fr !important;
                    }
                    .admin-toolbar-system {
                        display: grid !important;
                        grid-template-columns: auto 1fr 1fr !important;
                        gap: 0.5rem !important;
                    }
                    .admin-toolbar-system button {
                        width: 100% !important;
                        justify-content: center !important;
                    }
                }
            `}</style>
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
                                            {Array.from({ length: 15 }, (_, i) => (i + 2) * 30).map(min => (
                                                <option key={min} value={min.toString()} style={{ color: 'black' }}>
                                                    {min / 60} {min / 60 === 1 ? 'Hour' : 'Hours'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Courts</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {[1, 2, 3].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => {
                                                        const current = manualForm.courts || [];
                                                        if (current.includes(c)) {
                                                            setManualForm({ ...manualForm, courts: current.filter(item => item !== c) });
                                                        } else {
                                                            setManualForm({ ...manualForm, courts: [...current, c] });
                                                        }
                                                    }}
                                                    style={{
                                                        flex: 1,
                                                        padding: '0.6rem',
                                                        borderRadius: '8px',
                                                        border: (manualForm.courts || []).includes(c) ? '2px solid var(--brand-teal)' : '1px solid rgba(255,255,255,0.1)',
                                                        background: (manualForm.courts || []).includes(c) ? 'rgba(37, 182, 161, 0.2)' : 'transparent',
                                                        color: (manualForm.courts || []).includes(c) ? 'var(--brand-teal)' : '#fff',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Court {c}
                                                </button>
                                            ))}
                                        </div>
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

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone</label>
                                        <input
                                            type="text"
                                            className="glass-input"
                                            placeholder="+94..."
                                            value={manualForm.userPhone}
                                            onChange={e => setManualForm({ ...manualForm, userPhone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                                        <input
                                            type="email"
                                            className="glass-input"
                                            placeholder="user@example.com"
                                            value={manualForm.userEmail}
                                            onChange={e => setManualForm({ ...manualForm, userEmail: e.target.value })}
                                        />
                                    </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1 style={{ color: 'var(--primary-green)', margin: 0, fontSize: 'var(--admin-header-size)' }}>
                        Admin Dashboard
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, color: '#aaa', marginLeft: '0.8rem', fontWeight: 'normal', display: 'inline-block' }}>v1.34</span>
                    </h1>
                </div>

                {/* Glass Toolbar */}
                <div 
                    className="admin-toolbar"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '1rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)'
                    }}
                >


                    {/* Group 2: Actions */}
                    <div className="admin-toolbar-actions" style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
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
                    <div style={{ flex: 1 }} className="toolbar-spacer"></div>

                    {/* Group 3: System */}
                    <div className="admin-toolbar-system" style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>

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

            {/* Content Display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

                        {/* Rendering the Selected Date's Bookings */}
                        {(() => {
                            // 1. Get Regular Bookings for Selected Date
                            const selectedDateRegular = bookings.filter(b => b.date === selectedAdminDate);

                            // 2. Get Permanent Bookings for Selected Date's Day of Week
                            const d = new Date(selectedAdminDate + 'T12:00:00');
                            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                            const selectedDayOfWeek = dayNames[d.getDay()];
                            const selectedDatePermanent = permanentBookings
                                .filter(b => (b.dayOfWeek || '').toLowerCase() === selectedDayOfWeek.toLowerCase())
                                .map(b => {
                                    const isHeldForToday = (b.heldDates || []).includes(selectedAdminDate);
                                    return {
                                        ...b,
                                        date: selectedAdminDate,
                                        status: (b.isHeld || isHeldForToday) ? 'permanent-held' : 'permanent',
                                        userName: b.userName, 
                                        id: `perm-${b.id}-${selectedAdminDate}`
                                    };
                                });

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
                                    style={{ padding: 'var(--admin-panel-padding)', marginBottom: '2rem' }}
                                >
                                    <div className="day-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 3vw, 1.5rem)', flexWrap: 'wrap' }}>
                                            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.8rem',
                                                    background: '#25b6a1',
                                                    color: '#000',
                                                    padding: '0.8rem 1.2rem',
                                                    borderRadius: '10px',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.1rem',
                                                    boxShadow: '0 4px 10px rgba(37, 182, 161, 0.2)',
                                                    cursor: 'pointer'
                                                }}>
                                                    {selectedAdminDate}
                                                    <Calendar size={20} strokeWidth={2.5} />
                                                </div>
                                                {/* Invisible Native Input overlay */}
                                                <input
                                                    type="date"
                                                    value={selectedAdminDate}
                                                    onChange={(e) => setSelectedAdminDate(e.target.value)}
                                                    onClick={(e) => {
                                                        if (e.target.showPicker) {
                                                            try { e.target.showPicker(); } catch (err) { /* ignore */ }
                                                        }
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        opacity: 0,
                                                        cursor: 'pointer',
                                                    }}
                                                />
                                            </div>
                                            <div style={{ color: 'var(--text-gray)', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                                                {mergedDayBookings.length} Bookings ({selectedDateRegular.length} Regular, {selectedDatePermanent.length} Recurring)
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                                        {[1, 2, 3].map(courtId => (
                                            <div key={courtId} style={{
                                                background: '#1a1a1a',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                <div style={{
                                                    padding: '1.2rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: '700', fontSize: '1.2rem' }}>
                                                        🏸 Court {courtId}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.85rem',
                                                        padding: '0.3rem 0.8rem',
                                                        borderRadius: '20px',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        color: 'rgba(255,255,255,0.6)'
                                                    }}>
                                                        {courtBookings[courtId].length} slots
                                                    </span>
                                                </div>

                                                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
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

                                                                // Status Colors
                                                                let statusColor = '#3498db'; // default info
                                                                if (booking.status === 'confirmed') statusColor = '#2ecc71';
                                                                else if (booking.status === 'permanent-held') statusColor = '#666'; // Held recurring
                                                                else if (booking.status === 'permanent') statusColor = '#ff69b4';
                                                                else if (booking.status === 'held') statusColor = '#FBCA3F'; // Brand Yellow for held
                                                                else if (booking.status === 'pending') statusColor = '#f1c40f';
                                                                else if (booking.status === 'rejected') statusColor = '#e74c3c';
                                                                else if (booking.status === 'no-show') statusColor = '#aaaaaa';

                                                                let statusText = booking.status === 'permanent' ? 'WEEKLY' : booking.status.toUpperCase();
                                                                if (booking.status === 'permanent-held') statusText = 'WEEKLY (HELD)';
                                                                if (booking.status === 'held') statusText = 'HOLD';

                                                                return (
                                                                    <motion.div
                                                                        key={`${booking.id}-${courtId}`}
                                                                        layout
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        style={{
                                                                            background: '#222',
                                                                            border: '1px solid rgba(255,255,255,0.05)',
                                                                            borderLeft: `5px solid ${statusColor}`,
                                                                            borderRadius: '12px',
                                                                            padding: '1.2rem',
                                                                            position: 'relative',
                                                                            overflow: 'hidden',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: '0.8rem'
                                                                        }}
                                                                    >
                                                                        {/* Status Badge */}
                                                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                                                            <span style={{
                                                                                fontSize: '0.7rem',
                                                                                fontWeight: '800',
                                                                                padding: '0.3rem 0.6rem',
                                                                                borderRadius: '6px',
                                                                                background: statusColor,
                                                                                color: '#000',
                                                                                letterSpacing: '0.5px'
                                                                            }}>
                                                                                {statusText}
                                                                            </span>
                                                                        </div>

                                                                        {/* Time Range */}
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                                                                            <div style={{ fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.5px' }}>
                                                                                {booking.startTime}
                                                                            </div>
                                                                            <div style={{ opacity: 0.4, fontSize: '0.8rem' }}>→</div>
                                                                            <div style={{ fontWeight: '500', fontSize: '1rem', opacity: 0.5 }}>
                                                                                {endTime}
                                                                            </div>
                                                                        </div>

                                                                        {/* User Details */}
                                                                        <div>
                                                                            <h4 style={{ color: 'white', fontSize: '1.1rem', margin: '0 0 0.3rem 0', fontWeight: '700' }}>{booking.userName}</h4>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                                <a
                                                                                    href={whatsappLink}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    style={{
                                                                                        color: booking.userPhone === 'N/A' || !booking.userPhone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)',
                                                                                        fontSize: '0.9rem',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '0.4rem',
                                                                                        textDecoration: 'none',
                                                                                        transition: 'color 0.2s',
                                                                                        cursor: booking.userPhone === 'N/A' || !booking.userPhone ? 'default' : 'pointer'
                                                                                    }}
                                                                                    onMouseOver={(e) => { if (booking.userPhone !== 'N/A' && booking.userPhone) e.target.style.color = '#25D366' }}
                                                                                    onMouseOut={(e) => { if (booking.userPhone !== 'N/A' && booking.userPhone) e.target.style.color = 'rgba(255,255,255,0.5)' }}
                                                                                >
                                                                                    <Phone size={14} style={{ opacity: 0.8 }} />
                                                                                    {booking.userPhone || 'N/A'}
                                                                                </a>
                                                                            </div>
                                                                        </div>

                                                                        {/* Actions */}
                                                                        <div className="action-buttons" style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                                                                            {booking.status === 'pending' && (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                                                        title="Accept Booking"
                                                                                        style={{ padding: '0.6rem', background: 'transparent', border: '1px solid #2ecc71', borderRadius: '8px', cursor: 'pointer', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}
                                                                                    >
                                                                                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleStatusChange(booking.id, 'rejected')}
                                                                                        title="Reject Booking"
                                                                                        style={{ padding: '0.6rem', background: 'transparent', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}
                                                                                    >
                                                                                        <X size={18} />
                                                                                    </button>
                                                                                </>
                                                                            )}

                                                                            {/* Hold / Unhold Button - Moved here for better visibility */}
                                                                            {(booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'permanent') && (
                                                                                <button
                                                                                    onClick={() => handleStatusChange(booking.id, 'held')}
                                                                                    title="Hold Booking"
                                                                                    style={{
                                                                                        padding: '0.6rem',
                                                                                        background: 'transparent',
                                                                                        border: '1px solid #FBCA3F',
                                                                                        borderRadius: '8px',
                                                                                        cursor: 'pointer',
                                                                                        color: '#FBCA3F',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        width: '40px', height: '40px'
                                                                                    }}
                                                                                >
                                                                                    <Pause size={16} />
                                                                                </button>
                                                                            )}
                                                                            {booking.status === 'permanent-held' && (
                                                                                <button
                                                                                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                                                    title="Release Hold"
                                                                                    style={{
                                                                                        padding: '0.6rem',
                                                                                        background: 'transparent',
                                                                                        border: '1px solid #2ecc71',
                                                                                        borderRadius: '8px',
                                                                                        cursor: 'pointer',
                                                                                        color: '#2ecc71',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        width: '40px', height: '40px'
                                                                                    }}
                                                                                >
                                                                                    <Play size={16} />
                                                                                </button>
                                                                            )}

                                                                                {/* Edit */}
                                                                                <button
                                                                                    onClick={() => setEditModal({ isOpen: true, booking })}
                                                                                    title="Edit Booking"
                                                                                    style={{
                                                                                        padding: '0.6rem',
                                                                                        background: 'transparent',
                                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                                        borderRadius: '8px',
                                                                                        cursor: 'pointer',
                                                                                        color: '#3498db',
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                        width: '40px', height: '40px'
                                                                                    }}
                                                                                >
                                                                                    <Edit size={16} />
                                                                                </button>

                                                                            {/* Delete */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    if (booking.status === 'permanent') {
                                                                                        if (window.confirm("Delete this PERMANENT template?")) {
                                                                                            const realId = booking.id.split('-')[1];
                                                                                            handleDeletePermanent(realId);
                                                                                        }
                                                                                    } else {
                                                                                        handleDeleteClick(e, booking.id);
                                                                                    }
                                                                                }}
                                                                                disabled={deletingId === booking.id}
                                                                                title="Delete Booking"
                                                                                style={{
                                                                                    padding: '0.6rem',
                                                                                    background: 'transparent',
                                                                                    border: '1px solid #e74c3c',
                                                                                    borderRadius: '8px',
                                                                                    cursor: 'pointer',
                                                                                    color: '#e74c3c',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    width: '40px', height: '40px',
                                                                                    opacity: deletingId === booking.id ? 0.5 : 1
                                                                                }}
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>

                                                                            {/* Ban */}
                                                                            <button
                                                                                onClick={async () => {
                                                                                    if (window.confirm(`Are you sure you want to PERMANENTLY BAN ${booking.userName}? They will utilize no longer be able to book.`)) {
                                                                                        const { banUser } = await import('../services/authService');
                                                                                        const result = await banUser(booking.userId);
                                                                                        if (result.success) alert('User has been banned.');
                                                                                        else alert('Failed to ban: ' + result.message);
                                                                                    }
                                                                                }}
                                                                                title="Ban User"
                                                                                style={{
                                                                                    padding: '0.6rem',
                                                                                    background: 'transparent',
                                                                                    border: '1px solid #ff4444',
                                                                                    borderRadius: '8px',
                                                                                    cursor: 'pointer',
                                                                                    color: '#ff4444',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    width: '40px', height: '40px',
                                                                                    marginLeft: 'auto' // push to the right
                                                                                }}
                                                                            >
                                                                                <ShieldAlert size={16} />
                                                                            </button>
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

            {/* EDIT BOOKING MODAL */}
            <AnimatePresence>
                {editModal.isOpen && editModal.booking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: '1rem'
                        }}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            style={{
                                background: 'rgba(30,30,30,0.95)',
                                padding: '2rem',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                width: '100%', maxWidth: '500px',
                                maxHeight: '90vh', overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit size={24} color="var(--brand-teal)" /> Edit Booking
                                </h2>
                                <button onClick={() => setEditModal({ isOpen: false, booking: null })} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>User Name</label>
                                    <input
                                        type="text"
                                        value={editModal.booking.userName || ''}
                                        onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, userName: e.target.value } }))}
                                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone/Contact</label>
                                    <input
                                        type="text"
                                        value={editModal.booking.userPhone || ''}
                                        onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, userPhone: e.target.value } }))}
                                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email Address</label>
                                    <input
                                        type="email"
                                        value={editModal.booking.userEmail || ''}
                                        onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, userEmail: e.target.value } }))}
                                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date</label>
                                        <input
                                            type="date"
                                            value={editModal.booking.date || editModal.booking.booking_date || ''}
                                            onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, date: e.target.value } }))}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                            disabled={editModal.booking.status === 'permanent'}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Court</label>
                                        <select
                                            value={editModal.booking.courts ? editModal.booking.courts[0] : '1'}
                                            onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, courts: [parseInt(e.target.value)] } }))}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        >
                                            <option value="1">Court 1</option>
                                            <option value="2">Court 2</option>
                                            <option value="3">Court 3</option>
                                            <option value="4">Court 4</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Start Time</label>
                                        <input
                                            type="time"
                                            value={editModal.booking.startTime || ''}
                                            onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, startTime: e.target.value } }))}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Duration (mins)</label>
                                        <select
                                            value={editModal.booking.duration || '60'}
                                            onChange={(e) => setEditModal(prev => ({ ...prev, booking: { ...prev.booking, duration: e.target.value } }))}
                                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        >
                                            {Array.from({ length: 15 }, (_, i) => (i + 2) * 30).map(min => (
                                                <option key={min} value={min.toString()}>{min / 60} {min / 60 === 1 ? 'Hour' : 'Hours'}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {editModal.booking.status === 'permanent' && (
                                    <div style={{ padding: '0.8rem', background: 'rgba(255,105,180,0.1)', border: '1px solid rgba(255,105,180,0.2)', borderRadius: '8px', color: '#ff69b4', fontSize: '0.85rem' }}>
                                        ⚠️ You are editing a <b>PERMANENT</b> template for <b>{editModal.booking.dayOfWeek}</b>. This will change all future occurrences dynamically.
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    style={{
                                        marginTop: '1rem',
                                        padding: '1rem',
                                        background: 'var(--brand-teal)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );


};

export default AdminPanel;
