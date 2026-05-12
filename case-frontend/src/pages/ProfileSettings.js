import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getStoredUser, saveSession } from "../services/auth";

export default function ProfileSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user?.photo_url || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const refreshMe = async () => {
    const res = await api.get("/me");
    setUser(res.data.user);
    // keep session user in localStorage in sync
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
      alert("Profile photo updated");
      setFile(null);
    } catch (e) {
      const msg = e?.response?.data?.message || "Could not upload photo";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Profile Settings</h1>
            <p className="text-sm text-slate-600">Upload your profile picture (shown in the dashboard top bar).</p>
          </div>
          <button
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => navigate("/dashboard")}
          >
            Back
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <img
            src={preview || "https://i.pravatar.cc/120?img=13"}
            alt=""
            className="h-24 w-24 rounded-2xl border border-slate-200 object-cover"
          />
          <div className="min-w-[240px] flex-1">
            <div className="text-sm font-bold text-slate-900">{user?.name}</div>
            <div className="text-sm text-slate-600">{user?.email}</div>
            <div className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {user?.role}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />

          <button
            onClick={uploadPhoto}
            disabled={!file || saving}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-violet-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Uploading..." : "Upload Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

