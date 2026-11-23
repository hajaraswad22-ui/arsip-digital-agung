import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Archive, Award, BookOpen, BriefcaseBusiness, Camera, ChartNoAxesCombined,
  ChevronDown, CircleHelp, CloudUpload, File, FileCheck2, FileText, Folder,
  LayoutDashboard, LogOut, Menu, Plus, Search, Settings, ShieldCheck,
  Trash2, UserRound, X, Download, Eye, CalendarDays, Filter
} from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const loginEmail = import.meta.env.VITE_LOGIN_EMAIL;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const categories = [
  { id: "surat_tugas", label: "Surat Tugas", icon: BriefcaseBusiness },
  { id: "sk", label: "Surat Keputusan (SK)", icon: FileCheck2 },
  { id: "dokumentasi", label: "Dokumentasi", icon: Camera },
  { id: "data_diri", label: "Data Diri", icon: UserRound },
  { id: "kerjasama", label: "Kerja Sama", icon: BookOpen },
  { id: "sertifikat", label: "Sertifikat", icon: Award },
  { id: "lainnya", label: "Lainnya", icon: Folder },
];

const emptyForm = { title: "", category: "surat_tugas", document_date: "", description: "", file: null };

function App() {
  const [session, setSession] = useState(null);
  const [configured, setConfigured] = useState(Boolean(supabase && loginEmail));
  const [username, setUsername] = useState("agung");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("semua");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadDocuments();
  }, [session]);

  async function loadDocuments() {
    const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (error) setNotice("Gagal memuat arsip: " + error.message);
    else setDocs(data || []);
  }

  async function signIn(e) {
    e.preventDefault();
    setLoginError("");
    if (username.trim().toLowerCase() !== "agung") {
      setLoginError("Username tidak sesuai. Gunakan username agung.");
      return;
    }
    if (!supabase || !loginEmail) {
      setLoginError("Website belum terhubung ke Supabase. Ikuti panduan README terlebih dahulu.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
    setLoading(false);
    if (error) setLoginError("Login gagal. Periksa password atau pastikan akun Supabase sudah dibuat.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setDocs([]);
  }

  async function saveDocument(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.file) return setNotice("Judul dan file wajib diisi.");
    setSaving(true);
    const safeName = `${Date.now()}-${form.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const path = `${session.user.id}/${safeName}`;
    const { error: uploadError } = await supabase.storage.from("arsip-pribadi").upload(path, form.file);
    if (uploadError) {
      setSaving(false);
      return setNotice("Upload gagal: " + uploadError.message);
    }
    const { error } = await supabase.from("documents").insert({
      title: form.title.trim(),
      category: form.category,
      document_date: form.document_date || null,
      description: form.description,
      file_path: path,
      file_name: form.file.name,
      file_type: form.file.type,
      file_size: form.file.size
    });
    setSaving(false);
    if (error) {
      await supabase.storage.from("arsip-pribadi").remove([path]);
      return setNotice("Gagal menyimpan data: " + error.message);
    }
    setForm(emptyForm);
    setShowModal(false);
    setNotice("Dokumen berhasil disimpan.");
    loadDocuments();
  }

  async function openFile(doc) {
    const { data, error } = await supabase.storage.from("arsip-pribadi").createSignedUrl(doc.file_path, 60);
    if (error) return setNotice("Tidak dapat membuka file: " + error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function deleteDocument(doc) {
    if (!confirm(`Hapus arsip "${doc.title}"?`)) return;
    const { error: dbError } = await supabase.from("documents").delete().eq("id", doc.id);
    if (dbError) return setNotice("Gagal menghapus data: " + dbError.message);
    await supabase.storage.from("arsip-pribadi").remove([doc.file_path]);
    setNotice("Arsip dihapus.");
    loadDocuments();
  }

  const visibleDocs = useMemo(() => docs.filter(d => {
    const matchesQuery = `${d.title} ${d.description || ""} ${d.file_name || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "semua" || d.category === filter;
    const matchesPage = active === "dashboard" || active === "semua" || d.category === active;
    return matchesQuery && matchesFilter && matchesPage;
  }), [docs, query, filter, active]);

  const countFor = (id) => docs.filter(d => d.category === id).length;
  const totalSize = (docs.reduce((n, d) => n + (d.file_size || 0), 0) / 1024 / 1024).toFixed(1);

  if (!session) {
    return <div className="login-shell">
      <div className="login-card">
        <div className="brand-mark"><Archive size={25}/></div>
        <div className="eyebrow">RUANG ARSIP PRIBADI</div>
        <h1>Arsip Digital</h1>
        <p className="muted login-sub">Pusat penyimpanan dokumen dan portofolio profesional.</p>
        <form onSubmit={signIn} className="login-form">
          <label>Username</label>
          <div className="input-icon"><UserRound size={17}/><input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" /></div>
          <label>Password</label>
          <div className="input-icon"><ShieldCheck size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan password" autoComplete="current-password" /></div>
          {loginError && <div className="error">{loginError}</div>}
          <button className="primary full" disabled={loading}>{loading ? "Memeriksa..." : "Masuk ke Arsip"} <span>→</span></button>
        </form>
        <div className="login-foot"><ShieldCheck size={14}/> Akses privat · hanya pemilik akun</div>
        {!configured && <div className="setup-hint">Konfigurasi Supabase belum lengkap. Lihat README.md untuk mengaktifkan login dan penyimpanan online.</div>}
      </div>
      <div className="login-side"><div className="side-glow"></div><div className="side-content"><span className="pill">PRIVATE WORKSPACE</span><h2>Semua dokumen penting,<br/>tertata dalam satu tempat.</h2><p>Kelola surat tugas, SK, dokumentasi, data diri, sertifikat, dan kerja sama dengan aman.</p><div className="side-bottom">PORTOFOLIO DIGITAL <span>•</span> AGUNG</div></div></div>
    </div>;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "show" : ""}`}>
      <div className="side-brand"><div className="brand-mark small"><Archive size={20}/></div><div><b>Arsip Digital</b><small>PERSONAL WORKSPACE</small></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div>
      <div className="nav-label">MENU UTAMA</div>
      <button className={`nav-item ${active==="dashboard"?"selected":""}`} onClick={()=>{setActive("dashboard");setMobileNav(false)}}><LayoutDashboard/>Dashboard</button>
      <button className={`nav-item ${active==="semua"?"selected":""}`} onClick={()=>{setActive("semua");setMobileNav(false)}}><Archive/>Semua Arsip</button>
      <div className="nav-label space-top">KATEGORI ARSIP</div>
      {categories.map(c => <button key={c.id} className={`nav-item ${active===c.id?"selected":""}`} onClick={()=>{setActive(c.id);setMobileNav(false)}}><c.icon/><span>{c.label}</span><small>{countFor(c.id)}</small></button>)}
      <div className="sidebar-bottom"><div className="secure-card"><ShieldCheck size={18}/><b>Arsip Privat</b><p>File hanya dapat diakses setelah login.</p></div><button className="nav-item" onClick={signOut}><LogOut/>Keluar</button></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={()=>setMobileNav(false)}></div>}
    <main className="main-area">
      <header className="topbar"><button className="menu-button" onClick={()=>setMobileNav(true)}><Menu/></button><div className="crumb">Workspace <span>/</span> {active==="dashboard"?"Dashboard":active==="semua"?"Semua Arsip":categories.find(c=>c.id===active)?.label}</div><div className="top-right"><span className="private-label"><span></span> PRIVATE</span><div className="avatar">A</div><div className="user-label"><b>Agung</b><small>Administrator</small></div><ChevronDown size={15}/></div></header>
      <div className="content">
        {notice && <div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
        {active==="dashboard" ? <>
          <div className="page-heading"><div><div className="eyebrow">SELAMAT DATANG KEMBALI</div><h1>Dashboard</h1><p>Ringkasan arsip dan portofolio profesional Anda.</p></div><button className="primary" onClick={()=>setShowModal(true)}><Plus size={17}/> Tambah Dokumen</button></div>
          <div className="stats-grid">
            <Stat icon={Archive} label="Total Dokumen" value={docs.length} note="Seluruh arsip tersimpan"/>
            <Stat icon={BriefcaseBusiness} label="Surat Tugas" value={countFor("surat_tugas")} note="Dokumen penugasan"/>
            <Stat icon={FileCheck2} label="Surat Keputusan" value={countFor("sk")} note="Arsip keputusan"/>
            <Stat icon={CloudUpload} label="Total Penyimpanan" value={`${totalSize} MB`} note="Ukuran file terunggah"/>
          </div>
          <div className="section-head"><div><h2>Kategori Arsip</h2><p>Pilih kategori untuk melihat dokumen.</p></div></div>
          <div className="category-grid">{categories.map(c=><button className="category-card" key={c.id} onClick={()=>setActive(c.id)}><div className="category-icon"><c.icon size={20}/></div><div><b>{c.label}</b><small>{countFor(c.id)} dokumen</small></div><span className="arrow">↗</span></button>)}</div>
          <div className="section-head recent-head"><div><h2>Dokumen Terbaru</h2><p>Arsip yang terakhir ditambahkan.</p></div><button className="text-button" onClick={()=>setActive("semua")}>Lihat semua →</button></div>
          <DocumentTable docs={docs.slice(0,5)} onOpen={openFile} onDelete={deleteDocument}/>
        </> : <>
          <div className="page-heading"><div><div className="eyebrow">PENGELOLAAN DOKUMEN</div><h1>{active==="semua"?"Semua Arsip":categories.find(c=>c.id===active)?.label}</h1><p>Kelola, cari, dan unduh dokumen arsip Anda.</p></div><button className="primary" onClick={()=>setShowModal(true)}><Plus size={17}/> Tambah Dokumen</button></div>
          <div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Cari nama dokumen..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filter-box"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="semua">Semua kategori</option>{categories.map(c=><option value={c.id} key={c.id}>{c.label}</option>)}</select></div><span className="result-count">{visibleDocs.length} dokumen</span></div>
          <DocumentTable docs={visibleDocs} onOpen={openFile} onDelete={deleteDocument}/>
        </>}
        <footer>© 2026 Arsip Digital Agung <span>•</span> Sistem arsip pribadi dan portofolio profesional</footer>
      </div>
    </main>
    {showModal && <div className="modal-backdrop" onClick={()=>setShowModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">ARSIP BARU</div><h2>Tambah Dokumen</h2></div><button className="icon-button" onClick={()=>setShowModal(false)}><X/></button></div><form onSubmit={saveDocument}><label>Nama/Judul Dokumen *</label><input className="field" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Contoh: Surat Tugas Kegiatan..." required/><div className="form-row"><div><label>Kategori *</label><select className="field" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option value={c.id} key={c.id}>{c.label}</option>)}</select></div><div><label>Tanggal Dokumen</label><input className="field" type="date" value={form.document_date} onChange={e=>setForm({...form,document_date:e.target.value})}/></div></div><label>Keterangan</label><textarea className="field" rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Tambahkan catatan singkat..."/><label>File Dokumen *</label><label className="upload-zone"><CloudUpload size={27}/><b>{form.file ? form.file.name : "Pilih file untuk diunggah"}</b><small>PDF, Word, Excel, JPG, PNG, MP4, dan format lainnya</small><input type="file" onChange={e=>setForm({...form,file:e.target.files?.[0]||null})}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowModal(false)}>Batal</button><button className="primary" disabled={saving}>{saving?"Mengunggah...":"Simpan Dokumen"}</button></div></form></div></div>}
  </div>;
}

function Stat({icon:Icon,label,value,note}) { return <div className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon"><Icon size={19}/></div></div><strong>{value}</strong><small>{note}</small></div>; }

function DocumentTable({docs,onOpen,onDelete}) {
  if (!docs.length) return <div className="empty-state"><div className="empty-icon"><Folder size={25}/></div><b>Belum ada dokumen</b><p>Dokumen yang Anda tambahkan akan muncul di sini.</p></div>;
  return <div className="table-wrap"><table><thead><tr><th>NAMA DOKUMEN</th><th>KATEGORI</th><th>TANGGAL</th><th>UKURAN</th><th className="actions-col">AKSI</th></tr></thead><tbody>{docs.map(d=><tr key={d.id}><td><div className="file-cell"><div className="file-icon"><FileText size={18}/></div><div><b>{d.title}</b><small>{d.file_name}</small></div></div></td><td><span className="tag">{categories.find(c=>c.id===d.category)?.label||d.category}</span></td><td>{d.document_date?new Date(d.document_date).toLocaleDateString("id-ID"):"—"}</td><td>{d.file_size?`${(d.file_size/1024/1024).toFixed(2)} MB`:"—"}</td><td><div className="actions"><button title="Lihat/Unduh" onClick={()=>onOpen(d)}><Eye size={16}/></button><button title="Hapus" onClick={()=>onDelete(d)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>;
}

export default App;
