interface ExecutionResult {
    success: boolean;
    passedTests: number;
    totalTests: number;
    error?: string;
    executionTime?: number;
}
export declare function executeCode(code: string, language: string, problem: any): Promise<ExecutionResult>;
export {};
//# sourceMappingURL=judge0Service.d.ts.map