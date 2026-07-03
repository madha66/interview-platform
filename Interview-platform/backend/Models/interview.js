const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  expectedOutput: { type: String, required: true }
});

const interviewSessionSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true, index: true },
  questionTitle: { type: String, required: true },
  questionDesc: { type: String, required: true },
  testCases: [testCaseSchema],
  createdAt: { type: Date, default: Date.now }
});

const testCaseResultSchema = new mongoose.Schema({
  input: { type: String, default: "" },
  expected: { type: String, required: true },
  output: { type: String, default: "" },
  passed: { type: Boolean, required: true }
});

const candidateSubmissionSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  code: { type: String, default: "" },
  language: { type: String, default: "" },
  testCaseResults: [testCaseResultSchema],
  evaluation: {
    status: { type: String, default: "Pending" }, // Pending, Evaluated
    grade: { type: String, default: "Pending" }, // Pass, Fail, Pending
    feedback: { type: String, default: "" }
  },
  updatedAt: { type: Date, default: Date.now }
});

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
const CandidateSubmission = mongoose.model('CandidateSubmission', candidateSubmissionSchema);

module.exports = { InterviewSession, CandidateSubmission };
