import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, loginWithGoogle, resetPassword } from '../services/authService';
import { validateEmail, getFriendlyErrorMessage } from '../utils/validators';
import { X } from 'lucide-react';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                if (result.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error(err);
            setError("Google Sign-In failed.");
        } finally {
            setIsLoading(false);
        }
    };

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


        <section className="section-padding" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 1rem' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{
                    padding: '2rem',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '500px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Decorative Glow */}
                <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(120, 220, 202, 0.1) 0%, transparent 70%)', zIndex: -1 }} />

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
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Email Address</label>
                        <input
                            type="email"
                            required
                            className="glass-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            required
                            className="glass-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '2rem' }}>
                        <button
                            type="button"
                            onClick={() => setShowForgotPassword(true)}
                            style={{ background: 'none', border: 'none', color: 'var(--brand-teal)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                        className="btn-gradient"
                        style={{ width: '100%', padding: '1rem', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.8 : 1, boxShadow: '0 10px 20px rgba(120, 220, 202, 0.3)' }}
                    >
                        {isLoading ? 'Logging In...' : 'Login'}
                    </motion.button>
                </form>

                <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', padding: '0 10px', color: 'var(--text-gray)', fontSize: '0.9rem' }}>OR</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '0.8rem',
                        borderRadius: '50px',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: isLoading ? 'wait' : 'pointer',
                        background: 'white',
                        color: '#333',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                    Sign in with Google
                </motion.button>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>Register Here</Link>
                </div>

                {/* Forgot Password Modal */}
                {showForgotPassword && (
                    <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} defaultEmail={email} />
                )}
            </motion.div>
        </section >
    );
};

export default Login;
