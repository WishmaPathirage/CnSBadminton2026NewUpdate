import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register } from '../services/authService';
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
                navigate('/');
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
                className="card-glass"
                style={{
                    padding: '3rem',
                    borderRadius: '20px',
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
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Full Name</label>
                        <input
                            type="text"
                            required
                            style={inputStyle}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Email</label>
                            <input
                                type="email"
                                required
                                style={inputStyle}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Phone</label>
                            <input
                                type="tel"
                                required
                                style={inputStyle}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="077xxxxxxx"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Password</label>
                            <input
                                type="password"
                                required
                                style={inputStyle}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-light)' }}>Confirm Password</label>
                            <input
                                type="password"
                                required
                                style={inputStyle}
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
                        style={{ width: '100%', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.8 : 1 }}
                    >
                        {isLoading ? 'Creating Account...' : 'Register'}
                    </motion.button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-gray)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--brand-teal)', fontWeight: 'bold' }}>Login Here</Link>
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

export default Register;
