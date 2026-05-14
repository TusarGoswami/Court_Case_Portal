import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import api from "../services/api";
import { getDefaultRouteForRole, saveSession } from "../services/auth";

function Signup() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", password_confirmation: "",
    role: "public_user", terms_accepted: false,
  });

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1600);
    const t2 = setTimeout(() => setShowSplash(false), 2200);
    const t3 = setTimeout(() => setMounted(true), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/register", form);
      saveSession(res.data.token, res.data.user);
      navigate(getDefaultRouteForRole(res.data?.user?.role), { replace: true });
    } catch (err) {
      const validationErrors = err?.response?.data?.errors;
      const firstError = validationErrors ? Object.values(validationErrors)[0]?.[0] : null;
      alert(firstError || err?.response?.data?.message || "Error while registering");
    }
  };

  const isFocused = (f) => focusedField === f;

  /* ── Scales of Justice Stamp (Ghosted) ── */
  const JudicialStamp = () => (
    <div style={{
      position: "absolute", right: "-10%", bottom: "-5%",
      width: "500px", height: "500px", opacity: 0.03,
      pointerEvents: "none", zIndex: 0, transform: "rotate(-15deg)",
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
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50%      { transform: translateY(-60px) translateX(15px); opacity: 0.6; }
        }
        @keyframes lightSweep {
          0%   { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes innerGlow {
          0% { box-shadow: inset 0 0 5px rgba(212,175,55,0); }
          100% { box-shadow: inset 0 0 12px rgba(212,175,55,0.15); }
        }
        @keyframes gavelStrike {
          0%   { transform: rotate(-45deg) scale(0.8); opacity: 0; }
          100% { transform: rotate(0) scale(1); opacity: 1; }
        }

        .signup-split { display: grid; grid-template-columns: 42fr 58fr; min-height: 100vh; background: #060914; }
        .glass-panel {
          backdrop-filter: blur(14px);
          background: rgba(10, 20, 50, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
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
          .signup-split { grid-template-columns: 1fr; }
          .signup-hero { display: none; }
        }
      `}</style>

      {/* ── Splash ── */}
      {showSplash && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "#060914",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: splashFading ? 0 : 1, transition: "opacity 0.6s",
        }}>
          <div style={{ fontSize: "5rem", animation: "gavelStrike 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>⚖️</div>
          <div style={{ fontFamily: "Cinzel", color: "#D4AF37", letterSpacing: "0.4em", marginTop: 20 }}>ESTABLISHING JUSTICE</div>
        </div>
      )}

      <div className="signup-split">
        {/* ── Left: Cinematic Hero ── */}
        <div className="signup-hero" style={{ position: "relative", overflow: "hidden", borderRight: "1px solid rgba(212,175,55,0.1)" }}>
          <img src="/images/lady_justice_hero.png" alt="Justice" style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.45, animation: "slowZoom 25s linear infinite alternate"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent, rgba(6,9,20,0.8))" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent, rgba(212,175,55,0.05), transparent)", animation: "lightSweep 10s linear infinite" }} />
          
          <div style={{ position: "absolute", bottom: 60, left: 40, right: 40, animation: mounted ? "contentReveal 0.8s 0.3s ease both" : "none" }}>
            <h2 style={{ fontFamily: "Cinzel", fontSize: "2.4rem", color: "#D4AF37", margin: 0, textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
              Justice Must Remain<br />Fearless & Transparent
            </h2>
            <div style={{ width: 60, height: 3, background: "#D4AF37", margin: "20px 0" }} />
            <p style={{ color: "#8899AA", fontSize: "1rem", lineHeight: 1.6, maxWidth: 450 }}>
              Join the National Judicial Registry. A unified digital sanctuary for legal transparency and expedited court proceedings.
            </p>
          </div>
        </div>

        {/* ── Right: Form Panel ── */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <JudicialStamp />
          
          <div className="glass-panel" style={{ width: "100%", maxWidth: 540, animation: mounted ? "contentReveal 0.7s 0.2s ease both" : "none" }}>
            <header style={{ marginBottom: 32 }}>
               <h1 style={{ fontFamily: "Cinzel", color: "#FFF", fontSize: "1.8rem", margin: 0 }}>Create Account</h1>
               <p style={{ color: "#6B7A8A", fontSize: "0.9rem", marginTop: 8 }}>Register your digital presence in the Supreme Court Ecosystem</p>
            </header>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div className="input-container">
                  <span className="input-icon">👤</span>
                  <input className="modern-input" placeholder="Full Name" value={form.name}
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                    onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="input-container">
                  <span className="input-icon">✉️</span>
                  <input className="modern-input" type="email" placeholder="Email" value={form.email}
                    onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                    onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
                <div className="input-container">
                  <span className="input-icon">📱</span>
                  <input className="modern-input" placeholder="Phone" value={form.phone}
                    onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                    onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="input-container">
                  <span className="input-icon">🏛️</span>
                  <select className="modern-input" value={form.role}
                    onFocus={() => setFocusedField("role")} onBlur={() => setFocusedField(null)}
                    onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="public_user">Public Citizen</option>
                    <option value="lawyer">Advocate / Lawyer</option>
                    <option value="clerk">Court Clerk</option>
                    <option value="judge">Judicial Officer</option>
                  </select>
                </div>
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

              <div className="input-container">
                <span className="input-icon">🛡️</span>
                <input className="modern-input" type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={form.password_confirmation}
                  onFocus={() => setFocusedField("cpw")} onBlur={() => setFocusedField(null)}
                  onChange={e => setForm({...form, password_confirmation: e.target.value})} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, color: "#6B7A8A", fontSize: "0.85rem" }}>
                <input type="checkbox" checked={form.terms_accepted} onChange={e => setForm({...form, terms_accepted: e.target.checked})}
                  style={{ accentColor: "#D4AF37", width: 16, height: 16 }} />
                I accept the Digital Judiciary Terms & Conditions
              </label>

              <button type="submit" className="gold-cta">Register Securely</button>
            </form>

            <p style={{ textAlign: "center", color: "#5A6A7A", fontSize: "0.9rem", marginTop: 24 }}>
              Already part of the bench? <Link to="/" style={{ color: "#D4AF37", fontWeight: 600, textDecoration: "none" }}>Log in here</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;