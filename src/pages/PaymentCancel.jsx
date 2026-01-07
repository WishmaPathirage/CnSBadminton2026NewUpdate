import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentCancel = () => {
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
                    maxWidth: '500px',
                    border: '1px solid rgba(255, 68, 68, 0.2)'
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    style={{ marginBottom: '1.5rem', display: 'inline-block' }}
                >
                    <XCircle size={80} color="#ff4444" />
                </motion.div>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Payment Cancelled</h1>
                <p style={{ color: 'var(--text-gray)', marginBottom: '2rem' }}>
                    Your transaction was cancelled or failed. No charges were made.
                </p>

                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '50px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    Try Again
                </Link>
            </motion.div>
        </div>
    );
};

export default PaymentCancel;
