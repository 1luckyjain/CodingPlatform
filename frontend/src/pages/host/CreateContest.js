import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contestsAPI, problemsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CreateContest = () => {
    const [form, setForm] = useState({
        title: '',
        description: '',
        rules: '',
        startTime: '',
        endTime: '',
        maxParticipants: 1000,
        isPublic: true,
        problems: [],
    });
    const [myProblems, setMyProblems] = useState([]);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadProblems = async () => {
            try {
                const { data } = await problemsAPI.getMyProblems();
                setMyProblems(data.problems || []);
            } catch (err) { }
        };
        loadProblems();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const toggleProblem = (id) => {
        setForm({
            ...form,
            problems: form.problems.includes(id)
                ? form.problems.filter((p) => p !== id)
                : [...form.problems, id],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.startTime || !form.endTime) {
            toast.error('Please fill in all required fields.');
            return;
        }
        if (new Date(form.startTime) >= new Date(form.endTime)) {
            toast.error('End time must be after start time.');
            return;
        }
        if (form.problems.length === 0) {
            toast.error('Please select at least one problem for the contest.');
            return;
        }

        setSaving(true);
        try {
            await contestsAPI.create({
                ...form,
                maxParticipants: parseInt(form.maxParticipants),
            });
            toast.success('🎉 Contest created successfully!');
            navigate('/host/contests');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create contest');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="page-header">
                <h1>Create Contest</h1>
                <p>Set up a new programming contest for participants.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Basic Info */}
                <div className="card">
                    <h2 className="form-section-title" style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                        📋 Contest Details
                    </h2>

                    <div className="form-group">
                        <label className="form-label">Contest Title *</label>
                        <input type="text" name="title" className="form-input" placeholder="e.g., Weekly Challenge #1" value={form.title} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description *</label>
                        <textarea name="description" className="form-textarea" rows={4} placeholder="Describe the contest..." value={form.description} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Rules</label>
                        <textarea name="rules" className="form-textarea" rows={3} placeholder="Contest rules (optional)..." value={form.rules} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Start Time *</label>
                            <input type="datetime-local" name="startTime" className="form-input" value={form.startTime} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Time *</label>
                            <input type="datetime-local" name="endTime" className="form-input" value={form.endTime} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Max Participants</label>
                            <input type="number" name="maxParticipants" className="form-input" min="1" max="10000" value={form.maxParticipants} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Visibility</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <input type="checkbox" name="isPublic" checked={form.isPublic} onChange={handleChange} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                                Public contest (visible to everyone)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Problem Selection */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
                        🧩 Select Problems ({form.problems.length} selected)
                    </h2>

                    {myProblems.length === 0 ? (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <div className="empty-icon">🧩</div>
                            <h3>No problems yet</h3>
                            <p>Create problems first before setting up a contest.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {myProblems.map((p) => (
                                <label
                                    key={p._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.875rem',
                                        padding: '0.875rem 1rem',
                                        background: form.problems.includes(p._id) ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
                                        border: `1px solid ${form.problems.includes(p._id) ? 'var(--primary)' : 'var(--border-light)'}`,
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition)',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={form.problems.includes(p._id)}
                                        onChange={() => toggleProblem(p._id)}
                                        style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }}
                                    />
                                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</span>
                                    <span className={`badge badge-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/host/contests')}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                        {saving ? 'Creating...' : '🚀 Create Contest'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateContest;
