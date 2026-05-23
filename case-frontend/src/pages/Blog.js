import "../App.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getStoredUser } from "../services/auth";

const API_BASE = api?.defaults?.baseURL || "http://127.0.0.1:8000/api";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");

const CATEGORIES = [
  { id: "All", label: "All Articles", icon: "📚" },
  { id: "Criminal Law", label: "Criminal Law", icon: "🔒" },
  { id: "Civil Law", label: "Civil Law", icon: "📋" },
  { id: "Constitutional", label: "Constitutional", icon: "🏛️" },
  { id: "Cyber Crime", label: "Cyber Crime", icon: "💻" },
  { id: "Legal Tech", label: "Legal Tech", icon: "⚡" },
  { id: "Rights & Duties", label: "Rights & Duties", icon: "⚖️" },
  { id: "General", label: "General", icon: "📝" },
];

function resolveUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  return `${BACKEND_BASE}${clean}`;
}

/* ── Ambient Background ── */
function BlogParticles() {
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

/* ── Reading Progress Bar ── */
function ReadingProgress({ progress }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 100,
      background: 'rgba(0,0,0,0.2)',
    }}>
      <div style={{
        height: '100%', width: `${progress}%`,
        background: 'linear-gradient(90deg, #D4AF37, #F5D76E)',
        transition: 'width 0.15s ease',
        boxShadow: '0 0 10px rgba(212,175,55,0.5)',
      }} />
    </div>
  );
}

