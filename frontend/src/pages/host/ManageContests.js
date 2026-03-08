import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contestsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageContests = () => {
    const [contests, setContests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await contestsAPI.getMyContests();
                setContests(data.contests || []);
            } catch (err) { }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete "${title}"?`)) return;
        try {
            await contestsAPI.delete(id);
            toast.success('Contest deleted.');
            setContests(contests.filter((c) => c._id !== id));
        } catch (err) {
            toast.error('Failed to delete contest.');
        }
    };

    const formatDate = (d) => new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-xl">
                <div className="page-header" style={{ margin: 0 }}>
                    <h1>My Contests</h1>
                    <p style={{ marginTop: '0.25rem' }}>{contests.length} contests created</p>
                </div>
                <Link to="/host/contests/create" className="btn btn-primary">+ Create Contest</Link>
            </div>

            {contests.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">🏆</div>
                    <h3>No contests yet</h3>
                    <p>Create your first competitive programming contest.</p>
                    <Link to="/host/contests/create" className="btn btn-primary mt-md">Create Contest</Link>
                </div>
            ) : (
                <div className="table-wrapper card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Problems</th>
                                <th>Participants</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contests.map((c) => (
                                <tr key={c._id}>
                                    <td>
                                        <Link to={`/contests/${c._id}`} className="font-semibold text-primary" style={{ textDecoration: 'none' }}>
                                            {c.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${c.status}`}>{c.status}</span>
                                    </td>
                                    <td className="text-secondary">{c.problems?.length || 0}</td>
                                    <td className="text-secondary">{c.participants?.length || 0}</td>
                                    <td className="text-secondary text-sm">{formatDate(c.startTime)}</td>
                                    <td className="text-secondary text-sm">{formatDate(c.endTime)}</td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <Link to={`/contests/${c._id}`} className="btn btn-secondary btn-sm">View</Link>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id, c.title)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageContests;
