import { useState, useRef, useCallback } from "react";

// ─── PALETTE & STYLES ──────────────────────────────────────────────────────
const G = {
  bg: "#F9F6F1",
  surface: "#FFFFFF",
  surfaceAlt: "#F3EFE8",
  border: "#E5DDD0",
  gold: "#B8975A",
  goldLight: "#D4B57A",
  goldDark: "#8A6E3A",
  charcoal: "#2C2826",
  muted: "#8A7F74",
  accent: "#C4A882",
  danger: "#C0392B",
  success: "#27AE60",
  info: "#2980B9",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
`;

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${G.bg}; font-family: 'Jost', sans-serif; color: ${G.charcoal}; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: ${G.surfaceAlt}; } ::-webkit-scrollbar-thumb { background: ${G.accent}; border-radius: 3px; }
  input, textarea, select { font-family: 'Jost', sans-serif; }
  button { cursor: pointer; font-family: 'Jost', sans-serif; }
  .serif { font-family: 'Cormorant Garamond', serif; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideIn { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
  .fade-in { animation: fadeIn 0.35s ease forwards; }
  .slide-in { animation: slideIn 0.3s ease forwards; }
`;

// ─── HELPERS ───────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-MX", { day:"2-digit", month:"short", year:"numeric" }) : "—";
const fmtTime = (t) => t || "—";

// ─── SEED DATA ─────────────────────────────────────────────────────────────
const SEED_PATIENTS = [
  { id:"p1", name:"Valentina Ríos Mendoza", dob:"1988-04-12", phone:"55 1234 5678", email:"v.rios@email.com", bloodType:"A+", allergies:"Penicilina", notes:"Paciente con antecedentes de cicatrización queloide", createdAt:"2024-01-15" },
  { id:"p2", name:"Sofía Herrera Luna", dob:"1992-09-03", phone:"55 9876 5432", email:"sofia.h@email.com", bloodType:"O+", allergies:"Ninguna conocida", notes:"", createdAt:"2024-02-20" },
];
const SEED_APPTS = [
  { id:"a1", patientId:"p1", patientName:"Valentina Ríos Mendoza", date:"2026-05-28", time:"10:00", procedure:"Consulta preoperatoria - Rinoplastia", status:"confirmada", notes:"Traer estudios previos" },
  { id:"a2", patientId:"p2", patientName:"Sofía Herrera Luna", date:"2026-05-30", time:"12:00", procedure:"Revisión postoperatoria - Liposucción", status:"pendiente", notes:"" },
];
const SEED_HISTORY = [
  { id:"h1", patientId:"p1", date:"2024-03-10", procedure:"Rinoplastia primaria", surgeon:"Dr. Reyes", anesthesia:"General", duration:"2h 30min", notes:"Procedimiento sin complicaciones. Reducción de giba nasal y refinamiento de punta.", followUp:"2024-03-17" },
];
const SEED_PHOTOS = [];

// ─── APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [section, setSection] = useState("agenda");
  const [patients, setPatients] = useState(SEED_PATIENTS);
  const [appointments, setAppointments] = useState(SEED_APPTS);
  const [history, setHistory] = useState(SEED_HISTORY);
  const [photos, setPhotos] = useState(SEED_PHOTOS);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientTab, setPatientTab] = useState("info");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals
  const [modal, setModal] = useState(null); // 'addPatient' | 'addAppt' | 'addHistory' | 'addPhoto' | 'viewPhoto'

  const openPatient = (p) => { setSelectedPatient(p); setSection("patientDetail"); setPatientTab("info"); };

  return (
    <>
      <style>{fonts}{css}</style>
      <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:G.bg }}>
        <Sidebar section={section} setSection={(s) => { setSection(s); setSelectedPatient(null); }} open={sidebarOpen} toggle={() => setSidebarOpen(v=>!v)} />
        <main style={{ flex:1, overflow:"auto", display:"flex", flexDirection:"column" }}>
          {section === "agenda" && <AgendaSection appointments={appointments} setAppointments={setAppointments} patients={patients} modal={modal} setModal={setModal} />}
          {section === "patients" && <PatientsSection patients={patients} onOpen={openPatient} modal={modal} setModal={setModal} setPatients={setPatients} />}
          {section === "patientDetail" && selectedPatient && (
            <PatientDetail
              patient={selectedPatient}
              tab={patientTab} setTab={setPatientTab}
              history={history} setHistory={setHistory}
              photos={photos} setPhotos={setPhotos}
              appointments={appointments}
              modal={modal} setModal={setModal}
              onBack={() => setSection("patients")}
            />
          )}
          {section === "aiNotes" && <AINotesSection patients={patients} />}
        </main>
      </div>
      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          {modal.type === "addPatient" && <AddPatientForm onSave={(p) => { setPatients(v=>[...v,p]); setModal(null); }} onClose={() => setModal(null)} />}
          {modal.type === "addAppt" && <AddApptForm patients={patients} onSave={(a) => { setAppointments(v=>[...v,a]); setModal(null); }} onClose={() => setModal(null)} />}
          {modal.type === "addHistory" && <AddHistoryForm patientId={modal.patientId} onSave={(h) => { setHistory(v=>[...v,h]); setModal(null); }} onClose={() => setModal(null)} />}
          {modal.type === "addPhoto" && <AddPhotoForm patientId={modal.patientId} onSave={(ph) => { setPhotos(v=>[...v,ph]); setModal(null); }} onClose={() => setModal(null)} />}
          {modal.type === "viewPhoto" && <PhotoViewer photo={modal.photo} onClose={() => setModal(null)} />}
        </ModalOverlay>
      )}
    </>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────
