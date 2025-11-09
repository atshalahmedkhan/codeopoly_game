import mongoose, { Document } from 'mongoose';
export interface ITestCase {
    input: any[];
    expectedOutput: any;
    description?: string;
}
export interface IProblem extends Document {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'arrays' | 'strings' | 'dp' | 'graphs' | 'trees' | 'sql' | 'system-design';
    functionName: string;
    functionSignatures: {
        python: string;
        javascript: string;
        cpp: string;
        java: string;
    };
    testCases: ITestCase[];
    examples: Array<{
        input: string;
        output: string;
        explanation?: string;
    }>;
    timeLimit: number;
}
export declare const Problem: mongoose.Model<IProblem, {}, {}, {}, mongoose.Document<unknown, {}, IProblem, {}, {}> & IProblem & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Problem.d.ts.map