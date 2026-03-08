import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { problemsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ManageProblems = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const fetchProblems = useCallback(async () => {
        try {
            const { data } = await problemsAPI.getMyProblems();
            setProblems(data.problems || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProblems(); }, [fetchProblems]);

    const handleDelete = async (id, title) => {
        if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
        setDeletingId(id);
        try {
            await problemsAPI.delete(id);
            toast.success('Problem deleted.');
            setProblems(problems.filter((p) => p._id !== id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
        </div>
    );

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-xl">
                <div className="page-header" style={{ margin: 0 }}>
                    <h1>My Problems</h1>
                    <p style={{ marginTop: '0.25rem' }}>{problems.length} problems created</p>
                </div>
                <Link to="/host/problems/create" className="btn btn-primary">+ Create Problem</Link>
            </div>

            {problems.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">🧩</div>
                    <h3>No problems yet</h3>
                    <p>Create your first coding problem for users to solve.</p>
                    <Link to="/host/problems/create" className="btn btn-primary mt-md">Create Problem</Link>
                </div>
            ) : (
                <div className="table-wrapper card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Difficulty</th>
                                <th>Submissions</th>
                                <th>Accepted</th>
                                <th>Rate</th>
                                <th>Published</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((p, i) => (
                                <tr key={p._id}>
                                    <td className="text-muted">{i + 1}</td>
                                    <td>
                                        <Link to={`/problems/${p._id}`} className="text-primary font-semibold" style={{ textDecoration: 'none' }}>
                                            {p.title}
                                        </Link>
                                    </td>
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
                                    <td>
                                        <span className={`badge ${p.isPublished ? 'badge-ongoing' : 'badge-past'}`}>
                                            {p.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <Link to={`/problems/${p._id}`} className="btn btn-secondary btn-sm">View</Link>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(p._id, p.title)}
                                                disabled={deletingId === p._id}
                                            >
                                                {deletingId === p._id ? '...' : 'Delete'}
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

export default ManageProblems;
