import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { resetPassword } from '../services/authService';

const ForgotPasswordModal = ({ onClose, defaultEmail }) => {
    const [email, setEmail] = useState(defaultEmail || '');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        const result = await resetPassword(email);
        if (result.success) {
            setStatus('success');
            setMessage('Password reset email sent! Check your inbox.');
        } else {
            setStatus('error');
            setMessage(result.message || 'Failed to send reset email.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(5px)'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    borderRadius: '24px',
                    width: '90%',
                    maxWidth: '400px',
                    position: 'relative'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-gray)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h3 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1rem', textAlign: 'center' }}>Reset Password</h3>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--primary-green)', marginBottom: '2rem' }}>{message}</p>
                        <button onClick={onClose} className="btn-gradient" style={{ padding: '0.8rem 2rem', borderRadius: '50px' }}>Close</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Enter your email to receive a password reset link.
                        </p>

                        {status === 'error' && <p style={{ color: '#ff6b6b', marginBottom: '1rem', textAlign: 'center' }}>{message}</p>}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="email"
                                required
                                className="glass-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                        </div>

                        <button
                            disabled={status === 'loading'}
                            className="btn-gradient"
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '50px', fontWeight: 'bold' }}
                        >
                            {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ForgotPasswordModal;