/* ── Blog Card ── */
function BlogCard({ post, onClick }) {
  const coverSrc = post.cover_image_url ? resolveUrl(post.cover_image_url) : null;
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <article
      onClick={onClick}
      style={{
        background: 'var(--card-bg)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)', borderRadius: '20px',
        overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(212,175,55,0.15)';
        e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Cover Image */}
      <div style={{
        height: '200px', overflow: 'hidden', position: 'relative',
        background: coverSrc ? 'transparent' : 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(30,37,65,0.8) 100%)',
      }}>
        {coverSrc ? (
          <img src={coverSrc} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem', opacity: 0.3 }}>
            {CATEGORIES.find(c => c.id === post.category)?.icon || "📝"}
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'linear-gradient(to top, rgba(11,19,43,0.9), transparent)',
        }} />
        {/* Category badge */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(212,175,55,0.9)', color: '#0B132B',
          padding: '4px 12px', borderRadius: '20px',
          fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {post.category || "General"}
        </div>
        {/* Reading time */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          color: '#E0E6ED', padding: '4px 10px', borderRadius: '20px',
          fontSize: '0.6rem', fontWeight: '600',
        }}>
          🕐 {post.reading_time_min || 3} min read
        </div>
        {/* Featured badge */}
        {post.is_featured && (
          <div style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: 'linear-gradient(135deg, #D4AF37, #F5D76E)',
            color: '#0B132B', padding: '3px 10px', borderRadius: '20px',
            fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.05em',
          }}>
            ⭐ FEATURED
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{
          fontFamily: "'Cinzel', serif", fontSize: '1.05rem', fontWeight: '700',
          color: '#fff', marginBottom: '8px', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.title}
        </h3>
        <p style={{
          color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '16px',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          flexGrow: 1,
        }}>
          {post.excerpt}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #D4AF37, #b8860b)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: '800', color: '#0B132B',
              border: '2px solid rgba(212,175,55,0.3)',
              overflow: 'hidden',
            }}>
              {post.author_photo ? (
                <img src={resolveUrl(post.author_photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                post.author_name?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#E0E6ED' }}>{post.author_name}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{post.author_role}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{dateStr}</div>
            <div style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>👁 {post.views || 0} views</div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Article Detail View ── */
function ArticleView({ post, onBack }) {
  const [readProgress, setReadProgress] = useState(0);
  const coverSrc = post.cover_image_url ? resolveUrl(post.cover_image_url) : null;
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";

  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <ReadingProgress progress={readProgress} />
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          className="ghost-btn"
          style={{ marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          ← Back to Articles
        </button>

        {/* Cover */}
        {coverSrc && (
          <div style={{
            height: '400px', borderRadius: '24px', overflow: 'hidden', marginBottom: '32px',
            position: 'relative',
          }}>
            <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(11,19,43,0.8) 0%, transparent 50%)',
            }} />
          </div>
        )}

        {/* Title area */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(212,175,55,0.15)', color: '#D4AF37',
              padding: '4px 14px', borderRadius: '20px', fontSize: '0.7rem',
              fontWeight: '700', border: '1px solid rgba(212,175,55,0.25)',
            }}>
              {post.category}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.05)', color: 'var(--muted)',
              padding: '4px 14px', borderRadius: '20px', fontSize: '0.7rem',
            }}>
              🕐 {post.reading_time_min || 3} min read
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.05)', color: 'var(--muted)',
              padding: '4px 14px', borderRadius: '20px', fontSize: '0.7rem',
            }}>
              👁 {post.views || 0} views
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', 'Cinzel', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: '800',
            color: '#fff', lineHeight: 1.2, marginBottom: '16px',
          }}>
            {post.title}
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
            {post.excerpt}
          </p>
        </div>

        {/* Author card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '20px', borderRadius: '16px',
          background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)',
          marginBottom: '40px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #b8860b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: '800', color: '#0B132B',
            border: '3px solid rgba(212,175,55,0.3)', overflow: 'hidden', flexShrink: 0,
          }}>
            {post.author_photo ? (
              <img src={resolveUrl(post.author_photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              post.author_name?.[0]?.toUpperCase() || "A"
            )}
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{post.author_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{post.author_role}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>{dateStr}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: '1.05rem', lineHeight: 1.9,
          color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          paddingBottom: '80px',
        }}>
          {post.body}
        </div>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{
            display: 'flex', gap: '8px', flexWrap: 'wrap',
            paddingTop: '24px', borderTop: '1px solid var(--border)', marginBottom: '40px',
          }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{
                background: 'rgba(255,255,255,0.05)', color: 'var(--muted)',
                padding: '4px 12px', borderRadius: '16px', fontSize: '0.7rem',
                border: '1px solid var(--border)',
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Write Article Composer ── */
function WriteArticleModal({ show, onClose, onPublish }) {
  const [form, setForm] = useState({
    title: "", excerpt: "", body: "", category: "General",
    tags: "", is_featured: false, is_published: true,
  });
  const [coverFile, setCoverFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required.");
      return;
    }
    if (form.body.length < 50) {
      setError("Article body must be at least 50 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("excerpt", form.excerpt);
      fd.append("body", form.body);
      fd.append("category", form.category);
      fd.append("is_featured", form.is_featured ? "1" : "0");
      fd.append("is_published", form.is_published ? "1" : "0");
      if (form.tags.trim()) {
        form.tags.split(",").map(t => t.trim()).filter(Boolean).forEach(t => fd.append("tags[]", t));
      }
      if (coverFile) fd.append("cover_image", coverFile);
      await api.post("/blogs", fd);
      onPublish();
      onClose();
      setForm({ title: "", excerpt: "", body: "", category: "General", tags: "", is_featured: false, is_published: true });
      setCoverFile(null);
    } catch (e) {
      setError(e?.response?.data?.message || "Publishing failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif", color: 'var(--primary)', fontSize: '1.3rem' }}>WRITE ARTICLE</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Share your legal expertise with the community</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '1.5rem', cursor: 'pointer', width: 'auto', padding: '4px' }}>✕</button>
        </div>

        {error && <div className="modal-error" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>⚠️ {error}</div>}

        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Article Title</label>
            <input className="cinematic-input" style={{ width: '100%' }} placeholder="e.g. Understanding Consumer Rights in India" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>

          {/* Category + Tags row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Category</label>
              <select className="cinematic-input" style={{ width: '100%' }} value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.filter(c => c.id !== "All").map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Tags (comma separated)</label>
              <input className="cinematic-input" style={{ width: '100%' }} placeholder="law, rights, guide" value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))} />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Excerpt / Summary</label>
            <textarea className="cinematic-input" style={{ width: '100%', minHeight: '60px' }} placeholder="Brief summary of the article..." value={form.excerpt} onChange={(e) => setForm(p => ({ ...p, excerpt: e.target.value }))} />
          </div>

          {/* Body */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Article Body</label>
            <textarea className="cinematic-input" style={{ width: '100%', minHeight: '220px', lineHeight: '1.7' }} placeholder="Write your detailed article here..." value={form.body} onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))} />
          </div>

          {/* Cover Image */}
          <div>
            <label style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>Cover Image (Optional)</label>
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '16px', borderRadius: '12px', border: '2px dashed var(--border)',
              background: 'rgba(212,175,55,0.03)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--muted)',
            }}>
              📷 {coverFile ? coverFile.name : "Drop or click to upload"}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(p => ({ ...p, is_featured: e.target.checked }))} />
              ⭐ Mark as Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(p => ({ ...p, is_published: e.target.checked }))} />
              🌐 Publish Immediately
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="cinematic-btn" style={{ flex: 1, padding: '14px' }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? "PUBLISHING..." : "PUBLISH ARTICLE"}
            </button>
            <button className="ghost-btn" style={{ padding: '14px' }} onClick={onClose}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   MAIN BLOG PAGE
