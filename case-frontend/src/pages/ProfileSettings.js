import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getStoredUser, saveSession, clearSession } from "../services/auth";
import "../App.css";

/* ── Ambient Background (Reused) ── */
function FilingParticles() {
  return (
    <div className="dash-particles" style={{ position: 'fixed' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="dash-particle" style={{
          width: 2, height: 2,
          left: `${[10, 40, 70, 90, 20][i]}%`, top: `${[20, 50, 15, 60, 80][i]}%`,
          animation: `dashParticleFloat ${8 + i}s ease-in-out infinite`,
        }} />
      ))}
      <div className="dash-light-sweep" />
    </div>
  );
}

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user?.photo_url || "");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const refreshMe = async () => {
    const res = await api.get("/me");
    setUser(res.data.user);
    saveSession(localStorage.getItem("ecourt_token"), res.data.user);
  };

  const uploadPhoto = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await api.post("/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshMe();
      setFile(null);
    } catch (e) {
      alert("Could not upload photo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <FilingParticles />
      
      <div className="panel" style={{ width: 'min(500px, 95vw)', background: 'rgba(30,37,65,0.4)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', padding: 'clamp(16px, 4vw, 32px)', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', fontSize: '1.5rem' }}>PROFILE SETTINGS</h1>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Judicial identity & digital avatar</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ghost-btn" onClick={() => navigate("/dashboard")}>← BACK</button>
            <button className="ghost-btn logout" style={{ color: '#ff4d4d', opacity: 0.9, borderColor: 'rgba(255,77,77,0.2)' }} onClick={handleLogout}>🚪 LOGOUT</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={preview || "https://i.pravatar.cc/120?img=13"}
              alt=""
              style={{ width: '120px', height: '120px', borderRadius: '24px', border: '2px solid var(--primary)', objectFit: 'cover', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}
            />
            {saving && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '24px', display: 'grid', placeItems: 'center', fontSize: '0.7rem' }}>UPLOADING...</div>}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text)' }}>{user?.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user?.email}</p>
            <span className="status-pill" style={{ background: 'var(--primary)', color: 'var(--bg)', marginTop: '12px', display: 'inline-block' }}>{user?.role?.toUpperCase()}</span>
          </div>
        </div>

        <div style={{ marginTop: '40px', display: 'grid', gap: '16px' }}>
          <label className="sidebar-shortcut" style={{ borderStyle: 'dashed', cursor: 'pointer', background: 'rgba(212,175,55,0.03)', padding: '16px' }}>
            <span style={{ fontSize: '1rem' }}>📷</span> SELECT NEW PHOTO
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={uploadPhoto}
            disabled={!file || saving}
            className="theme-btn active"
            style={{ width: '100%', padding: '14px', fontSize: '0.9rem' }}
          >
            {saving ? "UPLOADING..." : "SYNC AVATAR"}
          </button>
          
          {file && <p style={{ fontSize: '0.7rem', color: 'var(--primary)', textAlign: 'center' }}>Selected: {file.name}</p>}
        </div>
      </div>
    </div>
  );
}

