import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Coffee, Layers, CreditCard, Smartphone, Utensils, Store } from 'lucide-react';

const Services = () => {
    const services = [
        {
            title: 'Court Rental',
            icon: <Layers size={40} />,
            desc: '3 indoor courts, open 24/7.'
        },
        {
            title: 'Phone & Online Booking',
            icon: <Smartphone size={40} />,
            desc: 'Easy and flexible booking options.'
        },
        {
            title: 'Card & QR Payments',
            icon: <CreditCard size={40} />,
            desc: 'Multiple payment options for your convenience.'
        },
        {
            title: 'Racket Gutting',
            icon: <Zap size={40} />,
            desc: 'Fast, pro-level stringing services.'
        },
        {
            title: 'Equipment Shop',
            icon: <ShoppingBag size={40} />,
            desc: 'Rackets, shuttles, grips & more.'
        },
        {
            title: 'Juice Bar',
            icon: <Coffee size={40} />,
            desc: 'Fresh juices & energy drinks.'
        },
        {
            title: 'Restaurant',
            icon: <Utensils size={40} />,
            desc: 'Tasty meals on-site.'
        },
        {
            title: 'Mini Mart',
            icon: <Store size={40} />,
            desc: 'Snacks & essentials.'
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
                        <span className="text-gradient">Our Premium Services</span>
                    </h2>
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {services.map((service, index) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.03 }}
                            className="card-glass"
                            onClick={() => {
                                if (service.title === 'Racket Gutting') {
                                    const element = document.getElementById('stringing');
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }
                            }}
                            style={{
                                padding: '2.5rem',
                                borderRadius: '24px',
                                textAlign: 'center',
                                cursor: service.title === 'Racket Gutting' ? 'pointer' : 'default',
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
