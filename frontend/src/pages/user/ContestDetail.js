import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { contestsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './ContestDetail.css';

const ContestDetail = () => {
    const { id } = useParams();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [activeTab, setActiveTab] = useState('problems');
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const fetchContest = async () => {
            try {
                const { data } = await contestsAPI.getById(id);
                setContest(data.contest);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContest();
    }, [id]);

    // Countdown timer
    useEffect(() => {
        if (!contest) return;

        const timer = setInterval(() => {
            const now = new Date();
            const start = new Date(contest.startTime);
            const end = new Date(contest.endTime);

            let target;
            let prefix;

            if (now < start) {
                target = start;
                prefix = 'Starts in: ';
            } else if (now < end) {
                target = end;
                prefix = 'Ends in: ';
            } else {
                setTimeLeft('Contest has ended');
                clearInterval(timer);
                return;
            }

            const diff = target - now;
            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${prefix}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [contest]);

    const handleJoin = async () => {
        if (!isAuthenticated) {
            toast.error('Please login to join');
            return;
        }
        setJoining(true);
        try {
            await contestsAPI.join(id);
            toast.success('🎉 Joined the contest!');
            const { data } = await contestsAPI.getById(id);
            setContest(data.contest);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join');
        } finally {
            setJoining(false);
        }
    };

    const isParticipant = contest?.participants?.some(
        (p) => p._id === user?.id || p._id === user?._id || p === user?.id
    );

    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading contest...</p>
        </div>
    );

    if (!contest) return (
        <div className="empty-state">
            <div className="empty-icon">❌</div>
            <h3>Contest not found</h3>
            <Link to="/contests" className="btn btn-primary mt-md">Back to Contests</Link>
        </div>
    );

    return (
        <div className="contest-detail fade-in">
            {/* Header */}
            <div className="contest-detail-header card">
                <div className="cdh-top">
                    <div>
                        <div className="flex gap-sm items-center mb-sm">
                            <span className={`badge badge-${contest.status}`}>
                                {contest.status === 'ongoing' ? '🔴 LIVE' :
                                    contest.status === 'upcoming' ? '🟡 Upcoming' : '⚫ Ended'}
                            </span>
                            <span className="text-muted text-sm">by {contest.createdBy?.name}</span>
                        </div>
                        <h1 className="contest-detail-title">{contest.title}</h1>
                        <p className="contest-detail-desc">{contest.description}</p>
                    </div>

                    <div className="contest-timer-box">
                        <div className="timer-label">
                            {contest.status === 'upcoming' ? '⏳ Countdown' :
                                contest.status === 'ongoing' ? '⏱️ Time Remaining' : '🏁 Status'}
                        </div>
                        <div className="timer-value code-font">{timeLeft}</div>
                        <div className="timer-dates">
                            <div>🟢 {formatDate(contest.startTime)}</div>
                            <div>🔴 {formatDate(contest.endTime)}</div>
                        </div>
                    </div>
                </div>

                <div className="cdh-stats">
                    <div className="cdh-stat">
                        <span className="cdh-stat-value">{contest.problems?.length || 0}</span>
                        <span className="cdh-stat-label">Problems</span>
                    </div>
                    <div className="cdh-stat">
                        <span className="cdh-stat-value">{contest.participants?.length || 0}</span>
                        <span className="cdh-stat-label">Participants</span>
                    </div>
                    <div className="cdh-stat">
                        <span className="cdh-stat-value">{contest.maxParticipants}</span>
                        <span className="cdh-stat-label">Max Participants</span>
                    </div>
                </div>

                {contest.status !== 'past' && !isParticipant && (
                    <button
                        className="btn btn-primary"
                        onClick={handleJoin}
                        disabled={joining}
                    >
                        {joining ? 'Joining...' : '🚀 Join Contest'}
                    </button>
                )}
                {isParticipant && (
                    <div className="joined-badge">✅ You are participating in this contest</div>
                )}
            </div>

            {/* Tabs */}
            <div className="contest-tabs">
                {['problems', 'leaderboard', 'rules'].map((tab) => (
                    <button
                        key={tab}
                        className={`status-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'problems' ? '🧩' : tab === 'leaderboard' ? '🏆' : '📋'}{' '}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Problems Tab */}
            {activeTab === 'problems' && (
                <div className="card">
                    <h2 className="card-title">Contest Problems</h2>
                    {contest.problems?.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">🧩</div>
                            <p>No problems added yet.</p>
                        </div>
                    ) : (
                        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Title</th>
                                        <th>Difficulty</th>
                                        <th>Submissions</th>
                                        {(isParticipant || contest.status === 'past') && <th>Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {contest.problems?.map((problem, i) => (
                                        <tr key={problem._id}>
                                            <td>{String.fromCharCode(65 + i)}</td>
                                            <td>
                                                {(isParticipant || contest.status === 'past') ? (
                                                    <Link to={`/problems/${problem._id}`} className="text-primary font-semibold" style={{ textDecoration: 'none' }}>
                                                        {problem.title}
                                                    </Link>
                                                ) : (
                                                    <span>{problem.title}</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${problem.difficulty?.toLowerCase()}`}>
                                                    {problem.difficulty}
                                                </span>
                                            </td>
                                            <td className="text-secondary">{problem.totalSubmissions || 0}</td>
                                            {(isParticipant || contest.status === 'past') && (
                                                <td>
                                                    <Link to={`/problems/${problem._id}`} className="btn btn-primary btn-sm">
                                                        Solve →
                                                    </Link>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!isParticipant && contest.status !== 'past' && (
                        <div className="alert alert-info mt-md">
                            🔒 Join the contest to access the problems.
                        </div>
                    )}
                </div>
            )}

            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
                <div className="card">
                    <h2 className="card-title">Leaderboard</h2>
                    {contest.leaderboard?.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-icon">🏆</div>
                            <h3>No entries yet</h3>
                            <p>Be the first to solve a problem and claim a spot!</p>
                        </div>
                    ) : (
                        <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Participant</th>
                                        <th>Problems</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contest.leaderboard?.map((entry, i) => (
                                        <tr key={entry._id}>
                                            <td>
                                                <span className={`rank-badge rank-${i + 1}`}>
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-sm">
                                                    <div className="mini-avatar">{entry.userId?.name?.charAt(0)}</div>
                                                    <span className="font-semibold">{entry.userId?.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-secondary">{entry.problemsSolved}</td>
                                            <td>
                                                <span className="text-gradient font-bold">{entry.score}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
                <div className="card">
                    <h2 className="card-title">Contest Rules</h2>
                    <div className="rules-content">
                        {contest.rules ? (
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{contest.rules}</p>
                        ) : (
                            <div className="default-rules">
                                <ul>
                                    <li>Each accepted submission earns 100 points.</li>
                                    <li>Wrong Answer, TLE, and MLE deduct from efficiency score.</li>
                                    <li>Participants are ranked by total score, then by submission time.</li>
                                    <li>No plagiarism - all code must be your own work.</li>
                                    <li>You may use any of the supported programming languages.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestDetail;