function Sidebar({ section, setSection, open, toggle }) {
  const items = [
    { id:"agenda", icon:"📅", label:"Agenda" },
    { id:"patients", icon:"👤", label:"Pacientes" },
    { id:"aiNotes", icon:"✦", label:"Notas con IA" },
  ];
  return (
    <aside style={{ width: open ? 220 : 64, transition:"width 0.3s ease", background:G.charcoal, display:"flex", flexDirection:"column", flexShrink:0 }}>
      {/* Logo */}
      <div style={{ padding:"28px 20px 24px", borderBottom:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:`linear-gradient(135deg,${G.gold},${G.goldLight})`, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>✦</div>
        {open && <div style={{ overflow:"hidden" }}><div className="serif" style={{ color:G.goldLight, fontSize:17, fontWeight:500, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>Clínica</div><div style={{ color:G.muted, fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", whiteSpace:"nowrap" }}>Cirugía Plástica</div></div>}
      </div>
      {/* Nav */}
      <nav style={{ flex:1, padding:"16px 0" }}>
        {items.map(it => {
          const active = section === it.id || (section === "patientDetail" && it.id === "patients");
          return (
            <button key={it.id} onClick={() => setSection(it.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding: open ? "12px 20px" : "12px 0", justifyContent: open ? "flex-start" : "center", background: active ? "rgba(184,151,90,0.15)" : "transparent", border:"none", borderLeft: active ? `3px solid ${G.gold}` : "3px solid transparent", color: active ? G.goldLight : G.muted, fontSize:13, fontWeight: active ? 500 : 400, letterSpacing:"0.04em", transition:"all 0.2s", cursor:"pointer" }}>
              <span style={{ fontSize:16, flexShrink:0 }}>{it.icon}</span>
              {open && <span style={{ whiteSpace:"nowrap", overflow:"hidden" }}>{it.label}</span>}
            </button>
          );
        })}
      </nav>
      {/* Toggle */}
      <button onClick={toggle} style={{ background:"transparent", border:"none", color:G.muted, padding:"16px", fontSize:18, textAlign: open ? "right" : "center", borderTop:`1px solid rgba(255,255,255,0.06)` }}>{open ? "◀" : "▶"}</button>
    </aside>
  );
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ padding:"32px 36px 20px", display:"flex", alignItems:"flex-end", justifyContent:"space-between", borderBottom:`1px solid ${G.border}` }}>
      <div>
        <div className="serif" style={{ fontSize:32, fontWeight:300, color:G.charcoal, letterSpacing:"0.01em" }}>{title}</div>
        {subtitle && <div style={{ fontSize:13, color:G.muted, marginTop:4 }}>{subtitle}</div>}
      </div>
      {action && action}
    </div>
  );
}

function GoldBtn({ children, onClick, small, outline, danger }) {
  return (
    <button onClick={onClick} style={{ padding: small ? "7px 16px" : "10px 22px", background: danger ? G.danger : outline ? "transparent" : `linear-gradient(135deg,${G.gold},${G.goldDark})`, color: outline ? G.gold : "#FFF", border: outline ? `1.5px solid ${G.gold}` : "none", borderRadius:4, fontSize: small ? 12 : 13, fontWeight:500, letterSpacing:"0.06em", textTransform:"uppercase", transition:"all 0.2s", cursor:"pointer" }}>
      {children}
    </button>
  );
}

// ─── AGENDA ───────────────────────────────────────────────────────────────
function AgendaSection({ appointments, setAppointments, patients, modal, setModal }) {
  const statusColor = { confirmada:G.success, pendiente:G.gold, cancelada:G.danger };
  const sorted = [...appointments].sort((a,b)=> a.date+a.time > b.date+b.time ? 1 : -1);

  const updateStatus = (id, status) => setAppointments(v => v.map(a => a.id===id ? {...a,status} : a));

  return (
    <div className="fade-in" style={{ flex:1 }}>
      <PageHeader title="Agenda" subtitle={`${appointments.length} citas registradas`}
        action={<GoldBtn onClick={() => setModal({type:"addAppt"})}>+ Nueva Cita</GoldBtn>} />
      <div style={{ padding:"24px 36px" }}>
        {sorted.length === 0 && <EmptyState icon="📅" msg="Sin citas registradas" />}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {sorted.map(a => (
            <div key={a.id} className="slide-in" style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"18px 22px", display:"flex", alignItems:"center", gap:20 }}>
              <div style={{ minWidth:70, textAlign:"center" }}>
                <div className="serif" style={{ fontSize:26, fontWeight:300, color:G.gold }}>{a.date.split("-")[2]}</div>
                <div style={{ fontSize:11, color:G.muted, textTransform:"uppercase", letterSpacing:"0.08em" }}>{new Date(a.date+"T12:00:00").toLocaleDateString("es-MX",{month:"short"})}</div>
              </div>
              <div style={{ width:1, height:40, background:G.border }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:500, color:G.charcoal }}>{a.patientName}</div>
                <div style={{ fontSize:13, color:G.muted, marginTop:2 }}>{a.procedure}</div>
                {a.notes && <div style={{ fontSize:12, color:G.accent, marginTop:2 }}>📝 {a.notes}</div>}
              </div>
              <div style={{ fontSize:13, color:G.muted }}>{fmtTime(a.time)}</div>
              <select value={a.status} onChange={e=>updateStatus(a.id,e.target.value)} style={{ padding:"5px 10px", border:`1px solid ${statusColor[a.status]||G.border}`, borderRadius:4, fontSize:12, color:statusColor[a.status]||G.muted, background:G.surfaceAlt, outline:"none" }}>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PATIENTS LIST ─────────────────────────────────────────────────────────
function PatientsSection({ patients, onOpen, modal, setModal, setPatients }) {
  const [q, setQ] = useState("");
  const filtered = patients.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.phone.includes(q));
  return (
    <div className="fade-in" style={{ flex:1 }}>
      <PageHeader title="Pacientes" subtitle={`${patients.length} pacientes`}
        action={<GoldBtn onClick={()=>setModal({type:"addPatient"})}>+ Nuevo Paciente</GoldBtn>} />
      <div style={{ padding:"20px 36px 10px" }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nombre o teléfono…" style={{ width:"100%", maxWidth:400, padding:"10px 16px", border:`1px solid ${G.border}`, borderRadius:6, fontSize:13, outline:"none", background:G.surface }} />
      </div>
      <div style={{ padding:"10px 36px 24px" }}>
        {filtered.length === 0 && <EmptyState icon="👤" msg="Sin pacientes" />}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={()=>onOpen(p)} className="slide-in" style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"20px", cursor:"pointer", transition:"all 0.2s", position:"relative", overflow:"hidden" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=G.gold;e.currentTarget.style.boxShadow=`0 4px 20px rgba(184,151,90,0.12)`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=G.border;e.currentTarget.style.boxShadow="none";}}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${G.gold},${G.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontSize:18, flexShrink:0 }}>{p.name[0]}</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:500, color:G.charcoal }}>{p.name}</div>
                  <div style={{ fontSize:12, color:G.muted, marginTop:2 }}>{p.phone}</div>
                </div>
              </div>
              <div style={{ marginTop:14, display:"flex", gap:8, flexWrap:"wrap" }}>
                {p.bloodType && <Tag label={p.bloodType} color={G.info} />}
                {p.allergies && p.allergies !== "Ninguna conocida" && <Tag label="⚠ Alergias" color={G.danger} />}
              </div>
              <div style={{ marginTop:8, fontSize:11, color:G.muted }}>Desde {fmtDate(p.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tag({ label, color }) {
  return <span style={{ fontSize:11, padding:"3px 8px", borderRadius:3, background:`${color}18`, color, border:`1px solid ${color}40` }}>{label}</span>;
}

// ─── PATIENT DETAIL ────────────────────────────────────────────────────────
function PatientDetail({ patient, tab, setTab, history, setHistory, photos, setPhotos, appointments, modal, setModal, onBack }) {
  const pHistory = history.filter(h=>h.patientId===patient.id);
  const pPhotos = photos.filter(ph=>ph.patientId===patient.id);
  const pAppts = appointments.filter(a=>a.patientId===patient.id);

  return (
    <div className="fade-in" style={{ flex:1, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ padding:"20px 36px", borderBottom:`1px solid ${G.border}`, display:"flex", alignItems:"center", gap:18 }}>
        <button onClick={onBack} style={{ background:"transparent", border:`1px solid ${G.border}`, borderRadius:4, padding:"7px 14px", fontSize:12, color:G.muted, cursor:"pointer" }}>← Pacientes</button>
        <div style={{ width:50, height:50, borderRadius:"50%", background:`linear-gradient(135deg,${G.gold},${G.goldLight})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#FFF", fontSize:22 }}>{patient.name[0]}</div>
        <div>
          <div className="serif" style={{ fontSize:24, fontWeight:400 }}>{patient.name}</div>
          <div style={{ fontSize:13, color:G.muted }}>{patient.email} · {patient.phone}</div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${G.border}`, padding:"0 36px" }}>
        {[["info","Información"],["history","Historial Clínico"],["photos","Fotografías"],["appts","Citas"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:"14px 20px", border:"none", borderBottom: tab===id ? `2px solid ${G.gold}` : "2px solid transparent", background:"transparent", fontSize:13, color: tab===id ? G.gold : G.muted, fontWeight: tab===id ? 500 : 400, cursor:"pointer", transition:"all 0.2s" }}>{label}</button>
        ))}
      </div>
      {/* Tab Content */}
      <div style={{ padding:"24px 36px", flex:1, overflow:"auto" }}>
        {tab==="info" && <PatientInfo patient={patient} />}
        {tab==="history" && <PatientHistory patient={patient} history={pHistory} setModal={setModal} />}
        {tab==="photos" && <PatientPhotos patient={patient} photos={pPhotos} setModal={setModal} />}
        {tab==="appts" && <PatientAppts appts={pAppts} />}
      </div>
    </div>
  );
}

function PatientInfo({ patient }) {
  const fields = [["Fecha de nacimiento",fmtDate(patient.dob)],["Teléfono",patient.phone],["Correo",patient.email],["Tipo sanguíneo",patient.bloodType],["Alergias",patient.allergies],["Notas",patient.notes||"—"]];
  return (
    <div style={{ maxWidth:600 }}>
      <div className="serif" style={{ fontSize:22, marginBottom:20, color:G.charcoal }}>Datos del Paciente</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {fields.map(([k,v])=>(
          <div key={k} style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:6, padding:"14px 18px" }}>
            <div style={{ fontSize:11, color:G.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{k}</div>
            <div style={{ fontSize:14, color:G.charcoal }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientHistory({ patient, history, setModal }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div className="serif" style={{ fontSize:22, color:G.charcoal }}>Historial de Procedimientos</div>
        <GoldBtn small onClick={()=>setModal({type:"addHistory",patientId:patient.id})}>+ Agregar</GoldBtn>
      </div>
      {history.length===0 && <EmptyState icon="📋" msg="Sin procedimientos registrados" />}
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {history.map(h=>(
          <div key={h.id} style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"20px 24px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div className="serif" style={{ fontSize:18, fontWeight:400, color:G.charcoal }}>{h.procedure}</div>
                <div style={{ fontSize:12, color:G.muted, marginTop:4 }}>{fmtDate(h.date)} · {h.surgeon} · Anestesia: {h.anesthesia} · Duración: {h.duration}</div>
              </div>
              <Tag label={fmtDate(h.date)} color={G.gold} />
            </div>
            {h.notes && <div style={{ marginTop:14, padding:"12px 16px", background:G.surfaceAlt, borderRadius:6, fontSize:13, color:G.charcoal, lineHeight:1.7 }}>{h.notes}</div>}
            {h.followUp && <div style={{ marginTop:8, fontSize:12, color:G.info }}>📅 Seguimiento: {fmtDate(h.followUp)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientPhotos({ patient, photos, setModal }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter==="all" ? photos : photos.filter(p=>p.type===filter);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div className="serif" style={{ fontSize:22, color:G.charcoal }}>Galería Fotográfica</div>
        <GoldBtn small onClick={()=>setModal({type:"addPhoto",patientId:patient.id})}>+ Agregar Foto</GoldBtn>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[["all","Todas"],["antes","Antes"],["despues","Después"],["intraop","Intraoperatorio"],["seguimiento","Seguimiento"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:"6px 14px", borderRadius:4, border:`1px solid ${filter===v?G.gold:G.border}`, background:filter===v?`${G.gold}18`:"transparent", color:filter===v?G.gold:G.muted, fontSize:12, cursor:"pointer" }}>{l}</button>
        ))}
      </div>
      {filtered.length===0 && <EmptyState icon="📷" msg="Sin fotografías" />}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
        {filtered.map(ph=>(
          <div key={ph.id} onClick={()=>setModal({type:"viewPhoto",photo:ph})} style={{ borderRadius:8, overflow:"hidden", border:`1px solid ${G.border}`, cursor:"pointer", position:"relative" }}
            onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px rgba(0,0,0,0.15)`}
            onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <img src={ph.url} alt={ph.label} style={{ width:"100%", height:160, objectFit:"cover", display:"block" }} />
            <div style={{ padding:"10px 12px", background:G.surface }}>
              <div style={{ fontSize:11, fontWeight:500, color:G.charcoal }}>{ph.label||"Foto"}</div>
              <div style={{ fontSize:11, color:G.muted, marginTop:2 }}>{fmtDate(ph.date)}</div>
              <Tag label={ph.type} color={ph.type==="antes"?G.info:ph.type==="despues"?G.success:G.gold} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientAppts({ appts }) {
  return (
    <div>
      <div className="serif" style={{ fontSize:22, marginBottom:20, color:G.charcoal }}>Historial de Citas</div>
      {appts.length===0 && <EmptyState icon="📅" msg="Sin citas" />}
      {appts.map(a=>(
        <div key={a.id} style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"16px 20px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:500, fontSize:14 }}>{a.procedure}</div>
            <div style={{ fontSize:12, color:G.muted, marginTop:2 }}>{fmtDate(a.date)} {fmtTime(a.time)}</div>
          </div>
          <Tag label={a.status} color={a.status==="confirmada"?G.success:a.status==="cancelada"?G.danger:G.gold} />
        </div>
      ))}
    </div>
  );
}

// ─── AI NOTES ─────────────────────────────────────────────────────────────
function AINotesSection({ patients }) {
  const [patientId, setPatientId] = useState("");
  const [procedure, setProcedure] = useState("");
  const [findings, setFindings] = useState("");
  const [noteType, setNoteType] = useState("preoperatoria");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!findings.trim()) return;
    setLoading(true); setError(""); setResult("");
    const patient = patients.find(p=>p.id===patientId);
    const patientInfo = patient ? `Paciente: ${patient.name}, ${patient.bloodType ? "Tipo sanguíneo: "+patient.bloodType+"," : ""} ${patient.allergies ? "Alergias: "+patient.allergies : ""}` : "";
    const prompt = `Eres un asistente médico especializado en cirugía plástica. Genera una nota médica estructurada y profesional en español del tipo "${noteType}" para ${procedure||"procedimiento no especificado"}.

${patientInfo}

Hallazgos / información del médico:
${findings}

Genera la nota con: Motivo de consulta, Hallazgos clínicos, Plan de tratamiento, Indicaciones y Próxima cita. Usa lenguaje médico profesional. No incluyas diagnósticos inventados, solo estructura lo que se proporcionó.`;

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] })
      });
      const data = await resp.json();
      const text = data.content?.map(c=>c.text||"").join("") || "";
      if (!text) throw new Error("Sin respuesta");
      setResult(text);
    } catch(e) {
      setError("Error generando la nota. Verifica la conexión.");
    }
    setLoading(false);
  };

  return (
    <div className="fade-in" style={{ flex:1 }}>
      <PageHeader title="Notas Clínicas con IA" subtitle="Genera notas médicas profesionales automáticamente" />
      <div style={{ padding:"24px 36px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, height:"calc(100% - 100px)" }}>
        {/* Input */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div className="serif" style={{ fontSize:20, color:G.charcoal }}>Datos de la Consulta</div>
          <FormField label="Paciente (opcional)">
            <select value={patientId} onChange={e=>setPatientId(e.target.value)} style={inputSty}>
              <option value="">— Seleccionar paciente —</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Procedimiento / Consulta">
            <input value={procedure} onChange={e=>setProcedure(e.target.value)} placeholder="Ej: Rinoplastia, Abdominoplastia, Consulta inicial…" style={inputSty} />
          </FormField>
          <FormField label="Tipo de Nota">
            <select value={noteType} onChange={e=>setNoteType(e.target.value)} style={inputSty}>
              {["preoperatoria","postoperatoria","seguimiento","interconsulta","urgencia"].map(t=><option key={t} value={t} style={{textTransform:"capitalize"}}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </FormField>
          <FormField label="Hallazgos y Observaciones del Médico">
            <textarea value={findings} onChange={e=>setFindings(e.target.value)} rows={6} placeholder="Describe los hallazgos clínicos, estado del paciente, medidas, recomendaciones…" style={{ ...inputSty, resize:"vertical" }} />
          </FormField>
          <GoldBtn onClick={generate}>{loading ? "Generando…" : "✦ Generar Nota Médica"}</GoldBtn>
          {error && <div style={{ color:G.danger, fontSize:13 }}>{error}</div>}
        </div>
        {/* Output */}
        <div style={{ background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:"24px", display:"flex", flexDirection:"column" }}>
          <div className="serif" style={{ fontSize:20, color:G.charcoal, marginBottom:16 }}>Nota Generada</div>
          {!result && !loading && <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:G.muted, fontSize:13, textAlign:"center" }}>La nota aparecerá aquí una vez generada.<br/><span style={{ fontSize:24, display:"block", marginTop:12, opacity:0.4 }}>✦</span></div>}
          {loading && <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><Spinner /></div>}
          {result && (
            <div style={{ flex:1, overflow:"auto" }}>
              <pre style={{ whiteSpace:"pre-wrap", fontFamily:"'Jost',sans-serif", fontSize:13, lineHeight:1.8, color:G.charcoal }}>{result}</pre>
              <div style={{ marginTop:20, display:"flex", gap:10 }}>
                <GoldBtn small outline onClick={()=>navigator.clipboard.writeText(result)}>📋 Copiar</GoldBtn>
                <GoldBtn small outline onClick={()=>setResult("")}>Limpiar</GoldBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FORMS / MODALS ────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(3px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:G.surface, borderRadius:10, padding:"32px", maxWidth:520, width:"90%", maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
      <div className="serif" style={{ fontSize:24, fontWeight:400, color:G.charcoal }}>{title}</div>
      <button onClick={onClose} style={{ background:"transparent", border:"none", fontSize:20, color:G.muted, cursor:"pointer" }}>✕</button>
    </div>
  );
}

const inputSty = { width:"100%", padding:"10px 14px", border:`1px solid ${G.border}`, borderRadius:6, fontSize:13, outline:"none", background:G.bg, color:G.charcoal, fontFamily:"'Jost',sans-serif" };

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ fontSize:11, color:G.muted, textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}

function AddPatientForm({ onSave, onClose }) {
  const [f, setF] = useState({ name:"", dob:"", phone:"", email:"", bloodType:"", allergies:"", notes:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div>
      <ModalHeader title="Nuevo Paciente" onClose={onClose} />
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <FormField label="Nombre completo"><input value={f.name} onChange={e=>set("name",e.target.value)} style={inputSty} placeholder="Nombre completo" /></FormField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormField label="Fecha de nacimiento"><input type="date" value={f.dob} onChange={e=>set("dob",e.target.value)} style={inputSty} /></FormField>
          <FormField label="Tipo sanguíneo">
            <select value={f.bloodType} onChange={e=>set("bloodType",e.target.value)} style={inputSty}>
              <option value="">—</option>
              {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(t=><option key={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Teléfono"><input value={f.phone} onChange={e=>set("phone",e.target.value)} style={inputSty} placeholder="55 0000 0000" /></FormField>
        <FormField label="Correo electrónico"><input value={f.email} onChange={e=>set("email",e.target.value)} style={inputSty} placeholder="correo@email.com" /></FormField>
        <FormField label="Alergias"><input value={f.allergies} onChange={e=>set("allergies",e.target.value)} style={inputSty} placeholder="Ninguna conocida" /></FormField>
        <FormField label="Notas"><textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={3} style={{ ...inputSty, resize:"vertical" }} placeholder="Observaciones adicionales…" /></FormField>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <GoldBtn onClick={()=>{ if(!f.name.trim()) return; onSave({...f, id:uid(), createdAt:today()}); }}>Guardar Paciente</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  );
}

function AddApptForm({ patients, onSave, onClose }) {
  const [f, setF] = useState({ patientId:"", date:today(), time:"10:00", procedure:"", status:"pendiente", notes:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div>
      <ModalHeader title="Nueva Cita" onClose={onClose} />
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <FormField label="Paciente">
          <select value={f.patientId} onChange={e=>set("patientId",e.target.value)} style={inputSty}>
            <option value="">— Seleccionar —</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={inputSty} /></FormField>
          <FormField label="Hora"><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} style={inputSty} /></FormField>
        </div>
        <FormField label="Procedimiento / Motivo"><input value={f.procedure} onChange={e=>set("procedure",e.target.value)} style={inputSty} placeholder="Ej: Consulta inicial, Revisión postoperatoria…" /></FormField>
        <FormField label="Estado">
          <select value={f.status} onChange={e=>set("status",e.target.value)} style={inputSty}>
            <option value="pendiente">Pendiente</option><option value="confirmada">Confirmada</option><option value="cancelada">Cancelada</option>
          </select>
        </FormField>
        <FormField label="Notas"><input value={f.notes} onChange={e=>set("notes",e.target.value)} style={inputSty} placeholder="Instrucciones, recordatorios…" /></FormField>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <GoldBtn onClick={()=>{ if(!f.patientId||!f.procedure.trim()) return; const pt=patients.find(p=>p.id===f.patientId); onSave({...f,id:uid(),patientName:pt?.name||""}); }}>Guardar Cita</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  );
}

function AddHistoryForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ date:today(), procedure:"", surgeon:"", anesthesia:"General", duration:"", notes:"", followUp:"" });
  const set = (k,v) => setF(p=>({...p,[k]:v}));
  return (
    <div>
      <ModalHeader title="Agregar Procedimiento" onClose={onClose} />
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <FormField label="Procedimiento"><input value={f.procedure} onChange={e=>set("procedure",e.target.value)} style={inputSty} placeholder="Ej: Rinoplastia, Liposucción…" /></FormField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={inputSty} /></FormField>
          <FormField label="Cirujano"><input value={f.surgeon} onChange={e=>set("surgeon",e.target.value)} style={inputSty} placeholder="Dr. Nombre" /></FormField>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormField label="Anestesia">
            <select value={f.anesthesia} onChange={e=>set("anesthesia",e.target.value)} style={inputSty}>
              {["General","Local","Sedación","Epidural"].map(a=><option key={a}>{a}</option>)}
            </select>
          </FormField>
          <FormField label="Duración"><input value={f.duration} onChange={e=>set("duration",e.target.value)} style={inputSty} placeholder="Ej: 2h 30min" /></FormField>
        </div>
        <FormField label="Notas clínicas"><textarea value={f.notes} onChange={e=>set("notes",e.target.value)} rows={4} style={{ ...inputSty, resize:"vertical" }} placeholder="Descripción del procedimiento, observaciones, complicaciones…" /></FormField>
        <FormField label="Fecha de seguimiento"><input type="date" value={f.followUp} onChange={e=>set("followUp",e.target.value)} style={inputSty} /></FormField>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <GoldBtn onClick={()=>{ if(!f.procedure.trim()) return; onSave({...f,id:uid(),patientId}); }}>Guardar</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  );
}

function AddPhotoForm({ patientId, onSave, onClose }) {
  const [f, setF] = useState({ label:"", type:"antes", date:today(), notes:"" });
  const [preview, setPreview] = useState("");
  const fileRef = useRef();
  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <ModalHeader title="Agregar Fotografía" onClose={onClose} />
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {/* Upload area */}
        <div onClick={()=>fileRef.current.click()} style={{ border:`2px dashed ${preview?G.gold:G.border}`, borderRadius:8, padding:"24px", textAlign:"center", cursor:"pointer", background:G.surfaceAlt, transition:"all 0.2s" }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=G.gold}
          onMouseLeave={e=>{ if(!preview) e.currentTarget.style.borderColor=G.border; }}>
          {preview ? <img src={preview} alt="" style={{ maxHeight:180, maxWidth:"100%", borderRadius:6, objectFit:"contain" }} /> : <div style={{ color:G.muted, fontSize:13 }}>📷<br/>Toca para seleccionar imagen<br/><span style={{ fontSize:11 }}>JPG, PNG, WEBP</span></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />
        <FormField label="Descripción"><input value={f.label} onChange={e=>set("label",e.target.value)} style={inputSty} placeholder="Ej: Frente - Preoperatorio" /></FormField>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormField label="Tipo">
            <select value={f.type} onChange={e=>set("type",e.target.value)} style={inputSty}>
              {[["antes","Antes"],["despues","Después"],["intraop","Intraoperatorio"],["seguimiento","Seguimiento"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </FormField>
          <FormField label="Fecha"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} style={inputSty} /></FormField>
        </div>
        <FormField label="Notas"><input value={f.notes} onChange={e=>set("notes",e.target.value)} style={inputSty} placeholder="Observaciones…" /></FormField>
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <GoldBtn onClick={()=>{ if(!preview) return; onSave({...f,id:uid(),patientId,url:preview}); }}>Guardar Foto</GoldBtn>
          <GoldBtn outline onClick={onClose}>Cancelar</GoldBtn>
        </div>
      </div>
    </div>
  );
}

function PhotoViewer({ photo, onClose }) {
  return (
    <div>
      <ModalHeader title={photo.label||"Fotografía"} onClose={onClose} />
      <img src={photo.url} alt={photo.label} style={{ width:"100%", maxHeight:400, objectFit:"contain", borderRadius:8, background:G.surfaceAlt }} />
      <div style={{ marginTop:16, display:"flex", gap:10, flexWrap:"wrap" }}>
        <Tag label={photo.type} color={photo.type==="antes"?G.info:photo.type==="despues"?G.success:G.gold} />
        <span style={{ fontSize:13, color:G.muted }}>{fmtDate(photo.date)}</span>
      </div>
      {photo.notes && <div style={{ marginTop:12, fontSize:13, color:G.muted }}>{photo.notes}</div>}
    </div>
  );
}

function EmptyState({ icon, msg }) {
  return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:G.muted }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:14 }}>{msg}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${G.border}`, borderTopColor:G.gold, animation:"spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
