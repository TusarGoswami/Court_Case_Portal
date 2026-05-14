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

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    role: "public_user",
    terms_accepted: false,
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

/* ── Judicial Seal SVG (ghosted watermark) ── */
const JudicialSeal = () => (
  <svg viewBox="0 0 200 200" style={{
    position: "absolute", right: "-5%", top: "12%",
    width: "clamp(280px, 40vw, 420px)", height: "auto",
    opacity: 0.025, pointerEvents: "none",
  }}>
    <circle cx="100" cy="100" r="90" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
    <circle cx="100" cy="100" r="82" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
    <circle cx="100" cy="100" r="75" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
    <line x1="100" y1="50" x2="100" y2="120" stroke="#D4AF37" strokeWidth="1.2" />
    <line x1="70" y1="70" x2="130" y2="70" stroke="#D4AF37" strokeWidth="1.2" />
    <path d="M70,70 L60,95 L80,95 Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
    <path d="M130,70 L120,95 L140,95 Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
    <line x1="85" y1="120" x2="115" y2="120" stroke="#D4AF37" strokeWidth="1.2" />
    <line x1="80" y1="126" x2="120" y2="126" stroke="#D4AF37" strokeWidth="1" />
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
      <line key={a}
        x1={100 + 86 * Math.cos(a * Math.PI / 180)}
        y1={100 + 86 * Math.sin(a * Math.PI / 180)}
        x2={100 + 90 * Math.cos(a * Math.PI / 180)}
        y2={100 + 90 * Math.sin(a * Math.PI / 180)}
        stroke="#D4AF37" strokeWidth="1"
      />
    ))}
    <text x="100" y="155" textAnchor="middle" fill="#D4AF37" fontSize="6.5"
      fontFamily="'Cinzel', serif" letterSpacing="0.15em">E-COURT</text>
    <text x="100" y="164" textAnchor="middle" fill="#D4AF37" fontSize="4"
      fontFamily="'Inter', sans-serif" letterSpacing="0.1em">MANAGEMENT SYSTEM</text>
  </svg>
);

  return (
    <>
      <style>{`
        @keyframes contentReveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fieldReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowZoom {
          0%   { transform: scale(1); }
          100% { transform: scale(1.12); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50%      { transform: translateY(-40px) translateX(12px); opacity: 0.6; }
        }
        @keyframes lightSweep {
          0%   { transform: translateX(-100%) rotate(15deg); }
          100% { transform: translateX(200%) rotate(15deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gavelStrike {
          0%   { transform: rotate(-40deg) scale(0.8); opacity: 0.5; }
          55%  { transform: rotate(8deg) scale(1.05); opacity: 1; }
          75%  { transform: rotate(-3deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); opacity: 1; }
        }
        .signup-split { display: grid; grid-template-columns: 45fr 55fr; min-height: 100vh; }
        .cinematic-input {
           padding: 12px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
           color: #fff; background: rgba(0,0,0,0.4); outline: none; transition: border-color 0.3s;
        }
        .cinematic-input:focus { border-color: #D4AF37; }
        .cinematic-btn {
           padding: 14px; background: #D4AF37; border: none; color: #080B1A; font-weight: 700;
           letter-spacing: 0.1em; cursor: pointer; transition: opacity 0.3s;
        }
        .cinematic-btn:hover { opacity: 0.9; }
        @media (max-width: 900px) {
          .signup-split { grid-template-columns: 1fr; }
          .signup-hero-panel { display: none; }
        }
      `}</style>

      {/* ── Gavel Splash ── */}
      {showSplash && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#080B1A",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transition: "opacity 0.6s ease",
          opacity: splashFading ? 0 : 1,
        }}>
          <div style={{
            fontSize: "4.5rem",
            transformOrigin: "bottom center",
            animation: "gavelStrike 0.7s ease-out forwards",
          }}>⚖️</div>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1.5rem",
            color: "#D4AF37",
            letterSpacing: "0.35em",
            marginTop: "24px",
            opacity: 0,
            animation: "fadeInUp 0.8s ease forwards 0.4s",
          }}>JUDICIAL REGISTRY</div>
        </div>
      )}

      <div className="signup-split" style={{ background: "#080B1A", overflow: "hidden" }}>
        {/* ── Left Hero Panel ── */}
        <div className="signup-hero-panel" style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, #0A1525 0%, #050810 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRight: "1px solid rgba(212,175,55,0.1)",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=2070')",
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: 0.15, mixBlendMode: "overlay",
            animation: "slowZoom 20s linear infinite alternate",
          }} />
          
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, transparent 0%, rgba(8,11,26,0.8) 100%)",
          }} />

          {/* Ambient Particles */}
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: Math.random() * 3 + 1, height: Math.random() * 3 + 1,
              background: "#D4AF37", borderRadius: "50%",
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              opacity: 0.4,
              animation: `floatParticle ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }} />
          ))}

          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "40px 32px",
            animation: mounted ? "contentReveal 0.8s 0.3s ease both" : "none",
            zIndex: 3,
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
              color: "#D4AF37",
              lineHeight: 1.3,
              marginBottom: 12,
              letterSpacing: "0.04em",
            }}>
              Justice Must Remain<br />Fearless & Transparent
            </div>
            <div style={{
              width: 48, height: 2,
              background: "linear-gradient(90deg, #D4AF37, transparent)",
              marginBottom: 14,
            }} />
            <p style={{ color: "#8899AA", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
              Join India's premier digital court management platform. Secure, efficient, and accessible justice — anytime, anywhere.
            </p>

            {/* Trust indicators */}
            <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
              {[
                { icon: "🔒", label: "AES-256\nEncryption" },
                { icon: "⚡", label: "24/7\nAccess" },
                { icon: "📜", label: "Paperless\nProcess" },
              ].map((t) => (
                <div key={t.label} style={{
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: "1.2rem" }}>{t.icon}</span>
                  <span style={{
                    fontSize: "0.72rem", color: "#6B7A8A",
                    whiteSpace: "pre-line", lineHeight: 1.3,
                  }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Form Panel (55%) ── */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "linear-gradient(170deg, #0F1A35 0%, #0B132B 100%)",
        }}>
          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 28px",
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            fontSize: "0.76rem", color: "#5A6A7A",
          }}>
            <span>support@ecourt.gov.in</span>
            <span style={{
              fontFamily: "'Cinzel', serif", color: "#D4AF37",
              fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.1em",
            }}>E-COURT</span>
          </div>

          {/* Scrollable form area */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "clamp(24px, 4vw, 40px) clamp(24px, 5vw, 56px)",
            animation: mounted ? "contentReveal 0.7s 0.2s ease both" : "none",
          }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)",
              color: "#FFFFFF", margin: "0 0 4px", fontWeight: 700,
            }}>Establish Credentials</h1>
            <p style={{ color: "#6B7A8A", fontSize: "0.88rem", margin: "0 0 28px" }}>
              Create your secure account to access court services
            </p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              {/* Row: Name + Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Full name</label>
                  <input style={inp(isFocused("name"))} placeholder="Enter full name"
                    value={form.name}
                    onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Email address</label>
                  <input type="email" style={inp(isFocused("email"))} placeholder="Enter email"
                    value={form.email}
                    onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>

              {/* Row: Phone + Role */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Mobile number</label>
                  <input style={inp(isFocused("phone"))} placeholder="Enter mobile number"
                    value={form.phone}
                    onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Role</label>
                  <select style={inp(isFocused("role"))}
                    value={form.role}
                    onFocus={() => setFocusedField("role")} onBlur={() => setFocusedField(null)}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="public_user">Public User</option>
                    <option value="lawyer">Lawyer</option>
                    <option value="clerk">Clerk</option>
                    <option value="judge">Judge</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Row: Password + Confirm */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={lbl}>Password</label>
                  <input type="password" style={inp(isFocused("pw"))} placeholder="Create password"
                    value={form.password}
                    onFocus={() => setFocusedField("pw")} onBlur={() => setFocusedField(null)}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div>
                  <label style={lbl}>Confirm password</label>
                  <input type="password" style={inp(isFocused("cpw"))} placeholder="Confirm password"
                    value={form.password_confirmation}
                    onFocus={() => setFocusedField("cpw")} onBlur={() => setFocusedField(null)}
                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                </div>
              </div>

              <label style={{
                display: "flex", alignItems: "center", gap: 10,
                color: "#6B7A8A", fontSize: "0.82rem", marginTop: 4,
              }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: "#D4AF37" }}
                  checked={form.terms_accepted}
                  onChange={(e) => setForm({ ...form, terms_accepted: e.target.checked })} />
                I agree to the Terms &amp; Conditions and Privacy Policy
              </label>

              <button type="submit" style={btnGold}
                onMouseEnter={(e) => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 32px rgba(212,175,55,0.35)"; }}
                onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 20px rgba(212,175,55,0.2)"; }}>
                Create Account
              </button>
            </form>

            <p style={{ textAlign: "center", color: "#5A6A7A", fontSize: "0.86rem", marginTop: 20 }}>
              Already have an account?{" "}
              <Link to="/" style={{ color: "#D4AF37", fontWeight: 600, textDecoration: "none" }}>Login</Link>
            </p>

            {/* Bottom security badge */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 24, marginTop: 28,
              paddingTop: 20, borderTop: "1px solid rgba(212,175,55,0.08)",
            }}>
              {["🔒 Secure Platform", "⚡ Time Saving", "✨ Easy to Use"].map((t) => (
                <span key={t} style={{ color: "#4A5A6A", fontSize: "0.74rem", fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared micro-styles ── */
const lbl = {
  display: "block", fontSize: "0.78rem", fontWeight: 600,
  color: "#7A8A9A", letterSpacing: "0.04em", marginBottom: 5,
};

const inp = (focused) => ({
  width: "100%", boxSizing: "border-box",
  padding: "11px 14px", borderRadius: 10,
  background: "rgba(11,19,43,0.55)",
  border: focused ? "1px solid #D4AF37" : "1px solid rgba(136,153,170,0.18)",
  boxShadow: focused ? "0 0 0 3px rgba(212,175,55,0.1)" : "none",
  color: "#E0E6ED", fontSize: "0.88rem", outline: "none",
  transition: "border-color 0.3s, box-shadow 0.3s",
});

const btnGold = {
  width: "100%", padding: "13px 20px", borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #D4AF37, #B8962E)",
  color: "#0B132B", fontWeight: 700, fontSize: "0.95rem",
  fontFamily: "'Cinzel', serif", cursor: "pointer",
  letterSpacing: "0.06em",
  boxShadow: "0 4px 20px rgba(212,175,55,0.2)",
  transition: "transform 0.2s, box-shadow 0.3s",
};

export default Signup;