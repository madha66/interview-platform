import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import './homeLandingPage.css';

function HomeLandingPage() {
  const [hoveredPath, setHoveredPath] = useState(null);
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(null);
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('ca_active_session');
    const role = localStorage.getItem('ca_active_role');
    if (session && role) {
      setActiveSession(session);
      setActiveRole(role);
    }
  }, []);

  const handleLeaveSession = () => {
    localStorage.removeItem('ca_active_session');
    localStorage.removeItem('ca_active_role');
    localStorage.removeItem('ca_student_name');
    setActiveSession(null);
    setActiveRole(null);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e, pathId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToSection(pathId);
    }
  };

  return (
    <div className="codearena-page-wrapper">
      {/* Navigation Bar */}
      <nav className="ca-navbar" aria-label="Main Navigation">
        <a href="#" className="ca-logo" aria-label="CodeArena Home">
          <span className="ca-logo-dot" aria-hidden="true"></span>
          <span>Dockers</span>
        </a>
        <div className="ca-nav-links">
          <a href="#how-it-works" className="ca-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>
            How It Works
          </a>
          <a href="#paths" className="ca-nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('paths'); }}>
            Products
          </a>
          <a href="#" className="ca-nav-link">
            Docs
          </a>
        </div>
        <Link to="/" className="ca-nav-btn">
          logout &rarr;
        </Link>
      </nav>

      {/* Main Content Area */}
      <main className="ca-main-content">

        {/* Active Session Banner */}
        {activeSession && (
          <div className="ca-active-session-banner">
            <div className="ca-active-session-info">
              <span className="ca-active-pulse"></span>
              <span>
                <strong>Active Session:</strong> <code className="ca-active-code">{activeSession}</code> ({activeRole === 'instructor' ? 'Instructor Dashboard' : 'Student Workspace'})
              </span>
            </div>
            <div className="ca-active-session-actions">
              <Link to="/arena" className="ca-active-resume-btn">
                Resume Session &rarr;
              </Link>
              <button onClick={handleLeaveSession} className="ca-active-leave-btn">
                Leave
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="ca-hero" aria-label="Introduction">
          <div className="ca-hero-left">
            <span className="ca-eyebrow">one account, two branches</span>
            <h1 className="ca-headline">
              One login. <br />
              Two paths into the <span className="ca-text-teal">work</span> &mdash; or the <span className="ca-text-violet">craft</span>.
            </h1>
            <p className="ca-subcopy">
              A single platform hosting two environments. Practice mock proctored technical interviews in the Arena, or write and follow DSA codebases live in the Academy.
            </p>
            <div className="ca-hero-ctas">
              <button
                onClick={() => scrollToSection('arena-card')}
                className="ca-btn ca-btn-teal"
                aria-label="Enter the Arena product card"
              >
                Enter the Arena
              </button>
              <button
                onClick={() => scrollToSection('academy-card')}
                className="ca-btn ca-btn-ghost"
                aria-label="Join an Academy session card"
              >
                Join a Session
              </button>
            </div>
          </div>

          <div className="ca-hero-right">
            {/* SVG Git-Branch Diagram */}
            <svg
              className="ca-git-svg"
              viewBox="0 0 320 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Git-branch path selector diagram"
              role="img"
            >
              <desc>A git diagram showing a trunk split into two branches: one leading to Arena, the other to Academy.</desc>

              {/* Trunk line: drops from (160, 40) down to (160, 145) */}
              <path
                d="M160 40 L160 145"
                className="ca-git-line trunk-line"
              />

              {/* Left Branch (Teal, Arena) */}
              <path
                d="M160 145 C160 200, 60 200, 60 280"
                className={`ca-git-line teal-branch ${hoveredPath === 'arena' ? 'highlighted' : ''}`}
              />

              {/* Right Branch (Violet, Academy) */}
              <path
                d="M160 145 C160 200, 260 200, 260 280"
                className={`ca-git-line violet-branch ${hoveredPath === 'academy' ? 'highlighted' : ''}`}
              />

              {/* Commit Nodes */}
              {/* 1. "You Sign In" Node */}
              <g className="ca-node-group node-signin">
                <circle cx="160" cy="40" r="7" />
                <text x="175" y="44" textAnchor="start">you sign in</text>
              </g>

              {/* 2. "Choose a Path" Node */}
              <g className="ca-node-group node-choose">
                <circle cx="160" cy="145" r="7" />
                <text x="175" y="149" textAnchor="start">choose a path</text>
              </g>

              {/* 3. "Arena" Node */}
              <g
                className={`ca-node-group node-arena ${hoveredPath === 'arena' ? 'highlighted' : ''}`}
                onMouseEnter={() => setHoveredPath('arena')}
                onMouseLeave={() => setHoveredPath(null)}
                onClick={() => navigate('/arena')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/arena');
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Arena path. Activation redirects to the Arena dashboard."
              >
                <circle cx="60" cy="280" r="7" />
                <text x="60" y="305" textAnchor="middle">arena</text>
              </g>

              {/* 4. "Academy" Node */}
              <g
                className={`ca-node-group node-academy ${hoveredPath === 'academy' ? 'highlighted' : ''}`}
                onMouseEnter={() => setHoveredPath('academy')}
                onMouseLeave={() => setHoveredPath(null)}
                onClick={() => scrollToSection('academy-card')}
                onKeyDown={(e) => handleKeyPress(e, 'academy-card')}
                tabIndex={0}
                role="button"
                aria-label="Academy path. Activation scrolls down to Academy path details."
              >
                <circle cx="260" cy="280" r="7" />
                <text x="260" y="305" textAnchor="middle">academy</text>
              </g>
            </svg>
          </div>
        </section>

        {/* Path Cards Section */}
        <section id="paths" className="ca-cards-section" aria-label="Path selection detail cards">
          <div className="ca-cards-grid">

            {/* Arena Card */}
            <article
              id="arena-card"
              className={`ca-path-card ca-card-arena ${hoveredPath === 'arena' ? 'highlighted' : ''}`}
              onMouseEnter={() => setHoveredPath('arena')}
              onMouseLeave={() => setHoveredPath(null)}
            >
              <span className="ca-card-tag ca-tag-arena">interview arena</span>
              <h2 className="ca-card-title">Solve. Get watched. Get scored.</h2>
              <p className="ca-card-desc">
                Write code against test cases in our LeetCode-style editor. A small dual-camera window streams you and your interviewer side-by-side. Get structured feedback and performance grades instantly.
              </p>

              <ul className="ca-features-list">
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>timed problem sets</span>
                </li>
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>auto-graded on run</span>
                </li>
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>dual camera panel</span>
                </li>
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>score breakdown per test case</span>
                </li>
              </ul>

              <Link to="/arena" className="ca-btn ca-card-btn ca-card-btn-teal" aria-label="Enter the Arena">
                Enter the Arena &rarr;
              </Link>
            </article>

            {/* Academy Card */}
            <article
              id="academy-card"
              className={`ca-path-card ca-card-academy ${hoveredPath === 'academy' ? 'highlighted' : ''}`}
              onMouseEnter={() => setHoveredPath('academy')}
              onMouseLeave={() => setHoveredPath(null)}
            >
              <span className="ca-card-tag ca-tag-academy">dsa academy</span>
              <h2 className="ca-card-title">Learn it live, in the same file.</h2>
              <p className="ca-card-desc">
                Follow your instructor's cursor and code stream in real time. Work alongside them in your own dedicated sandbox. Focus on concepts together without proctoring constraints or video lag.
              </p>

              <ul className="ca-features-list">
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>instructor cursor streamed live</span>
                </li>
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>student codes in own pane</span>
                </li>
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>sessions save for replay</span>
                </li>
                <li className="ca-feature-item">
                  <span className="ca-arrow-bullet" aria-hidden="true">&rarr;</span>
                  <span>concept-first, no proctoring pressure</span>
                </li>
              </ul>

              <a href="#" className="ca-btn ca-card-btn ca-card-btn-violet" aria-label="Join a Session">
                Join a Session &rarr;
              </a>
            </article>

          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="ca-how-section" aria-label="Onboarding process flow">
          <h2 className="ca-section-title">Onboarding Flow</h2>
          <div className="ca-steps-grid">

            <div className="ca-step-card">
              <div className="ca-step-number">01</div>
              <h3 className="ca-step-title">Sign in</h3>
              <p className="ca-step-desc">Authenticate with a single unified account credentials set.</p>
            </div>

            <div className="ca-step-card">
              <div className="ca-step-number">02</div>
              <h3 className="ca-step-title">Pick a path</h3>
              <p className="ca-step-desc">Choose between the proctored interview arena or the active academy classroom.</p>
            </div>

            <div className="ca-step-card">
              <div className="ca-step-number">03</div>
              <h3 className="ca-step-title">Camera check</h3>
              <p className="ca-step-desc">Verify microphone, camera permissions, and video framing coordinates.</p>
            </div>

            <div className="ca-step-card">
              <div className="ca-step-number">04</div>
              <h3 className="ca-step-title">You're in</h3>
              <p className="ca-step-desc">The web editor loads and your active session begins immediately.</p>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="ca-footer" aria-label="Footer Context">
        <div className="ca-footer-inner">
          <div>&copy; 2026 CodeArena. All branches merged.</div>
          <div className="ca-footer-links">
            <a href="#" className="ca-footer-link">Privacy</a>
            <a href="#" className="ca-footer-link">Terms</a>
            <a href="#" className="ca-footer-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomeLandingPage;
