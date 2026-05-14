import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../App.css";
import api from "../services/api";
import { getDefaultRouteForRole, saveSession } from "../services/auth";

/* ─── Particle Ring ─── */
const ParticleRing = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId, t = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.004;
      const cx = canvas.width / 2, cy = canvas.height * 0.35;
      const rings = [{ r: 90, n: 18, speed: 1 }, { r: 130, n: 26, speed: -0.7 }, { r: 170, n: 34, speed: 0.5 }];
      rings.forEach(ring => {
        for (let i = 0; i < ring.n; i++) {
          const angle = (i / ring.n) * Math.PI * 2 + t * ring.speed;
          const x = cx + ring.r * Math.cos(angle);
          const y = cy + ring.r * Math.sin(angle) * 0.35;
          const size = 1.2 + Math.sin(t * 2 + i) * 0.5;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212,175,55,${0.15 + 0.1 * Math.sin(t + i)})`;
          ctx.fill();
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
};

/* ─── Morphing Orb ─── */
const MorphOrb = ({ style }) => (
  <div style={{
    position: "absolute", borderRadius: "50%", filter: "blur(70px)", pointerEvents: "none",
    animation: "orbMorph 18s ease-in-out infinite",
    ...style,
  }} />
);

/* ─── Animated Seal ─── */
const AnimatedSeal = () => (
  <svg viewBox="0 0 200 200" style={{
    position: "absolute", right: "-8%", top: "8%",
    width: "clamp(300px, 42vw, 460px)", height: "auto",
    opacity: 0.028, pointerEvents: "none",
    animation: "sealSpin 60s linear infinite",
  }}>
    <circle cx="100" cy="100" r="90" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4 3" />
    <circle cx="100" cy="100" r="80" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
    <circle cx="100" cy="100" r="70" fill="none" stroke="#D4AF37" strokeWidth="0.3" strokeDasharray="2 4" />
    <line x1="100" y1="48" x2="100" y2="122" stroke="#D4AF37" strokeWidth="1.2" />
    <line x1="68" y1="68" x2="132" y2="68" stroke="#D4AF37" strokeWidth="1.2" />
    <path d="M68,68 L56,96 L80,96 Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
    <path d="M132,68 L120,96 L144,96 Z" fill="none" stroke="#D4AF37" strokeWidth="0.8" />
    <line x1="84" y1="122" x2="116" y2="122" stroke="#D4AF37" strokeWidth="1.2" />
    <line x1="78" y1="128" x2="122" y2="128" stroke="#D4AF37" strokeWidth="1" />
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
      <line key={a}
        x1={100 + 84 * Math.cos(a * Math.PI / 180)} y1={100 + 84 * Math.sin(a * Math.PI / 180)}
        x2={100 + 90 * Math.cos(a * Math.PI / 180)} y2={100 + 90 * Math.sin(a * Math.PI / 180)}
        stroke="#D4AF37" strokeWidth="1"
      />
    ))}
    <text x="100" y="157" textAnchor="middle" fill="#D4AF37" fontSize="6" fontFamily="'Cinzel', serif" letterSpacing="0.2em">E-COURT</text>
    <text x="100" y="165" textAnchor="middle" fill="#D4AF37" fontSize="3.5" fontFamily="'Inter', sans-serif" letterSpacing="0.12em">MANAGEMENT SYSTEM</text>
  </svg>
);

/* ─── Progress Steps ─── */
const StepIndicator = ({ current, total }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: i === current ? 28 : 8, height: 8, borderRadius: 4,
          background: i <= current ? "#D4AF37" : "rgba(212,175,55,0.15)",
          transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)",
        }} />
      </div>
    ))}
    <span style={{ fontSize: "0.7rem", color: "#2A3A4A", marginLeft: 4 }}>Step {current + 1} of {total}</span>
  </div>
);

function Signup() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formStep, setFormStep] = useState(0); // 0 = personal, 1 = credentials
  const [focusedField, setFocusedField] = useState(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    password_confirmation: "", role: "public_user", terms_accepted: false,
  });

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1800);
    const t2 = setTimeout(() => setShowSplash(false), 2400);
    const t3 = setTimeout(() => setMounted(true), 2500);
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

  const SVGIcon = ({ path, path2 }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />{path2 && <path d={path2} />}
    </svg>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes sealSpin { to { transform: rotate(360deg); } }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes orbMorph {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25%       { transform: translate(20px, -15px) scale(1.08) rotate(5deg); }
          50%       { transform: translate(-15px, 20px) scale(0.94) rotate(-3deg); }
          75%       { transform: translate(10px, 10px) scale(1.04) rotate(2deg); }
        }
        @keyframes splashScale {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(5deg); opacity: 1; }
          80%  { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes splashText {
          from { opacity: 0; transform: translateY(14px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes inputGlow {
          from { border-color: rgba(212,175,55,0.5); box-shadow: 0 0 0 3px rgba(212,175,55,0.08); }
          to   { border-color: #D4AF37; box-shadow: 0 0 0 4px rgba(212,175,55,0.12); }
        }
        @keyframes shimmerSlide {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        @keyframes logoReveal {
          0%   { letter-spacing: 0.6em; opacity: 0; }
          100% { letter-spacing: 0.18em; opacity: 1; }
        }
        @keyframes heroFloat {
          0%, 100% { transform: scale(1) translateY(0); }
          50%       { transform: scale(1.04) translateY(-8px); }
        }
        @keyframes scanLine {
          0%   { top: -2px; opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.2; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.3); }
          50%       { box-shadow: 0 0 0 5px rgba(212,175,55,0.07); }
        }
        @keyframes stepSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes stepSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-20px); }
        }

        .signup-root {
          display: grid; grid-template-columns: 42fr 58fr;
          min-height: 100vh; font-family: 'DM Sans', sans-serif; background: #03060F;
        }
        @media (max-width: 900px) {
          .signup-root { grid-template-columns: 1fr; }
          .hero-panel { display: none; }
        }

        /* ── INPUT ── */
        .su-input {
          width: 100%; padding: 12px 14px 12px 42px; border-radius: 11px;
          background: rgba(3,6,15,0.65);
          border: 1px solid rgba(212,175,55,0.13);
          color: #E8EAF0; font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.3s;
          backdrop-filter: blur(8px);
        }
        .su-input::placeholder { color: rgba(160,170,190,0.3); }
        .su-input:focus { animation: inputGlow 0.4s ease forwards; background: rgba(3,6,15,0.85); }
        .su-input.no-icon { padding-left: 14px; }

        .su-select {
          width: 100%; padding: 12px 14px; border-radius: 11px;
          background: rgba(3,6,15,0.65);
          border: 1px solid rgba(212,175,55,0.13);
          color: #E8EAF0; font-size: 0.88rem; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.3s; cursor: pointer;
          backdrop-filter: blur(8px);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .su-select:focus { animation: inputGlow 0.4s ease forwards; }
        .su-select option { background: #06101F; color: #E8EAF0; }

        .field-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: rgba(212,175,55,0.4); pointer-events: none; display: flex;
          transition: color 0.3s;
        }
        .su-input:focus + .field-icon { color: #D4AF37; }

        /* ── MAIN BTN ── */
        .reg-btn {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #D4AF37 0%, #C8A020 50%, #B8962E 100%);
          color: #03060F; font-weight: 700; font-size: 0.9rem;
          font-family: 'Cinzel', serif; cursor: pointer; letter-spacing: 0.08em;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 24px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: transform 0.25s cubic-bezier(0.23,1,0.32,1), box-shadow 0.25s;
          white-space: nowrap;
          min-width: 200px;
        }
        .reg-btn::before {
          content: ''; position: absolute; top: 0; width: 40%; height: 100%; left: -40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmerSlide 4s ease-in-out 2s infinite;
        }
        .reg-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(212,175,55,0.38); }

        .next-btn {
          padding: 12px 24px; border-radius: 11px; border: 1px solid rgba(212,175,55,0.3);
          background: rgba(212,175,55,0.06); color: #D4AF37;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s; letter-spacing: 0.04em;
        }
        .next-btn:hover { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.45); }

        .back-btn {
          padding: 12px 18px; border-radius: 11px; border: 1px solid rgba(212,175,55,0.1);
          background: transparent; color: #3A4D60;
          font-family: 'DM Sans', sans-serif; font-size: 0.88rem;
          cursor: pointer; transition: all 0.3s;
        }
        .back-btn:hover { color: #D4AF37; border-color: rgba(212,175,55,0.25); }

        .scan-container {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none; border-radius: 16px;
        }
        .scan-line {
          position: absolute; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.12), transparent);
          animation: scanLine 7s ease-in-out 3s infinite;
        }

        .form-step { animation: stepSlideIn 0.4s ease both; }
      `}</style>

      {/* ── Gavel Splash ── */}
      {showSplash && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "radial-gradient(ellipse at center, #0A1020 0%, #03060F 100%)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transition: "opacity 0.65s cubic-bezier(0.4,0,0.2,1)",
          opacity: splashFading ? 0 : 1,
          pointerEvents: splashFading ? "none" : "all",
        }}>
          {/* Ring decoration */}
          <div style={{
            position: "absolute", width: 180, height: 180, borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.1)",
          }} />
          <div style={{
            position: "absolute", width: 240, height: 240, borderRadius: "50%",
            border: "1px solid rgba(212,175,55,0.06)",
          }} />
          <div style={{
            fontSize: "4rem",
            animation: "splashScale 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}>⚖️</div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: "1.25rem",
            color: "#D4AF37", letterSpacing: "0.45em", marginTop: 22,
            opacity: 0, animation: "splashText 0.7s ease forwards 0.5s",
          }}>JUDICIAL REGISTRY</div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.72rem",
            color: "#2A3A4A", letterSpacing: "0.2em", marginTop: 8,
            opacity: 0, animation: "splashText 0.7s ease forwards 0.7s",
            textTransform: "uppercase",
          }}>E-Court Management System</div>
          {/* Loading bar */}
          <div style={{
            position: "absolute", bottom: "10%", width: 160, height: 2,
            background: "rgba(212,175,55,0.1)", borderRadius: 1, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
              animation: "shimmerSlide 1.8s ease infinite",
            }} />
          </div>
        </div>
      )}

      <div className="signup-root">

        {/* ══ LEFT HERO ══ */}
        <div className="hero-panel" style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(160deg, #060B1C 0%, #03060F 100%)",
          borderRight: "1px solid rgba(212,175,55,0.07)",
        }}>
          <img
            src="/images/lady_justice_hero.png" alt="Lady Justice"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center top",
              opacity: 0.75,
              filter: "brightness(1.35) contrast(1.1)",
              animation: "heroFloat 20s ease-in-out infinite",
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(3,6,15,0.05) 0%, rgba(3,6,15,0.3) 40%, rgba(3,6,15,0.85) 100%)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 35%, rgba(212,175,55,0.05) 0%, transparent 60%)",
          }} />

          {/* Particle Ring */}
          <ParticleRing />

          {/* Orbs */}
          <MorphOrb style={{ width: 280, height: 280, left: "-80px", top: "10%", background: "rgba(212,175,55,0.04)" }} />
          <MorphOrb style={{ width: 200, height: 200, right: "-50px", top: "50%", background: "rgba(212,175,55,0.03)", animationDelay: "5s" }} />

          {/* Right edge light */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
            background: "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.2) 40%, rgba(212,175,55,0.1) 60%, transparent 100%)",
          }} />

          {/* Bottom text */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, padding: "36px 28px",
            animation: mounted ? "revealUp 0.9s 0.4s ease both" : "none", opacity: 0,
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14,
              padding: "4px 11px", borderRadius: 6,
              background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)",
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#D4AF37", animation: "pulse 2.5s infinite" }} />
              <span style={{ fontSize: "0.66rem", color: "#D4AF37", letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600 }}>
                New Enrollment
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1.3rem, 2.2vw, 1.85rem)",
              color: "#D4AF37", lineHeight: 1.3, marginBottom: 12, fontWeight: 700,
              textShadow: "0 0 40px rgba(212,175,55,0.2)",
            }}>
              Justice Must Remain<br />Fearless & Transparent
            </h2>

            <div style={{
              height: 2, width: 44, background: "linear-gradient(90deg, #D4AF37, transparent)",
              transformOrigin: "left",
              animation: mounted ? "lineDraw 0.6s 0.8s ease both" : "none",
              transform: "scaleX(0)", marginBottom: 14,
            }} />

            <p style={{ color: "#3A4D60", fontSize: "0.84rem", lineHeight: 1.7, maxWidth: "90%", marginBottom: 22 }}>
              Join India's premier digital court management platform. Secure, efficient, and accessible justice — anytime, anywhere.
            </p>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { icon: "🔒", text: "AES-256 Encrypted" },
                { icon: "⚡", text: "24/7 Access" },
                { icon: "📜", text: "Paperless Process" },
              ].map((f, i) => (
                <div key={f.text} style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "6px 12px",
                  borderRadius: 20, background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)",
                  animation: mounted ? `revealUp 0.4s ${0.9 + i * 0.1}s ease both` : "none", opacity: 0,
                }}>
                  <span style={{ fontSize: "0.85rem" }}>{f.icon}</span>
                  <span style={{ fontSize: "0.72rem", color: "#2A3A4A", letterSpacing: "0.04em" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT FORM PANEL ══ */}
        <div style={{
          display: "flex", flexDirection: "column",
          background: "linear-gradient(165deg, #0C1628 0%, #06101F 60%, #03060F 100%)",
          position: "relative", overflow: "hidden",
        }}>
          <MorphOrb style={{ width: 350, height: 350, right: "-100px", top: "-80px", background: "rgba(212,175,55,0.022)" }} />
          <MorphOrb style={{ width: 250, height: 250, left: "-70px", bottom: "5%", background: "rgba(212,175,55,0.018)", animationDelay: "8s" }} />
          <AnimatedSeal />

          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "13px 28px", zIndex: 2,
            borderBottom: "1px solid rgba(212,175,55,0.06)",
          }}>
            <span style={{ fontSize: "0.72rem", color: "#2A3A4A", letterSpacing: "0.04em" }}>support@ecourt.gov.in</span>
            <span style={{
              fontFamily: "'Cinzel', serif", color: "#D4AF37",
              fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.18em",
              animation: mounted ? "logoReveal 1s 0.3s ease both" : "none", opacity: 0,
            }}>E-COURT</span>
          </div>

          {/* Scrollable form area */}
          <div style={{
            flex: 1, overflowY: "auto", zIndex: 2,
            padding: "clamp(20px, 3.5vw, 40px) clamp(20px, 4.5vw, 60px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: "100%", maxWidth: 460,
              animation: mounted ? "revealUp 0.8s 0.35s ease both" : "none", opacity: 0,
            }}>
              {/* Header */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: "0.68rem", color: "#D4AF37", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8, opacity: 0.7 }}>
                  Registry Enrollment
                </p>
                <h1 style={{
                  fontFamily: "'Cinzel', serif", fontSize: "clamp(1.4rem,2.5vw,1.9rem)",
                  color: "#FFFFFF", fontWeight: 900, letterSpacing: "0.04em", marginBottom: 8,
                }}>Create Your Profile</h1>
                <div style={{
                  height: 2, width: 44, background: "linear-gradient(90deg, #D4AF37, transparent)",
                  transformOrigin: "left",
                  animation: mounted ? "lineDraw 0.6s 0.7s ease both" : "none",
                  transform: "scaleX(0)", marginBottom: 10,
                }} />
                <p style={{ color: "#3A4D60", fontSize: "0.84rem", lineHeight: 1.6 }}>
                  Establish your digital credentials in the ECMS ecosystem.
                </p>
              </div>

              {/* Step indicator */}
              <StepIndicator current={formStep} total={2} />

              {/* Glass form card */}
              <div style={{
                position: "relative", borderRadius: 16,
                background: "linear-gradient(180deg, rgba(10,16,30,0.48), rgba(8,14,28,0.32))",
                border: "1px solid rgba(212,175,55,0.1)",
                padding: "28px 24px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,175,55,0.06)",
              }}>
                <div className="scan-container"><div className="scan-line" /></div>

                <form onSubmit={handleSubmit}>

                  {/* ── STEP 0: Personal Info ── */}
                  {formStep === 0 && (
                    <div className="form-step" style={{ display: "grid", gap: 18 }}>
                      {/* Name + Email */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={lbl}>Full Name</label>
                          <div style={{ position: "relative" }}>
                            <input className="su-input" placeholder="Your full name"
                              value={form.name}
                              onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
                              onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            <span className="field-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Email Address</label>
                          <div style={{ position: "relative" }}>
                            <input className="su-input" type="email" placeholder="Email"
                              value={form.email}
                              onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                              onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            <span className="field-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22,6 L12,13 L2,6" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Phone + Role */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={lbl}>Mobile Number</label>
                          <div style={{ position: "relative" }}>
                            <input className="su-input" placeholder="Phone number"
                              value={form.phone}
                              onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            <span className="field-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 12 19.79 19.79 0 0 1 1.06 3.38 2 2 0 0 1 3.04 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                            </span>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Assigned Role</label>
                          <select className="su-select"
                            value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            <option value="public_user">Public User</option>
                            <option value="lawyer">Advocate</option>
                            <option value="clerk">Clerk</option>
                            <option value="judge">Judge</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      {/* Next button */}
                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                        <button type="button" className="next-btn"
                          onClick={() => setFormStep(1)}>
                          Continue →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 1: Credentials ── */}
                  {formStep === 1 && (
                    <div className="form-step" style={{ display: "grid", gap: 18 }}>
                      {/* Password + Confirm */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div>
                          <label style={lbl}>Password</label>
                          <div style={{ position: "relative" }}>
                            <input className="su-input" type={showPassword ? "text" : "password"}
                              placeholder="••••••••" style={{ paddingRight: 52 }}
                              value={form.password}
                              onFocus={() => setFocusedField("pw")} onBlur={() => setFocusedField(null)}
                              onChange={(e) => setForm({ ...form, password: e.target.value })} />
                            <span className="field-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7,11 V7 a5,5 0 0 1 10,0 v4" />
                              </svg>
                            </span>
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer",
                                color: "rgba(212,175,55,0.5)", fontSize: "0.9rem", 
                                width: "34px", height: "34px", display: "flex", 
                                alignItems: "center", justifyContent: "center",
                                zIndex: 5, padding: 0
                              }}>
                              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label style={lbl}>Confirm Password</label>
                          <div style={{ position: "relative" }}>
                            <input className="su-input" type={showPassword ? "text" : "password"}
                              placeholder="••••••••" style={{ paddingRight: 52 }}
                              value={form.password_confirmation}
                              onFocus={() => setFocusedField("cpw")} onBlur={() => setFocusedField(null)}
                              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                            <span className="field-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7,11 V7 a5,5 0 0 1 10,0 v4" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Password strength hints */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {[
                          { label: "8+ chars", ok: form.password.length >= 8 },
                          { label: "Uppercase", ok: /[A-Z]/.test(form.password) },
                          { label: "Number", ok: /\d/.test(form.password) },
                          { label: "Passwords match", ok: form.password && form.password === form.password_confirmation },
                        ].map(h => (
                          <div key={h.label} style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: "0.68rem",
                            background: h.ok ? "rgba(74,200,120,0.1)" : "rgba(212,175,55,0.04)",
                            border: `1px solid ${h.ok ? "rgba(74,200,120,0.3)" : "rgba(212,175,55,0.1)"}`,
                            color: h.ok ? "#4AC878" : "#2A3A4A",
                            transition: "all 0.3s",
                          }}>
                            {h.ok ? "✓ " : ""}{h.label}
                          </div>
                        ))}
                      </div>

                      {/* Terms */}
                      <label style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        color: "#3A4D60", fontSize: "0.82rem", cursor: "pointer", lineHeight: 1.5,
                      }}>
                        <input type="checkbox" style={{ width: 15, height: 15, accentColor: "#D4AF37", marginTop: 1, flexShrink: 0 }}
                          checked={form.terms_accepted}
                          onChange={(e) => setForm({ ...form, terms_accepted: e.target.checked })} />
                        I agree to the judicial protocols, privacy policy, and terms of service of the E-Court Management System
                      </label>

                      {/* Buttons */}
                      <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
                        <button type="button" className="back-btn" onClick={() => setFormStep(0)}>
                          ← Back
                        </button>
                        <button type="submit" className="reg-btn" style={{ flex: 1 }}>
                          Initialize Enrollment
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <p style={{ textAlign: "center", color: "#2A3A4A", fontSize: "0.84rem", marginTop: 20 }}>
                Already registered?{" "}
                <Link to="/" style={{ color: "#D4AF37", fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", flexWrap: "wrap",
            padding: "12px 28px", gap: 8, zIndex: 2,
            borderTop: "1px solid rgba(212,175,55,0.05)",
            fontSize: "0.7rem", color: "#1A2535",
          }}>
            <span>© 2024 E-Court Management System</span>
            <div style={{ display: "flex", gap: 14 }}>
              {["Privacy Policy", "Terms", "Help"].map(t => (
                <span key={t} style={{ cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = "#D4AF37"}
                  onMouseLeave={e => e.target.style.color = "#1A2535"}
                >{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const lbl = {
  display: "block", fontSize: "0.68rem", fontWeight: 600,
  color: "#3A4D60", letterSpacing: "0.12em",
  textTransform: "uppercase", marginBottom: 7,
  fontFamily: "'DM Sans', sans-serif",
};

export default Signup;