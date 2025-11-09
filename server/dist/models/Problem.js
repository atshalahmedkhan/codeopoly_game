import mongoose, { Schema } from 'mongoose';
const TestCaseSchema = new Schema({
    input: [Schema.Types.Mixed],
    expectedOutput: Schema.Types.Mixed,
    description: String,
});
const ProblemSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    category: { type: String, enum: ['arrays', 'strings', 'dp', 'graphs', 'trees', 'sql', 'system-design'], required: true },
    functionName: { type: String, required: true },
    functionSignatures: {
        python: String,
        javascript: String,
        cpp: String,
        java: String,
    },
    testCases: [TestCaseSchema],
    examples: [{
            input: String,
            output: String,
            explanation: String,
        }],
    timeLimit: { type: Number, default: 300 }, // 5 minutes default
});
export const Problem = mongoose.model('Problem', ProblemSchema);
//# sourceMappingURL=Problem.js.map