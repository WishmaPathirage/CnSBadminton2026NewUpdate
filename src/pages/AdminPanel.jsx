import { useState, useEffect, useRef } from 'react';
import { subscribeToBookings, updateBookingStatus, deleteBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Trash2 } from 'lucide-react';

const AdminPanel = () => {
    const [bookings, setBookings] = useState([]);
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();
    const prevBookingsRef = useRef([]);

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
                                    icon: '/logo.jpg' // Assuming logo exists at root
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
        await updateBookingStatus(id, newStatus);

        if (newStatus === 'confirmed' && booking) {
            // Auto-open WhatsApp to notify user
            const message = `Booking Confirmation - C & S Badminton Complex (PVT) Ltd

Player Name: ${booking.userName}
Date: ${booking.date}
Time Slot: ${booking.startTime}
Duration: ${booking.duration} mins
Court No: ${booking.courts.join(', ')}
Other: Ref #${booking.id}

Please arrive and depart on time. Smoking is prohibited. For cancellations, inform us at least 3 hours in advance. Your e-invoice will follow shortly.

Thank you for your cooperation!

Best Regards,
C & S Badminton Complex (PVT) Ltd
Phone: +94 777 98 32 64
Email: cnsb233@gmail.com
Website: www.cnsbadminton.lk`;

            // Format user phone: 077... -> 9477...
            let phone = booking.userPhone || '';
            phone = phone.replace(/\D/g, ''); // Remove non-digits
            if (phone.startsWith('0')) phone = '94' + phone.substring(1);

            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }


    };

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, bookingId: null });
    const [deletingId, setDeletingId] = useState(null);

    const handleDeleteClick = (e, id) => {
        e.stopPropagation();
        setConfirmModal({ isOpen: true, bookingId: id });
    };

    const confirmDelete = async () => {
        const id = confirmModal.bookingId;
        if (!id) return;

        setConfirmModal({ isOpen: false, bookingId: null }); // Close modal immediately
        setDeletingId(id); // Show loader on button

        try {
            await deleteBooking(id);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Error: " + error.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return <div style={{ paddingTop: '100px', textAlign: 'center', color: 'white' }}>Loading...</div>;
    }

    if (!currentUser || currentUser.role !== 'admin') {
        return null;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px', position: 'relative' }}>
            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setConfirmModal({ isOpen: false, bookingId: null })}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '16px',
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ marginBottom: '1.5rem', color: '#e74c3c' }}>
                            <Trash2 size={48} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>Delete Booking?</h3>
                        <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                            Are you sure you want to delete this booking? This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, bookingId: null })}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #333',
                                    background: 'transparent',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{
                                    padding: '0.8rem 1.5rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#e74c3c',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
                                }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: 'var(--primary-green)' }}>Admin Dashboard</h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Welcome, {currentUser.name}</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        border: '1px solid #e74c3c',
                        color: '#e74c3c',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Date & Time</th>
                            <th style={{ padding: '1rem' }}>Courts</th>
                            <th style={{ padding: '1rem' }}>Duration</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <motion.tr
                                key={booking.id}
                                style={{
                                    borderBottom: '1px solid #222',
                                    backgroundColor: booking.status === 'pending' ? 'rgba(46, 204, 113, 0.05)' : 'transparent'
                                }}
                            >
                                <td style={{ padding: '1rem', opacity: 0.5, color: 'rgba(255,255,255,0.6)' }}>#{booking.id}</td>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: 'white' }}>{booking.userName}</td>
                                <td style={{ padding: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                                    {booking.date} <br />
                                    <span style={{ color: 'var(--primary-green)' }}>{booking.startTime}</span>
                                </td>
                                <td style={{ padding: '1rem', color: 'white' }}>Court {booking.courts.join(', ')}</td>
                                <td style={{ padding: '1rem', color: 'white' }}>{booking.duration} min</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        backgroundColor: booking.status === 'confirmed' ? 'green' : (booking.status === 'rejected' ? 'red' : 'orange'),
                                        color: 'white'
                                    }}>
                                        {booking.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {booking.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                                style={{ padding: '0.5rem', background: 'var(--primary-green)', borderRadius: '4px', color: 'black', border: 'none', cursor: 'pointer' }}
                                                title="Confirm"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'rejected')}
                                                style={{ padding: '0.5rem', background: 'orange', borderRadius: '4px', color: 'white', border: 'none', cursor: 'pointer' }}
                                                title="Reject"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    <div style={{ marginTop: booking.status === 'pending' ? '0.5rem' : '0' }}>
                                        <button
                                            onClick={(e) => handleDeleteClick(e, booking.id)}
                                            disabled={deletingId === booking.id}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(231, 76, 60, 0.2)',
                                                border: '1px solid #e74c3c',
                                                borderRadius: '4px',
                                                color: '#e74c3c',
                                                cursor: deletingId === booking.id ? 'wait' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: booking.status === 'pending' ? '100%' : 'auto',
                                                opacity: deletingId === booking.id ? 0.5 : 1,
                                                position: 'relative',
                                                zIndex: 10
                                            }}
                                            title="Delete Booking"
                                        >
                                            {deletingId === booking.id ? <span style={{ fontSize: '12px' }}>...</span> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>


    );
};

export default AdminPanel;
