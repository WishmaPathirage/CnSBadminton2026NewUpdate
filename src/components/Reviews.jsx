import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const reviews = [
    {
        id: 1,
        name: "Shantha Pathirage",
        rating: 5,
        text: "A really good badminton court in a calm and peaceful environment! There's plenty of space for parking, which is very convenient. They also have a restaurant and a juice bar if you need something after a session.",
        date: "Google Review"
    },
    {
        id: 2,
        name: "Punethra Kaunarathna",
        rating: 5,
        text: "It was a great badminton court with three well-maintained courts. All our friends really enjoyed playing here. I’d definitely give it 5 stars!",
        date: "Google Review"
    },
    {
        id: 3,
        name: "Hiran Walawage",
        rating: 5,
        text: "Excellent Facility and Great Atmosphere! C & S Badminton Complex (PVT) Ltd is one of the best places to play badminton in the area.",
        date: "Google Review"
    },
    {
        id: 4,
        name: "Pathum Chamodi",
        rating: 5,
        text: "C & S Badminton Complex offers top-notch facilities with clean courts, great lighting, and friendly staff. Perfect place for both casual play and serious training. Highly recommended!",
        date: "Google Review"
    },
    {
        id: 5,
        name: "Tharusha Chankamie",
        rating: 5,
        text: "C&S Badminton Complex is in great condition one of the best places to enjoy badminton as a hobby with friends! The courts are clean, well-maintained, and have excellent lighting.",
        date: "Google Review"
    },
    {
        id: 6,
        name: "Anuhas Sadeepa",
        rating: 5,
        text: "Such a nice and calm place! It’s located away from the busy urban area, so there’s no noise or distractions while playing. Whether you’re a pro player or just playing with friends and family for fun, this is the best place in Galle to enjoy.",
        date: "Google Review"
    },
    {
        id: 7,
        name: "Pulsara Sandeepa",
        rating: 5,
        text: "Great place for badminton lovers! The environment is welcoming, with plenty of space with 3 courts. There’s also ample parking. The staff is very friendly.",
        date: "Google Review"
    },
    {
        id: 8,
        name: "Nipuni Wakwella",
        rating: 5,
        text: "The best place for Badminton lovers in Galle. The complex is well maintained and properly equipped. Mr Chaniru -the owner is a well talented National player and an amazing Badminton coach.",
        date: "Google Review"
    },
    {
        id: 9,
        name: "Enoka Sadamali",
        rating: 5,
        text: "Great place to play badminton. Clean courts, friendly staff, and smooth service. Highly recommended.",
        date: "Google Review"
    },
    {
        id: 10,
        name: "Kalindu Gunawardana",
        rating: 5,
        text: "Great place to play badminton! The courts are clean and well-maintained with good lighting. Staff are friendly and helpful, and the atmosphere is really nice. Highly recommend..",
        date: "Google Review"
    }
];

const Reviews = () => {
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

                <div style={{ display: 'flex', overflow: 'hidden', width: '100%', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                    <motion.div
                        animate={{ x: ["0%", "-100%"] }}
                        transition={{
                            repeat: Infinity,
                            duration: 30,
                            ease: "linear"
                        }}
                        style={{ display: 'flex', gap: '30px', paddingRight: '30px' }}
                    >
                        {[...reviews, ...reviews].map((review, index) => (
                            <motion.div
                                key={`${review.id}-${index}`}
                                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                                className="card-glass"
                                style={{
                                    padding: '30px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px',
                                    position: 'relative',
                                    minWidth: '350px',
                                    flexShrink: 0
                                }}
                            >
                                <Quote
                                    size={40}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        color: 'var(--brand-teal)',
                                        opacity: 0.2
                                    }}
                                />

                                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={18} fill="var(--brand-yellow)" color="var(--brand-yellow)" />
                                    ))}
                                </div>

                                <p style={{ color: 'var(--text-light)', fontStyle: 'italic', lineHeight: '1.6', flex: 1 }}>
                                    "{review.text}"
                                </p>

                                <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                    <h4 style={{ color: 'var(--brand-teal)', fontWeight: '600', marginBottom: '5px' }}>
                                        {review.name}
                                    </h4>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-gray)' }}>
                                        {review.date}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
