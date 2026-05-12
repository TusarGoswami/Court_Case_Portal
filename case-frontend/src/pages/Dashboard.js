import "../App.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearSession, getStoredUser } from "../services/auth";

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

function Dashboard() {
  const [user, setUser] = useState(getStoredUser());
  const [cases, setCases] = useState([]);
  const [caseRequests, setCaseRequests] = useState([]);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [caseFilter, setCaseFilter] = useState("accepted");
  const [chatContacts, setChatContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [flashCasePanel, setFlashCasePanel] = useState(false);
  const [hearings, setHearings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [judgeModal, setJudgeModal] = useState({ open: false, loading: false, data: null, error: "" });
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  /** all | hearings (upcoming slot) | delivered (closed) — driven by KPI "View details". */
  const [caseBrowseFilter, setCaseBrowseFilter] = useState("all");
  const caseDetailRef = useRef(null);
  const caseTrackingPanelRef = useRef(null);
  const notificationsPanelRef = useRef(null);
  const hearingFeedPanelRef = useRef(null);
  const chatBodyRef = useRef(null);
  const navigate = useNavigate();

  const scrollToRef = (r) => {
    requestAnimationFrame(() => r.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const handleLogout = useCallback(() => {
    clearSession();
    navigate("/", { replace: true });
  }, [navigate]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, hearingsRes, notificationsRes] = await Promise.all([
        api.get("/me"),
        api.get("/hearings"),
        api.get("/notifications"),
      ]);

      setUser(meRes.data.user);
      setHearings(hearingsRes.data.data || []);
      setNotifications(notificationsRes.data.data || []);

      if (["admin", "judge", "clerk"].includes(meRes.data.user?.role)) {
        const reportRes = await api.get("/reports/dashboard");
        setStats(reportRes.data.stats);
        const casesRes = await api.get("/cases");
        setCases(casesRes.data.data || []);
      } else {
        const myCasesRes = await api.get("/my-cases");
        const myCaseData = myCasesRes.data.data || [];
        setCases(myCaseData);
        setSelectedCase(myCaseData[0] || null);
        if (meRes.data.user?.role === "lawyer") {
          const requestRes = await api.get("/lawyer/case-requests");
          setCaseRequests(requestRes.data.data || []);
        }
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uploadDocument = async (caseId, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("title", file.name);
    formData.append("file", file);

    try {
      await api.post(`/cases/${caseId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Document uploaded");
    } catch (error) {
      alert(error?.response?.data?.message || "Upload failed");
    }
  };

  const dashboardStats = useMemo(() => {
    if (stats) {
      return [
        { label: "Total Cases", value: stats.total_cases || 0 },
        { label: "Pending Hearings", value: stats.scheduled_hearings || 0 },
        { label: "Orders Delivered", value: stats.closed_cases || 0 },
        { label: "Notifications", value: notifications.length || 0 },
      ];
    }

    const pending = hearings.filter((item) => item.status === "scheduled").length;
    const closed = cases.filter((item) => item.status === "closed").length;

    return [
      { label: "Total Cases", value: cases.length || 0 },
      { label: "Pending Hearings", value: pending || 0 },
      { label: "Orders Delivered", value: closed || 0 },
      { label: "Notifications", value: notifications.length || 0 },
    ];
  }, [stats, cases, hearings, notifications.length]);

  const isLawyerView = user?.role === "lawyer";
  const showCaseTrackingDetails = isLawyerView || user?.role === "public_user";

  const visibleCasesForTracking = useMemo(() => {
    if (caseBrowseFilter === "delivered") {
      return cases.filter((c) => (c.status || "").toLowerCase() === "closed");
    }
    if (caseBrowseFilter === "hearings") {
      const now = new Date();
      return cases.filter((c) => c.slot_time && new Date(c.slot_time) >= now);
    }
    return cases;
  }, [cases, caseBrowseFilter]);

  const trackingColSpan =
    6 +
    (showCaseTrackingDetails ? 1 : 0) +
    (["admin", "judge", "clerk"].includes(user?.role) ? 1 : 0);

  useEffect(() => {
    setSelectedCase((prev) => {
      const list =
        caseBrowseFilter === "delivered"
          ? cases.filter((c) => (c.status || "").toLowerCase() === "closed")
          : caseBrowseFilter === "hearings"
            ? cases.filter((c) => c.slot_time && new Date(c.slot_time) >= new Date())
            : cases;
      if (!list.length) return prev;
      if (prev && list.some((c) => c.id === prev.id)) return prev;
      return list[0] ?? prev;
    });
  }, [caseBrowseFilter, cases]);

  const handleKpiViewDetails = (label) => {
    setActiveMenu("Dashboard");
    if (label === "Total Cases") {
      setCaseBrowseFilter("all");
      scrollToRef(caseTrackingPanelRef);
      return;
    }
    if (label === "Pending Hearings") {
      setCaseBrowseFilter("hearings");
      scrollToRef(caseTrackingPanelRef);
      setTimeout(() => scrollToRef(hearingFeedPanelRef), 400);
      return;
    }
    if (label === "Orders Delivered") {
      setCaseBrowseFilter("delivered");
      scrollToRef(caseTrackingPanelRef);
      return;
    }
    if (label === "Notifications") {
      setCaseBrowseFilter("all");
      scrollToRef(notificationsPanelRef);
    }
  };

  const isImageUrl = (url) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(url || "");
  const currentAvatar = resolveAssetUrl(user?.photo_url) || "https://i.pravatar.cc/80?img=13";

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAvatarPreviewOpen(false);
    };
    if (avatarPreviewOpen) {
      document.addEventListener("keydown", onKeyDown);
    }
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [avatarPreviewOpen]);

  const openCaseDetails = (item) => {
    setSelectedCase(item);
    setFlashCasePanel(true);
    setTimeout(() => setFlashCasePanel(false), 1200);
    setTimeout(() => {
      caseDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const loadChatMessages = useCallback(async (contact) => {
    if (!contact?.user_id) return;
    try {
      const res = await api.get("/messages", {
        params: {
          receiver_id: contact.user_id,
          case_id: contact.case_id,
        },
      });
      setChatMessages(res.data.data || []);
    } catch {
      // Keep UI stable even if chat endpoint is temporarily unreachable.
      setChatMessages([]);
    }
  }, []);

  const loadChatContacts = useCallback(async () => {
    try {
      const res = await api.get("/messages/contacts");
      const contacts = res.data.data || [];
      setChatContacts(contacts);
      if (!activeChat && contacts.length) {
        setActiveChat(contacts[0]);
      }
    } catch {
      // Avoid uncaught runtime errors on dashboard.
      setChatContacts([]);
    }
  }, [activeChat]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || !activeChat?.user_id) return;
    try {
      setSendingChat(true);
      await api.post("/messages", {
        receiver_id: activeChat.user_id,
        case_id: activeChat.case_id,
        message: text,
      });
      setChatInput("");
      await loadChatMessages(activeChat);
    } catch (e) {
      alert(e?.response?.data?.message || "Could not send message");
    } finally {
      setSendingChat(false);
    }
  };

  const respondCaseRequest = async (caseId, action) => {
    try {
      const response = await api.post(`/lawyer/case-requests/${caseId}/respond`, { action });

      // Optimistic UI update first so user always sees immediate change.
      setCaseRequests((prev) => prev.filter((c) => c.id !== caseId));
      if (action === "accept" && response?.data?.data) {
        setCases((prev) => [response.data.data, ...prev]);
      }

      // Best-effort refresh; don't fail action if refresh endpoints timeout.
      try {
        const [casesRes, requestsRes, notesRes] = await Promise.all([
          api.get("/my-cases"),
          api.get("/lawyer/case-requests"),
          api.get("/notifications"),
        ]);
        setCases(casesRes.data.data || []);
        setCaseRequests(requestsRes.data.data || []);
        setNotifications(notesRes.data.data || []);
      } catch {
        // keep optimistic state
      }

      if (action === "accept") setActiveMenu("Assigned Cases");
      alert(action === "accept" ? "Case accepted." : "Case declined.");
    } catch (e) {
      alert(e?.response?.data?.message || "Action failed. Please retry once.");
    }
  };

  const activeBenchStatuses = ["accepted", "verified", "assigned_to_judge", "hearing_scheduled", "judgment_pending", "judgment_reserved"];

  const assignedCases = useMemo(
    () =>
      cases.filter((c) => {
        const s = (c.status || "").toLowerCase();
        return s === "closed" || activeBenchStatuses.includes(s);
      }),
    [cases]
  );
  const filteredAssignedCases = useMemo(() => {
    const sNorm = (c) => (c.status || "").toLowerCase();
    if (caseFilter === "accepted") {
      return assignedCases.filter((c) => sNorm(c) !== "closed");
    }
    return assignedCases.filter((c) => sNorm(c) === "closed");
  }, [assignedCases, caseFilter]);
  const clientList = useMemo(() => {
    const map = new Map();
    cases.forEach((c) => {
      const key = (c.complainant?.email || c.complainant?.phone || c.complainant?.full_name || "unknown").toLowerCase();
      const existing = map.get(key) || {
        name: c.complainant?.full_name || "Unknown",
        phone: c.complainant?.phone || "--",
        email: c.complainant?.email || "--",
        caseCount: 0,
      };
      existing.caseCount += 1;
      map.set(key, existing);
    });
    return Array.from(map.values());
  }, [cases]);

  useEffect(() => {
    if (activeMenu !== "Messages") return;
    loadChatContacts();
  }, [activeMenu, loadChatContacts]);

  useEffect(() => {
    if (activeMenu !== "Messages" || !activeChat) return;
    loadChatMessages(activeChat);
    const id = setInterval(() => loadChatMessages(activeChat), 5000);
    return () => clearInterval(id);
  }, [activeMenu, activeChat, loadChatMessages]);

  useEffect(() => {
    chatBodyRef.current?.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const openJudge = async (judgeId) => {
    if (!judgeId) return;
    setJudgeModal({ open: true, loading: true, data: null, error: "" });
    try {
      const res = await api.get(`/judges/${judgeId}`);
      setJudgeModal({ open: true, loading: false, data: res.data.data, error: "" });
    } catch (e) {
      setJudgeModal({ open: true, loading: false, data: null, error: e?.response?.data?.message || "Could not load judge details" });
    }
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">E-COURT</div>
        <nav className="dashboard-menu">
          {user?.role === "public_user" ? (
            <button className="menu-item" onClick={() => navigate("/create-case")}>
              Create Case
            </button>
          ) : null}
          {["Dashboard", "Assigned Cases", ...(user?.role !== "public_user" ? ["Case Requests", "Clients", "Schedule / Hearings", "Documents"] : []), "Messages", "Profile Settings"].map((item) => (
            <button
              key={item}
              className={`menu-item ${activeMenu === item ? "active" : ""}`}
              onClick={() => {
                if (item === "Profile Settings") navigate("/profile");
                else setActiveMenu(item);
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="menu-item logout" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <h3>E-Court Case Management Portal</h3>
          <div className="dashboard-user">
            <div className="user-chip">
              <img
                className="user-avatar"
                src={currentAvatar}
                alt=""
                role="button"
                tabIndex={0}
                title="Click to view profile image"
                onClick={() => setAvatarPreviewOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAvatarPreviewOpen(true);
                  }
                }}
              />
              <div className="user-meta">
                <strong>{user?.name}</strong>
                <span className="role-badge">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <p>Loading dashboard...</p>
        ) : (
          <>
            <section className="welcome-banner">
              <div>
                <h2>Welcome back, {user?.name}</h2>
                <p>Here&apos;s what&apos;s happening with your cases today.</p>
              </div>
              <span>{new Date().toDateString()}</span>
            </section>

            <section className="kpi-grid">
              {dashboardStats.map((item) => (
                <article key={item.label} className="kpi-card">
                  <p>{item.label}</p>
                  <h3>{String(item.value).padStart(2, "0")}</h3>
                  <button type="button" className="kpi-detail-link" onClick={() => handleKpiViewDetails(item.label)}>
                    View details
                  </button>
                </article>
              ))}
            </section>

            {activeMenu === "Dashboard" ? (
            <section className="panel dashboard-table-panel" ref={caseTrackingPanelRef}>
              <div className="table-header-row">
                <div>
                  <h3>Case Tracking</h3>
                  <p className="panel-subtitle">
                    {caseBrowseFilter === "all" && "Track case status, priority, and supporting documents."}
                    {caseBrowseFilter === "hearings" &&
                      "Showing matters with an upcoming hearing slot (today and future)."}{" "}
                    {caseBrowseFilter === "delivered" &&
                      "Showing closed / delivered matters (orders disposed)."}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setCaseBrowseFilter("all");
                    scrollToRef(caseTrackingPanelRef);
                  }}
                >
                  View All Cases
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Case #</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Jurisdiction</th>
                      <th>Slot</th>
                      <th>Judge</th>
                      {showCaseTrackingDetails ? <th>Details</th> : null}
                      {["admin", "judge", "clerk"].includes(user?.role) ? <th>Upload PDF</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCasesForTracking.map((item) => (
                      <tr key={item.id}>
                        <td>{item.case_number}</td>
                        <td>{item.category || item.title || "--"}</td>
                        <td><span className="status-pill">{item.status}</span></td>
                        <td>{item.jurisdiction || "--"}</td>
                        <td>{item.slot_time ? new Date(item.slot_time).toLocaleString() : "--"}</td>
                        <td>
                          {item.judge_id ? (
                            <button className="link-btn" onClick={() => openJudge(item.judge_id)}>View Judge</button>
                          ) : (
                            "--"
                          )}
                        </td>
                        {showCaseTrackingDetails ? (
                          <td>
                            <button className="link-btn" onClick={() => openCaseDetails(item)}>View Full</button>
                          </td>
                        ) : null}
                        {["admin", "judge", "clerk"].includes(user?.role) ? (
                          <td>
                            <label className="upload-link">
                              Upload
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => uploadDocument(item.id, e.target.files?.[0])}
                              />
                            </label>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                    {!visibleCasesForTracking.length && (
                      <tr>
                        <td colSpan={trackingColSpan}>
                          {caseBrowseFilter === "hearings"
                            ? "No upcoming hearings in your filings."
                            : caseBrowseFilter === "delivered"
                              ? "No delivered / closed matters yet."
                              : isLawyerView
                                ? "No assigned cases available yet."
                                : "No cases available yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            ) : null}

            {isLawyerView && activeMenu === "Case Requests" ? (
              <section className="panel dashboard-table-panel">
                <div className="table-header-row">
                  <div>
                    <h3>Case Requests</h3>
                    <p className="panel-subtitle">Pending cases assigned to you. Accept or decline each request.</p>
                  </div>
                </div>
                <div className="lawyer-case-grid">
                  {caseRequests.map((req) => (
                    <article key={req.id} className="lawyer-info-card">
                      <h4>{req.case_number} • {req.category}</h4>
                      <p><strong>Client:</strong> {req.complainant?.full_name || "--"}</p>
                      <p><strong>Description:</strong> {req.incident?.description || "--"}</p>
                      <div className="row-actions">
                        <button className="accept-btn" onClick={() => respondCaseRequest(req.id, "accept")}>Accept</button>
                        <button className="decline-btn" onClick={() => respondCaseRequest(req.id, "reject")}>Decline</button>
                      </div>
                    </article>
                  ))}
                  {!caseRequests.length ? <p>No pending case requests.</p> : null}
                </div>
              </section>
            ) : null}

            {isLawyerView && activeMenu === "Assigned Cases" ? (
              <section className="panel dashboard-table-panel">
                <div className="table-header-row">
                  <div>
                    <h3>Assigned Cases</h3>
                    <p className="panel-subtitle">All accepted/closed cases assigned to you.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={`ghost-btn ${caseFilter === "accepted" ? "active-filter" : ""}`} onClick={() => setCaseFilter("accepted")}>Accepted</button>
                    <button className={`ghost-btn ${caseFilter === "closed" ? "active-filter" : ""}`} onClick={() => setCaseFilter("closed")}>Closed</button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Case Title</th><th>Client Name</th><th>Status</th><th>Date</th><th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignedCases.map((item) => (
                        <tr key={item.id}>
                          <td>{item.category || item.case_type || "--"}</td>
                          <td>{item.complainant?.full_name || "--"}</td>
                          <td><span className="status-pill">{item.status}</span></td>
                          <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "--"}</td>
                          <td><button className="link-btn" onClick={() => openCaseDetails(item)}>View Details</button></td>
                        </tr>
                      ))}
                      {!filteredAssignedCases.length ? <tr><td colSpan={5}>No {caseFilter} cases yet.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {isLawyerView && activeMenu === "Clients" ? (
              <section className="panel dashboard-table-panel">
                <h3>Clients</h3>
                <p className="panel-subtitle">Client list with case counts.</p>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Case Count</th></tr></thead>
                    <tbody>
                      {clientList.map((c) => <tr key={`${c.email}-${c.phone}`}><td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.caseCount}</td></tr>)}
                      {!clientList.length ? <tr><td colSpan={4}>No clients yet.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {isLawyerView && activeMenu === "Schedule / Hearings" ? (
              <section className="panel dashboard-table-panel">
                <h3>Schedule / Hearings</h3>
                <p className="panel-subtitle">Upcoming hearings from your assigned case slots.</p>
                <ul className="list">
                  {assignedCases.filter((c) => c.slot_time).map((c) => (
                    <li key={c.id}>{c.case_number} — {new Date(c.slot_time).toLocaleString()}</li>
                  ))}
                  {!assignedCases.filter((c) => c.slot_time).length ? <li>No hearings scheduled yet.</li> : null}
                </ul>
              </section>
            ) : null}

            {isLawyerView && activeMenu === "Documents" ? (
              <section className="panel dashboard-table-panel">
                <h3>Documents</h3>
                <p className="panel-subtitle">Uploaded case files.</p>
                <div className="lawyer-evidence-list">
                  {cases.flatMap((c) => c.evidence_urls || []).map((u) => (
                    <a key={u} href={resolveAssetUrl(u)} target="_blank" rel="noreferrer" className="link-btn">Open Document</a>
                  ))}
                </div>
              </section>
            ) : null}

            {activeMenu === "Messages" ? (
              <section className="panel dashboard-table-panel">
                <h3>Messages</h3>
                <p className="panel-subtitle">Chat with clients in a WhatsApp-style thread.</p>
                <div className="chat-layout">
                  <aside className="chat-sidebar">
                    {chatContacts.map((c) => (
                      <button
                        key={`${c.user_id}-${c.case_id}`}
                        type="button"
                        className={`chat-contact ${activeChat?.user_id === c.user_id ? "active" : ""}`}
                        onClick={() => setActiveChat(c)}
                      >
                        <img src={resolveAssetUrl(c.photo_url) || "https://i.pravatar.cc/80?img=13"} alt="" />
                        <div>
                          <strong>{c.name}</strong>
                          <span>{c.case_number || "Case chat"}</span>
                        </div>
                      </button>
                    ))}
                    {!chatContacts.length ? <p className="chat-empty">No chats available.</p> : null}
                  </aside>

                  <div className="chat-main">
                    {activeChat ? (
                      <>
                        <header className="chat-header">
                          <strong>{activeChat.name}</strong>
                          <span>{activeChat.case_number || "Case conversation"}</span>
                        </header>
                        <div className="chat-body" ref={chatBodyRef}>
                          {chatMessages.map((m) => {
                            const mine = m.sender_id === user?.id;
                            return (
                              <div key={m.id} className={`chat-bubble-row ${mine ? "mine" : "theirs"}`}>
                                <div className={`chat-bubble ${mine ? "mine" : "theirs"}`}>
                                  <p>{m.message}</p>
                                  <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}</span>
                                </div>
                              </div>
                            );
                          })}
                          {!chatMessages.length ? <p className="chat-empty">Start the conversation.</p> : null}
                        </div>
                        <footer className="chat-input-row">
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendChatMessage();
                              }
                            }}
                            placeholder="Type a message..."
                          />
                          <button type="button" onClick={sendChatMessage} disabled={sendingChat}>
                            {sendingChat ? "Sending..." : "Send"}
                          </button>
                        </footer>
                      </>
                    ) : (
                      <div className="chat-empty-wrap">Select a contact to start chatting.</div>
                    )}
                  </div>
                </div>
              </section>
            ) : null}

            {showCaseTrackingDetails && selectedCase && ["Dashboard", "Assigned Cases", "Case Requests"].includes(activeMenu) ? (
              <section
                ref={caseDetailRef}
                className={`panel lawyer-case-detail-panel ${flashCasePanel ? "lawyer-case-detail-panel-flash" : ""}`}
              >
                <div className="table-header-row">
                  <div>
                    <h3>Assigned Case Details</h3>
                    <p className="panel-subtitle">Full complainant, incident, and uploaded evidence for legal review.</p>
                  </div>
                  <span className="status-pill">{selectedCase.status}</span>
                </div>

                <div className="lawyer-case-meta-grid">
                  <div className="lawyer-meta-card"><span>Case #</span><strong>{selectedCase.case_number}</strong></div>
                  <div className="lawyer-meta-card"><span>Type</span><strong>{selectedCase.case_type || "--"}</strong></div>
                  <div className="lawyer-meta-card"><span>Category</span><strong>{selectedCase.category || "--"}</strong></div>
                  <div className="lawyer-meta-card"><span>Jurisdiction</span><strong>{selectedCase.jurisdiction || "--"}</strong></div>
                </div>

                <div className="lawyer-case-grid">
                  <article className="lawyer-info-card">
                    <h4>Complainant Details</h4>
                    <p><strong>Name:</strong> {selectedCase.complainant?.full_name || "--"}</p>
                    <p><strong>Parent Name:</strong> {selectedCase.complainant?.parent_name || "--"}</p>
                    <p><strong>Phone:</strong> {selectedCase.complainant?.phone || "--"}</p>
                    <p><strong>Email:</strong> {selectedCase.complainant?.email || "--"}</p>
                    <p><strong>Occupation:</strong> {selectedCase.complainant?.occupation || "--"}</p>
                    <p><strong>Permanent Address:</strong> {selectedCase.complainant?.address_permanent || "--"}</p>
                    <p><strong>Current Address:</strong> {selectedCase.complainant?.address_current || "--"}</p>
                  </article>

                  <article className="lawyer-info-card">
                    <h4>Accused & Incident</h4>
                    <p><strong>Accused:</strong> {selectedCase.accused?.name || "--"}</p>
                    <p><strong>Contact:</strong> {selectedCase.accused?.contact_info || "--"}</p>
                    <p><strong>Relationship:</strong> {selectedCase.accused?.relationship || "--"}</p>
                    <p><strong>Accused Address:</strong> {selectedCase.accused?.address || "--"}</p>
                    <p><strong>Date:</strong> {selectedCase.incident?.date || "--"}</p>
                    <p><strong>Time:</strong> {selectedCase.incident?.time || "--"}</p>
                    <p><strong>Location:</strong> {selectedCase.incident?.location || "--"}</p>
                    <p><strong>Description:</strong> {selectedCase.incident?.description || "--"}</p>
                    <p><strong>Relief Requested:</strong> {selectedCase.relief_requested || "--"}</p>
                  </article>
                </div>

                <div className="lawyer-doc-section">
                  <h4>Uploaded Documents</h4>
                  <div className="lawyer-doc-grid">
                    <article className="lawyer-doc-card">
                      <h5>ID Proof</h5>
                      {selectedCase.id_proof_url ? (
                        <a href={resolveAssetUrl(selectedCase.id_proof_url)} target="_blank" rel="noreferrer" className="link-btn">
                          Open ID Proof
                        </a>
                      ) : (
                        <p>Not uploaded</p>
                      )}
                    </article>

                    <article className="lawyer-doc-card">
                      <h5>Evidence Files</h5>
                      {selectedCase.evidence_urls?.length ? (
                        <div className="lawyer-evidence-list">
                          {selectedCase.evidence_urls.map((url) => (
                            <div key={url} className="evidence-item">
                              {isImageUrl(url) ? (
                                <a href={resolveAssetUrl(url)} target="_blank" rel="noreferrer">
                                  <img src={resolveAssetUrl(url)} alt="Evidence" className="evidence-thumb" />
                                </a>
                              ) : null}
                              <a href={resolveAssetUrl(url)} target="_blank" rel="noreferrer" className="link-btn">Open File</a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No evidence files uploaded.</p>
                      )}
                    </article>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="grid">
              <div className="panel" ref={hearingFeedPanelRef}>
                <h3>Hearing Calendar Feed</h3>
                <p className="panel-subtitle">Stay updated with your upcoming hearings.</p>
                <ul className="list">
                  {hearings.map((hearing) => (
                    <li key={hearing.id || hearing._id}>
                      {hearing.title} - {new Date(hearing.scheduled_at).toLocaleString()}
                    </li>
                  ))}
                  {!hearings.length && <li>No hearings scheduled yet.</li>}
                </ul>
              </div>

              <div className="panel" ref={notificationsPanelRef}>
                <h3>Real-time Notifications</h3>
                <p className="panel-subtitle">Stay updated with the latest alerts.</p>
                <ul className="list">
                  {notifications.map((note) => (
                    <li key={note.id || note._id}>{note.title}: {note.message}</li>
                  ))}
                  {!notifications.length && <li>No notifications yet.</li>}
                </ul>
              </div>
            </section>
          </>
        )}
      </main>

      {judgeModal.open ? (
        <div className="modal-backdrop" onClick={() => setJudgeModal({ open: false, loading: false, data: null, error: "" })}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Judge Details</strong>
              <button className="ghost-btn" onClick={() => setJudgeModal({ open: false, loading: false, data: null, error: "" })}>Close</button>
            </div>
            {judgeModal.loading ? (
              <p>Loading...</p>
            ) : judgeModal.error ? (
              <p className="modal-error">{judgeModal.error}</p>
            ) : (
              <div className="judge-detail">
                <img className="judge-avatar" src={resolveAssetUrl(judgeModal.data?.photo_url) || "https://i.pravatar.cc/120?img=9"} alt="" />
                <div>
                  <div className="judge-name">{judgeModal.data?.name}</div>
                  <div className="judge-meta">
                    <div><span>Jurisdictions:</span> {(judgeModal.data?.jurisdictions || []).join(", ")}</div>
                    <div><span>Case types:</span> {(judgeModal.data?.case_types || []).join(", ")}</div>
                    <div><span>Availability:</span> {judgeModal.data?.is_available ? "Available" : "Unavailable"}</div>
                    <div><span>Active cases:</span> {judgeModal.data?.active_cases_count ?? 0}</div>
                  </div>
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: "16px", width: "100%" }}
                    onClick={() => {
                      setJudgeModal({ open: false, loading: false, data: null, error: "" });
                      navigate(`/judge-profile/${judgeModal.data?.id}`, { state: { judge: judgeModal.data } });
                    }}
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {avatarPreviewOpen ? (
        <div className="avatar-preview-backdrop" onClick={() => setAvatarPreviewOpen(false)}>
          <div className="avatar-preview-wrap" onClick={(e) => e.stopPropagation()}>
            <img className="avatar-preview-image" src={currentAvatar} alt={user?.name || "Profile"} />
            <button className="avatar-preview-close" type="button" onClick={() => setAvatarPreviewOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Dashboard;