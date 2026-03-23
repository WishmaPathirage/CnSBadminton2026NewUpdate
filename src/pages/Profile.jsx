import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBookingsByUser, getUserProfile } from '../services/bookingService';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Calendar, Clock, CheckCircle, AlertCircle, Trash2, Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!currentUser) return;
            try {
                const [userBookings, userProfile] = await Promise.all([
                    getBookingsByUser(currentUser.uid),
                    getUserProfile(currentUser.uid)
                ]);
                
                // Sort bookings by date and time (newest first)
                const sortedBookings = userBookings.sort((a, b) => {
                    const dateDesc = b.date.localeCompare(a.date);
                    if (dateDesc !== 0) return dateDesc;
                    return b.startTime.localeCompare(a.startTime);
                });

                setBookings(sortedBookings);
                setProfile(userProfile);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [currentUser]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '5px solid var(--brand-teal)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
                <AlertCircle size={50} color="var(--brand-pink)" style={{ marginBottom: '1rem' }} />
                <h2>Please Login to View Profile</h2>
                <Link to="/login" className="btn-gradient" style={{ marginTop: '1rem', padding: '0.8rem 2rem', borderRadius: '30px', textDecoration: 'none' }}>Login</Link>
            </div>
        );
    }

    const stats = {
        total: bookings.length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        pending: bookings.filter(b => b.status === 'pending').length,
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: '120px 20px 60px' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel"
                    style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}
                >
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, var(--brand-teal), var(--brand-pink))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        fontWeight: '800'
                    }}>
                        {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {currentUser.name || 'User Profile'}
                        </h1>
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.8rem', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={16} /> {currentUser.email}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={16} /> {profile?.Phone || 'No phone registered'}</span>
                            {currentUser.role === 'admin' && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-yellow)' }}><Shield size={16} /> Admin Account</span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to="/" className="nav-link" style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Back to Home</Link>
                    </div>
                </motion.div>

                {/* Stats Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Bookings', value: stats.total, icon: <Calendar color="var(--brand-teal)" /> },
                        { label: 'Confirmed', value: stats.confirmed, icon: <CheckCircle color="#2ecc71" /> },
                        { label: 'Pending', value: stats.pending, icon: <Activity color="var(--brand-yellow)" /> },
                    ].map((s, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-panel"
                            style={{ padding: '1.5rem', textAlign: 'center' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>{s.icon}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.5rem 0' }}>{s.value}</div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Booking History Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel"
                    style={{ padding: '2rem' }}
                >
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Clock size={24} color="var(--brand-teal)" /> Booking Activity
                    </h2>

                    {bookings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
                            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>No bookings found in your history.</p>
                            <Link to="/#booking" className="btn-gradient" style={{ marginTop: '1rem', display: 'inline-block', padding: '0.6rem 1.5rem', borderRadius: '20px', textDecoration: 'none', color: 'white', fontSize: '0.9rem' }}>Book Now</Link>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '1rem', fontWeight: 'bold' }}>DATE</th>
                                        <th style={{ padding: '1rem', fontWeight: 'bold' }}>TIME</th>
                                        <th style={{ padding: '1rem', fontWeight: 'bold' }}>COURTS</th>
                                        <th style={{ padding: '1rem', fontWeight: 'bold' }}>DURATION</th>
                                        <th style={{ padding: '1rem', fontWeight: 'bold' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b, i) => {
                                        let statusColor = '#3498db';
                                        if (b.status === 'confirmed') statusColor = '#2ecc71';
                                        else if (b.status === 'pending') statusColor = 'var(--brand-yellow)';
                                        else if (b.status === 'rejected') statusColor = 'var(--brand-pink)';
                                        else if (b.status === 'held') statusColor = '#888';

                                        return (
                                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1.2rem 1rem', fontWeight: 'bold' }}>{b.date}</td>
                                                <td style={{ padding: '1.2rem 1rem' }}><span style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>{b.startTime}</span></td>
                                                <td style={{ padding: '1.2rem 1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                        {b.courts.map(c => (
                                                            <span key={c} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>C{c}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.2rem 1rem', opacity: 0.7 }}>{b.duration} mins</td>
                                                <td style={{ padding: '1.2rem 1rem' }}>
                                                    <span style={{ 
                                                        color: statusColor, 
                                                        fontSize: '0.75rem', 
                                                        fontWeight: 'bold', 
                                                        padding: '0.3rem 0.6rem', 
                                                        borderRadius: '20px', 
                                                        border: `1px solid ${statusColor}`,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

            </div>

            <style>{`
                .glass-panel {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
                tr:hover {
                    background: rgba(255, 255, 255, 0.02);
                }
            `}</style>
        </div>
    );
};

export default Profile;
