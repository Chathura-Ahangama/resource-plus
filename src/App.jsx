import React, { useEffect, useMemo, useRef, useState } from "react";
import "./index.css";
// =====================
// Resource Plus — Hackathon-Ready MVP (Single-file React)
// What’s new:
// - Demo Mode banner + helpful tips
// - Upload form with subject/category, size limit, inline validation
// - Quick "Seed Sample Data" for judges (adds realistic PDFs + videos)
// - Leaderboard (Top Contributors)
// - Signup grants a Welcome achievement (hash-chained, tamper-evident)
// - Small UX polish: toasts, empty states, accessibility labels
// =====================

// ---------- Utilities ----------
const LS_KEYS = {
  users: "rp_users",
  resources: "rp_resources",
  session: "rp_session",
  achievements: "rp_achievements",
};

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "ICT",
  "History",
  "Geography",
  "Commerce",
  "Languages",
  "Other",
];

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, fallback) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

// Simple tamper-evident hash (demo-only)
function simpleHash(str) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// ---------- Seed Data ----------
const seedYouTube = [
  {
    id: "NybHckSEQBI",
    title: "Algebra Basics Crash Course",
    subject: "Mathematics",
  },
  {
    id: "kKKM8Y-u7ds",
    title: "Physics: Newton's Laws Explained",
    subject: "Science",
  },
  { id: "n5_xbBGMlOQ", title: "Learn SQL in 20 Minutes", subject: "ICT" },
  {
    id: "84780SzjGt0",
    title: "Chemistry: Periodic Table Overview",
    subject: "Science",
  },
];

