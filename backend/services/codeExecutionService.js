const axios = require('axios');
const https = require('https');

/**
 * ============================================================
 *  Code Execution Service — Judge0 CE (Community Edition)
 *  Public endpoint: https://ce.judge0.com
 *  No API key required for basic usage.
 *  Docs: https://ce.judge0.com/
 * ============================================================
 */

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://ce.judge0.com';

// Axios instance — bypass SSL issues
const judge0 = axios.create({
    baseURL: JUDGE0_URL,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Judge0 Language IDs
 * Full list: GET https://ce.judge0.com/languages
 */
const LANGUAGE_IDS = {
    javascript: 93,  // Node.js 18.15.0
    python: 92,      // Python 3.11.2
    cpp: 54,         // C++ (GCC 9.2.0)
    c: 50,           // C (GCC 9.2.0)
    java: 62,        // Java (OpenJDK 13.0.1)
};

/**
 * Normalize output for comparison:
 * - Trim leading/trailing whitespace
 * - Normalize \r\n and \r to \n
 * - Trim each line
 * - Remove trailing blank lines
 */
const normalizeOutput = (str = '') =>
    str
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => line.trimEnd())   // remove trailing spaces per line
        .join('\n')
        .trim();

/**
 * Map Judge0 status ID → our verdict string
 * https://ce.judge0.com/statuses
 */
const mapStatus = (statusId, description) => {
    switch (statusId) {
        case 3: return 'Accepted';
        case 4: return 'Wrong Answer';
        case 5: return 'Time Limit Exceeded';
        case 6: return 'Compilation Error';
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12: return 'Runtime Error';
        case 13: return 'Runtime Error'; // Internal Error
        case 14: return 'Runtime Error'; // Exec Format Error
        default: return description || 'Runtime Error';
    }
};

/**
 * Submit code to Judge0 and poll for result.
 */
const runSingleTestCase = async (code, language, input, timeLimitMs = 5000) => {
    const languageId = LANGUAGE_IDS[language?.toLowerCase()];

    if (!languageId) {
        return {
            success: false,
            status: 'Runtime Error',
            error: `Language "${language}" not supported. Supported: ${Object.keys(LANGUAGE_IDS).join(', ')}`,
            executionTime: 0,
            output: '',
        };
    }

    const timeLimitSec = Math.min(timeLimitMs / 1000, 10);
    const startTime = Date.now();

    try {
        const { data } = await judge0.post(
            '/submissions?base64_encoded=false&wait=true',
            {
                source_code: code,
                language_id: languageId,
                stdin: input || '',
                cpu_time_limit: timeLimitSec,
                cpu_extra_time: 0.5,
                wall_time_limit: timeLimitSec + 1,
                memory_limit: 262144, // 256 MB in KB
                stack_limit: 65536,
                enable_per_process_and_thread_time_limit: false,
            },
            { timeout: (timeLimitMs + 15000) }
        );

        const executionTime = data.time ? Math.round(data.time * 1000) : (Date.now() - startTime);
        const statusId = data.status?.id;
        const statusDesc = data.status?.description || '';

        /* ── Compilation Error ─────────────────────────────── */
        if (statusId === 6) {
            return {
                success: false,
                status: 'Compilation Error',
                error: (data.compile_output || 'Compilation failed').trim(),
                executionTime,
                output: '',
            };
        }

        /* ── Time Limit Exceeded ───────────────────────────── */
        if (statusId === 5) {
            return {
                success: false,
                status: 'Time Limit Exceeded',
                error: 'Your code exceeded the time limit.',
                executionTime,
                output: '',
            };
        }

        /* ── Runtime Error ─────────────────────────────────── */
        if (statusId >= 7 && statusId <= 14) {
            return {
                success: false,
                status: 'Runtime Error',
                error: (data.stderr || data.message || statusDesc).trim(),
                executionTime,
                output: normalizeOutput(data.stdout || ''),
            };
        }

        /* ── Accepted / Wrong Answer (status 3 or 4) ──────── */
        return {
            success: statusId === 3,
            status: statusId === 3 ? 'Accepted' : mapStatus(statusId, statusDesc),
            output: normalizeOutput(data.stdout || ''),
            error: (data.stderr || '').trim(),
            executionTime,
        };

    } catch (err) {
        const executionTime = Date.now() - startTime;

        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            return { success: false, status: 'Time Limit Exceeded', error: 'Execution timed out.', executionTime, output: '' };
        }

        const httpStatus = err.response?.status;
        const msg = err.response?.data?.message || err.message;

        return {
            success: false,
            status: 'Runtime Error',
            error: `Execution service error (HTTP ${httpStatus || 'network'}): ${msg}`,
            executionTime,
            output: '',
        };
    }
};

/**
 * Execute code against ALL test cases and return aggregated verdict.
 */
const executeCode = async ({ code, language, testCases, timeLimit = 5000 }) => {
    let testCasesPassed = 0;
    let totalTime = 0;
    let finalStatus = 'Accepted';
    let errorMessage = '';
    let lastOutput = '';

    for (let i = 0; i < testCases.length; i++) {
        const result = await runSingleTestCase(code, language, testCases[i].input, timeLimit);
        totalTime += result.executionTime;

        if (!result.success) {
            finalStatus = result.status || 'Runtime Error';
            errorMessage = result.error || 'An error occurred.';
            lastOutput = result.output || '';
            break;
        }

        lastOutput = result.output;

        const expected = normalizeOutput(testCases[i].output || '');
        const actual = normalizeOutput(result.output);

        // If expected is empty (custom input run mode — no expected output), skip comparison
        if (expected === '') {
            testCasesPassed++;
            continue;
        }

        if (actual === expected) {
            testCasesPassed++;
        } else {
            finalStatus = 'Wrong Answer';
            errorMessage = `Test Case ${i + 1}:\nExpected:\n${expected}\n\nGot:\n${actual}`;
            lastOutput = actual;
            break;
        }
    }

    return {
        status: finalStatus,
        testCasesPassed,
        testCasesTotal: testCases.length,
        executionTime: testCases.length > 0 ? Math.round(totalTime / testCases.length) : 0,
        memoryUsed: 0,
        errorMessage,
        output: lastOutput,
    };
};

/**
 * Test Judge0 connection on server startup.
 */
const testPistonConnection = async () => {
    console.log('\n🔧 Testing Judge0 CE connection...');
    try {
        const { data } = await judge0.get('/languages', { timeout: 8000 });
        const supported = Object.entries(LANGUAGE_IDS)
            .map(([name, id]) => {
                const lang = data.find(l => l.id === id);
                return `   ✅ ${name.padEnd(12)} → ${lang ? lang.name : 'ID ' + id}`;
            })
            .join('\n');
        console.log(supported);
        console.log(`\n✅ Judge0 CE ready — ${data.length} languages available\n`);
    } catch (err) {
        console.warn(`⚠️  Judge0 CE unreachable: ${err.message}`);
        console.warn('   Code execution will fail until Judge0 is reachable.\n');
    }
};

module.exports = { executeCode, testPistonConnection };