import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import api from "../services/api";
import { getDefaultRouteForRole, saveSession } from "../services/auth";

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
    {/* Scales of justice */}
    <line x1="100" y1="50" x2="100" y2="120" stroke="#D4AF37" strokeWidth="1.2" />
    <line x1="70" y1="70" x2="130" y2="70" stroke="#D4AF37" strokeWidth="1.2" />
    <path d="M70,70 L60,95 L80,95 Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
    <path d="M130,70 L120,95 L140,95 Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
    {/* Base */}
    <line x1="85" y1="120" x2="115" y2="120" stroke="#D4AF37" strokeWidth="1.2" />
    <line x1="80" y1="126" x2="120" y2="126" stroke="#D4AF37" strokeWidth="1" />
    {/* Decorative marks */}
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

/* ── Mail & Lock SVG Icons ── */
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.6 }}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22,4 L12,13 L2,4" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.6 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7,11 V7 a5,5 0 0 1 10,0 v4" />
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
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
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.2; }
          50%      { transform: translateY(-35px) translateX(8px); opacity: 0.55; }
        }
        @keyframes lightSweep {
          0%   { transform: translateX(-100%) rotate(15deg); }
          100% { transform: translateX(250%) rotate(15deg); }
        }
        @keyframes diagonalRay {
          0%   { opacity: 0.015; transform: translateX(-30%) rotate(-35deg); }
          50%  { opacity: 0.03; }
          100% { opacity: 0.015; transform: translateX(30%) rotate(-35deg); }
        }
        @keyframes drawLine {
          from { width: 0; }
          to   { width: 52px; }
        }
        @keyframes btnShimmer {
          0%   { left: -40%; }
          100% { left: 140%; }
        }
        @keyframes focusPulse {
          0%   { box-shadow: 0 0 0 0px rgba(212,175,55,0.25); }
          50%  { box-shadow: 0 0 0 5px rgba(212,175,55,0.08); }
          100% { box-shadow: 0 0 0 3px rgba(212,175,55,0.1); }
        }
        .login-split {
          display: grid;
          grid-template-columns: 40fr 60fr;
          min-height: 100vh;
        }
        @media (min-width: 901px) and (max-width: 1100px) {
          .login-split { grid-template-columns: 30fr 70fr; }
        }
        @media (max-width: 900px) {
          .login-split { grid-template-columns: 1fr; }
          .login-hero-full { display: none !important; }
          .login-mobile-hero { display: block !important; }
        }
        @media (min-width: 901px) {
          .login-mobile-hero { display: none !important; }
        }
      `}</style>

      <div className="login-split" style={{
        fontFamily: "'Inter', sans-serif",
        background: "#0B132B",
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.45s ease",
      }}>

        {/* ══════════════════════════════════════════════
            LEFT: Hero Image Panel (40%)
        ══════════════════════════════════════════════ */}
        <div className="login-hero-full" style={{
          position: "relative", overflow: "hidden", background: "#060C1E",
        }}>
          {/* Base image with zoom */}
          <img src="/images/courthouse_pillars.png" alt="Grand Courthouse"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 30%",
              animation: "slowZoom 25s ease-in-out infinite alternate",
              filter: "blur(0.4px)",
            }}
          />

          {/* Layer 1: Base gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(11,19,43,0.2) 0%, rgba(11,19,43,0.55) 50%, rgba(11,19,43,0.94) 100%)",
          }} />

          {/* Layer 2: Vignette */}
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(6,12,30,0.5) 100%)",
          }} />

          {/* Layer 3: Subtle gold color tint */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(212,175,55,0.025)",
          }} />

          {/* Light sweep */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{
              position: "absolute", top: 0, left: 0,
              width: "30%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.035), transparent)",
              animation: "lightSweep 10s ease-in-out infinite",
            }} />
          </div>

          {/* Diagonal light ray */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            <div style={{
              position: "absolute", top: "-20%", right: "-10%",
              width: "50%", height: "140%",
              background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.015), transparent)",
              animation: "diagonalRay 12s ease-in-out infinite alternate",
            }} />
          </div>

          {/* Particles — varied sizes + blur for depth */}
          {[
            { x: 18, y: 25, s: 2, d: 5, delay: 0 },
            { x: 55, y: 40, s: 4, d: 6, delay: 1.2, blur: 1 },
            { x: 78, y: 20, s: 3, d: 4.5, delay: 0.6 },
          ].map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              width: p.s, height: p.s, borderRadius: "50%",
              background: "rgba(212,175,55,0.5)",
              left: `${p.x}%`, top: `${p.y}%`,
              filter: p.blur ? `blur(${p.blur}px)` : "none",
              animation: `floatParticle ${p.d}s ease-in-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }} />
          ))}

          {/* Gold edge glow (right border light leak) */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 40,
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.035))",
            pointerEvents: "none",
          }} />

          {/* Bottom content */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "44px 28px",
            animation: mounted ? "contentReveal 0.8s 0.25s ease both" : "none",
          }}>
            <p style={{
              fontSize: "0.7rem", letterSpacing: "0.25em", color: "#D4AF37",
              textTransform: "uppercase", margin: "0 0 10px", opacity: 0.8,
            }}>Authorized Access Portal</p>

            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.2rem, 2.2vw, 1.75rem)",
              color: "#FFFFFF", lineHeight: 1.3,
              marginBottom: 12, letterSpacing: "0.02em",
            }}>
              Welcome Back<br />to the Bench
            </div>

            {/* Animated divider line */}
            <div style={{
              height: 2, background: "linear-gradient(90deg, #D4AF37, transparent)",
              marginBottom: 14,
              animation: mounted ? "drawLine 0.6s 0.6s ease both" : "none",
              overflow: "hidden",
            }} />

            <p style={{ color: "#6B7A8A", fontSize: "0.84rem", lineHeight: 1.65, margin: 0, maxWidth: "90%" }}>
              Access your cases, hearings, and court documents securely through India's trusted digital judiciary platform.
            </p>

            {/* Trust indicators */}
            <div style={{ display: "flex", gap: 18, marginTop: 22 }}>
              {[
                { icon: "🔒", label: "Secure &\nTrusted" },
                { icon: "👤", label: "Personalized\nAccess" },
                { icon: "⚡", label: "24/7\nAvailable" },
              ].map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: "1rem" }}>{t.icon}</span>
                  <span style={{
                    fontSize: "0.68rem", color: "#4A5A6A",
                    whiteSpace: "pre-line", lineHeight: 1.3,
                  }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT: Form Panel (60%)
        ══════════════════════════════════════════════ */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "linear-gradient(170deg, #0F1A35 0%, #0B132B 100%)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Judicial Seal Watermark */}
          <JudicialSeal />

          {/* Mobile hero header (visible only on small screens) */}
          <div className="login-mobile-hero" style={{
            position: "relative", height: 200, overflow: "hidden",
          }}>
            <img src="/images/courthouse_pillars.png" alt="" style={{
              width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%",
              filter: "blur(0.4px)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, rgba(11,19,43,0.3) 0%, rgba(11,19,43,0.95) 100%)",
            }} />
            <div style={{
              position: "absolute", bottom: 16, left: 20,
            }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: "1.2rem",
                color: "#FFFFFF", lineHeight: 1.3,
              }}>Welcome Back to the Bench</div>
              <div style={{
                width: 36, height: 2, marginTop: 8,
                background: "linear-gradient(90deg, #D4AF37, transparent)",
              }} />
            </div>
          </div>

          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 28px",
            borderBottom: "1px solid rgba(212,175,55,0.08)",
            fontSize: "0.74rem", color: "#4A5A6A",
          }}>
            <span>support@ecourt.gov.in</span>
            <span style={{
              fontFamily: "'Cinzel', serif", color: "#D4AF37",
              fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.12em",
            }}>E-COURT</span>
          </div>

          {/* Form — vertically centered */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "clamp(28px, 5vw, 48px) clamp(28px, 6vw, 72px)",
          }}>
            <div style={{
              width: "100%", maxWidth: 400,
              animation: mounted ? "contentReveal 0.7s 0.12s ease both" : "none",
            }}>
              <h1 style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)",
                color: "#FFFFFF", margin: "0 0 3px", fontWeight: 700,
              }}>Secure Login</h1>

              {/* Title underline accent */}
              <div style={{
                width: 40, height: 2, marginBottom: 6,
                background: "linear-gradient(90deg, #D4AF37, transparent)",
                animation: mounted ? "drawLine 0.5s 0.4s ease both" : "none",
              }} />

              <p style={{ color: "#5A6A7A", fontSize: "0.86rem", margin: "0 0 30px" }}>
                Enter your credentials to access your account
              </p>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
                {/* Email field */}
                <div style={{ animation: mounted ? "fieldReveal 0.5s 0.2s ease both" : "none", opacity: 0 }}>
                  <label style={lbl}>EMAIL ADDRESS</label>
                  <div style={{ position: "relative" }}>
                    <MailIcon />
                    <input type="email" style={inp(isFocused("email"), true)}
                      placeholder="Enter email address"
                      value={form.email}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div style={{ animation: mounted ? "fieldReveal 0.5s 0.3s ease both" : "none", opacity: 0 }}>
                  <label style={lbl}>PASSWORD</label>
                  <div style={{ position: "relative" }}>
                    <LockIcon />
                    <input type="password" style={inp(isFocused("pw"), true)}
                      placeholder="Enter password"
                      value={form.password}
                      onFocus={() => setFocusedField("pw")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>

                {/* Remember / Forgot */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  animation: mounted ? "fieldReveal 0.5s 0.4s ease both" : "none", opacity: 0,
                }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#5A6A7A", fontSize: "0.82rem" }}>
                    <input type="checkbox" style={{ width: 15, height: 15, accentColor: "#D4AF37" }} />
                    Remember me
                  </label>
                  <span style={{ color: "#D4AF37", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                    Forgot Password?
                  </span>
                </div>

                {/* Submit button with shimmer */}
                <div style={{ animation: mounted ? "fieldReveal 0.5s 0.5s ease both" : "none", opacity: 0 }}>
                  <button type="submit" style={{
                    ...btnGold,
                    position: "relative", overflow: "hidden",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,175,55,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(212,175,55,0.2)"; }}
                  >
                    {/* Shimmer strip */}
                    <span style={{
                      position: "absolute", top: 0, width: "30%", height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                      animation: "btnShimmer 5s ease-in-out infinite",
                      pointerEvents: "none",
                    }} />
                    Login →
                  </button>

                  {/* Encryption micro-copy */}
                  <p style={{
                    textAlign: "center", margin: "8px 0 0",
                    fontSize: "0.68rem", color: "#3A4A5A",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3A4A5A" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7,11 V7 a5,5 0 0 1 10,0 v4" />
                    </svg>
                    Protected by 256-bit encryption
                  </p>
                </div>
              </form>

              {/* OR separator */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                margin: "22px 0", color: "#3A4A5A", fontSize: "0.8rem",
                animation: mounted ? "fieldReveal 0.5s 0.55s ease both" : "none", opacity: 0,
              }}>
                <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.08)" }} />
                <span>or</span>
                <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.08)" }} />
              </div>

              <div style={{ animation: mounted ? "fieldReveal 0.5s 0.6s ease both" : "none", opacity: 0 }}>
                <button type="button" style={{
                  width: "100%", padding: "11px 16px", borderRadius: 10,
                  background: "rgba(212,175,55,0.04)",
                  border: "1px solid rgba(212,175,55,0.15)",
                  color: "#D4AF37", fontWeight: 600, fontSize: "0.84rem",
                  cursor: "pointer", transition: "background 0.25s, border-color 0.25s",
                }}
                  onMouseEnter={(e) => { e.target.style.background = "rgba(212,175,55,0.09)"; e.target.style.borderColor = "rgba(212,175,55,0.3)"; }}
                  onMouseLeave={(e) => { e.target.style.background = "rgba(212,175,55,0.04)"; e.target.style.borderColor = "rgba(212,175,55,0.15)"; }}>
                  Login with Digital India (Meri Pehchaan)
                </button>
              </div>

              <p style={{
                textAlign: "center", color: "#4A5A6A", fontSize: "0.86rem", marginTop: 22,
                animation: mounted ? "fieldReveal 0.5s 0.65s ease both" : "none", opacity: 0,
              }}>
                Don&apos;t have an account?{" "}
                <Link to="/signup" style={{ color: "#D4AF37", fontWeight: 600, textDecoration: "none" }}>Register</Link>
              </p>
            </div>
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

/* ── Shared styles ── */
const lbl = {
  display: "block", fontSize: "0.72rem", fontWeight: 600,
  color: "#6B7A8A", letterSpacing: "0.1em",
  textTransform: "uppercase", marginBottom: 6,
};

const inp = (focused, hasIcon) => ({
  width: "100%", boxSizing: "border-box",
  padding: hasIcon ? "12px 14px 12px 40px" : "12px 14px",
  borderRadius: 10,
  background: "rgba(11,19,43,0.5)",
  border: focused ? "1px solid #D4AF37" : "1px solid rgba(136,153,170,0.15)",
  boxShadow: focused ? "0 0 0 3px rgba(212,175,55,0.1)" : "none",
  animation: focused ? "focusPulse 0.4s ease" : "none",
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

export default Login;