import React, {useEffect, useState} from "react";
import {
  ShieldCheck, LockKeyhole, UploadCloud, Fingerprint, Clock3, FileCheck2,
  Search, Bell, LogOut, Trash2, RefreshCw, FileText, ChevronRight,
  Sparkles, ShieldAlert, X, CheckCircle2
} from "lucide-react";
import {api} from "./api";

const categories = ["All","Invoice","Warranty","Certificate","Agreement","Repair","Insurance","Other"];

function Logo(){ return <div className="brand"><div className="brandMark"><ShieldCheck size={22}/></div><div><b>VeriVault</b><small>YOUR EVIDENCE. VERIFIED.</small></div></div> }

function Auth({onAuth}) {
  const [mode,setMode]=useState("login"), [form,setForm]=useState({name:"",email:"",password:""}), [error,setError]=useState(""), [busy,setBusy]=useState(false);
  async function submit(e){
    e.preventDefault(); setBusy(true); setError("");
    try {
      const data = mode==="login" ? await api.login({email:form.email,password:form.password}) : await api.register(form);
      localStorage.setItem("verivault_token",data.token); onAuth(data.name);
    } catch(err){setError(err.message)} finally{setBusy(false)}
  }
  return <div className="authPage"><div className="authGlow"/><div className="authCard">
    <Logo/><div className="eyebrow">DIGITAL EVIDENCE VAULT</div>
    <h1>{mode==="login" ? "Welcome back." : "Secure what matters."}</h1>
    <p className="muted">{mode==="login" ? "Access your verified evidence vault." : "Create your personal evidence vault."}</p>
    <form onSubmit={submit}>
      {mode==="register" && <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>}
      <input type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
      <input type="password" placeholder="Password (6+ characters)" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} minLength="6" required/>
      {error && <div className="error">{error}</div>}
      <button className="primary wide" disabled={busy}>{busy?"Please wait…":mode==="login"?"Enter Vault →":"Create Vault →"}</button>
    </form>
    <button className="linkBtn" onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}>{mode==="login"?"Create a new account":"Already have an account? Sign in"}</button>
    <div className="authTrust"><span>✓ SHA-256 fingerprints</span><span>✓ Secure access</span></div>
  </div></div>
}

