import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI } from '../../services/api';
import './HostDashboard.css';

const HostDashboard = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnalytics = async () => {
            try {
                const { data } = await analyticsAPI.getHostAnalytics();
                setAnalytics(data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, []);

    return (
        <div className="host-dashboard fade-in">
            {/* Banner */}
            <div className="host-banner">
                <div className="banner-content">
                    <div className="host-icon">🏆</div>
                    <div>
                        <div className="banner-greeting">Host Dashboard</div>
                        <h1 className="banner-name">{user?.name}</h1>
                        <p className="banner-sub">Manage your problems, contests, and track participant performance.</p>
                    </div>
                </div>
                <div className="host-quick-actions">
                    <Link to="/host/problems/create" className="btn btn-primary">+ New Problem</Link>
                    <Link to="/host/contests/create" className="btn btn-secondary">+ New Contest</Link>
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="loading-container" style={{ minHeight: 120 }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="grid-4">
                    <div className="stat-card">
                        <div className="stat-icon">🧩</div>
                        <div className="stat-value">{analytics?.totalProblems || 0}</div>
                        <div className="stat-label">Problems Created</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value">{analytics?.totalContests || 0}</div>
                        <div className="stat-label">Contests Hosted</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📤</div>
                        <div className="stat-value">{analytics?.totalSubmissionsOnMyProblems || 0}</div>
                        <div className="stat-label">Total Submissions</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{analytics?.totalParticipants || 0}</div>
                        <div className="stat-label">Total Participants</div>
                    </div>
                </div>
            )}

            {/* Problems Summary */}
            {analytics?.problems?.length > 0 && (
                <div className="card">
                    <div className="flex justify-between items-center mb-lg">
                        <h2 className="card-title">Your Problems</h2>
                        <Link to="/host/problems" className="btn btn-ghost btn-sm">View all →</Link>
                    </div>
                    <div className="table-wrapper" style={{ borderRadius: 0, border: 'none', margin: '-0.5rem' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Difficulty</th>
                                    <th>Submissions</th>
                                    <th>Accepted</th>
                                    <th>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.problems.slice(0, 5).map((p, i) => (
                                    <tr key={i}>
                                        <td className="font-semibold text-primary">{p.title}</td>
                                        <td>
                                            <span className={`badge badge-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                                        </td>
                                        <td className="text-secondary">{p.totalSubmissions}</td>
                                        <td className="text-secondary">{p.acceptedSubmissions}</td>
                                        <td className="text-success">
                                            {p.totalSubmissions > 0
                                                ? ((p.acceptedSubmissions / p.totalSubmissions) * 100).toFixed(1) + '%'
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Contests Summary */}
            {analytics?.contests?.length > 0 && (
                <div className="card">
                    <div className="flex justify-between items-center mb-lg">
                        <h2 className="card-title">Your Contests</h2>
                        <Link to="/host/contests" className="btn btn-ghost btn-sm">View all →</Link>
                    </div>
                    <div className="contests-summary">
                        {analytics.contests.map((c, i) => (
                            <div key={i} className="contest-summary-item">
                                <div>
                                    <div className="font-semibold text-primary">{c.title}</div>
                                    <div className="text-muted text-sm">{c.problems} problems • {c.participants} participants</div>
                                </div>
                                <span className={`badge badge-${c.status}`}>{c.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HostDashboard;
