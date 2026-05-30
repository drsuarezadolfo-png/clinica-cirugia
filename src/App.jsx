import { useState, useEffect, useRef } from "react"
import { supabase } from "./supabase.js"

const G = {
  bg: "#F9F6F1", surface: "#FFFFFF", surfaceAlt: "#F3EFE8", border: "#E5DDD0",
  gold: "#B8975A", goldLight: "#D4B57A", goldDark: "#8A6E3A",
  charcoal: "#2C2826", muted: "#8A7F74", accent: "#C4A882",
  danger: "#C0392B", success: "#27AE60", info: "#2980B9", warn: "#E67E22",
}

const injectStyles = () => {
  if (document.getElementById("clinic-styles")) return
  const s = document.createElement("style")
  s.id = "clinic-styles"
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${G.bg};font-family:'Jost',sans-serif;color:${G.charcoal};}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${G.accent};border-radius:3px}
    input,textarea,select,button{font-family:'Jost',sans-serif;}
    .serif{font-family:'Cormorant Garamond',serif;}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fade-in{animation:fadeIn 0.35s ease forwards}
  `
  document.head.appendChild(s)
}

const today = () => new Date().toISOString().split("T")[0]
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"
const inputSty = { width: "100%", padding: "10px 14px", border: `1px solid ${G.border}`, borderRadius: 6, fontSize: 13, outline: "none", background: G.bg, color: G.charcoal }

function GoldBtn({ children, onClick, small, outline, danger, disabled }) {
  return <button onClick={onClick} disabled={disabled} style={{ padding: small ? "7px 16px" : "10px 22px", background: danger ? G.danger : outline ? "transparent" : `linear-gradient(135deg,${G.gold},${G.goldDark})`, color: outline ? G.gold : "#FFF", border: outline ? `1.5px solid ${G.gold}` : "none", borderRadius: 4, fontSize: small ? 12 : 13, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>{children}</button>
}
function Spinner({ size = 36 }) { return <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid ${G.border}`, borderTopColor: G.gold, animation: "spin 0.8s linear infinite" }} /> }
function FormField({ label, children }) { return <div><label style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{label}</label>{children}</div> }
function Tag({ label, color }) { return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 3, background: `${color}18`, color, border: `1px solid ${color}40` }}>{label}</span> }
function EmptyState({ icon, msg }) { return <div style={{ textAlign: "center", padding: "60px 20px", color: G.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div><div style={{ fontSize: 14 }}>{msg}</div></div> }
function ModalOverlay({ children, onClose, wide }) {
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div onClick={e => e.stopPropagation()} style={{ background: G.surface, borderRadius: 10, padding: "32px", maxWidth: wide ? 900 : 520, width: "90%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>{children}</div>
  </div>
}
function ModalHeader({ title, onClose }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}><div className="serif" style={{ fontSize: 24 }}>{title}</div><button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: G.muted, cursor: "pointer" }}>✕</button></div>
}

const pdfStyles = `body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#2C2826;line-height:1.7}h1{font-size:26px;color:#B8975A;border-bottom:2px solid #B8975A;padding-bottom:10px;margin-bottom:20px}h2{font-size:18px;margin:28px 0 12px}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px}.field{background:#F3EFE8;padding:10px 14px;border-radius:6px}.field-label{font-size:11px;color:#8A7F74;text-transform:uppercase;letter-spacing:0.08em}.field-value{font-size:14px;margin-top:4px}.card{background:#F9F6F1;border:1px solid #E5DDD0;border-radius:8px;padding:18px;margin:12px 0}.card-title{font-size:16px;font-weight:bold;margin-bottom:6px}.card-meta{color:#8A7F74;font-size:12px;margin-bottom:8px}.notes{background:#fff;border-left:3px solid #B8975A;padding:10px 14px;margin-top:10px;font-size:13px;white-space:pre-wrap}.footer{color:#8A7F74;font-size:11px;border-top:1px solid #E5DDD0;padding-top:14px;margin-top:40px}`
const downloadPDF = (filename, htmlContent) => {
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${pdfStyles}</style></head><body>${htmlContent}</body></html>`
  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click()
  URL.revokeObjectURL(url)
}
const downloadPhoto = (photo) => {
  const link = document.createElement("a"); link.href = photo.url
  link.download = `${photo.label || "foto"}-${photo.date || "sf"}.jpg`; link.target = "_blank"; link.click()
}

// ─── AUTH ─────────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false); const [error, setError] = useState("")
  const login = async () => {
    setLoading(true); setError("")
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) setError("Credenciales incorrectas.")
    setLoading(false)
  }
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.charcoal }}>
    <div style={{ background: G.surface, borderRadius: 12, padding: "48px", width: "90%", maxWidth: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✦</div>
        <div className="serif" style={{ fontSize: 28 }}>Bienvenido</div>
        <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>Clínica de Cirugía Plástica</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Correo electrónico"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputSty} onKeyDown={e => e.key === "Enter" && login()} /></FormField>
        <FormField label="Contraseña"><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputSty} onKeyDown={e => e.key === "Enter" && login()} /></FormField>
        {error && <div style={{ color: G.danger, fontSize: 13, textAlign: "center" }}>{error}</div>}
        <GoldBtn onClick={login} disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</GoldBtn>
      </div>
    </div>
  </div>
}

function Sidebar({ section, setSection, open, toggle, onLogout }) {
  const items = [["agenda", "📅", "Agenda"], ["patients", "👤", "Pacientes"], ["stats", "📊", "Estadísticas"], ["templates", "📋", "Plantillas"], ["aiNotes", "✦", "Notas con IA"]]
  return <aside style={{ width: open ? 220 : 64, transition: "width 0.3s ease", background: G.charcoal, display: "flex", flexDirection: "column", flexShrink: 0 }}>
    <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
      {open && <div><div className="serif" style={{ color: G.goldLight, fontSize: 17, fontWeight: 500, whiteSpace: "nowrap" }}>Clínica</div><div style={{ color: G.muted, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Cirugía Plástica</div></div>}
    </div>
    <nav style={{ flex: 1, padding: "16px 0" }}>
      {items.map(([id, icon, label]) => {
        const active = section === id || (section === "patientDetail" && id === "patients")
        return <button key={id} onClick={() => setSection(id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: open ? "12px 20px" : "12px 0", justifyContent: open ? "flex-start" : "center", background: active ? "rgba(184,151,90,0.15)" : "transparent", border: "none", borderLeft: active ? `3px solid ${G.gold}` : "3px solid transparent", color: active ? G.goldLight : G.muted, fontSize: 13, fontWeight: active ? 500 : 400, cursor: "pointer" }}>
          <span style={{ fontSize: 16 }}>{icon}</span>{open && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
        </button>
      })}
    </nav>
    <button onClick={onLogout} style={{ background: "transparent", border: "none", color: G.muted, padding: "12px", fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>{open ? "⎋ Cerrar sesión" : "⎋"}</button>
    <button onClick={toggle} style={{ background: "transparent", border: "none", color: G.muted, padding: "12px", fontSize: 16, textAlign: open ? "right" : "center" }}>{open ? "◀" : "▶"}</button>
  </aside>
}

function PageHeader({ title, subtitle, action }) {
  return <div style={{ padding: "32px 36px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `1px solid ${G.border}` }}>
    <div><div className="serif" style={{ fontSize: 32, fontWeight: 300 }}>{title}</div>{subtitle && <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>{subtitle}</div>}</div>
    {action}
  </div>
}

// ─── AGENDA ───────────────────────────────────────────────────────────────
function AgendaSection({ setModal }) {
  const [appts, setAppts] = useState([]); const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); const { data } = await supabase.from("appointments").select("*").order("date").order("time"); setAppts(data || []); setLoading(false) }
  useEffect(() => { load() }, [])
  const updateStatus = async (id, status) => { await supabase.from("appointments").update({ status }).eq("id", id); setAppts(v => v.map(a => a.id === id ? { ...a, status } : a)) }
  const deleteAppt = async (id) => { if (!confirm("¿Eliminar esta cita?")) return; await supabase.from("appointments").delete().eq("id", id); setAppts(v => v.filter(a => a.id !== id)) }
  const statusColor = { confirmada: G.success, pendiente: G.gold, cancelada: G.danger }
  return <div className="fade-in" style={{ flex: 1 }}>
    <PageHeader title="Agenda" subtitle={`${appts.length} citas`} action={<GoldBtn onClick={() => setModal({ type: "addAppt", onSave: load })}>+ Nueva Cita</GoldBtn>} />
    <div style={{ padding: "24px 36px" }}>
      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> : appts.length === 0 ? <EmptyState icon="📅" msg="Sin citas registradas" /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {appts.map(a => <div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "18px 22px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ minWidth: 70, textAlign: "center" }}>
              <div className="serif" style={{ fontSize: 26, color: G.gold }}>{a.date?.split("-")[2]}</div>
              <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase" }}>{a.date ? new Date(a.date + "T12:00:00").toLocaleDateString("es-MX", { month: "short" }) : ""}</div>
            </div>
            <div style={{ width: 1, height: 40, background: G.border }} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 500 }}>{a.patient_name}</div><div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>{a.procedure}</div>{a.location && <div style={{ fontSize: 12, color: G.info, marginTop: 2 }}>📍 {a.location}</div>}{a.notes && <div style={{ fontSize: 12, color: G.accent, marginTop: 2 }}>📝 {a.notes}</div>}</div>
            <div style={{ fontSize: 13, color: G.muted }}>{a.time}</div>
            <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} style={{ padding: "5px 10px", border: `1px solid ${statusColor[a.status] || G.border}`, borderRadius: 4, fontSize: 12, color: statusColor[a.status], background: G.surfaceAlt, outline: "none" }}>
              <option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option>
            </select>
            <button onClick={() => setModal({ type: "editAppt", appt: a, onSave: load })} style={{ background: "transparent", border: "none", color: G.gold, cursor: "pointer", fontSize: 15 }}>✏️</button>
            <button onClick={() => deleteAppt(a.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
          </div>)}
        </div>}
    </div>
  </div>
}

// ─── PATIENTS ─────────────────────────────────────────────────────────────
function PatientsSection({ setModal, onOpen }) {
  const [patients, setPatients] = useState([]); const [q, setQ] = useState(""); const [loading, setLoading] = useState(true)
  const load = async () => { setLoading(true); const { data } = await supabase.from("patients").select("*").order("name"); setPatients(data || []); setLoading(false) }
  useEffect(() => { load() }, [])
  const deletePatient = async (e, id) => { e.stopPropagation(); if (!confirm("¿Eliminar este paciente y todos sus datos?")) return; await supabase.from("patients").delete().eq("id", id); setPatients(v => v.filter(p => p.id !== id)) }
  const filtered = patients.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.phone || "").includes(q))
  return <div className="fade-in" style={{ flex: 1 }}>
    <PageHeader title="Pacientes" subtitle={`${patients.length} pacientes`} action={<GoldBtn onClick={() => setModal({ type: "addPatient", onSave: load })}>+ Nuevo Paciente</GoldBtn>} />
    <div style={{ padding: "20px 36px 10px" }}><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o teléfono…" style={{ ...inputSty, maxWidth: 400 }} /></div>
    <div style={{ padding: "10px 36px 24px" }}>
      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> : filtered.length === 0 ? <EmptyState icon="👤" msg="Sin pacientes" /> :
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {filtered.map(p => <div key={p.id} onClick={() => onOpen(p)} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.boxShadow = `0 4px 20px rgba(184,151,90,0.12)` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.boxShadow = "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 18, flexShrink: 0 }}>{p.name[0]}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{p.phone}</div></div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); setModal({ type: "editPatient", patient: p, onSave: load }) }} style={{ background: "transparent", border: "none", color: G.gold, cursor: "pointer", fontSize: 15 }}>✏️</button>
                <button onClick={e => deletePatient(e, p.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 15 }}>🗑</button>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {p.blood_type && <Tag label={p.blood_type} color={G.info} />}
              {p.allergies && p.allergies !== "Ninguna conocida" && <Tag label="⚠ Alergias" color={G.danger} />}
            </div>
          </div>)}
        </div>}
    </div>
  </div>
}

// ─── PATIENT DETAIL ────────────────────────────────────────────────────────
function PatientDetail({ patient, setModal, onBack }) {
  const [tab, setTab] = useState("info")
  return <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
    <div style={{ padding: "20px 36px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 18 }}>
      <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${G.border}`, borderRadius: 4, padding: "7px 14px", fontSize: 12, color: G.muted, cursor: "pointer" }}>← Pacientes</button>
      <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 22 }}>{patient.name[0]}</div>
      <div style={{ flex: 1 }}><div className="serif" style={{ fontSize: 24 }}>{patient.name}</div><div style={{ fontSize: 13, color: G.muted }}>{patient.email} · {patient.phone}</div></div>
      <GoldBtn small outline onClick={() => setModal({ type: "editPatient", patient, onSave: () => {} })}>✏️ Editar</GoldBtn>
    </div>
    <div style={{ display: "flex", borderBottom: `1px solid ${G.border}`, padding: "0 36px", flexWrap: "wrap" }}>
      {[["info", "Información"], ["history", "Historial Clínico"], ["photos", "Fotografías"], ["appts", "Citas"]].map(([id, label]) =>
        <button key={id} onClick={() => setTab(id)} style={{ padding: "14px 20px", border: "none", borderBottom: tab === id ? `2px solid ${G.gold}` : "2px solid transparent", background: "transparent", fontSize: 13, color: tab === id ? G.gold : G.muted, fontWeight: tab === id ? 500 : 400, cursor: "pointer" }}>{label}</button>)}
    </div>
    <div style={{ padding: "24px 36px", flex: 1, overflow: "auto" }}>
      {tab === "info" && <PatientInfo patient={patient} />}
      {tab === "history" && <HistorySection patient={patient} setModal={setModal} />}
      {tab === "photos" && <PhotosSection patient={patient} setModal={setModal} />}
      {tab === "appts" && <ApptsTab patientId={patient.id} />}
    </div>
  </div>
}

