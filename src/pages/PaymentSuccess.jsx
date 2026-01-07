import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        // ideally verify payment status with backend here
        console.log("Payment Successful for Order:", orderId);
    }, [orderId]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)',
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'var(--bg-card)',
                    padding: '3rem',
                    borderRadius: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    maxWidth: '500px'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    style={{ marginBottom: '1.5rem', display: 'inline-block' }}
                >
                    <CheckCircle size={80} color="var(--primary-green)" />
                </motion.div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Payment Successful!</h1>
                <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
                    Thank you for your booking. Your court has been reserved.<br />
                    Order ID: <span style={{ fontFamily: 'monospace', color: 'white' }}>{orderId || 'N/A'}</span>
                </p>

                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        backgroundColor: 'var(--primary-green)',
                        color: 'black',
                        textDecoration: 'none',
                        borderRadius: '50px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}
                >
                    Back to Home
                </Link>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
