import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToBookings } from '../services/bookingService';
import { Calendar, Info, Clock, CheckCircle } from 'lucide-react';

// Get YYYY-MM-DD date array for a week based on offset
const getWeekDates = (weekOffset = 0) => {
    const currentDate = new Date();
    const day = currentDate.getDay();
    // Monday is the start of the week.
    // If Sunday (0), offset by -6 to get previous Monday, else day - 1
    const diffToMonday = currentDate.getDate() - (day === 0 ? 6 : day - 1) + (weekOffset * 7);
    
    const weekDates = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate);
        date.setDate(diffToMonday + i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        weekDates.push({
            dateString: `${year}-${month}-${dayStr}`,
            dayName: dayNames[i],
            shortName: dayNames[i].substring(0, 3),
            displayDate: `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })}`
        });
    }
    return weekDates;
};

const WeeklyBusyGraph = () => {
    const [bookings, setBookings] = useState([]);
    const [weekOffset, setWeekOffset] = useState(0); // 0: This Week, 1: Next Week
    const [hoveredDay, setHoveredDay] = useState(null);

    // Subscribe to bookings in real-time
    useEffect(() => {
        const unsubscribe = subscribeToBookings((data) => {
            setBookings(data || []);
        });
        return () => unsubscribe();
    }, []);

    // Get current week dates
    const weekDays = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

    // Calculate occupancy statistics
    const stats = useMemo(() => {
        // Max capacity per day = 16 hours (6 AM to 10 PM) * 3 courts = 48 slot-hours
        const MAX_DAILY_SLOT_HOURS = 48;
        
        let totalWeekHours = 0;
        let peakDayName = 'N/A';
        let peakDayPercentage = 0;
        
        const daysData = weekDays.map((day) => {
            // Filter active bookings on this date (confirmed or pending, but not cancelled/failed)
            const activeBookings = bookings.filter((b) => {
                const isSameDate = b.date === day.dateString || b.booking_date === day.dateString;
                const status = (b.status || '').toLowerCase();
                const isActive = status !== 'failed' && status !== 'rejected' && status !== 'cancelled';
                return isSameDate && isActive;
            });

            // Calculate total slot-hours booked
            let bookedHours = 0;
            activeBookings.forEach((b) => {
                const durationHours = (b.duration || 60) / 60;
                const numCourts = b.courts ? b.courts.length : 1;
                bookedHours += durationHours * numCourts;
            });

            totalWeekHours += bookedHours;
            const percentage = Math.min(100, Math.round((bookedHours / MAX_DAILY_SLOT_HOURS) * 100));
            
            if (percentage > peakDayPercentage) {
                peakDayPercentage = percentage;
                peakDayName = day.dayName;
            }

            return {
                ...day,
                bookedHours,
                percentage,
                bookingsCount: activeBookings.length
            };
        });

        // Best recommendation
        let recommendation = "Best availability is on weekday mornings before 10:00 AM.";
        const averagePercentage = Math.round(daysData.reduce((sum, d) => sum + d.percentage, 0) / 7);
        
        if (averagePercentage > 65) {
            recommendation = "Currently in high demand. We highly recommend booking 2-3 days in advance.";
        } else if (averagePercentage < 20) {
            recommendation = "Low occupancy this week! Perfect time to grab prime-time court bookings.";
        }

        return {
            daysData,
            totalWeekHours,
            peakDayName,
            peakDayPercentage,
            recommendation,
            averagePercentage
        };
    }, [bookings, weekDays]);

    // Color code helper based on occupancy percentage
    const getOccupancyColor = (pct) => {
        if (pct < 30) return 'var(--brand-teal)'; // Neon Teal (#78DCCA)
        if (pct <= 65) return 'var(--brand-yellow)'; // Neon/Golden Yellow (#f1c40f)
        return 'var(--brand-pink)'; // Neon Pink (#ff69b4)
    };

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto 3rem auto',
            padding: '1.5rem',
            boxSizing: 'border-box'
        }}>
            <div className="glass-panel" style={{
                padding: '2.5rem',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}>
                {/* Glowing Background Spots */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '250px', height: '250px', background: 'var(--brand-teal)', filter: 'blur(130px)', opacity: 0.1, borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '250px', height: '250px', background: 'var(--brand-pink)', filter: 'blur(130px)', opacity: 0.1, borderRadius: '50%' }}></div>

                {/* Header Row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    marginBottom: '2.5rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#2ecc71',
                                animation: 'pulse-live 2s infinite'
                            }}></span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#2ecc71', letterSpacing: '1px' }}>REAL-TIME OCCUPANCY</span>
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                            fontWeight: '800',
                            color: 'white',
                            lineHeight: '1.1',
                            margin: 0,
                            fontFamily: 'var(--font-display)'
                        }}>
                            Weekly Court Activity
                        </h2>
                        <p style={{ color: 'var(--text-gray)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                            Live activity statistics calculated from admin reservations and user checkouts.
                        </p>
                    </div>

                    {/* Week Selector Toggle */}
                    <div style={{
                        display: 'inline-flex',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '0.3rem',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <button
                            onClick={() => setWeekOffset(0)}
                            style={{
                                padding: '0.6rem 1.25rem',
                                border: 'none',
                                background: weekOffset === 0 ? 'var(--brand-teal)' : 'transparent',
                                color: weekOffset === 0 ? '#000' : 'white',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: weekOffset === 0 ? '0 4px 12px rgba(120, 220, 202, 0.3)' : 'none'
                            }}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setWeekOffset(1)}
                            style={{
                                padding: '0.6rem 1.25rem',
                                border: 'none',
                                background: weekOffset === 1 ? 'var(--brand-teal)' : 'transparent',
                                color: weekOffset === 1 ? '#000' : 'white',
                                fontWeight: '700',
                                fontSize: '0.9rem',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: weekOffset === 1 ? '0 4px 12px rgba(120, 220, 202, 0.3)' : 'none'
                            }}
                        >
                            Next Week
                        </button>
                    </div>
                </div>

                {/* Grid Content */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1.2fr',
                    gap: '2.5rem',
                    alignItems: 'center'
                }} className="busy-graph-grid">
                    
                    {/* Columns Diagram */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        height: '240px',
                        padding: '1.5rem 0.5rem 0.5rem 0.5rem',
                        position: 'relative',
                        background: 'rgba(255, 255, 255, 0.01)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        boxSizing: 'border-box'
                    }}>
                        {/* Horizontal Helper Grid Lines */}
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed rgba(255, 255, 255, 0.03)' }}></div>
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed rgba(255, 255, 255, 0.03)' }}></div>
                        <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed rgba(255, 255, 255, 0.03)' }}></div>

                        {stats.daysData.map((day, idx) => {
                            const isHovered = hoveredDay === idx;
                            const occupancyColor = getOccupancyColor(day.percentage);
                            
                            return (
                                <div
                                    key={day.dateString}
                                    onMouseEnter={() => setHoveredDay(idx)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: '12%',
                                        height: '100%',
                                        justifyContent: 'flex-end',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        zIndex: 10
                                    }}
                                >
                                    {/* Tooltip on Hover */}
                                    <AnimatePresence>
                                        {isHovered && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: -8, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                style={{
                                                    position: 'absolute',
                                                    bottom: `${Math.max(15, day.percentage)}%`,
                                                    background: 'rgba(20, 20, 20, 0.95)',
                                                    border: `1px solid ${occupancyColor}`,
                                                    borderRadius: '8px',
                                                    padding: '0.6rem 0.8rem',
                                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                                    zIndex: 100,
                                                    width: '140px',
                                                    textAlign: 'center',
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'white', marginBottom: '2px' }}>
                                                    {day.dayName}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: occupancyColor, fontWeight: '700' }}>
                                                    {day.percentage}% Occupied
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '2px' }}>
                                                    {day.bookedHours.toFixed(1)} hrs booked
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Column Container */}
                                    <div style={{
                                        width: '100%',
                                        maxWidth: '45px',
                                        height: '80%',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '30px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        border: '1px solid rgba(255,255,255,0.02)'
                                    }}>
                                        {/* Filled Bar */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${day.percentage}%` }}
                                            transition={{ duration: 0.8, type: "spring", stiffness: 60 }}
                                            style={{
                                                width: '100%',
                                                background: `linear-gradient(to top, ${occupancyColor}aa, ${occupancyColor})`,
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                borderRadius: '30px',
                                                boxShadow: `0 0 15px ${occupancyColor}33`
                                            }}
                                        ></motion.div>
                                    </div>

                                    {/* Labels */}
                                    <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: '700',
                                            color: isHovered ? 'white' : 'rgba(255,255,255,0.8)',
                                            transition: 'color 0.2s ease'
                                        }}>
                                            {day.shortName}
                                        </div>
                                        <div style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--text-gray)',
                                            marginTop: '1px'
                                        }}>
                                            {day.displayDate}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stats Panel */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Clock size={20} color="var(--brand-teal)" />
                            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'white' }}>Quick Insights</span>
                        </div>

                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>Busiest Day</span>
                            <div style={{
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginTop: '2px'
                            }}>
                                {stats.peakDayPercentage > 0 ? (
                                    <>
                                        <span>{stats.peakDayName}</span>
                                        <span style={{
                                            fontSize: '0.85rem',
                                            color: getOccupancyColor(stats.peakDayPercentage),
                                            background: `${getOccupancyColor(stats.peakDayPercentage)}22`,
                                            padding: '2px 8px',
                                            borderRadius: '20px'
                                        }}>
                                            {stats.peakDayPercentage}% Peak
                                        </span>
                                    </>
                                ) : (
                                    <span>No Bookings Yet</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>Smart Suggestion</span>
                            <div style={{
                                fontSize: '0.85rem',
                                color: 'rgba(255,255,255,0.9)',
                                lineHeight: '1.4',
                                marginTop: '4px',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-start'
                            }}>
                                <Info size={16} color="var(--brand-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{stats.recommendation}</span>
                            </div>
                        </div>

                        {/* Legend Colors */}
                        <div style={{
                            display: 'flex',
                            gap: '0.8rem',
                            flexWrap: 'wrap',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            paddingTop: '1rem',
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-gray)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-teal)' }}></span>
                                <span>Quiet</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-yellow)' }}></span>
                                <span>Moderate</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-pink)' }}></span>
                                <span>Busy</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes pulse-live {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
                }

                @media (max-width: 768px) {
                    .busy-graph-grid {
                        grid-template-columns: 1fr !important;
                        gap: 2rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default WeeklyBusyGraph;
