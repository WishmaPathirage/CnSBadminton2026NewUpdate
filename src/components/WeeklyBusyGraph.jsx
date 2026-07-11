import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToBookings } from '../services/bookingService';
import { Clock, Info, Moon, Sun } from 'lucide-react';

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

    // Calculate occupancy statistics split by time-of-day
    const stats = useMemo(() => {
        let totalWeekHours = 0;
        let peakDayName = 'N/A';
        let peakDayPercentage = 0;
        
        const daysData = weekDays.map((day) => {
            const isWeekend = day.dayName === 'Saturday' || day.dayName === 'Sunday';

            // Filter active bookings on this date (confirmed or pending, but not cancelled/failed)
            const activeBookings = bookings.filter((b) => {
                const isSameDate = b.date === day.dateString || b.booking_date === day.dateString;
                const status = (b.status || '').toLowerCase();
                const isActive = status !== 'failed' && status !== 'rejected' && status !== 'cancelled';
                return isSameDate && isActive;
            });

            // Calculate total slot-hours booked before and after 6 PM
            let daytimeBookedHours = 0;
            let eveningBookedHours = 0;

            activeBookings.forEach((b) => {
                const durationHours = (b.duration || 60) / 60;
                const numCourts = b.courts ? b.courts.length : 1;
                const bookedSlotHours = durationHours * numCourts;

                // Check start hour (default to 8 AM if not parsed)
                let startHour = 8;
                if (b.startTime) {
                    const parts = b.startTime.split(':');
                    startHour = parseInt(parts[0]);
                }

                if (startHour < 18) {
                    daytimeBookedHours += bookedSlotHours;
                } else {
                    eveningBookedHours += bookedSlotHours;
                }
            });

            // Calculate percentages using baseline expectations + real-time additions
            let daytimePercentage = 0;
            let eveningPercentage = 0;

            if (isWeekend) {
                daytimePercentage = Math.min(95, Math.round(85 + (daytimeBookedHours * 5)));
                eveningPercentage = Math.min(95, Math.round(80 + (eveningBookedHours * 5)));
            } else {
                daytimePercentage = Math.min(95, Math.round(20 + (daytimeBookedHours * 15)));
                eveningPercentage = Math.min(95, Math.round(75 + (eveningBookedHours * 20)));
            }

            const totalBookedHours = daytimeBookedHours + eveningBookedHours;
            totalWeekHours += totalBookedHours;

            // Compute overall daily percentage for finding peak day
            const overallPercentage = Math.round((daytimePercentage + eveningPercentage) / 2);
            if (overallPercentage > peakDayPercentage) {
                peakDayPercentage = overallPercentage;
                peakDayName = day.dayName;
            }

            return {
                ...day,
                daytimeBookedHours,
                eveningBookedHours,
                daytimePercentage,
                eveningPercentage,
                bookingsCount: activeBookings.length
            };
        });

        // Best recommendation
        let recommendation = "Best availability is weekday mornings before 10:00 AM.";
        const averagePercentage = Math.round(daysData.reduce((sum, d) => sum + (d.daytimePercentage + d.eveningPercentage)/2, 0) / 7);
        
        if (averagePercentage > 65) {
            recommendation = "High demand. We recommend booking 2-3 days in advance.";
        } else if (averagePercentage < 30) {
            recommendation = "Low occupancy! Perfect time to grab court bookings.";
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
        if (pct < 30) return '#78DCCA'; // Neon Teal
        if (pct <= 65) return '#FBCA3F'; // Neon/Golden Yellow
        return '#E94E8F'; // Neon Pink
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '720px',
            margin: '0 auto',
            padding: '0.25rem',
            boxSizing: 'border-box'
        }}>
            <div className="glass-panel" style={{
                padding: '1.5rem', // Reduced padding from 2.5rem to 1.5rem for compact size
                borderRadius: '20px',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}>
                {/* Glowing Background Spots */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'var(--brand-teal)', filter: 'blur(100px)', opacity: 0.08, borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '150px', height: '150px', background: 'var(--brand-pink)', filter: 'blur(100px)', opacity: 0.08, borderRadius: '50%' }}></div>

                {/* Header Row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center', // Centered to save vertical space
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '1.25rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
                            <span style={{
                                display: 'inline-block',
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#2ecc71',
                                animation: 'pulse-live 2s infinite'
                            }}></span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#2ecc71', letterSpacing: '1px' }}>REAL-TIME OCCUPANCY</span>
                        </div>
                        <h2 style={{
                            fontSize: '1.35rem', // Shortened title size
                            fontWeight: '800',
                            color: 'white',
                            lineHeight: '1.1',
                            margin: 0,
                            fontFamily: 'var(--font-display)'
                        }}>
                            Weekly Court Activity
                        </h2>
                    </div>

                    {/* Week Selector Toggle */}
                    <div style={{
                        display: 'inline-flex',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '0.2rem',
                        borderRadius: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative',
                        zIndex: 50
                    }}>
                        <button
                            onClick={() => setWeekOffset(0)}
                            style={{
                                padding: '0.45rem 1rem', // Compact padding
                                border: 'none',
                                background: weekOffset === 0 ? 'var(--brand-teal)' : 'transparent',
                                color: weekOffset === 0 ? '#000' : 'white',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: weekOffset === 0 ? '0 4px 10px rgba(120, 220, 202, 0.3)' : 'none',
                                position: 'relative',
                                zIndex: 60
                            }}
                        >
                            This Week
                        </button>
                        <button
                            onClick={() => setWeekOffset(1)}
                            style={{
                                padding: '0.45rem 1rem',
                                border: 'none',
                                background: weekOffset === 1 ? 'var(--brand-teal)' : 'transparent',
                                color: weekOffset === 1 ? '#000' : 'white',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: weekOffset === 1 ? '0 4px 10px rgba(120, 220, 202, 0.3)' : 'none',
                                position: 'relative',
                                zIndex: 60
                            }}
                        >
                            Next Week
                        </button>
                    </div>
                </div>

                {/* Grid Content - Flex Column Layout for Horizontal Stretch */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%'
                }}>
                    
                    {/* Columns Diagram Container - Shrunk height to 150px */}
                    <div style={{
                        height: '150px',
                        position: 'relative',
                        perspective: '1000px',
                        width: '100%'
                    }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={weekOffset}
                                initial={{ rotateY: 180, opacity: 0 }}
                                animate={{ rotateY: 0, opacity: 1 }}
                                exit={{ rotateY: -180, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    height: '100%',
                                    width: '100%',
                                    padding: '1rem 0.25rem 0.25rem 0.25rem',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                    boxSizing: 'border-box',
                                    transformOrigin: 'center',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden'
                                }}
                            >
                                {/* Horizontal Helper Grid Lines */}
                                <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed rgba(255, 255, 255, 0.02)' }}></div>
                                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed rgba(255, 255, 255, 0.02)' }}></div>
                                <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed rgba(255, 255, 255, 0.02)' }}></div>

                                {stats.daysData.map((day, idx) => {
                                    const isHovered = hoveredDay === idx;
                                    
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
                                                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: -5, scale: 1 }}
                                                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: '90%',
                                                            background: 'rgba(20, 20, 20, 0.95)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '8px',
                                                            padding: '0.45rem 0.65rem',
                                                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                                            zIndex: 100,
                                                            width: '160px',
                                                            textAlign: 'left',
                                                            pointerEvents: 'none'
                                                        }}
                                                    >
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'white', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
                                                            {day.dayName}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                            <span style={{ color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '3px' }}><Sun size={10} /> Day:</span>
                                                            <span style={{ color: getOccupancyColor(day.daytimePercentage), fontWeight: '700' }}>{day.daytimePercentage}%</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: 'var(--text-gray)', display: 'flex', alignItems: 'center', gap: '3px' }}><Moon size={10} /> Night:</span>
                                                            <span style={{ color: getOccupancyColor(day.eveningPercentage), fontWeight: '700' }}>{day.eveningPercentage}%</span>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Double Column Container */}
                                            <div style={{
                                                display: 'flex',
                                                gap: '4px',
                                                width: '100%',
                                                height: '75%',
                                                justifyContent: 'center',
                                                alignItems: 'flex-end',
                                                position: 'relative'
                                            }}>
                                                {/* Daytime Bar (Before 6 PM) */}
                                                <div className="occupancy-bar-wrapper">
                                                    <motion.div
                                                        initial={{ height: '0%' }}
                                                        animate={{ height: `${day.daytimePercentage}%` }}
                                                        transition={{ duration: 1.5, ease: "easeInOut", delay: idx * 0.05 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            overflow: 'hidden',
                                                            background: 'transparent',
                                                            borderRadius: '0 0 8px 8px',
                                                            boxShadow: `0 0 10px ${getOccupancyColor(day.daytimePercentage)}33`
                                                        }}
                                                    >
                                                        {day.daytimePercentage > 0 && (
                                                            <>
                                                                {/* Water Liquid Body */}
                                                                <div 
                                                                    className="water-body"
                                                                    style={{ background: getOccupancyColor(day.daytimePercentage) }}
                                                                />
                                                                {/* Wavy Sloshing Top Contour */}
                                                                <div 
                                                                    className="water-wave wave-back"
                                                                    style={{ background: getOccupancyColor(day.daytimePercentage), opacity: 0.6 }}
                                                                />
                                                                <div 
                                                                    className="water-wave wave-glow"
                                                                />
                                                                <div 
                                                                    className="water-wave wave-front"
                                                                    style={{ background: getOccupancyColor(day.daytimePercentage) }}
                                                                />
                                                            </>
                                                        )}
                                                    </motion.div>
                                                </div>

                                                {/* Evening Bar (After 6 PM) */}
                                                <div className="occupancy-bar-wrapper">
                                                    <motion.div
                                                        initial={{ height: '0%' }}
                                                        animate={{ height: `${day.eveningPercentage}%` }}
                                                        transition={{ duration: 1.5, ease: "easeInOut", delay: (idx * 0.05) + 0.1 }}
                                                        style={{
                                                            position: 'absolute',
                                                            bottom: 0,
                                                            left: 0,
                                                            width: '100%',
                                                            overflow: 'hidden',
                                                            background: 'transparent',
                                                            borderRadius: '0 0 8px 8px',
                                                            boxShadow: `0 0 10px ${getOccupancyColor(day.eveningPercentage)}33`
                                                        }}
                                                    >
                                                        {day.eveningPercentage > 0 && (
                                                            <>
                                                                {/* Water Liquid Body */}
                                                                <div 
                                                                    className="water-body"
                                                                    style={{ background: getOccupancyColor(day.eveningPercentage) }}
                                                                />
                                                                {/* Wavy Sloshing Top Contour */}
                                                                <div 
                                                                    className="water-wave wave-back"
                                                                    style={{ background: getOccupancyColor(day.eveningPercentage), opacity: 0.6 }}
                                                                />
                                                                <div 
                                                                    className="water-wave wave-glow"
                                                                />
                                                                <div 
                                                                    className="water-wave wave-front"
                                                                    style={{ background: getOccupancyColor(day.eveningPercentage) }}
                                                                />
                                                            </>
                                                        )}
                                                    </motion.div>
                                                </div>
                                            </div>

                                            {/* Labels */}
                                            <div style={{ marginTop: '0.4rem', textAlign: 'center' }}>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    color: isHovered ? 'white' : 'rgba(255,255,255,0.8)',
                                                    transition: 'color 0.2s ease'
                                                }}>
                                                    {day.shortName}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    color: 'var(--text-gray)',
                                                    marginTop: '1px'
                                                }}>
                                                    {day.displayDate}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Stats Panel - Horizontal Flex Row for Shorter height */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '12px',
                        padding: '0.75rem 1.25rem',
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxSizing: 'border-box',
                        marginTop: '1rem',
                        width: '100%'
                    }} className="busy-graph-stats-row">
                        
                        {/* Busiest Day */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>Busiest Day</span>
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: '800',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                {stats.peakDayPercentage > 0 ? (
                                    <>
                                        <span>{stats.peakDayName}</span>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: getOccupancyColor(stats.peakDayPercentage),
                                            fontWeight: 'bold'
                                        }}>
                                            {stats.peakDayPercentage}% Peak
                                        </span>
                                    </>
                                ) : (
                                    <span>N/A</span>
                                )}
                            </span>
                        </div>

                        {/* Recommendation */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '280px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-gray)' }}>Smart Tip</span>
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.9)',
                                display: 'flex',
                                gap: '4px',
                                alignItems: 'center',
                                lineHeight: '1.2'
                            }}>
                                <Info size={12} color="var(--brand-teal)" style={{ flexShrink: 0 }} />
                                <span>{stats.recommendation}</span>
                            </span>
                        </div>

                        {/* Combined Legends (Colors & Time Blocks) */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            {/* Color indicators */}
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: 'var(--text-gray)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#78DCCA' }}></span>
                                    <span>Quiet</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FBCA3F' }}></span>
                                    <span>Mod</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E94E8F' }}></span>
                                    <span>Busy</span>
                                </div>
                            </div>

                            {/* AM/PM Column indicators */}
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ display: 'inline-block', width: '5px', height: '8px', borderRadius: '1px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}></span>
                                    <span>Left: AM</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ display: 'inline-block', width: '5px', height: '8px', borderRadius: '1px', background: 'rgba(255,255,255,0.5)', border: '1px solid white' }}></span>
                                    <span>Right: PM</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            <style>{`
                .occupancy-bar-wrapper {
                    width: 14px;
                    height: 100%;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid rgba(255,255,255,0.02);
                }

                .water-body {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: calc(100% - 6px);
                    border-radius: 0 0 8px 8px;
                }

                .water-wave {
                    position: absolute;
                    width: 60px;
                    height: 60px;
                    left: -23px; /* Center of 14px bar: (60-14)/2 = 23 */
                    top: -56px;
                    pointer-events: none;
                    transform-origin: 50% 48%;
                }

                .wave-back {
                    border-radius: 43%;
                    animation: water-wave-spin 6s linear infinite;
                }

                .wave-front {
                    border-radius: 40%;
                    animation: water-wave-spin 4s linear infinite;
                }

                .wave-glow {
                    background: rgba(255, 255, 255, 0.45);
                    border-radius: 42%;
                    animation: water-wave-spin 5s linear infinite;
                    animation-delay: 1s;
                    z-index: 8;
                }

                @keyframes water-wave-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes pulse-live {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
                }

                @media (max-width: 580px) {
                    .busy-graph-stats-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 0.8rem !important;
                    }
                }

                @media (max-width: 480px) {
                    .occupancy-bar-wrapper {
                        width: 10px;
                    }
                    .water-wave {
                        width: 50px;
                        height: 50px;
                        left: -20px; /* Center on 10px bar: (50-10)/2 = 20 */
                        top: -46px;
                    }
                }
            `}</style>
        </div>
    );
};

export default WeeklyBusyGraph;