════════════════════════════════════ */
export default function Blog() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const canWrite = ["lawyer", "admin", "judge"].includes(user?.role);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ last_page: 1, total: 0 });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, sort: sortBy, per_page: 12 };
      if (activeCategory !== "All") params.category = activeCategory;
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/blogs", { params });
      setPosts(res.data.data || []);
      setMeta(res.data.meta || { last_page: 1, total: 0 });
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, activeCategory, search]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const openArticle = async (post) => {
    try {
      const res = await api.get(`/blogs/${post.slug}`);
      setSelectedPost(res.data.data);
    } catch {
      setSelectedPost(post);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featuredPost = useMemo(() => posts.find(p => p.is_featured), [posts]);

  if (selectedPost) {
    return (
      <div className="dashboard-layout" style={{ display: 'block', overflowY: 'auto' }}>
        <BlogParticles />
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px, 4vw, 60px)', position: 'relative', zIndex: 5 }}>
          <ArticleView post={selectedPost} onBack={() => setSelectedPost(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ display: 'block', overflowY: 'auto' }}>
      <BlogParticles />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(20px, 4vw, 60px)', position: 'relative', zIndex: 5 }}>

        {/* ── Header ── */}
        <header style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h1 style={{
                fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '4px',
              }}>
                LEGAL RESOURCES
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Expert insights · Legal guides · Judiciary updates
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {canWrite && (
                <button className="cinematic-btn" style={{ fontSize: '0.8rem', padding: '10px 20px' }} onClick={() => setShowComposer(true)}>
                  ✍️ WRITE ARTICLE
                </button>
              )}
              <button className="ghost-btn" onClick={() => navigate(-1)} style={{ padding: '10px 16px' }}>
                ← BACK
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '500px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input
              className="cinematic-input"
              style={{ width: '100%', paddingLeft: '48px' }}
              placeholder="Search articles, topics, or authors..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </header>

        {/* ── Category Filters ── */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setPage(1); }}
              className="status-pill"
              style={{
                cursor: 'pointer', padding: '6px 16px', fontSize: '0.75rem',
                background: activeCategory === cat.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                color: activeCategory === cat.id ? '#0B132B' : 'var(--muted)',
                fontWeight: activeCategory === cat.id ? '800' : '500',
                border: activeCategory === cat.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                transition: 'all 0.3s ease',
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}

          {/* Sort toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            <button
              className={`status-pill`}
              onClick={() => setSortBy("latest")}
              style={{
                cursor: 'pointer', fontSize: '0.7rem', padding: '4px 12px',
                background: sortBy === "latest" ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: sortBy === "latest" ? '#D4AF37' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              🕐 Latest
            </button>
            <button
              className={`status-pill`}
              onClick={() => setSortBy("popular")}
              style={{
                cursor: 'pointer', fontSize: '0.7rem', padding: '4px 12px',
                background: sortBy === "popular" ? 'rgba(212,175,55,0.15)' : 'transparent',
                color: sortBy === "popular" ? '#D4AF37' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              🔥 Popular
            </button>
          </div>
        </div>

        {/* ── Featured Spotlight ── */}
        {featuredPost && activeCategory === "All" && page === 1 && !search && (
          <section
            onClick={() => openArticle(featuredPost)}
            style={{
              borderRadius: '24px', overflow: 'hidden', marginBottom: '40px', cursor: 'pointer',
              background: 'var(--card-bg)', border: '1px solid rgba(212,175,55,0.2)',
              display: 'grid', gridTemplateColumns: '1.2fr 1fr', minHeight: '320px',
              transition: 'all 0.4s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(212,175,55,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              background: featuredPost.cover_image_url
                ? `url(${resolveUrl(featuredPost.cover_image_url)}) center/cover`
                : 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(30,37,65,0.8))',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, transparent 60%, rgba(11,19,43,0.95) 100%)',
              }} />
              <div style={{
                position: 'absolute', top: '20px', left: '20px',
                background: 'linear-gradient(135deg, #D4AF37, #F5D76E)', color: '#0B132B',
                padding: '6px 16px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
              }}>
                ⭐ FEATURED ARTICLE
              </div>
            </div>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{
                background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
                padding: '4px 12px', borderRadius: '16px', fontSize: '0.65rem', fontWeight: '700',
                alignSelf: 'flex-start', marginBottom: '16px', border: '1px solid rgba(212,175,55,0.2)',
              }}>
                {featuredPost.category}
              </span>
              <h2 style={{
                fontFamily: "'Playfair Display', 'Cinzel', serif", fontSize: '1.6rem',
                fontWeight: '800', color: '#fff', lineHeight: 1.3, marginBottom: '12px',
              }}>
                {featuredPost.title}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>
                {featuredPost.excerpt}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37, #b8860b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '800', color: '#0B132B', fontSize: '0.8rem',
                  overflow: 'hidden',
                }}>
                  {featuredPost.author_photo ? (
                    <img src={resolveUrl(featuredPost.author_photo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : featuredPost.author_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.85rem' }}>{featuredPost.author_name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>{featuredPost.author_role} · 🕐 {featuredPost.reading_time_min} min read</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Article Grid ── */}
        {loading ? (
          <div className="cinematic-card" style={{ textAlign: 'center', padding: '80px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <p className="muted-text">Loading articles...</p>
          </div>
        ) : !posts.length ? (
          <div className="cinematic-card" style={{ textAlign: 'center', padding: '80px', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.3 }}>📝</div>
            <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>No articles found.</p>
            {canWrite && (
              <button className="cinematic-btn" style={{ marginTop: '20px', fontSize: '0.8rem' }} onClick={() => setShowComposer(true)}>
                ✍️ Be the first to write
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px', marginBottom: '40px',
            }}>
              {posts.filter(p => !(featuredPost && p.slug === featuredPost.slug && activeCategory === "All" && page === 1 && !search)).map((post) => (
                <BlogCard key={post._id || post.slug} post={post} onClick={() => openArticle(post)} />
              ))}
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className="status-pill"
                    style={{
                      cursor: 'pointer', padding: '6px 14px', fontSize: '0.75rem',
                      background: p === page ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: p === page ? '#0B132B' : 'var(--muted)',
                      fontWeight: p === page ? '800' : '500',
                      border: '1px solid var(--border)',
                    }}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats footer */}
        <div style={{
          textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)',
          color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: '0.1em',
        }}>
          {meta.total} ARTICLES IN THE LEGAL KNOWLEDGE BASE · E-COURT PORTAL
        </div>
      </div>

      {/* Composer Modal */}
      <WriteArticleModal show={showComposer} onClose={() => setShowComposer(false)} onPublish={loadPosts} />
    </div>
  );
}
