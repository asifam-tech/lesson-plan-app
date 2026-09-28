
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <a href="#home" className="landing-brand" onClick={closeMenu}>
            <span className="landing-brand-mark">📘</span> Lesson Plan System
          </a>

          <button
            className="landing-nav-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`landing-nav-links${menuOpen ? ' open' : ''}`}>
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <Link to="/login" className="landing-btn landing-btn-ghost" onClick={closeMenu}>Sign In</Link>
            <Link to="/register" className="landing-btn landing-btn-solid" onClick={closeMenu}>Get Started</Link>
          </nav>
        </div>
      </header>

       <main>
      /*  <section id="home" className="landing-hero"> 
          <div className="landing-hero-content">
            <span className="landing-eyebrow">AI-assisted · Role-based · Built for schools</span>
            <h1>Plan, review, and approve lesson plans in one place</h1>
            <p>
              A streamlined workflow for Teachers, Department Heads, and Directors — with
              AI-assisted drafting guided by your school's own curriculum.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="landing-btn landing-btn-solid landing-btn-lg">Get Started Free</Link>
              <Link to="/login" className="landing-btn landing-btn-ghost landing-btn-lg">Sign In</Link>
            </div>
          </div>
          <div className="landing-hero-art" aria-hidden="true">
            <div className="landing-hero-card landing-hero-card-1">📝 Draft with AI</div>
            <div className="landing-hero-card landing-hero-card-2">✅ Department Review</div>
            <div className="landing-hero-card landing-hero-card-3">🎓 Director Approval</div>
          </div>
        </section>

        <section id="about" className="landing-section">
          <h2>About the system</h2>
          <p className="landing-section-lead">
            The Lesson Plan Approval System helps schools move lesson planning off scattered
            documents and into one clear pipeline — from first draft to final sign-off.
          </p>
          <div className="landing-about-grid">
            <div>
              <h3>For Teachers</h3>
              <p>Draft lesson plans quickly, optionally guided by AI and your department's curriculum, then submit for review.</p>
            </div>
            <div>
              <h3>For Department Heads</h3>
              <p>Review incoming plans from your department, approve or send feedback, and track outcomes in one queue.</p>
            </div>
            <div>
              <h3>For Directors</h3>
              <p>Give final sign-off on department-approved plans and see reporting across the whole school.</p>
            </div>
          </div>
        </section> 

        <section id="features" className="landing-section landing-section-alt">
          <h2>Features</h2>
          <div className="landing-feature-grid">
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🤖</span>
              <h3>AI-assisted drafting</h3>
              <p>Generate a first draft from a short brief, aligned to curriculum when available.</p>
            </div>
            <div className="landing-feature-card">
              <span className="landing-feature-icon">📚</span>
              <h3>Curriculum library</h3>
              <p>Upload and manage syllabus documents so AI drafts stay aligned to what's taught.</p>
            </div>
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🔄</span>
              <h3>Clear approval workflow</h3>
              <p>Every plan moves through a transparent Teacher → Department Head → Director pipeline.</p>
            </div>
            <div className="landing-feature-card">
              <span className="landing-feature-icon">🔔</span>
              <h3>Status &amp; notifications</h3>
              <p>Teachers are notified the moment a plan is approved or sent back with feedback.</p>
            </div>
          </div>
        </section>

        <section id="contact" className="landing-cta">
          <h2>Ready to streamline lesson planning?</h2>
          <p>Create an account to get started, or sign in if you already have one.</p>
          <div className="landing-hero-actions">
            <Link to="/register" className="landing-btn landing-btn-solid landing-btn-lg">Create an Account</Link>
            <Link to="/login" className="landing-btn landing-btn-ghost landing-btn-lg">Sign In</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} Lesson Plan Approval System. All rights reserved.</p>
      </footer>
    </div>
    );
  }
