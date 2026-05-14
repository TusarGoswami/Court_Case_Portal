import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearSession } from "../services/auth";
import "../App.css";

const API_BASE = api?.defaults?.baseURL || "http://127.0.0.1:8000/api";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");
const CASE_CATEGORIES = ["Criminal", "Civil", "Property", "Cyber Crime", "Family", "Consumer", "Corporate"];
const JURISDICTIONS = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad"];

/* ── Ambient Background (Reused from Dashboard) ── */
const PARTICLES = [
  { x: 10, y: 20, s: 2, d: 8, delay: 0 },
  { x: 40, y: 50, s: 3, d: 9, delay: 1 },
  { x: 70, y: 15, s: 2, d: 7, delay: 0.5 },
  { x: 90, y: 60, s: 4, d: 10, delay: 2 },
  { x: 20, y: 80, s: 2, d: 6, delay: 1.5 },
];

function FilingParticles() {
  return (
    <div className="dash-particles" style={{ position: 'fixed' }}>
      {PARTICLES.map((p, i) => (
        <div key={i} className="dash-particle" style={{
          width: p.s, height: p.s,
          left: `${p.x}%`, top: `${p.y}%`,
          animation: `dashParticleFloat ${p.d}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      <div className="dash-light-sweep" />
      <div className="dash-diagonal-ray" />
    </div>
  );
}

function FilingJudicialSeal() {
  return (
    <svg className="dash-judicial-seal" style={{ position: 'fixed', opacity: 0.02, right: '-10%', top: '10%', width: '600px', color: 'var(--primary)' }} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <text x="100" y="155" textAnchor="middle" fill="currentColor" fontSize="6" fontFamily="'Cinzel', serif" letterSpacing="0.2em">JUSTITIA</text>
    </svg>
  );
}

/* ── UI Components ── */
function StepRibbon({ steps, currentStep }) {
  return (
    <div className="progress-ribbon" style={{ marginBottom: '24px', justifyContent: 'center' }}>
      {steps.map((s, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        return (
          <span key={s} style={{ display: "contents" }}>
            {i > 0 && <span className={`ribbon-connector ${done ? "done" : active ? "active" : ""}`} />}
            <span className={`ribbon-stage ${done ? "done" : active ? "active" : ""}`} style={{ cursor: 'default' }}>
              <span className="ribbon-stage-icon">{done ? "✓" : stepNum}</span>
              {s}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function FilingInput({ label, error, ...props }) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input {...props} className={`auth-input ${error ? 'error' : ''}`} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
}

function FilingSelect({ label, options, ...props }) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <select {...props} className="auth-input" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
        {options.map(o => <option key={o} value={o} style={{ background: '#0B132B' }}>{o}</option>)}
      </select>
    </div>
  );
}

function FilingTextarea({ label, ...props }) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <textarea {...props} className="auth-input" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', minHeight: '120px', resize: 'vertical' }} />
    </div>
  );
}

function FilingUploadBox({ title, hint, files, progressMap, onFiles, onRemove }) {
  const onDrop = (e) => { e.preventDefault(); onFiles(Array.from(e.dataTransfer.files || [])); };
  return (
    <div className="kpi-card" style={{ padding: '20px', background: 'rgba(30,37,65,0.4)', cursor: 'default' }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <h4 style={{ color: 'var(--primary)', marginBottom: '4px', fontSize: '0.95rem' }}>{title}</h4>
      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '12px' }}>{hint}</p>
      <label className="sidebar-shortcut" style={{ borderStyle: 'dashed', justifyContent: 'center', padding: '20px', background: 'rgba(212,175,55,0.03)' }}>
        <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>📁</span> Drop files or click
        <input type="file" className="hidden" multiple onChange={(e) => onFiles(Array.from(e.target.files || []))} />
      </label>
      <div className="mt-3" style={{ display: 'grid', gap: '8px' }}>
        {files.map((f) => (
          <div key={f.id} className="activity-item" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file.name}</p>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary)', width: `${progressMap[f.id] || 0}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
            <button type="button" style={{ color: '#fca5a5', fontSize: '0.7rem', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => onRemove(f.id)}>REMOVE</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const LAWYERS = [
  { id: "jagdishwar", name: "Jagdishwar Mishra", role: "Senior Advocate", photo_url: "/images/Jagdishwar_Mishra.png", fee: 999, rating: 4.9, experience: "15+ yrs", totalCases: 1200, winPct: "84%", specializations: ["Criminal", "Constitutional"], education: "LL.M, NLU" },
  { id: "jagdish", name: "Jagdish Tyagi", role: "Advocate", photo_url: "/images/Jagdish_Tyagi.png", fee: 1499, rating: 4.7, experience: "10+ yrs", totalCases: 940, winPct: "80%", specializations: ["Civil", "Consumer"], education: "LL.B, DU" },
  { id: "rahman", name: "Rahman Dakaait", role: "Criminal Expert", photo_url: "/images/Rahman_Dakaait.png", fee: 1999, rating: 4.8, experience: "12+ yrs", totalCases: 1100, winPct: "82%", specializations: ["Criminal", "Fraud"], education: "LL.M, AMU", popular: true },
  { id: "tushar", name: "Tushar", role: "Junior Advocate", photo_url: "/images/Tushar.png", fee: 2499, rating: 4.5, experience: "3+ yrs", totalCases: 210, winPct: "74%", specializations: ["Research", "Drafting"], education: "B.A. LL.B" },
];

function resolveLawyerImage(pathOrUrl, fallbackName = "Tushar") {
  if (!pathOrUrl) return `${BACKEND_BASE}/images/${encodeURIComponent(fallbackName)}.png`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const clean = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${BACKEND_BASE}${clean}`;
}

export default function CreateCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", caseTitle: "", caseCategory: "Criminal", caseDescription: "", incidentDate: "", opponentName: "", jurisdiction: "Delhi", emergency: false, declarationAccepted: false, signature: "" });
  const [uploadBuckets, setUploadBuckets] = useState({ firCopy: [], idProof: [], supporting: [], media: [], pdfEvidence: [] });
  const [uploadProgress, setUploadProgress] = useState({});

  const addFilesToBucket = (bucket, files) => {
    const entries = files.map((file) => ({ id: `${Date.now()}-${Math.random()}`, file }));
    setUploadBuckets((p) => ({ ...p, [bucket]: [...p[bucket], ...entries] }));
    entries.forEach((entry) => {
      let pct = 0;
      const tick = setInterval(() => {
        pct += 20;
        setUploadProgress((prev) => ({ ...prev, [entry.id]: Math.min(100, pct) }));
        if (pct >= 100) clearInterval(tick);
      }, 100);
    });
  };

  const removeFile = (bucket, id) => {
    setUploadBuckets((p) => ({ ...p, [bucket]: p[bucket].filter((x) => x.id !== id) }));
    setUploadProgress((p) => ({ ...p, [id]: undefined }));
  };

  const validateStep1 = () => {
    if (!form.fullName.trim()) return "Full Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone is required.";
    if (!form.caseTitle.trim()) return "Case Title is required.";
    if (!form.caseDescription.trim() || form.caseDescription.length < 30) return "Provide a detailed case description (min 30 chars).";
    if (!uploadBuckets.idProof.length) return "Identity proof (Aadhaar/ID) is mandatory.";
    if (!form.declarationAccepted) return "Please accept the legal declaration.";
    if (!form.signature.trim()) return "Digital signature is required.";
    return "";
  };

  const goStep2 = () => {
    const msg = validateStep1();
    if (msg) { setError(msg); return; }
    setError("");
    setStep(2);
  };

  const goStep3 = async () => {
    if (!selectedLawyer) { setError("Select a legal expert to proceed."); return; }
    setLoadingSlots(true);
    try {
      const res = await api.get("/slots", { params: { lawyer_id: selectedLawyer.id } });
      const all = res.data.data || [];
      setSlots(all);
      setSelectedDate(all[0]?.date || "");
      setStep(3);
    } catch (e) { setError("Could not load availability."); } finally { setLoadingSlots(false); }
  };

  const reserveSlot = async (slot) => {
    setSelectedSlot(slot);
    setBookingId(null);
    try {
      const res = await api.post("/book-slot", { lawyer_id: selectedLawyer.id, slot_time: slot.slot_time });
      setBookingId(res.data.data?._id || res.data.data?.id);
    } catch (e) { setError("Slot booking failed."); }
  };

  const submitCase = async () => {
    if (!bookingId) return setError("Please confirm a time slot first.");
    setSubmitting(true);
    try {
      const fd = new FormData();
      const isCriminal = form.caseCategory.toLowerCase().includes("criminal") || form.caseCategory.toLowerCase().includes("cyber");
      fd.append("case_type", isCriminal ? "Criminal" : "Civil");
      fd.append("category", form.caseCategory);
      fd.append("jurisdiction", form.jurisdiction);
      fd.append("complainant", JSON.stringify({ full_name: form.fullName, address_permanent: form.address, phone: form.phone, email: form.email }));
      fd.append("accused", JSON.stringify({ name: form.opponentName }));
      fd.append("incident", JSON.stringify({ date: form.incidentDate, description: `${form.caseTitle}. ${form.caseDescription}` }));
      fd.append("relief_requested", form.caseDescription);
      fd.append("declaration", JSON.stringify({ accepted: form.declarationAccepted, signature: form.signature }));
      fd.append("lawyer_id", selectedLawyer.id);
      fd.append("booking_id", bookingId);
      fd.append("id_proof", uploadBuckets.idProof[0].file);
      [...uploadBuckets.firCopy, ...uploadBuckets.supporting, ...uploadBuckets.media, ...uploadBuckets.pdfEvidence].forEach(x => fd.append("evidence[]", x.file));
      const res = await api.post("/create-case", fd);
      setSuccess(res.data.data);
    } catch (e) { setError(e?.response?.data?.message || "Submission failed."); } finally { setSubmitting(false); }
  };

  const groupedDates = useMemo(() => {
    const map = new Map();
    slots.forEach(s => { const arr = map.get(s.date) || []; arr.push(s); map.set(s.date, arr); });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [slots]);

  if (success) {
    return (
      <div className="dashboard-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FilingParticles />
        <div className="parchment-panel" style={{ width: 'min(600px, 95vw)', textAlign: 'center', zIndex: 10 }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Case Filed Successfully</h2>
          <div className="activity-item" style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid var(--primary)', padding: '24px', borderRadius: '16px', display: 'block' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Official Case Tracking Number</p>
            <p style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)', fontFamily: 'Cinzel, serif', margin: '12px 0' }}>{success.case_number}</p>
            <p style={{ color: 'var(--text)', opacity: 0.8 }}>Your case has been recorded in the digital archives. A lawyer will review your submission shortly.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
            <button className="theme-btn active" style={{ padding: '12px 24px' }} onClick={() => navigate("/dashboard")}>GO TO DASHBOARD</button>
            <button className="theme-btn" style={{ padding: '12px 24px', border: '1px solid var(--border)' }} onClick={() => window.location.reload()}>FILE ANOTHER CASE</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ display: 'block', overflowY: 'auto' }}>
      <FilingParticles />
      <FilingJudicialSeal />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 5 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: '2.5rem', color: 'var(--primary)', letterSpacing: '0.05em' }}>DIGITAL CASE FILING</h1>
            <p style={{ color: 'var(--muted)', letterSpacing: '0.1em', fontSize: '0.8rem', textTransform: 'uppercase' }}>Judicial Submission Portal — Citizen Service</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="ghost-btn" style={{ color: 'var(--text)', opacity: 0.7 }} onClick={() => navigate("/dashboard")}>← BACK TO DASHBOARD</button>
            <button className="ghost-btn logout" style={{ color: '#ff4d4d', opacity: 0.9, borderColor: 'rgba(255,77,77,0.2)' }} onClick={handleLogout}>🚪 LOGOUT</button>
          </div>
        </header>

        <StepRibbon steps={["CASE DETAILS", "LEGAL EXPERT", "CONFIRM SLOT"]} currentStep={step} />

        {error && <div className="activity-item" style={{ background: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.2)', color: '#fca5a5', marginBottom: '24px', padding: '12px 20px' }}>⚠️ {error}</div>}

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '24px' }}>
              <section className="panel" style={{ background: 'rgba(30,37,65,0.4)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', padding: '32px' }}>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', marginBottom: '24px' }}>Part I: Petitioner Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <FilingInput label="Full Legal Name" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
                  <FilingInput label="Email Address" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  <FilingInput label="Phone Number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  <FilingInput label="Current Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </section>

              <section className="panel" style={{ background: 'rgba(30,37,65,0.4)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', padding: '32px' }}>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', marginBottom: '24px' }}>Part II: Incident & Case Particulars</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <FilingInput label="Case Title / Subject" value={form.caseTitle} onChange={e => setForm(p => ({ ...p, caseTitle: e.target.value }))} />
                  <FilingSelect label="Case Category" options={CASE_CATEGORIES} value={form.caseCategory} onChange={e => setForm(p => ({ ...p, caseCategory: e.target.value }))} />
                  <FilingInput label="Date of Incident" type="date" value={form.incidentDate} onChange={e => setForm(p => ({ ...p, incidentDate: e.target.value }))} />
                  <FilingInput label="Opponent Name" value={form.opponentName} onChange={e => setForm(p => ({ ...p, opponentName: e.target.value }))} />
                  <FilingSelect label="Court Jurisdiction" options={JURISDICTIONS} value={form.jurisdiction} onChange={e => setForm(p => ({ ...p, jurisdiction: e.target.value }))} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input type="checkbox" checked={form.emergency} onChange={e => setForm(p => ({ ...p, emergency: e.target.checked }))} />
                    <label style={{ fontSize: '0.85rem', color: 'var(--text)' }}>Request Emergency Handling</label>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <FilingTextarea label="Factual Description of Case" value={form.caseDescription} onChange={e => setForm(p => ({ ...p, caseDescription: e.target.value }))} />
                  </div>
                </div>
              </section>

              <section className="panel" style={{ background: 'rgba(30,37,65,0.4)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', padding: '32px' }}>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', marginBottom: '24px' }}>Part III: Evidentiary Documentation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FilingUploadBox title="Identity Proof" hint="Aadhaar / Passport (Required)" files={uploadBuckets.idProof} progressMap={uploadProgress} onFiles={f => addFilesToBucket("idProof", f)} onRemove={id => removeFile("idProof", id)} />
                  <FilingUploadBox title="Supporting Evidence" hint="Images / Media" files={uploadBuckets.media} progressMap={uploadProgress} onFiles={f => addFilesToBucket("media", f)} onRemove={id => removeFile("media", id)} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <FilingUploadBox title="Legal Documents" hint="FIR, Affidavits, Notices (PDF)" files={uploadBuckets.pdfEvidence} progressMap={uploadProgress} onFiles={f => addFilesToBucket("pdfEvidence", f)} onRemove={id => removeFile("pdfEvidence", id)} />
                  </div>
                </div>
              </section>
            </div>

            <aside>
              <div className="parchment-panel" style={{ position: 'sticky', top: '20px', padding: '24px' }}>
                <h4 style={{ fontFamily: 'Cinzel, serif', marginBottom: '16px' }}>Oath & Declaration</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '16px' }}>I hereby declare that the information provided is accurate to the best of my knowledge.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input type="checkbox" checked={form.declarationAccepted} onChange={e => setForm(p => ({ ...p, declarationAccepted: e.target.checked }))} />
                  <label style={{ fontSize: '0.8rem' }}>I Accept</label>
                </div>
                <FilingInput label="Digital Signature (Full Name)" value={form.signature} onChange={e => setForm(p => ({ ...p, signature: e.target.value }))} />
                <button className="theme-btn active" style={{ width: '100%', padding: '14px', marginTop: '24px', fontSize: '0.9rem' }} onClick={goStep2}>CONTINUE TO STEP 2</button>
              </div>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="panel" style={{ background: 'rgba(30,37,65,0.4)', border: '1px solid var(--border)', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '32px' }}>
              <div>
                <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', fontSize: '1.5rem' }}>Select Legal Expert</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Verified professionals assigned to your jurisdiction.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="theme-btn" style={{ border: '1px solid var(--border)' }} onClick={() => setStep(1)}>BACK</button>
                <button className="theme-btn active" disabled={!selectedLawyer || loadingSlots} onClick={goStep3}>{loadingSlots ? "LOADING..." : "CONTINUE TO BOOKING"}</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {LAWYERS.map((l) => {
                const active = selectedLawyer?.id === l.id;
                return (
                  <div key={l.id} className="kpi-card" style={{ border: active ? '2px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.3s ease', opacity: (selectedLawyer && !active) ? 0.6 : 1 }} onClick={() => setSelectedLawyer(l)}>
                    <div style={{ height: '180px', overflow: 'hidden', borderRadius: '12px 12px 0 0', position: 'relative' }}>
                      <img src={resolveLawyerImage(l.photo_url, l.name)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 12px 12px', background: 'linear-gradient(to top, rgba(11,19,43,1), transparent)' }}>
                        <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>{l.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--primary)', letterSpacing: '0.1em' }}>{l.role.toUpperCase()}</p>
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>FEE</p>
                          <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{l.fee}</p>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>WIN RATE</p>
                          <p style={{ fontWeight: 'bold', color: '#4ade80' }}>{l.winPct}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '8px' }}>{l.specializations.join(" • ")}</p>
                      <button className={`theme-btn ${active ? 'active' : ''}`} style={{ width: '100%', fontSize: '0.75rem', padding: '8px' }}>{active ? "SELECTED" : "SELECT EXPERT"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: 24,
              alignItems: 'start'
            }}>
              {/* Main Calendar Panel */}
              <div className="panel" style={{ 
                background: 'rgba(15, 23, 42, 0.4)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(212,175,55,0.1)', 
                padding: 'clamp(20px, 3vw, 32px)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: 32 }}>
                  <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', margin: 0 }}>Schedule Consultation</h3>
                  <button className="ghost-btn" style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(212,175,55,0.05)' }} onClick={() => setStep(2)}>CHANGE LAWYER</button>
                </div>
  
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, marginBottom: 32 }}>
                  {groupedDates.map((d, idx) => {
                    const active = d.date === selectedDate;
                    return (
                      <button key={d.date} className="kpi-card" 
                        style={{ 
                          minWidth: 140, padding: 16, cursor: 'pointer', 
                          border: active ? '2px solid var(--primary)' : '1px solid var(--border)', 
                          background: active ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.2)',
                          borderRadius: 16, transition: 'all 0.3s ease'
                        }} 
                        onClick={() => setSelectedDate(d.date)}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : d.date}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{d.items.length} Slots</p>
                      </button>
                    );
                  })}
                </div>
  
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
                  {(groupedDates.find(d => d.date === selectedDate)?.items || []).map(slot => {
                    const active = selectedSlot?.slot_time === slot.slot_time;
                    return (
                      <button key={slot.slot_time} disabled={slot.is_booked} 
                        onClick={() => reserveSlot(slot)} 
                        className="theme-btn" 
                        style={{ 
                          padding: '14px', borderRadius: 12,
                          border: active ? '1px solid var(--primary)' : '1px solid var(--border)', 
                          background: active ? 'var(--primary)' : slot.is_booked ? 'transparent' : 'rgba(255,255,255,0.03)', 
                          color: active ? '#000' : slot.is_booked ? 'rgba(255,255,255,0.2)' : 'var(--text)', 
                          opacity: slot.is_booked ? 0.4 : 1,
                          fontWeight: active ? 700 : 400
                        }}>
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              </div>
  
              {/* Summary & Action Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="panel" style={{ 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(212,175,55,0.15)', 
                  padding: 24, borderRadius: 24
                }}>
                  <h4 style={{ fontFamily: 'Cinzel, serif', color: '#fff', marginBottom: 20, fontSize: '1.1rem' }}>Filing Summary</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 16 }}>
                      <p style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selected Advocate</p>
                      <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>{selectedLawyer?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 2 }}>{selectedLawyer?.role}</p>
                    </div>
  
                    {bookingId ? (
                      <div style={{ 
                        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', 
                        padding: 16, borderRadius: 16 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: '1rem' }}>✅</span>
                          <p style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 700, textTransform: 'uppercase' }}>Time Slot Secured</p>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedSlot?.date}</p>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#4ade80' }}>at {selectedSlot?.time}</p>
                      </div>
                    ) : (
                      <div style={{ 
                        background: 'rgba(212,175,55,0.05)', border: '1px dashed rgba(212,175,55,0.2)', 
                        padding: 20, borderRadius: 16, textAlign: 'center' 
                      }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Select an available time slot to finalize your judicial submission.</p>
                      </div>
                    )}
  
                    <button 
                      className="theme-btn active" 
                      disabled={submitting || !bookingId} 
                      style={{ 
                        width: '100%', padding: '18px', marginTop: 8, 
                        fontSize: '1rem', fontWeight: 700, 
                        boxShadow: bookingId ? '0 10px 30px rgba(212,175,55,0.3)' : 'none'
                      }} 
                      onClick={submitCase}
                    >
                      {submitting ? "VERIFYING..." : "CONFIRM & FILE CASE →"}
                    </button>
                    
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
                      By clicking confirm, you electronically sign and submit this case to the {form.jurisdiction} jurisdiction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

