import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register, loginWithGoogle, logout } from '../services/authService';
import { validateEmail, validatePhone, validatePassword, getFriendlyErrorMessage } from '../utils/validators';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side Validation
        if (!formData.name.trim()) {
            setError("Full Name is required.");
            return;
        }

        if (!validateEmail(formData.email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!validatePhone(formData.phone)) {
            setError("Phone number must be exactly 10 digits.");
            return;
        }

        if (!validatePassword(formData.password)) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            if (result.success) {
                await logout();
                navigate('/login');
            } else {
                // Use the returned code if available, otherwise fall back to message or generic
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
                className="glass-panel"
                style={{
                    padding: '3rem',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '600px',
                    position: 'relative'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create Account</h2>
                    <p style={{ color: 'var(--text-gray)' }}>Join the C & S Community</p>
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
                        <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            className="glass-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Email</label>
                            <input
                                type="email"
                                required
                                className="glass-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Phone</label>
                            <input
                                type="tel"
                                required
                                className="glass-input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="077xxxxxxx"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Password</label>
                            <input
                                type="password"
                                required
                                className="glass-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="glass-input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isLoading}
                        className="btn-gradient"
                        style={{ width: '100%', padding: '1rem', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.8 : 1, boxShadow: '0 10px 20px rgba(120, 220, 202, 0.3)' }}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </motion.button>
                </form>


                <div style={{ margin: '1.5rem 0', textAlign: 'center', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
                    <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', padding: '0 10px', color: 'var(--text-gray)', fontSize: '0.9rem' }}>OR</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                        setIsLoading(true);
                        setError('');
                        try {
                            const result = await loginWithGoogle();
                            if (result.success) {
                                navigate('/');
                            } else {
                                setError(result.message);
                            }
                        } catch (err) {
                            console.error(err);
                            setError("Google Sign-In failed.");
                        } finally {
                            setIsLoading(false);
                        }
                    }}
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
                    Sign up with Google
                </motion.button>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>Login Here</Link>
                </div>
            </motion.div>
        </section>
    );
};

export default Register;
