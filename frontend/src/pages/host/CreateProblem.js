import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './CreateProblem.css';

const INITIAL_FORM = {
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: '',
    constraints: '',
    inputFormat: '',
    outputFormat: '',
    timeLimit: 2000,
    memoryLimit: 256,
    sampleTestCases: [{ input: '', output: '', explanation: '' }],
    hiddenTestCases: [{ input: '', output: '' }],
    isPublished: true,
};

const CreateProblem = () => {
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    // Sample test case handlers
    const addSampleTC = () => {
        setForm({ ...form, sampleTestCases: [...form.sampleTestCases, { input: '', output: '', explanation: '' }] });
    };
    const removeSampleTC = (i) => {
        setForm({ ...form, sampleTestCases: form.sampleTestCases.filter((_, idx) => idx !== i) });
    };
    const updateSampleTC = (i, field, val) => {
        const updated = [...form.sampleTestCases];
        updated[i] = { ...updated[i], [field]: val };
        setForm({ ...form, sampleTestCases: updated });
    };

    // Hidden test case handlers
    const addHiddenTC = () => {
        setForm({ ...form, hiddenTestCases: [...form.hiddenTestCases, { input: '', output: '' }] });
    };
    const removeHiddenTC = (i) => {
        setForm({ ...form, hiddenTestCases: form.hiddenTestCases.filter((_, idx) => idx !== i) });
    };
    const updateHiddenTC = (i, field, val) => {
        const updated = [...form.hiddenTestCases];
        updated[i] = { ...updated[i], [field]: val };
        setForm({ ...form, hiddenTestCases: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) {
            toast.error('Title and description are required.');
            return;
        }
        if (form.sampleTestCases.some((tc) => !tc.input || !tc.output)) {
            toast.error('All sample test cases must have input and output.');
            return;
        }
        if (form.hiddenTestCases.some((tc) => !tc.input || !tc.output)) {
            toast.error('All hidden test cases must have input and output.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
                timeLimit: parseInt(form.timeLimit),
                memoryLimit: parseInt(form.memoryLimit),
            };
            await problemsAPI.create(payload);
            toast.success('🎉 Problem created successfully!');
            navigate('/host/problems');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create problem');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-problem-page fade-in">
            <div className="page-header">
                <h1>Create Problem</h1>
                <p>Add a new coding challenge for users to solve.</p>
            </div>

            <form onSubmit={handleSubmit} className="create-problem-form">
                {/* Section 1: Basic Info */}
                <div className="form-section card">
                    <h2 className="form-section-title">📝 Basic Information</h2>

                    <div className="form-group">
                        <label className="form-label">Problem Title *</label>
                        <input type="text" name="title" className="form-input" placeholder="e.g., Two Sum" value={form.title} onChange={handleChange} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Difficulty *</label>
                            <select name="difficulty" className="form-select" value={form.difficulty} onChange={handleChange}>
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tags (comma separated)</label>
                            <input type="text" name="tags" className="form-input" placeholder="arrays, hashing, two-pointers" value={form.tags} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Time Limit (ms)</label>
                            <input type="number" name="timeLimit" className="form-input" min="500" max="10000" value={form.timeLimit} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Memory Limit (MB)</label>
                            <input type="number" name="memoryLimit" className="form-input" min="64" max="512" value={form.memoryLimit} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Problem Description *</label>
                        <textarea name="description" className="form-textarea" rows={8} placeholder="Describe the problem in detail. Include what the user needs to solve..." value={form.description} onChange={handleChange} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Input Format</label>
                            <textarea name="inputFormat" className="form-textarea" rows={3} placeholder="Describe the input format..." value={form.inputFormat} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Output Format</label>
                            <textarea name="outputFormat" className="form-textarea" rows={3} placeholder="Describe the output format..." value={form.outputFormat} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Constraints</label>
                        <textarea name="constraints" className="form-textarea" rows={3} placeholder="1 <= nums.length <= 10^4&#10;-10^9 <= nums[i] <= 10^9" value={form.constraints} onChange={handleChange} />
                    </div>
                </div>

                {/* Section 2: Sample Test Cases */}
                <div className="form-section card">
                    <div className="flex justify-between items-center mb-lg">
                        <h2 className="form-section-title">👁️ Sample Test Cases (Visible to users)</h2>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={addSampleTC}>
                            + Add Case
                        </button>
                    </div>

                    {form.sampleTestCases.map((tc, i) => (
                        <div key={i} className="test-case-block">
                            <div className="tc-header">
                                <span className="tc-label">Example {i + 1}</span>
                                {form.sampleTestCases.length > 1 && (
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSampleTC(i)}>✕</button>
                                )}
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Input</label>
                                    <textarea className="form-textarea code-font" rows={3} value={tc.input} onChange={(e) => updateSampleTC(i, 'input', e.target.value)} placeholder="Input for this test case" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expected Output</label>
                                    <textarea className="form-textarea code-font" rows={3} value={tc.output} onChange={(e) => updateSampleTC(i, 'output', e.target.value)} placeholder="Expected output" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Explanation (optional)</label>
                                <input type="text" className="form-input" value={tc.explanation} onChange={(e) => updateSampleTC(i, 'explanation', e.target.value)} placeholder="Brief explanation of this example" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 3: Hidden Test Cases */}
                <div className="form-section card">
                    <div className="flex justify-between items-center mb-lg">
                        <h2 className="form-section-title">🔒 Hidden Test Cases (Evaluation only)</h2>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={addHiddenTC}>
                            + Add Case
                        </button>
                    </div>
                    <div className="alert alert-info mb-lg">
                        🔒 These test cases are never shown to users — they're only used to evaluate submissions.
                    </div>
                    {form.hiddenTestCases.map((tc, i) => (
                        <div key={i} className="test-case-block">
                            <div className="tc-header">
                                <span className="tc-label">Test Case {i + 1}</span>
                                {form.hiddenTestCases.length > 1 && (
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeHiddenTC(i)}>✕</button>
                                )}
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Input</label>
                                    <textarea className="form-textarea code-font" rows={3} value={tc.input} onChange={(e) => updateHiddenTC(i, 'input', e.target.value)} placeholder="Hidden input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expected Output</label>
                                    <textarea className="form-textarea code-font" rows={3} value={tc.output} onChange={(e) => updateHiddenTC(i, 'output', e.target.value)} placeholder="Expected output" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Publish toggle */}
                <div className="form-section card">
                    <label className="publish-toggle">
                        <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} />
                        <div>
                            <div className="toggle-title">Publish immediately</div>
                            <div className="toggle-desc text-muted text-sm">Make this problem visible to all users right away.</div>
                        </div>
                    </label>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/host/problems')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                        {saving ? (
                            <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Creating...</>
                        ) : '🚀 Create Problem'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProblem;
