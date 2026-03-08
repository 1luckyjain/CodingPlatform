import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, isHost, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const userNavLinks = [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/problems', label: 'Problems' },
        { to: '/contests', label: 'Contests' },
        { to: '/submissions', label: 'Submissions' },
        { to: '/leaderboard', label: 'Leaderboard' },
    ];

    const hostNavLinks = [
        { to: '/host/dashboard', label: 'Dashboard' },
        { to: '/host/problems', label: 'Problems' },
        { to: '/host/contests', label: 'Contests' },
        { to: '/host/analytics', label: 'Analytics' },
    ];

    const navLinks = isHost ? hostNavLinks : userNavLinks;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo */}
                <Link to="/" className="navbar-logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">
                        Coding<span className="logo-accent">College</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                {isAuthenticated && (
                    <div className="navbar-links">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`navbar-link ${isActive(link.to) ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                {/* Right Side */}
                <div className="navbar-actions">
                    {isAuthenticated ? (
                        <div className="navbar-user">
                            <div className="user-info" onClick={() => setMenuOpen(!menuOpen)}>
                                <div className="user-avatar">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                    <span className="user-name">{user?.name}</span>
                                    <span className={`user-role badge ${isHost ? 'badge-primary' : 'badge-upcoming'}`}>
                                        {isHost ? '🏆 Host' : '👤 User'}
                                    </span>
                                </div>
                                <span className="chevron">{menuOpen ? '▲' : '▼'}</span>
                            </div>

                            {menuOpen && (
                                <div className="user-dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                                        👤 Profile
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleLogout} className="dropdown-item danger">
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                        </div>
                    )}

                    {/* Mobile hamburger */}
                    <button
                        className="hamburger"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span><span></span><span></span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && isAuthenticated && (
                <div className="mobile-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="mobile-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <Link to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <button onClick={handleLogout} className="mobile-link danger">Logout</button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
