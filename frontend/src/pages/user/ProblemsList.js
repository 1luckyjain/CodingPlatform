import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { problemsAPI } from '../../services/api';
import './ProblemsList.css';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const ProblemsList = () => {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const page = parseInt(searchParams.get('page') || '1');

    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (difficulty && difficulty !== 'All') params.difficulty = difficulty;

            const { data } = await problemsAPI.getAll(params);
            setProblems(data.problems || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch (error) {
            console.error('Failed to load problems:', error);
        } finally {
            setLoading(false);
        }
    }, [search, difficulty, page]);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    const updateParam = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const getDifficultyBadge = (diff) => {
        const map = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
        return map[diff] || 'badge-primary';
    };

    const getAcceptanceRate = (problem) => {
        if (problem.totalSubmissions === 0) return '—';
        return ((problem.acceptedSubmissions / problem.totalSubmissions) * 100).toFixed(1) + '%';
    };

    return (
        <div className="problems-page fade-in">
            <div className="page-header">
                <h1>Problems</h1>
                <p>Practice with {total} coding problems. Filter by difficulty or search by title.</p>
            </div>

            {/* Filters */}
            <div className="problems-filters card">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search problems..."
                        className="search-input"
                        defaultValue={search}
                        onChange={(e) => {
                            const val = e.target.value;
                            clearTimeout(window._searchTimeout);
                            window._searchTimeout = setTimeout(() => updateParam('search', val), 400);
                        }}
                    />
                </div>
                <div className="difficulty-filters">
                    {DIFFICULTIES.map((diff) => (
                        <button
                            key={diff}
                            className={`filter-btn ${(difficulty || 'All') === diff ? 'active' : ''} ${diff !== 'All' ? diff.toLowerCase() : ''}`}
                            onClick={() => updateParam('difficulty', diff === 'All' ? '' : diff)}
                        >
                            {diff === 'Easy' ? '🟢' : diff === 'Medium' ? '🟡' : diff === 'Hard' ? '🔴' : '📋'} {diff}
                        </button>
                    ))}
                </div>
            </div>

            {/* Problems Table */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading problems...</p>
                </div>
            ) : problems.length === 0 ? (
                <div className="empty-state card">
                    <div className="empty-icon">🔍</div>
                    <h3>No problems found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <div className="table-wrapper card" style={{ padding: 0 }}>
                    <table className="table problems-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Title</th>
                                <th>Difficulty</th>
                                <th>Tags</th>
                                <th>Acceptance</th>
                                <th>Submissions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((problem, index) => (
                                <tr key={problem._id}>
                                    <td className="text-muted text-sm">
                                        {(page - 1) * 20 + index + 1}
                                    </td>
                                    <td>
                                        <Link
                                            to={`/problems/${problem._id}`}
                                            className="problem-title-link"
                                        >
                                            {problem.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <span className={`badge ${getDifficultyBadge(problem.difficulty)}`}>
                                            {problem.difficulty}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="problem-tags">
                                            {problem.tags?.slice(0, 3).map((tag) => (
                                                <span key={tag} className="badge badge-primary">{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="text-sm">
                                        <span className={
                                            parseFloat(getAcceptanceRate(problem)) > 50 ? 'text-success' :
                                                parseFloat(getAcceptanceRate(problem)) > 30 ? 'text-warning' : 'text-error'
                                        }>
                                            {getAcceptanceRate(problem)}
                                        </span>
                                    </td>
                                    <td className="text-secondary text-sm">{problem.totalSubmissions || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === 1}
                        onClick={() => updateParam('page', page - 1)}
                    >
                        ← Previous
                    </button>
                    <span className="page-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        className="btn btn-secondary btn-sm"
                        disabled={page === totalPages}
                        onClick={() => updateParam('page', page + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProblemsList;
