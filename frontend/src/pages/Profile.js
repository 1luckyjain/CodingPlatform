import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await authAPI.updateProfile(form);
            updateUser(data.user);
            toast.success('Profile updated!');
            setEditing(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const acceptanceRate = user?.totalSubmissions > 0
        ? ((user.totalAccepted / user.totalSubmissions) * 100).toFixed(1)
        : '0';

    return (
        <div className="profile-page fade-in">
            <div className="profile-card card">
                <div className="profile-header">
                    <div className="profile-avatar-large">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        {editing ? (
                            <input
                                className="form-input profile-name-input"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        ) : (
                            <h1 className="profile-name">{user?.name}</h1>
                        )}
                        <div className="profile-meta">
                            <span className={`badge ${user?.role === 'host' ? 'badge-primary' : 'badge-upcoming'}`}>
                                {user?.role === 'host' ? '🏆 Host' : '👤 User'}
                            </span>
                            <span className="text-muted text-sm">📧 {user?.email}</span>
                            <span className="text-muted text-sm">
                                📅 Joined {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <div className="profile-actions">
                        {editing ? (
                            <div className="flex gap-sm">
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : '✓ Save'}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {/* Bio */}
                <div className="profile-bio-section">
                    <h3 className="section-label">About</h3>
                    {editing ? (
                        <textarea
                            className="form-textarea"
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="Write a short bio about yourself..."
                            rows={3}
                        />
                    ) : (
                        <p className="bio-text">
                            {user?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}
                        </p>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="profile-stats grid-4">
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-value">{user?.rating || 1500}</div>
                    <div className="stat-label">Rating</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{user?.solvedProblems?.length || 0}</div>
                    <div className="stat-label">Problems Solved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{acceptanceRate}%</div>
                    <div className="stat-label">Acceptance Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{user?.contestsParticipated?.length || 0}</div>
                    <div className="stat-label">Contests</div>
                </div>
            </div>

            {/* Solved Problems */}
            {user?.solvedProblems?.length > 0 && (
                <div className="card">
                    <h2 className="card-title">Solved Problems</h2>
                    <div className="solved-problems-list">
                        {user.solvedProblems.map((problem) => (
                            <div key={problem._id} className="solved-item">
                                <span className="solved-title">{problem.title}</span>
                                <span className={`badge badge-${problem.difficulty?.toLowerCase()}`}>
                                    {problem.difficulty}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
