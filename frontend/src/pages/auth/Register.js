import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
    const [searchParams] = useSearchParams();
    const defaultRole = searchParams.get('role') === 'host' ? 'host' : 'user';

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: defaultRole,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.email || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const data = await registerUser(form.name, form.email, form.password, form.role);
            toast.success(`Account created! Welcome, ${data.user.name}! 🎉`);
            const redirect = data.user.role === 'host' ? '/host/dashboard' : '/dashboard';
            navigate(redirect, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-orb auth-orb-1"></div>
                <div className="auth-orb auth-orb-2"></div>
            </div>

            <div className="auth-card fade-in">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span>⚡</span> CodingCollege
                    </Link>
                    <h1>Create account</h1>
                    <p>Join thousands of developers today</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Role Selector */}
                <div className="role-selector">
                    <button
                        type="button"
                        className={`role-btn ${form.role === 'user' ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, role: 'user' })}
                    >
                        <span className="role-icon">👤</span>
                        <span className="role-name">User</span>
                        <span className="role-desc">Practice & compete</span>
                    </button>
                    <button
                        type="button"
                        className={`role-btn ${form.role === 'host' ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, role: 'host' })}
                    >
                        <span className="role-icon">🏆</span>
                        <span className="role-name">Host</span>
                        <span className="role-desc">Create problems & contests</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            className="form-input"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="reg-email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="reg-password"
                            className="form-input"
                            placeholder="At least 6 characters"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirm-password"
                            className="form-input"
                            placeholder="Repeat your password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                                Creating account...
                            </>
                        ) : (
                            `Create ${form.role === 'host' ? 'Host' : 'User'} Account →`
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login">Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
