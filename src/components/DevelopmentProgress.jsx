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
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const slideVariants = {
        hidden: (direction) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }
        },
        exit: (direction) => ({
            x: direction > 0 ? -1000 : 1000,
            opacity: 0,
            transition: {
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
            }
        })
    };

    return (
        <section className="section-padding" style={{ position: 'relative', overflow: 'hidden', background: '#000' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff' }}>Building the Dream</h2>
                    <p style={{ color: 'var(--brand-teal)', fontSize: '1.1rem' }}>See how C & S Badminton Complex came to life</p>
                </div>

                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '1000px',
                    aspectRatio: '16/9',
                    maxHeight: '600px', // Cap height on large screens
                    height: 'auto',
                    margin: '0 auto',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.img
                            key={currentIndex}
                            src={images[currentIndex]}
                            custom={direction}
                            variants={slideVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </AnimatePresence>

                    {/* Gradient Overlay for Text Visibility */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40%', // Relative height for responsiveness
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
                    }} />

                    {/* Controls */}
                    <button
                        onClick={prevSlide}
                        style={{
                            position: 'absolute',
                            left: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 2,
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={nextSlide}
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 2,
                            backdropFilter: 'blur(5px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    {/* Dots */}
                    <div style={{
                        position: 'absolute',
                        bottom: '30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '10px',
                        zIndex: 2
                    }}>
                        {images.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setDirection(index > currentIndex ? 1 : -1);
                                    setCurrentIndex(index);
                                }}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: index === currentIndex ? 'var(--brand-teal)' : 'rgba(255,255,255,0.5)',
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