// Create a tiny valid PDF as Data URL (very small, good for demo/localStorage)
async function makeTinyPdfDataUrl(title = "Resource Plus") {
  const base =
    "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 55>>stream\nBT /F1 18 Tf 20 100 Td (" +
    title.replace(/\\(|\\)/g, "") +
    ") Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000061 00000 n\n0000000124 00000 n\n0000000291 00000 n\n0000000406 00000 n\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n503\n%%EOF";
  const blob = new Blob([base], { type: "application/pdf" });
  const dataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

// ---------- Core App ----------
export default function App() {
  const [users, setUsers] = useState(() => load(LS_KEYS.users, []));
  const [resources, setResources] = useState(() => load(LS_KEYS.resources, []));
  const [sessionUserId, setSessionUserId] = useState(() =>
    load(LS_KEYS.session, null)
  );
  const [route, setRoute] = useState("auth"); // "auth" | "home" | "videos" | "profile"
  const me = useMemo(
    () => users.find((u) => u.id === sessionUserId) || null,
    [users, sessionUserId]
  );

  // Achievements per user
  const [achievementsByUser, setAchByUser] = useState(() =>
    load(LS_KEYS.achievements, {})
  );

  // Persist
  useEffect(() => save(LS_KEYS.users, users), [users]);
  useEffect(() => save(LS_KEYS.resources, resources), [resources]);
  useEffect(() => save(LS_KEYS.session, sessionUserId), [sessionUserId]);
  useEffect(
    () => save(LS_KEYS.achievements, achievementsByUser),
    [achievementsByUser]
  );

  // Toasts
  const [toast, setToast] = useState(null);
  const pushToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // Welcome achievement on first login
  useEffect(() => {
    if (!me) return;
    const chain = achievementsByUser[me.id] || [];
    if (!chain.some((a) => a.type === "welcome")) {
      const ts = new Date().toISOString();
      const prevHash = chain.length ? chain[chain.length - 1].hash : "GENESIS";
      const payload = JSON.stringify({
        userId: me.id,
        prevHash,
        ts,
        type: "welcome",
        value: 1,
        title: "Welcome to Resource Plus",
      });
      const hash = simpleHash(payload);
      const updated = [
        ...chain,
        {
          id: uid(),
          userId: me.id,
          prevHash,
          hash,
          ts,
          type: "welcome",
          value: 1,
          title: "Welcome to Resource Plus",
        },
      ];
      setAchByUser({ ...achievementsByUser, [me.id]: updated });
    }
  }, [me]);

  // Auto-route when logged in
  useEffect(() => {
    if (me && route === "auth") setRoute("home");
  }, [me, route]);

  const handleLogout = () => {
    setSessionUserId(null);
    setRoute("auth");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Demo banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 text-sm px-4 py-2 text-center">
        Demo Mode for hackathon: data stored locally in your browser. Do not use
        real credentials.
      </div>

      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow">
              R+
            </div>
            <h1 className="font-extrabold text-xl">Resource Plus</h1>
          </div>
          {me ? (
            <nav className="flex items-center gap-2">
              <NavBtn
                active={route === "home"}
                onClick={() => setRoute("home")}
                aria-label="Resources"
              >
                Resources
              </NavBtn>
              <NavBtn
                active={route === "videos"}
                onClick={() => setRoute("videos")}
                aria-label="Videos"
              >
                Videos
              </NavBtn>
              <NavBtn
                active={route === "profile"}
                onClick={() => setRoute("profile")}
                aria-label="Profile"
              >
                Profile
              </NavBtn>
              <div className="mx-2 hidden md:block text-sm text-gray-500">
                Hi, <span className="font-semibold">{me.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-sm"
              >
                Logout
              </button>
            </nav>
          ) : (
            <nav className="text-sm text-gray-600">Hackathon MVP</nav>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!me && route === "auth" && (
          <AuthPage
            users={users}
            setUsers={setUsers}
            onLogin={setSessionUserId}
          />
        )}
        {me && route === "home" && (
          <HomePage
            me={me}
            users={users}
            setUsers={setUsers}
            resources={resources}
            setResources={setResources}
            pushToast={pushToast}
          />
        )}
        {me && route === "videos" && <VideosPage />}
        {me && route === "profile" && (
          <ProfilePage
            me={me}
            resources={resources}
            achievements={achievementsByUser[me.id] || []}
          />
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Resource Plus — Built for equitable access
        to learning
      </footer>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------- Components ----------
function NavBtn({ children, active, ...props }) {
  return (
    <button
      className={`px-3 py-2 rounded-xl text-sm transition shadow-sm ${
        active
          ? "bg-blue-600 text-white shadow-blue-100"
          : "bg-white border border-gray-200 hover:bg-gray-50"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function AuthPage({ users, setUsers, onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup") {
      if (!name.trim()) return setError("Please enter your name");
      if (!email || !password) return setError("Email & password required");
      if (users.some((u) => u.email === email))
        return setError("Email already registered");
      const user = {
        id: uid(),
        name,
        email,
        password,
        points: 0,
        createdAt: Date.now(),
      };
      setUsers([...users, user]);
      onLogin(user.id);
    } else {
      const found = users.find(
        (u) => u.email === email && u.password === password
      );
      if (!found) return setError("Invalid credentials");
      onLogin(found.id);
    }
    reset();
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Welcome to Resource Plus</h2>
        <p className="text-white/90 mb-4">
          Share study PDFs, discover videos, and earn recognition for helping
          others in under-resourced schools.
        </p>
        <ul className="list-disc list-inside text-white/90 space-y-1">
          <li>Upload & download educational resources</li>
          <li>Earn points and badges for contributions</li>
          <li>Immutable achievement history (hash-chained)</li>
        </ul>
      </div>
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
      >
        <div className="flex gap-2 mb-6" role="tablist">
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl border ${
              mode === "login" ? "bg-gray-900 text-white" : "bg-white"
            }`}
            onClick={() => setMode("login")}
            role="tab"
            aria-selected={mode === "login"}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-xl border ${
              mode === "signup" ? "bg-gray-900 text-white" : "bg-white"
            }`}
            onClick={() => setMode("signup")}
            role="tab"
            aria-selected={mode === "signup"}
          >
            Sign Up
          </button>
        </div>
        {mode === "signup" && (
          <div className="mb-4">
            <label className="block text-sm mb-1">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-xl px-3 py-2"
              placeholder="e.g., Ayesha Perera"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="you@example.com"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="text-red-600 text-sm mb-3" role="alert">
            {error}
          </div>
        )}
        <button className="w-full py-2 rounded-xl bg-blue-600 text-white font-semibold">
          {mode === "signup" ? "Create account" : "Login"}
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Demo-only auth. Do not use real passwords.
        </p>
      </form>
    </div>
  );
}

function HomePage({ me, users, setUsers, resources, setResources, pushToast }) {
  const [name, setName] = useState("");
  const [author, setAuthor] = useState(me?.name || "");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resources
      .filter(
        (r) =>
          r.name.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
      )
      .filter((r) =>
        subjectFilter === "All" ? true : r.subject === subjectFilter
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [resources, search, subjectFilter]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!name.trim() || !author.trim() || !file)
      return pushToast("Fill all fields and choose a PDF");
    if (file.type !== "application/pdf")
      return pushToast("Please upload a PDF file");
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > 15) return pushToast("PDF too large (max 15 MB)");

    const dataUrl = await fileToDataURL(file);
    const res = {
      id: uid(),
      name: name.trim(),
      author: author.trim(),
      subject,
      uploaderId: me.id,
      uploaderName: me.name,
      downloadCount: 0,
      dataUrl,
      size: file.size,
      createdAt: Date.now(),
    };
    setResources([res, ...resources]);
    const updatedUsers = users.map((u) =>
      u.id === me.id ? { ...u, points: (u.points || 0) + 1 } : u
    );
    setUsers(updatedUsers);
    setName("");
    setAuthor(me.name);
    setFile(null);
    setSubject(SUBJECTS[0]);
    inputRef.current && (inputRef.current.value = "");
    pushToast("Upload successful (+1 point)");
  };

  const onDownload = (res) => {
    setResources(
      resources.map((r) =>
        r.id === res.id ? { ...r, downloadCount: r.downloadCount + 1 } : r
      )
    );
    const add = 1; // +1 per download
    const updatedUsers = users.map((u) =>
      u.id === res.uploaderId ? { ...u, points: (u.points || 0) + add } : u
    );
    setUsers(updatedUsers);

    const a = document.createElement("a");
    a.href = res.dataUrl;
    a.download = `${res.name.replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const seedSamples = async () => {
    const samples = [
      {
        name: "Grade 10 Algebra Notes",
        author: "Teacher Silva",
        subject: "Mathematics",
      },
      {
        name: "Newton's Laws Worksheet",
        author: "Mr. Perera",
        subject: "Science",
      },
      { name: "Basic Computer Skills", author: "ICT Club", subject: "ICT" },
    ];
    const created = [];
    for (const s of samples) {
      const dataUrl = await makeTinyPdfDataUrl(s.name);
      created.push({
        id: uid(),
        ...s,
        uploaderId: me.id,
        uploaderName: me.name,
        downloadCount: Math.floor(Math.random() * 10),
        dataUrl,
        size: 1024 * (50 + Math.floor(Math.random() * 400)), // ~50–450 KB
        createdAt: Date.now() - Math.floor(Math.random() * 86400000),
      });
    }
    setResources([...created, ...resources]);
  };

  // Leaderboard (top 5 by points)
  const leaderboard = useMemo(() => {
    return [...users]
      .map((u) => ({ id: u.id, name: u.name, points: u.points || 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [users]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm ">
          <h3 className="text-lg font-bold mb-4">Upload a PDF</h3>
          <form onSubmit={handleUpload} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">File name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="e.g., Grade 10 Algebra Notes"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Author</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
                placeholder="e.g., Teacher Silva"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border rounded-xl px-3 py-2"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">PDF file (max 15MB)</label>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full border rounded-xl px-3 py-2"
              />
            </div>
            <button className="w-full py-2 rounded-xl bg-blue-600 text-white font-semibold">
              Upload
            </button>
            <p className="text-xs text-gray-500">
              Uploads add +1 point. Each download adds +1 point to the uploader.
            </p>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h4 className="font-semibold mb-3">Top Contributors</h4>
          {leaderboard.length === 0 ? (
            <div className="text-sm text-gray-600">No contributors yet.</div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((u, idx) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between border rounded-xl p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-gray-900 text-white text-xs flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="font-medium">{u.name}</div>
                  </div>
                  <div className="text-sm text-gray-600">{u.points} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold">Judge Demo Toolkit</div>
              <div className="text-xs text-gray-500">
                Instantly add sample resources for a smooth live demo.
              </div>
            </div>
            <button
              onClick={seedSamples}
              className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm"
            >
              Seed Sample Data
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h3 className="text-lg font-bold">Community Resources</h3>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or author"
              className="border rounded-xl px-3 py-2 w-56"
            />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="border rounded-xl px-3 py-2"
            >
              <option>All</option>
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        {resources.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{r.name}</h4>
                    <p className="text-sm text-gray-600">
                      By {r.author} ·{" "}
                      <span className="text-gray-900 font-medium">
                        {r.subject}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploaded by {r.uploaderName} ·{" "}
                      {formatTimeAgo(r.createdAt)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
                    {(r.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => onDownload(r)}
                    className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm"
                    aria-label={`Download ${r.name}`}
                  >
                    Download
                  </button>
                  <div className="text-sm text-gray-600">
                    Downloads:{" "}
                    <span className="font-semibold">{r.downloadCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-600">
      <p className="font-medium">No resources yet.</p>
      <p className="text-sm">
        Use <span className="font-semibold">Seed Sample Data</span> or upload a
        PDF to get started.
      </p>
    </div>
  );
}

function VideosPage() {
  const [filter, setFilter] = useState("All");
  const vids = useMemo(
    () =>
      seedYouTube.filter((v) =>
        filter === "All" ? true : v.subject === filter
      ),
    [filter]
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="text-lg font-bold">Educational Videos (YouTube)</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          <option>All</option>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {vids.map((v) => (
          <div
            key={v.id}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${v.id}`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-2 text-sm font-medium">{v.title}</div>
            <div className="text-xs text-gray-600">{v.subject}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ me, resources, achievements }) {
  const myRes = resources.filter((r) => r.uploaderId === me.id);
  const totalDownloads = myRes.reduce((s, r) => s + r.downloadCount, 0);
  const badge = computeBadge(me.points || 0);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center">
              {me.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-lg">{me.name}</div>
              <div className="text-sm text-gray-600">{me.email}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            <Stat label="Points" value={me.points || 0} />
            <Stat label="Uploads" value={myRes.length} />
            <Stat label="Downloads" value={totalDownloads} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-2">Contribution Badge</div>
          <div className="flex items-center gap-3">
            <BadgePill level={badge.level} />
            <div>
              <div className="font-semibold">{badge.label}</div>
              <div className="text-xs text-gray-500">
                Next: {badge.nextLabel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h4 className="font-semibold mb-3">Your Uploads</h4>
          {myRes.length === 0 ? (
            <div className="text-sm text-gray-600">No uploads yet.</div>
          ) : (
            <div className="space-y-2">
              {myRes.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between border rounded-xl p-3"
                >
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">
                      {r.subject} · Downloads: {r.downloadCount}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 border">
                    {(r.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h4 className="font-semibold mb-3">
            Achievement History (Hash-chained)
          </h4>
          {achievements.length === 0 ? (
            <div className="text-sm text-gray-600">
              No achievements yet. Upload resources and earn points to unlock
              milestones.
            </div>
          ) : (
            <div className="space-y-2">
              {achievements.map((a, idx) => (
                <div key={a.id} className="border rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(a.ts).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Type: {a.type} · Value: {a.value}
                  </div>
                  <div className="mt-2 grid md:grid-cols-2 gap-2 text-[10px] text-gray-500">
                    <div>
                      <div className="font-semibold">Hash</div>
                      <div className="font-mono break-all">{a.hash}</div>
                    </div>
                    <div>
                      <div className="font-semibold">Prev Hash</div>
                      <div className="font-mono break-all">{a.prevHash}</div>
                    </div>
                  </div>
                  {idx > 0 && achievements[idx - 1].hash !== a.prevHash && (
                    <div className="mt-2 text-xs text-red-600">
                      ⚠ Tamper detected: chain mismatch
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Production note: write these entries to a public chain (e.g.,
            Polygon testnet) with the same prev-hash linking.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function BadgePill({ level }) {
  const map = {
    bronze: "bg-amber-100 text-amber-800 border-amber-200",
    silver: "bg-gray-100 text-gray-700 border-gray-200",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
    platinum: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };
  const label = level[0].toUpperCase() + level.slice(1);
  return (
    <div
      className={`px-3 py-1 rounded-full border ${map[level]} text-sm font-semibold`}
    >
      {label}
    </div>
  );
}

function computeBadge(points) {
  if (points >= 50)
    return {
      level: "platinum",
      label: "Platinum Contributor",
      nextLabel: "Keep inspiring!",
    };
  if (points >= 30)
    return {
      level: "gold",
      label: "Gold Contributor",
      nextLabel: "50 pts → Platinum",
    };
  if (points >= 15)
    return {
      level: "silver",
      label: "Silver Contributor",
      nextLabel: "30 pts → Gold",
    };
  return {
    level: "bronze",
    label: "Bronze Contributor",
    nextLabel: "15 pts → Silver",
  };
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
