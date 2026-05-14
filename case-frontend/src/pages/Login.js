import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import api from "../services/api";
import { getDefaultRouteForRole, saveSession } from "../services/auth";

function Login() {
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/login", form);
      saveSession(res.data.token, res.data.user);
      navigate(getDefaultRouteForRole(res.data?.user?.role), { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid credentials");
    }
  };

  const isFocused = (f) => focusedField === f;

  /* ── Scales of Justice Stamp (Ghosted) ── */
  const JudicialStamp = () => (
    <div style={{
      position: "absolute", right: "-12%", bottom: "-8%",
      width: "480px", height: "480px", opacity: 0.03,
      pointerEvents: "none", zIndex: 0, transform: "rotate(-12deg)",
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="0.5">
        <path d="M12 3v18M5 7l7-2 7 2M5 7c0 4.5 2 7 7 7s7-2.5 7-7M5 7L3 9m16-2l2 2" />
        <path d="M7 14c0 3 2 5 5 5s5-2 5-5" />
      </svg>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;600&display=swap');
        
        body { font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; }
        
        @keyframes contentReveal {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowZoom {
          0%   { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes lightSweep {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes innerGlow {
          0% { box-shadow: inset 0 0 5px rgba(212,175,55,0); }
          100% { box-shadow: inset 0 0 12px rgba(212,175,55,0.15); }
        }

        .login-split { display: grid; grid-template-columns: 42fr 58fr; min-height: 100vh; background: #060914; }
        .glass-panel {
          backdrop-filter: blur(14px);
          background: rgba(10, 20, 50, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .input-container {
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .input-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: #5A6A7A; font-size: 1.1rem; transition: color 0.3s;
        }
        .modern-input {
          width: 100%; box-sizing: border-box;
          padding: 14px 16px 14px 48px; border-radius: 12px;
          background: rgba(5, 10, 25, 0.6);
          border: 1px solid rgba(136, 153, 170, 0.15);
          color: #E0E6ED; font-size: 0.95rem; outline: none;
          transition: all 0.3s;
        }
        .modern-input:focus {
          border-color: #D4AF37;
          background: rgba(5, 10, 25, 0.8);
          animation: innerGlow 1.5s infinite alternate;
        }
        .modern-input:focus + .input-icon { color: #D4AF37; }
        
        .gold-cta {
          width: 100%; padding: 16px; border-radius: 12px; border: none;
          background: linear-gradient(90deg, #c8a646, #f4d06f);
          color: #0B132B; font-weight: 700; font-family: 'Cinzel', serif;
          font-size: 1rem; cursor: pointer; letter-spacing: 0.08em;
          box-shadow: 0 0 25px rgba(212,175,55,0.25);
          transition: all 0.3s;
        }
        .gold-cta:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 35px rgba(212,175,55,0.45);
          filter: brightness(1.1);
        }
        
        @media (max-width: 1024px) {
          .login-split { grid-template-columns: 1fr; }
          .login-hero { display: none; }
        }
      `}</style>

      <div className="login-split">
        {/* ── Left: Hero Image ── */}
        <div className="login-hero" style={{ position: "relative", overflow: "hidden", borderRight: "1px solid rgba(212,175,55,0.1)" }}>
          <img src="/images/courthouse_pillars.png" alt="Courthouse" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.45, animation: "slowZoom 25s linear infinite alternate"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent, rgba(6,9,20,0.85))" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, rgba(212,175,55,0.05), transparent)", animation: "lightSweep 12s linear infinite" }} />
          
          <div style={{ position: "absolute", bottom: 60, left: 40, right: 40, animation: mounted ? "contentReveal 0.8s 0.2s ease both" : "none" }}>
            <p style={{ color: "#D4AF37", letterSpacing: "0.3em", fontSize: "0.75rem", textTransform: "uppercase", marginBottom: 12 }}>Authorized Personnel Only</p>
            <h2 style={{ fontFamily: "Cinzel", fontSize: "2.4rem", color: "#FFFFFF", margin: 0 }}>
              Welcome Back<br />to the Bench
            </h2>
            <div style={{ width: 60, height: 3, background: "#D4AF37", margin: "20px 0" }} />
            <p style={{ color: "#8899AA", fontSize: "1rem", lineHeight: 1.6, maxWidth: 420 }}>
              Access your secured case files and judicial dashboard through the National Unified Court Portal.
            </p>
          </div>
        </div>

        {/* ── Right: Form Panel ── */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <JudicialStamp />
          
          <div className="glass-panel" style={{ width: "100%", maxWidth: 440, animation: mounted ? "contentReveal 0.7s 0.1s ease both" : "none" }}>
            <header style={{ marginBottom: 36 }}>
               <h1 style={{ fontFamily: "Cinzel", color: "#FFF", fontSize: "1.8rem", margin: 0 }}>Secure Login</h1>
               <p style={{ color: "#6B7A8A", fontSize: "0.9rem", marginTop: 8 }}>Establish your credentials to enter the court network</p>
            </header>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
              <div className="input-container">
                <span className="input-icon">✉️</span>
                <input className="modern-input" type="email" placeholder="Email Address" value={form.email}
                  onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  onChange={e => setForm({...form, email: e.target.value})} />
              </div>

              <div className="input-container">
                <span className="input-icon">🔒</span>
                <input className="modern-input" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password}
                  onFocus={() => setFocusedField("pw")} onBlur={() => setFocusedField(null)}
                  onChange={e => setForm({...form, password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5A6A7A", cursor: "pointer", fontSize: "0.8rem" }}>
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#6B7A8A" }}>
                  <input type="checkbox" style={{ accentColor: "#D4AF37" }} /> Remember session
                </label>
                <span style={{ color: "#D4AF37", cursor: "pointer", fontWeight: 600 }}>Forgot Password?</span>
              </div>

              <button type="submit" className="gold-cta">Authenticate →</button>
            </form>

            <div style={{ margin: "32px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
              <span style={{ color: "#3A4A5A", fontSize: "0.8rem" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>

            <p style={{ textAlign: "center", color: "#5A6A7A", fontSize: "0.9rem" }}>
              New to the registry? <Link to="/signup" style={{ color: "#D4AF37", fontWeight: 600, textDecoration: "none" }}>Create an account</Link>
            </p>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", flexWrap: "wrap",
            padding: "12px 28px", gap: 8,
            borderTop: "1px solid rgba(212,175,55,0.06)",
            fontSize: "0.72rem", color: "#2A3A4A",
          }}>
            <span>© 2024 E-Court Management System</span>
            <div style={{ display: "flex", gap: 14 }}>
              <span>Privacy Policy</span><span>Terms</span><span>Help</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;