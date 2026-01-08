import { Link } from 'react-router-dom';
import { X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentCancel = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Effects */}
            <div style={{ position: 'absolute', top: '20%', right: '10%', width: '300px', height: '300px', background: 'rgba(255, 68, 68, 0.1)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-panel"
                style={{
                    padding: '4rem 3rem',
                    textAlign: 'center',
                    maxWidth: '480px',
                    width: '100%',
                    border: '1px solid rgba(255, 68, 68, 0.1)'
                }}
            >
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '50%',
                            background: 'rgba(255, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 68, 68, 0.2)'
                        }}
                    >
                        <X size={40} color="#ff4444" />
                    </motion.div>
                </div>

                <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Payment Cancelled</h1>
                <p style={{ color: 'var(--text-gray)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                    It seems the transaction was not completed.<br />
                    Don't worry, no charges were made.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link
                        to="/"
                        style={{
                            padding: '0.8rem 2rem',
                            color: 'var(--text-gray)',
                            textDecoration: 'none',
                            fontWeight: '500',
                            transition: 'color 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.color = 'white'}
                        onMouseOut={(e) => e.target.style.color = 'var(--text-gray)'}
                    >
                        Cancel
                    </Link>
                    <Link
                        to="/"
                        style={{
                            padding: '0.8rem 2rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '50px',
                            fontWeight: '600',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Try Again
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentCancel;
