import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import './Leaderboard.css';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await analyticsAPI.getGlobalLeaderboard();
                setLeaderboard(data.leaderboard || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <div className="leaderboard-page fade-in">
            <div className="page-header">
                <h1>Global Leaderboard</h1>
                <p>Top competitive programmers ranked by rating and problems solved.</p>
            </div>

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
                <div className="podium">
                    <div className="podium-item podium-2">
                        <div className="podium-avatar">{leaderboard[1]?.name?.charAt(0)}</div>
                        <div className="podium-name">{leaderboard[1]?.name}</div>
                        <div className="podium-rating">{leaderboard[1]?.rating}</div>
                        <div className="podium-block">🥈</div>
                    </div>
                    <div className="podium-item podium-1">
                        <div className="podium-crown">👑</div>
                        <div className="podium-avatar gold">{leaderboard[0]?.name?.charAt(0)}</div>
                        <div className="podium-name">{leaderboard[0]?.name}</div>
                        <div className="podium-rating">{leaderboard[0]?.rating}</div>
                        <div className="podium-block">🥇</div>
                    </div>
                    <div className="podium-item podium-3">
                        <div className="podium-avatar">{leaderboard[2]?.name?.charAt(0)}</div>
                        <div className="podium-name">{leaderboard[2]?.name}</div>
                        <div className="podium-rating">{leaderboard[2]?.rating}</div>
                        <div className="podium-block">🥉</div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading leaderboard...</p>
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">🏆</div>
                    <h3>No data yet</h3>
                    <p>Be the first to solve problems and get ranked!</p>
                </div>
            ) : (
                <div className="table-wrapper card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Coder</th>
                                <th>Rating</th>
                                <th>Solved</th>
                                <th>Submissions</th>
                                <th>Accepted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((entry) => (
                                <tr key={entry.rank} className={entry.rank <= 3 ? 'top-row' : ''}>
                                    <td>
                                        <span className="rank-display">
                                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-sm">
                                            <div className={`lb-avatar ${entry.rank <= 3 ? 'gold' : ''}`}>
                                                {entry.name?.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-primary">{entry.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="rating-pill">{entry.rating}</span>
                                    </td>
                                    <td className="text-secondary">{entry.solved}</td>
                                    <td className="text-secondary">{entry.submissions}</td>
                                    <td className="text-success">{entry.accepted}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
