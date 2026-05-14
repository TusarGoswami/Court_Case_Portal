import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import api from "../services/api";
import { getDefaultRouteForRole, saveSession } from "../services/auth";

/* ─── Constellation Canvas ─── */
const ConstellationBg = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const count = 60;
    const nodes = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(212,175,55,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212,175,55,0.4)";
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none",
    }} />
  );
};

/* ─── Orb Glow ─── */
const OrbGlow = ({ style }) => (
  <div style={{
    position: "absolute", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none",
    ...style,
  }} />
);

/* ─── Animated Seal ─── */
const AnimatedSeal = () => (
  <svg viewBox="0 0 200 200" style={{
    position: "absolute", right: "-8%", top: "8%",
    width: "clamp(300px, 42vw, 460px)", height: "auto",
    opacity: 0.03, pointerEvents: "none",
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

/* ─── Magnetic Button ─── */
const MagneticBtn = ({ children, onClick, type = "button", style: extraStyle }) => {
  const ref = useRef(null);
  const handleMove = (e) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };
  return (
    <button ref={ref} type={type} onMouseMove={handleMove} onMouseLeave={handleLeave}
      onClick={onClick}
      style={{
        transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1), box-shadow 0.3s",
        ...extraStyle,
      }}>
      {children}
    </button>
  );
};

/* ─── Text Scramble Hook ─── */
const useScramble = (text, trigger) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!trigger) return;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let iter = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((c, i) =>
        i < iter ? c : c === " " ? " " : chars[Math.floor(Math.random() * chars.length)]
      ).join(""));
      iter++;
      if (iter > text.length) clearInterval(interval);
    }, 35);
    return () => clearInterval(interval);
  }, [trigger, text]);
  return display;
};

