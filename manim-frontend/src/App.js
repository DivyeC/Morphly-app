import React, { useState, useEffect } from "react";
import "./App.css";
import { ScrambleText } from "./ScrambleText";
import { useMouseGlow } from "./useMouseGlow";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const EXAMPLE_PROMPT = "Show a sine wave morphing into a cosine wave";

const STEPS = [
  "Sending prompt to LLM…",
  "Generating Manim code…",
  "Triggering GitHub Actions…",
  "Rendering animation frames…",
  "Encoding video…",
  "Uploading to GitHub Pages…",
  "Almost there…",
];

function App() {
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const glowRef = useMouseGlow();
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

useEffect(() => {
  if (glowRef.current) {
    glowRef.current.style.opacity = "1";
  }
}, [glowRef]);

  useEffect(() => {
    if (status !== "running") return;
    const labelInterval = setInterval(() => {
      setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
    }, 12000);
    return () => clearInterval(labelInterval);
  }, [status]);

  useEffect(() => {
    if (status !== "running") return;
    setProgress(0);
    const tick = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        const increment = prev < 40 ? 2 : prev < 70 ? 1 : 0.3;
        return Math.min(prev + increment, 90);
      });
    }, 800);
    return () => clearInterval(tick);
  }, [status]);

  const startPolling = () => {
    let attempts = 0;
    const id = setInterval(() => {
      attempts++;
      console.log("Polling attempt:", attempts);
      if (attempts > 20) {
        clearInterval(id);
        setStatus("done");
        setProgress(100);
        const url = `https://divyec.github.io/Morphly/videos/latest.mp4?ts=${Date.now()}`;
        setVideoUrl(url);
      }
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setVideoUrl("");
    setStatus("running");
    setJobId(null);
    setStepIndex(0);
    setProgress(0);

    try {
      const res = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error("Failed to start generation");

      const data = await res.json();
      if (!data.jobId) throw new Error("No jobId returned from server");

      setJobId(data.jobId);
      startPolling(data.jobId);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Unknown error");
    }
  };

  const handleExamplePrompt = () => {
    setPrompt(EXAMPLE_PROMPT);
  };

  return (
    <div className="app-root">
      <div
        style={{
          position: "fixed",
          top: cursorPos.y,
          left: cursorPos.x,
          width: "450px",
          height: "450px",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          background: "radial-gradient(circle, orange 0%, transparent 40%)",
          filter: "blur(140px)",
        }}
      />
      <div ref={glowRef} className="cursor-glow" />

      {/* Animated Background Shapes */}
      <div className="background-shapes">
        <div className="shape shape-1 shape-square" />
        <div className="shape shape-2 shape-circle" />
        <div className="shape shape-3 shape-triangle" />
        <div className="shape shape-4 shape-square" />
        <div className="shape shape-5 shape-circle" />
        <div className="shape shape-6 shape-triangle" />
        <div className="shape shape-7 shape-square" />
        <div className="shape shape-8 shape-circle" />
      </div>

      {/* Header Navigation */}
      <header className="app-header">
        <div className="header-container">
          <div className="header-brand">
            <span className="brand-logo">▶</span>
            <span className="brand-text">MORPHLY</span>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                const textarea = document.querySelector(".prompt-textarea");
                if (textarea) textarea.focus();
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          <span>
            <span style={{ color: "var(--accent)" }}>Morph</span> ideas into animation
          </span>
          <br />
          <ScrambleText isSequential={true}>effortlessly</ScrambleText>
        </h1>
        <p className="hero-subtitle">
          Visualizing ideas is hard, so we made it effortless.
        </p>
        <div className="hero-cta">
          <button
            className="btn-primary"
            onClick={() => {
              const textarea = document.querySelector(".prompt-textarea");
              if (textarea) textarea.focus();
            }}
          >
            Generate Now!
          </button>
        </div>
      </section>

      <main className="main-content">
        <h2 className="generator-title">Generate Your Animation</h2>
        <section className="generator-section">
          {/* Left Column - Input Form */}
          <div className="generator-form-column">
            <form onSubmit={handleSubmit} className="prompt-form">
              <div className="input-wrapper">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your animation here. E.g., Show a sine wave morphing into a cosine wave..."
                  rows={5}
                  required
                  className="prompt-textarea"
                />
                <button
                  type="submit"
                  disabled={!prompt || status === "running"}
                  className="submit-btn"
                >
                  {status === "running" ? "Generating..." : "Generate Now!"}
                </button>

                {/* Example Prompt Button */}
                <button
                  type="button"
                  className="example-btn"
                  onClick={handleExamplePrompt}
                  disabled={status === "running"}
                >
                  ✦ Try an example prompt
                </button>
              </div>

              {/* Status Messages */}
              {status === "running" && (
                <div className="status-container running">
                  <div className="loader-step-label">{STEPS[stepIndex]}</div>
                  <div className="loader-bar-track">
                    <div
                      className="loader-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="loader-percent">{Math.round(progress)}%</div>
                </div>
              )}

              {status === "done" && (
                <div className="status-container success">
                  <div className="status-message">
                    <span className="success-icon">✓</span>
                    <span>Animation ready!</span>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="status-container error">
                  <span className="error-icon">!</span>
                  <p className="error-text">{error}</p>
                </div>
              )}

              {jobId && (
                <div className="job-info">
                  <p>
                    Job ID: <code>{jobId}</code>
                  </p>
                </div>
              )}
            </form>
          </div>

          {/* Right Column - Preview */}
          <div className="generator-preview-column">
            <h2 className="preview-title">Your Animation</h2>
            {videoUrl ? (
              <video
                key={videoUrl}
                controls
                className="video-player"
                src={videoUrl}
              />
            ) : (
              <div className="preview-placeholder">
                <div className="placeholder-icon">▶</div>
                <p>Your animation will appear here</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="how-it-works-container">
          <h2 className="how-it-works-title">How It Works</h2>
          <p className="how-it-works-subtitle">
            Watch your ideas transform into stunning animations
          </p>

          <div className="flow-diagram">
            <div className="flow-step">
              <div className="step-icon">📝</div>
              <div className="step-label">Enter Prompt</div>
              <p className="step-description">
                Describe your animation idea in natural language
              </p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-icon">🤖</div>
              <div className="step-label">LLM Refines</div>
              <p className="step-description">
                AI converts your prompt into Manim code
              </p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-icon">⚙️</div>
              <div className="step-label">Execute Code</div>
              <p className="step-description">
                Python renders the animation frames
              </p>
            </div>
            <div className="flow-arrow">→</div>
            <div className="flow-step">
              <div className="step-icon">🎬</div>
              <div className="step-label">Get Video</div>
              <p className="step-description">
                Video extracted and hosted online
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="features-title">Powerful Features</h2>
          <p className="features-subtitle">
            Everything you need to bring your ideas to life
          </p>

          <div className="features-grid">
            <div className="feature-card" style={{ "--delay": "0s" }}>
              <div className="feature-icon">🤖</div>
              <div className="feature-label">Advanced AI</div>
              <p className="feature-text">
                We trained our AI to help you create animations faster and better than ever.
              </p>
            </div>
            <div className="feature-card" style={{ "--delay": "0.2s" }}>
              <div className="feature-icon">🎨</div>
              <div className="feature-label">Customize</div>
              <p className="feature-text">
                We made sure to leave a space for you to customize your animations.
              </p>
            </div>
            <div className="feature-card" style={{ "--delay": "0.4s" }}>
              <div className="feature-icon">🎬</div>
              <div className="feature-label">Slideshow</div>
              <p className="feature-text">
                No more boring powerpoints. Pitch something remarkable.
              </p>
            </div>
            <div className="feature-card" style={{ "--delay": "0.6s" }}>
              <div className="feature-icon">⚡</div>
              <div className="feature-label">Versatile</div>
              <p className="feature-text">
                Run physics simulations, draw chemical structures, and so much more.
              </p>
            </div>
            <div className="feature-card" style={{ "--delay": "0.8s" }}>
              <div className="feature-icon">✨</div>
              <div className="feature-label">Proven Style</div>
              <p className="feature-text">
                Built on an animation framework that people love.
              </p>
            </div>
            <div className="feature-card" style={{ "--delay": "1s" }}>
              <div className="feature-icon">👥</div>
              <div className="feature-label">Community</div>
              <p className="feature-text">View and share content, right here.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        <p>
          Built with <span>React</span> • <span>Manim</span> • <span>AI</span>
        </p>
      </footer>
    </div>
  );
}

export default App;