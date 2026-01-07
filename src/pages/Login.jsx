import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../services/authService';
import { validateEmail, getFriendlyErrorMessage } from '../utils/validators';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                if (result.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                const msg = result.code ? getFriendlyErrorMessage(result.code) : result.message;
                setError(msg);
            }
        } catch (err) {
            setError("An unexpected error occurred.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="section-padding" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-glass"
                style={{
                    padding: '3rem',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '500px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Glow */}
                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(46, 204, 113, 0.1) 0%, transparent 70%)', zIndex: -1 }} />

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p style={{ color: 'var(--text-gray)' }}>Login to access your dashboard</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(231, 76, 60, 0.2)',
                        border: '1px solid #e74c3c',
                        color: '#ff6b6b',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            style={inputStyle}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@cns.lk"
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Password</label>
                        <input
                            type="password"
                            required
                            style={inputStyle}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                        className="btn-gradient"
                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.8 : 1 }}
                    >
                        {isLoading ? 'Logging In...' : 'Login'}
                    </motion.button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>Register Here</Link>
                </div>
            </motion.div>
        </section>
    );
};

const inputStyle = {
    width: '100%',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.3s'
};

export default Login;
