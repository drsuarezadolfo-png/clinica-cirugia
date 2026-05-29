import { useState, useEffect, useRef } from "react"
import { supabase } from "./supabase.js"
// ─── THEME ────────────────────────────────────────────────────────────────
const G = {
bg: "#F9F6F1", surface: "#FFFFFF", surfaceAlt: "#F3EFE8", border: "#E5DDD0",
gold: "#B8975A", goldLight: "#D4B57A", goldDark: "#8A6E3A",
charcoal: "#2C2826", muted: "#8A7F74", accent: "#C4A882",
danger: "#C0392B", success: "#27AE60", info: "#2980B9",
}
const injectStyles = () => {
if (document.getElementById("clinic-styles")) return
const s = document.createElement("style")
s.id = "clinic-styles"
s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;
*{box-sizing:border-box;margin:0;padding:0;}
body{background:${G.bg};font-family:'Jost',sans-serif;color:${G.charcoal};}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${G.accent};border-rad
input,textarea,select,button{font-family:'Jost',sans-serif;}
.serif{font-family:'Cormorant Garamond',serif;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:transla
@keyframes spin{to{transform:rotate(360deg)}}
.fade-in{animation:fadeIn 0.35s ease forwards}
`
document.head.appendChild(s)
}
// ─── HELPERS ──────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const today = () => new Date().toISOString().split("T")[0]
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "2-di
const inputSty = { width: "100%", padding: "10px 14px", border: `1px solid ${G.border}`, bord
// ─── COMPONENTS ───────────────────────────────────────────────────────────
function GoldBtn({ children, onClick, small, outline, danger, disabled }) {
return (
<button onClick={onClick} disabled={disabled} style={{ padding: small ? "7px 16px" {children}
</button>
: "10p
)
}
function Spinner({ size = 36 }) {
return <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid ${G
}
function FormField({ label, children }) {
return (
<div>
<label style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing
{children}
</div>
)
}
function Tag({ label, color }) {
return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 3, background: `${col
}
function EmptyState({ icon, msg }) {
return <div style={{ textAlign: "center", padding: "60px 20px", color: G.muted }}><div styl
}
function ModalOverlay({ children, onClose }) {
return (
<div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45
<div onClick={e => e.stopPropagation()} style={{ background: G.surface, borderRadius: 1
{children}
</div>
</div>
)
}
function ModalHeader({ title, onClose }) {
return (
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", mar
<div className="serif" style={{ fontSize: 24, color: G.charcoal }}>{title}</div>
<button onClick={onClose} style={{ background: "transparent", border: "none", fontSize:
</div>
)
}
// ─── AUTH ─────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [loading, setLoading] = useState(false)
const [error, setError] = useState("")
const login = async () => {
setLoading(true); setError("")
const { error: err } = await supabase.auth.signInWithPassword({ email, password })
if (err) setError("Credenciales incorrectas. Verifica tu email y contraseña.")
setLoading(false)
}
return (
<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent:
<div style={{ background: G.surface, borderRadius: 12, padding: "48px", width: "90%", m
<div style={{ textAlign: "center", marginBottom: 36 }}>
<div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradi
<div className="serif" style={{ fontSize: 28, color: G.charcoal }}>Bienvenido</div>
<div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>Clínica de Cirugía Plás
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<FormField label="Correo electrónico"><input type="email" value={email} onChange={e
<FormField label="Contraseña"><input type="password" value={password} onChange={e =
{error && <div style={{ color: G.danger, fontSize: 13, textAlign: "center" }}>{erro
<GoldBtn onClick={login} disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}<
</div>
<div style={{ marginTop: 20, fontSize: 12, color: G.muted, textAlign: "center" </div>
</div>
}}>Los
)
}
// ─── SIDEBAR ──────────────────────────────────────────────────────────────
function Sidebar({ section, setSection, open, toggle, onLogout }) {
const items = [["agenda", " ", "Agenda"], ["patients", " ", "Pacientes"], ["aiNotes", "✦"
return (
<aside style={{ width: open ? 220 : 64, transition: "width 0.3s ease", background: G.char
<div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08
<div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradien
{open && <div><div className="serif" style={{ color: G.goldLight, fontSize: 17, fontW
</div>
<nav style={{ flex: 1, padding: "16px 0" }}>
{items.map(([id, icon, label]) => {
const active = section === id || (section === "patientDetail" && id === "patients")
return (
<button key={id} onClick={() => setSection(id)} style={{ width: "100%", display:
<span style={{ fontSize: 16 }}>{icon}</span>
{open && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
</button>
)
})}
</nav>
<button onClick={onLogout} style={{ background: "transparent", border: "none", color: G
<button onClick={toggle} style={{ background: "transparent", border: "none", color: G.m
</aside>
)
}
function PageHeader({ title, subtitle, action }) {
return (
<div style={{ padding: "32px 36px 20px", display: "flex", alignItems: "flex-end", justify
<div>
<div className="serif" style={{ fontSize: 32, fontWeight: 300 }}>{title}</div>
{subtitle && <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>{subtitle}</
</div>
{action}
</div>
)
}
// ─── AGENDA ───────────────────────────────────────────────────────────────
function AgendaSection({ userId, setModal }) {
const [appts, setAppts] = useState([])
const [loading, setLoading] = useState(true)
const load = async () => {
setLoading(true)
const { data } = await supabase.from("appointments").select("*").order("date").order("tim
setAppts(data || [])
setLoading(false)
}
useEffect(() => { load() }, [])
const updateStatus = async (id, status) => {
await supabase.from("appointments").update({ status }).eq("id", id)
setAppts(v => v.map(a => a.id === id ? { ...a, status } : a))
}
const statusColor = { confirmada: G.success, pendiente: G.gold, cancelada: G.danger }
return (
<div className="fade-in" style={{ flex: 1 }}>
<PageHeader title="Agenda" subtitle={`${appts.length} citas`} action={<GoldBtn onClick=
<div style={{ padding: "24px 36px" }}>
{loading ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><S
<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
{appts.map(a => (
<div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`
<div style={{ minWidth: 70, textAlign: "center" }}>
<div className="serif" style={{ fontSize: 26, color: G.gold }}>{a.date?.spl
<div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase" }}>{
</div>
<div style={{ width: 1, height: 40, background: G.border }} />
<div style={{ flex: 1 }}>
<div style={{ fontSize: 15, fontWeight: 500 }}>{a.patient_name}</div>
<div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>{a.procedure}</
{a.notes && <div style={{ fontSize: 12, color: G.accent, marginTop: 2 }}>
</div>
<div style={{ fontSize: 13, color: G.muted }}>{a.time}</div>
<select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} s
<option value="pendiente">Pendiente</option>
<option value="confirmada">Confirmada</option>
<option value="cancelada">Cancelada</option>
</select>
</div>
))}
</div>
)}
</div>
</div>
)
}
// ─── PATIENTS ─────────────────────────────────────────────────────────────
function PatientsSection({ userId, setModal, onOpen }) {
const [patients, setPatients] = useState([])
const [q, setQ] = useState("")
const [loading, setLoading] = useState(true)
const load = async () => {
setLoading(true)
const { data } = await supabase.from("patients").select("*").order("name")
setPatients(data || [])
setLoading(false)
}
useEffect(() => { load() }, [])
const filtered = patients.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.
return (
<div className="fade-in" style={{ flex: 1 }}>
<PageHeader title="Pacientes" subtitle={`${patients.length} pacientes`} action={<GoldBt
<div style={{ padding: "20px 36px 10px" }}>
<input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre
</div>
<div style={{ padding: "10px 36px 24px" }}>
{loading ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><S
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,
{filtered.map(p => (
<div key={p.id} onClick={() => onOpen(p)} style={{ background: G.surface, borde
onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTar
onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentT
<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
<div style={{ width: 44, height: 44, borderRadius: "50%", background: `line
<div>
<div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
<div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{p.phone}</di
</div>
</div>
<div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" {p.blood_type && <Tag label={p.blood_type} color={G.info} />}
{p.allergies && p.allergies !== "Ninguna conocida" && <Tag label="⚠ Alergia
</div>
<div style={{ marginTop: 8, fontSize: 11, color: G.muted }}>Desde {fmtDate(p.
</div>
}}>
))}
</div>
)}
</div>
</div>
)
}
// ─── PATIENT DETAIL ────────────────────────────────────────────────────────
function PatientDetail({ patient, userId, setModal, onBack }) {
const [tab, setTab] = useState("info")
const [history, setHistory] = useState([])
const [photos, setPhotos] = useState([])
const [appts, setAppts] = useState([])
const [loadingH, setLoadingH] = useState(false)
const [loadingP, setLoadingP] = useState(false)
const [loadingA, setLoadingA] = useState(false)
useEffect(() => {
if (tab === "history") loadHistory()
if (tab === "photos") loadPhotos()
if (tab === "appts") loadAppts()
}, [tab])
const loadHistory = async () => {
setLoadingH(true)
const { data } = await supabase.from("clinical_history").select("*").eq("patient_id", pat
setHistory(data || []); setLoadingH(false)
}
const loadPhotos = async () => {
setLoadingP(true)
const { data } = await supabase.from("photos").select("*").eq("patient_id", patient.id).o
setPhotos(data || []); setLoadingP(false)
}
const loadAppts = async () => {
setLoadingA(true)
const { data } = await supabase.from("appointments").select("*").eq("patient_id", patient
setAppts(data || []); setLoadingA(false)
}
<div className="serif" style={{ fontSize: 24 }}>{patient.name}</div>
<div style={{ fontSize: 13, color: G.muted }}>{patient.email} · {patient.phone}</di
return (
<div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
<div style={{ padding: "20px 36px", borderBottom: `1px solid ${G.border}`, display: "fl
<button onClick={onBack} style={{ background: "transparent", border: `1px solid ${G.b
<div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradien
<div>
</div>
</div>
<div style={{ display: "flex", borderBottom: `1px solid ${G.border}`, padding: "0 36px"
{[["info", "Información"], ["history", "Historial"], ["photos", "Fotografías"], ["app
<button key={id} onClick={() => setTab(id)} style={{ padding: "14px 20px", border:
))}
</div>
<div style={{ padding: "24px 36px", flex: 1, overflow: "auto" }}>
{tab === "info" && <PatientInfo patient={patient} />}
{tab === "history" && (loadingH ? <div style={{ display: "flex", justifyContent: "cen
{tab === "photos" && (loadingP ? <div style={{ display: "flex", justifyContent: "cent
{tab === "appts" && (loadingA ? <div style={{ display: "flex", justifyContent: "cente
</div>
</div>
)
}
function PatientInfo({ patient }) {
const fields = [["Nombre", patient.name], ["Fecha de nacimiento", fmtDate(patient.dob)], ["
return (
<div style={{ maxWidth: 600 }}>
<div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Datos del Paciente</d
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
{fields.map(([k, v]) => (
<div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borde
<div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpa
<div style={{ fontSize: 14 }}>{v}</div>
</div>
))}
</div>
</div>
)
}
function HistoryTab({ patient, history, setModal, onSave, userId }) {
return (
<div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", m
<div className="serif" style={{ fontSize: 22 }}>Historial de Procedimientos</div>
<GoldBtn small onClick={() => setModal({ type: "addHistory", patientId: patient.id, u
</div>
{history.length === 0 ? <EmptyState icon=" " msg="Sin procedimientos registrados" /> :
<div key={h.id} style={{ background: G.surface, border: `1px solid ${G.border}`, bord
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-s
<div>
</div>
<Tag label={fmtDate(h.date)} color={G.gold} />
</div>
{h.notes && <div style={{ marginTop: 14, padding: "12px 16px", background: G.surfac
{h.follow_up && <div style={{ marginTop: 8, fontSize: 12, color: G.info }}> Segui
</div>
<div className="serif" style={{ fontSize: 18 }}>{h.procedure}</div>
<div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{fmtDate(h.date)} ·
))}
</div>
)
}
function PhotosTab({ patient, photos, setModal, onSave, userId }) {
const [filter, setFilter] = useState("all")
const filtered = filter === "all" ? photos : photos.filter(p => p.type === filter)
const openPhoto = (ph) => setModal({ type: "viewPhoto", photo: ph })
return (
<div>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", m
<div className="serif" style={{ fontSize: 22 }}>Galería Fotográfica</div>
<GoldBtn small onClick={() => setModal({ type: "addPhoto", patientId: patient.id, use
</div>
<div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
{[["all", "Todas"], ["antes", "Antes"], ["despues", "Después"], ["intraop", "Intraop"
<button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRa
))}
</div>
{filtered.length === 0 ? <EmptyState icon=" " msg="Sin fotografías" /> : (
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1f
{filtered.map(ph => (
<div key={ph.id} onClick={() => openPhoto(ph)} style={{ borderRadius: 8, overflow
onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1
onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
<img src={ph.url} alt={ph.label} style={{ width: "100%", height: 160, objectFit
<div style={{ padding: "10px 12px", background: G.surface }}>
<div style={{ fontSize: 11, fontWeight: 500 }}>{ph.label || "Foto"}</div>
<div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{fmtDate(ph.date)
</div>
</div>
))}
</div>
)}
</div>
)
}
function ApptsTab({ appts }) {
const statusColor = { confirmada: G.success, pendiente: G.gold, cancelada: G.danger }
return (
<div>
<div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Historial de Citas</d
{appts.length === 0 ? <EmptyState icon=" " msg="Sin citas" /> : appts.map(a => (
<div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`, bord
<div>
<div style={{ fontWeight: 500, fontSize: 14 }}>{a.procedure}</div>
<div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{fmtDate(a.date)} {a.
</div>
<Tag label={a.status} color={statusColor[a.status] || G.gold} />
</div>
))}
</div>
)
}
// ─── AI NOTES ─────────────────────────────────────────────────────────────
function AINotesSection({ userId }) {
const [patients, setPatients] = useState([])
const [patientId, setPatientId] = useState("")
const [procedure, setProcedure] = useState("")
const [findings, setFindings] = useState("")
const [noteType, setNoteType] = useState("preoperatoria")
const [result, setResult] = useState("")
const [loading, setLoading] = useState(false)
const [error, setError] = useState("")
useEffect(() => {
}, [])
supabase.from("patients").select("id,name,blood_type,allergies").order("name").then(({ da
const generate = async () => {
if (!findings.trim()) return
setLoading(true); setError(""); setResult("")
const patient = patients.find(p => p.id === patientId)
const patientInfo = patient ? `Paciente: ${patient.name}${patient.blood_type ? ", Tipo sa
const prompt = `Eres un asistente médico especializado en cirugía plástica. Genera una no
try {
const resp = await fetch("https://api.anthropic.com/v1/messages", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages:
})
const data = await resp.json()
const text = data.content?.map(c => c.text || "").join("") || ""
if (!text) throw new Error("Sin respuesta")
setResult(text)
} catch (e) {
setError("Error generando la nota. Verifica la conexión.")
}
setLoading(false)
}
return (
<div className="fade-in" style={{ flex: 1 }}>
<PageHeader title="Notas Clínicas con IA" subtitle="Genera notas médicas profesionales
<div style={{ padding: "24px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", ga
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<div className="serif" style={{ fontSize: 20 }}>Datos de la Consulta</div>
<FormField label="Paciente">
<select value={patientId} onChange={e => setPatientId(e.target.value)} style={inp
<option value="">— Seleccionar —</option>
{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
</FormField>
<FormField label="Procedimiento"><input value={procedure} onChange={e => setProcedu
<FormField label="Tipo de Nota">
<select value={noteType} onChange={e => setNoteType(e.target.value)} style={input
{["preoperatoria", "postoperatoria", "seguimiento", "interconsulta", "urgencia"
</select>
</FormField>
<FormField label="Hallazgos y Observaciones">
<textarea value={findings} onChange={e => setFindings(e.target.value)} rows={6} p
</FormField>
<GoldBtn onClick={generate} disabled={loading}>{loading ? "Generando…" : "✦ Generar
{error && <div style={{ color: G.danger, fontSize: 13 }}>{error}</div>}
</div>
<div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8
<div className="serif" style={{ fontSize: 20, marginBottom: 16 }}>Nota Generada</di
{!result && !loading && <div style={{ flex: 1, display: "flex", alignItems: "center
{loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyCo
{result && (
<div style={{ flex: 1, overflow: "auto" }}>
<pre style={{ whiteSpace: "pre-wrap", fontFamily: "'Jost',sans-serif", fontSize
<div style={{ marginTop: 20, display: "flex", gap: 10 }}>
<GoldBtn small outline onClick={() => navigator.clipboard.writeText(result)}>
<GoldBtn small outline onClick={() => setResult("")}>Limpiar</GoldBtn>
</div>
</div>
)}
</div>
</div>
</div>
)
}
// ─── FORMS ────────────────────────────────────────────────────────────────
function AddPatientForm({ userId, onSave, onClose }) {
const [f, setF] = useState({ name: "", dob: "", phone: "", email: "", blood_type: "", aller
const [saving, setSaving] = useState(false)
const set = (k, v) => setF(p => ({ ...p, [k]: v }))
const save = async () => {
if (!f.name.trim()) return
setSaving(true)
await supabase.from("patients").insert({ ...f })
onSave(); onClose()
}
return (
<div>
<ModalHeader title="Nuevo Paciente" onClose={onClose} />
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<FormField label="Nombre completo"><input value={f.name} onChange={e => set("name", e
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
<FormField label="Fecha de nacimiento"><input type="date" value={f.dob} onChange={e
<FormField label="Tipo sanguíneo">
<select value={f.blood_type} onChange={e => set("blood_type", e.target.value)} st
<option value="">—</option>
{["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(t => <option key={t}>{t
</select>
</FormField>
</div>
<FormField label="Teléfono"><input value={f.phone} onChange={e => set("phone", e.targ
<FormField label="Correo"><input value={f.email} onChange={e => set("email", e.target
<FormField label="Alergias"><input value={f.allergies} onChange={e => set("allergies"
<FormField label="Notas"><textarea value={f.notes} onChange={e => set("notes", e.targ
<div style={{ display: "flex", gap: 10 }}>
<GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Gold
<GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
</div>
</div>
</div>
)
}
function AddApptForm({ userId, onSave, onClose }) {
const [patients, setPatients] = useState([])
const [f, setF] = useState({ patient_id: "", patient_name: "", date: today(), time: "10:00"
const [saving, setSaving] = useState(false)
const set = (k, v) => setF(p => ({ ...p, [k]: v }))
useEffect(() => {
}, [])
supabase.from("patients").select("id,name").order("name").then(({ data }) => setPatients(
const save = async () => {
if (!f.patient_id || !f.procedure.trim()) return
setSaving(true)
const patient = patients.find(p => p.id === f.patient_id)
await supabase.from("appointments").insert({ ...f, patient_name: patient?.name || "" })
onSave(); onClose()
}
return (
<div>
<ModalHeader title="Nueva Cita" onClose={onClose} />
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<FormField label="Paciente">
<select value={f.patient_id} onChange={e => set("patient_id", e.target.value)} styl
<option value="">— Seleccionar —</option>
{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
</FormField>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
<FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date
<FormField label="Hora"><input type="time" value={f.time} onChange={e => set("time"
</div>
<FormField label="Procedimiento"><input value={f.procedure} onChange={e => set("proce
<FormField label="Estado">
<select value={f.status} onChange={e => set("status", e.target.value)} style={input
<option value="pendiente">Pendiente</option><option value="confirmada">Confirmada
</select>
</FormField>
<FormField label="Notas"><input value={f.notes} onChange={e => set("notes", e.target.
<div style={{ display: "flex", gap: 10 }}>
<GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Gold
<GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
</div>
</div>
</div>
)
}
function AddHistoryForm({ patientId, userId, onSave, onClose }) {
const [f, setF] = useState({ date: today(), procedure: "", surgeon: "", anesthesia: "Genera
const [saving, setSaving] = useState(false)
const set = (k, v) => setF(p => ({ ...p, [k]: v }))
const save = async () => {
if (!f.procedure.trim()) return
setSaving(true)
await supabase.from("clinical_history").insert({ ...f, patient_id: patientId })
onSave(); onClose()
}
return (
<div>
<ModalHeader title="Agregar Procedimiento" onClose={onClose} />
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<FormField label="Procedimiento"><input value={f.procedure} onChange={e => set("proce
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
<FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date
<FormField label="Cirujano"><input value={f.surgeon} onChange={e => set("surgeon",
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
<FormField label="Anestesia">
<select value={f.anesthesia} onChange={e => set("anesthesia", e.target.value)} st
{["General", "Local", "Sedación", "Epidural"].map(a => <option key={a}>{a}</opt
</select>
</FormField>
<FormField label="Duración"><input value={f.duration} onChange={e => set("duration"
onChan
</div>
<FormField label="Notas clínicas"><textarea value={f.notes} onChange={e => set("notes
<FormField label="Fecha de seguimiento"><input type="date" value={f.follow_up} <div style={{ display: "flex", gap: 10 }}>
<GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Gold
<GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
</div>
</div>
</div>
)
}
function AddPhotoForm({ patientId, userId, onSave, onClose }) {
const [f, setF] = useState({ label: "", type: "antes", date: today(), notes: "" })
const [preview, setPreview] = useState("")
const [saving, setSaving] = useState(false)
const fileRef = useRef()
const set = (k, v) => setF(p => ({ ...p, [k]: v }))
const handleFile = (e) => {
const file = e.target.files[0]
if (!file) return
const reader = new FileReader()
reader.onload = ev => setPreview(ev.target.result)
reader.readAsDataURL(file)
}
const save = async () => {
if (!preview) return
setSaving(true)
try {
// Upload to Supabase Storage
const fileName = `${patientId}/${Date.now()}-${f.type}.jpg`
const base64Data = preview.split(",")[1]
const byteCharacters = atob(base64Data)
const byteNumbers = new Array(byteCharacters.length)
for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCod
const byteArray = new Uint8Array(byteNumbers)
const blob = new Blob([byteArray], { type: "image/jpeg" })
const { data: uploadData, error: uploadError } = await supabase.storage.from("patient-p
let url = preview // fallback to base64 if upload fails
if (!uploadError) {
const { data: urlData } = supabase.storage.from("patient-photos").getPublicUrl(fileNa
url = urlData?.publicUrl || preview
}
await supabase.from("photos").insert({ ...f, patient_id: patientId, storage_path: fileN
onSave(); onClose()
} catch (e) {
// Save with base64 as fallback
await supabase.from("photos").insert({ ...f, patient_id: patientId, url: preview onSave(); onClose()
})
}
}
return (
<div>
<ModalHeader title="Agregar Fotografía" onClose={onClose} />
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${preview ?
{preview ? <img src={preview} alt="" style={{ maxHeight: 180, maxWidth: "100%", bor
</div>
<input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ disp
<FormField label="Descripción"><input value={f.label} onChange={e => set("label", e.t
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
<FormField label="Tipo">
<select value={f.type} onChange={e => set("type", e.target.value)} style={inputSt
{[["antes", "Antes"], ["despues", "Después"], ["intraop", "Intraop"], ["seguimi
</select>
</FormField>
<FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date
</div>
<FormField label="Notas"><input value={f.notes} onChange={e => set("notes", e.target.
<div style={{ display: "flex", gap: 10 }}>
<GoldBtn onClick={save} disabled={saving || !preview}>{saving ? "Subiendo…" : "Guar
<GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
</div>
</div>
</div>
)
}
function PhotoViewer({ photo, onClose }) {
return (
<div>
<ModalHeader title={photo.label || "Fotografía"} onClose={onClose} />
<img src={photo.url} alt={photo.label} style={{ width: "100%", maxHeight: 420, objectFi
<div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "c
<Tag label={photo.type} color={photo.type === "antes" ? G.info : photo.type === "desp
<span style={{ fontSize: 13, color: G.muted }}>{fmtDate(photo.date)}</span>
</div>
{photo.notes && <div style={{ marginTop: 12, fontSize: 13, color: G.muted }}>{photo.not
</div>
)
}
// ─── MAIN APP ─────────────────────────────────────────────────────────────
export default function App() {
injectStyles()
const [session, setSession] = useState(null)
const [loading, setLoading] = useState(true)
const [section, setSection] = useState("agenda")
const [selectedPatient, setSelectedPatient] = useState(null)
const [sidebarOpen, setSidebarOpen] = useState(true)
const [modal, setModal] = useState(null)
useEffect(() => {
supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoad
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => s
return () => subscription.unsubscribe()
}, [])
const logout = () => supabase.auth.signOut()
if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center"
if (!session) return <LoginScreen />
const userId = session.user.id
const changeSection = (s) => { setSection(s); setSelectedPatient(null) }
return (
<div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
<Sidebar section={section} setSection={changeSection} open={sidebarOpen} toggle={() =>
<main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
{section === "agenda" && <AgendaSection userId={userId} setModal={setModal} />}
{section === "patients" && <PatientsSection userId={userId} setModal={setModal} onOpe
{section === "patientDetail" && selectedPatient && <PatientDetail patient={selectedPa
{section === "aiNotes" && <AINotesSection userId={userId} />}
</main>
{modal && (
<ModalOverlay onClose={() => setModal(null)}>
{modal.type === "addPatient" && <AddPatientForm userId={userId} onSave={modal.onSav
{modal.type === "addAppt" && <AddApptForm userId={userId} onSave={modal.onSave} onC
{modal.type === "addHistory" && <AddHistoryForm patientId={modal.patientId} userId=
{modal.type === "addPhoto" && <AddPhotoForm patientId={modal.patientId} userId={use
{modal.type === "viewPhoto" && <PhotoViewer photo={modal.photo} onClose={() => setM
</ModalOverlay>
)}
</div>
)
}

  
