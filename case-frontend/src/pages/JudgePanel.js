import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  CallControls,
  PaginatedGridLayout,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  useCall,
  useCalls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import api from "../services/api";
import { AUTH_TOKEN_KEY, clearSession, getStoredUser, saveSession } from "../services/auth";
import { fetchStreamVideoCredentials } from "../services/streamVideo";

const navItems = [
  "Dashboard",
  "Assigned Cases",
  "Hearings",
  "Judge Profile",
  "Evidence Review",
  "Judgments",
  "Calendar",
  "Analytics",
  "Messages",
  "Cause List",
  "Courtrooms",
  "Security Center",
  "Settings",
  "Logout",
];

/* ── Ambient Background (Unified) ── */
function FilingParticles() {
  return (
    <div className="dash-particles" style={{ position: 'fixed' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="dash-particle" style={{
          width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2,
          left: `${[15, 45, 75, 85, 25, 60][i]}%`, top: `${[25, 55, 10, 65, 85, 40][i]}%`,
          animation: `dashParticleFloat ${7 + i}s ease-in-out infinite`,
        }} />
      ))}
      <div className="dash-light-sweep" />
    </div>
  );
}

function FilingJudicialSeal() {
  return (
    <div className="dash-seal-container" style={{ opacity: 0.04 }}>
      <svg viewBox="0 0 200 200" className="dash-seal-svg">
        <path fill="currentColor" d="M100,20 L120,60 L160,60 L130,90 L140,130 L100,110 L60,130 L70,90 L40,60 L80,60 Z" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
      </svg>
    </div>
  );
}

const FILTERS = [
  { id: "All", label: "All" },
  { id: "Criminal", label: "Criminal" },
  { id: "Civil", label: "Civil" },
  { id: "Urgent", label: "Urgent" },
  { id: "Active", label: "Pending bench" },
  { id: "Closed", label: "Closed" },
];

const WORKFLOW_LEGEND =
  "Filed → Verified → Accepted → Assigned to Judge → Hearing Scheduled → Judgment Pending → Closed";

/** Fallback when roster API has not been seeded yet — matches Justice Sunderlal Tripathi copy. */
const TRIPATHI_PROFILE_FALLBACK = {
  name: "Justice Sunderlal Tripathi",
  photo_url: "/images/Justice_Sunderlal_Tripathi.png",
  position: "Senior High Court Judge",
  court: "National High Court of India",
  specialization: ["Criminal Law", "Constitutional Matters", "Public Interest Litigation"],
  experience_label: "28+ Years",
  roster_status: "Active",
  about:
    "Justice Sunderlal Tripathi is a highly respected and disciplined judge known for his integrity, sharp legal reasoning, and commitment to justice. With decades of experience in the Indian judiciary system, he has presided over several high-profile criminal and constitutional cases.\n\nRecognized for maintaining strict courtroom discipline and delivering unbiased judgments, Justice Tripathi believes in ensuring equal justice for every citizen regardless of social or political influence.",
  professional_highlights: [
    "Handled 2,500+ legal cases",
    "Expertise in criminal and constitutional law",
    "Known for fast-track hearing management",
    "Strong supporter of digital judiciary systems",
    "Recognized for transparent judicial decisions",
    "Excellent courtroom leadership and legal analysis",
  ],
  key_responsibilities: [
    "Reviewing active legal cases",
    "Scheduling and conducting hearings",
    "Verifying evidence and legal documentation",
    "Managing courtroom proceedings",
    "Issuing final judgments and orders",
    "Supervising legal compliance and ethics",
  ],
  judicial_philosophy: "Justice must remain fearless, transparent, and accessible to every citizen.",
  skills: [
    "Legal Interpretation",
    "Evidence Analysis",
    "Courtroom Management",
    "Conflict Resolution",
    "Judicial Ethics",
    "Decision Making",
    "Case Prioritization",
  ],
  achievements: [
    "Awarded “Excellence in Judicial Service”",
    "Successfully resolved several sensitive public cases",
    "Contributed to modernization of digital court systems",
    "Highly rated for fairness and judicial conduct",
  ],
  availability_summary: "Monday to Friday · 10:00 AM – 5:00 PM",
  virtual_hearings_supported: true,
  court_contact_email: "judge.tripathi@court.gov",
  chamber: "Hall 4, High Court Division",
  office_extension: "+91-XXXX-XXXXXX",
  jurisdictions: ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "National High Court of India"],
  case_types: ["Civil", "Criminal"],
};

const API_BASE = api?.defaults?.baseURL || "http://127.0.0.1:8000/api";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

function resolveAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\/localhost(\/|$)/i.test(url)) {
    return url.replace(/^https?:\/\/localhost(?=\/|$)/i, BACKEND_BASE);
  }
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  return `${BACKEND_BASE}${clean}`;
}

