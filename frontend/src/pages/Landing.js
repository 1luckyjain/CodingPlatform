import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const Landing = () => {
    const { isAuthenticated, user } = useAuth();

    const features = [
        {
            icon: '🧩',
            title: 'Curated Problems',
            desc: 'Hundreds of carefully crafted problems across Easy, Medium, and Hard difficulty levels.',
        },
        {
            icon: '⚡',
            title: 'Real-time Execution',
            desc: 'Lightning-fast code execution with support for JavaScript, Python, C++, Java, and C.',
        },
        {
            icon: '🏆',
            title: 'Live Contests',
            desc: 'Compete in real-time contests hosted by top engineers and climb the global leaderboard.',
        },
        {
            icon: '📊',
            title: 'Detailed Analytics',
            desc: 'Track your progress, acceptance rates, and performance trends with rich dashboards.',
        },
        {
            icon: '🔒',
            title: 'Secure Sandboxing',
            desc: 'Every submission runs in an isolated environment with strict time and memory limits.',
        },
        {
            icon: '🌍',
            title: 'Global Leaderboard',
            desc: 'See where you stand among thousands of competitive programmers worldwide.',
        },
    ];

    const stats = [
        { value: '500+', label: 'Problems' },
        { value: '10K+', label: 'Developers' },
        { value: '1M+', label: 'Submissions' },
        { value: '200+', label: 'Contests' },
    ];

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-orb hero-orb-1"></div>
                    <div className="hero-orb hero-orb-2"></div>
                    <div className="hero-grid"></div>
                </div>

                <div className="hero-content">
                    <div className="hero-badge">
                        <span>🚀</span> The Ultimate Coding Platform
                    </div>
                    <h1 className="hero-title">
                        Code. Compete.
                        <br />
                        <span className="text-gradient">Conquer.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Master data structures, algorithms, and competitive programming with thousands
                        of curated problems, real-time contests, and AI-powered insights.
                    </p>

                    <div className="hero-cta">
                        {isAuthenticated ? (
                            <Link
                                to={user?.role === 'host' ? '/host/dashboard' : '/dashboard'}
                                className="btn btn-primary btn-lg"
                            >
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="btn btn-primary btn-lg">
                                    Start Coding Free
                                </Link>
                                <Link to="/problems" className="btn btn-secondary btn-lg">
                                    Browse Problems
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="hero-stats">
                        {stats.map((stat) => (
                            <div key={stat.label} className="hero-stat">
                                <span className="hero-stat-value">{stat.value}</span>
                                <span className="hero-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Code preview */}
                <div className="hero-code-preview">
                    <div className="code-window">
                        <div className="code-window-header">
                            <div className="code-dots">
                                <span className="dot red"></span>
                                <span className="dot yellow"></span>
                                <span className="dot green"></span>
                            </div>
                            <span className="code-filename">two-sum.js</span>
                        </div>
                        <pre className="code-content code-font">
                            {`function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}

// ✅ Accepted - Runtime: 76ms
// 🏆 Beats 94.2% of submissions`}
                        </pre>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="features-container">
                    <div className="section-header">
                        <h2>Everything You Need to <span className="text-gradient">Excel</span></h2>
                        <p>A complete ecosystem built for competitive programmers and interview preparation.</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature) => (
                            <div key={feature.title} className="feature-card">
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <div className="cta-content">
                        <h2>Ready to Level Up Your Skills?</h2>
                        <p>Join thousands of developers who are sharpening their coding skills every day.</p>
                        <div className="cta-buttons">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Create Free Account
                            </Link>
                            <Link to="/register?role=host" className="btn btn-secondary btn-lg">
                                Become a Host
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-brand">
                        <span className="logo-icon">⚡</span>
                        <span className="logo-text">Coding<span className="logo-accent">College</span></span>
                    </div>
                    <p className="footer-text">
                        Built with ❤️ for the coding community. © 2026 CodingCollege. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
