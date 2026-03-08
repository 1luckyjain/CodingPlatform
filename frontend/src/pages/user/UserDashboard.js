import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submissionsAPI } from '../../services/api';
import './UserDashboard.css';

const UserDashboard = () => {
    const { user } = useAuth();
    const [recentSubmissions, setRecentSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data } = await submissionsAPI.getMy({ limit: 5, page: 1 });
                setRecentSubmissions(data.submissions || []);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const getVerdictClass = (status) => {
        const map = {
            Accepted: 'verdict-accepted',
            'Wrong Answer': 'verdict-wrong',
            'Time Limit Exceeded': 'verdict-tle',
            'Compilation Error': 'verdict-error',
            'Runtime Error': 'verdict-error',
            Pending: 'verdict-pending',
            Running: 'verdict-pending',
        };
        return map[status] || 'verdict-pending';
    };

    const acceptanceRate = user?.totalSubmissions > 0
        ? ((user.totalAccepted / user.totalSubmissions) * 100).toFixed(1)
        : 0;

    return (
        <div className="user-dashboard fade-in">
            {/* Welcome Banner */}
            <div className="dashboard-banner">
                <div className="banner-content">
                    <div className="banner-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="banner-greeting">Good day,</div>
                        <h1 className="banner-name">{user?.name}</h1>
                        <p className="banner-sub">Keep pushing your limits. Every problem solved is a milestone! 🚀</p>
                    </div>
                </div>
                <div className="banner-rating">
                    <span className="rating-label">Rating</span>
                    <span className="rating-value">{user?.rating || 1500}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid-4 stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{user?.solvedProblems?.length || 0}</div>
                    <div className="stat-label">Problems Solved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📤</div>
                    <div className="stat-value">{user?.totalSubmissions || 0}</div>
                    <div className="stat-label">Total Submissions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{acceptanceRate}%</div>
                    <div className="stat-label">Acceptance Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{user?.contestsParticipated?.length || 0}</div>
                    <div className="stat-label">Contests Joined</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Quick Actions */}
                <div className="card">
                    <h2 className="card-title">Quick Actions</h2>
                    <div className="quick-actions">
                        <Link to="/problems" className="quick-action-item">
                            <div className="qa-icon">🧩</div>
                            <div>
                                <div className="qa-title">Practice Problems</div>
                                <div className="qa-desc">Browse and solve coding challenges</div>
                            </div>
                            <span className="qa-arrow">→</span>
                        </Link>
                        <Link to="/contests" className="quick-action-item">
                            <div className="qa-icon">🏆</div>
                            <div>
                                <div className="qa-title">Join a Contest</div>
                                <div className="qa-desc">Compete in live programming contests</div>
                            </div>
                            <span className="qa-arrow">→</span>
                        </Link>
                        <Link to="/leaderboard" className="quick-action-item">
                            <div className="qa-icon">📊</div>
                            <div>
                                <div className="qa-title">Global Leaderboard</div>
                                <div className="qa-desc">See your global ranking</div>
                            </div>
                            <span className="qa-arrow">→</span>
                        </Link>
                        <Link to="/submissions" className="quick-action-item">
                            <div className="qa-icon">📋</div>
                            <div>
                                <div className="qa-title">My Submissions</div>
                                <div className="qa-desc">Review your submission history</div>
                            </div>
                            <span className="qa-arrow">→</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Submissions */}
                <div className="card">
                    <div className="flex justify-between items-center mb-md">
                        <h2 className="card-title">Recent Submissions</h2>
                        <Link to="/submissions" className="btn btn-ghost btn-sm">View all →</Link>
                    </div>

                    {loading ? (
                        <div className="loading-container" style={{ minHeight: 150 }}>
                            <div className="spinner"></div>
                        </div>
                    ) : recentSubmissions.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">📭</div>
                            <h3>No submissions yet</h3>
                            <p>Start solving problems to see your submissions here.</p>
                            <Link to="/problems" className="btn btn-primary btn-sm mt-md">Browse Problems</Link>
                        </div>
                    ) : (
                        <div className="submissions-list">
                            {recentSubmissions.map((sub) => (
                                <div key={sub._id} className="submission-item">
                                    <div className="sub-info">
                                        <Link to={`/problems/${sub.problemId?._id}`} className="sub-title">
                                            {sub.problemId?.title || 'Problem'}
                                        </Link>
                                        <span className="sub-lang code-font">{sub.language}</span>
                                    </div>
                                    <div className="sub-meta">
                                        <span className={`verdict ${getVerdictClass(sub.status)}`}>
                                            {sub.status}
                                        </span>
                                        <span className="sub-time text-muted text-xs">
                                            {sub.executionTime}ms
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress by Difficulty */}
            <div className="card mt-lg">
                <h2 className="card-title">Solve More Problems</h2>
                <div className="difficulty-grid">
                    {['Easy', 'Medium', 'Hard'].map((diff) => (
                        <Link key={diff} to={`/problems?difficulty=${diff}`} className={`diff-card diff-${diff.toLowerCase()}`}>
                            <div className="diff-icon">
                                {diff === 'Easy' ? '🟢' : diff === 'Medium' ? '🟡' : '🔴'}
                            </div>
                            <div className="diff-name">{diff}</div>
                            <div className="diff-action">Browse →</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