function PatientInfo({ patient }) {
  const fields = [["Nombre", patient.name], ["Fecha de nacimiento", fmtDate(patient.dob)], ["Teléfono", patient.phone], ["Correo", patient.email], ["Tipo sanguíneo", patient.blood_type], ["Alergias", patient.allergies || "—"], ["Notas", patient.notes || "—"]]
  return <div style={{ maxWidth: 600 }}>
    <div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Datos del Paciente</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {fields.map(([k, v]) => <div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 6, padding: "14px 18px" }}><div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{k}</div><div style={{ fontSize: 14 }}>{v}</div></div>)}
    </div>
  </div>
}

// ─── HISTORY (Procedimientos / Evoluciones / Complicaciones) ───────────────
function HistorySection({ patient, setModal }) {
  const [subTab, setSubTab] = useState("procedures")
  const [procedures, setProcedures] = useState([]); const [evolutions, setEvolutions] = useState([]); const [complications, setComplications] = useState([])
  const [loading, setLoading] = useState(false)

  const loadProcedures = async () => { setLoading(true); const { data } = await supabase.from("clinical_history").select("*").eq("patient_id", patient.id).order("date", { ascending: false }); setProcedures(data || []); setLoading(false) }
  const loadEvolutions = async () => { setLoading(true); const { data } = await supabase.from("evolutions").select("*").eq("patient_id", patient.id).order("date", { ascending: false }); setEvolutions(data || []); setLoading(false) }
  const loadComplications = async () => { setLoading(true); const { data } = await supabase.from("complications").select("*").eq("patient_id", patient.id).order("date", { ascending: false }); setComplications(data || []); setLoading(false) }

  useEffect(() => {
    if (subTab === "procedures") loadProcedures()
    if (subTab === "evolutions") loadEvolutions()
    if (subTab === "complications") loadComplications()
  }, [subTab])

  const del = async (table, id, setter) => { if (!confirm("¿Eliminar este registro?")) return; await supabase.from(table).delete().eq("id", id); setter(v => v.filter(x => x.id !== id)) }

  const dlProcedures = () => downloadPDF(`procedimientos-${patient.name.replace(/\s+/g, "-")}.html`, `<h1>Historial de Procedimientos</h1><div class="info-grid"><div class="field"><div class="field-label">Paciente</div><div class="field-value">${patient.name}</div></div><div class="field"><div class="field-label">Tipo sanguíneo</div><div class="field-value">${patient.blood_type || "—"}</div></div><div class="field"><div class="field-label">Alergias</div><div class="field-value">${patient.allergies || "—"}</div></div><div class="field"><div class="field-label">Teléfono</div><div class="field-value">${patient.phone || "—"}</div></div></div><h2>Procedimientos (${procedures.length})</h2>${procedures.map(h => `<div class="card"><div class="card-title">${h.procedure}</div><div class="card-meta">${fmtDate(h.date)} · ${h.surgeon || "—"} · Anestesia: ${h.anesthesia || "—"} · Duración: ${h.duration || "—"}</div>${h.notes ? `<div class="notes">${h.notes}</div>` : ""}${h.follow_up ? `<div class="card-meta" style="margin-top:8px">Seguimiento: ${fmtDate(h.follow_up)}</div>` : ""}</div>`).join("")}<div class="footer">Generado el ${new Date().toLocaleDateString("es-MX")} · Clínica de Cirugía Plástica</div>`)
  const dlEvolutions = () => downloadPDF(`evoluciones-${patient.name.replace(/\s+/g, "-")}.html`, `<h1>Evoluciones Clínicas</h1><div class="info-grid"><div class="field"><div class="field-label">Paciente</div><div class="field-value">${patient.name}</div></div><div class="field"><div class="field-label">Teléfono</div><div class="field-value">${patient.phone || "—"}</div></div></div><h2>Evoluciones (${evolutions.length})</h2>${evolutions.map(e => `<div class="card"><div class="card-meta">${fmtDate(e.date)} · ${e.doctor || "—"}</div><div class="notes">${e.notes || ""}</div></div>`).join("")}<div class="footer">Generado el ${new Date().toLocaleDateString("es-MX")} · Clínica de Cirugía Plástica</div>`)
  const dlComplications = () => downloadPDF(`complicaciones-${patient.name.replace(/\s+/g, "-")}.html`, `<h1>Complicaciones</h1><div class="info-grid"><div class="field"><div class="field-label">Paciente</div><div class="field-value">${patient.name}</div></div></div><h2>Complicaciones (${complications.length})</h2>${complications.map(c => `<div class="card"><div class="card-title">${c.complication}</div><div class="card-meta">${fmtDate(c.date)} · Procedimiento: ${c.procedure || "—"} · Severidad: ${c.severity || "—"}</div>${c.resolution ? `<div class="notes">Resolución: ${c.resolution}</div>` : ""}</div>`).join("")}<div class="footer">Generado el ${new Date().toLocaleDateString("es-MX")} · Clínica de Cirugía Plástica</div>`)

  const sevColor = { Leve: G.success, Moderada: G.warn, Grave: G.danger }

  return <div>
    <div className="serif" style={{ fontSize: 22, marginBottom: 16 }}>Historial Clínico</div>
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${G.border}`, marginBottom: 20, flexWrap: "wrap" }}>
      {[["procedures", "📋 Procedimientos"], ["evolutions", "📝 Evoluciones"], ["complications", "⚠️ Complicaciones"]].map(([id, label]) =>
        <button key={id} onClick={() => setSubTab(id)} style={{ padding: "10px 18px", border: "none", borderBottom: subTab === id ? `2px solid ${G.gold}` : "2px solid transparent", background: "transparent", fontSize: 13, color: subTab === id ? G.gold : G.muted, fontWeight: subTab === id ? 500 : 400, cursor: "pointer" }}>{label}</button>)}
    </div>

    {subTab === "procedures" && <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
        {procedures.length > 0 && <GoldBtn small outline onClick={dlProcedures}>📥 Descargar PDF</GoldBtn>}
        <GoldBtn small onClick={() => setModal({ type: "addHistory", patientId: patient.id, onSave: loadProcedures })}>+ Agregar</GoldBtn>
      </div>
      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : procedures.length === 0 ? <EmptyState icon="📋" msg="Sin procedimientos" /> :
        procedures.map(h => <div key={h.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div className="serif" style={{ fontSize: 18 }}>{h.procedure}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{fmtDate(h.date)} · {h.surgeon} · Anestesia: {h.anesthesia} · Duración: {h.duration}</div>{h.location && <div style={{ fontSize: 12, color: G.info, marginTop: 4 }}>📍 {h.location}</div>}</div>
            <button onClick={() => del("clinical_history", h.id, setProcedures)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
          </div>
          {h.notes && <div style={{ marginTop: 14, padding: "12px 16px", background: G.surfaceAlt, borderRadius: 6, fontSize: 13, lineHeight: 1.7 }}>{h.notes}</div>}
          {h.follow_up && <div style={{ marginTop: 8, fontSize: 12, color: G.info }}>📅 Seguimiento: {fmtDate(h.follow_up)}</div>}
        </div>)}
    </div>}

    {subTab === "evolutions" && <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
        {evolutions.length > 0 && <GoldBtn small outline onClick={dlEvolutions}>📥 Descargar PDF</GoldBtn>}
        <GoldBtn small onClick={() => setModal({ type: "addEvolution", patientId: patient.id, onSave: loadEvolutions })}>+ Agregar</GoldBtn>
      </div>
      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : evolutions.length === 0 ? <EmptyState icon="📝" msg="Sin evoluciones" /> :
        evolutions.map(e => <div key={e.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: 12, color: G.muted }}>{fmtDate(e.date)} {e.doctor ? `· ${e.doctor}` : ""}</div>
            <button onClick={() => del("evolutions", e.id, setEvolutions)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
          </div>
          <div style={{ marginTop: 12, padding: "12px 16px", background: G.surfaceAlt, borderRadius: 6, fontSize: 13, lineHeight: 1.8 }}>{e.notes}</div>
        </div>)}
    </div>}

    {subTab === "complications" && <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
        {complications.length > 0 && <GoldBtn small outline onClick={dlComplications}>📥 Descargar PDF</GoldBtn>}
        <GoldBtn small onClick={() => setModal({ type: "addComplication", patient, onSave: loadComplications })}>+ Agregar</GoldBtn>
      </div>
      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : complications.length === 0 ? <EmptyState icon="✅" msg="Sin complicaciones registradas" /> :
        complications.map(c => <div key={c.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div className="serif" style={{ fontSize: 18 }}>{c.complication}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{fmtDate(c.date)} · {c.procedure || "—"}{c.location ? " · 📍 " + c.location : ""}</div></div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {c.severity && <Tag label={c.severity} color={sevColor[c.severity] || G.muted} />}
              <button onClick={() => del("complications", c.id, setComplications)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
            </div>
          </div>
          {c.resolution && <div style={{ marginTop: 12, padding: "12px 16px", background: G.surfaceAlt, borderRadius: 6, fontSize: 13, lineHeight: 1.7 }}><strong>Resolución:</strong> {c.resolution}</div>}
        </div>)}
    </div>}
  </div>
}

// ─── PHOTOS con comparador ─────────────────────────────────────────────────
function PhotosSection({ patient, setModal }) {
  const [photos, setPhotos] = useState([]); const [filter, setFilter] = useState("all"); const [loading, setLoading] = useState(true)
  const [compareMode, setCompareMode] = useState(false); const [selected, setSelected] = useState([])
  const load = async () => { setLoading(true); const { data } = await supabase.from("photos").select("*").eq("patient_id", patient.id).order("date", { ascending: false }); setPhotos(data || []); setLoading(false) }
  useEffect(() => { load() }, [])
  const deletePhoto = async (id) => { if (!confirm("¿Eliminar esta foto?")) return; await supabase.from("photos").delete().eq("id", id); setPhotos(v => v.filter(p => p.id !== id)) }
  const filtered = filter === "all" ? photos : photos.filter(p => p.type === filter)

  const toggleSelect = (ph) => {
    setSelected(s => {
      if (s.find(x => x.id === ph.id)) return s.filter(x => x.id !== ph.id)
      if (s.length >= 2) return [s[1], ph]
      return [...s, ph]
    })
  }

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div className="serif" style={{ fontSize: 22 }}>Galería Fotográfica</div>
      <div style={{ display: "flex", gap: 10 }}>
        <GoldBtn small outline onClick={() => { setCompareMode(c => !c); setSelected([]) }}>{compareMode ? "✕ Cancelar" : "⇄ Comparar"}</GoldBtn>
        <GoldBtn small onClick={() => setModal({ type: "addPhoto", patientId: patient.id, onSave: load })}>+ Agregar Foto</GoldBtn>
      </div>
    </div>
    {compareMode && <div style={{ background: `${G.gold}12`, border: `1px solid ${G.gold}40`, borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: G.goldDark }}>
      Selecciona 2 fotos para compararlas lado a lado ({selected.length}/2)
      {selected.length === 2 && <button onClick={() => setModal({ type: "compare", photos: selected })} style={{ marginLeft: 16, padding: "6px 14px", background: G.gold, color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Ver comparación →</button>}
    </div>}
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {[["all", "Todas"], ["antes", "Antes"], ["despues", "Después"], ["intraop", "Intraop"], ["seguimiento", "Seguimiento"]].map(([v, l]) =>
        <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 4, border: `1px solid ${filter === v ? G.gold : G.border}`, background: filter === v ? `${G.gold}18` : "transparent", color: filter === v ? G.gold : G.muted, fontSize: 12, cursor: "pointer" }}>{l}</button>)}
    </div>
    {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : filtered.length === 0 ? <EmptyState icon="📷" msg="Sin fotografías" /> :
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {filtered.map(ph => {
          const isSel = selected.find(x => x.id === ph.id)
          return <div key={ph.id} style={{ borderRadius: 8, overflow: "hidden", border: `2px solid ${isSel ? G.gold : G.border}`, position: "relative" }}>
            {compareMode && <div onClick={() => toggleSelect(ph)} style={{ position: "absolute", inset: 0, background: isSel ? `${G.gold}30` : "transparent", zIndex: 2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{isSel && <div style={{ background: G.gold, color: "#fff", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✓</div>}</div>}
            <img src={ph.url} alt={ph.label} style={{ width: "100%", height: 160, objectFit: "cover", display: "block", cursor: "pointer" }} onClick={() => !compareMode && setModal({ type: "viewPhoto", photo: ph })} />
            <div style={{ padding: "10px 12px", background: G.surface }}>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{ph.label || "Foto"}</div>
              <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{fmtDate(ph.date)}</div>
              {!compareMode && <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button onClick={() => downloadPhoto(ph)} style={{ flex: 1, padding: "5px", background: `${G.gold}18`, border: `1px solid ${G.gold}40`, borderRadius: 4, color: G.gold, fontSize: 11, cursor: "pointer" }}>📥 Descargar</button>
                <button onClick={() => deletePhoto(ph.id)} style={{ padding: "5px 8px", background: `${G.danger}18`, border: `1px solid ${G.danger}40`, borderRadius: 4, color: G.danger, fontSize: 11, cursor: "pointer" }}>🗑</button>
              </div>}
            </div>
          </div>
        })}
      </div>}
  </div>
}

function ApptsTab({ patientId }) {
  const [appts, setAppts] = useState([]); const [loading, setLoading] = useState(true)
  const statusColor = { confirmada: G.success, pendiente: G.gold, cancelada: G.danger }
  useEffect(() => { supabase.from("appointments").select("*").eq("patient_id", patientId).order("date", { ascending: false }).then(({ data }) => { setAppts(data || []); setLoading(false) }) }, [])
  return <div>
    <div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Historial de Citas</div>
    {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : appts.length === 0 ? <EmptyState icon="📅" msg="Sin citas" /> :
      appts.map(a => <div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontWeight: 500, fontSize: 14 }}>{a.procedure}</div><div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{fmtDate(a.date)} {a.time}</div></div>
        <Tag label={a.status} color={statusColor[a.status] || G.gold} />
      </div>)}
  </div>
}

// ─── STATISTICS ────────────────────────────────────────────────────────────
function StatsSection() {
  const [procedures, setProcedures] = useState([]); const [complications, setComplications] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([
      supabase.from("clinical_history").select("*"),
      supabase.from("complications").select("*")
    ]).then(([p, c]) => { setProcedures(p.data || []); setComplications(c.data || []); setLoading(false) })
  }, [])

  if (loading) return <div className="fade-in" style={{ flex: 1 }}><PageHeader title="Estadísticas" /><div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div></div>

  // Cirugías por mes (últimos 6 meses)
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i)
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("es-MX", { month: "short" }), count: 0 })
  }
  procedures.forEach(p => { if (p.date) { const k = p.date.slice(0, 7); const m = months.find(x => x.key === k); if (m) m.count++ } })
  const maxMonth = Math.max(...months.map(m => m.count), 1)

  // Procedimientos más frecuentes
  const procCount = {}
  procedures.forEach(p => { const name = (p.procedure || "Otro").trim(); procCount[name] = (procCount[name] || 0) + 1 })
  const topProcs = Object.entries(procCount).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxProc = Math.max(...topProcs.map(p => p[1]), 1)

  // Complicaciones por severidad
  const sevCount = { Leve: 0, Moderada: 0, Grave: 0 }
  complications.forEach(c => { if (sevCount[c.severity] !== undefined) sevCount[c.severity]++ })
  const compRate = procedures.length > 0 ? ((complications.length / procedures.length) * 100).toFixed(1) : 0

  // Por sede/lugar: cirugías y complicaciones
  const locStats = {}
  procedures.forEach(p => { const loc = (p.location || "Sin especificar").trim(); if (!locStats[loc]) locStats[loc] = { surgeries: 0, comps: 0 }; locStats[loc].surgeries++ })
  complications.forEach(co => { const loc = (co.location || "Sin especificar").trim(); if (!locStats[loc]) locStats[loc] = { surgeries: 0, comps: 0 }; locStats[loc].comps++ })
  const locRows = Object.entries(locStats).map(([loc, s]) => ({ loc, surgeries: s.surgeries, comps: s.comps, rate: s.surgeries > 0 ? ((s.comps / s.surgeries) * 100).toFixed(1) : "—" })).sort((a, b) => b.surgeries - a.surgeries)

  const Card = ({ children, title }) => <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "24px" }}><div className="serif" style={{ fontSize: 18, marginBottom: 20 }}>{title}</div>{children}</div>

  return <div className="fade-in" style={{ flex: 1 }}>
    <PageHeader title="Estadísticas" subtitle="Resumen de tu actividad quirúrgica" />
    <div style={{ padding: "24px 36px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        {[["Cirugías totales", procedures.length, G.gold], ["Complicaciones", complications.length, G.warn], ["Tasa complicaciones", `${compRate}%`, G.danger], ["Tipos de cirugía", Object.keys(procCount).length, G.info]].map(([label, val, color]) =>
          <div key={label} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 10, padding: "20px 24px" }}>
            <div className="serif" style={{ fontSize: 36, color }}>{val}</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{label}</div>
          </div>)}
      </div>

      {/* Cirugías por mes */}
      <Card title="Cirugías por mes (últimos 6 meses)">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 200, paddingBottom: 24 }}>
          {months.map(m => <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: G.gold, marginBottom: 6 }}>{m.count}</div>
            <div style={{ width: "60%", height: `${(m.count / maxMonth) * 100}%`, minHeight: m.count > 0 ? 4 : 0, background: `linear-gradient(180deg,${G.goldLight},${G.gold})`, borderRadius: "4px 4px 0 0", transition: "height 0.5s" }} />
            <div style={{ fontSize: 11, color: G.muted, marginTop: 8, textTransform: "capitalize" }}>{m.label}</div>
          </div>)}
        </div>
      </Card>

      {/* Procedimientos frecuentes */}
      <Card title="Procedimientos más frecuentes">
        {topProcs.length === 0 ? <EmptyState icon="📊" msg="Sin datos aún" /> :
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topProcs.map(([name, count]) => <div key={name}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{name}</span><span style={{ color: G.gold, fontWeight: 500 }}>{count}</span></div>
              <div style={{ height: 8, background: G.surfaceAlt, borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${(count / maxProc) * 100}%`, height: "100%", background: `linear-gradient(90deg,${G.goldLight},${G.gold})`, borderRadius: 4 }} /></div>
            </div>)}
          </div>}
      </Card>

      {/* Complicaciones por severidad */}
      <Card title="Complicaciones por severidad">
        {complications.length === 0 ? <EmptyState icon="✅" msg="Sin complicaciones registradas" /> :
          <div style={{ display: "flex", gap: 20 }}>
            {[["Leve", sevCount.Leve, G.success], ["Moderada", sevCount.Moderada, G.warn], ["Grave", sevCount.Grave, G.danger]].map(([label, val, color]) =>
              <div key={label} style={{ flex: 1, textAlign: "center", padding: "20px", background: `${color}10`, borderRadius: 8, border: `1px solid ${color}30` }}>
                <div className="serif" style={{ fontSize: 32, color }}>{val}</div>
                <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{label}</div>
              </div>)}
          </div>}
      </Card>

      {/* Por sede / lugar */}
      <Card title="Cirugías y complicaciones por sede">
        {locRows.length === 0 ? <EmptyState icon="📍" msg="Sin datos de sede aún" /> :
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: G.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <th style={{ padding: "10px 12px", borderBottom: `1px solid ${G.border}` }}>Sede / Lugar</th>
                  <th style={{ padding: "10px 12px", borderBottom: `1px solid ${G.border}`, textAlign: "center" }}>Cirugías</th>
                  <th style={{ padding: "10px 12px", borderBottom: `1px solid ${G.border}`, textAlign: "center" }}>Complicaciones</th>
                  <th style={{ padding: "10px 12px", borderBottom: `1px solid ${G.border}`, textAlign: "center" }}>Tasa</th>
                </tr>
              </thead>
              <tbody>
                {locRows.map(r => {
                  const rateNum = parseFloat(r.rate)
                  const rateColor = isNaN(rateNum) ? G.muted : rateNum >= 10 ? G.danger : rateNum >= 5 ? G.warn : G.success
                  return <tr key={r.loc}>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${G.border}` }}>📍 {r.loc}</td>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${G.border}`, textAlign: "center", fontWeight: 500 }}>{r.surgeries}</td>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${G.border}`, textAlign: "center", color: r.comps > 0 ? G.warn : G.muted }}>{r.comps}</td>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${G.border}`, textAlign: "center" }}><span style={{ color: rateColor, fontWeight: 500 }}>{r.rate}{r.rate !== "—" ? "%" : ""}</span></td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>}
      </Card>
    </div>
  </div>
}

