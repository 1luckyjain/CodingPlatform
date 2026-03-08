import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { submissionsAPI } from '../../services/api';

const VERDICT_MAP = {
    Accepted: 'verdict-accepted',
    'Wrong Answer': 'verdict-wrong',
    'Time Limit Exceeded': 'verdict-tle',
    'Memory Limit Exceeded': 'verdict-tle',
    'Compilation Error': 'verdict-error',
    'Runtime Error': 'verdict-error',
    Pending: 'verdict-pending',
    Running: 'verdict-pending',
};

const Submissions = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchSubmissions = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await submissionsAPI.getMy({ page, limit: 20 });
            setSubmissions(data.submissions || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchSubmissions();
    }, [fetchSubmissions]);

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>My Submissions</h1>
                <p>{total} total submissions across all problems</p>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading submissions...</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">📭</div>
                    <h3>No submissions yet</h3>
                    <p>Submit your first code solution to see it here.</p>
                    <Link to="/problems" className="btn btn-primary mt-md">Browse Problems</Link>
                </div>
            ) : (
                <>
                    <div className="table-wrapper card" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Problem</th>
                                    <th>Status</th>
                                    <th>Language</th>
                                    <th>Time</th>
                                    <th>Test Cases</th>
                                    <th>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub, i) => (
                                    <tr key={sub._id}>
                                        <td className="text-muted text-sm">{(page - 1) * 20 + i + 1}</td>
                                        <td>
                                            <Link to={`/problems/${sub.problemId?._id}`} className="text-primary font-semibold" style={{ textDecoration: 'none' }}>
                                                {sub.problemId?.title || 'Problem'}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={`verdict ${VERDICT_MAP[sub.status] || 'verdict-pending'}`}>
                                                {sub.status === 'Accepted' ? '✅' : sub.status === 'Wrong Answer' ? '❌' : '⚠️'}{' '}
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-primary code-font" style={{ fontSize: '0.7rem' }}>
                                                {sub.language}
                                            </span>
                                        </td>
                                        <td className="text-secondary text-sm code-font">{sub.executionTime}ms</td>
                                        <td className="text-secondary text-sm">
                                            {sub.testCasesPassed}/{sub.testCasesTotal}
                                        </td>
                                        <td className="text-muted text-sm">{formatDate(sub.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination mt-lg">
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                ← Previous
                            </button>
                            <span className="page-info">Page {page} of {totalPages}</span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Submissions;