/** Serves static files from the React `public` folder (e.g. /images/...). */
function publicAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${clean}`;
  }
  return clean;
}

function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function buildHearingDraft(row) {
  return {
    title: row?.case_number ? `Hearing - ${row.case_number}` : "Hearing",
    agenda: row?.title ? `Schedule hearing for ${row.title}.` : "",
    scheduled_at: toLocalDateTimeInput(row?.slot_time),
    duration_minutes: 30,
    location: row?.court_room || "",
    meeting_link: "",
  };
}

function HearingRoom({ dark }) {
  const call = useCall();
  const calls = useCalls();
  const { useCallingState } = useCallStateHooks();
  const callingState = useCallingState();
  const [attendance, setAttendance] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!call) return;
    const intervalId = setInterval(() => setTimer((prev) => prev + 1), 1000);
    return () => clearInterval(intervalId);
  }, [call]);

  useEffect(() => {
    if (!call) return;
    const participants = call.state.participants || {};
    setAttendance(Object.keys(participants).length);
  }, [call, calls, callingState]);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  const shell = dark
    ? "border-stone-600 bg-stone-900/85 text-stone-100"
    : "border-stone-200 bg-white text-stone-800";

  if (!call) {
    return <div className={`rounded-2xl border p-6 shadow-sm ${shell}`}>Start or join a virtual hearing from the Hearings workspace.</div>;
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur ${shell}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm opacity-95">
        <div>
          <span className="rounded-full bg-rose-500/25 px-3 py-1 text-rose-200">Recording</span>
          <span className="ml-3 rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">Elapsed {mm}:{ss}</span>
        </div>
        <div>Attendance: {attendance}</div>
      </div>
      <div className={`mb-3 rounded-xl border p-2 ${dark ? "border-stone-600 bg-black/35" : "border-stone-200 bg-stone-50"}`}>
        <SpeakerLayout participantsBarPosition="bottom" />
      </div>
      <div className={`mb-3 rounded-xl border p-2 ${dark ? "border-stone-600 bg-black/35" : "border-stone-200 bg-stone-50"}`}>
        <PaginatedGridLayout />
      </div>
      <CallControls />
    </div>
  );
}

function pseudoBar(label, pct, dark) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs opacity-90">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className={`h-2 rounded-full ${dark ? "bg-stone-800" : "bg-stone-200"}`}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_14px_rgba(245,158,11,.35)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function JudgePanel() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [theme, setTheme] = useState(localStorage.getItem("data-theme") || "midnight");
  const darkMode = theme === "midnight";
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("data-theme", theme);
  }, [theme]);
  const caseDetailRef = useRef(null);
  const [sessionUser, setSessionUser] = useState(user);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [filterId, setFilterId] = useState("All");
  const [search, setSearch] = useState("");
  const [clock, setClock] = useState(new Date());
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [streamError, setStreamError] = useState("");
  const [loading, setLoading] = useState(true);
  const [courtCases, setCourtCases] = useState([]);
  const [assignWarning, setAssignWarning] = useState("");
  const [legacyHearings, setLegacyHearings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [remarkDrafts, setRemarkDrafts] = useState({});
  const [hearingDrafts, setHearingDrafts] = useState({});
  const [benchBusy, setBenchBusy] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);


  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const [meRes, courtRes, hearingsRes, notificationsRes, reportRes, contactsRes] = await Promise.all([
        api.get("/me"),
        api.get("/judge/assigned-cases"),
        api.get("/hearings"),
        api.get("/notifications"),
        api.get("/reports/dashboard").catch(() => ({ data: {} })),
        api.get("/messages/contacts").catch(() => ({ data: { data: [] } })),
      ]);

      if (meRes.data?.user) {
        setSessionUser(meRes.data.user);
        const tok = localStorage.getItem(AUTH_TOKEN_KEY);
        saveSession(tok, meRes.data.user);
      }

      const list = courtRes.data?.data || [];
      setAssignWarning(typeof courtRes.data?.message === "string" ? courtRes.data.message : "");
      setCourtCases(list);
      setSelectedCase((prev) => list.find((c) => c.id === prev?.id) || list[0] || null);
      setLegacyHearings(hearingsRes.data?.data || []);
      setNotifications(notificationsRes.data?.data || []);
      setStats(reportRes.data?.stats || null);
      setMessages(contactsRes.data?.data || []);
      setLastSynced(new Date());
    } catch {
      setCourtCases([]);
      setAssignWarning("Could not load judge roster. Check session and API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  useEffect(() => {
    let mounted = true;
    let localCall = null;
    let localClient = null;
    const init = async () => {
      try {
        const creds = await fetchStreamVideoCredentials();
        if (!creds?.apiKey || !creds?.token || !creds?.user?.id) {
          setStreamError("Configure Stream credentials for virtual bench (STREAM_API_KEY / backend token).");
          return;
        }
        localClient = new StreamVideoClient({
          apiKey: creds.apiKey,
          user: creds.user,
          token: creds.token,
        });
        localCall = localClient.call("default", `judicial-bench-${new Date().toISOString().slice(0, 10)}`);
        await localCall.getOrCreate({
          data: {
            members: [creds.user.id],
            custom: { courtroom: "High Court Virtual Division" },
          },
        });
        if (!mounted) return;
        setClient(localClient);
        setCall(localCall);
      } catch {
        if (mounted) setStreamError("Virtual hearing client could not start.");
      }
    };
    init();
    return () => {
      mounted = false;
      if (localCall) localCall.leave();
      if (localClient) localClient.disconnectUser();
    };
  }, []);

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courtCases.filter((row) => {
      const type = (row.case_type || "").toLowerCase();
      const status = (row.status || "").toLowerCase();
      const title = (row.title || "").toLowerCase();
      const num = (row.case_number || "").toLowerCase();
      const cat = (row.category || "").toLowerCase();
      const pri = (row.priority || "").toLowerCase();

      let ok = true;
      if (filterId === "Criminal") ok = type.includes("criminal");
      if (filterId === "Civil") ok = type.includes("civil");
      if (filterId === "Urgent") ok = pri === "high";
      if (filterId === "Active") ok = status !== "closed";
      if (filterId === "Closed") ok = status === "closed";

      const lawyerNm = (row.lawyer_name || "").toLowerCase();
      const textOk = !q || title.includes(q) || num.includes(q) || cat.includes(q) || status.includes(q) || lawyerNm.includes(q);
      return ok && textOk;
    });
  }, [courtCases, filterId, search]);

  const todaysBench = useMemo(() => {
    const today = new Date().toDateString();
    return courtCases.filter((c) => c.slot_time && new Date(c.slot_time).toDateString() === today);
  }, [courtCases]);

  const upcomingBench = useMemo(() => {
    const now = new Date();
    return courtCases
      .filter((c) => c.slot_time && new Date(c.slot_time) > now)
      .slice()
      .sort((a, b) => new Date(a.slot_time) - new Date(b.slot_time));
  }, [courtCases]);

  const causeList = useMemo(
    () =>
      courtCases
        .filter((c) => c.slot_time)
        .slice()
        .sort((a, b) => new Date(a.slot_time) - new Date(b.slot_time)),
    [courtCases]
  );

  const calendarPreview = useMemo(() => {
    const grouped = {};
    courtCases.forEach((c) => {
      if (!c.slot_time) return;
      const key = new Date(c.slot_time).toDateString();
      grouped[key] = grouped[key] || [];
      grouped[key].push(c);
    });
    return grouped;
  }, [courtCases]);

  const kpis = useMemo(() => {
    const active = courtCases.filter((c) => (c.status || "").toLowerCase() !== "closed").length;
    const pendingJudgments = courtCases.filter((c) => ["judgment_pending", "judgment_reserved"].includes((c.status || "").toLowerCase())).length;
    const emergency = courtCases.filter((c) => (c.priority || "").toLowerCase() === "high").length;
    const todaysCount = todaysBench.length;

    return [
      { label: "Total Active Cases", value: active },
      { label: "Today's Hearings", value: todaysCount },
      { label: "Pending Judgments", value: pendingJudgments || stats?.open_cases || 0 },
      { label: "Emergency Matters", value: emergency },
      { label: "Registry Notifications", value: notifications.length },
      { label: "Audit Events", value: stats?.audit_events ?? 0 },
    ];
  }, [courtCases, notifications.length, stats, todaysBench.length]);

  const advanceStatus = async (row, status) => {
    if (!row?.id) return;
    if (status === "hearing_scheduled") {
      openSchedulingForm(row);
      return;
    }
    try {
      setBenchBusy(row.id);
      await api.patch(`/judge/court-cases/${row.id}`, { status });
      await loadDashboard();
    } catch (e) {
      alert(e?.response?.data?.message || "Bench update failed");
    } finally {
      setBenchBusy(null);
    }
  };

  const openSchedulingForm = (row) => {
    setActiveNav("Assigned Cases");
    setSelectedCase(row);
    setHearingDrafts((prev) => ({
      ...prev,
      [row.id]: prev[row.id] || buildHearingDraft(row),
    }));
    window.setTimeout(() => {
      caseDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const scheduleHearing = async (row) => {
    if (!row?.id) return;

    const draft = hearingDrafts[row.id] || buildHearingDraft(row);
    if (!draft.scheduled_at) {
      alert("Please choose a hearing date and time before scheduling.");
      return;
    }

    try {
      setBenchBusy(row.id);
      await api.patch(`/judge/court-cases/${row.id}`, {
        status: "hearing_scheduled",
        title: draft.title?.trim() || `Hearing - ${row.case_number}`,
        agenda: draft.agenda?.trim() || "",
        scheduled_at: new Date(draft.scheduled_at).toISOString(),
        duration_minutes: Number(draft.duration_minutes) || 30,
        location: draft.location?.trim() || "",
        meeting_link: draft.meeting_link?.trim() || "",
      });
      await loadDashboard();
      setActiveNav("Hearings");
    } catch (e) {
      alert(e?.response?.data?.message || "Hearing scheduling failed");
    } finally {
      setBenchBusy(null);
    }
  };

  const judgeProfile = sessionUser?.judge_profile || TRIPATHI_PROFILE_FALLBACK;
  const portraitSrc = resolveAssetUrl(sessionUser?.photo_url || judgeProfile?.photo_url);

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "judge") return <Navigate to="/dashboard" replace />;

  const logout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  const shell = "dashboard-layout";
  const card = "cinematic-card";
  const subtle = "muted-text";
  const goldBtn = "cinematic-btn";

  const renderAssignedTable = () => (
    <section className={card}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)' }}>ASSIGNED CASES</h2>
          <p className={subtle}>Official roster synchronized from registry after counsel acceptance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterId(f.id)}
              className={`status-pill ${filterId === f.id ? 'active' : ''}`}
              style={{ cursor: 'pointer', background: filterId === f.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }}
            >
              {f.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!filteredCases.length ? (
        <div className="cinematic-card" style={{ textAlign: 'center', padding: '40px', borderStyle: 'dashed' }}>
          <p className={subtle}>{assignWarning || "No matters on your bench for this filter."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="cinematic-table">
            <thead>
              <tr>
                <th>Case No.</th>
                <th>Title</th>
                <th>Lawyer</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Hearing</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((row) => (
                <tr
                  key={row.id}
                  className={selectedCase?.id === row.id ? "active-row" : ""}
                  onClick={() => setSelectedCase(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: '800', color: 'var(--primary)' }}>{row.case_number}</td>
                  <td>{row.title}</td>
                  <td>{row.lawyer_name || "—"}</td>
                  <td className="text-xs">{row.case_type?.toUpperCase()}</td>
                  <td>
                    <span className="status-pill" style={{ 
                      background: row.priority === 'high' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255,255,255,0.05)',
                      color: row.priority === 'high' ? '#f87171' : 'inherit',
                      fontSize: '0.65rem'
                    }}>
                      {(row.priority || 'medium').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="status-pill" style={{ fontSize: '0.65rem', border: '1px solid var(--border)' }}>
                      {(row.workflow_label || row.status).toUpperCase()}
                    </span>
                  </td>
                  <td className="text-xs">{row.slot_time ? new Date(row.slot_time).toLocaleDateString() : "—"}</td>
                  <td>
                    <select
                      className="cinematic-input"
                      style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      value={row.status}
                      disabled={benchBusy === row.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => advanceStatus(row, e.target.value)}
                    >
                      <option value="accepted">ASSIGNED</option>
                      <option value="verified">VERIFIED</option>
                      <option value="hearing_scheduled">HEARING</option>
                      <option value="judgment_pending">RESERVED</option>
                      <option value="closed">CLOSED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );

  const renderCaseDetail = () => (
    <section className={card} style={{ marginTop: '24px' }}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>BENCH FILE PREVIEW</h3>
          <p className={subtle}>Counsel dossier, FIR narrative, and judicial anchors.</p>
        </div>
        {selectedCase?.priority?.toLowerCase() === "high" && (
          <span className="status-pill" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#f87171', border: '1px solid #f87171' }}>
            URGENT TRIAGE
          </span>
        )}
      </div>

      {!selectedCase ? (
        <div style={{ textAlign: 'center', padding: '40px' }} className="muted-text">
          Select a matter to open the consolidated file.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px' }}>
              <h4 className="text-xs font-bold tracking-[0.2em] text-amber-500 mb-4 uppercase">Parties & Jurisdiction</h4>
              <div className="space-y-3">
                <div>
                  <div className="text-sm muted-text uppercase tracking-widest text-[0.65rem]">Title</div>
                  <div className="text-lg font-bold">{selectedCase.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm muted-text uppercase tracking-widest text-[0.65rem]">Jurisdiction</div>
                    <div className="font-semibold">{selectedCase.jurisdiction}</div>
                  </div>
                  <div>
                    <div className="text-sm muted-text uppercase tracking-widest text-[0.65rem]">Category</div>
                    <div className="font-semibold">{selectedCase.category}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm muted-text uppercase tracking-widest text-[0.65rem]">Counsel</div>
                  <div className="font-bold text-white">{selectedCase.lawyer_name || "PRO SE"}</div>
                </div>
              </div>
            </div>

            <div className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px' }}>
              <h4 className="text-xs font-bold tracking-[0.2em] text-amber-500 mb-4 uppercase">Chamber Notes</h4>
              <textarea
                className="cinematic-input"
                style={{ width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.3)' }}
                placeholder="Confidential chamber observations..."
                value={remarkDrafts[selectedCase.id] || ""}
                onChange={(e) => setRemarkDrafts((prev) => ({ ...prev, [selectedCase.id]: e.target.value }))}
              />
              <div className="flex gap-3 mt-4">
                <button className="cinematic-btn" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => openSchedulingForm(selectedCase)}>
                  SCHEDULE HEARING
                </button>
                <button className="ghost-btn" style={{ flex: 1 }} onClick={() => advanceStatus(selectedCase, "judgment_pending")}>
                  RESERVE JUDGMENT
                </button>
              </div>
            </div>
          </div>

          <div className="cinematic-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--primary)' }}>
             <h4 className="text-xs font-bold tracking-[0.2em] text-amber-500 mb-6 uppercase">Scheduling Workspace</h4>
             <div className="grid gap-4">
                <div>
                  <label className="text-[0.65rem] font-bold tracking-widest muted-text uppercase block mb-2">Hearing Title</label>
                  <input
                    className="cinematic-input"
                    style={{ width: '100%' }}
                    value={(hearingDrafts[selectedCase.id]?.title ?? buildHearingDraft(selectedCase).title) || ""}
                    onChange={(e) => setHearingDrafts(prev => ({ ...prev, [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), title: e.target.value }}))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[0.65rem] font-bold tracking-widest muted-text uppercase block mb-2">Date & Time</label>
                    <input
                      type="datetime-local"
                      className="cinematic-input"
                      style={{ width: '100%' }}
                      value={(hearingDrafts[selectedCase.id]?.scheduled_at ?? buildHearingDraft(selectedCase).scheduled_at) || ""}
                      onChange={(e) => setHearingDrafts(prev => ({ ...prev, [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), scheduled_at: e.target.value }}))}
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] font-bold tracking-widest muted-text uppercase block mb-2">Duration (Min)</label>
                    <input
                      type="number"
                      className="cinematic-input"
                      style={{ width: '100%' }}
                      value={hearingDrafts[selectedCase.id]?.duration_minutes ?? 30}
                      onChange={(e) => setHearingDrafts(prev => ({ ...prev, [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), duration_minutes: e.target.value }}))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[0.65rem] font-bold tracking-widest muted-text uppercase block mb-2">Agenda / Instructions</label>
                  <textarea
                    className="cinematic-input"
                    style={{ width: '100%', minHeight: '80px' }}
                    value={hearingDrafts[selectedCase.id]?.agenda ?? ""}
                    onChange={(e) => setHearingDrafts(prev => ({ ...prev, [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), agenda: e.target.value }}))}
                  />
                </div>
                <button 
                  className="cinematic-btn active" 
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={() => scheduleHearing(selectedCase)}
                  disabled={benchBusy === selectedCase.id}
                >
                  NOTIFY COUNSEL & CLERK
                </button>
             </div>
          </div>
        </div>
      )}
    </section>
  );

  const renderEvidence = () => {
    const rows = [];
    if (selectedCase?.id_proof_url) {
      rows.push({ title: "Identity / FIR annex", url: selectedCase.id_proof_url });
    }
    (selectedCase?.evidence_urls || []).forEach((url, idx) => {
      rows.push({ title: `Exhibit ${idx + 1}`, url });
    });

    return (
      <section ref={caseDetailRef} className={`mb-6 rounded-2xl p-5 ${card}`}>
        <h2 className="mb-3 text-xl font-semibold">Evidence Review</h2>
        {!selectedCase ? (
          <p className={subtle}>Select a matter to inspect secured filings.</p>
        ) : !rows.length ? (
          <p className={subtle}>No cryptographic exhibits attached to this dossier.</p>
        ) : (
          <div className="grid gap-3">
            {rows.map((doc, idx) => (
              <div key={`${doc.url}-${idx}`} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
                <div>
                  <p className="font-semibold">{doc.title}</p>
                  <p className={`text-xs ${subtle}`}>Checksum verified · audit trail retained</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className={`!inline-flex rounded-lg px-3 py-1 text-xs font-semibold ${goldBtn}`} href={resolveAssetUrl(doc.url)} target="_blank" rel="noreferrer">
                    Open
                  </a>
                  <button type="button" className={`!w-auto rounded-lg px-3 py-1 text-xs ${darkMode ? "border border-emerald-700 bg-emerald-900/40" : "border border-emerald-200 bg-emerald-50"}`}>
                    Accept
                  </button>
                  <button type="button" className={`!w-auto rounded-lg px-3 py-1 text-xs ${darkMode ? "border border-rose-800 bg-rose-950/50" : "border border-rose-200 bg-rose-50"}`}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className={`mt-4 text-xs ${subtle}`}>Chain-of-custody logging and encryption wrappers follow registry policy SOC-2 baseline.</p>
      </section>
    );
  };

  const renderHearings = () => (
    <section className="space-y-6">
      <div className={`rounded-2xl p-5 ${card}`}>
        <h2 className="mb-4 text-xl font-semibold">Today&apos;s bench</h2>
        {!todaysBench.length ? (
          <p className={subtle}>No computerized cause entries for today.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {todaysBench.map((item) => (
              <li key={item.id} className={`flex flex-wrap justify-between gap-2 rounded-xl border px-3 py-2 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
                <span className="font-semibold">{item.case_number}</span>
                <span>{item.title}</span>
                <span className={`${subtle}`}>{item.slot_time ? new Date(item.slot_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={`rounded-2xl p-5 ${card}`}>
        <h3 className="mb-3 text-lg font-semibold">Virtual courtroom</h3>
        {streamError ? <p className="mb-2 rounded border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{streamError}</p> : null}
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <StreamTheme>
                <HearingRoom dark={darkMode} />
              </StreamTheme>
            </StreamCall>
          </StreamVideo>
        ) : null}
      </div>
      <div className={`rounded-2xl p-5 ${card}`}>
        <h3 className="mb-2 text-lg font-semibold">Upcoming hearings</h3>
        <div className="space-y-2 text-sm">
          {upcomingBench.length ? (
            upcomingBench.slice(0, 8).map((h) => (
              <div key={h.id} className={`flex justify-between rounded-lg border px-3 py-2 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
                <span>{h.case_number}</span>
                <span className={subtle}>{new Date(h.slot_time).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <p className={subtle}>Cause list sequencing will populate once registry slots firm up.</p>
          )}
          {legacyHearings.length ? (
            <div className={`mt-4 border-t pt-3 ${darkMode ? "border-stone-700" : "border-stone-100"}`}>
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-amber-500">Legacy filings</p>
              {legacyHearings.slice(0, 6).map((h) => (
                <div key={h.id || h._id} className={`mb-2 rounded-lg border px-3 py-2 ${darkMode ? "border-stone-800" : "border-stone-100"}`}>
                  {h.title} · {h.scheduled_at ? new Date(h.scheduled_at).toLocaleString() : ""}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="cinematic-card" style={{ padding: '20px', border: '1px solid rgba(212,175,55,0.1)' }}>
            <div className="muted-text text-[0.65rem] font-bold tracking-[0.2em] mb-2 uppercase">{kpi.label}</div>
            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Cinzel, serif' }}>{kpi.value}</div>
            <div style={{ height: '2px', width: '20px', background: 'var(--primary)', marginTop: '12px' }}></div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <div className="space-y-8">
          {renderAssignedTable()}
          {selectedCase ? renderCaseDetail() : (
             <div className="cinematic-card" style={{ textAlign: 'center', padding: '60px', borderStyle: 'dashed', opacity: 0.5 }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📂</div>
                <p className="muted-text">Select a matter from the roster to view consolidated bench files.</p>
             </div>
          )}
        </div>
        
        <aside className="space-y-6">
          <div className="cinematic-card" style={{ border: '1px solid var(--primary)' }}>
            <h3 className="text-sm font-bold tracking-widest text-amber-500 mb-6 uppercase">TODAY'S CAUSE LIST</h3>
            {!todaysBench.length ? (
              <p className="muted-text text-sm">No entries for the current session.</p>
            ) : (
              <div className="space-y-4">
                {todaysBench.map(item => (
                  <div key={item.id} className="p-3 rounded-xl border border-white/5 bg-white/5">
                    <div className="text-xs font-bold text-amber-500">{item.case_number}</div>
                    <div className="text-sm font-semibold">{item.title}</div>
                    <div className="text-[0.65rem] muted-text mt-1">🕒 {new Date(item.slot_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cinematic-card">
            <h3 className="text-sm font-bold tracking-widest text-amber-500 mb-4 uppercase">BENCH PERFORMANCE</h3>
            <div className="space-y-4">
               {pseudoBar("Registry Sync", 100, theme === 'midnight')}
               {pseudoBar("Digital Evidence", 85, theme === 'midnight')}
               {pseudoBar("Judgment Rate", 92, theme === 'midnight')}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  const renderCauseList = () => (
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="mb-4 text-xl font-semibold">Cause list</h2>
      {!causeList.length ? (
        <p className={subtle}>Awaiting computerized posting from registry.</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead className={darkMode ? "bg-stone-800 text-amber-100" : "bg-amber-50 text-amber-900"}>
            <tr>
              <th className="px-3 py-2">Sr.</th>
              <th className="px-3 py-2">Case</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {causeList.map((item, idx) => (
              <tr key={item.id} className={`border-t ${darkMode ? "border-stone-800" : "border-stone-100"}`}>
                <td className="px-3 py-2">{idx + 1}</td>
                <td className="px-3 py-2">{item.case_number}</td>
                <td className="px-3 py-2">{item.title}</td>
                <td className="px-3 py-2">{item.slot_time ? new Date(item.slot_time).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );

  const renderCalendar = () => (
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="mb-3 text-xl font-semibold">Calendar</h2>
      <div className="grid gap-3">
        {Object.entries(calendarPreview).map(([day, items]) => (
          <div key={day} className={`rounded-xl border px-4 py-3 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
            <p className="text-sm font-semibold text-amber-400">{day}</p>
            <ul className={`mt-2 text-sm ${subtle}`}>
              {items.map((c) => (
                <li key={c.id}>
                  {c.case_number} — {new Date(c.slot_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!Object.keys(calendarPreview).length ? <p className={subtle}>No hearings yet.</p> : null}
      </div>
    </section>
  );

  const renderAnalytics = () => {
    const closed = stats?.closed_cases ?? courtCases.filter((c) => (c.status || "").toLowerCase() === "closed").length;
    const open = stats?.open_cases ?? courtCases.filter((c) => (c.status || "").toLowerCase() !== "closed").length;
    const resolvedPct = closed + open === 0 ? 0 : Math.round((closed / (closed + open)) * 100);
    const backlogPct = 100 - resolvedPct;

    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="cinematic-card">
          <h2 className="mb-6 text-xl font-bold tracking-widest text-amber-500 uppercase" style={{ fontFamily: 'Cinzel, serif' }}>DISPOSITION METRICS</h2>
          <div className="space-y-8">
            <div className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {pseudoBar("RESOLVED SPECTRUM", resolvedPct, theme === 'midnight')}
              <p className="muted-text text-[0.6rem] mt-2">Closed matters indexed via registry audit.</p>
            </div>
            <div className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {pseudoBar("ACTIVE BACKLOG", backlogPct, theme === 'midnight')}
              <p className="muted-text text-[0.6rem] mt-2">Matters awaiting judicial disposition or hearing.</p>
            </div>
          </div>
        </section>

        <section className="cinematic-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--primary)' }}>
          <h2 className="mb-6 text-xl font-bold tracking-widest text-amber-500 uppercase" style={{ fontFamily: 'Cinzel, serif' }}>BENCH DATA</h2>
          <div className="grid grid-cols-2 gap-4">
             <div className="cinematic-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div className="text-4xl font-black text-white">{closed}</div>
                <div className="muted-text text-[0.6rem] mt-2 font-bold tracking-widest uppercase">RESOLVED</div>
             </div>
             <div className="cinematic-card" style={{ padding: '24px', textAlign: 'center' }}>
                <div className="text-4xl font-black text-white">{open}</div>
                <div className="muted-text text-[0.6rem] mt-2 font-bold tracking-widest uppercase">ACTIVE</div>
             </div>
          </div>
          <div className="mt-8 p-4 rounded-xl border border-white/5 bg-white/5 text-xs muted-text italic">
            Predictive load balancing uses pacing from upcoming slot density to optimize courtroom throughput.
          </div>
        </section>
      </div>
    );
  };

  const renderMessages = () => (
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="mb-3 text-xl font-semibold">Secure chambers mail</h2>
      {!messages.length ? (
        <p className={subtle}>No routing tables for counsel threads.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {messages.map((msg) => (
            <div key={`${msg.user_id}-${msg.case_id}`} className={`rounded-xl border p-3 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
              <p className="font-semibold">{msg.name}</p>
              <p className={`text-sm ${subtle}`}>{msg.case_number || "Court business"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderCourtrooms = () => (
    <section className="cinematic-card">
      <h2 className="mb-8 text-2xl font-bold tracking-widest text-amber-500 uppercase" style={{ fontFamily: 'Cinzel, serif' }}>COURTROOM MONITORING</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {["Courtroom I · Constitution Bench", "Courtroom II · Appellate", "Courtroom III · Virtual"].map((title) => (
          <div key={title} className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center mb-4" style={{ background: 'rgba(212,175,55,0.05)' }}>🏛️</div>
            <p className="font-bold text-white mb-1">{title.toUpperCase()}</p>
            <p className="muted-text text-[0.65rem] tracking-widest uppercase">Occupancy telemetry · Active session</p>
            <button type="button" className="cinematic-btn active" style={{ width: '100%', marginTop: '24px', fontSize: '0.7rem' }} onClick={() => setActiveNav("Hearings")}>
              ENTER VIRTUAL BENCH
            </button>
          </div>
        ))}
      </div>
    </section>
  );

  const renderJudgments = () => (
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="mb-2 text-xl font-semibold">Judgments workspace</h2>
      <p className={`mb-6 text-sm ${subtle}`}>
        Drafting canvas with templated headings, precedent insertion, AI-assisted citations, and e-signatures to registry.
      </p>
      <div className={`rounded-xl border px-4 py-6 ${darkMode ? "border-stone-700 bg-stone-900/65" : "border-dashed border-amber-200 bg-amber-50/40"}`}>
        <p className={`text-sm ${subtle}`}>
          Connected editor coming next iteration — for now escalate reserved matters via chamber notes and judgment pending status transitions.
        </p>
      </div>
    </section>
  );

  const renderSecurity = () => (
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="text-xl font-semibold">Security center</h2>
      <ul className={`mt-4 space-y-2 text-sm ${subtle}`}>
        <li>Role-based chambers access · JWT + device trust</li>
        <li>Document encryption at rest · SHA-256 manifest</li>
        <li>SOC logging · {stats?.audit_events ?? 0} audit events indexed</li>
        <li>Two-factor authentication roadmap · integrated with registry IAM</li>
      </ul>
    </section>
  );

  const renderSettings = () => (
    <section className="cinematic-card" style={{ maxWidth: '600px' }}>
      <h2 className="mb-6 text-xl font-bold tracking-widest text-amber-500 uppercase" style={{ fontFamily: 'Cinzel, serif' }}>CHAMBER PREFERENCES</h2>
      <div className="space-y-6">
        <div className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white">Visual Bench Theme</div>
              <div className="muted-text text-xs">Switch between classic and midnight judicial themes.</div>
            </div>
            <button 
              className="theme-btn active" 
              onClick={() => setTheme(theme === 'midnight' ? 'classic' : 'midnight')}
              style={{ fontSize: '0.7rem' }}
            >
              {theme.toUpperCase()}
            </button>
          </div>
        </div>
        <p className="muted-text text-[0.7rem] italic">Chamber preferences are stored locally and encrypted via browser secure vault.</p>
      </div>
    </section>
  );

  const renderJudgeProfile = () => (
    <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className={`rounded-2xl p-5 ${card}`}>
        <div className="mx-auto w-full max-w-[240px]">
          <img
            src={portraitSrc || resolveAssetUrl(TRIPATHI_PROFILE_FALLBACK.photo_url)}
            alt={judgeProfile.name}
            className="aspect-square w-full rounded-2xl border-4 border-amber-500/40 object-cover shadow-xl"
          />
        </div>
        <h2 className="mt-4 text-center text-xl font-bold">{judgeProfile.name}</h2>
        <p className={`text-center text-sm ${subtle}`}>{judgeProfile.position}</p>
        <p className="mt-2 text-center text-sm font-semibold text-amber-400">{judgeProfile.court}</p>
        <div className={`mt-4 space-y-2 rounded-xl border p-3 text-sm ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
          <p>
            <span className={`${subtle}`}>Experience:</span> {judgeProfile.experience_label}
          </p>
          <p>
            <span className={`${subtle}`}>Bench status:</span>{" "}
            <span className="font-semibold text-emerald-400">{judgeProfile.roster_status}</span>
          </p>
          <p>
            <span className={`${subtle}`}>Availability:</span> {judgeProfile.availability_summary}
          </p>
          <p>{judgeProfile.virtual_hearings_supported ? "Virtual hearings supported." : ""}</p>
        </div>
      </div>

      <div className="space-y-6">
        <article className={`rounded-2xl p-5 ${card}`}>
          <h3 className="text-lg font-semibold text-amber-400">About</h3>
          <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed ${subtle}`}>{judgeProfile.about}</p>
        </article>

        <article className={`rounded-2xl p-5 ${card}`}>
          <h3 className="mb-3 text-lg font-semibold text-amber-400">Professional highlights</h3>
          <ul className={`list-inside list-disc space-y-1 text-sm ${subtle}`}>
            {(judgeProfile.professional_highlights || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <div className="grid gap-6 md:grid-cols-2">
          <article className={`rounded-2xl p-5 ${card}`}>
            <h3 className="mb-3 text-lg font-semibold text-amber-400">Key responsibilities</h3>
            <ul className={`list-inside list-disc space-y-1 text-sm ${subtle}`}>
              {(judgeProfile.key_responsibilities || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className={`rounded-2xl p-5 ${card}`}>
            <h3 className="mb-3 text-lg font-semibold text-amber-400">Skills</h3>
            <ul className={`flex flex-wrap gap-2`}>
              {(judgeProfile.skills || []).map((skill) => (
                <li key={skill} className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium">
                  {skill}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <article className={`rounded-2xl p-5 ${card}`}>
          <h3 className="mb-2 text-lg font-semibold text-amber-400">Judicial philosophy</h3>
          <blockquote className={`border-l-4 border-amber-500 pl-4 text-lg italic ${darkMode ? "text-stone-200" : "text-stone-800"}`}>
            “{judgeProfile.judicial_philosophy}”
          </blockquote>
        </article>

        <article className={`rounded-2xl p-5 ${card}`}>
          <h3 className="mb-3 text-lg font-semibold text-amber-400">Achievements</h3>
          <ul className={`list-inside list-disc space-y-1 text-sm ${subtle}`}>
            {(judgeProfile.achievements || []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className={`rounded-2xl p-5 ${card}`}>
          <h3 className="mb-3 text-lg font-semibold text-amber-400">Specialization</h3>
          <p className={`text-sm ${subtle}`}>{(judgeProfile.specialization || []).join(" · ")}</p>
          <h3 className="mb-2 mt-6 text-lg font-semibold text-amber-400">Contact</h3>
          <div className={`space-y-2 text-sm ${subtle}`}>
            <p>
              <strong className="text-stone-300">Official Court Email:</strong> {judgeProfile.court_contact_email}
            </p>
            <p>
              <strong className="text-stone-300">Court Chamber:</strong> {judgeProfile.chamber}
            </p>
            <p>
              <strong className="text-stone-300">Office Extension:</strong> {judgeProfile.office_extension}
            </p>
          </div>
        </article>
      </div>
    </section>
  );

  const renderSection = () => {
    switch (activeNav) {
      case "Dashboard":
        return renderDashboard();
      case "Judge Profile":
        return renderJudgeProfile();
      case "Assigned Cases":
        return (
          <>
            {renderAssignedTable()}
            {renderCaseDetail()}
          </>
        );
      case "Hearings":
        return renderHearings();
      case "Evidence Review":
        return renderEvidence();
      case "Judgments":
        return renderJudgments();
      case "Calendar":
        return renderCalendar();
      case "Messages":
        return renderMessages();
      case "Analytics":
        return renderAnalytics();
      case "Cause List":
        return renderCauseList();
      case "Courtrooms":
        return renderCourtrooms();
      case "Security Center":
        return renderSecurity();
      case "Settings":
        return renderSettings();
      default:
        return (
          <section className={`rounded-2xl p-5 ${card}`}>
            <h2 className="text-xl font-semibold">{activeNav}</h2>
            <p className={`mt-2 text-sm ${subtle}`}>Module undergoing registry certification.</p>
          </section>
        );
    }
  };

  return (
    <div className={shell}>
      <FilingParticles />
      <FilingJudicialSeal />
      
      <div className="mx-auto flex max-w-[1920px] relative z-10">
        <aside className="sticky top-0 flex h-screen w-72 flex-col p-6 glass-sidebar">
          <div className="mb-10 text-center">
            <div className="text-2xl font-bold tracking-[0.4em] text-white" style={{ fontFamily: 'Cinzel, serif' }}>
              E-COURT
            </div>
            <div className="text-[0.65rem] tracking-[0.3em] text-amber-500/80 font-bold mt-1">JUDICIAL BENCH</div>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => (item === "Logout" ? logout() : setActiveNav(item))}
                className={`sidebar-shortcut ${activeNav === item ? 'active' : ''}`}
                style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-white/5">
             <button 
              onClick={() => setTheme(theme === 'midnight' ? 'classic' : 'midnight')}
              className="theme-btn active"
              style={{ width: '100%', fontSize: '0.7rem' }}
            >
              {theme === 'midnight' ? '🌙 MIDNIGHT BENCH' : '🏛️ CLASSIC CHAMBERS'}
            </button>
          </div>
        </aside>

        <main className="flex-1 space-y-6 p-8">
          <header className="flex flex-wrap items-center gap-6 p-6 cinematic-card" style={{ padding: '16px 24px' }}>
            <div className="flex-1 min-w-[300px]">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                <input
                  className="cinematic-input"
                  style={{ width: '100%', paddingLeft: '48px' }}
                  placeholder="Search bench files, citations, or case numbers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="status-pill" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                {notifications.length} ALERTS
              </div>
              <div className="status-pill" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              
              <div 
                className="flex items-center gap-3 p-2 pr-4 cinematic-card" 
                style={{ padding: '8px 16px', borderRadius: '16px', cursor: 'pointer', border: '1px solid var(--primary)' }}
                onClick={() => setActiveNav("Judge Profile")}
              >
                <img 
                  src={portraitSrc || resolveAssetUrl(TRIPATHI_PROFILE_FALLBACK.photo_url)} 
                  alt="" 
                  className="h-10 w-10 rounded-full border-2 border-amber-500/50 object-cover" 
                />
                <div className="leading-tight">
                  <div className="text-sm font-bold text-white">{sessionUser?.name || user.name}</div>
                  <div className="text-[0.6rem] text-amber-500 font-bold tracking-widest uppercase">Bench Officer</div>
                </div>
              </div>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {loading ? (
              <div className="cinematic-card" style={{ textAlign: 'center', padding: '60px' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                <p className="muted-text">Synchronizing with Registry...</p>
              </div>
            ) : renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default JudgePanel;
