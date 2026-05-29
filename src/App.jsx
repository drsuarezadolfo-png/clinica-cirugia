import { useState, useEffect, useRef } from "react"
import { supabase } from "./supabase.js"

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

const printPDF = (title, htmlContent) => {
  const w = window.open("", "_blank")
  w.document.write(`
    <html><head><meta charset="UTF-8"><title>${title}</title>
    <style>
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#2C2826;line-height:1.7}
      h1{font-size:26px;color:#B8975A;border-bottom:2px solid #B8975A;padding-bottom:10px;margin-bottom:20px}
      h2{font-size:16px;color:#2C2826;margin:0 0 6px}
      .card{background:#F9F6F1;border:1px solid #E5DDD0;border-radius:8px;padding:18px 22px;margin:14px 0;page-break-inside:avoid}
      .meta{color:#8A7F74;font-size:12px;margin-bottom:8px}
      .notes{background:#fff;border-left:3px solid #B8975A;padding:12px 16px;margin-top:10px;font-size:13px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
      .field{background:#F3EFE8;padding:10px 14px;border-radius:6px}
      .field-label{font-size:10px;color:#8A7F74;text-transform:uppercase;letter-spacing:0.08em}
      .field-value{font-size:13px;margin-top:3px}
      .footer{margin-top:40px;color:#8A7F74;font-size:11px;border-top:1px solid #E5DDD0;padding-top:14px}
      @media print{body{margin:20px}}
    </style></head><body>
    ${htmlContent}
    <div class="footer">Generado el ${new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" })} · Clínica de Cirugía Plástica</div>
    <script>window.onload=()=>{window.print()}<\/script>
    </body></html>
  `)
  w.document.close()
}

function GoldBtn({ children, onClick, small, outline, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? "7px 16px" : "10px 22px", background: danger ? G.danger : outline ? "transparent" : `linear-gradient(135deg,${G.gold},${G.goldDark})`, color: outline ? G.gold : "#FFF", border: outline ? `1.5px solid ${G.gold}` : "none", borderRadius: 4, fontSize: small ? 12 : 13, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  )
}

