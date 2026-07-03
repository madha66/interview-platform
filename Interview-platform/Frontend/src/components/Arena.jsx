import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import './arena.css';

// Wandbox API mapping
const LANGUAGE_CONFIGS = {
  python: {
    label: 'Python 3',
    compilerId: 'cpython-3.14.0',
    template: `# Python 3 template\nimport sys\n\ndef main():\n    # Read all lines from standard input\n    input_data = sys.stdin.read().strip()\n    if input_data:\n        # Process input (e.g., split numbers, run logic)\n        print(f"Processed: {input_data}")\n    else:\n        print("No input received")\n\nif __name__ == '__main__':\n    main()\n`
  },
  cpp: {
    label: 'C++',
    compilerId: 'gcc-13.2.0',
    template: `// C++ template\n#include <iostream>\n#include <string>\n#include <sstream>\n\nusing namespace std;\n\nint main() {\n    string input_line;\n    // Read input from standard input\n    if (getline(cin, input_line)) {\n        cout << "Processed: " << input_line << endl;\n    } else {\n        cout << "No input received" << endl;\n    }\n    return 0;\n}\n`
  },
  java: {
    label: 'Java',
    compilerId: 'openjdk-jdk-21+35',
    template: `// Java template (Class name must be Solution - DO NOT use public class)\nimport java.util.Scanner;\n\nclass Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String inputData = sc.nextLine().trim();\n            System.out.println("Processed: " + inputData);\n        } else {\n            System.out.println("No input received");\n        }\n    }\n}\n`
  }
};

