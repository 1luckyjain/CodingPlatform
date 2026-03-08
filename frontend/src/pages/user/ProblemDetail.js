import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { problemsAPI, submissionsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './ProblemDetail.css';

const LANGUAGE_OPTIONS = [
    {
        value: 'javascript', label: 'JavaScript', monacoLang: 'javascript', defaultCode: `// Write your solution here
function solution() {
  // Your code here
}

// Read input
const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');
// Process and output
console.log(solution());` },
    {
        value: 'python', label: 'Python', monacoLang: 'python', defaultCode: `import sys
input = sys.stdin.read().strip().split('\\n')

def solution():
    # Your code here
    pass

print(solution())` },
    {
        value: 'cpp', label: 'C++', monacoLang: 'cpp', defaultCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Your code here
    
    return 0;
}` },
    {
        value: 'java', label: 'Java', monacoLang: 'java', defaultCode: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Your code here
    }
}` },
    {
        value: 'c', label: 'C', monacoLang: 'c', defaultCode: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Your code here
    return 0;
}` },
];

const ProblemDetail = () => {
    const { id } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLang, setSelectedLang] = useState(LANGUAGE_OPTIONS[0]);
    const [code, setCode] = useState(LANGUAGE_OPTIONS[0].defaultCode);
    const [activeTab, setActiveTab] = useState('description'); // description | testcases | submissions
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [running, setRunning] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const [useCustomInput, setUseCustomInput] = useState(false);

    useEffect(() => {
        const fetchProblem = async () => {
            try {
                const { data } = await problemsAPI.getById(id);
                setProblem(data.problem);
                setCustomInput(data.problem.sampleTestCases?.[0]?.input || '');
            } catch (error) {
                toast.error('Problem not found');
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [id]);

    const handleLangChange = (lang) => {
        setSelectedLang(lang);
        setCode(lang.defaultCode);
        setResult(null);
    };

    const handleRun = async () => {
        if (!code.trim()) {
            toast.error('Please write some code first.');
            return;
        }
        setRunning(true);
        setResult(null);
        try {
            const { data } = await submissionsAPI.run({
                problemId: id,
                code,
                language: selectedLang.value,
                customInput: useCustomInput ? customInput : null,
            });
            setResult({ ...data.result, type: 'run' });
            setActiveTab('testcases');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Run failed');
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            toast.error('Please write some code first.');
            return;
        }
        setSubmitting(true);
        setResult(null);
        try {
            const { data } = await submissionsAPI.submit({
                problemId: id,
                code,
                language: selectedLang.value,
            });
            const sub = data.submission;
            setResult({ ...sub, type: 'submit' });
            setActiveTab('testcases');

            if (sub.status === 'Accepted') {
                toast.success('🎉 Accepted! Great work!');
            } else {
                toast.error(`${sub.status}`);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const getDiffBadge = (diff) => {
        const m = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };
        return m[diff] || 'badge-primary';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading problem...</p>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="empty-state">
                <div className="empty-icon">❌</div>
                <h3>Problem not found</h3>
                <Link to="/problems" className="btn btn-primary mt-md">Back to Problems</Link>
            </div>
        );
    }

    return (
        <div className="problem-detail-page fade-in">
            {/* Problem Panel */}
            <div className="problem-panel">
                {/* Tabs */}
                <div className="panel-tabs">
                    {['description', 'testcases', 'submissions'].map((tab) => (
                        <button
                            key={tab}
                            className={`panel-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'description' ? '📄 Description' :
                                tab === 'testcases' ? '🧪 Test Cases' :
                                    '📋 Submissions'}
                        </button>
                    ))}
                </div>

                <div className="panel-content">
                    {/* Description Tab */}
                    {activeTab === 'description' && (
                        <div className="description-tab">
                            <div className="problem-header-info">
                                <h1 className="problem-title">{problem.title}</h1>
                                <div className="problem-meta">
                                    <span className={`badge ${getDiffBadge(problem.difficulty)}`}>
                                        {problem.difficulty}
                                    </span>
                                    {problem.tags?.map((tag) => (
                                        <span key={tag} className="badge badge-primary">{tag}</span>
                                    ))}
                                </div>
                                <div className="problem-stats-row">
                                    <span className="text-muted text-sm">
                                        ✅ Acceptance: {problem.totalSubmissions > 0
                                            ? ((problem.acceptedSubmissions / problem.totalSubmissions) * 100).toFixed(1)
                                            : 0}%
                                    </span>
                                    <span className="text-muted text-sm">📤 Submissions: {problem.totalSubmissions}</span>
                                    <span className="text-muted text-sm">⏱️ Time Limit: {problem.timeLimit / 1000}s</span>
                                    <span className="text-muted text-sm">💾 Memory: {problem.memoryLimit}MB</span>
                                </div>
                            </div>

                            <div className="divider"></div>

                            <div className="problem-description">
                                <p>{problem.description}</p>
                            </div>

                            {problem.inputFormat && (
                                <div className="problem-section">
                                    <h3>Input Format</h3>
                                    <p>{problem.inputFormat}</p>
                                </div>
                            )}

                            {problem.outputFormat && (
                                <div className="problem-section">
                                    <h3>Output Format</h3>
                                    <p>{problem.outputFormat}</p>
                                </div>
                            )}

                            {problem.constraints && (
                                <div className="problem-section">
                                    <h3>Constraints</h3>
                                    <pre className="constraints code-font">{problem.constraints}</pre>
                                </div>
                            )}

                            {/* Sample Test Cases */}
                            {problem.sampleTestCases?.length > 0 && (
                                <div className="problem-section">
                                    <h3>Examples</h3>
                                    {problem.sampleTestCases.map((tc, i) => (
                                        <div key={i} className="example-case">
                                            <div className="example-label">Example {i + 1}</div>
                                            <div className="example-io">
                                                <div className="io-block">
                                                    <span className="io-label">Input:</span>
                                                    <pre className="io-code code-font">{tc.input}</pre>
                                                </div>
                                                <div className="io-block">
                                                    <span className="io-label">Output:</span>
                                                    <pre className="io-code code-font">{tc.output}</pre>
                                                </div>
                                            </div>
                                            {tc.explanation && (
                                                <div className="example-explanation">
                                                    <span className="io-label">Explanation:</span>
                                                    <p>{tc.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Test Cases Tab */}
                    {activeTab === 'testcases' && (
                        <div className="testcases-tab">
                            <div className="custom-input-toggle">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={useCustomInput}
                                        onChange={(e) => setUseCustomInput(e.target.checked)}
                                    />
                                    Use custom input
                                </label>
                            </div>

                            {useCustomInput && (
                                <div className="form-group">
                                    <label className="form-label">Custom Input</label>
                                    <textarea
                                        className="form-textarea code-font"
                                        value={customInput}
                                        onChange={(e) => setCustomInput(e.target.value)}
                                        rows={5}
                                        placeholder="Enter your custom input here..."
                                    />
                                </div>
                            )}

                            {result && (
                                <div className={`result-box ${result.status === 'Accepted' ? 'success' : 'error'}`}>
                                    <div className="result-header">
                                        <span className={`result-status verdict ${result.status === 'Accepted' ? 'verdict-accepted' :
                                                result.status === 'Time Limit Exceeded' ? 'verdict-tle' :
                                                    'verdict-wrong'
                                            }`}>
                                            {result.status === 'Accepted' ? '✅' : '❌'} {result.status}
                                        </span>
                                        <div className="result-meta">
                                            {result.executionTime !== undefined && (
                                                <span>⏱️ {result.executionTime}ms</span>
                                            )}
                                            {result.testCasesPassed !== undefined && (
                                                <span>🧪 {result.testCasesPassed}/{result.testCasesTotal} passed</span>
                                            )}
                                        </div>
                                    </div>

                                    {result.output && (
                                        <div className="result-output">
                                            <div className="io-label">Output:</div>
                                            <pre className="io-code code-font">{result.output}</pre>
                                        </div>
                                    )}

                                    {result.errorMessage && (
                                        <div className="result-error">
                                            <div className="io-label text-error">Error:</div>
                                            <pre className="io-code code-font text-error">{result.errorMessage}</pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!result && (
                                <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                                    <div className="empty-icon">🧪</div>
                                    <h3>No results yet</h3>
                                    <p>Run or submit your code to see the results here.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submissions Tab */}
                    {activeTab === 'submissions' && (
                        <div className="submissions-tab">
                            <Link to="/submissions" className="btn btn-secondary btn-sm mb-md">
                                View all my submissions →
                            </Link>
                            {result && result.type === 'submit' && (
                                <div className={`result-box ${result.status === 'Accepted' ? 'success' : 'error'}`}>
                                    <div className="result-header">
                                        <span className={`verdict ${result.status === 'Accepted' ? 'verdict-accepted' : 'verdict-wrong'}`}>
                                            {result.status}
                                        </span>
                                        <div className="result-meta">
                                            <span>⏱️ {result.executionTime}ms</span>
                                            <span>🧪 {result.testCasesPassed}/{result.testCasesTotal}</span>
                                        </div>
                                    </div>
                                    {result.errorMessage && (
                                        <pre className="io-code code-font text-error mt-md">{result.errorMessage}</pre>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Panel */}
            <div className="editor-panel">
                {/* Language Selector */}
                <div className="editor-toolbar">
                    <div className="lang-selector">
                        {LANGUAGE_OPTIONS.map((lang) => (
                            <button
                                key={lang.value}
                                className={`lang-btn ${selectedLang.value === lang.value ? 'active' : ''}`}
                                onClick={() => handleLangChange(lang)}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                    <div className="editor-actions">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCode(selectedLang.defaultCode)}
                            title="Reset to default"
                        >
                            ↺ Reset
                        </button>
                    </div>
                </div>

                {/* Monaco Editor */}
                <div className="editor-wrapper">
                    <Editor
                        height="100%"
                        language={selectedLang.monacoLang}
                        value={code}
                        onChange={(val) => setCode(val || '')}
                        theme="vs-dark"
                        options={{
                            fontSize: 14,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            fontLigatures: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 4,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            renderLineHighlight: 'line',
                            bracketPairColorization: { enabled: true },
                            padding: { top: 16 },
                        }}
                    />
                </div>

                {/* Submit / Run Bar */}
                <div className="editor-footer">
                    <div className="footer-left">
                        <span className="text-muted text-sm code-font">{selectedLang.label}</span>
                    </div>
                    <div className="footer-right">
                        <button
                            className="btn btn-secondary"
                            onClick={handleRun}
                            disabled={running || submitting}
                            id="run-code-btn"
                        >
                            {running ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Running...</>
                            ) : (
                                '▶ Run Code'
                            )}
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={running || submitting}
                            id="submit-code-btn"
                        >
                            {submitting ? (
                                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Submitting...</>
                            ) : (
                                '🚀 Submit'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemDetail;
