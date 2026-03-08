/**
 * Shared utility helpers for the frontend
 */

/** Format a date string to user-friendly display */
export const formatDate = (dateStr, options = {}) => {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    });
};

/** Truncate a string to a maximum length */
export const truncate = (str, max = 80) =>
    str && str.length > max ? str.slice(0, max) + '…' : str;

/** Map submission status → CSS class */
export const getVerdictClass = (status) => {
    const map = {
        Accepted: 'verdict-accepted',
        'Wrong Answer': 'verdict-wrong',
        'Time Limit Exceeded': 'verdict-tle',
        'Memory Limit Exceeded': 'verdict-tle',
        'Compilation Error': 'verdict-error',
        'Runtime Error': 'verdict-error',
        Pending: 'verdict-pending',
        Running: 'verdict-pending',
    };
    return map[status] || 'verdict-pending';
};

/** Map difficulty → CSS badge class */
export const getDiffBadgeClass = (diff) => {
    const map = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
    return map[diff] || 'badge-primary';
};

/** Calculate acceptance rate percentage string */
export const acceptanceRate = (accepted, total) => {
    if (!total) return '—';
    return ((accepted / total) * 100).toFixed(1) + '%';
};

/** Format large numbers: 1234 → "1.2K" */
export const fmtNumber = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
};
