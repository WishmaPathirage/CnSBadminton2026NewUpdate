import { useState, useEffect, useRef, useMemo } from 'react';
import { subscribeToBookings, updateBooking, updateBookingStatus, deleteBooking, createBooking, subscribeToPermanentBookings, createPermanentBooking, deletePermanentBooking, updatePermanentBooking, isManualBooking } from '../services/bookingService';
import { db } from '../firebaseConfig';
import { logout } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Calendar, Clock, LogOut, Download, Copy, Plus, X, UserX, ShieldAlert, CalendarX, Info, Home, Edit, Phone, Pause, Play, Globe, PenTool, Layers } from 'lucide-react';
import emailjs from '@emailjs/browser';
import * as XLSX from 'xlsx';

const AdminPanel = () => {
    const [bookings, setBookings] = useState([]); // This was accidentally deleted
    const [viewMode, setViewMode] = useState('day'); // 'day' or 'upcoming'
    const [sourceFilter, setSourceFilter] = useState('all'); // 'all', 'website', 'manual'
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
                    // Contact
                    to_email: booking.userEmail,
                    user_email: booking.userEmail,
                    userEmail: booking.userEmail,

                    // Customer Name
                    user_name: booking.userName,
                    userName: booking.userName,
                    customer_name: booking.userName,
                    customerName: booking.userName,

                    // Booking Details
                    booking_date: booking.date,
                    bookingDate: booking.date,
                    date: booking.date,
                    booking_time: booking.startTime,
                    startTime: booking.startTime,
                    start_time: booking.startTime,
                    end_time: endTime,
                    endTime: endTime,
                    duration_mins: booking.duration,
                    duration: `${booking.duration} mins`,
                    courts: booking.courts.join(', '),
                    court_no: booking.courts.join(', '),
                    
                    // Phone/IDs/Amount
                    user_phone: booking.userPhone || 'N/A',
                    phone: booking.userPhone || 'N/A',
                    order_id: booking.orderId || booking.id,
                    orderId: booking.orderId || booking.id,
                    amount: booking.amount ? booking.amount.toFixed(2) : 'N/A',
                    total_amount: booking.amount ? booking.amount.toFixed(2) : 'N/A',

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
                    await updateDoc(permRef, { 
                        heldDates: arrayRemove(selectedAdminDate),
                        isHeld: false // Clear legacy global flag if it exists
                    });
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

    // All-time statistics
    const totalAllWeb = useMemo(() => bookings.filter(b => !isManualBooking(b)).length, [bookings]);
    const totalAllManual = useMemo(() => bookings.filter(b => isManualBooking(b)).length + permanentBookings.length, [bookings, permanentBookings]);

    // View-specific statistics
    const currentStats = useMemo(() => {
        if (viewMode === 'day') {
            const selectedDateRegular = bookings.filter(b => b.date === selectedAdminDate);
            const d = new Date(selectedAdminDate + 'T12:00:00');
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const selectedDayOfWeek = dayNames[d.getDay()];
            const selectedDatePermanent = permanentBookings.filter(b => (b.dayOfWeek || '').toLowerCase() === selectedDayOfWeek.toLowerCase());

            const webCount = selectedDateRegular.filter(b => !isManualBooking(b)).length;
            const manualCount = selectedDateRegular.filter(b => isManualBooking(b)).length + selectedDatePermanent.length;
            return {
                web: webCount,
                manual: manualCount,
                total: webCount + manualCount,
                scope: `Selected Day (${selectedAdminDate})`
            };
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            const pendingAll = bookings.filter(b => b.status === 'pending' && b.date >= todayStr);
            const webCount = pendingAll.filter(b => !isManualBooking(b)).length;
            const manualCount = pendingAll.filter(b => isManualBooking(b)).length;
            return {
                web: webCount,
                manual: manualCount,
                total: pendingAll.length,
                scope: 'Upcoming Pending Requests'
            };
        }
    }, [viewMode, selectedAdminDate, bookings, permanentBookings]);

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
                    // Ignore held permanent bookings for conflict checks
                    if (b.status === 'permanent-held') return false;
                    if (b.heldDates?.includes(editModal.booking.date)) return false;

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
                    // Ignore rejected and held bookings for conflict checks
                    if (b.date !== editModal.booking.date || b.status === 'rejected' || b.status === 'held') return false;
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
                    if (b.status === 'permanent-held') return false; // Ignore fully held templates
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
                    userEmail: manualForm.userEmail || '',
                    bookingSource: 'manual',
                    source: 'manual',
                    isManual: true
                });

            } else {
                // Check Regular Conflicts
                const hasConflict = bookings.some(b => {
                    // Ignore rejected and held bookings for conflict checks
                    if (b.date !== selectedDate || b.status === 'rejected' || b.status === 'held') return false;
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
                    if (b.status === 'permanent-held') return false; // Ignore fully held templates
                    if (b.heldDates?.includes(selectedDate)) return false; // Ignore if held on this specific date
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

                // Calculate End Time for Firestore record
                const [mStartH, mStartM] = manualForm.startTime.split(':').map(Number);
                const mTotalMins = mStartH * 60 + mStartM + parseInt(manualForm.duration);
                const mEndH = Math.floor(mTotalMins / 60);
                const mEndM = mTotalMins % 60;
                const mEndTimeStr = `${String(mEndH).padStart(2, '0')}:${String(mEndM).padStart(2, '0')}`;

                // Create Standard Booking
                await createBooking({
                    // CamelCase
                    date: manualForm.date,
                    startTime: manualForm.startTime,
                    duration: parseInt(manualForm.duration),
                    courts: selectedCourts,
                    userName: manualForm.name,
                    userPhone: manualForm.userPhone || 'N/A',
                    userEmail: manualForm.userEmail || '',
                    userId: 'admin-manual',
                    status: 'confirmed',
                    bookingSource: 'manual',
                    source: 'manual',
                    isManual: true,

                    // Snake_Case (Exhaustive)
                    customer_name: manualForm.name,
                    phone: manualForm.userPhone || 'N/A',
                    starting_time: manualForm.startTime,
                    ending_time: mEndTimeStr,
                    courts_booked: selectedCourts.join(', '),
                    booking_date: manualForm.date,
                    booking_time: `${manualForm.startTime} - ${mEndTimeStr}`
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
                "Booking Source": isManualBooking(b) ? 'MANUAL' : 'WEB',
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
                                            {Array.from({ length: 18 }, (_, i) => (i + 1) * 30).map(min => (
                                                <option key={min} value={min.toString()} style={{ color: 'black' }}>
                                                    {min < 60 ? `${min} Minutes` : `${min / 60} ${min / 60 === 1 ? 'Hour' : 'Hours'}`}
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


                    {/* Group 1.5: View Toggle */}
                    <div className="admin-toolbar-view" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px' }}>
                        <button
                            onClick={() => setViewMode('day')}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: viewMode === 'day' ? 'var(--brand-teal)' : 'transparent',
                                color: viewMode === 'day' ? '#000' : '#aaa',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <Calendar size={18} /> Day View
                        </button>
                        <button
                            onClick={() => setViewMode('upcoming')}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: viewMode === 'upcoming' ? 'var(--brand-teal)' : 'transparent',
                                color: viewMode === 'upcoming' ? '#000' : '#aaa',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                        >
                            <Clock size={18} /> Upcoming
                        </button>
                    </div>
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

            {/* Source Identity & Quick Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.2rem',
                marginBottom: '2rem'
            }}>
                {/* All Bookings Card */}
                <motion.div
                    whileHover={{ translateY: -3, boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSourceFilter('all')}
                    className="glass-panel"
                    style={{
                        padding: '1.3rem 1.5rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: sourceFilter === 'all' ? '2px solid var(--brand-teal)' : '1px solid rgba(255,255,255,0.08)',
                        background: sourceFilter === 'all'
                            ? 'linear-gradient(135deg, rgba(37, 182, 161, 0.18) 0%, rgba(20, 20, 20, 0.9) 100%)'
                            : 'rgba(255, 255, 255, 0.03)',
                        boxShadow: sourceFilter === 'all' ? '0 8px 25px rgba(37, 182, 161, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: '#fff',
                                letterSpacing: '0.5px'
                            }}>
                                ALL
                            </span>
                            <span style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: '600' }}>
                                Total Bookings
                            </span>
                        </div>
                        <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>
                            {currentStats.total}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
                            {sourceFilter === 'all' ? '✓ Showing All' : 'Click to show all'} ({totalAllWeb + totalAllManual} all-time)
                        </div>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(37, 182, 161, 0.15)',
                        border: '1px solid rgba(37, 182, 161, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--brand-teal)'
                    }}>
                        <Calendar size={22} />
                    </div>
                </motion.div>

                {/* Website Booking Card */}
                <motion.div
                    whileHover={{ translateY: -3, boxShadow: '0 10px 25px rgba(0, 210, 255, 0.25)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSourceFilter(sourceFilter === 'website' ? 'all' : 'website')}
                    className="glass-panel"
                    style={{
                        padding: '1.3rem 1.5rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: sourceFilter === 'website' ? '2px solid #00d2ff' : '1px solid rgba(0, 210, 255, 0.28)',
                        background: sourceFilter === 'website'
                            ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.22) 0%, rgba(15, 25, 35, 0.92) 100%)'
                            : 'linear-gradient(135deg, rgba(0, 210, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        boxShadow: sourceFilter === 'website' ? '0 8px 30px rgba(0, 210, 255, 0.3)' : '0 4px 15px rgba(0, 210, 255, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                background: 'rgba(0, 210, 255, 0.2)',
                                border: '1px solid rgba(0, 210, 255, 0.5)',
                                color: '#00e5ff',
                                letterSpacing: '0.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                boxShadow: '0 0 10px rgba(0, 210, 255, 0.2)'
                            }}>
                                <Globe size={11} strokeWidth={2.5} /> WEB
                            </span>
                            <span style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: '600' }}>
                                Website Bookings
                            </span>
                        </div>
                        <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#00e5ff', lineHeight: 1.1 }}>
                            {currentStats.web}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: sourceFilter === 'website' ? '#00e5ff' : '#888', marginTop: '0.4rem' }}>
                            {sourceFilter === 'website' ? '✓ Showing Web only (Click to reset)' : `Online users (${totalAllWeb} total)`}
                        </div>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(0, 210, 255, 0.15)',
                        border: '1px solid rgba(0, 210, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#00e5ff'
                    }}>
                        <Globe size={24} />
                    </div>
                </motion.div>

                {/* Manual Booking Card */}
                <motion.div
                    whileHover={{ translateY: -3, boxShadow: '0 10px 25px rgba(255, 159, 28, 0.25)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSourceFilter(sourceFilter === 'manual' ? 'all' : 'manual')}
                    className="glass-panel"
                    style={{
                        padding: '1.3rem 1.5rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        border: sourceFilter === 'manual' ? '2px solid #ff9f1c' : '1px solid rgba(255, 159, 28, 0.28)',
                        background: sourceFilter === 'manual'
                            ? 'linear-gradient(135deg, rgba(255, 159, 28, 0.22) 0%, rgba(35, 25, 15, 0.92) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 159, 28, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        boxShadow: sourceFilter === 'manual' ? '0 8px 30px rgba(255, 159, 28, 0.3)' : '0 4px 15px rgba(255, 159, 28, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.25s ease'
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '6px',
                                background: 'rgba(255, 159, 28, 0.2)',
                                border: '1px solid rgba(255, 159, 28, 0.5)',
                                color: '#ff9f1c',
                                letterSpacing: '0.5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                boxShadow: '0 0 10px rgba(255, 159, 28, 0.2)'
                            }}>
                                <PenTool size={11} strokeWidth={2.5} /> MANUAL
                            </span>
                            <span style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: '600' }}>
                                Manual Bookings
                            </span>
                        </div>
                        <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#ff9f1c', lineHeight: 1.1 }}>
                            {currentStats.manual}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: sourceFilter === 'manual' ? '#ff9f1c' : '#888', marginTop: '0.4rem' }}>
                            {sourceFilter === 'manual' ? '✓ Showing Manual only (Click to reset)' : `Admin & Walk-in (${totalAllManual} total)`}
                        </div>
                    </div>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(255, 159, 28, 0.15)',
                        border: '1px solid rgba(255, 159, 28, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ff9f1c'
                    }}>
                        <PenTool size={24} />
                    </div>
                </motion.div>
            </div>

            {/* Active Filter Notification Bar */}
            {sourceFilter !== 'all' && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '12px',
                    background: sourceFilter === 'website' ? 'rgba(0, 210, 255, 0.12)' : 'rgba(255, 159, 28, 0.12)',
                    border: sourceFilter === 'website' ? '1px solid rgba(0, 210, 255, 0.35)' : '1px solid rgba(255, 159, 28, 0.35)',
                    marginBottom: '2rem',
                    color: '#fff',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ color: '#aaa' }}>Active Filter:</span>
                        {sourceFilter === 'website' ? (
                            <span style={{ color: '#00e5ff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Globe size={15} /> Showing Website Bookings (WEB) Only
                            </span>
                        ) : (
                            <span style={{ color: '#ff9f1c', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <PenTool size={15} /> Showing Manual Bookings (MANUAL) Only
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setSourceFilter('all')}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                        }}
                    >
                        <X size={14} /> Clear Filter
                    </button>
                </div>
            )}

            {/* Content Display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {viewMode === 'day' ? (
                    (() => {
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
                                        status: isHeldForToday ? 'permanent-held' : 'permanent',
                                        userName: b.userName, 
                                        id: `perm-${b.id}-${selectedAdminDate}`,
                                        bookingSource: 'manual',
                                        source: 'manual',
                                        isManual: true
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

                            const dayWebCount = mergedDayBookings.filter(b => !isManualBooking(b)).length;
                            const dayManualCount = mergedDayBookings.filter(b => isManualBooking(b)).length;

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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                                                <div style={{ color: 'var(--text-gray)', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                                                    {mergedDayBookings.length} Slots
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px',
                                                        background: 'rgba(0, 210, 255, 0.15)',
                                                        color: '#00e5ff',
                                                        border: '1px solid rgba(0, 210, 255, 0.3)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}>
                                                        <Globe size={11} /> {dayWebCount} WEB
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: '700',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '6px',
                                                        background: 'rgba(255, 159, 28, 0.15)',
                                                        color: '#ff9f1c',
                                                        border: '1px solid rgba(255, 159, 28, 0.3)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}>
                                                        <PenTool size={11} /> {dayManualCount} MANUAL
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                                        {[1, 2, 3].map(courtId => {
                                            const allCourtSlots = courtBookings[courtId] || [];
                                            const filteredSlots = allCourtSlots.filter(b => {
                                                if (sourceFilter === 'website') return !isManualBooking(b);
                                                if (sourceFilter === 'manual') return isManualBooking(b);
                                                return true;
                                            });

                                            return (
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
                                                            {filteredSlots.length} slots {sourceFilter !== 'all' && `(${allCourtSlots.length} total)`}
                                                        </span>
                                                    </div>

                                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                                        {filteredSlots.length === 0 ? (
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
                                                                <span style={{ fontSize: '0.9rem' }}>
                                                                    {allCourtSlots.length > 0 
                                                                        ? `No ${sourceFilter === 'website' ? 'Website' : 'Manual'} bookings on this court`
                                                                        : 'No bookings'
                                                                    }
                                                                </span>
                                                                {allCourtSlots.length > 0 && sourceFilter !== 'all' && (
                                                                    <button
                                                                        onClick={() => setSourceFilter('all')}
                                                                        style={{
                                                                            marginTop: '0.8rem',
                                                                            background: 'transparent',
                                                                            border: '1px solid rgba(255,255,255,0.2)',
                                                                            color: 'var(--brand-teal)',
                                                                            padding: '0.4rem 0.8rem',
                                                                            borderRadius: '6px',
                                                                            fontSize: '0.8rem',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        Show all {allCourtSlots.length} slots
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            filteredSlots
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

                                                                    // Origin Identity
                                                                    const isManual = isManualBooking(booking);
                                                                    const isWeb = !isManual;

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
                                                                                background: isWeb
                                                                                    ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, #222 45%, #1e1e1e 100%)'
                                                                                    : 'linear-gradient(135deg, rgba(255, 159, 28, 0.05) 0%, #222 45%, #1e1e1e 100%)',
                                                                                border: isWeb ? '1px solid rgba(0, 210, 255, 0.22)' : '1px solid rgba(255, 159, 28, 0.22)',
                                                                                borderLeft: `5px solid ${statusColor}`,
                                                                                borderRadius: '12px',
                                                                                padding: '1.2rem',
                                                                                position: 'relative',
                                                                                overflow: 'hidden',
                                                                                display: 'flex',
                                                                                flexDirection: 'column',
                                                                                gap: '0.8rem',
                                                                                boxShadow: isWeb ? '0 4px 15px rgba(0, 210, 255, 0.06)' : '0 4px 15px rgba(255, 159, 28, 0.06)'
                                                                            }}
                                                                        >
                                                                            {/* Status and Origin Badges */}
                                                                            <div style={{ 
                                                                                position: 'absolute', 
                                                                                top: '1rem', 
                                                                                right: '1rem', 
                                                                                display: 'flex', 
                                                                                alignItems: 'center', 
                                                                                gap: '0.4rem', 
                                                                                flexWrap: 'wrap', 
                                                                                justifyContent: 'flex-end',
                                                                                maxWidth: '70%'
                                                                            }}>
                                                                                {/* Identity Origin Tag */}
                                                                                {isWeb ? (
                                                                                    <span
                                                                                        title="Booked through the Website"
                                                                                        style={{
                                                                                            fontSize: '0.68rem',
                                                                                            fontWeight: '800',
                                                                                            padding: '0.22rem 0.55rem',
                                                                                            borderRadius: '6px',
                                                                                            background: 'rgba(0, 210, 255, 0.16)',
                                                                                            border: '1px solid rgba(0, 210, 255, 0.45)',
                                                                                            color: '#00e5ff',
                                                                                            letterSpacing: '0.5px',
                                                                                            display: 'inline-flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '0.3rem',
                                                                                            boxShadow: '0 0 10px rgba(0, 210, 255, 0.15)'
                                                                                        }}
                                                                                    >
                                                                                        <Globe size={11} strokeWidth={2.5} /> WEB
                                                                                    </span>
                                                                                ) : (
                                                                                    <span
                                                                                        title="Manual Admin Booking"
                                                                                        style={{
                                                                                            fontSize: '0.68rem',
                                                                                            fontWeight: '800',
                                                                                            padding: '0.22rem 0.55rem',
                                                                                            borderRadius: '6px',
                                                                                            background: 'rgba(255, 159, 28, 0.16)',
                                                                                            border: '1px solid rgba(255, 159, 28, 0.45)',
                                                                                            color: '#ff9f1c',
                                                                                            letterSpacing: '0.5px',
                                                                                            display: 'inline-flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '0.3rem',
                                                                                            boxShadow: '0 0 10px rgba(255, 159, 28, 0.15)'
                                                                                        }}
                                                                                    >
                                                                                        <PenTool size={11} strokeWidth={2.5} /> MANUAL
                                                                                    </span>
                                                                                )}

                                                                                {/* Status Badge */}
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
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                                                    <a
                                                                                        href={whatsappLink}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        style={{
                                                                                            color: booking.userPhone === 'N/A' || !booking.userPhone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
                                                                                            fontSize: '0.9rem',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '0.4rem',
                                                                                            textDecoration: 'none',
                                                                                            transition: 'color 0.2s',
                                                                                            cursor: booking.userPhone === 'N/A' || !booking.userPhone ? 'default' : 'pointer'
                                                                                        }}
                                                                                        onMouseOver={(e) => { if (booking.userPhone !== 'N/A' && booking.userPhone) e.target.style.color = '#25D366' }}
                                                                                        onMouseOut={(e) => { if (booking.userPhone !== 'N/A' && booking.userPhone) e.target.style.color = 'rgba(255,255,255,0.6)' }}
                                                                                    >
                                                                                        <Phone size={14} style={{ opacity: 0.8 }} />
                                                                                        {booking.userPhone || 'N/A'}
                                                                                    </a>

                                                                                    {/* Origin Details Label */}
                                                                                    {isWeb ? (
                                                                                        <span style={{
                                                                                            fontSize: '0.72rem',
                                                                                            color: '#00e5ff',
                                                                                            background: 'rgba(0, 210, 255, 0.08)',
                                                                                            padding: '0.15rem 0.45rem',
                                                                                            borderRadius: '4px',
                                                                                            border: '1px solid rgba(0, 210, 255, 0.2)',
                                                                                            display: 'inline-flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '0.25rem'
                                                                                        }}>
                                                                                            {booking.orderId ? `Ref: ${booking.orderId}` : 'Website Booking'}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span style={{
                                                                                            fontSize: '0.72rem',
                                                                                            color: '#ff9f1c',
                                                                                            background: 'rgba(255, 159, 28, 0.08)',
                                                                                            padding: '0.15rem 0.45rem',
                                                                                            borderRadius: '4px',
                                                                                            border: '1px solid rgba(255, 159, 28, 0.2)',
                                                                                            display: 'inline-flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '0.25rem'
                                                                                        }}>
                                                                                            {booking.status === 'permanent' || booking.status === 'permanent-held' ? 'Recurring Template' : 'Manual Entry'}
                                                                                        </span>
                                                                                    )}
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
                                        );
                                    })}
                                </div>
                                </motion.div>
                            );
                        })()
                ) : (
                    /* UPCOMING CARD VIEW - DASHBOARD STYLE */
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <ShieldAlert size={24} style={{ color: '#f1c40f' }} />
                                Pending Requests
                            </h2>
                            <div style={{ color: '#888', fontSize: '0.9rem' }}>
                                Action required for these upcoming slots
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            {(() => {
                                const today = new Date().toISOString().split('T')[0];
                                const allPendingBookings = bookings.filter(b => b.status === 'pending' && b.date >= today);
                                const pendingBookings = allPendingBookings
                                    .filter(b => {
                                        if (sourceFilter === 'website') return !isManualBooking(b);
                                        if (sourceFilter === 'manual') return isManualBooking(b);
                                        return true;
                                    })
                                    .sort((a, b) => {
                                        if (a.date !== b.date) return a.date.localeCompare(b.date);
                                        return a.startTime.localeCompare(b.startTime);
                                    });

                                if (pendingBookings.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.2)' }}>
                                            <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
                                            <h3>
                                                {allPendingBookings.length > 0
                                                    ? `No ${sourceFilter === 'website' ? 'Website' : 'Manual'} pending requests`
                                                    : 'No pending requests'}
                                            </h3>
                                            {allPendingBookings.length > 0 && sourceFilter !== 'all' && (
                                                <button
                                                    onClick={() => setSourceFilter('all')}
                                                    style={{
                                                        marginTop: '0.8rem',
                                                        background: 'transparent',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        color: 'var(--brand-teal)',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Show all {allPendingBookings.length} requests
                                                </button>
                                            )}
                                        </div>
                                    );
                                }

                                // Group by date
                                const groups = pendingBookings.reduce((acc, b) => {
                                    if (!acc[b.date]) acc[b.date] = [];
                                    acc[b.date].push(b);
                                    return acc;
                                }, {});

                                return Object.keys(groups).sort().map(date => (
                                    <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {/* Date Header matching image style */}
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '1rem', 
                                            padding: '0.6rem 1.2rem', 
                                            background: '#f39c12', 
                                            borderRadius: '10px',
                                            color: '#000',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            width: 'fit-content',
                                            boxShadow: '0 4px 10px rgba(243, 156, 18, 0.3)'
                                        }}>
                                            <Calendar size={18} /> {date} (NEW)
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                            {groups[date].map(booking => {
                                                // Calculate end time
                                                const [h, m] = booking.startTime.split(':').map(Number);
                                                const endTimeObj = new Date();
                                                endTimeObj.setHours(h);
                                                endTimeObj.setMinutes(m + (booking.duration || 60));
                                                const endTime = `${String(endTimeObj.getHours()).padStart(2, '0')}:${String(endTimeObj.getMinutes()).padStart(2, '0')}`;

                                                // WhatsApp Link
                                                let phoneCode = booking.userPhone || '';
                                                phoneCode = phoneCode.replace(/\D/g, '');
                                                if (phoneCode.startsWith('0')) phoneCode = '94' + phoneCode.substring(1);
                                                const whatsappLink = `https://wa.me/${phoneCode}`;

                                                // Origin Identity
                                                const isManual = isManualBooking(booking);
                                                const isWeb = !isManual;

                                                let statusColor = '#f1c40f'; // Pending yellow

                                                return (
                                                    <motion.div
                                                        key={booking.id}
                                                        layout
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        style={{
                                                            background: isWeb
                                                                ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.05) 0%, #222 45%, #1e1e1e 100%)'
                                                                : 'linear-gradient(135deg, rgba(255, 159, 28, 0.05) 0%, #222 45%, #1e1e1e 100%)',
                                                            border: isWeb ? '1px solid rgba(0, 210, 255, 0.22)' : '1px solid rgba(255, 159, 28, 0.22)',
                                                            borderLeft: `5px solid ${statusColor}`,
                                                            borderRadius: '12px',
                                                            padding: '1.2rem',
                                                            position: 'relative',
                                                            overflow: 'hidden',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '0.8rem',
                                                            boxShadow: isWeb ? '0 4px 15px rgba(0, 210, 255, 0.06)' : '0 4px 15px rgba(255, 159, 28, 0.06)'
                                                        }}
                                                    >
                                                        {/* Status & Origin Badges */}
                                                        <div style={{ 
                                                            position: 'absolute', 
                                                            top: '1rem', 
                                                            right: '1rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            flexWrap: 'wrap',
                                                            justifyContent: 'flex-end',
                                                            maxWidth: '70%'
                                                        }}>
                                                            {/* Identity Origin Tag */}
                                                            {isWeb ? (
                                                                <span
                                                                    title="Booked through the Website"
                                                                    style={{
                                                                        fontSize: '0.68rem',
                                                                        fontWeight: '800',
                                                                        padding: '0.22rem 0.55rem',
                                                                        borderRadius: '6px',
                                                                        background: 'rgba(0, 210, 255, 0.16)',
                                                                        border: '1px solid rgba(0, 210, 255, 0.45)',
                                                                        color: '#00e5ff',
                                                                        letterSpacing: '0.5px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.3rem',
                                                                        boxShadow: '0 0 10px rgba(0, 210, 255, 0.15)'
                                                                    }}
                                                                >
                                                                    <Globe size={11} strokeWidth={2.5} /> WEB
                                                                </span>
                                                            ) : (
                                                                <span
                                                                    title="Manual Admin Booking"
                                                                    style={{
                                                                        fontSize: '0.68rem',
                                                                        fontWeight: '800',
                                                                        padding: '0.22rem 0.55rem',
                                                                        borderRadius: '6px',
                                                                        background: 'rgba(255, 159, 28, 0.16)',
                                                                        border: '1px solid rgba(255, 159, 28, 0.45)',
                                                                        color: '#ff9f1c',
                                                                        letterSpacing: '0.5px',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.3rem',
                                                                        boxShadow: '0 0 10px rgba(255, 159, 28, 0.15)'
                                                                    }}
                                                                >
                                                                    <PenTool size={11} strokeWidth={2.5} /> MANUAL
                                                                </span>
                                                            )}

                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: '800',
                                                                padding: '0.3rem 0.6rem',
                                                                borderRadius: '6px',
                                                                background: statusColor,
                                                                color: '#000',
                                                                letterSpacing: '0.5px'
                                                            }}>
                                                                PENDING
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
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                                <a
                                                                    href={whatsappLink}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{
                                                                        color: booking.userPhone === 'N/A' || !booking.userPhone ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
                                                                        fontSize: '0.9rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.4rem',
                                                                        textDecoration: 'none',
                                                                        transition: 'color 0.2s',
                                                                        cursor: booking.userPhone === 'N/A' || !booking.userPhone ? 'default' : 'pointer'
                                                                    }}
                                                                    onMouseOver={(e) => { if (booking.userPhone !== 'N/A' && booking.userPhone) e.target.style.color = '#25D366' }}
                                                                    onMouseOut={(e) => { if (booking.userPhone !== 'N/A' && booking.userPhone) e.target.style.color = 'rgba(255,255,255,0.6)' }}
                                                                >
                                                                    <Phone size={14} style={{ opacity: 0.8 }} />
                                                                    {booking.userPhone || 'N/A'}
                                                                </a>

                                                                {/* Origin Pill */}
                                                                {isWeb ? (
                                                                    <span style={{
                                                                        fontSize: '0.72rem',
                                                                        color: '#00e5ff',
                                                                        background: 'rgba(0, 210, 255, 0.08)',
                                                                        padding: '0.15rem 0.45rem',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(0, 210, 255, 0.2)',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem'
                                                                    }}>
                                                                        {booking.orderId ? `Ref: ${booking.orderId}` : 'Website Booking'}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{
                                                                        fontSize: '0.72rem',
                                                                        color: '#ff9f1c',
                                                                        background: 'rgba(255, 159, 28, 0.08)',
                                                                        padding: '0.15rem 0.45rem',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(255, 159, 28, 0.2)',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.25rem'
                                                                    }}>
                                                                        Manual Entry
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                                                                Courts: {booking.courts?.join(', ')}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="action-buttons" style={{ display: 'flex', gap: '0.6rem', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
                                                            <button
                                                                onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                                title="Accept Booking"
                                                                style={{ padding: '0.6rem', background: 'transparent', border: '1px solid #2ecc71', borderRadius: '8px', cursor: 'pointer', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}
                                                            >
                                                                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                            </button>
                                                            <button
                                                                onClick={() => setEditModal({ isOpen: true, booking })}
                                                                title="Edit Booking"
                                                                style={{ padding: '0.6rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteClick(e, booking.id)}
                                                                title="Delete Booking"
                                                                style={{ padding: '0.6rem', background: 'transparent', border: '1px solid rgba(231, 76, 60, 0.3)', borderRadius: '8px', cursor: 'pointer', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                 )}

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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Edit size={24} color="var(--brand-teal)" /> Edit Booking
                                </h2>
                                <button onClick={() => setEditModal({ isOpen: false, booking: null })} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {(() => {
                                const isManual = isManualBooking(editModal.booking);
                                return (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        padding: '0.6rem 0.9rem',
                                        borderRadius: '8px',
                                        background: isManual ? 'rgba(255, 159, 28, 0.1)' : 'rgba(0, 210, 255, 0.1)',
                                        border: isManual ? '1px solid rgba(255, 159, 28, 0.3)' : '1px solid rgba(0, 210, 255, 0.3)',
                                        marginBottom: '0.5rem'
                                    }}>
                                        <span style={{
                                            fontSize: '0.72rem',
                                            fontWeight: '800',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '4px',
                                            background: isManual ? 'rgba(255, 159, 28, 0.2)' : 'rgba(0, 210, 255, 0.2)',
                                            color: isManual ? '#ff9f1c' : '#00e5ff',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem'
                                        }}>
                                            {isManual ? <><PenTool size={11} /> MANUAL</> : <><Globe size={11} /> WEB</>}
                                        </span>
                                        <span style={{ fontSize: '0.82rem', color: '#ccc' }}>
                                            {isManual 
                                                ? (editModal.booking.status === 'permanent' ? 'Weekly Recurring Template (Admin Entry)' : 'Manual Admin Entry')
                                                : `Booked via Website ${editModal.booking.orderId ? `(Ref: ${editModal.booking.orderId})` : ''}`
                                            }
                                        </span>
                                    </div>
                                );
                            })()}

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
                                            {Array.from({ length: 18 }, (_, i) => (i + 1) * 30).map(min => (
                                                <option key={min} value={min.toString()}>
                                                    {min < 60 ? `${min} Minutes` : `${min / 60} ${min / 60 === 1 ? 'Hour' : 'Hours'}`}
                                                </option>
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
