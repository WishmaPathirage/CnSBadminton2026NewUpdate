import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Coffee, Trophy, Users, Layers } from 'lucide-react';

const Services = () => {
    const services = [
        {
            title: 'BWF Standard Courts',
            icon: <Layers size={40} />,
            desc: '4 International standard synthetic courts with glare-free lighting.'
        },
        {
            title: 'Coaching Academy',
            icon: <Users size={40} />,
            desc: 'Professional training programs for beginners to advanced players.'
        },
        {
            title: 'Pro Shop',
            icon: <ShoppingBag size={40} />,
            desc: 'Exclusive range of branded rackets, shoes, and restringing services.'
        },
        {
            title: 'Tournaments',
            icon: <Trophy size={40} />,
            desc: 'Hosting corporate, inter-club, and open badminton championships.'
        },
        {
            title: 'Cafe & Juice Bar',
            icon: <Coffee size={40} />,
            desc: 'Fresh juices, protein shakes, and snacks to refuel your game.'
        },
    ];

    return (
        <section id="services" className="section-padding" style={{ position: 'relative' }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    style={{ textAlign: 'center', marginBottom: '3rem' }}
                >
                    <h2 style={{ fontSize: '2.5rem' }}>
                        <span className="text-gradient">Our Premium Facilities</span>
                    </h2>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {services.map((service, index) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.03 }}
                            className="card-glass"
                            style={{
                                padding: '2.5rem',
                                borderRadius: '24px',
                                textAlign: 'center',
                                cursor: 'default',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(120, 220, 202, 0.2), rgba(251, 202, 63, 0.2))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                color: 'var(--brand-teal)'
                            }}>
                                {service.icon}
                            </div>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>{service.title}</h3>
                            <p style={{ color: 'var(--text-gray)', lineHeight: '1.6' }}>{service.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Services;