function UploadModal({onClose,onDone}){
  const [file,setFile]=useState(null),[description,setDescription]=useState(""),[warranty,setWarranty]=useState(""),[tags,setTags]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function submit(e){
    e.preventDefault(); if(!file)return;
    const fd=new FormData();fd.append("file",file);fd.append("description",description);fd.append("warranty_until",warranty);fd.append("tags",tags);
    setBusy(true);setError("");
    try{await api.upload(fd);onDone()}catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <div className="modalBack"><div className="modal">
    <button className="close" onClick={onClose}><X/></button><div className="eyebrow">NEW EVIDENCE</div><h2>Protect a document.</h2><p className="muted">A SHA-256 fingerprint and timestamp will be created automatically.</p>
    <form onSubmit={submit}>
      <label className="drop"><UploadCloud size={32}/><strong>{file?file.name:"Choose a document"}</strong><small>PDF, JPG, PNG, DOC or TXT · max 15 MB</small><input type="file" onChange={e=>setFile(e.target.files?.[0])} required/></label>
      <textarea placeholder="What is this evidence about?" value={description} onChange={e=>setDescription(e.target.value)}/>
      <div className="two"><input type="date" value={warranty} onChange={e=>setWarranty(e.target.value)}/><input placeholder="Tags: laptop, purchase" value={tags} onChange={e=>setTags(e.target.value)}/></div>
      {error&&<div className="error">{error}</div>}<button className="primary wide" disabled={busy}>{busy?"Securing…":"Upload & Verify →"}</button>
    </form>
  </div></div>
}

function Dashboard({name,onLogout}){
 const [stats,setStats]=useState(null),[docs,setDocs]=useState([]),[q,setQ]=useState(""),[cat,setCat]=useState("All"),[showUpload,setShowUpload]=useState(false),[toast,setToast]=useState("");
 async function load(){try{const [s,d]=await Promise.all([api.stats(),api.evidence(q,cat)]);setStats(s);setDocs(d)}catch(e){if(e.message.includes("Authentication"))onLogout()}}
 useEffect(()=>{load()},[q,cat]);
 async function verify(id){try{const r=await api.verify(id);setToast(r.verified?"✓ Integrity verified — document is unchanged.":"⚠ Tamper detected — fingerprint does not match.");load()}catch(e){setToast(e.message)}}
 async function remove(id){if(confirm("Delete this evidence permanently?")){await api.remove(id);load()}}
 return <div>
  <header className="topbar"><Logo/><div className="topActions"><button className="iconBtn"><Bell size={18}/></button><div className="user">{name?.[0]?.toUpperCase()||"U"}</div><button className="logout" onClick={onLogout}><LogOut size={16}/> Sign out</button></div></header>
  <main className="dashboard">
   <div className="dashHero"><div><div className="eyebrow">PERSONAL EVIDENCE VAULT</div><h1>Good to see you, {name?.split(" ")[0]||"there"}.</h1><p className="muted">Your important proof, organized and verifiable.</p></div><button className="primary" onClick={()=>setShowUpload(true)}><UploadCloud size={17}/> Add Evidence</button></div>
   <section className="metricGrid">
    <Metric icon={<FileCheck2/>} value={stats?.documents??"—"} label="Documents secured"/>
    <Metric icon={<ShieldCheck/>} value={stats?`${stats.verification_rate}%`:"—"} label="Verification rate"/>
    <Metric icon={<ShieldAlert/>} value={stats?.tampered??"—"} label="Tampered records"/>
    <Metric icon={<Clock3/>} value="24/7" label="Evidence access"/>
   </section>
   <section className="vaultPanel">
    <div className="panelHead"><div><h2>Your Evidence</h2><p className="muted">Every file carries its own cryptographic fingerprint.</p></div><div className="search"><Search size={16}/><input placeholder="Search evidence…" value={q} onChange={e=>setQ(e.target.value)}/></div></div>
    <div className="chips">{categories.map(c=><button className={cat===c?"chip active":"chip"} key={c} onClick={()=>setCat(c)}>{c}</button>)}</div>
    {docs.length===0?<Empty onAdd={()=>setShowUpload(true)}/>:<div className="evidenceList">{docs.map(d=><EvidenceCard key={d.id} doc={d} onVerify={verify} onDelete={remove}/>)}</div>}
   </section>
   <section className="timelinePanel"><div className="panelHead"><div><h2>Evidence Timeline</h2><p className="muted">A chronological view of your verified records.</p></div></div><Timeline docs={docs}/></section>
  </main>
  {showUpload&&<UploadModal onClose={()=>setShowUpload(false)} onDone={()=>{setShowUpload(false);load();setToast("✓ Evidence secured and verified.")}}/>}
  {toast&&<div className="toast" onClick={()=>setToast("")}>{toast}</div>}
 </div>
}

function Metric({icon,value,label}){return <div className="metric"><div className="metricIcon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>}
function Empty({onAdd}){return <div className="empty"><Fingerprint size={42}/><h3>Your vault is empty</h3><p>Upload your first invoice, certificate, warranty or agreement.</p><button className="primary" onClick={onAdd}>Add your first evidence</button></div>}
function EvidenceCard({doc,onVerify,onDelete}){
 return <div className="evidenceCard"><div className="fileIcon"><FileText/></div><div className="fileMain"><div className="fileTitle"><h3>{doc.filename}</h3><span className={doc.status==="TAMPERED"?"status bad":"status"}>{doc.status==="TAMPERED"?"⚠ TAMPERED":"✓ VERIFIED"}</span></div><div className="meta"><span>{doc.category}</span><span>{formatSize(doc.file_size)}</span><span>{new Date(doc.created_at).toLocaleDateString()}</span></div><p>{doc.description||"No description added."}</p><code>{doc.sha256.slice(0,20)}…{doc.sha256.slice(-8)}</code></div><div className="cardActions"><button title="Verify integrity" onClick={()=>onVerify(doc.id)}><RefreshCw size={16}/></button><button title="Delete" onClick={()=>onDelete(doc.id)}><Trash2 size={16}/></button></div></div>
}
function Timeline({docs}){return <div className="timeline">{docs.slice(0,8).map((d,i)=><div className="timelineItem" key={d.id}><div className="timelineDot">{d.status==="TAMPERED"?"!":"✓"}</div><div><strong>{d.category}</strong><span>{d.filename}</span><small>{new Date(d.created_at).toLocaleString()}</small></div></div>)}</div>}
function formatSize(n){if(!n)return "0 KB";if(n<1024*1024)return `${Math.round(n/1024)} KB`;return `${(n/1024/1024).toFixed(1)} MB`}

export default function App(){
 const [authed,setAuthed]=useState(!!localStorage.getItem("verivault_token")), [name,setName]=useState(localStorage.getItem("verivault_name")||"");
 function logout(){localStorage.removeItem("verivault_token");localStorage.removeItem("verivault_name");setAuthed(false)}
 function auth(n){localStorage.setItem("verivault_name",n);setName(n);setAuthed(true)}
 return authed?<Dashboard name={name} onLogout={logout}/>:<Auth onAuth={auth}/>
}
