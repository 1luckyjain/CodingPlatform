import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || null;

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const data = await login(form.email, form.password);
            toast.success(`Welcome back, ${data.user.name}! 🎉`);
            const redirect = from || (data.user.role === 'host' ? '/host/dashboard' : '/dashboard');
            navigate(redirect, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
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
                    <h1>Welcome back</h1>
                    <p>Sign in to your account to continue</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="form-input"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            autoComplete="email"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            autoComplete="current-password"
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
                                Signing in...
                            </>
                        ) : (
                            'Sign In →'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Create one for free</Link>
                    </p>
                </div>

                {/* Demo accounts */}
                <div className="demo-accounts">
                    <p className="demo-label">Quick demo access:</p>
                    <div className="demo-buttons">
                        <button
                            type="button"
                            className="demo-btn"
                            onClick={() => setForm({ email: 'user@demo.com', password: 'demo123' })}
                        >
                            👤 User Demo
                        </button>
                        <button
                            type="button"
                            className="demo-btn"
                            onClick={() => setForm({ email: 'host@demo.com', password: 'demo123' })}
                        >
                            🏆 Host Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
