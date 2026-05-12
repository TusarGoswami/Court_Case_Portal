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
  "Judge Profile",
  "Assigned Cases",
  "Hearings",
  "Evidence Review",
  "Judgments",
  "Calendar",
  "Messages",
  "Analytics",
  "Cause List",
  "Courtrooms",
  "Security Center",
  "Settings",
  "Logout",
];

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
  const caseDetailRef = useRef(null);
  const [sessionUser, setSessionUser] = useState(user);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("judge_theme") === "dark");
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
    localStorage.setItem("judge_theme", darkMode ? "dark" : "light");
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

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

  const shell = darkMode ? "bg-gradient-to-br from-stone-950 via-stone-900 to-black text-stone-100" : "bg-gradient-to-br from-stone-100 via-white to-stone-200 text-stone-900";
  const card = darkMode
    ? "border border-stone-700/80 bg-stone-900/70 shadow-[0_12px_40px_rgba(0,0,0,.45)] backdrop-blur"
    : "border border-stone-200 bg-white/90 shadow-[0_12px_40px_rgba(0,0,0,.08)] backdrop-blur";
  const subtle = darkMode ? "text-stone-300" : "text-stone-600";
  const goldBtn = "border border-amber-500/60 bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-md";

  const renderAssignedTable = () => (
    <section className={`mb-6 rounded-2xl p-5 ${card}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Assigned Cases</h2>
          <p className={`text-sm ${subtle}`}>Official roster synchronized from registry after counsel acceptance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterId(f.id)}
              className={`!w-auto rounded-full border px-3 py-1 text-sm font-semibold transition ${
                filterId === f.id
                  ? darkMode
                    ? "border-amber-400 bg-amber-500/20 text-amber-100"
                    : "border-amber-600 bg-amber-50 text-amber-900"
                  : darkMode
                    ? "border-stone-600 bg-stone-800 text-stone-200 hover:border-amber-300/60"
                    : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!filteredCases.length ? (
        <div className={`rounded-xl border px-4 py-6 text-sm ${darkMode ? "border-stone-700 bg-stone-800/60" : "border-stone-200 bg-stone-50"}`}>
          {assignWarning || "No matters on your bench for this filter."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className={darkMode ? "bg-stone-800/80 text-amber-100" : "bg-amber-50 text-amber-900"}>
              <tr>
                <th className="px-3 py-2">Case No.</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Lawyer</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Workflow</th>
                <th className="px-3 py-2">Hearing</th>
                <th className="px-3 py-2">Bench action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-t ${darkMode ? "border-stone-800 hover:bg-stone-800/80" : "border-stone-100 hover:bg-amber-50/40"} ${
                    selectedCase?.id === row.id ? (darkMode ? "bg-stone-800/90" : "bg-amber-50/80") : ""
                  }`}
                  onClick={() => setSelectedCase(row)}
                >
                  <td className="px-3 py-2 font-semibold">{row.case_number}</td>
                  <td className="px-3 py-2">{row.title}</td>
                  <td className="px-3 py-2">{row.lawyer_name || "—"}</td>
                  <td className="px-3 py-2">{row.case_type}</td>
                  <td className="px-3 py-2 capitalize">{row.priority || "medium"}</td>
                  <td className="px-3 py-2">{row.workflow_label || row.status}</td>
                  <td className="px-3 py-2">{row.slot_time ? new Date(row.slot_time).toLocaleString() : "—"}</td>
                  <td className="px-3 py-2">
                    <select
                      className={`w-full rounded-lg border px-2 py-1 text-xs ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                      value={row.status}
                      disabled={benchBusy === row.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => advanceStatus(row, e.target.value)}
                    >
                      <option value="accepted">Assigned to Judge</option>
                      <option value="verified">Verified</option>
                      <option value="assigned_to_judge">Registry Linked</option>
                      <option value="hearing_scheduled">Hearing Scheduled</option>
                      <option value="judgment_pending">Judgment Pending</option>
                      <option value="judgment_reserved">Judgment Reserved</option>
                      <option value="closed">Closed</option>
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
    <section className={`mb-6 rounded-2xl p-5 ${card}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Bench File Preview</h3>
          <p className={`text-sm ${subtle}`}>Counsel dossier, FIR narrative, filings, and virtual hearing anchors.</p>
        </div>
        {selectedCase?.priority?.toLowerCase() === "high" ? (
          <span className="rounded-full border border-rose-400/70 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
            AI-assisted triage · elevate sequencing
          </span>
        ) : null}
      </div>

      {!selectedCase ? (
        <p className={subtle}>Select a listed matter to open the consolidated file.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className={`space-y-2 rounded-xl border p-4 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">Parties</h4>
            <p className="text-base font-semibold">{selectedCase.title}</p>
            <p className={subtle}>Jurisdiction · {selectedCase.jurisdiction}</p>
            <p className={subtle}>Category · {selectedCase.category}</p>
            <p className={subtle}>
              Counsel ·{" "}
              <span className={`font-semibold ${darkMode ? "text-stone-100" : "text-stone-900"}`}>{selectedCase.lawyer_name || "—"}</span>
              {selectedCase.lawyer_id ? (
                <span className="mt-1 block font-mono text-xs opacity-80">Ref: {selectedCase.lawyer_id}</span>
              ) : null}
            </p>
          </div>
          <div className={`space-y-2 rounded-xl border p-4 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">FIR / Incident</h4>
            <p className={subtle}>{selectedCase.fir_summary || "No structured FIR narrative captured for this filing."}</p>
            {selectedCase.id_proof_url ? (
              <a className="text-amber-300 underline" href={resolveAssetUrl(selectedCase.id_proof_url)} target="_blank" rel="noreferrer">
                Party identification / FIR annex
              </a>
            ) : null}
          </div>
          <div className={`space-y-3 rounded-xl border p-4 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">Chamber notes</h4>
            <textarea
              className={`min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
              placeholder="Confidential chamber observations…"
              value={remarkDrafts[selectedCase.id] || ""}
              onChange={(e) => setRemarkDrafts((prev) => ({ ...prev, [selectedCase.id]: e.target.value }))}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`!w-auto rounded-lg px-3 py-2 text-sm font-semibold ${goldBtn}`} onClick={() => openSchedulingForm(selectedCase)}>
                Choose date & time
              </button>
              <button type="button" className={`!w-auto rounded-lg px-3 py-2 text-sm ${darkMode ? "border border-stone-600 bg-stone-800" : "border border-stone-300 bg-white"}`} onClick={() => advanceStatus(selectedCase, "judgment_pending")}>
                Reserve judgment
              </button>
            </div>
            <div className={`mt-4 space-y-3 rounded-xl border p-4 ${darkMode ? "border-stone-700 bg-stone-950/50" : "border-stone-200 bg-stone-50"}`}>
              <div>
                <h4 className="text-sm font-semibold text-amber-500">Schedule hearing date & time</h4>
                <p className={`text-xs ${subtle}`}>Pick the hearing date and time first, then notify the lawyer and clerk.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Hearing title
                  <input
                    type="text"
                    className={`w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                    value={(hearingDrafts[selectedCase.id]?.title ?? buildHearingDraft(selectedCase).title) || ""}
                    onChange={(e) =>
                      setHearingDrafts((prev) => ({
                        ...prev,
                        [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), title: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Hearing date & time
                  <input
                    type="datetime-local"
                    className={`w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                    value={(hearingDrafts[selectedCase.id]?.scheduled_at ?? buildHearingDraft(selectedCase).scheduled_at) || ""}
                    onChange={(e) =>
                      setHearingDrafts((prev) => ({
                        ...prev,
                        [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), scheduled_at: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Duration minutes
                  <input
                    type="number"
                    min="15"
                    max="480"
                    className={`w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                    value={hearingDrafts[selectedCase.id]?.duration_minutes ?? buildHearingDraft(selectedCase).duration_minutes}
                    onChange={(e) =>
                      setHearingDrafts((prev) => ({
                        ...prev,
                        [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), duration_minutes: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  Courtroom / link
                  <input
                    type="text"
                    className={`w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                    value={hearingDrafts[selectedCase.id]?.location ?? buildHearingDraft(selectedCase).location}
                    onChange={(e) =>
                      setHearingDrafts((prev) => ({
                        ...prev,
                        [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), location: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Agenda
                <textarea
                  className={`min-h-[88px] w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                  value={hearingDrafts[selectedCase.id]?.agenda ?? buildHearingDraft(selectedCase).agenda}
                  onChange={(e) =>
                    setHearingDrafts((prev) => ({
                      ...prev,
                      [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), agenda: e.target.value },
                    }))
                  }
                />
              </label>
              <label className="block space-y-1 text-xs font-semibold uppercase tracking-[0.2em]">
                Meeting link
                <input
                  type="url"
                  className={`w-full rounded-xl border px-3 py-2 text-sm normal-case tracking-normal ${darkMode ? "border-stone-600 bg-stone-900" : "border-stone-300 bg-white"}`}
                  value={hearingDrafts[selectedCase.id]?.meeting_link ?? buildHearingDraft(selectedCase).meeting_link}
                  onChange={(e) =>
                    setHearingDrafts((prev) => ({
                      ...prev,
                      [selectedCase.id]: { ...(prev[selectedCase.id] || buildHearingDraft(selectedCase)), meeting_link: e.target.value },
                    }))
                  }
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={`!w-auto rounded-lg px-3 py-2 text-sm font-semibold ${goldBtn}`} onClick={() => scheduleHearing(selectedCase)} disabled={benchBusy === selectedCase.id}>
                  Notify lawyer and clerk
                </button>
                <button
                  type="button"
                  className={`!w-auto rounded-lg px-3 py-2 text-sm ${darkMode ? "border border-stone-600 bg-stone-800" : "border border-stone-300 bg-white"}`}
                  onClick={() => setHearingDrafts((prev) => ({ ...prev, [selectedCase.id]: buildHearingDraft(selectedCase) }))}
                >
                  Reset draft
                </button>
              </div>
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
    <>
      <section className={`relative mb-6 overflow-hidden rounded-2xl border px-6 py-5 ${darkMode ? "border-amber-500/35 bg-[radial-gradient(circle_at_20%_-10%,rgba(245,158,11,.35),transparent_42%),rgba(24,21,17,.92)] text-stone-100" : "border-amber-200 bg-[radial-gradient(circle_at_20%_-10%,rgba(245,158,11,.35),transparent_42%),rgba(253,246,239,1)] text-stone-900"}`}>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Bench of Honour</p>
            <h1 className="text-3xl font-semibold">Welcome back, {sessionUser?.name || user.name}</h1>
            <p className={`max-w-xl text-sm ${darkMode ? "text-stone-300" : "text-stone-600"}`}>
              Computerized case flow with registry acceptance hooks, biometric-grade evidence locks, and real-time synchronization every 30 seconds.
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm ${darkMode ? "text-stone-400" : "text-stone-500"}`}>Session clock</p>
            <p className="font-mono text-lg">{clock.toLocaleString()}</p>
            {lastSynced ? <p className="text-xs text-amber-200/90">Synced {lastSynced.toLocaleTimeString()}</p> : null}
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((cardStat) => (
          <article key={cardStat.label} className={`rounded-2xl p-5 ${card}`}>
            <p className={`text-sm ${subtle}`}>{cardStat.label}</p>
            <h3 className="mt-2 text-4xl font-semibold text-amber-400 drop-shadow">{cardStat.value}</h3>
            <p className="mt-2 text-xs text-emerald-300/90">Live registry feed</p>
          </article>
        ))}
      </section>

      <section className={`mb-6 grid gap-4 lg:grid-cols-[2fr_1fr]`}>
        <div className={`rounded-2xl p-5 ${card}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Productivity cockpit</h3>
              <p className={`text-sm ${subtle}`}>Shortcuts into high-volume workspaces.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Assigned Cases", "Hearings", "Evidence Review", "Cause List", "Calendar"].map((item) => (
              <button key={item} type="button" className={`!w-auto rounded-xl px-4 py-2 text-sm font-semibold ${goldBtn}`} onClick={() => setActiveNav(item)}>
                {item}
              </button>
            ))}
          </div>
          <p className={`mt-6 text-xs ${subtle}`}>{WORKFLOW_LEGEND}</p>
        </div>
        <div className={`rounded-2xl p-5 ${card}`}>
          <h3 className="mb-3 text-lg font-semibold">Registry alerts</h3>
          <ul className="space-y-2 text-sm">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id || n._id} className={`rounded-lg border px-3 py-2 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
                <strong>{n.title}</strong>
                <p className={subtle}>{n.message}</p>
              </li>
            ))}
            {!notifications.length ? <li className={subtle}>No notifications.</li> : null}
          </ul>
        </div>
      </section>

      <section className={`mb-6 rounded-2xl p-5 ${card}`}>
        <h3 className="mb-3 text-lg font-semibold">Calendar preview</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.keys(calendarPreview)
            .slice(0, 6)
            .map((day) => (
              <div key={day} className={`rounded-xl border p-3 ${darkMode ? "border-stone-700 bg-stone-900/70" : "border-stone-200 bg-white"}`}>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-500">{day}</p>
                <p className="text-2xl font-semibold">{calendarPreview[day].length}</p>
                <p className={`text-xs ${subtle}`}>Listed matters</p>
              </div>
            ))}
          {!Object.keys(calendarPreview).length ? <p className={subtle}>Scheduling data will hydrate when registry posts hearing dates.</p> : null}
        </div>
      </section>

      {renderAssignedTable()}
      {renderCaseDetail()}
    </>
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
      <section className={`rounded-2xl p-5 ${card}`}>
        <h2 className="mb-4 text-xl font-semibold">Analytics</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`space-y-4 rounded-xl border p-4 ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-500">Disposition mix</p>
            {pseudoBar("Resolved spectrum", resolvedPct, darkMode)}
            {pseudoBar("Active backlog", backlogPct, darkMode)}
          </div>
          <div className={`space-y-2 rounded-xl border p-4 text-sm ${darkMode ? "border-stone-700" : "border-stone-200"}`}>
            <p>
              Resolved matters (registry): <strong>{closed}</strong>
            </p>
            <p>
              Active docket projection: <strong>{open}</strong>
            </p>
            <p className={subtle}>Predictive load balancing uses pacing from upcoming slot density.</p>
          </div>
        </div>
      </section>
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
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="mb-4 text-xl font-semibold">Courtroom monitoring</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {["Courtroom I · Constitution Bench", "Courtroom II · Appellate", "Courtroom III · Virtual"].map((title) => (
          <div key={title} className={`rounded-xl border p-4 ${darkMode ? "border-stone-700 bg-stone-900/75" : "border-stone-200 bg-white"}`}>
            <p className="font-semibold">{title}</p>
            <p className={`text-xs ${subtle}`}>Occupancy telemetry · networked AV</p>
            <button type="button" className={`mt-3 !w-full rounded-lg py-2 text-sm font-semibold ${goldBtn}`} onClick={() => setActiveNav("Hearings")}>
              Enter virtual bench
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
    <section className={`rounded-2xl p-5 ${card}`}>
      <h2 className="text-xl font-semibold">Chamber preferences</h2>
      <label className="mt-4 flex items-center gap-3 text-sm">
        <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
        Enable judicial dark mode (high contrast)
      </label>
      <p className={`mt-4 text-sm ${subtle}`}>Theme preference persists on this device.</p>
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
    <div className={`min-h-screen ${shell}`}>
      <div className="mx-auto flex max-w-[1920px]">
        <aside className={`sticky top-0 flex h-screen w-72 flex-col border-r p-5 ${darkMode ? "border-stone-800 bg-stone-950/90" : "border-stone-200 bg-white/95"}`}>
          <div className="mb-6 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-700 to-amber-500 px-3 py-3 text-center text-lg font-bold tracking-[0.5em] text-white shadow-lg">
            E-COURT
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => (item === "Logout" ? logout() : setActiveNav(item))}
                className={`w-full rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition ${
                  activeNav === item
                    ? darkMode
                      ? "border-amber-400 bg-amber-500/15 text-amber-100"
                      : "border-amber-500 bg-amber-50 text-amber-900"
                    : darkMode
                      ? "border-stone-800 bg-stone-900 text-stone-200 hover:border-amber-400/50"
                      : "border-stone-200 bg-white text-stone-700 hover:border-amber-300"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
          <button type="button" className={`mt-4 w-full rounded-xl py-2 text-xs font-semibold uppercase tracking-[0.3em] ${goldBtn}`} onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "Day session" : "Night session"}
          </button>
        </aside>

        <main className="flex-1 space-y-2 p-6">
          <header className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-4 ${darkMode ? "border-stone-800 bg-stone-900/80" : "border-stone-200 bg-white/90"} backdrop-blur`}>
            <div className="min-w-[220px] flex-1">
              <input
                className={`w-full rounded-xl border px-4 py-2 text-base outline-none ring-amber-500/80 focus:ring-2 ${darkMode ? "border-stone-700 bg-stone-950 text-white" : "border-stone-300 bg-white"}`}
                placeholder="Search filings, citations, citations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={`rounded-xl border px-3 py-2 text-sm ${darkMode ? "border-stone-700" : "border-stone-200"}`}>{notifications.length} alerts</div>
            <div className={`rounded-xl border px-3 py-2 text-sm ${darkMode ? "border-stone-700" : "border-stone-200"}`}>{courtCases.length} active roster</div>
            <div className={`rounded-xl px-4 py-2 text-sm ${darkMode ? "bg-black/35 text-stone-200" : "bg-stone-100"}`}>{clock.toLocaleTimeString()}</div>
            <div className="flex items-center gap-3 rounded-xl border border-amber-400/70 bg-gradient-to-r from-stone-900 to-stone-800 px-3 py-2 text-sm font-semibold text-white">
              <img src={portraitSrc || resolveAssetUrl(TRIPATHI_PROFILE_FALLBACK.photo_url)} alt="" className="h-10 w-10 rounded-full border-2 border-amber-400/80 object-cover" />
              <span className="leading-tight">
                {sessionUser?.name || user.name}
                <span className="block text-xs font-normal text-amber-200/90">Bench officer</span>
              </span>
            </div>
          </header>

          {loading ? <div className={`rounded-xl border px-4 py-6 ${card}`}>Loading judicial dashboard…</div> : renderSection()}
        </main>
      </div>
    </div>
  );
}

export default JudgePanel;
