import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const API_BASE = api?.defaults?.baseURL || "http://127.0.0.1:8000/api";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");
const CASE_CATEGORIES = ["Criminal", "Civil", "Property", "Cyber Crime", "Family", "Consumer", "Corporate"];
const JURISDICTIONS = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad"];

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function resolveLawyerImage(pathOrUrl, fallbackName = "Tushar") {
  if (!pathOrUrl) return `${BACKEND_BASE}/images/${encodeURIComponent(fallbackName)}.png`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const clean = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${BACKEND_BASE}${clean}`;
}

function StepPill({ active, done, children }) {
  return (
    <div className={classNames("flex items-center gap-2 rounded-full border px-3 py-1 text-sm", active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600", done ? "ring-1 ring-emerald-200" : "")}>
      <span className={classNames("h-2.5 w-2.5 rounded-full", done ? "bg-emerald-500" : active ? "bg-blue-600" : "bg-slate-300")} />
      {children}
    </div>
  );
}

function Input(props) {
  return <input {...props} className={classNames("w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100", props.className)} />;
}

function Textarea(props) {
  return <textarea {...props} className={classNames("w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100", props.className)} />;
}

function Select(props) {
  return <select {...props} className={classNames("w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100", props.className)} />;
}

function UploadBox({ title, hint, files, progressMap, onFiles, onRemove }) {
  const onDrop = (e) => {
    e.preventDefault();
    onFiles(Array.from(e.dataTransfer.files || []));
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500">{hint}</p>
      <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/60 px-3 py-6 text-sm font-semibold text-blue-700">
        Drop files here or click to upload
        <input type="file" className="hidden" multiple onChange={(e) => onFiles(Array.from(e.target.files || []))} />
      </label>
      <div className="mt-3 space-y-2">
        {files.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-200 p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">{f.file.name}</p>
                <p className="text-xs text-slate-500">{Math.round((f.file.size || 0) / 1024)} KB</p>
              </div>
              <button type="button" className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700" onClick={() => onRemove(f.id)}>Remove</button>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${progressMap[f.id] || 0}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const LAWYERS = [
  {
    id: "jagdishwar",
    name: "Jagdishwar Mishra",
    role: "Senior Advocate",
    photo_url: "/images/Jagdishwar_Mishra.png",
    fee: 999,
    rating: 4.9,
    experience: "15+ yrs",
    totalCases: 1200,
    winPct: "84%",
    languages: "Hindi, English",
    courtExpertise: "High Court, Supreme Court",
    badge: "Available",
    specializations: ["Criminal Law", "Constitutional Law"],
    education: "LL.M, National Law University",
    practiceAreas: "Criminal, PIL, Constitutional",
    recentCases: "Won 3 high-profile constitutional matters",
    reviews: "4.9 from 420+ client reviews",
    consultation: ["Video", "Audio", "Physical"],
  },
  {
    id: "jagdish",
    name: "Jagdish Tyagi",
    role: "Advocate",
    photo_url: "/images/Jagdish_Tyagi.png",
    fee: 1499,
    rating: 4.7,
    experience: "10+ yrs",
    totalCases: 940,
    winPct: "80%",
    languages: "Hindi, English",
    courtExpertise: "District Court, Consumer Forum",
    badge: "Available",
    specializations: ["Civil Law", "Consumer Cases"],
    education: "LL.B, Delhi University",
    practiceAreas: "Civil, Consumer, Claims",
    recentCases: "Secured favorable settlement in 70+ disputes",
    reviews: "4.7 from 300+ client reviews",
    consultation: ["Video", "Audio", "Physical"],
  },
  {
    id: "rahman",
    name: "Rahman Dakaait",
    role: "Criminal Law Expert",
    photo_url: "/images/Rahman_Dakaait.png",
    fee: 1999,
    rating: 4.8,
    experience: "12+ yrs",
    totalCases: 1100,
    winPct: "82%",
    languages: "Hindi, English, Urdu",
    courtExpertise: "Sessions Court, High Court",
    badge: "Available",
    specializations: ["Criminal Defense", "Fraud Cases"],
    education: "LL.M, Aligarh Muslim University",
    practiceAreas: "Criminal Defense, Fraud, Bail",
    recentCases: "Handled complex fraud trial acquittals",
    reviews: "4.8 from 360+ client reviews",
    consultation: ["Video", "Audio", "Physical"],
    popular: true,
  },
  {
    id: "tushar",
    name: "Tushar",
    role: "Junior Advocate",
    photo_url: "/images/Tushar.png",
    fee: 2499,
    rating: 4.5,
    experience: "3+ yrs",
    totalCases: 210,
    winPct: "74%",
    languages: "Hindi, English",
    courtExpertise: "District Court",
    badge: "Available",
    specializations: ["Legal Research", "Drafting"],
    education: "B.A. LL.B",
    practiceAreas: "Drafting, Corporate Basics, Research",
    recentCases: "Supported 120+ detailed legal filings",
    reviews: "4.5 from 130+ client reviews",
    consultation: ["Video", "Audio", "Physical"],
  },
];

export default function CreateCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [expandedLawyer, setExpandedLawyer] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    caseTitle: "",
    caseCategory: "Criminal",
    caseDescription: "",
    incidentDate: "",
    opponentName: "",
    jurisdiction: "Delhi",
    emergency: false,
    declarationAccepted: false,
    signature: "",
  });

  const [uploadBuckets, setUploadBuckets] = useState({
    firCopy: [],
    idProof: [],
    supporting: [],
    media: [],
    pdfEvidence: [],
  });
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
      }, 120);
    });
  };

  const removeFile = (bucket, id) => {
    setUploadBuckets((p) => ({ ...p, [bucket]: p[bucket].filter((x) => x.id !== id) }));
    setUploadProgress((p) => ({ ...p, [id]: undefined }));
  };

  const validateStep1 = () => {
    if (!form.fullName.trim()) return "Full Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone Number is required.";
    if (!form.address.trim()) return "Address is required.";
    if (!form.caseTitle.trim()) return "Case Title is required.";
    if (!form.caseDescription.trim() || form.caseDescription.trim().length < 30) return "Case description should be at least 30 characters.";
    if (!form.incidentDate) return "Incident Date is required.";
    if (!form.opponentName.trim()) return "Opponent Name is required.";
    if (!uploadBuckets.idProof.length) return "Aadhaar/ID Proof is required.";
    if (!form.declarationAccepted) return "Please accept declaration.";
    if (!form.signature.trim()) return "Digital signature is required.";
    return "";
  };

  const goStep2 = () => {
    setError("");
    const msg = validateStep1();
    if (msg) {
      setError(msg);
      return;
    }
    setStep(2);
  };

  const goStep3 = async () => {
    if (!selectedLawyer) {
      setError("Please select a lawyer.");
      return;
    }
    setError("");
    setLoadingSlots(true);
    try {
      const res = await api.get("/slots", { params: { lawyer_id: selectedLawyer.id } });
      const all = res.data.data || [];
      setSlots(all);
      setSelectedDate(all[0]?.date || "");
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const reserveSlot = async (slot) => {
    setError("");
    setSelectedSlot(slot);
    setBookingId(null);
    try {
      const res = await api.post("/book-slot", { lawyer_id: selectedLawyer.id, slot_time: slot.slot_time });
      setBookingId(res.data.data?._id || res.data.data?.id);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not book slot.");
    }
  };

  const submitCase = async () => {
    if (!bookingId) {
      setError("Please select and reserve a slot first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      const isCriminal = form.caseCategory.toLowerCase().includes("criminal") || form.caseCategory.toLowerCase().includes("cyber");

      fd.append("case_type", isCriminal ? "Criminal" : "Civil");
      fd.append("category", form.caseCategory);
      fd.append("jurisdiction", form.jurisdiction);
      fd.append("complainant", JSON.stringify({
        full_name: form.fullName,
        parent_name: "Not Provided",
        address_permanent: form.address,
        address_current: form.address,
        phone: form.phone,
        email: form.email,
        occupation: "Not Provided",
      }));
      fd.append("accused", JSON.stringify({
        name: form.opponentName,
        address: "Not Provided",
        contact_info: "Not Provided",
        relationship: "Legal Opponent",
      }));
      fd.append("incident", JSON.stringify({
        date: form.incidentDate,
        time: "10:00",
        location: form.jurisdiction,
        description: `${form.caseTitle}. ${form.caseDescription}`,
      }));
      fd.append("witnesses", JSON.stringify([]));
      fd.append("relief_requested", form.emergency ? `${form.caseDescription}\n\n[Urgent Legal Assistance Requested]` : form.caseDescription);
      fd.append("declaration", JSON.stringify({ accepted: form.declarationAccepted, signature: form.signature }));
      fd.append("lawyer_id", selectedLawyer.id);
      fd.append("booking_id", bookingId);

      fd.append("id_proof", uploadBuckets.idProof[0].file);
      [...uploadBuckets.firCopy, ...uploadBuckets.supporting, ...uploadBuckets.media, ...uploadBuckets.pdfEvidence].forEach((x) => fd.append("evidence[]", x.file));

      const res = await api.post("/create-case", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(res.data.data);
    } catch (e) {
      const firstError = e?.response?.data?.errors ? Object.values(e.response.data.errors)[0]?.[0] : null;
      setError(firstError || e?.response?.data?.message || "Could not submit case.");
    } finally {
      setSubmitting(false);
    }
  };

  const groupedDates = useMemo(() => {
    const map = new Map();
    slots.forEach((s) => {
      const arr = map.get(s.date) || [];
      arr.push(s);
      map.set(s.date, arr);
    });
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
  }, [slots]);
  const dateSlots = useMemo(() => groupedDates.find((d) => d.date === selectedDate)?.items || [], [groupedDates, selectedDate]);

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-emerald-50 p-4 text-emerald-900">
            <p className="text-lg font-bold">Case submitted successfully</p>
            <p className="mt-1 text-sm">Tracking Case ID</p>
            <p className="mt-2 text-2xl font-extrabold">{success.case_number}</p>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white" onClick={() => navigate("/dashboard")}>Go to Dashboard</button>
            <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold" onClick={() => window.location.reload()}>Create Another Case</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Create Case</h1>
            <p className="text-sm text-slate-600">Digital premium filing flow for citizens.</p>
          </div>
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold" onClick={() => navigate("/dashboard")}>Back</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <StepPill active={step === 1} done={step > 1}>Step 1 • Case Details</StepPill>
          <StepPill active={step === 2} done={step > 2}>Step 2 • Select Lawyer</StepPill>
          <StepPill active={step === 3} done={false}>Step 3 • Book Time Slot</StepPill>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

        {step === 1 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur">
                <h2 className="text-lg font-extrabold text-slate-900">Personal Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input placeholder="Full Name" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
                  <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  <Input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                  <Input placeholder="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
                </div>
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur">
                <h2 className="text-lg font-extrabold text-slate-900">Case Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input placeholder="Case Title" value={form.caseTitle} onChange={(e) => setForm((p) => ({ ...p, caseTitle: e.target.value }))} />
                  <Select value={form.caseCategory} onChange={(e) => setForm((p) => ({ ...p, caseCategory: e.target.value }))}>
                    {CASE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </Select>
                  <Input type="date" value={form.incidentDate} onChange={(e) => setForm((p) => ({ ...p, incidentDate: e.target.value }))} />
                  <Input placeholder="Opponent Name" value={form.opponentName} onChange={(e) => setForm((p) => ({ ...p, opponentName: e.target.value }))} />
                  <Select value={form.jurisdiction} onChange={(e) => setForm((p) => ({ ...p, jurisdiction: e.target.value }))}>
                    {JURISDICTIONS.map((j) => <option key={j}>{j}</option>)}
                  </Select>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3">
                    <label className="text-sm font-semibold text-slate-700">Need urgent legal assistance?</label>
                    <input type="checkbox" checked={form.emergency} onChange={(e) => setForm((p) => ({ ...p, emergency: e.target.checked }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Textarea rows={4} placeholder="Case Description" value={form.caseDescription} onChange={(e) => setForm((p) => ({ ...p, caseDescription: e.target.value }))} />
                  </div>
                </div>
                {form.emergency ? (
                  <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3">
                    <p className="font-bold text-rose-700">Emergency Case Badge Enabled</p>
                    <p className="text-sm text-rose-600">Priority fee may apply during final billing.</p>
                  </div>
                ) : null}
              </section>

              <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur">
                <h2 className="text-lg font-extrabold text-slate-900">Evidence & Documents Upload</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <UploadBox title="FIR Copy" hint="PDF / Image" files={uploadBuckets.firCopy} progressMap={uploadProgress} onFiles={(f) => addFilesToBucket("firCopy", f)} onRemove={(id) => removeFile("firCopy", id)} />
                  <UploadBox title="Aadhaar / ID Proof" hint="Required" files={uploadBuckets.idProof} progressMap={uploadProgress} onFiles={(f) => addFilesToBucket("idProof", f)} onRemove={(id) => removeFile("idProof", id)} />
                  <UploadBox title="Supporting Documents" hint="Court papers, notices" files={uploadBuckets.supporting} progressMap={uploadProgress} onFiles={(f) => addFilesToBucket("supporting", f)} onRemove={(id) => removeFile("supporting", id)} />
                  <UploadBox title="Images / Videos" hint="Visual evidence" files={uploadBuckets.media} progressMap={uploadProgress} onFiles={(f) => addFilesToBucket("media", f)} onRemove={(id) => removeFile("media", id)} />
                  <UploadBox title="PDF Evidence" hint="Supplementary PDFs" files={uploadBuckets.pdfEvidence} progressMap={uploadProgress} onFiles={(f) => addFilesToBucket("pdfEvidence", f)} onRemove={(id) => removeFile("pdfEvidence", id)} />
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur">
                <p className="text-sm font-bold text-slate-800">Declaration</p>
                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.declarationAccepted} onChange={(e) => setForm((p) => ({ ...p, declarationAccepted: e.target.checked }))} />
                    I certify that all details are true.
                  </label>
                  <Input placeholder="Digital Signature (type name)" value={form.signature} onChange={(e) => setForm((p) => ({ ...p, signature: e.target.value }))} />
                </div>
              </section>
              <section className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-xl backdrop-blur">
                <p className="text-sm font-bold text-slate-800">Proceed</p>
                <p className="mt-1 text-sm text-slate-600">Move to lawyer selection.</p>
                <button className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white" onClick={goStep2}>
                  Continue to Step 2
                </button>
              </section>
            </aside>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-xl">
            <div className="rounded-t-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">Select Lawyer</h2>
                  <p className="text-sm text-blue-100">BookMyShow-style verified legal experts</p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold" onClick={() => setStep(1)}>Back</button>
                  <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 disabled:opacity-50" onClick={goStep3} disabled={!selectedLawyer || loadingSlots}>
                    {loadingSlots ? "Loading..." : "Continue"}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {LAWYERS.map((l) => {
                  const active = selectedLawyer?.id === l.id;
                  const expanded = expandedLawyer === l.id;
                  return (
                    <article key={l.id} className={classNames("relative overflow-hidden rounded-2xl border bg-white shadow-lg transition-all hover:scale-[1.02]", active ? "border-blue-500 shadow-blue-100 ring-2 ring-blue-200" : "border-slate-200")}>
                      {l.popular ? <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2 py-1 text-[10px] font-bold text-white">Most Popular</span> : null}
                      <div className="bg-slate-100/80 px-4 py-5">
                        <div className="mx-auto h-44 w-44 overflow-hidden rounded-full border-4 border-white shadow-md">
                          <img src={resolveLawyerImage(l.photo_url, l.name)} alt={l.name} className="h-full w-full object-cover object-top" />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-extrabold text-slate-900">{l.name}</p>
                            <p className="text-sm text-slate-600">{l.role}</p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{l.badge}</span>
                        </div>
                        <div className="mt-2 text-sm text-slate-700">⭐ {l.rating} • {l.experience} • {l.totalCases}+ cases • {l.winPct} win</div>
                        <p className="mt-1 text-xs text-slate-500">{l.languages} • {l.courtExpertise}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {l.specializations.map((s) => <span key={s} className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">{s}</span>)}
                        </div>
                        <div className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-center">
                          <p className="text-xs text-blue-700">Consultation Fee</p>
                          <p className="text-lg font-extrabold text-blue-800">₹{l.fee}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedLawyer(l)}
                          className={classNames("mt-3 w-full rounded-xl px-4 py-2.5 text-sm font-extrabold", active ? "bg-blue-600 text-white" : "bg-slate-900 text-white")}
                        >
                          {active ? "Selected Lawyer" : "Select Lawyer"}
                        </button>
                        <div className="mt-2 flex gap-2">
                          <button className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold" onClick={() => setExpandedLawyer(expanded ? null : l.id)}>View Full Profile</button>
                          <button className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700" onClick={() => alert("Chat will open in Messages section after case acceptance.")}>Chat Before Booking</button>
                        </div>
                        {expanded ? (
                          <div className="mt-3 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                            <p><span className="font-bold">Education:</span> {l.education}</p>
                            <p><span className="font-bold">Practice Areas:</span> {l.practiceAreas}</p>
                            <p><span className="font-bold">Recent Success:</span> {l.recentCases}</p>
                            <p><span className="font-bold">Reviews:</span> {l.reviews}</p>
                            <p><span className="font-bold">Consultation:</span> {l.consultation.join(", ")}</p>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Book Time Slot</h2>
                  <p className="text-sm text-slate-600">Choose date and time like BookMyShow.</p>
                </div>
                <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-semibold" onClick={() => setStep(2)}>Back</button>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {groupedDates.map((d, idx) => {
                  const label = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : new Date(`${d.date}T00:00:00`).toLocaleDateString();
                  const availCount = d.items.filter((x) => !x.is_booked).length;
                  const active = d.date === selectedDate;
                  return (
                    <button key={d.date} className={classNames("min-w-[140px] rounded-xl border px-3 py-2 text-left", active ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white")} onClick={() => setSelectedDate(d.date)}>
                      <p className="text-sm font-bold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-600">{d.date}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">{availCount} slots available</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                {dateSlots.map((slot) => {
                  const active = selectedSlot?.slot_time === slot.slot_time;
                  return (
                    <button
                      key={slot.slot_time}
                      type="button"
                      disabled={slot.is_booked}
                      onClick={() => reserveSlot(slot)}
                      className={classNames(
                        "rounded-xl border px-3 py-3 text-sm font-bold transition",
                        slot.is_booked ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50",
                        active ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200" : ""
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{slot.time}</span>
                        {active ? <span>✔</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="space-y-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
                <p className="text-sm font-bold text-slate-800">Selected Lawyer</p>
                <div className="mt-2 flex items-center gap-3">
                  <img src={resolveLawyerImage(selectedLawyer?.photo_url, selectedLawyer?.name)} alt="" className="h-11 w-11 rounded-full border border-slate-200 object-cover" />
                  <div>
                    <p className="font-bold text-slate-900">{selectedLawyer?.name}</p>
                    <p className="text-xs text-slate-600">{selectedLawyer?.role}</p>
                  </div>
                </div>
              </section>
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">
                <p className="text-sm font-bold text-slate-800">Booking Status</p>
                <div className="mt-2 text-sm text-slate-700">
                  {bookingId ? (
                    <>
                      <p className="font-semibold text-emerald-700">Slot confirmed</p>
                      <p className="mt-1">Booking ID: <span className="font-mono text-xs">{bookingId}</span></p>
                      <p className="mt-1">Time: <span className="font-semibold">{selectedSlot?.date} {selectedSlot?.time}</span></p>
                    </>
                  ) : (
                    <p>Select an available slot to continue.</p>
                  )}
                </div>
                <button className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60" onClick={submitCase} disabled={submitting || !bookingId}>
                  {submitting ? "Submitting..." : "Submit Case"}
                </button>
              </section>
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}