// ─── TEMPLATES (Pre/Post indicaciones) ─────────────────────────────────────
function TemplatesSection({ setModal }) {
  const [subTab, setSubTab] = useState("preop")
  const [templates, setTemplates] = useState([]); const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])

  const load = async () => { setLoading(true); const { data } = await supabase.from("templates").select("*").order("created_at"); setTemplates(data || []); setLoading(false) }
  useEffect(() => { load(); supabase.from("patients").select("id,name").order("name").then(({ data }) => setPatients(data || [])) }, [])

  const del = async (id) => { if (!confirm("¿Eliminar esta plantilla?")) return; await supabase.from("templates").delete().eq("id", id); setTemplates(v => v.filter(t => t.id !== id)) }

  const filtered = templates.filter(t => t.type === subTab)

  const generateForPatient = (template) => setModal({ type: "applyTemplate", template, patients })

  return <div className="fade-in" style={{ flex: 1 }}>
    <PageHeader title="Plantillas de Indicaciones" subtitle="Indicaciones pre y postoperatorias reutilizables" action={<GoldBtn onClick={() => setModal({ type: "addTemplate", defaultType: subTab, onSave: load })}>+ Nueva Plantilla</GoldBtn>} />
    <div style={{ padding: "20px 36px 0" }}>
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${G.border}` }}>
        {[["preop", "📋 Preoperatorias"], ["postop", "🩹 Postoperatorias"]].map(([id, label]) =>
          <button key={id} onClick={() => setSubTab(id)} style={{ padding: "12px 20px", border: "none", borderBottom: subTab === id ? `2px solid ${G.gold}` : "2px solid transparent", background: "transparent", fontSize: 13, color: subTab === id ? G.gold : G.muted, fontWeight: subTab === id ? 500 : 400, cursor: "pointer" }}>{label}</button>)}
      </div>
    </div>
    <div style={{ padding: "24px 36px" }}>
      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : filtered.length === 0 ? <EmptyState icon="📋" msg="Sin plantillas. Crea una con el botón de arriba." /> :
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map(t => <div key={t.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div className="serif" style={{ fontSize: 18 }}>{t.title}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <GoldBtn small outline onClick={() => generateForPatient(t)}>📄 Generar PDF</GoldBtn>
                <button onClick={() => setModal({ type: "editTemplate", template: t, onSave: load })} style={{ background: "transparent", border: "none", color: G.gold, cursor: "pointer", fontSize: 15 }}>✏️</button>
                <button onClick={() => del(t.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: G.charcoal, lineHeight: 1.7, whiteSpace: "pre-wrap", background: G.surfaceAlt, padding: "12px 16px", borderRadius: 6 }}>{t.content}</div>
          </div>)}
        </div>}
    </div>
  </div>
}

// ─── AI NOTES ─────────────────────────────────────────────────────────────
function AINotesSection() {
  const [patients, setPatients] = useState([]); const [patientId, setPatientId] = useState(""); const [procedure, setProcedure] = useState("")
  const [findings, setFindings] = useState(""); const [noteType, setNoteType] = useState("preoperatoria"); const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false); const [error, setError] = useState("")
  useEffect(() => { supabase.from("patients").select("id,name,blood_type,allergies").order("name").then(({ data }) => setPatients(data || [])) }, [])
  const generate = async () => {
    if (!findings.trim()) return
    setLoading(true); setError(""); setResult("")
    const patient = patients.find(p => p.id === patientId)
    const patientInfo = patient ? `Paciente: ${patient.name}${patient.blood_type ? ", Tipo sanguíneo: " + patient.blood_type : ""}${patient.allergies ? ", Alergias: " + patient.allergies : ""}` : ""
    const prompt = `Eres un asistente médico especializado en cirugía plástica. Genera una nota médica estructurada y profesional en español del tipo "${noteType}" para ${procedure || "procedimiento no especificado"}.\n\n${patientInfo}\n\nHallazgos:\n${findings}\n\nGenera la nota con: Motivo de consulta, Hallazgos clínicos, Plan de tratamiento, Indicaciones y Próxima cita.`
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) })
      const data = await resp.json()
      const text = data.content?.map(c => c.text || "").join("") || ""
      if (!text) throw new Error("Sin respuesta"); setResult(text)
    } catch (e) { setError("Error generando la nota.") }
    setLoading(false)
  }
  const dlNote = () => {
    const patient = patients.find(p => p.id === patientId)
    downloadPDF(`nota-${noteType}-${patient?.name?.replace(/\s+/g, "-") || "paciente"}.html`, `<h1>Nota Clínica — ${noteType}</h1><div class="info-grid"><div class="field"><div class="field-label">Paciente</div><div class="field-value">${patient?.name || "—"}</div></div><div class="field"><div class="field-label">Procedimiento</div><div class="field-value">${procedure || "—"}</div></div></div><div class="card"><div class="notes">${result}</div></div><div class="footer">Generado el ${new Date().toLocaleDateString("es-MX")}</div>`)
  }
  return <div className="fade-in" style={{ flex: 1 }}>
    <PageHeader title="Notas Clínicas con IA" subtitle="Genera notas médicas profesionales automáticamente" />
    <div style={{ padding: "24px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, height: "calc(100% - 100px)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="serif" style={{ fontSize: 20 }}>Datos de la Consulta</div>
        <FormField label="Paciente"><select value={patientId} onChange={e => setPatientId(e.target.value)} style={inputSty}><option value="">— Seleccionar —</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
        <FormField label="Procedimiento"><input value={procedure} onChange={e => setProcedure(e.target.value)} style={inputSty} /></FormField>
        <FormField label="Tipo de Nota"><select value={noteType} onChange={e => setNoteType(e.target.value)} style={inputSty}>{["preoperatoria", "postoperatoria", "seguimiento", "interconsulta", "urgencia"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></FormField>
        <FormField label="Hallazgos y Observaciones"><textarea value={findings} onChange={e => setFindings(e.target.value)} rows={6} style={{ ...inputSty, resize: "vertical" }} /></FormField>
        <GoldBtn onClick={generate} disabled={loading}>{loading ? "Generando…" : "✦ Generar Nota Médica"}</GoldBtn>
        {error && <div style={{ color: G.danger, fontSize: 13 }}>{error}</div>}
      </div>
      <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "24px", display: "flex", flexDirection: "column" }}>
        <div className="serif" style={{ fontSize: 20, marginBottom: 16 }}>Nota Generada</div>
        {!result && !loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.muted, fontSize: 13 }}>La nota aparecerá aquí.</div>}
        {loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>}
        {result && <div style={{ flex: 1, overflow: "auto" }}>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "'Jost',sans-serif", fontSize: 13, lineHeight: 1.8 }}>{result}</pre>
          <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
            <GoldBtn small outline onClick={() => navigator.clipboard.writeText(result)}>📋 Copiar</GoldBtn>
            <GoldBtn small outline onClick={dlNote}>📥 Descargar PDF</GoldBtn>
            <GoldBtn small outline onClick={() => setResult("")}>Limpiar</GoldBtn>
          </div>
        </div>}
      </div>
    </div>
  </div>
}

// ─── FORMS ────────────────────────────────────────────────────────────────
function PatientForm({ patient, onSave, onClose }) {
  const [f, setF] = useState(patient ? { name: patient.name || "", dob: patient.dob || "", phone: patient.phone || "", email: patient.email || "", blood_type: patient.blood_type || "", allergies: patient.allergies || "", notes: patient.notes || "" } : { name: "", dob: "", phone: "", email: "", blood_type: "", allergies: "", notes: "" })
  const [saving, setSaving] = useState(false); const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => { if (!f.name.trim()) return; setSaving(true); if (patient) { await supabase.from("patients").update(f).eq("id", patient.id) } else { await supabase.from("patients").insert(f) } onSave(); onClose() }
  return <div>
    <ModalHeader title={patient ? "Editar Paciente" : "Nuevo Paciente"} onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="Nombre completo"><input value={f.name} onChange={e => set("name", e.target.value)} style={inputSty} /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Fecha de nacimiento"><input type="date" value={f.dob} onChange={e => set("dob", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Tipo sanguíneo"><select value={f.blood_type} onChange={e => set("blood_type", e.target.value)} style={inputSty}><option value="">—</option>{["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(t => <option key={t}>{t}</option>)}</select></FormField>
      </div>
      <FormField label="Teléfono"><input value={f.phone} onChange={e => set("phone", e.target.value)} style={inputSty} /></FormField>
      <FormField label="Correo"><input value={f.email} onChange={e => set("email", e.target.value)} style={inputSty} /></FormField>
      <FormField label="Alergias"><input value={f.allergies} onChange={e => set("allergies", e.target.value)} style={inputSty} placeholder="Ninguna conocida" /></FormField>
      <FormField label="Notas"><textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={3} style={{ ...inputSty, resize: "vertical" }} /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function AddApptForm({ appt, onSave, onClose }) {
  const [patients, setPatients] = useState([]); const [f, setF] = useState(appt ? { patient_id: appt.patient_id || "", date: appt.date || today(), time: appt.time || "10:00", procedure: appt.procedure || "", location: appt.location || "", status: appt.status || "pendiente", notes: appt.notes || "" } : { patient_id: "", date: today(), time: "10:00", procedure: "", location: "", status: "pendiente", notes: "" })
  const [saving, setSaving] = useState(false); const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  useEffect(() => { supabase.from("patients").select("id,name").order("name").then(({ data }) => setPatients(data || [])) }, [])
  const save = async () => {
    if (!f.patient_id || !f.procedure.trim()) return; setSaving(true)
    const patient = patients.find(p => p.id === f.patient_id)
    if (appt) { await supabase.from("appointments").update({ ...f, patient_name: patient?.name || "" }).eq("id", appt.id) }
    else { await supabase.from("appointments").insert({ ...f, patient_name: patient?.name || "" }) }
    onSave(); onClose()
  }
  return <div>
    <ModalHeader title={appt ? "Editar Cita" : "Nueva Cita"} onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="Paciente"><select value={f.patient_id} onChange={e => set("patient_id", e.target.value)} style={inputSty}><option value="">— Seleccionar —</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Hora"><input type="time" value={f.time} onChange={e => set("time", e.target.value)} style={inputSty} /></FormField>
      </div>
      <FormField label="Procedimiento"><input value={f.procedure} onChange={e => set("procedure", e.target.value)} style={inputSty} /></FormField>
      <FormField label="Lugar / Sede"><input value={f.location} onChange={e => set("location", e.target.value)} style={inputSty} placeholder="Ej: Sanatorio Central, Quirófano 2…" /></FormField>
      <FormField label="Estado"><select value={f.status} onChange={e => set("status", e.target.value)} style={inputSty}><option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option></select></FormField>
      <FormField label="Notas"><input value={f.notes} onChange={e => set("notes", e.target.value)} style={inputSty} /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function AddHistoryForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ date: today(), procedure: "", surgeon: "", anesthesia: "General", duration: "", location: "", notes: "", follow_up: "" })
  const [saving, setSaving] = useState(false); const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => { if (!f.procedure.trim()) return; setSaving(true); await supabase.from("clinical_history").insert({ ...f, patient_id: patientId }); onSave(); onClose() }
  return <div>
    <ModalHeader title="Agregar Procedimiento" onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="Procedimiento"><input value={f.procedure} onChange={e => set("procedure", e.target.value)} style={inputSty} /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Cirujano"><input value={f.surgeon} onChange={e => set("surgeon", e.target.value)} style={inputSty} /></FormField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Anestesia"><select value={f.anesthesia} onChange={e => set("anesthesia", e.target.value)} style={inputSty}>{["General", "Local", "Sedación", "Epidural"].map(a => <option key={a}>{a}</option>)}</select></FormField>
        <FormField label="Duración"><input value={f.duration} onChange={e => set("duration", e.target.value)} style={inputSty} placeholder="2h 30min" /></FormField>
      </div>
      <FormField label="Lugar / Sede"><input value={f.location} onChange={e => set("location", e.target.value)} style={inputSty} placeholder="Ej: Sanatorio Central, Quirófano 2…" /></FormField>
      <FormField label="Notas clínicas"><textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={4} style={{ ...inputSty, resize: "vertical" }} /></FormField>
      <FormField label="Fecha de seguimiento"><input type="date" value={f.follow_up} onChange={e => set("follow_up", e.target.value)} style={inputSty} /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function AddEvolutionForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ date: today(), doctor: "", notes: "" }); const [saving, setSaving] = useState(false); const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => { if (!f.notes.trim()) return; setSaving(true); await supabase.from("evolutions").insert({ ...f, patient_id: patientId }); onSave(); onClose() }
  return <div>
    <ModalHeader title="Agregar Evolución" onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Médico"><input value={f.doctor} onChange={e => set("doctor", e.target.value)} style={inputSty} /></FormField>
      </div>
      <FormField label="Notas de evolución"><textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={6} style={{ ...inputSty, resize: "vertical" }} /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function AddComplicationForm({ patient, onSave, onClose }) {
  const [f, setF] = useState({ date: today(), procedure: "", complication: "", severity: "Leve", location: "", resolution: "" })
  const [saving, setSaving] = useState(false); const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => { if (!f.complication.trim()) return; setSaving(true); await supabase.from("complications").insert({ ...f, patient_id: patient.id, patient_name: patient.name }); onSave(); onClose() }
  return <div>
    <ModalHeader title="Agregar Complicación" onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="Complicación"><input value={f.complication} onChange={e => set("complication", e.target.value)} style={inputSty} placeholder="Ej: Hematoma, Infección, Seroma…" /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Severidad"><select value={f.severity} onChange={e => set("severity", e.target.value)} style={inputSty}>{["Leve", "Moderada", "Grave"].map(s => <option key={s}>{s}</option>)}</select></FormField>
      </div>
      <FormField label="Procedimiento relacionado"><input value={f.procedure} onChange={e => set("procedure", e.target.value)} style={inputSty} placeholder="Ej: Rinoplastia" /></FormField>
      <FormField label="Lugar / Sede"><input value={f.location} onChange={e => set("location", e.target.value)} style={inputSty} placeholder="Ej: Sanatorio Central, Quirófano 2…" /></FormField>
      <FormField label="Resolución / manejo"><textarea value={f.resolution} onChange={e => set("resolution", e.target.value)} rows={3} style={{ ...inputSty, resize: "vertical" }} /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function AddTemplateForm({ defaultType, template, onSave, onClose }) {
  const [f, setF] = useState(template ? { type: template.type, title: template.title || "", content: template.content || "" } : { type: defaultType || "preop", title: "", content: "" }); const [saving, setSaving] = useState(false); const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => {
    if (!f.title.trim() || !f.content.trim()) return; setSaving(true)
    if (template) { await supabase.from("templates").update(f).eq("id", template.id) }
    else { await supabase.from("templates").insert(f) }
    onSave(); onClose()
  }
  return <div>
    <ModalHeader title={template ? "Editar Plantilla" : "Nueva Plantilla de Indicaciones"} onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FormField label="Tipo"><select value={f.type} onChange={e => set("type", e.target.value)} style={inputSty}><option value="preop">Preoperatoria</option><option value="postop">Postoperatoria</option></select></FormField>
      <FormField label="Título"><input value={f.title} onChange={e => set("title", e.target.value)} style={inputSty} placeholder="Ej: Indicaciones post rinoplastia" /></FormField>
      <FormField label="Contenido de las indicaciones"><textarea value={f.content} onChange={e => set("content", e.target.value)} rows={10} style={{ ...inputSty, resize: "vertical" }} placeholder="Escribe las indicaciones. Puedes usar [PACIENTE] donde quieras que aparezca el nombre del paciente." /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function ApplyTemplateForm({ template, patients, onClose }) {
  const [patientId, setPatientId] = useState("")
  const [appts, setAppts] = useState([])
  const [apptId, setApptId] = useState("")
  const [ctrlDateInput, setCtrlDateInput] = useState("")
  const [ctrlTimeInput, setCtrlTimeInput] = useState("")
  const [ctrlLocInput, setCtrlLocInput] = useState("")
  const isPreop = template.type === "preop"
  const isPostop = template.type === "postop"

  useEffect(() => {
    if (!patientId) { setAppts([]); setApptId(""); return }
    supabase.from("appointments").select("*").eq("patient_id", patientId).order("date", { ascending: false }).then(({ data }) => setAppts(data || []))
  }, [patientId])

  const generate = () => {
    const patient = patients.find(p => p.id === patientId)
    const appt = appts.find(a => a.id === apptId)
    const surgeryDate = appt?.date ? fmtDate(appt.date) : "_______________"
    const surgeryLoc = appt?.location || "_______________"
    const ctrlDateRaw = ctrlDateInput || ""
    const ctrlLocRaw = ctrlLocInput || ""
    const ctrlDate = ctrlDateRaw ? (fmtDate(ctrlDateRaw) + (ctrlTimeInput ? " a las " + ctrlTimeInput + " hs" : "")) : "_______________"
    const ctrlLoc = ctrlLocRaw || "_______________"
    let content = template.content
      .replace(/\[PACIENTE\]/g, patient?.name || "_______________")
      .replace(/\[FECHA\]/g, surgeryDate)
      .replace(/\[LUGAR\]/g, surgeryLoc)
      .replace(/\[FECHA_CONTROL\]/g, ctrlDate)
      .replace(/\[LUGAR_CONTROL\]/g, ctrlLoc)
    const surgeryInfo = isPreop ? `<div class="field"><div class="field-label">Fecha de cirugía</div><div class="field-value">${surgeryDate}</div></div><div class="field"><div class="field-label">Lugar de cirugía</div><div class="field-value">${surgeryLoc}</div></div>` : ""
    const controlInfo = isPostop && (ctrlDateRaw || ctrlLocRaw) ? `<div class="field"><div class="field-label">Fecha de control</div><div class="field-value">${ctrlDate}</div></div><div class="field"><div class="field-label">Lugar de control</div><div class="field-value">${ctrlLoc}</div></div>` : ""
    downloadPDF(`indicaciones-${template.title.replace(/\s+/g, "-")}-${patient?.name?.replace(/\s+/g, "-") || ""}.html`, `<h1>${template.title}</h1><div class="info-grid"><div class="field"><div class="field-label">Paciente</div><div class="field-value">${patient?.name || "—"}</div></div><div class="field"><div class="field-label">Emitido</div><div class="field-value">${new Date().toLocaleDateString("es-MX")}</div></div>${surgeryInfo}${controlInfo}</div><div class="card"><div class="notes">${content}</div></div><div class="footer">Clínica de Cirugía Plástica · ${new Date().toLocaleDateString("es-MX")}</div>`)
    onClose()
  }

  return <div>
    <ModalHeader title="Generar Indicaciones para Paciente" onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: G.muted }}>Plantilla: <strong>{template.title}</strong></div>
      <FormField label="Paciente"><select value={patientId} onChange={e => setPatientId(e.target.value)} style={inputSty}><option value="">— Seleccionar —</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
      {isPreop && patientId && <FormField label="Cita de cirugía (fecha y lugar)">
        <select value={apptId} onChange={e => setApptId(e.target.value)} style={inputSty}>
          <option value="">— Seleccionar cita —</option>
          {appts.map(a => <option key={a.id} value={a.id}>{fmtDate(a.date)} · {a.procedure}{a.location ? " · " + a.location : ""}</option>)}
        </select>
      </FormField>}
      {isPreop && patientId && appts.length === 0 && <div style={{ fontSize: 12, color: G.warn }}>Este paciente no tiene citas. La fecha y lugar saldrán en blanco.</div>}
      {isPostop && <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Fecha de control"><input type="date" value={ctrlDateInput} onChange={e => setCtrlDateInput(e.target.value)} style={inputSty} /></FormField>
        <FormField label="Hora de control"><input type="time" value={ctrlTimeInput} onChange={e => setCtrlTimeInput(e.target.value)} style={inputSty} /></FormField>
        <FormField label="Lugar de control"><input value={ctrlLocInput} onChange={e => setCtrlLocInput(e.target.value)} style={inputSty} placeholder="Ej: Consultorio" /></FormField>
      </div>}
      <div style={{ fontSize: 11, color: G.muted }}>Tip: usa [PACIENTE], [FECHA], [LUGAR]{isPostop ? ", [FECHA_CONTROL], [LUGAR_CONTROL]" : ""} en la plantilla para insertar esos datos automáticamente.</div>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={generate} disabled={!patientId}>📥 Generar PDF</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function AddPhotoForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ label: "", type: "antes", date: today(), notes: "" })
  const [preview, setPreview] = useState(""); const [saving, setSaving] = useState(false); const fileRef = useRef()
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const cameraRef = useRef()
  const handleFile = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = ev => setPreview(ev.target.result); reader.readAsDataURL(file) }
  const save = async () => {
    if (!preview) return; setSaving(true)
    try {
      const fileName = `${patientId}/${Date.now()}-${f.type}.jpg`
      const byteChars = atob(preview.split(",")[1]); const byteNums = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i)
      const blob = new Blob([new Uint8Array(byteNums)], { type: "image/jpeg" })
      const { error: upErr } = await supabase.storage.from("patient-photos").upload(fileName, blob)
      let url = preview
      if (!upErr) { const { data: urlData } = supabase.storage.from("patient-photos").getPublicUrl(fileName); url = urlData?.publicUrl || preview }
      await supabase.from("photos").insert({ ...f, patient_id: patientId, storage_path: fileName, url }); onSave(); onClose()
    } catch (e) { await supabase.from("photos").insert({ ...f, patient_id: patientId, url: preview }); onSave(); onClose() }
  }
  return <div>
    <ModalHeader title="Agregar Fotografía" onClose={onClose} />
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ border: `2px dashed ${preview ? G.gold : G.border}`, borderRadius: 8, padding: 24, textAlign: "center", background: G.surfaceAlt }}>
        {preview ? <img src={preview} alt="" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }} /> : <div style={{ color: G.muted, fontSize: 13 }}>📷<br />Selecciona una opción abajo</div>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => cameraRef.current.click()} style={{ flex: 1, padding: "10px", background: `${G.gold}18`, border: `1px solid ${G.gold}40`, borderRadius: 6, color: G.goldDark, fontSize: 13, cursor: "pointer" }}>📷 Tomar foto</button>
        <button onClick={() => fileRef.current.click()} style={{ flex: 1, padding: "10px", background: `${G.gold}18`, border: `1px solid ${G.gold}40`, borderRadius: 6, color: G.goldDark, fontSize: 13, cursor: "pointer" }}>🖼 Galería / Archivos</button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      <FormField label="Descripción"><input value={f.label} onChange={e => set("label", e.target.value)} style={inputSty} placeholder="Ej: Frente - Preoperatorio" /></FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Tipo"><select value={f.type} onChange={e => set("type", e.target.value)} style={inputSty}>{[["antes", "Antes"], ["despues", "Después"], ["intraop", "Intraop"], ["seguimiento", "Seguimiento"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></FormField>
        <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
      </div>
      <FormField label="Notas"><input value={f.notes} onChange={e => set("notes", e.target.value)} style={inputSty} /></FormField>
      <div style={{ display: "flex", gap: 10 }}><GoldBtn onClick={save} disabled={saving || !preview}>{saving ? "Subiendo…" : "Guardar Foto"}</GoldBtn><GoldBtn outline onClick={onClose}>Cancelar</GoldBtn></div>
    </div>
  </div>
}

function PhotoViewer({ photo, onClose }) {
  return <div>
    <ModalHeader title={photo.label || "Fotografía"} onClose={onClose} />
    <img src={photo.url} alt={photo.label} style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: G.surfaceAlt }} />
    <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <Tag label={photo.type} color={photo.type === "antes" ? G.info : photo.type === "despues" ? G.success : G.gold} />
      <span style={{ fontSize: 13, color: G.muted }}>{fmtDate(photo.date)}</span>
    </div>
    {photo.notes && <div style={{ marginTop: 12, fontSize: 13, color: G.muted }}>{photo.notes}</div>}
    <div style={{ marginTop: 16 }}><GoldBtn small onClick={() => downloadPhoto(photo)}>📥 Descargar Foto</GoldBtn></div>
  </div>
}

function CompareViewer({ photos, onClose }) {
  const [a, b] = photos
  return <div>
    <ModalHeader title="Comparación Antes / Después" onClose={onClose} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {[a, b].map((ph, i) => <div key={i}>
        <img src={ph.url} alt={ph.label} style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 8, background: G.surfaceAlt }} />
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <Tag label={ph.type} color={ph.type === "antes" ? G.info : ph.type === "despues" ? G.success : G.gold} />
          <div style={{ fontSize: 12, color: G.muted, marginTop: 6 }}>{ph.label || "Foto"} · {fmtDate(ph.date)}</div>
        </div>
      </div>)}
    </div>
  </div>
}

export default function App() {
  injectStyles()
  const [session, setSession] = useState(null); const [loading, setLoading] = useState(true)
  const [section, setSection] = useState("agenda"); const [selectedPatient, setSelectedPatient] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true); const [modal, setModal] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])
  const logout = () => supabase.auth.signOut()
  const changeSection = (s) => { setSection(s); setSelectedPatient(null) }
  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.charcoal }}><Spinner size={48} /></div>
  if (!session) return <LoginScreen />
  return <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
    <Sidebar section={section} setSection={changeSection} open={sidebarOpen} toggle={() => setSidebarOpen(v => !v)} onLogout={logout} />
    <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
      {section === "agenda" && <AgendaSection setModal={setModal} />}
      {section === "patients" && <PatientsSection setModal={setModal} onOpen={(p) => { setSelectedPatient(p); setSection("patientDetail") }} />}
      {section === "patientDetail" && selectedPatient && <PatientDetail patient={selectedPatient} setModal={setModal} onBack={() => setSection("patients")} />}
      {section === "stats" && <StatsSection />}
      {section === "templates" && <TemplatesSection setModal={setModal} />}
      {section === "aiNotes" && <AINotesSection />}
    </main>
    {modal && <ModalOverlay onClose={() => setModal(null)} wide={modal.type === "compare"}>
      {(modal.type === "addPatient" || modal.type === "editPatient") && <PatientForm patient={modal.patient} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {(modal.type === "addAppt" || modal.type === "editAppt") && <AddApptForm appt={modal.appt} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {modal.type === "addHistory" && <AddHistoryForm patientId={modal.patientId} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {modal.type === "addEvolution" && <AddEvolutionForm patientId={modal.patientId} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {modal.type === "addComplication" && <AddComplicationForm patient={modal.patient} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {(modal.type === "addTemplate" || modal.type === "editTemplate") && <AddTemplateForm defaultType={modal.defaultType} template={modal.template} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {modal.type === "applyTemplate" && <ApplyTemplateForm template={modal.template} patients={modal.patients} onClose={() => setModal(null)} />}
      {modal.type === "addPhoto" && <AddPhotoForm patientId={modal.patientId} onSave={modal.onSave} onClose={() => setModal(null)} />}
      {modal.type === "viewPhoto" && <PhotoViewer photo={modal.photo} onClose={() => setModal(null)} />}
      {modal.type === "compare" && <CompareViewer photos={modal.photos} onClose={() => setModal(null)} />}
    </ModalOverlay>}
  </div>
}
