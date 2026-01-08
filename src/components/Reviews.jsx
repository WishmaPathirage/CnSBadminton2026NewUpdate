import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const reviews = [
    {
        id: 1,
        name: "Shantha Pathirage",
        rating: 5,
        text: "A really good badminton court in a calm and peaceful environment! There's plenty of space for parking, which is very convenient. They also have a restaurant and a juice bar if you need something after a session.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Shantha+Pathirage&background=random&color=fff"
    },
    {
        id: 2,
        name: "Punethra Kaunarathna",
        rating: 5,
        text: "It was a great badminton court with three well-maintained courts. All our friends really enjoyed playing here. I’d definitely give it 5 stars!",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Punethra+Kaunarathna&background=random&color=fff"
    },
    {
        id: 3,
        name: "Hiran Walawage",
        rating: 5,
        text: "Excellent Facility and Great Atmosphere! C & S Badminton Complex (PVT) Ltd is one of the best places to play badminton in the area.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Hiran+Walawage&background=random&color=fff"
    },
    {
        id: 4,
        name: "Pathum Chamodi",
        rating: 5,
        text: "C & S Badminton Complex offers top-notch facilities with clean courts, great lighting, and friendly staff. Perfect place for both casual play and serious training. Highly recommended!",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Pathum+Chamodi&background=random&color=fff"
    },
    {
        id: 5,
        name: "Tharusha Chankamie",
        rating: 5,
        text: "C&S Badminton Complex is in great condition one of the best places to enjoy badminton as a hobby with friends! The courts are clean, well-maintained, and have excellent lighting.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Tharusha+Chankamie&background=random&color=fff"
    },
    {
        id: 6,
        name: "Anuhas Sadeepa",
        rating: 5,
        text: "Such a nice and calm place! It’s located away from the busy urban area, so there’s no noise or distractions while playing. Whether you’re a pro player or just playing with friends and family for fun, this is the best place in Galle to enjoy.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Anuhas+Sadeepa&background=random&color=fff"
    },
    {
        id: 7,
        name: "Pulsara Sandeepa",
        rating: 5,
        text: "Great place for badminton lovers! The environment is welcoming, with plenty of space with 3 courts. There’s also ample parking. The staff is very friendly.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Pulsara+Sandeepa&background=random&color=fff"
    },
    {
        id: 8,
        name: "Nipuni Wakwella",
        rating: 5,
        text: "The best place for Badminton lovers in Galle. The complex is well maintained and properly equipped. Mr Chaniru -the owner is a well talented National player and an amazing Badminton coach.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Nipuni+Wakwella&background=random&color=fff"
    },
    {
        id: 9,
        name: "Enoka Sadamali",
        rating: 5,
        text: "Great place to play badminton. Clean courts, friendly staff, and smooth service. Highly recommended.",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Enoka+Sadamali&background=random&color=fff"
    },
    {
        id: 10,
        name: "Kalindu Gunawardana",
        rating: 5,
        text: "Great place to play badminton! The courts are clean and well-maintained with good lighting. Staff are friendly and helpful, and the atmosphere is really nice. Highly recommend..",
        date: "Google Review",
        image: "https://ui-avatars.com/api/?name=Kalindu+Gunawardana&background=random&color=fff"
    }
];

const Reviews = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-advance
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % reviews.length);
        }, 5000); // 5 seconds per review
        return () => clearInterval(timer);
    }, []);

    const nextReview = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const prevReview = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    return (
        <section className="section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Decor */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    right: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'rgba(233, 78, 143, 0.1)',
                    filter: 'blur(100px)',
                    borderRadius: '50%',
                    zIndex: -1
                }}
            />

            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '60px' }}
                >
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                        <span className="text-gradient">What Our Players Say</span>
                    </h2>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem' }}>
                        Rated 5.0 Stars on Google Reviews
                    </p>
                </motion.div>

                <div style={{
                    maxWidth: '800px',
                    margin: '0 auto',
                    position: 'relative',
                    minHeight: '400px', // Reserve space
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>

                    {/* Navigation Buttons */}
                    <button
                        onClick={prevReview}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            zIndex: 10,
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={nextReview}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'white',
                            zIndex: 10,
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <ChevronRight size={24} />
                    </button>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="card-glass"
                            style={{
                                padding: '2rem',
                                borderRadius: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1.5rem',
                                textAlign: 'center',
                                width: '100%',
                                maxWidth: '600px',
                                position: 'relative',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {/* Profile Picture Top Center */}
                            <div style={{ position: 'relative' }}>
                                <motion.img
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                    src={reviews[currentIndex].image}
                                    alt={reviews[currentIndex].name}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        border: '3px solid var(--brand-teal)',
                                        objectFit: 'cover',
                                        boxShadow: '0 0 20px rgba(120, 220, 202, 0.2)'
                                    }}
                                />
                                <Quote
                                    size={30}
                                    fill="var(--brand-teal)"
                                    style={{
                                        position: 'absolute',
                                        bottom: -5,
                                        right: -10,
                                        color: 'var(--brand-teal)',
                                        background: '#0f0f0f',
                                        borderRadius: '50%'
                                    }}
                                />
                            </div>

                            {/* Name & Date */}
                            <div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>
                                    {reviews[currentIndex].name}
                                </h3>
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill="var(--brand-yellow)" color="var(--brand-yellow)" />
                                    ))}
                                </div>
                                <span style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                                    {reviews[currentIndex].date}
                                </span>
                            </div>

                            {/* Text */}
                            <p style={{
                                color: 'var(--text-light)',
                                lineHeight: '1.8',
                                fontSize: '1.1rem',
                                fontStyle: 'italic',
                                maxWidth: '90%'
                            }}>
                                "{reviews[currentIndex].text}"
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dots Indicator */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px' }}>
                    {reviews.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                border: 'none',
                                background: idx === currentIndex ? 'var(--brand-teal)' : 'rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
};

export default Reviews;


