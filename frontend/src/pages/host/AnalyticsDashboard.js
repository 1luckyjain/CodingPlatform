import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../../services/api';
import './AnalyticsDashboard.css';

/* ── Color palette matching our design tokens ── */
const COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const CHART_THEME = {
    grid: '#1f1f35',
    text: '#64748b',
    primary: '#6366f1',
    success: '#10b981',
};

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="tooltip-label">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    );
};

const AnalyticsDashboard = () => {
    const [overview, setOverview] = useState(null);
    const [daily, setDaily] = useState([]);
    const [difficulty, setDifficulty] = useState([]);
    const [hostData, setHostData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    /* Load all analytics in parallel */
    useEffect(() => {
        let cancelled = false;
        const loadAll = async () => {
            setLoading(true);
            try {
                const [ov, dl, diff, hd] = await Promise.all([
                    analyticsAPI.getOverview(),
                    analyticsAPI.getDailySubmissions(days),
                    analyticsAPI.getDifficultyDistribution(),
                    analyticsAPI.getHostAnalytics(),
                ]);
                if (cancelled) return;
                setOverview(ov.data.data);
                setDaily(dl.data.data || []);
                setDifficulty(diff.data.data || []);
                setHostData(hd.data.data);
            } catch (err) {
                console.error('Analytics load error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadAll();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days]);



    /* ── Format date labels ── */
    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    /* ── Acceptance rate progress bar ── */
    const AcceptanceBar = ({ rate }) => (
        <div className="acceptance-bar-wrapper">
            <div className="acceptance-bar-track">
                <div
                    className="acceptance-bar-fill"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                />
            </div>
            <span className="acceptance-bar-label">{rate}%</span>
        </div>
    );

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading analytics…</p>
            </div>
        );
    }

    return (
        <div className="analytics-page fade-in">
            <div className="page-header">
                <h1>Analytics Dashboard</h1>
                <p>Real-time insights into your problems, contests, and participant activity.</p>
            </div>

            {/* ── Platform KPI Tiles ── */}
            <div className="grid-4">
                {[
                    { icon: '👥', value: overview?.totalUsers ?? 0, label: 'Total Users' },
                    { icon: '🧩', value: overview?.totalProblems ?? 0, label: 'Total Problems' },
                    { icon: '📤', value: overview?.totalSubmissions ?? 0, label: 'Total Submissions' },
                    { icon: '🏆', value: overview?.totalContests ?? 0, label: 'Total Contests' },
                ].map(({ icon, value, label }) => (
                    <div className="stat-card" key={label}>
                        <div className="stat-icon">{icon}</div>
                        <div className="stat-value">{value.toLocaleString()}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Host-specific KPIs ── */}
            {hostData && (
                <div className="grid-4">
                    {[
                        { icon: '🧩', value: hostData.totalProblems, label: 'My Problems' },
                        { icon: '🏆', value: hostData.totalContests, label: 'My Contests' },
                        { icon: '📤', value: hostData.totalSubmissionsOnMyProblems, label: 'Submissions on My Problems' },
                        { icon: '👥', value: hostData.totalParticipants, label: 'Total Participants' },
                    ].map(({ icon, value, label }) => (
                        <div className="stat-card stat-card-accent" key={label}>
                            <div className="stat-icon">{icon}</div>
                            <div className="stat-value">{(value ?? 0).toLocaleString()}</div>
                            <div className="stat-label">{label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Acceptance rate highlight ── */}
            {overview && (
                <div className="card acceptance-card">
                    <div className="acceptance-info">
                        <span className="acceptance-title">Platform Acceptance Rate</span>
                        <span className="acceptance-value">{overview.acceptanceRate}%</span>
                    </div>
                    <AcceptanceBar rate={parseFloat(overview.acceptanceRate)} />
                    <div className="acceptance-meta text-muted text-sm">
                        {overview.acceptedSubmissions?.toLocaleString()} accepted of{' '}
                        {overview.totalSubmissions?.toLocaleString()} total submissions
                    </div>
                </div>
            )}

            {/* ── Daily Submissions Chart ── */}
            <div className="card chart-card">
                <div className="chart-header">
                    <h2 className="chart-title">Daily Submissions</h2>
                    <div className="day-selector">
                        {[7, 14, 30].map((d) => (
                            <button
                                key={d}
                                className={`day-btn ${days === d ? 'active' : ''}`}
                                onClick={() => setDays(d)}
                            >
                                {d}d
                            </button>
                        ))}
                    </div>
                </div>

                {daily.length === 0 ? (
                    <div className="chart-empty">No submission data yet.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={daily} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                tick={{ fill: CHART_THEME.text, fontSize: 12 }}
                                axisLine={{ stroke: CHART_THEME.grid }}
                            />
                            <YAxis
                                tick={{ fill: CHART_THEME.text, fontSize: 12 }}
                                axisLine={{ stroke: CHART_THEME.grid }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: CHART_THEME.text, fontSize: 13 }} />
                            <Line
                                type="monotone"
                                dataKey="total"
                                name="Total"
                                stroke={CHART_THEME.primary}
                                strokeWidth={2.5}
                                dot={{ fill: CHART_THEME.primary, strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="accepted"
                                name="Accepted"
                                stroke={CHART_THEME.success}
                                strokeWidth={2.5}
                                dot={{ fill: CHART_THEME.success, strokeWidth: 0, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* ── Two-column row: Difficulty pie + Problem bar ── */}
            <div className="charts-row">
                {/* Difficulty Distribution Pie */}
                <div className="card chart-card">
                    <div className="chart-header">
                        <h2 className="chart-title">Problem Difficulty</h2>
                    </div>
                    {difficulty.length === 0 ? (
                        <div className="chart-empty">No problems yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={difficulty.map((d) => ({ name: d._id, value: d.count }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    dataKey="value"
                                    paddingAngle={4}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={{ stroke: CHART_THEME.text }}
                                >
                                    {difficulty.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} />
                                <Legend wrapperStyle={{ fontSize: 13 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* My Problems Submissions Bar */}
                <div className="card chart-card">
                    <div className="chart-header">
                        <h2 className="chart-title">My Problems – Submissions</h2>
                    </div>
                    {!hostData?.problems?.length ? (
                        <div className="chart-empty">No problems yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart
                                data={hostData.problems.slice(0, 8).map((p) => ({
                                    name: p.title.length > 18 ? p.title.slice(0, 16) + '…' : p.title,
                                    total: p.totalSubmissions,
                                    accepted: p.acceptedSubmissions,
                                }))}
                                margin={{ top: 5, right: 20, bottom: 50, left: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: CHART_THEME.text, fontSize: 11 }}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis tick={{ fill: CHART_THEME.text, fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 13 }} />
                                <Bar dataKey="total" name="Total" fill={CHART_THEME.primary} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="accepted" name="Accepted" fill={CHART_THEME.success} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Contests participation bar ── */}
            {hostData?.contests?.length > 0 && (
                <div className="card chart-card">
                    <div className="chart-header">
                        <h2 className="chart-title">Contest Participation</h2>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                            data={hostData.contests.map((c) => ({
                                name: c.title.length > 20 ? c.title.slice(0, 18) + '…' : c.title,
                                participants: c.participants,
                                problems: c.problems,
                            }))}
                            margin={{ top: 5, right: 20, bottom: 50, left: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} />
                            <XAxis
                                dataKey="name"
                                tick={{ fill: CHART_THEME.text, fontSize: 11 }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                            />
                            <YAxis tick={{ fill: CHART_THEME.text, fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 13 }} />
                            <Bar dataKey="participants" name="Participants" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="problems" name="Problems" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