function Login() {
  const navigate = useNavigate();
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const scrambledTitle = useScramble("SECURE LOGIN", titleVisible);

  useEffect(() => {
    const t1 = setTimeout(() => setMounted(true), 80);
    const t2 = setTimeout(() => setTitleVisible(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/login", form);
      saveSession(res.data.token, res.data.user);
      navigate(getDefaultRouteForRole(res.data?.user?.role), { replace: true });
    } catch (err) {
      alert(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const isFocused = (f) => focusedField === f;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes sealSpin { to { transform: rotate(360deg); } }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(32px) skewY(1deg); }
          to   { opacity: 1; transform: translateY(0) skewY(0); }
        }
        @keyframes revealLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes lineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -20px) scale(1.05); }
          66%       { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes shimmerSlide {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.3); }
          50%       { box-shadow: 0 0 0 6px rgba(212,175,55,0.08); }
        }
        @keyframes borderGlow {
          from { border-color: rgba(212,175,55,0.5); box-shadow: 0 0 0 3px rgba(212,175,55,0.08), inset 0 1px 0 rgba(212,175,55,0.1); }
          to   { border-color: #D4AF37; box-shadow: 0 0 0 4px rgba(212,175,55,0.12), inset 0 1px 0 rgba(212,175,55,0.15); }
        }
        @keyframes scanLine {
          0%   { top: -2px; opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes logoReveal {
          0%   { letter-spacing: 0.6em; opacity: 0; }
          100% { letter-spacing: 0.18em; opacity: 1; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes heroImgReveal {
          from { opacity: 0; transform: scale(1.08); filter: brightness(0.5) blur(4px); }
          to   { opacity: 1; transform: scale(1); filter: brightness(1) blur(0); }
        }

        .login-root {
          display: grid;
          grid-template-columns: 42fr 58fr;
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: #03060F;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .login-root.mounted { opacity: 1; }

        @media (max-width: 900px) {
          .login-root { grid-template-columns: 1fr; }
          .hero-panel { display: none; }
        }

        /* ── INPUT ── */
        .field-wrap { position: relative; }
        .field-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(212,175,55,0.45); pointer-events: none; display: flex;
          transition: color 0.3s;
        }
        .field-input {
          width: 100%; padding: 13px 14px 13px 44px; border-radius: 12px;
          background: rgba(3,6,15,0.6);
          border: 1px solid rgba(212,175,55,0.15);
          color: #E8EAF0; font-size: 0.9rem; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }
        .field-input::placeholder { color: rgba(160,170,190,0.35); }
        .field-input:focus {
          background: rgba(3,6,15,0.8);
          animation: borderGlow 0.4s ease forwards;
        }
        .field-input:focus ~ .field-icon { color: #D4AF37; }

        /* ── COUNTER BADGES ── */
        .stat-badge {
          display: flex; flex-direction: column; align-items: flex-start;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(212,175,55,0.04);
          border: 1px solid rgba(212,175,55,0.1);
          transition: border-color 0.3s, background 0.3s;
        }
        .stat-badge:hover {
          background: rgba(212,175,55,0.07); border-color: rgba(212,175,55,0.2);
        }
        .stat-num {
          font-family: 'Cinzel', serif; font-size: 1.35rem; color: #D4AF37;
          font-weight: 700; line-height: 1;
        }
        .stat-label { font-size: 0.68rem; color: #3A4D60; margin-top: 4px; letter-spacing: 0.05em; }

        /* ── MAIN BTN ── */
        .login-btn {
          width: 100%; padding: 14px 20px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #D4AF37 0%, #C9A227 50%, #B8962E 100%);
          color: #03060F; font-weight: 700; font-size: 0.95rem;
          font-family: 'Cinzel', serif; cursor: pointer;
          letter-spacing: 0.08em; position: relative; overflow: hidden;
          box-shadow: 0 4px 24px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.25s cubic-bezier(0.23,1,0.32,1), box-shadow 0.25s;
        }
        .login-btn::before {
          content: ''; position: absolute; top: 0; width: 40%; height: 100%; left: -40%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          animation: shimmerSlide 4s ease-in-out 1.5s infinite;
        }
        .login-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
        .login-btn:active { transform: translateY(0); }
        .login-btn.loading { opacity: 0.7; pointer-events: none; }

        /* ── ALT BTN ── */
        .alt-btn {
          width: 100%; padding: 12px 16px; border-radius: 12px;
          background: transparent;
          border: 1px solid rgba(212,175,55,0.18);
          color: rgba(212,175,55,0.85); font-weight: 500; font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.3s ease; letter-spacing: 0.03em;
          position: relative; overflow: hidden;
        }
        .alt-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.06), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .alt-btn:hover { border-color: rgba(212,175,55,0.38); color: #D4AF37; }
        .alt-btn:hover::after { opacity: 1; }

        /* ── DIVIDER ── */
        .divider { display: flex; align-items: center; gap: 14px; color: #2A3A4A; font-size: 0.78rem; }
        .divider::before, .divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent);
        }

        /* ── SCAN LINE overlay ── */
        .scan-container {
          position: absolute; inset: 0; overflow: hidden; pointer-events: none; border-radius: 16px;
        }
        .scan-line {
          position: absolute; left: 0; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent);
          animation: scanLine 6s ease-in-out 2s infinite;
        }
      `}</style>

      <div className={`login-root${mounted ? " mounted" : ""}`}>

        {/* ══ LEFT HERO ══ */}
        <div className="hero-panel" style={{
          position: "relative", overflow: "hidden",
          background: "linear-gradient(160deg, #060B1C 0%, #03060F 100%)",
        }}>
          <img
            src="/images/courthouse_pillars.png" alt="Grand Courthouse"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center 30%",
              opacity: 0.35,
              animation: mounted ? "heroImgReveal 1.8s ease both" : "none",
            }}
          />

          {/* multi-layer gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(3,6,15,0.15) 0%, rgba(3,6,15,0.5) 45%, rgba(3,6,15,0.97) 100%)",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 60% 40%, rgba(212,175,55,0.04) 0%, transparent 65%)",
          }} />

          {/* Constellation */}
          <ConstellationBg />

          {/* Floating orbs */}
          <OrbGlow style={{ width: 260, height: 260, left: "-80px", top: "15%", background: "rgba(212,175,55,0.04)", animation: "orbFloat 18s ease-in-out infinite" }} />
          <OrbGlow style={{ width: 180, height: 180, right: "-40px", top: "45%", background: "rgba(130,100,30,0.05)", animation: "orbFloat 22s ease-in-out 3s infinite" }} />

          {/* Right edge glow */}
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
            background: "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.25) 40%, rgba(212,175,55,0.15) 60%, transparent 100%)",
          }} />

          {/* Bottom content */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 32px",
            animation: mounted ? "revealUp 0.9s 0.5s ease both" : "none", opacity: 0,
          }}>
            {/* Eyebrow */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16,
              padding: "5px 12px", borderRadius: 6,
              background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4AF37", animation: "pulse 2.5s infinite" }} />
              <span style={{ fontSize: "0.68rem", color: "#D4AF37", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
                Authorized Portal
              </span>
            </div>

            <h2 style={{
              fontFamily: "'Cinzel', serif", fontSize: "clamp(1.4rem, 2.4vw, 2rem)",
              color: "#FFFFFF", lineHeight: 1.25, marginBottom: 14, fontWeight: 900,
              letterSpacing: "0.02em",
            }}>
              Welcome Back<br />to the Bench
            </h2>

            {/* Animated line */}
            <div style={{
              height: 2, width: 56, marginBottom: 16,
              background: "linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.1))",
              transformOrigin: "left",
              animation: mounted ? "lineDraw 0.7s 0.9s ease both" : "none",
              transform: "scaleX(0)",
            }} />

            <p style={{ color: "#4A5E72", fontSize: "0.85rem", lineHeight: 1.7, maxWidth: "88%", marginBottom: 24 }}>
              Access your cases, hearings, and court documents through India's trusted digital judiciary platform.
            </p>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { num: "2.4M+", label: "Cases Filed" },
                { num: "98%", label: "Uptime" },
                { num: "256-bit", label: "Encryption" },
              ].map((s, i) => (
                <div key={s.label} className="stat-badge"
                  style={{ animation: mounted ? `countUp 0.5s ${0.8 + i * 0.12}s ease both` : "none", opacity: 0 }}>
                  <span className="stat-num">{s.num}</span>
                  <span className="stat-label">{s.label}</span>
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

          {/* Orbs behind form */}
          <OrbGlow style={{ width: 350, height: 350, right: "-100px", top: "-80px", background: "rgba(212,175,55,0.025)", animation: "orbFloat 20s ease-in-out 2s infinite" }} />
          <OrbGlow style={{ width: 280, height: 280, left: "-80px", bottom: "10%", background: "rgba(212,175,55,0.02)", animation: "orbFloat 25s ease-in-out infinite" }} />

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

          {/* Form centered */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "clamp(28px,4vw,48px) clamp(28px,6vw,72px)",
            zIndex: 2,
          }}>
            <div style={{
              width: "100%", maxWidth: 400,
              animation: mounted ? "revealUp 0.8s 0.3s ease both" : "none", opacity: 0,
            }}>

              {/* Heading with scramble */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: "0.68rem", color: "#D4AF37", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8, opacity: 0.7 }}>
                  Identity Verification
                </p>
                <h1 style={{
                  fontFamily: "'Cinzel', serif", fontSize: "clamp(1.5rem,2.6vw,2rem)",
                  color: "#FFFFFF", fontWeight: 900, letterSpacing: "0.05em", lineHeight: 1,
                  marginBottom: 10,
                }}>{scrambledTitle}</h1>
                <div style={{
                  height: 2, width: 44, background: "linear-gradient(90deg, #D4AF37, transparent)",
                  transformOrigin: "left",
                  animation: mounted ? "lineDraw 0.6s 0.6s ease both" : "none",
                  transform: "scaleX(0)", marginBottom: 10,
                }} />
                <p style={{ color: "#3A4D60", fontSize: "0.85rem", lineHeight: 1.6 }}>
                  Enter your judicial credentials to access your account
                </p>
              </div>

              {/* Glass card */}
              <div style={{
                position: "relative", borderRadius: 16,
                background: "rgba(8,14,28,0.5)",
                border: "1px solid rgba(212,175,55,0.1)",
                padding: "28px 24px",
                backdropFilter: "blur(20px)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,175,55,0.07)",
              }}>
                <div className="scan-container"><div className="scan-line" /></div>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
                  {/* Email */}
                  <div style={{ animation: mounted ? "revealUp 0.5s 0.5s ease both" : "none", opacity: 0 }}>
                    <label style={lbl}>Email Address</label>
                    <div className="field-wrap">
                      <input type="email" className="field-input"
                        placeholder="Enter your email"
                        value={form.email}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                      <span className="field-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22,6 L12,13 L2,6" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ animation: mounted ? "revealUp 0.5s 0.6s ease both" : "none", opacity: 0 }}>
                    <label style={lbl}>Password</label>
                    <div className="field-wrap">
                      <input type="password" className="field-input"
                        placeholder="Enter password"
                        value={form.password}
                        onFocus={() => setFocusedField("pw")}
                        onBlur={() => setFocusedField(null)}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                      <span className="field-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7,11 V7 a5,5 0 0 1 10,0 v4" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Remember / Forgot */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    animation: mounted ? "revealUp 0.5s 0.65s ease both" : "none", opacity: 0,
                  }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 9, color: "#3A4D60", fontSize: "0.82rem", cursor: "pointer" }}>
                      <input type="checkbox" style={{ width: 14, height: 14, accentColor: "#D4AF37" }} />
                      Remember device
                    </label>
                    <span style={{ color: "#D4AF37", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em" }}>
                      Forgot Password?
                    </span>
                  </div>

                  {/* Submit */}
                  <div style={{ animation: mounted ? "revealUp 0.5s 0.7s ease both" : "none", opacity: 0, paddingTop: 4 }}>
                    <button type="submit" className={`login-btn${loading ? " loading" : ""}`}>
                      {loading ? "Authenticating..." : "Access Dashboard →"}
                    </button>
                    <p style={{
                      textAlign: "center", marginTop: 8, fontSize: "0.67rem", color: "#1E2D3D",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7,11 V7 a5,5 0 0 1 10,0 v4" />
                      </svg>
                      Protected by AES-256 encryption
                    </p>
                  </div>
                </form>
              </div>

              {/* Divider */}
              <div className="divider" style={{ margin: "20px 0", animation: mounted ? "revealUp 0.5s 0.75s ease both" : "none", opacity: 0 }}>
                <span>or continue with</span>
              </div>

              {/* Alt login */}
              <div style={{ animation: mounted ? "revealUp 0.5s 0.8s ease both" : "none", opacity: 0 }}>
                <button className="alt-btn">
                  Login with Digital India (Meri Pehchaan)
                </button>
              </div>

              <p style={{
                textAlign: "center", color: "#2A3A4A", fontSize: "0.85rem", marginTop: 20,
                animation: mounted ? "revealUp 0.5s 0.85s ease both" : "none", opacity: 0,
              }}>
                New to E-Court?{" "}
                <Link to="/signup" style={{ color: "#D4AF37", fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>
                  Register Now
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

export default Login;