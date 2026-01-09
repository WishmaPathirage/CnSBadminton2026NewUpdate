import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const images = [
    '/progress/progress_1.jpg',
    '/progress/progress_2.jpg',
    '/progress/progress_3.jpg',
    '/progress/progress_4.jpg',
    '/progress/progress_5.jpg',
    '/progress/progress_6.jpg',
    '/progress/progress_7.jpg',
    '/progress/progress_8.jpg',
    '/progress/progress_9.jpg',
    '/progress/progress_10.jpg'
];

const DevelopmentProgress = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Responsive check
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auto-play
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 4000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const getImageIndex = (offset) => {
        return (currentIndex + offset + images.length) % images.length;
    };

    // Calculate visible images (2 on left, center, 2 on right)
    const visibleImages = [
        { index: getImageIndex(-2), position: 'left2' },
        { index: getImageIndex(-1), position: 'left1' },
        { index: currentIndex, position: 'center' },
        { index: getImageIndex(1), position: 'right1' },
        { index: getImageIndex(2), position: 'right2' }
    ];

    const variants = {
        center: {
            x: '0%',
            scale: 1,
            zIndex: 10,
            opacity: 1,
            filter: 'blur(0px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'block',
            transition: { duration: 0.5, ease: "easeInOut" }
        },
        left1: {
            x: isMobile ? '-15%' : '-50%', // Tighter overlap on mobile
            scale: 0.85,
            zIndex: 5,
            opacity: 0.9,
            filter: 'blur(1px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            display: 'block',
            transition: { duration: 0.5, ease: "easeInOut" }
        },
        left2: {
            x: isMobile ? '-30%' : '-90%',
            scale: 0.7,
            zIndex: 1,
            opacity: isMobile ? 0 : 0.6, // Hide far items on mobile
            filter: 'blur(3px)',
            boxShadow: 'none',
            display: isMobile ? 'none' : 'block',
            transition: { duration: 0.5, ease: "easeInOut" }
        },
        right1: {
            x: isMobile ? '15%' : '50%',
            scale: 0.85,
            zIndex: 5,
            opacity: 0.9,
            filter: 'blur(1px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
            display: 'block',
            transition: { duration: 0.5, ease: "easeInOut" }
        },
        right2: {
            x: isMobile ? '30%' : '90%',
            scale: 0.7,
            zIndex: 1,
            opacity: isMobile ? 0 : 0.6,
            filter: 'blur(3px)',
            boxShadow: 'none',
            display: isMobile ? 'none' : 'block',
            transition: { duration: 0.5, ease: "easeInOut" }
        }
    };

    return (
        <section className="section-padding" style={{ position: 'relative', overflow: 'hidden', background: '#000', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Building the Dream</h2>
                    <p style={{ color: 'var(--brand-teal)', fontSize: '1.1rem' }}>See how C & S Badminton Complex came to life</p>
                </div>

                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1200px',
                    height: isMobile ? '300px' : '500px', // Adjust container height
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    perspective: '1000px',
                    overflow: 'hidden' // Ensure no scrollbar
                }}>
                    {visibleImages.map((item) => (
                        <motion.div
                            key={item.index}
                            initial={item.position}
                            animate={item.position}
                            variants={variants}
                            style={{
                                position: 'absolute',
                                width: isMobile ? '85%' : '600px', // Responsive Width
                                height: isMobile ? 'auto' : '400px', // Responsive Height
                                aspectRatio: '3/2',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: '#111'
                            }}
                            onClick={() => {
                                if (item.position.includes('left')) prevSlide();
                                if (item.position.includes('right')) nextSlide();
                            }}
                        >
                            <img
                                src={images[item.index]}
                                alt={`Progress ${item.index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                        </motion.div>
                    ))}

                    {/* Controls */}
                    <button
                        onClick={prevSlide}
                        style={{
                            position: 'absolute',
                            left: isMobile ? '10px' : '5%',
                            zIndex: 20,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: isMobile ? '40px' : '50px',
                            height: isMobile ? '40px' : '50px',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft size={isMobile ? 20 : 24} />
                    </button>

                    <button
                        onClick={nextSlide}
                        style={{
                            position: 'absolute',
                            right: isMobile ? '10px' : '5%',
                            zIndex: 20,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: isMobile ? '40px' : '50px',
                            height: isMobile ? '40px' : '50px',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <ChevronRight size={isMobile ? 20 : 24} />
                    </button>

                    {/* Dots */}
                    <div style={{
                        position: 'absolute',
                        bottom: isMobile ? '-20px' : '-50px', // Pull up on mobile
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '10px',
                        zIndex: 10
                    }}>
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: index === currentIndex ? 'var(--brand-teal)' : 'rgba(255,255,255,0.3)',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DevelopmentProgress;
