const express = require('express');
const router = express.Router();
const { InterviewSession, CandidateSubmission } = require('../Models/interview');

// Helper to generate a random unique meeting ID
function generateMeetingId() {
  return 'ARENA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 1. Create a new interview session (Instructor flow)
router.post('/create', async (req, res) => {
  try {
    const { questionTitle, questionDesc, testCases } = req.body;
    if (!questionTitle || !questionDesc || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({ error: 'Missing required session parameters' });
    }

    const meetingId = generateMeetingId();
    const session = new InterviewSession({
      meetingId,
      questionTitle,
      questionDesc,
      testCases
    });

    await session.save();
    return res.status(201).json(session);
  } catch (error) {
    console.error('Error creating interview session:', error);
    return res.status(500).json({ error: 'Server error creating session', details: error.message });
  }
});

// 2. Fetch session details (Student flow)
router.get('/session/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const session = await InterviewSession.findOne({ meetingId: meetingId.toUpperCase() });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.status(200).json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return res.status(500).json({ error: 'Server error retrieving session' });
  }
});

// 3. Submit code and compilation output (Student flow)
router.post('/submit', async (req, res) => {
  try {
    const { meetingId, studentName, code, language, testCaseResults } = req.body;
    if (!meetingId || !studentName) {
      return res.status(400).json({ error: 'Missing meetingId or studentName' });
    }

    const uppercaseId = meetingId.toUpperCase();

    // Check if session exists first
    const session = await InterviewSession.findOne({ meetingId: uppercaseId });
    if (!session) {
      return res.status(404).json({ error: 'Associated interview session not found' });
    }

    let submission = await CandidateSubmission.findOne({ meetingId: uppercaseId, studentName });
    if (submission) {
      submission.code = code || '';
      submission.language = language || '';
      submission.testCaseResults = testCaseResults || [];
      submission.updatedAt = new Date();
    } else {
      submission = new CandidateSubmission({
        meetingId: uppercaseId,
        studentName,
        code: code || '',
        language: language || '',
        testCaseResults: testCaseResults || [],
        evaluation: {
          status: 'Pending',
          grade: 'Pending',
          feedback: ''
        }
      });
    }

    await submission.save();
    return res.status(200).json(submission);
  } catch (error) {
    console.error('Error submitting code:', error);
    return res.status(500).json({ error: 'Server error saving submission' });
  }
});

// 4. Retrieve all candidate submissions (Instructor flow)
router.get('/submissions/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const submissions = await CandidateSubmission.find({ meetingId: meetingId.toUpperCase() }).sort({ updatedAt: -1 });
    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Error retrieving submissions:', error);
    return res.status(500).json({ error: 'Server error fetching submissions' });
  }
});

// 5. Evaluate/Grade candidate submission (Instructor flow)
router.post('/evaluate', async (req, res) => {
  try {
    const { meetingId, studentName, grade, feedback } = req.body;
    if (!meetingId || !studentName || !grade) {
      return res.status(400).json({ error: 'Missing meetingId, studentName, or grade' });
    }

    const submission = await CandidateSubmission.findOne({ 
      meetingId: meetingId.toUpperCase(), 
      studentName 
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    submission.evaluation.status = 'Evaluated';
    submission.evaluation.grade = grade;
    submission.evaluation.feedback = feedback || '';
    submission.updatedAt = new Date();

    await submission.save();
    return res.status(200).json(submission);
  } catch (error) {
    console.error('Error evaluating submission:', error);
    return res.status(500).json({ error: 'Server error evaluating candidate' });
  }
});

module.exports = router;