function Spinner({ size = 36 }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid ${G.border}`, borderTopColor: G.gold, animation: "spin 0.8s linear infinite" }} />
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function Tag({ label, color }) {
  return <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 3, background: `${color}18`, color, border: `1px solid ${color}40` }}>{label}</span>
}

function EmptyState({ icon, msg }) {
  return <div style={{ textAlign: "center", padding: "60px 20px", color: G.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div><div style={{ fontSize: 14 }}>{msg}</div></div>
}

function ModalOverlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: G.surface, borderRadius: 10, padding: "32px", maxWidth: 520, width: "90%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <div className="serif" style={{ fontSize: 24, color: G.charcoal }}>{title}</div>
      <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, color: G.muted, cursor: "pointer" }}>✕</button>
    </div>
  )
}

function LoginScreen() {
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.charcoal }}>
      <div style={{ background: G.surface, borderRadius: 12, padding: "48px", width: "90%", maxWidth: 380, boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✦</div>
          <div className="serif" style={{ fontSize: 28, color: G.charcoal }}>Bienvenido</div>
          <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>Clínica de Cirugía Plástica</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Correo electrónico"><input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputSty} placeholder="correo@clinica.com" onKeyDown={e => e.key === "Enter" && login()} /></FormField>
          <FormField label="Contraseña"><input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputSty} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && login()} /></FormField>
          {error && <div style={{ color: G.danger, fontSize: 13, textAlign: "center" }}>{error}</div>}
          <GoldBtn onClick={login} disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</GoldBtn>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: G.muted, textAlign: "center" }}>Los usuarios son creados por el administrador en Supabase.</div>
      </div>
    </div>
  )
}

function Sidebar({ section, setSection, open, toggle, onLogout }) {
  const items = [["agenda", "📅", "Agenda"], ["patients", "👤", "Pacientes"], ["aiNotes", "✦", "Notas con IA"]]
  return (
    <aside style={{ width: open ? 220 : 64, transition: "width 0.3s ease", background: G.charcoal, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
        {open && <div><div className="serif" style={{ color: G.goldLight, fontSize: 17, fontWeight: 500, whiteSpace: "nowrap" }}>Clínica</div><div style={{ color: G.muted, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Cirugía Plástica</div></div>}
      </div>
      <nav style={{ flex: 1, padding: "16px 0" }}>
        {items.map(([id, icon, label]) => {
          const active = section === id || (section === "patientDetail" && id === "patients")
          return (
            <button key={id} onClick={() => setSection(id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: open ? "12px 20px" : "12px 0", justifyContent: open ? "flex-start" : "center", background: active ? "rgba(184,151,90,0.15)" : "transparent", border: "none", borderLeft: active ? `3px solid ${G.gold}` : "3px solid transparent", color: active ? G.goldLight : G.muted, fontSize: 13, fontWeight: active ? 500 : 400, cursor: "pointer" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {open && <span style={{ whiteSpace: "nowrap" }}>{label}</span>}
            </button>
          )
        })}
      </nav>
      <button onClick={onLogout} style={{ background: "transparent", border: "none", color: G.muted, padding: "12px", fontSize: 12, borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>{open ? "⎋ Cerrar sesión" : "⎋"}</button>
      <button onClick={toggle} style={{ background: "transparent", border: "none", color: G.muted, padding: "12px", fontSize: 16, textAlign: open ? "right" : "center" }}>{open ? "◀" : "▶"}</button>
    </aside>
  )
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ padding: "32px 36px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderBottom: `1px solid ${G.border}` }}>
      <div>
        <div className="serif" style={{ fontSize: 32, fontWeight: 300 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: G.muted, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {tabs.map(([id, label]) => (
        <button key={id} onClick={() => onChange(id)} style={{ padding: "8px 18px", borderRadius: 20, border: `1px solid ${active === id ? G.gold : G.border}`, background: active === id ? `${G.gold}18` : "transparent", color: active === id ? G.gold : G.muted, fontSize: 13, fontWeight: active === id ? 500 : 400, cursor: "pointer" }}>{label}</button>
      ))}
    </div>
  )
}

function AgendaSection({ setModal }) {
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from("appointments").select("*").order("date").order("time")
    setAppts(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    await supabase.from("appointments").update({ status }).eq("id", id)
    setAppts(v => v.map(a => a.id === id ? { ...a, status } : a))
  }

  const deleteAppt = async (id) => {
    if (!confirm("¿Eliminar esta cita?")) return
    await supabase.from("appointments").delete().eq("id", id)
    setAppts(v => v.filter(a => a.id !== id))
  }

  const statusColor = { confirmada: G.success, pendiente: G.gold, cancelada: G.danger }

  return (
    <div className="fade-in" style={{ flex: 1 }}>
      <PageHeader title="Agenda" subtitle={`${appts.length} citas`} action={<GoldBtn onClick={() => setModal({ type: "addAppt", onSave: load })}>+ Nueva Cita</GoldBtn>} />
      <div style={{ padding: "24px 36px" }}>
        {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> : appts.length === 0 ? <EmptyState icon="📅" msg="Sin citas registradas" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {appts.map(a => (
              <div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "18px 22px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ minWidth: 70, textAlign: "center" }}>
                  <div className="serif" style={{ fontSize: 26, color: G.gold }}>{a.date?.split("-")[2]}</div>
                  <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase" }}>{a.date ? new Date(a.date + "T12:00:00").toLocaleDateString("es-MX", { month: "short" }) : ""}</div>
                </div>
                <div style={{ width: 1, height: 40, background: G.border }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{a.patient_name}</div>
                  <div style={{ fontSize: 13, color: G.muted, marginTop: 2 }}>{a.procedure}</div>
                  {a.notes && <div style={{ fontSize: 12, color: G.accent, marginTop: 2 }}>📝 {a.notes}</div>}
                </div>
                <div style={{ fontSize: 13, color: G.muted }}>{a.time}</div>
                <select value={a.status} onChange={e => updateStatus(a.id, e.target.value)} style={{ padding: "5px 10px", border: `1px solid ${statusColor[a.status] || G.border}`, borderRadius: 4, fontSize: 12, color: statusColor[a.status], background: G.surfaceAlt, outline: "none" }}>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <button onClick={() => deleteAppt(a.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PatientsSection({ setModal, onOpen }) {
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

  const deletePatient = async (e, id) => {
    e.stopPropagation()
    if (!confirm("¿Eliminar este paciente y todos sus datos?")) return
    await supabase.from("patients").delete().eq("id", id)
    setPatients(v => v.filter(p => p.id !== id))
  }

  const filtered = patients.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || (p.phone || "").includes(q))

  return (
    <div className="fade-in" style={{ flex: 1 }}>
      <PageHeader title="Pacientes" subtitle={`${patients.length} pacientes`} action={<GoldBtn onClick={() => setModal({ type: "addPatient", onSave: load })}>+ Nuevo Paciente</GoldBtn>} />
      <div style={{ padding: "20px 36px 10px" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o teléfono…" style={{ ...inputSty, maxWidth: 400 }} />
      </div>
      <div style={{ padding: "10px 36px 24px" }}>
        {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> : filtered.length === 0 ? <EmptyState icon="👤" msg="Sin pacientes" /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => onOpen(p)} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = G.gold; e.currentTarget.style.boxShadow = `0 4px 20px rgba(184,151,90,0.12)` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.boxShadow = "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 18, flexShrink: 0 }}>{p.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{p.phone}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); setModal({ type: "editPatient", patient: p, onSave: load }) }} style={{ background: "transparent", border: "none", color: G.gold, cursor: "pointer", fontSize: 15 }}>✏️</button>
                    <button onClick={e => deletePatient(e, p.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 15 }}>🗑</button>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {p.blood_type && <Tag label={p.blood_type} color={G.info} />}
                  {p.allergies && p.allergies !== "Ninguna conocida" && <Tag label="⚠ Alergias" color={G.danger} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const downloadPhoto = (photo) => {
  const link = document.createElement("a")
  link.href = photo.url
  link.download = `${photo.label || "foto"}-${photo.date || "sin-fecha"}.jpg`
  link.target = "_blank"
  link.click()
}

function PatientDetail({ patient, setModal, onBack }) {
  const [tab, setTab] = useState("info")
  const [history, setHistory] = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [photos, setPhotos] = useState([])
  const [appts, setAppts] = useState([])
  const [historySubTab, setHistorySubTab] = useState("procedimientos")
  const [loadingH, setLoadingH] = useState(false)
  const [loadingP, setLoadingP] = useState(false)
  const [loadingA, setLoadingA] = useState(false)

  useEffect(() => {
    if (tab === "history") { loadHistory(); loadEvolutions() }
    if (tab === "photos") loadPhotos()
    if (tab === "appts") loadAppts()
  }, [tab])

  const loadHistory = async () => {
    setLoadingH(true)
    const { data } = await supabase.from("clinical_history").select("*").eq("patient_id", patient.id).order("date", { ascending: false })
    setHistory(data || []); setLoadingH(false)
  }
  const loadEvolutions = async () => {
    const { data } = await supabase.from("evolutions").select("*").eq("patient_id", patient.id).order("date", { ascending: false })
    setEvolutions(data || [])
  }
  const loadPhotos = async () => {
    setLoadingP(true)
    const { data } = await supabase.from("photos").select("*").eq("patient_id", patient.id).order("date", { ascending: false })
    setPhotos(data || []); setLoadingP(false)
  }
  const loadAppts = async () => {
    setLoadingA(true)
    const { data } = await supabase.from("appointments").select("*").eq("patient_id", patient.id).order("date", { ascending: false })
    setAppts(data || []); setLoadingA(false)
  }

  const deleteHistory = async (id) => {
    if (!confirm("¿Eliminar este procedimiento?")) return
    await supabase.from("clinical_history").delete().eq("id", id)
    setHistory(v => v.filter(h => h.id !== id))
  }
  const deleteEvolution = async (id) => {
    if (!confirm("¿Eliminar esta evolución?")) return
    await supabase.from("evolutions").delete().eq("id", id)
    setEvolutions(v => v.filter(e => e.id !== id))
  }

  const downloadHistoryPDF = () => {
    printPDF(`Historial - ${patient.name}`, `
      <h1>Historial Clínico — ${patient.name}</h1>
      <div class="grid">
        <div class="field"><div class="field-label">Fecha de nacimiento</div><div class="field-value">${patient.dob || "—"}</div></div>
        <div class="field"><div class="field-label">Tipo sanguíneo</div><div class="field-value">${patient.blood_type || "—"}</div></div>
        <div class="field"><div class="field-label">Teléfono</div><div class="field-value">${patient.phone || "—"}</div></div>
        <div class="field"><div class="field-label">Alergias</div><div class="field-value">${patient.allergies || "—"}</div></div>
      </div>
      <h2 style="margin-top:24px;font-size:18px;color:#B8975A">Procedimientos (${history.length})</h2>
      ${history.map(h => `
        <div class="card">
          <h2>${h.procedure}</h2>
          <div class="meta">${h.date || "—"} · ${h.surgeon || "—"} · Anestesia: ${h.anesthesia || "—"} · Duración: ${h.duration || "—"}</div>
          ${h.notes ? `<div class="notes">${h.notes}</div>` : ""}
          ${h.follow_up ? `<div class="meta" style="margin-top:8px">📅 Seguimiento: ${h.follow_up}</div>` : ""}
        </div>`).join("")}
    `)
  }

  const downloadEvolutionsPDF = () => {
    printPDF(`Evoluciones - ${patient.name}`, `
      <h1>Evoluciones — ${patient.name}</h1>
      <p class="meta" style="margin-bottom:20px">${patient.phone || ""} · ${patient.email || ""}</p>
      ${evolutions.map(e => `
        <div class="card">
          <div class="meta">${e.date || "—"} · Dr/a: ${e.doctor || "—"}</div>
          <div class="notes">${e.notes || ""}</div>
        </div>`).join("")}
    `)
  }

  return (
    <div className="fade-in" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 36px", borderBottom: `1px solid ${G.border}`, display: "flex", alignItems: "center", gap: 18 }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${G.border}`, borderRadius: 4, padding: "7px 14px", fontSize: 12, color: G.muted, cursor: "pointer" }}>← Pacientes</button>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${G.gold},${G.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 22 }}>{patient.name[0]}</div>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 24 }}>{patient.name}</div>
          <div style={{ fontSize: 13, color: G.muted }}>{patient.email} · {patient.phone}</div>
        </div>
        <GoldBtn small outline onClick={() => setModal({ type: "editPatient", patient, onSave: () => {} })}>✏️ Editar</GoldBtn>
      </div>
      <div style={{ display: "flex", borderBottom: `1px solid ${G.border}`, padding: "0 36px" }}>
        {[["info", "Información"], ["history", "Historial"], ["photos", "Fotografías"], ["appts", "Citas"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: "14px 20px", border: "none", borderBottom: tab === id ? `2px solid ${G.gold}` : "2px solid transparent", background: "transparent", fontSize: 13, color: tab === id ? G.gold : G.muted, fontWeight: tab === id ? 500 : 400, cursor: "pointer" }}>{label}</button>
        ))}
      </div>
      <div style={{ padding: "24px 36px", flex: 1, overflow: "auto" }}>
        {tab === "info" && <PatientInfo patient={patient} />}
        {tab === "history" && (
          loadingH ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> :
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="serif" style={{ fontSize: 22 }}>Historial Clínico</div>
            </div>
            <SubTabs tabs={[["procedimientos", "Procedimientos"], ["evoluciones", "Evoluciones"]]} active={historySubTab} onChange={setHistorySubTab} />
            {historySubTab === "procedimientos" && (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
                  {history.length > 0 && <GoldBtn small outline onClick={downloadHistoryPDF}>📥 PDF</GoldBtn>}
                  <GoldBtn small onClick={() => setModal({ type: "addHistory", patientId: patient.id, onSave: loadHistory })}>+ Agregar</GoldBtn>
                </div>
                {history.length === 0 ? <EmptyState icon="🔬" msg="Sin procedimientos registrados" /> : history.map(h => (
                  <div key={h.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="serif" style={{ fontSize: 18 }}>{h.procedure}</div>
                        <div style={{ fontSize: 12, color: G.muted, marginTop: 4 }}>{fmtDate(h.date)} · {h.surgeon} · Anestesia: {h.anesthesia} · Duración: {h.duration}</div>
                      </div>
                      <button onClick={() => deleteHistory(h.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
                    </div>
                    {h.notes && <div style={{ marginTop: 14, padding: "12px 16px", background: G.surfaceAlt, borderRadius: 6, fontSize: 13, lineHeight: 1.7 }}>{h.notes}</div>}
                    {h.follow_up && <div style={{ marginTop: 8, fontSize: 12, color: G.info }}>📅 Seguimiento: {fmtDate(h.follow_up)}</div>}
                  </div>
                ))}
              </div>
            )}
            {historySubTab === "evoluciones" && (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
                  {evolutions.length > 0 && <GoldBtn small outline onClick={downloadEvolutionsPDF}>📥 PDF</GoldBtn>}
                  <GoldBtn small onClick={() => setModal({ type: "addEvolution", patientId: patient.id, onSave: loadEvolutions })}>+ Agregar</GoldBtn>
                </div>
                {evolutions.length === 0 ? <EmptyState icon="📝" msg="Sin evoluciones registradas" /> : evolutions.map(e => (
                  <div key={e.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "20px 24px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 12, color: G.muted }}>{fmtDate(e.date)} · Dr/a: {e.doctor || "—"}</div>
                      <button onClick={() => deleteEvolution(e.id)} style={{ background: "transparent", border: "none", color: G.danger, cursor: "pointer", fontSize: 16 }}>🗑</button>
                    </div>
                    <div style={{ marginTop: 12, padding: "12px 16px", background: G.surfaceAlt, borderRadius: 6, fontSize: 13, lineHeight: 1.8 }}>{e.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "photos" && (loadingP ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> : <PhotosTab patient={patient} photos={photos} setModal={setModal} onSave={loadPhotos} setPhotos={setPhotos} />)}
        {tab === "appts" && (loadingA ? <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div> : <ApptsTab appts={appts} />)}
      </div>
    </div>
  )
}

function PatientInfo({ patient }) {
  const fields = [["Nombre", patient.name], ["Fecha de nacimiento", fmtDate(patient.dob)], ["Teléfono", patient.phone], ["Correo", patient.email], ["Tipo sanguíneo", patient.blood_type], ["Alergias", patient.allergies || "—"], ["Notas", patient.notes || "—"]]
  return (
    <div style={{ maxWidth: 600 }}>
      <div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Datos del Paciente</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {fields.map(([k, v]) => (
          <div key={k} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 6, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: G.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 14 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhotosTab({ patient, photos, setModal, onSave, setPhotos }) {
  const [filter, setFilter] = useState("all")
  const filtered = filter === "all" ? photos : photos.filter(p => p.type === filter)

  const deletePhoto = async (id) => {
    if (!confirm("¿Eliminar esta foto?")) return
    await supabase.from("photos").delete().eq("id", id)
    setPhotos(v => v.filter(p => p.id !== id))
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="serif" style={{ fontSize: 22 }}>Galería Fotográfica</div>
        <GoldBtn small onClick={() => setModal({ type: "addPhoto", patientId: patient.id, onSave })}>+ Agregar Foto</GoldBtn>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all", "Todas"], ["antes", "Antes"], ["despues", "Después"], ["intraop", "Intraop"], ["seguimiento", "Seguimiento"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 4, border: `1px solid ${filter === v ? G.gold : G.border}`, background: filter === v ? `${G.gold}18` : "transparent", color: filter === v ? G.gold : G.muted, fontSize: 12, cursor: "pointer" }}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState icon="📷" msg="Sin fotografías" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {filtered.map(ph => (
            <div key={ph.id} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${G.border}` }}>
              <img src={ph.url} alt={ph.label} style={{ width: "100%", height: 160, objectFit: "cover", display: "block", cursor: "pointer" }}
                onClick={() => setModal({ type: "viewPhoto", photo: ph })} />
              <div style={{ padding: "10px 12px", background: G.surface }}>
                <div style={{ fontSize: 11, fontWeight: 500 }}>{ph.label || "Foto"}</div>
                <div style={{ fontSize: 11, color: G.muted, marginTop: 2 }}>{fmtDate(ph.date)}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={() => downloadPhoto(ph)} style={{ flex: 1, padding: "5px", background: `${G.gold}18`, border: `1px solid ${G.gold}40`, borderRadius: 4, color: G.gold, fontSize: 11, cursor: "pointer" }}>📥 Descargar</button>
                  <button onClick={() => deletePhoto(ph.id)} style={{ padding: "5px 8px", background: `${G.danger}18`, border: `1px solid ${G.danger}40`, borderRadius: 4, color: G.danger, fontSize: 11, cursor: "pointer" }}>🗑</button>
                </div>
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
      <div className="serif" style={{ fontSize: 22, marginBottom: 20 }}>Historial de Citas</div>
      {appts.length === 0 ? <EmptyState icon="📅" msg="Sin citas" /> : appts.map(a => (
        <div key={a.id} style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "16px 20px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{a.procedure}</div>
            <div style={{ fontSize: 12, color: G.muted, marginTop: 2 }}>{fmtDate(a.date)} {a.time}</div>
          </div>
          <Tag label={a.status} color={statusColor[a.status] || G.gold} />
        </div>
      ))}
    </div>
  )
}

function AINotesSection() {
  const [patients, setPatients] = useState([])
  const [patientId, setPatientId] = useState("")
  const [procedure, setProcedure] = useState("")
  const [findings, setFindings] = useState("")
  const [noteType, setNoteType] = useState("preoperatoria")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.from("patients").select("id,name,blood_type,allergies").order("name").then(({ data }) => setPatients(data || []))
  }, [])

  const generate = async () => {
    if (!findings.trim()) return
    setLoading(true); setError(""); setResult("")
    const patient = patients.find(p => p.id === patientId)
    const patientInfo = patient ? `Paciente: ${patient.name}${patient.blood_type ? ", Tipo sanguíneo: " + patient.blood_type : ""}${patient.allergies ? ", Alergias: " + patient.allergies : ""}` : ""
    const prompt = `Eres un asistente médico especializado en cirugía plástica. Genera una nota médica estructurada y profesional en español del tipo "${noteType}" para ${procedure || "procedimiento no especificado"}.\n\n${patientInfo}\n\nHallazgos / información del médico:\n${findings}\n\nGenera la nota con: Motivo de consulta, Hallazgos clínicos, Plan de tratamiento, Indicaciones y Próxima cita. Usa lenguaje médico profesional.`

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      })
      const data = await resp.json()
      const text = data.content?.map(c => c.text || "").join("") || ""
      if (!text) throw new Error("Sin respuesta")
      setResult(text)
    } catch (e) { setError("Error generando la nota. Verifica la conexión.") }
    setLoading(false)
  }

  const downloadNote = () => {
    const patient = patients.find(p => p.id === patientId)
    printPDF(`Nota ${noteType} - ${patient?.name || "Paciente"}`, `
      <h1>Nota Clínica — ${noteType.charAt(0).toUpperCase() + noteType.slice(1)}</h1>
      <div class="grid">
        <div class="field"><div class="field-label">Paciente</div><div class="field-value">${patient?.name || "—"}</div></div>
        <div class="field"><div class="field-label">Procedimiento</div><div class="field-value">${procedure || "—"}</div></div>
      </div>
      <div class="notes" style="margin-top:20px;white-space:pre-wrap">${result}</div>
    `)
  }

  return (
    <div className="fade-in" style={{ flex: 1 }}>
      <PageHeader title="Notas Clínicas con IA" subtitle="Genera notas médicas profesionales automáticamente" />
      <div style={{ padding: "24px 36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, height: "calc(100% - 100px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="serif" style={{ fontSize: 20 }}>Datos de la Consulta</div>
          <FormField label="Paciente"><select value={patientId} onChange={e => setPatientId(e.target.value)} style={inputSty}><option value="">— Seleccionar —</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
          <FormField label="Procedimiento"><input value={procedure} onChange={e => setProcedure(e.target.value)} placeholder="Ej: Rinoplastia…" style={inputSty} /></FormField>
          <FormField label="Tipo de Nota"><select value={noteType} onChange={e => setNoteType(e.target.value)} style={inputSty}>{["preoperatoria", "postoperatoria", "seguimiento", "interconsulta", "urgencia"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></FormField>
          <FormField label="Hallazgos y Observaciones"><textarea value={findings} onChange={e => setFindings(e.target.value)} rows={6} placeholder="Describe los hallazgos clínicos…" style={{ ...inputSty, resize: "vertical" }} /></FormField>
          <GoldBtn onClick={generate} disabled={loading}>{loading ? "Generando…" : "✦ Generar Nota Médica"}</GoldBtn>
          {error && <div style={{ color: G.danger, fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ background: G.surface, border: `1px solid ${G.border}`, borderRadius: 8, padding: "24px", display: "flex", flexDirection: "column" }}>
          <div className="serif" style={{ fontSize: 20, marginBottom: 16 }}>Nota Generada</div>
          {!result && !loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: G.muted, fontSize: 13, textAlign: "center" }}>La nota aparecerá aquí.<br /><span style={{ fontSize: 24, opacity: 0.3, display: "block", marginTop: 12 }}>✦</span></div>}
          {loading && <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>}
          {result && (
            <div style={{ flex: 1, overflow: "auto" }}>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "'Jost',sans-serif", fontSize: 13, lineHeight: 1.8 }}>{result}</pre>
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <GoldBtn small outline onClick={() => navigator.clipboard.writeText(result)}>📋 Copiar</GoldBtn>
                <GoldBtn small outline onClick={downloadNote}>📥 PDF</GoldBtn>
                <GoldBtn small outline onClick={() => setResult("")}>Limpiar</GoldBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PatientForm({ patient, onSave, onClose }) {
  const [f, setF] = useState(patient ? { name: patient.name || "", dob: patient.dob || "", phone: patient.phone || "", email: patient.email || "", blood_type: patient.blood_type || "", allergies: patient.allergies || "", notes: patient.notes || "" } : { name: "", dob: "", phone: "", email: "", blood_type: "", allergies: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.name.trim()) return
    setSaving(true)
    if (patient) { await supabase.from("patients").update(f).eq("id", patient.id) }
    else { await supabase.from("patients").insert(f) }
    onSave(); onClose()
  }

  return (
    <div>
      <ModalHeader title={patient ? "Editar Paciente" : "Nuevo Paciente"} onClose={onClose} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Nombre completo"><input value={f.name} onChange={e => set("name", e.target.value)} style={inputSty} /></FormField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormField label="Fecha de nacimiento"><input type="date" value={f.dob} onChange={e => set("dob", e.target.value)} style={inputSty} /></FormField>
          <FormField label="Tipo sanguíneo"><select value={f.blood_type} onChange={e => set("blood_type", e.target.value)} style={inputSty}><option value="">—</option>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(t => <option key={t}>{t}</option>)}</select></FormField>
        </div>
        <FormField label="Teléfono"><input value={f.phone} onChange={e => set("phone", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Correo"><input value={f.email} onChange={e => set("email", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Alergias"><input value={f.allergies} onChange={e => set("allergies", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Notas"><textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={3} style={{ ...inputSty, resize: "vertical" }} /></FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  )
}

function AddApptForm({ onSave, onClose }) {
  const [patients, setPatients] = useState([])
  const [f, setF] = useState({ patient_id: "", date: today(), time: "10:00", procedure: "", status: "pendiente", notes: "" })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => { supabase.from("patients").select("id,name").order("name").then(({ data }) => setPatients(data || [])) }, [])

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
        <FormField label="Paciente"><select value={f.patient_id} onChange={e => set("patient_id", e.target.value)} style={inputSty}><option value="">— Seleccionar —</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FormField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
          <FormField label="Hora"><input type="time" value={f.time} onChange={e => set("time", e.target.value)} style={inputSty} /></FormField>
        </div>
        <FormField label="Procedimiento"><input value={f.procedure} onChange={e => set("procedure", e.target.value)} style={inputSty} /></FormField>
        <FormField label="Estado"><select value={f.status} onChange={e => set("status", e.target.value)} style={inputSty}><option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option></select></FormField>
        <FormField label="Notas"><input value={f.notes} onChange={e => set("notes", e.target.value)} style={inputSty} /></FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  )
}

function AddHistoryForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ date: today(), procedure: "", surgeon: "", anesthesia: "General", duration: "", notes: "", follow_up: "" })
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
        <FormField label="Procedimiento"><input value={f.procedure} onChange={e => set("procedure", e.target.value)} style={inputSty} placeholder="Ej: Rinoplastia…" /></FormField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
          <FormField label="Cirujano"><input value={f.surgeon} onChange={e => set("surgeon", e.target.value)} style={inputSty} placeholder="Dr. Nombre" /></FormField>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormField label="Anestesia"><select value={f.anesthesia} onChange={e => set("anesthesia", e.target.value)} style={inputSty}>{["General","Local","Sedación","Epidural"].map(a => <option key={a}>{a}</option>)}</select></FormField>
          <FormField label="Duración"><input value={f.duration} onChange={e => set("duration", e.target.value)} style={inputSty} placeholder="2h 30min" /></FormField>
        </div>
        <FormField label="Notas clínicas"><textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={4} style={{ ...inputSty, resize: "vertical" }} /></FormField>
        <FormField label="Fecha de seguimiento"><input type="date" value={f.follow_up} onChange={e => set("follow_up", e.target.value)} style={inputSty} /></FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  )
}

function AddEvolutionForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ date: today(), doctor: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!f.notes.trim()) return
    setSaving(true)
    await supabase.from("evolutions").insert({ ...f, patient_id: patientId })
    onSave(); onClose()
  }

  return (
    <div>
      <ModalHeader title="Agregar Evolución" onClose={onClose} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
          <FormField label="Médico"><input value={f.doctor} onChange={e => set("doctor", e.target.value)} style={inputSty} placeholder="Dr. Nombre" /></FormField>
        </div>
        <FormField label="Evolución / Notas">
          <textarea value={f.notes} onChange={e => set("notes", e.target.value)} rows={6} style={{ ...inputSty, resize: "vertical" }} placeholder="Descripción de la evolución del paciente, observaciones, cambios, indicaciones…" />
        </FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <GoldBtn onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  )
}

function AddPhotoForm({ patientId, onSave, onClose }) {
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
      const fileName = `${patientId}/${Date.now()}-${f.type}.jpg`
      const base64Data = preview.split(",")[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "image/jpeg" })
      const { error: uploadError } = await supabase.storage.from("patient-photos").upload(fileName, blob)
      let url = preview
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("patient-photos").getPublicUrl(fileName)
        url = urlData?.publicUrl || preview
      }
      await supabase.from("photos").insert({ ...f, patient_id: patientId, storage_path: fileName, url })
      onSave(); onClose()
    } catch (e) {
      await supabase.from("photos").insert({ ...f, patient_id: patientId, url: preview })
      onSave(); onClose()
    }
  }

  return (
    <div>
      <ModalHeader title="Agregar Fotografía" onClose={onClose} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${preview ? G.gold : G.border}`, borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", background: G.surfaceAlt }}>
          {preview ? <img src={preview} alt="" style={{ maxHeight: 180, maxWidth: "100%", borderRadius: 6, objectFit: "contain" }} /> : <div style={{ color: G.muted, fontSize: 13 }}>📷<br />Toca para seleccionar imagen</div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} capture="environment" />
        <FormField label="Descripción"><input value={f.label} onChange={e => set("label", e.target.value)} style={inputSty} placeholder="Ej: Frente - Preoperatorio" /></FormField>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FormField label="Tipo"><select value={f.type} onChange={e => set("type", e.target.value)} style={inputSty}>{[["antes","Antes"],["despues","Después"],["intraop","Intraop"],["seguimiento","Seguimiento"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></FormField>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e => set("date", e.target.value)} style={inputSty} /></FormField>
        </div>
        <FormField label="Notas"><input value={f.notes} onChange={e => set("notes", e.target.value)} style={inputSty} /></FormField>
        <div style={{ display: "flex", gap: 10 }}>
          <GoldBtn onClick={save} disabled={saving || !preview}>{saving ? "Subiendo…" : "Guardar Foto"}</GoldBtn>
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
      <img src={photo.url} alt={photo.label} style={{ width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 8, background: G.surfaceAlt }} />
      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Tag label={photo.type} color={photo.type === "antes" ? G.info : photo.type === "despues" ? G.success : G.gold} />
        <span style={{ fontSize: 13, color: G.muted }}>{fmtDate(photo.date)}</span>
      </div>
      {photo.notes && <div style={{ marginTop: 12, fontSize: 13, color: G.muted }}>{photo.notes}</div>}
      <div style={{ marginTop: 16 }}>
        <GoldBtn small onClick={() => downloadPhoto(photo)}>📥 Descargar Foto</GoldBtn>
      </div>
    </div>
  )
}

export default function App() {
  injectStyles()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState("agenda")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [modal, setModal] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const logout = () => supabase.auth.signOut()
  const changeSection = (s) => { setSection(s); setSelectedPatient(null) }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: G.charcoal }}><Spinner size={48} /></div>
  if (!session) return <LoginScreen />

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar section={section} setSection={changeSection} open={sidebarOpen} toggle={() => setSidebarOpen(v => !v)} onLogout={logout} />
      <main style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {section === "agenda" && <AgendaSection setModal={setModal} />}
        {section === "patients" && <PatientsSection setModal={setModal} onOpen={(p) => { setSelectedPatient(p); setSection("patientDetail") }} />}
        {section === "patientDetail" && selectedPatient && <PatientDetail patient={selectedPatient} setModal={setModal} onBack={() => setSection("patients")} />}
        {section === "aiNotes" && <AINotesSection />}
      </main>
      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          {(modal.type === "addPatient" || modal.type === "editPatient") && <PatientForm patient={modal.patient} onSave={modal.onSave} onClose={() => setModal(null)} />}
          {modal.type === "addAppt" && <AddApptForm onSave={modal.onSave} onClose={() => setModal(null)} />}
          {modal.type === "addHistory" && <AddHistoryForm patientId={modal.patientId} onSave={modal.onSave} onClose={() => setModal(null)} />}
          {modal.type === "addEvolution" && <AddEvolutionForm patientId={modal.patientId} onSave={modal.onSave} onClose={() => setModal(null)} />}
          {modal.type === "addPhoto" && <AddPhotoForm patientId={modal.patientId} onSave={modal.onSave} onClose={() => setModal(null)} />}
          {modal.type === "viewPhoto" && <PhotoViewer photo={modal.photo} onClose={() => setModal(null)} />}
        </ModalOverlay>
      )}
    </div>
  )
}
