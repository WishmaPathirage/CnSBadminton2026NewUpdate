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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
            await deleteBooking(id);
            // loadBookings(); // Not needed with real-time listener
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
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '100px' }}>
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
                                layout
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
                                            onClick={() => handleDelete(booking.id)}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'rgba(231, 76, 60, 0.2)',
                                                border: '1px solid #e74c3c',
                                                borderRadius: '4px',
                                                color: '#e74c3c',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: booking.status === 'pending' ? '100%' : 'auto'
                                            }}
                                            title="Delete Booking"
                                        >
                                            <Trash2 size={16} />
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
