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

/* ── Ambient Background (Unified) ── */
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

function FilingJudicialSeal() {
  return (
    <div className="dash-seal-container" style={{ opacity: 0.05 }}>
      <svg viewBox="0 0 200 200" className="dash-seal-svg">
        <path fill="currentColor" d="M100,20 L120,60 L160,60 L130,90 L140,130 L100,110 L60,130 L70,90 L40,60 L80,60 Z" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
      </svg>
    </div>
  );
}

function JudgeProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [judge, setJudge] = useState(location.state?.judge || null);
  const [loading, setLoading] = useState(!judge);
  const [_error, setError] = useState(""); // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (!judge) {
      const fetchJudge = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/judges/${id}`);
          setJudge(res.data.data);
          setError("");
        } catch (e) {
          setError("Could not load judge profile");
        } finally {
          setLoading(false);
        }
      };
      fetchJudge();
    }
  }, [id, judge]);

  if (loading) return <div className="dashboard-layout" style={{ display: 'grid', placeItems: 'center' }}><div className="loading-spinner" /></div>;

  return (
    <>
      <div className="dashboard-layout" style={{ minHeight: '100vh', padding: 'clamp(16px, 4vw, 40px)' }}>
        <FilingParticles />
        <FilingJudicialSeal />
        
        <div className="mx-auto max-w-6xl relative z-10">
          <header style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginBottom: '40px' }}>
            <button className="ghost-btn" onClick={() => navigate(-1)}>← RETURN TO ROSTER</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
              <div className="text-right">
                <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', letterSpacing: '2px', lineHeight: 1.1 }}>JUDICIAL COMMISSION</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '4px', marginTop: '2px' }}>OFFICIAL PUBLIC RECORD</div>
              </div>
              <img src="/images/logo-emblem.png" alt="E-Court Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            </div>
          </header>

          <div className="grid-cols-1 lg:grid-cols-[320px_1fr] gap-10" style={{ display: 'grid' }}>
            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="cinematic-card" style={{ padding: '8px', border: '1px solid var(--primary)' }}>
                <img
                  src={resolveAssetUrl(judge?.photo_url) || "https://i.pravatar.cc/300?img=9"}
                  alt={judge?.name}
                  style={{ width: '100%', borderRadius: '16px', filter: 'sepia(0.2) contrast(1.1)' }}
                />
              </div>
              
              <div className="cinematic-card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                 <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)', fontSize: '1.4rem' }}>{judge?.name?.toUpperCase()}</h2>
                 <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '4px' }}>{judge?.position || "SENIOR JUDGE"}</p>
                 <p className="muted-text" style={{ fontSize: '0.75rem' }}>{judge?.court}</p>

                 <div className="grid-cols-2 gap-4 mt-8" style={{ display: 'grid' }}>
                    <div className="cinematic-card" style={{ padding: '12px', textAlign: 'center' }}>
                       <div className="text-xl font-bold text-white">{judge?.experience_label?.split(' ')[0] || "25"}</div>
                       <div className="muted-text text-[0.5rem] font-bold tracking-widest uppercase">EXPERIENCE</div>
                    </div>
                    <div className="cinematic-card" style={{ padding: '12px', textAlign: 'center' }}>
                       <div className="text-xl font-bold text-white">{judge?.active_cases_count ?? "0"}</div>
                       <div className="muted-text text-[0.5rem] font-bold tracking-widest uppercase">DOCKETS</div>
                    </div>
                 </div>

                 <div className="space-y-4 mt-8 pt-8 border-t border-white/5">
                    {[
                      { label: 'JURISDICTION', value: (judge?.jurisdictions || []).join(", ") },
                      { label: 'SPECIALIZATION', value: (judge?.case_types || []).join(", ") },
                      { label: 'SESSION HOURS', value: judge?.availability_summary || "10:00 AM - 5:00 PM" },
                      { label: 'OFFICE', value: judge?.chamber || "Supreme Court Hall" }
                    ].map(d => (
                      <div key={d.label}>
                        <div className="text-[0.6rem] font-bold tracking-widest text-amber-500 uppercase">{d.label}</div>
                        <div className="text-xs font-semibold text-white/80">{d.value}</div>
                      </div>
                    ))}
                 </div>
              </div>
            </aside>

            {/* Main Content - Parchment Style */}
            <main className="parchment-panel" style={{ padding: 'clamp(20px, 6vw, 60px)', background: 'linear-gradient(135deg, #F4ECD8 0%, #E7D8B5 100%)', border: '1px solid #C8B88A', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h1 style={{ fontFamily: 'Cinzel, serif', color: '#3e2723', fontSize: '2.5rem', marginBottom: '10px' }}>Judicial Profile</h1>
                <div style={{ width: '100px', height: '1px', background: '#3e2723', margin: '0 auto', opacity: 0.3 }} />
              </div>

              <div className="space-y-12" style={{ fontFamily: 'Playfair Display, serif', color: '#3e2723', lineHeight: 1.8 }}>
                {judge?.about && (
                  <section>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#5d4037', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '20px' }}>PROLOGUE</h3>
                    <p style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>{judge.about}</p>
                  </section>
                )}

                {judge?.professional_highlights && (
                  <section>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#5d4037', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '20px' }}>PROFESSIONAL TENURE</h3>
                    <div className="grid-cols-1 md:grid-cols-2 gap-4" style={{ display: 'grid' }}>
                      {judge.professional_highlights.map((item, idx) => (
                        <div key={idx} style={{ padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.9rem' }}>• {item}</div>
                      ))}
                    </div>
                  </section>
                )}

                {judge?.judicial_philosophy && (
                  <section style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '24px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '2rem', opacity: 0.2, marginBottom: '-10px' }}>"</div>
                    <p style={{ fontSize: '1.4rem', color: '#2e1d1a', fontWeight: 'bold' }}>{judge.judicial_philosophy}</p>
                    <div style={{ fontSize: '2rem', opacity: 0.2, marginTop: '10px' }}>"</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, letterSpacing: '2px', marginTop: '10px' }}>JUDICIAL PHILOSOPHY</div>
                  </section>
                )}

                {judge?.skills && (
                  <section>
                    <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: '#5d4037', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '20px' }}>EXPERT COMMAND</h3>
                    <div className="flex flex-wrap gap-2">
                      {judge.skills.map((skill, idx) => (
                        <span key={idx} style={{ padding: '6px 14px', border: '1px solid rgba(0,0,0,0.2)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{skill.toUpperCase()}</span>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <footer style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(0,0,0,0.1)', textAlign: 'center' }}>
                 <img src="/images/judicial_stamp.png" alt="Stamp" style={{ width: '80px', opacity: 0.4, margin: '0 auto 16px' }} />
                 <p style={{ fontSize: '0.65rem', opacity: 0.6, letterSpacing: '1px' }}>CERTIFIED RECORD OF THE NATIONAL JUDICIARY</p>
              </footer>
            </main>
          </div>
        </div>
      </div>


    </>
  );
}

export default JudgeProfileView;
