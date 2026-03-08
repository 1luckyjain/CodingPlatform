import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { contestsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Contests.css';

const Contests = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    const status = searchParams.get('status') || '';

    const fetchContests = useCallback(async () => {
        setLoading(true);
        try {
            const params = status ? { status } : {};
            const { data } = await contestsAPI.getAll(params);
            setContests(data.contests || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]);

    const handleJoin = async (contestId, e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please login to join a contest');
            return;
        }
        setJoiningId(contestId);
        try {
            await contestsAPI.join(contestId);
            toast.success('🎉 Successfully joined the contest!');
            fetchContests();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join contest');
        } finally {
            setJoiningId(null);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getDuration = (start, end) => {
        const ms = new Date(end) - new Date(start);
        const hours = Math.floor(ms / 3600000);
        const mins = Math.floor((ms % 3600000) / 60000);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const STATUS_TABS = ['all', 'upcoming', 'ongoing', 'past'];

    return (
        <div className="contests-page fade-in">
            <div className="page-header">
                <h1>Contests</h1>
                <p>Compete in programming contests and climb the global leaderboard.</p>
            </div>

            {/* Status Filter */}
            <div className="status-tabs">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`status-tab ${(status || 'all') === tab ? 'active' : ''}`}
                        onClick={() => setSearchParams(tab === 'all' ? {} : { status: tab })}
                    >
                        {tab === 'ongoing' ? '🔴 ' : tab === 'upcoming' ? '🟡 ' : tab === 'past' ? '⚫ ' : '📋 '}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading contests...</p>
                </div>
            ) : contests.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">🏆</div>
                    <h3>No contests found</h3>
                    <p>Check back later for upcoming contests.</p>
                </div>
            ) : (
                <div className="contests-grid">
                    {contests.map((contest) => (
                        <div key={contest._id} className="contest-card card">
                            <div className="contest-header">
                                <div className="contest-status-badge">
                                    <span className={`badge badge-${contest.status}`}>
                                        {contest.status === 'ongoing' ? '🔴 Live' :
                                            contest.status === 'upcoming' ? '🟡 Upcoming' :
                                                '⚫ Ended'}
                                    </span>
                                </div>
                                <span className="contest-duration">
                                    ⏱️ {getDuration(contest.startTime, contest.endTime)}
                                </span>
                            </div>

                            <h2 className="contest-title">
                                <Link to={`/contests/${contest._id}`}>{contest.title}</Link>
                            </h2>

                            <p className="contest-desc">{contest.description?.substring(0, 120)}...</p>

                            <div className="contest-info">
                                <div className="info-item">📅 <span>{formatDate(contest.startTime)}</span></div>
                                <div className="info-item">🏁 <span>{formatDate(contest.endTime)}</span></div>
                                <div className="info-item">🧩 <span>{contest.problems?.length || 0} Problems</span></div>
                                <div className="info-item">👥 <span>{contest.participants?.length || 0} Participants</span></div>
                            </div>

                            <div className="contest-by">
                                By <span className="text-primary">{contest.createdBy?.name}</span>
                            </div>

                            <div className="contest-actions">
                                <Link to={`/contests/${contest._id}`} className="btn btn-secondary btn-sm">
                                    View Details
                                </Link>
                                {contest.status !== 'past' && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={(e) => handleJoin(contest._id, e)}
                                        disabled={joiningId === contest._id}
                                    >
                                        {joiningId === contest._id ? 'Joining...' : 'Join Contest'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Contests;