function Arena() {
  // Navigation & Role states
  // Views: 'SELECT_ROLE', 'INSTRUCTOR_CREATE', 'INSTRUCTOR_DASHBOARD', 'STUDENT_JOIN', 'STUDENT_WORKSPACE'
  const [view, setView] = useState('SELECT_ROLE');

  // Instructor Creator States
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionDesc, setQuestionDesc] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [meetingId, setMeetingId] = useState('');
  const [copied, setCopied] = useState(false);

  // Instructor Dashboard States
  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [evalGrade, setEvalGrade] = useState('Pass');
  const [evalFeedback, setEvalFeedback] = useState('');

  // Student States
  const [studentName, setStudentName] = useState('');
  const [searchMeetingId, setSearchMeetingId] = useState('');
  const [sessionData, setSessionData] = useState(null);

  // Student Workspace Editor States
  const [selectedLang, setSelectedLang] = useState('python');
  const [editorCode, setEditorCode] = useState(LANGUAGE_CONFIGS.python.template);
  const [consoleLogs, setConsoleLogs] = useState('Write some code and click "Run Code" to compile and execute.');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState([]); // Array of { passed, output, expected }
  const [mySubmission, setMySubmission] = useState(null);

  // Auto-refresh interval ref for Instructor dashboard
  const pollingRef = useRef(null);
  // Auto-refresh interval ref for Student to fetch latest evaluation feedback
  const studentFeedbackPollingRef = useRef(null);

  // Handle changing language code template
  const handleLangChange = (lang) => {
    setSelectedLang(lang);
    setEditorCode(LANGUAGE_CONFIGS[lang].template);
  };

  // Instructor adds a testcase
  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }]);
  };

  // Instructor removes a testcase
  const removeTestCase = (index) => {
    if (testCases.length === 1) return;
    const newTestcases = testCases.filter((_, idx) => idx !== index);
    setTestCases(newTestcases);
  };

  // Instructor updates a testcase input or output
  const updateTestCase = (index, field, val) => {
    const updated = testCases.map((tc, idx) => {
      if (idx === index) {
        return { ...tc, [field]: val };
      }
      return tc;
    });
    setTestCases(updated);
  };

  // Submit form to create session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!questionTitle || !questionDesc || testCases.some(tc => !tc.expectedOutput)) {
      alert('Please fill out all fields. Every test case requires an expected output.');
      return;
    }

    try {
      const response = await fetch('https://interview-platform-93yk.onrender.com/api/arena/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionTitle,
          questionDesc,
          testCases
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      setMeetingId(data.meetingId);

      // Save session credentials for resumption and landing page banner
      localStorage.setItem('ca_active_session', data.meetingId);
      localStorage.setItem('ca_active_role', 'instructor');

      // Move to dashboard and start polling
      startInstructorPolling(data.meetingId);
      setView('INSTRUCTOR_DASHBOARD');
    } catch (err) {
      console.error(err);
      alert('Error creating session: ' + err.message);
    }
  };

  // Start polling submissions for instructor dashboard
  const startInstructorPolling = (mId) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const fetchSubmissions = async () => {
      try {
        const response = await fetch(`https://interview-platform-93yk.onrender.com/api/arena/submissions/${mId}`);
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data);

          // Sync active candidate detail pane with live updates from the database
          setSelectedSub(prevSelected => {
            if (!prevSelected) return null;
            const updated = data.find(s => s.studentName === prevSelected.studentName);
            return updated || prevSelected;
          });
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
      }
    };

    fetchSubmissions();
    pollingRef.current = setInterval(fetchSubmissions, 1500); // Polling every 1.5 seconds for live typing sync
  };

  // Student attempts to join session
  const handleJoinSession = async (e) => {
    e.preventDefault();
    if (!studentName || !searchMeetingId) {
      alert('Please enter your name and meeting ID');
      return;
    }

    try {
      const response = await fetch(`https://interview-platform-93yk.onrender.com/api/arena/session/${searchMeetingId.trim().toUpperCase()}`);
      if (!response.ok) {
        throw new Error('Invalid Meeting ID. Session not found.');
      }

      const data = await response.json();
      setSessionData(data);

      // Save student session parameters for resumption and landing page banner
      localStorage.setItem('ca_active_session', data.meetingId);
      localStorage.setItem('ca_active_role', 'student');
      localStorage.setItem('ca_student_name', studentName);

      setView('STUDENT_WORKSPACE');
      // Start student polling to fetch evaluations
      startStudentFeedbackPolling(data.meetingId, studentName);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // Start polling evaluations for student
  const startStudentFeedbackPolling = (mId, name) => {
    if (studentFeedbackPollingRef.current) clearInterval(studentFeedbackPollingRef.current);

    const fetchMySubmission = async () => {
      try {
        const response = await fetch(`https://interview-platform-93yk.onrender.com/api/arena/submissions/${mId}`);
        if (response.ok) {
          const allSubmissions = await response.json();
          const found = allSubmissions.find(s => s.studentName.toLowerCase() === name.toLowerCase());
          if (found) {
            setMySubmission(found);
          }
        }
      } catch (err) {
        console.error('Error fetching my submission:', err);
      }
    };

    fetchMySubmission();
    studentFeedbackPollingRef.current = setInterval(fetchMySubmission, 3000);
  };

  // Call Wandbox execute endpoint
  const executeCodeOnWandbox = async (language, code, stdin) => {
    const config = LANGUAGE_CONFIGS[language];
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: config.compilerId,
        code: code,
        stdin: stdin
      })
    });

    if (!response.ok) {
      throw new Error('Wandbox compilation failed');
    }

    return await response.json();
  };

  // Student runs the code against test cases
  const handleRunCode = async () => {
    if (!sessionData) return;
    setIsRunning(true);
    setConsoleLogs('Running code against test cases...\n');
    setRunResults([]);

    try {
      const results = [];
      let logs = '';

      for (let i = 0; i < sessionData.testCases.length; i++) {
        const tc = sessionData.testCases[i];
        logs += `Running Test Case ${i + 1}...\n`;
        setConsoleLogs(logs);

        const execution = await executeCodeOnWandbox(selectedLang, editorCode, tc.input);
        const stdout = execution.program_output || '';
        const stderr = execution.compiler_error || execution.program_error || '';

        if (stderr) {
          logs += `Error in Test Case ${i + 1}:\n${stderr}\n`;
          setConsoleLogs(logs);
          results.push({
            input: tc.input,
            expected: tc.expectedOutput,
            output: stderr,
            passed: false
          });
        } else {
          const cleanOutput = stdout.trim();
          const cleanExpected = tc.expectedOutput.trim();
          const passed = cleanOutput === cleanExpected;

          logs += `Test Case ${i + 1} Done. Output: "${cleanOutput}"\n`;
          setConsoleLogs(logs);

          results.push({
            input: tc.input,
            expected: tc.expectedOutput,
            output: stdout,
            passed
          });
        }
      }

      setRunResults(results);
      const passedCount = results.filter(r => r.passed).length;
      logs += `\nSummary: ${passedCount}/${sessionData.testCases.length} Test Cases Passed.\n`;
      setConsoleLogs(logs);

    } catch (err) {
      setConsoleLogs(prev => prev + `\nSystem Error executing code: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Student submits code to backend for Instructor evaluation
  const handleSubmitCode = async () => {
    if (!sessionData || !studentName) return;
    setIsSubmitting(true);

    // Ensure we run the test cases first to get the latest results
    let currentResults = runResults;
    if (currentResults.length === 0) {
      setConsoleLogs('Running code to evaluate test cases before submission...\n');
      try {
        const results = [];
        for (let i = 0; i < sessionData.testCases.length; i++) {
          const tc = sessionData.testCases[i];
          const execution = await executeCodeOnWandbox(selectedLang, editorCode, tc.input);
          const stdout = execution.program_output || '';
          const stderr = execution.compiler_error || execution.program_error || '';
          const cleanOutput = stdout.trim();
          const cleanExpected = tc.expectedOutput.trim();
          const passed = stderr ? false : (cleanOutput === cleanExpected);

          results.push({
            input: tc.input,
            expected: tc.expectedOutput,
            output: stderr || stdout,
            passed
          });
        }
        currentResults = results;
        setRunResults(results);
      } catch (err) {
        alert('Could not run code: ' + err.message);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch('https://interview-platform-93yk.onrender.com/api/arena/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: sessionData.meetingId,
          studentName,
          code: editorCode,
          language: selectedLang,
          testCaseResults: currentResults
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit code to server');
      }

      const updated = await response.json();
      setMySubmission(updated);
      setConsoleLogs(prev => prev + '\nSubmission successful! The instructor has been notified.\n');
    } catch (err) {
      console.error(err);
      alert('Error submitting code: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instructor posts evaluation
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedSub || !meetingId) return;

    try {
      const response = await fetch('https://interview-platform-93yk.onrender.com/api/arena/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          studentName: selectedSub.studentName,
          grade: evalGrade,
          feedback: evalFeedback
        })
      });

      if (!response.ok) {
        throw new Error('Evaluation submission failed');
      }

      const updated = await response.json();

      // Update local state list
      const updatedList = submissions.map(s => {
        if (s.studentName === updated.studentName) {
          return updated;
        }
        return s;
      });
      setSubmissions(updatedList);
      setSelectedSub(updated);
      alert(`Evaluation saved for ${selectedSub.studentName}`);
    } catch (err) {
      console.error(err);
      alert('Error saving evaluation: ' + err.message);
    }
  };

  // Copy meeting ID to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Select a candidate in dashboard
  const handleSelectCandidate = (sub) => {
    setSelectedSub(sub);
    setEvalGrade(sub.evaluation.grade !== 'Pending' ? sub.evaluation.grade : 'Pass');
    setEvalFeedback(sub.evaluation.feedback || '');
  };

  // Student editor background debounced code synchronization (autosave)
  useEffect(() => {
    if (view !== 'STUDENT_WORKSPACE' || !sessionData || !studentName) return;

    const delayDebounceFn = setTimeout(() => {
      fetch('https://interview-platform-93yk.onrender.com/api/arena/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: sessionData.meetingId,
          studentName,
          code: editorCode,
          language: selectedLang,
          testCaseResults: runResults
        })
      }).catch(err => console.error('Synchronous live type save error:', err));
    }, 1000); // 1 second debounce

    return () => clearTimeout(delayDebounceFn);
  }, [editorCode, selectedLang, view, sessionData, studentName]);

  // Clean up timers on unmount & restore active sessions from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('ca_active_session');
    const savedRole = localStorage.getItem('ca_active_role');
    const savedName = localStorage.getItem('ca_student_name');

    if (savedSession && savedRole) {
      if (savedRole === 'instructor') {
        setMeetingId(savedSession);
        setView('INSTRUCTOR_DASHBOARD');
        startInstructorPolling(savedSession);
      } else if (savedRole === 'student' && savedName) {
        setStudentName(savedName);
        setSearchMeetingId(savedSession);

        const resumeStudentSession = async () => {
          try {
            const response = await fetch(`https://interview-platform-93yk.onrender.com/api/arena/session/${savedSession}`);
            if (response.ok) {
              const data = await response.json();
              setSessionData(data);
              setView('STUDENT_WORKSPACE');
              startStudentFeedbackPolling(data.meetingId, savedName);
            }
          } catch (e) {
            console.error("Auto resume error:", e);
          }
        };
        resumeStudentSession();
      }
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (studentFeedbackPollingRef.current) clearInterval(studentFeedbackPollingRef.current);
    };
  }, []);

  return (
    <div className="ca-page-container arena-container">

      {/* Back to landing link */}
      <Link to="/Landings" className="arena-back-link" onClick={() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (studentFeedbackPollingRef.current) clearInterval(studentFeedbackPollingRef.current);
      }}>
        &larr; Back to Dashboard
      </Link>

      <h1 className="arena-header-title">CodeArena &bull; Interview Arena</h1>

      {/* VIEW 1: ROLE SELECTOR SCREEN */}
      {view === 'SELECT_ROLE' && (
        <section className="arena-role-select">
          <h2 className="arena-role-title">Choose your role to enter the interview arena</h2>
          <div className="arena-role-grid">

            <div
              className="arena-role-card arena-role-instructor"
              onClick={() => setView('INSTRUCTOR_CREATE')}
            >
              <div className="arena-role-icon">👩‍🏫</div>
              <h3>I am an Instructor</h3>
              <p>Post a technical question, define test cases, and evaluate student submissions live.</p>
            </div>

            <div
              className="arena-role-card arena-role-student"
              onClick={() => setView('STUDENT_JOIN')}
            >
              <div className="arena-role-icon">👨‍💻</div>
              <h3>I am a Student</h3>
              <p>Enter your session ID, read the problem statement, write your code, and submit for evaluation.</p>
            </div>

          </div>
        </section>
      )}

      {/* VIEW 2: INSTRUCTOR CREATE QUESTION FORM */}
      {view === 'INSTRUCTOR_CREATE' && (
        <section>
          <form className="arena-instructor-create" onSubmit={handleCreateSession}>
            <h2 className="arena-creator-title">Post Coding Challenge</h2>

            <div className="ca-input-group">
              <label className="ca-input-label">Challenge Title</label>
              <input
                type="text"
                className="ca-text-input"
                placeholder="e.g. Reverse a LinkedList"
                value={questionTitle}
                onChange={(e) => setQuestionTitle(e.target.value)}
                required
              />
            </div>

            <div className="ca-input-group">
              <label className="ca-input-label">Challenge Description</label>
              <textarea
                className="arena-textarea"
                placeholder="Detail the question requirements, parameters, constraints, and instructions..."
                value={questionDesc}
                onChange={(e) => setQuestionDesc(e.target.value)}
                required
              />
            </div>

            <div className="test-cases-section">
              <label className="ca-input-label">Test Cases (Inputs & Expected Outputs)</label>

              {testCases.map((tc, index) => (
                <div className="test-case-row" key={index}>
                  <div className="ca-input-group">
                    <input
                      type="text"
                      className="ca-text-input"
                      placeholder={`Input ${index + 1}`}
                      value={tc.input}
                      onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                    />
                  </div>
                  <div className="ca-input-group">
                    <input
                      type="text"
                      className="ca-text-input"
                      placeholder={`Expected Output ${index + 1}`}
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                      required
                    />
                  </div>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      className="remove-tc-btn"
                      onClick={() => removeTestCase(index)}
                      title="Remove Test Case"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="add-tc-btn" onClick={addTestCase}>
                + Add Test Case
              </button>
            </div>

            <button type="submit" className="arena-create-submit">
              Generate Interview Session
            </button>
          </form>
        </section>
      )}

      {/* VIEW 3: STUDENT JOIN ENTRY */}
      {view === 'STUDENT_JOIN' && (
        <section>
          <form className="arena-join-box" onSubmit={handleJoinSession}>
            <h2 className="arena-join-title">Join Arena Session</h2>

            <div className="ca-input-group">
              <label className="ca-input-label">Your Full Name</label>
              <input
                type="text"
                className="ca-text-input"
                placeholder="Enter your name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>

            <div className="ca-input-group">
              <label className="ca-input-label">Meeting Room ID</label>
              <input
                type="text"
                className="ca-text-input"
                placeholder="e.g. ARENA-XYZ1"
                value={searchMeetingId}
                onChange={(e) => setSearchMeetingId(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="arena-join-btn">
              Join Session
            </button>
          </form>
        </section>
      )}

      {/* VIEW 4: INSTRUCTOR LIVE EVALUATION DASHBOARD */}
      {view === 'INSTRUCTOR_DASHBOARD' && (
        <section>
          <div className="arena-meeting-result">
            <h3 style={{ margin: 0 }}>Active Interview Room</h3>
            <div className="arena-meeting-id">{meetingId}</div>
            <p className="arena-meeting-caption">
              Send this Meeting ID to students to join and take the coding interview.
            </p>
            <button className="ca-clipboard-btn" onClick={handleCopyLink}>
              {copied ? 'Copied Room ID!' : 'Copy Meeting ID'}
            </button>
          </div>

          <div className="instructor-dashboard">
            {/* Sidebar Candidate List */}
            <div className="dashboard-sidebar">
              <div className="sidebar-title">Candidates Joined</div>
              <div className="candidate-list">
                {submissions.length === 0 ? (
                  <div style={{ color: '#a1a1a6', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                    Waiting for students to join...
                  </div>
                ) : (
                  submissions.map((sub, idx) => (
                    <div
                      key={idx}
                      className={`candidate-item ${selectedSub && selectedSub.studentName === sub.studentName ? 'active' : ''}`}
                      onClick={() => handleSelectCandidate(sub)}
                    >
                      <strong style={{ display: 'block', marginBottom: '4px' }}>{sub.studentName}</strong>
                      <div className="cand-meta">
                        <span>Lang: {sub.language.toUpperCase()}</span>
                        <span className={`status-badge ${sub.evaluation.status.toLowerCase()}`}>
                          {sub.evaluation.status === 'Evaluated' ? `${sub.evaluation.grade}` : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Candidate Code Details & Evaluator */}
            <div className="dashboard-detail">
              {selectedSub ? (
                <>
                  <div className="detail-header">
                    <h3>Candidate: {selectedSub.studentName}</h3>
                    <p style={{ color: '#a1a1a6', margin: '0.25rem 0 0 0' }}>
                      Last Updated: {new Date(selectedSub.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontFamily: 'Space Mono' }}>Submitted Code</h4>
                    <pre className="detail-code-block">{selectedSub.code}</pre>
                  </div>

                  <div className="detail-results">
                    <h4 style={{ margin: '0 0 0.75rem 0', fontFamily: 'Space Mono' }}>Test Case Results</h4>
                    {selectedSub.testCaseResults.map((tc, idx) => (
                      <div key={idx} className="result-tc-item">
                        <span>Test Case {idx + 1}</span>
                        <span className={tc.passed ? 'tc-passed' : 'tc-failed'}>
                          {tc.passed ? '✓ Passed' : '✗ Failed'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form className="evaluation-form" onSubmit={handleSaveEvaluation}>
                    <h4 style={{ margin: '0', fontFamily: 'Space Mono' }}>Evaluation Feedback</h4>

                    <div className="ca-input-group">
                      <label className="ca-input-label">Grade / Result</label>
                      <select
                        className="eval-select"
                        value={evalGrade}
                        onChange={(e) => setEvalGrade(e.target.value)}
                      >
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Pending">Keep Under Review</option>
                      </select>
                    </div>

                    <div className="ca-input-group">
                      <label className="ca-input-label">Written Feedback</label>
                      <textarea
                        className="arena-textarea"
                        style={{ height: '80px' }}
                        placeholder="Provide details about their code complexity, clean practices, or optimization recommendations..."
                        value={evalFeedback}
                        onChange={(e) => setEvalFeedback(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="arena-create-submit">
                      Save Evaluation Result
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a1a1a6' }}>
                  Select a candidate from the left sidebar to view code submission and evaluate.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* VIEW 5: STUDENT SPLIT WORKSPACE SCREEN */}
      {view === 'STUDENT_WORKSPACE' && sessionData && (
        <section className="student-workspace">

          {/* Left Panel: Question Statement and Test Cases */}
          <div className="student-left-pane">
            <div className="question-card">
              <h2>{sessionData.questionTitle}</h2>
              <div className="question-desc">{sessionData.questionDesc}</div>
            </div>

            <div className="testcases-list">
              <h4>Expected Test Cases</h4>
              {sessionData.testCases.map((tc, idx) => (
                <div key={idx} className="testcase-item-box">
                  <div style={{ marginBottom: '8px' }}>
                    <div className="tc-box-label">Test Case {idx + 1} Input</div>
                    <div className="tc-box-val">{tc.input || 'No input parameter'}</div>
                  </div>
                  <div>
                    <div className="tc-box-label">Expected Output</div>
                    <div className="tc-box-val">{tc.expectedOutput}</div>
                  </div>
                  {runResults[idx] && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                      <div className="tc-box-label">Your Output</div>
                      <div className="tc-box-val" style={{ color: runResults[idx].passed ? '#10b981' : '#ef4444' }}>
                        {runResults[idx].output || 'No output'}
                      </div>
                      <div style={{ marginTop: '4px', fontWeight: 'bold', fontSize: '0.8rem', color: runResults[idx].passed ? '#10b981' : '#ef4444' }}>
                        {runResults[idx].passed ? '✓ Passed' : '✗ Failed'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Display Evaluation feedback when posted by instructor */}
            {mySubmission && mySubmission.evaluation && mySubmission.evaluation.status === 'Evaluated' && (
              <div className="evaluation-banner">
                <h4 style={{ margin: '0 0 0.5rem 0', fontFamily: 'Space Mono' }}>Instructor Evaluation Received</h4>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Grade:</strong> <span style={{ textTransform: 'uppercase' }}>{mySubmission.evaluation.grade}</span>
                </div>
                {mySubmission.evaluation.feedback && (
                  <div>
                    <strong>Feedback:</strong> {mySubmission.evaluation.feedback}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Code Editor, Console logs, Run CTAs */}
          <div className="student-right-pane">
            <div className="editor-controls">
              <select
                className="lang-select"
                value={selectedLang}
                onChange={(e) => handleLangChange(e.target.value)}
              >
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC 10)</option>
                <option value="java">Java (JDK 15)</option>
              </select>

              <span style={{ color: '#a1a1a6', fontSize: '0.85rem', fontFamily: 'Space Mono' }}>
                Room: {sessionData.meetingId}
              </span>
            </div>

            {/* Custom Mono Text Editor */}
            <div className="custom-editor-container">
              <textarea
                className="editor-textarea"
                value={editorCode}
                onChange={(e) => setEditorCode(e.target.value)}
                spellCheck="false"
              />
            </div>

            {/* Output console terminal */}
            <div className="console-panel">
              <div className="console-title">Execution Output Console</div>
              <pre className="console-log">{consoleLogs}</pre>
            </div>

            {/* Submission Actions */}
            <div className="action-row">
              <button
                type="button"
                className="workspace-btn run-btn"
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
              >
                {isRunning ? 'Compiling...' : 'Run Code'}
              </button>
              <button
                type="button"
                className="workspace-btn submit-btn"
                onClick={handleSubmitCode}
                disabled={isRunning || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Code'}
              </button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

export default Arena;
