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

    // calculate visible images (prev, current, next)
    const visibleImages = [
        { index: getImageIndex(-1), position: 'left' },
        { index: currentIndex, position: 'center' },
        { index: getImageIndex(1), position: 'right' }
    ];

    const variants = {
        center: {
            x: '0%',
            scale: 1,
            zIndex: 5,
            opacity: 1,
            filter: 'blur(0px)',
            transition: { duration: 0.5 }
        },
        left: {
            x: '-60%',
            scale: 0.8,
            zIndex: 2,
            opacity: 0.7,
            filter: 'blur(4px)',
            transition: { duration: 0.5 }
        },
        right: {
            x: '60%',
            scale: 0.8,
            zIndex: 2,
            opacity: 0.7,
            filter: 'blur(4px)',
            transition: { duration: 0.5 }
        }
    };

    return (
        <section className="section-padding" style={{ position: 'relative', overflow: 'hidden', background: '#000', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Building the Dream</h2>
                    <p style={{ color: 'var(--brand-teal)', fontSize: '1.1rem' }}>See how C & S Badminton Complex came to life</p>
                </div>

                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1200px',
                    height: '500px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    perspective: '1000px'
                }}>
                    {visibleImages.map((item) => (
                        <motion.div
                            key={item.index + item.position} // Unique key for transition
                            layoutId={item.index} // Helps framer understand element identity
                            initial={item.position}
                            animate={item.position}
                            variants={variants}
                            style={{
                                position: 'absolute',
                                width: '60%', // Width of the card
                                height: '100%',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                cursor: item.position === 'center' ? 'default' : 'pointer',
                            }}
                            onClick={() => {
                                if (item.position === 'left') prevSlide();
                                if (item.position === 'right') nextSlide();
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
                            {/* Overlay for depth */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: item.position === 'center' ? 'transparent' : 'rgba(0,0,0,0.4)',
                                transition: 'background 0.5s'
                            }} />
                        </motion.div>
                    ))}

                    {/* Controls */}
                    <button
                        onClick={prevSlide}
                        style={{
                            position: 'absolute',
                            left: '5%',
                            zIndex: 10,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={nextSlide}
                        style={{
                            position: 'absolute',
                            right: '5%',
                            zIndex: 10,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            color: 'white',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Dots */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-40px',
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
