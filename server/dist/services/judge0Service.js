import axios from 'axios';
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
export async function executeCode(code, language, problem) {
    try {
        const languageId = getLanguageId(language);
        // For now, we'll do a simple client-side validation
        // In production, you'd use Judge0 API
        if (!RAPIDAPI_KEY) {
            // Fallback to client-side execution for development
            return executeCodeClientSide(code, problem);
        }
        // Judge0 API execution (when API key is available)
        const response = await axios.post(`${JUDGE0_API_URL}/submissions`, {
            source_code: code,
            language_id: languageId,
            stdin: JSON.stringify(problem.testCases[0].input),
        }, {
            headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                'Content-Type': 'application/json',
            },
        });
        // Poll for result
        const submissionId = response.data.token;
        let result;
        let attempts = 0;
        while (attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const resultResponse = await axios.get(`${JUDGE0_API_URL}/submissions/${submissionId}`, {
                headers: {
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                },
            });
            result = resultResponse.data;
            if (result.status.id > 2) { // Finished
                break;
            }
            attempts++;
        }
        if (result.status.id === 3) { // Accepted
            return {
                success: true,
                passedTests: problem.testCases.length,
                totalTests: problem.testCases.length,
                executionTime: result.time,
            };
        }
        else {
            return {
                success: false,
                passedTests: 0,
                totalTests: problem.testCases.length,
                error: result.stderr || result.compile_output || 'Execution failed',
            };
        }
    }
    catch (error) {
        console.error('Judge0 execution error:', error);
        // Fallback to client-side execution
        return executeCodeClientSide(code, problem);
    }
}
function getLanguageId(language) {
    const languageMap = {
        'python': 71,
        'javascript': 63,
        'cpp': 54,
        'java': 62,
    };
    return languageMap[language.toLowerCase()] || 63; // Default to JavaScript
}
function executeCodeClientSide(code, problem) {
    try {
        // Simple client-side execution (for development)
        // This is a basic implementation - in production, use Judge0
        const func = new Function('return ' + code)();
        if (typeof func !== 'function') {
            return {
                success: false,
                passedTests: 0,
                totalTests: problem.testCases.length,
                error: 'Code must define a function',
            };
        }
        let passedTests = 0;
        for (const testCase of problem.testCases) {
            try {
                const result = func(...testCase.input);
                if (deepEqual(result, testCase.expectedOutput)) {
                    passedTests++;
                }
            }
            catch (e) {
                return {
                    success: false,
                    passedTests,
                    totalTests: problem.testCases.length,
                    error: `Runtime error: ${e.message}`,
                };
            }
        }
        return {
            success: passedTests === problem.testCases.length,
            passedTests,
            totalTests: problem.testCases.length,
        };
    }
    catch (e) {
        return {
            success: false,
            passedTests: 0,
            totalTests: problem.testCases.length,
            error: `Compilation error: ${e.message}`,
        };
    }
}
function deepEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (typeof a !== typeof b)
        return false;
    if (typeof a !== 'object')
        return a === b;
    if (Array.isArray(a) !== Array.isArray(b))
        return false;
    if (Array.isArray(a)) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i]))
                return false;
        }
        return true;
    }
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length)
        return false;
    for (const key of keysA) {
        if (!keysB.includes(key))
            return false;
        if (!deepEqual(a[key], b[key]))
            return false;
    }
    return true;
}
//# sourceMappingURL=judge0Service.js.map