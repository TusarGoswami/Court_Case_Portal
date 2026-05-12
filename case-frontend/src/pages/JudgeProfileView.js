import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

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

function JudgeProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [judge, setJudge] = useState(location.state?.judge || null);
  const [loading, setLoading] = useState(!judge);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!judge) {
      const fetchJudge = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/judges/${id}`);
          setJudge(res.data.data);
          setError("");
        } catch (e) {
          setError(e?.response?.data?.message || "Could not load judge profile");
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };
      fetchJudge();
    }
  }, [id, judge]);

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
        <div className="profile-content">Loading judge profile...</div>
      </div>
    );
  }

  if (error || !judge) {
    return (
      <div className="profile-container">
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
        <div className="profile-content">
          <p className="error-message">{error || "Judge profile not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1>Judge Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-grid">
          {/* Left Side - Photo and Basic Info */}
          <div className="profile-sidebar">
            <div className="judge-photo-container">
              <img
                src={resolveAssetUrl(judge?.photo_url) || "https://i.pravatar.cc/200?img=9"}
                alt={judge?.name}
                className="judge-photo"
              />
            </div>
            
            <div className="judge-basic-info">
              <h2>{judge?.name}</h2>
              <p className="position">{judge?.position || "Senior High Court Judge"}</p>
              <p className="court">{judge?.court || "National High Court of India"}</p>

              <div className="judge-stats">
                <div className="stat">
                  <span className="stat-label">Experience</span>
                  <span className="stat-value">{judge?.experience_label || "28+ Years"}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Active Cases</span>
                  <span className="stat-value">{judge?.active_cases_count ?? 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Status</span>
                  <span className="stat-value" style={{ color: judge?.is_available ? "#10b981" : "#ef4444" }}>
                    {judge?.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>

              <div className="judge-details-box">
                <div className="detail-item">
                  <span className="detail-label">Jurisdictions:</span>
                  <span>{(judge?.jurisdictions || []).join(", ")}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Case Types:</span>
                  <span>{(judge?.case_types || []).join(", ")}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Availability:</span>
                  <span>{judge?.availability_summary || "Monday to Friday · 10:00 AM – 5:00 PM"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Chamber:</span>
                  <span>{judge?.chamber || "N/A"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span>{judge?.court_contact_email || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Detailed Info */}
          <div className="profile-main">
            {judge?.about && (
              <section className="profile-section">
                <h3>About</h3>
                <p className="section-text">{judge.about}</p>
              </section>
            )}

            {judge?.professional_highlights && judge.professional_highlights.length > 0 && (
              <section className="profile-section">
                <h3>Professional Highlights</h3>
                <ul className="highlight-list">
                  {judge.professional_highlights.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            {judge?.key_responsibilities && judge.key_responsibilities.length > 0 && (
              <section className="profile-section">
                <h3>Key Responsibilities</h3>
                <ul className="highlight-list">
                  {judge.key_responsibilities.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            {judge?.skills && judge.skills.length > 0 && (
              <section className="profile-section">
                <h3>Skills</h3>
                <div className="skills-container">
                  {judge.skills.map((skill, idx) => (
                    <span key={idx} className="skill-badge">{skill}</span>
                  ))}
                </div>
              </section>
            )}

            {judge?.achievements && judge.achievements.length > 0 && (
              <section className="profile-section">
                <h3>Achievements</h3>
                <ul className="highlight-list">
                  {judge.achievements.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </section>
            )}

            {judge?.judicial_philosophy && (
              <section className="profile-section">
                <h3>Judicial Philosophy</h3>
                <p className="section-text">"{judge.judicial_philosophy}"</p>
              </section>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          padding: 20px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .back-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .profile-header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: bold;
        }

        .profile-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 32px;
        }

        @media (max-width: 1024px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .judge-photo-container {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(251, 146, 60, 0.3);
          border-radius: 16px;
          padding: 16px;
        }

        .judge-photo {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 12px;
          display: block;
        }

        .judge-basic-info h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
        }

        .position {
          color: #fbbf24;
          font-weight: 600;
          margin: 0;
        }

        .court {
          color: #94a3b8;
          margin: 4px 0 16px 0;
        }

        .judge-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 16px;
          background: rgba(251, 146, 60, 0.1);
          border: 1px solid rgba(251, 146, 60, 0.2);
          border-radius: 8px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          color: #cbd5e1;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #fbbf24;
          margin-top: 4px;
        }

        .judge-details-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
        }

        .detail-label {
          color: #fbbf24;
          font-weight: 600;
        }

        .detail-item span:last-child {
          color: #cbd5e1;
        }

        .profile-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .profile-section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .profile-section h3 {
          color: #fbbf24;
          font-size: 18px;
          margin: 0 0 16px 0;
        }

        .section-text {
          color: #cbd5e1;
          line-height: 1.6;
          margin: 0;
          white-space: pre-line;
        }

        .highlight-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .highlight-list li {
          color: #cbd5e1;
          line-height: 1.6;
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-badge {
          display: inline-block;
          background: rgba(251, 146, 60, 0.1);
          border: 1px solid rgba(251, 146, 60, 0.3);
          color: #fbbf24;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
        }

        .error-message {
          color: #ff6b6b;
          text-align: center;
          padding: 32px;
        }
      `}</style>
    </div>
  );
}

export default JudgeProfileView;
