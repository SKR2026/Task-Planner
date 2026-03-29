import { useState, useEffect, useRef } from "react";

// ── Palette & helpers ──────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0d0f14",
  surface: "#161a23",
  card: "#1c2130",
  border: "#2a3045",
  accent: "#4f8ef7",
  accentGlow: "#4f8ef733",
  green: "#2dd4a0",
  amber: "#f5a623",
  red: "#f75f5f",
  purple: "#a78bfa",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#94a3b8",
};

const PRIORITIES = { High: COLORS.red, Medium: COLORS.amber, Low: COLORS.green };
const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const STATUS_COLORS = {
  "To Do": COLORS.muted,
  "In Progress": COLORS.accent,
  Review: COLORS.purple,
  Done: COLORS.green,
};

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const today = () => new Date().toISOString().slice(0, 10);

// ── Seed data ──────────────────────────────────────────────────────────────────
const SEED_TASKS = [
  { id: uid(), title: "Design new landing page", desc: "Create wireframes and final design assets for Q2 launch.", assignee: "priya@example.com", priority: "High", status: "In Progress", due: "2026-04-10", created: "2026-03-20", token: uid(), replies: [{ id: uid(), author: "priya@example.com", text: "Started the wireframes, will share by Friday.", time: "2026-03-22T10:00:00Z", attachments: [] }], attachments: [], reminder: "daily", reminded: false },
  { id: uid(), title: "Fix payment gateway bug", desc: "Users report 502 errors on Razorpay webhook.", assignee: "rahul@example.com", priority: "High", status: "To Do", due: "2026-04-02", created: "2026-03-25", token: uid(), replies: [], attachments: [], reminder: "none", reminded: false },
  { id: uid(), title: "Write API documentation", desc: "Document all v2 endpoints with examples.", assignee: "neha@example.com", priority: "Medium", status: "Review", due: "2026-04-15", created: "2026-03-18", token: uid(), replies: [{ id: uid(), author: "neha@example.com", text: "Draft is ready for review at /docs/v2.", time: "2026-03-28T14:30:00Z", attachments: [] }], attachments: [], reminder: "weekly", reminded: false },
  { id: uid(), title: "Migrate database to PostgreSQL", desc: "Move production MySQL to PG 16.", assignee: "arjun@example.com", priority: "Medium", status: "To Do", due: "2026-05-01", created: "2026-03-26", token: uid(), replies: [], attachments: [], reminder: "none", reminded: false },
  { id: uid(), title: "User research interviews", desc: "Conduct 10 user interviews for the mobile app.", assignee: "priya@example.com", priority: "Low", status: "Done", due: "2026-03-28", created: "2026-03-10", token: uid(), replies: [], attachments: [], reminder: "none", reminded: false },
  { id: uid(), title: "Set up CI/CD pipeline", desc: "Configure GitHub Actions for auto-deploy.", assignee: "rahul@example.com", priority: "Medium", status: "In Progress", due: "2026-04-20", created: "2026-03-22", token: uid(), replies: [], attachments: [], reminder: "weekly", reminded: false },
];

// ── Mini chart components (pure SVG) ──────────────────────────────────────────
function DonutChart({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -90;
  const r = 40, cx = 60, cy = 60;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const a1 = (angle * Math.PI) / 180;
    const a2 = ((angle + sweep) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = sweep > 180 ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    angle += sweep;
    return { path, color: d.color, label: d.label, value: d.value };
  });
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.85} />)}
      <circle cx={cx} cy={cy} r={24} fill={COLORS.card} />
      <text x={cx} y={cy + 5} textAnchor="middle" fill={COLORS.text} fontSize="14" fontWeight="700">{total}</text>
    </svg>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <svg width="100%" height="80" viewBox={`0 0 ${data.length * 40} 80`} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * 60);
        return (
          <g key={i}>
            <rect x={i * 40 + 8} y={70 - h} width={24} height={h} rx={4} fill={d.color || COLORS.accent} opacity={0.8} />
            <text x={i * 40 + 20} y={78} textAnchor="middle" fill={COLORS.muted} fontSize="8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Sparkline({ values, color = COLORS.accent }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 120, h = 36;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Shared UI primitives ───────────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
);

const Btn = ({ children, onClick, variant = "primary", small, style: s = {}, disabled }) => {
  const base = { cursor: disabled ? "not-allowed" : "pointer", border: "none", borderRadius: 8, fontWeight: 700, fontSize: small ? 12 : 14, padding: small ? "6px 12px" : "10px 20px", transition: "all .15s", opacity: disabled ? 0.5 : 1, ...s };
  const styles = {
    primary: { background: COLORS.accent, color: "#fff", boxShadow: `0 0 12px ${COLORS.accentGlow}` },
    ghost: { background: "transparent", color: COLORS.dim, border: `1px solid ${COLORS.border}` },
    danger: { background: COLORS.red + "22", color: COLORS.red, border: `1px solid ${COLORS.red}44` },
    success: { background: COLORS.green + "22", color: COLORS.green, border: `1px solid ${COLORS.green}44` },
  };
  return <button style={{ ...base, ...styles[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
    <input style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "9px 12px", color: COLORS.text, fontSize: 14, boxSizing: "border-box", outline: "none" }} {...props} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
    <select style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "9px 12px", color: COLORS.text, fontSize: 14, boxSizing: "border-box", outline: "none" }} {...props}>{children}</select>
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4, fontWeight: 600 }}>{label}</div>}
    <textarea rows={3} style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "9px 12px", color: COLORS.text, fontSize: 14, resize: "vertical", boxSizing: "border-box", outline: "none" }} {...props} />
  </div>
);

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, ...s }}>{children}</div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.text }}>{title}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 22, cursor: "pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── ADMIN DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ tasks }) {
  const byStatus = STATUSES.map((s) => ({ label: s.replace(" ", "\n"), value: tasks.filter((t) => t.status === s).length, color: STATUS_COLORS[s] }));
  const byPriority = Object.keys(PRIORITIES).map((p) => ({ label: p, value: tasks.filter((t) => t.priority === p).length, color: PRIORITIES[p] }));
  const byPerson = [...new Set(tasks.map((t) => t.assignee))].map((e) => ({ email: e, count: tasks.filter((t) => t.assignee === e).length, done: tasks.filter((t) => t.assignee === e && t.status === "Done").length }));
  const overdue = tasks.filter((t) => t.due < today() && t.status !== "Done").length;
  const completionRate = tasks.length ? Math.round((tasks.filter((t) => t.status === "Done").length / tasks.length) * 100) : 0;
  const weeklyData = [3, 5, 4, 7, 6, tasks.filter((t) => t.status === "Done").length];

  const statCards = [
    { label: "Total Tasks", value: tasks.length, color: COLORS.accent, icon: "📋" },
    { label: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length, color: COLORS.purple, icon: "⚡" },
    { label: "Overdue", value: overdue, color: COLORS.red, icon: "🔴" },
    { label: "Completion Rate", value: completionRate + "%", color: COLORS.green, icon: "✅" },
  ];

  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 24, color: COLORS.text, marginBottom: 4 }}>Command Dashboard</div>
      <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 24 }}>Real-time overview of all tasks & team activity</div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 }}>
        {statCards.map((sc) => (
          <Card key={sc.label} style={{ borderLeft: `3px solid ${sc.color}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{sc.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: sc.color }}>{sc.value}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>{sc.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.dim, marginBottom: 12 }}>BY STATUS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart data={byStatus} />
            <div>
              {byStatus.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                  <div style={{ fontSize: 11, color: COLORS.dim }}>{d.label.replace("\n", " ")}</div>
                  <div style={{ fontSize: 11, color: COLORS.text, fontWeight: 700, marginLeft: "auto" }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.dim, marginBottom: 12 }}>BY PRIORITY</div>
          <BarChart data={byPriority} />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {byPriority.map((d) => <Badge key={d.label} label={`${d.label}: ${d.value}`} color={d.color} />)}
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.dim, marginBottom: 8 }}>WEEKLY COMPLETIONS</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.green, marginBottom: 4 }}>{weeklyData[weeklyData.length - 1]}</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8 }}>tasks done this week</div>
          <Sparkline values={weeklyData} color={COLORS.green} />
        </Card>
      </div>

      {/* Team table */}
      <Card>
        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.dim, marginBottom: 14 }}>TEAM WORKLOAD</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Member", "Assigned", "Done", "Progress"].map((h) => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, color: COLORS.muted, fontWeight: 600, paddingBottom: 8, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byPerson.map((p) => {
              const pct = p.count ? Math.round((p.done / p.count) * 100) : 0;
              return (
                <tr key={p.email} style={{ borderBottom: `1px solid ${COLORS.border}11` }}>
                  <td style={{ padding: "10px 0", fontSize: 13, color: COLORS.text }}>{p.email}</td>
                  <td style={{ fontSize: 13, color: COLORS.dim }}>{p.count}</td>
                  <td style={{ fontSize: 13, color: COLORS.green }}>{p.done}</td>
                  <td style={{ width: 120 }}>
                    <div style={{ background: COLORS.bg, borderRadius: 6, height: 6, width: "100%" }}>
                      <div style={{ background: COLORS.accent, borderRadius: 6, height: 6, width: `${pct}%`, transition: "width .5s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>{pct}%</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── TASK FORM ──────────────────────────────────────────────────────────────────
function TaskForm({ onSave, onClose, existing }) {
  const [form, setForm] = useState(existing || { title: "", desc: "", assignee: "", priority: "Medium", status: "To Do", due: "", reminder: "none" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = () => {
    if (!form.title || !form.assignee || !form.due) return alert("Title, assignee email & due date are required.");
    onSave({ ...form, id: existing?.id || uid(), token: existing?.token || uid(), created: existing?.created || today(), replies: existing?.replies || [], attachments: existing?.attachments || [] });
  };
  return (
    <div>
      <Input label="Task Title *" value={form.title} onChange={set("title")} placeholder="e.g. Fix login bug" />
      <Textarea label="Description" value={form.desc} onChange={set("desc")} placeholder="Detailed description…" />
      <Input label="Assign To (Email) *" type="email" value={form.assignee} onChange={set("assignee")} placeholder="user@company.com" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Priority" value={form.priority} onChange={set("priority")}>
          {Object.keys(PRIORITIES).map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={set("status")}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>
      <Input label="Due Date *" type="date" value={form.due} onChange={set("due")} />
      <Select label="Reminder Frequency" value={form.reminder} onChange={set("reminder")}>
        <option value="none">No reminder</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="3days">Every 3 days</option>
        <option value="on_due">On due date only</option>
      </Select>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>{existing ? "Update Task" : "Create & Assign Task"}</Btn>
      </div>
    </div>
  );
}

// ── TASK LIST (ADMIN) ──────────────────────────────────────────────────────────
function TaskList({ tasks, onEdit, onDelete, onView }) {
  const [filter, setFilter] = useState({ status: "All", priority: "All", search: "" });
  const filtered = tasks.filter((t) =>
    (filter.status === "All" || t.status === filter.status) &&
    (filter.priority === "All" || t.priority === filter.priority) &&
    (t.title.toLowerCase().includes(filter.search.toLowerCase()) || t.assignee.toLowerCase().includes(filter.search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>All Tasks</div>
      <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 18 }}>{tasks.length} tasks total</div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} placeholder="🔍  Search tasks or members…" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 14px", color: COLORS.text, fontSize: 13, flex: 1, minWidth: 180 }} />
        <select value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", color: COLORS.text, fontSize: 13 }}>
          <option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filter.priority} onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", color: COLORS.text, fontSize: 13 }}>
          <option>All</option>{Object.keys(PRIORITIES).map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      {/* Task rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 && <div style={{ color: COLORS.muted, textAlign: "center", padding: 40 }}>No tasks match the filters.</div>}
        {filtered.map((t) => {
          const overdue = t.due < today() && t.status !== "Done";
          return (
            <Card key={t.id} style={{ borderLeft: `3px solid ${PRIORITIES[t.priority]}`, cursor: "pointer" }} >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }} onClick={() => onView(t)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.text }}>{t.title}</div>
                    <Badge label={t.priority} color={PRIORITIES[t.priority]} />
                    <Badge label={t.status} color={STATUS_COLORS[t.status]} />
                    {overdue && <Badge label="OVERDUE" color={COLORS.red} />}
                    {t.reminder !== "none" && <Badge label={`🔔 ${t.reminder}`} color={COLORS.purple} />}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{t.assignee} · Due {fmtDate(t.due)} · {t.replies.length} replies · {t.attachments.length} files</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant="ghost" onClick={() => onEdit(t)}>Edit</Btn>
                  <Btn small variant="danger" onClick={() => onDelete(t.id)}>Delete</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── TASK DETAIL (ADMIN + USER) ─────────────────────────────────────────────────
function TaskDetail({ task, onClose, onUpdateTask, isAdmin }) {
  const [replyText, setReplyText] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef();

  const addReply = () => {
    if (!replyText.trim() && files.length === 0) return;
    const newReply = {
      id: uid(),
      author: isAdmin ? "admin@company.com" : task.assignee,
      text: replyText,
      time: new Date().toISOString(),
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    };
    onUpdateTask({ ...task, replies: [...task.replies, newReply] });
    setReplyText("");
    setFiles([]);
  };

  const changeStatus = (s) => onUpdateTask({ ...task, status: s });

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    setFiles((f) => [...f, ...picked]);
    // Also attach to task-level
    const taskFiles = picked.map((f) => ({ id: uid(), name: f.name, size: f.size, type: f.type, uploaded: new Date().toISOString() }));
    onUpdateTask({ ...task, attachments: [...task.attachments, ...taskFiles] });
  };

  const overdue = task.due < today() && task.status !== "Done";

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 900, display: "flex", alignItems: "stretch", justifyContent: "flex-end" }}>
      <div style={{ width: "100%", maxWidth: 620, background: COLORS.surface, borderLeft: `1px solid ${COLORS.border}`, overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, color: COLORS.text, marginBottom: 6 }}>{task.title}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge label={task.priority} color={PRIORITIES[task.priority]} />
              <Badge label={task.status} color={STATUS_COLORS[task.status]} />
              {overdue && <Badge label="OVERDUE" color={COLORS.red} />}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 24, cursor: "pointer" }}>✕</button>
        </div>

        {/* Meta */}
        <Card style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Assigned To", task.assignee], ["Due Date", fmtDate(task.due)], ["Created", fmtDate(task.created)], ["Reminder", task.reminder]].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600 }}>{k}</div>
                <div style={{ fontSize: 13, color: COLORS.text }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Description */}
        {task.desc && (
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 6 }}>DESCRIPTION</div>
            <div style={{ fontSize: 14, color: COLORS.dim, lineHeight: 1.6 }}>{task.desc}</div>
          </Card>
        )}

        {/* Status change */}
        {isAdmin && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>CHANGE STATUS</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <Btn key={s} small variant={task.status === s ? "primary" : "ghost"} onClick={() => changeStatus(s)}>{s}</Btn>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {task.attachments.length > 0 && (
          <Card style={{ padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>ATTACHMENTS ({task.attachments.length})</div>
            {task.attachments.map((a) => (
              <div key={a.id || a.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
                <span style={{ fontSize: 16 }}>📎</span>
                <div>
                  <div style={{ fontSize: 13, color: COLORS.text }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>{(a.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Replies */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 10 }}>ACTIVITY & REPLIES ({task.replies.length})</div>
          {task.replies.map((r) => (
            <div key={r.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 12, color: COLORS.accent, fontWeight: 700 }}>{r.author}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{new Date(r.time).toLocaleString("en-IN")}</div>
              </div>
              {r.text && <div style={{ fontSize: 14, color: COLORS.dim }}>{r.text}</div>}
              {r.attachments?.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {r.attachments.map((a, i) => <Badge key={i} label={`📎 ${a.name}`} color={COLORS.purple} />)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>ADD REPLY</div>
          <textarea rows={3} value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type your reply or update…" style={{ width: "100%", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "9px 12px", color: COLORS.text, fontSize: 14, resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
          {files.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {files.map((f, i) => <Badge key={i} label={`📎 ${f.name}`} color={COLORS.purple} />)}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn small variant="ghost" onClick={() => fileRef.current.click()}>📎 Attach Evidence</Btn>
            <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />
            <Btn small onClick={addReply} disabled={!replyText.trim() && files.length === 0}>Send Reply</Btn>
          </div>
        </Card>

        {/* Magic link */}
        <Card style={{ padding: 14, background: COLORS.bg }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 4 }}>USER MAGIC LINK (share with assignee)</div>
          <div style={{ fontSize: 11, color: COLORS.accent, wordBreak: "break-all", fontFamily: "monospace", background: COLORS.card, borderRadius: 6, padding: "6px 10px" }}>
            https://taskplanner.app/task?token={task.token}
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4 }}>The assignee can view & reply without creating an account.</div>
        </Card>
      </div>
    </div>
  );
}

// ── USER TASK VIEW (no account) ────────────────────────────────────────────────
function UserTaskView({ tasks, onUpdateTask }) {
  const [token, setToken] = useState("");
  const [task, setTask] = useState(null);
  const [err, setErr] = useState("");

  const lookup = () => {
    const found = tasks.find((t) => t.token === token.trim());
    if (found) { setTask(found); setErr(""); }
    else setErr("No task found for this token. Please check the link.");
  };

  // Refresh task when tasks prop changes
  useEffect(() => {
    if (task) {
      const updated = tasks.find((t) => t.id === task.id);
      if (updated) setTask(updated);
    }
  }, [tasks]);

  if (task) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Btn small variant="ghost" onClick={() => setTask(null)}>← Back</Btn>
      </div>
      <TaskDetail task={task} onClose={() => setTask(null)} onUpdateTask={onUpdateTask} isAdmin={false} />
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
      <div style={{ fontWeight: 900, fontSize: 24, color: COLORS.text, marginBottom: 8 }}>Access Your Task</div>
      <div style={{ color: COLORS.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
        Enter the token from your email notification to view your assigned task and submit replies or evidence. No account needed.
      </div>
      <Card>
        <Input label="Task Token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. abc123xyz" />
        {err && <div style={{ color: COLORS.red, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <Btn onClick={lookup} style={{ width: "100%" }}>View My Task →</Btn>

        {/* Demo tokens */}
        <div style={{ marginTop: 16, padding: 12, background: COLORS.bg, borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, marginBottom: 8 }}>DEMO TOKENS (for testing)</div>
          {tasks.slice(0, 3).map((t) => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 11, color: COLORS.dim }}>{t.assignee}</div>
              <button onClick={() => { setToken(t.token); }} style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "2px 8px", color: COLORS.accent, fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>{t.token}</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── KANBAN BOARD ───────────────────────────────────────────────────────────────
function KanbanBoard({ tasks, onUpdateTask, onView }) {
  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>Kanban Board</div>
      <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 18 }}>Drag-free visual task board</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {STATUSES.map((status) => {
          const col = tasks.filter((t) => t.status === status);
          return (
            <div key={status}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status] }} />
                <div style={{ fontWeight: 700, fontSize: 12, color: STATUS_COLORS[status] }}>{status.toUpperCase()}</div>
                <div style={{ marginLeft: "auto", background: STATUS_COLORS[status] + "22", color: STATUS_COLORS[status], borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{col.length}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.map((t) => (
                  <div key={t.id} onClick={() => onView(t)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12, cursor: "pointer", borderLeft: `3px solid ${PRIORITIES[t.priority]}` }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.text, marginBottom: 4 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>{t.assignee}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Badge label={t.priority} color={PRIORITIES[t.priority]} />
                      <div style={{ fontSize: 10, color: t.due < today() && t.status !== "Done" ? COLORS.red : COLORS.muted }}>📅 {fmtDate(t.due)}</div>
                    </div>
                    {(t.replies.length > 0 || t.attachments.length > 0) && (
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        {t.replies.length > 0 && <div style={{ fontSize: 10, color: COLORS.muted }}>💬 {t.replies.length}</div>}
                        {t.attachments.length > 0 && <div style={{ fontSize: 10, color: COLORS.muted }}>📎 {t.attachments.length}</div>}
                      </div>
                    )}
                  </div>
                ))}
                {col.length === 0 && <div style={{ fontSize: 12, color: COLORS.border, textAlign: "center", padding: "20px 0" }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── REMINDERS PANEL ────────────────────────────────────────────────────────────
function RemindersPanel({ tasks }) {
  const reminded = tasks.filter((t) => t.reminder !== "none" && t.status !== "Done");
  const overdue = tasks.filter((t) => t.due < today() && t.status !== "Done");

  return (
    <div>
      <div style={{ fontWeight: 900, fontSize: 22, color: COLORS.text, marginBottom: 4 }}>Reminders & Notifications</div>
      <div style={{ color: COLORS.muted, fontSize: 13, marginBottom: 24 }}>Scheduled email reminders sent to assignees automatically</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <Card style={{ borderLeft: `3px solid ${COLORS.amber}` }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.amber }}>{reminded.length}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>Active Reminder Tasks</div>
        </Card>
        <Card style={{ borderLeft: `3px solid ${COLORS.red}` }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.red }}>{overdue.length}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>Overdue (auto-escalated)</div>
        </Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.dim, marginBottom: 14 }}>REMINDER SCHEDULE</div>
        {reminded.length === 0 && <div style={{ color: COLORS.muted, fontSize: 13 }}>No active reminders.</div>}
        {reminded.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
            <div style={{ fontSize: 20 }}>🔔</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{t.title}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>{t.assignee} · Due {fmtDate(t.due)}</div>
            </div>
            <Badge label={t.reminder} color={COLORS.purple} />
          </div>
        ))}
      </Card>

      {overdue.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.red, marginBottom: 14 }}>⚠ OVERDUE TASKS (Urgent Reminder Triggered)</div>
          {overdue.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
              <div style={{ fontSize: 20 }}>🚨</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>{t.title}</div>
                <div style={{ fontSize: 11, color: COLORS.red }}>{t.assignee} · Was due {fmtDate(t.due)}</div>
              </div>
              <Badge label={t.status} color={STATUS_COLORS[t.status]} />
            </div>
          ))}
        </Card>
      )}

      <Card style={{ marginTop: 16, background: COLORS.bg }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.dim, marginBottom: 10 }}>📧 EMAIL TEMPLATE PREVIEW</div>
        <div style={{ background: COLORS.card, borderRadius: 8, padding: 16, fontSize: 13, color: COLORS.dim, lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
          <div style={{ fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>Subject: Reminder — Task "[Task Title]" is due on [Date]</div>
          <div>Hi [Assignee Name],</div>
          <div style={{ marginTop: 8 }}>This is a <strong style={{ color: COLORS.amber }}>[frequency]</strong> reminder that you have a task pending:</div>
          <div style={{ margin: "10px 0", padding: 10, background: COLORS.bg, borderRadius: 6 }}>
            <div><strong>Task:</strong> [Title]</div>
            <div><strong>Due:</strong> [Date]</div>
            <div><strong>Priority:</strong> [Priority]</div>
          </div>
          <div>Click below to view your task and submit updates — <em>no account required.</em></div>
          <div style={{ margin: "10px 0", background: COLORS.accent + "22", borderRadius: 6, padding: "8px 14px", color: COLORS.accent }}>→ View Task: https://taskplanner.app/task?token=[TOKEN]</div>
          <div>Regards,<br />Task Planner · Admin</div>
        </div>
      </Card>
    </div>
  );
}

// ── ROOT APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [view, setView] = useState("dashboard"); // dashboard | tasks | kanban | reminders | user
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);

  const saveTask = (t) => {
    setTasks((prev) => prev.find((x) => x.id === t.id) ? prev.map((x) => x.id === t.id ? t : x) : [t, ...prev]);
    setShowForm(false);
    setEditTask(null);
  };

  const deleteTask = (id) => {
    if (confirm("Delete this task?")) setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTask = (t) => setTasks((prev) => prev.map((x) => x.id === t.id ? t : x));

  const NAV = isAdmin
    ? [{ id: "dashboard", icon: "📊", label: "Dashboard" }, { id: "tasks", icon: "📋", label: "Tasks" }, { id: "kanban", icon: "🗂", label: "Kanban" }, { id: "reminders", icon: "🔔", label: "Reminders" }]
    : [{ id: "user", icon: "👤", label: "My Tasks" }];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0, minHeight: "100vh" }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.accent, letterSpacing: -0.5 }}>⬡ TaskCommand</div>
          <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>Project Management Suite</div>
        </div>

        {/* Nav */}
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {NAV.map((n) => (
            <div key={n.id} onClick={() => setView(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: view === n.id ? COLORS.accentGlow : "transparent", color: view === n.id ? COLORS.accent : COLORS.muted, fontWeight: view === n.id ? 700 : 400, fontSize: 14, transition: "all .15s" }}>
              <span>{n.icon}</span>{n.label}
            </div>
          ))}
        </div>

        {/* Admin / User toggle */}
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.muted, fontWeight: 600, marginBottom: 8 }}>SWITCH VIEW</div>
          <Btn small variant={isAdmin ? "primary" : "ghost"} style={{ width: "100%", marginBottom: 6 }} onClick={() => { setIsAdmin(true); setView("dashboard"); }}>🔐 Admin</Btn>
          <Btn small variant={!isAdmin ? "primary" : "ghost"} style={{ width: "100%" }} onClick={() => { setIsAdmin(false); setView("user"); }}>👤 User View</Btn>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Topbar */}
        {isAdmin && (
          <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green, boxShadow: `0 0 6px ${COLORS.green}` }} />
              <div style={{ fontSize: 12, color: COLORS.muted }}>admin@company.com</div>
            </div>
            <Btn onClick={() => { setEditTask(null); setShowForm(true); }}>+ New Task</Btn>
          </div>
        )}

        <div style={{ padding: 28 }}>
          {view === "dashboard" && <Dashboard tasks={tasks} />}
          {view === "tasks" && <TaskList tasks={tasks} onEdit={(t) => { setEditTask(t); setShowForm(true); }} onDelete={deleteTask} onView={setDetailTask} />}
          {view === "kanban" && <KanbanBoard tasks={tasks} onUpdateTask={updateTask} onView={setDetailTask} />}
          {view === "reminders" && <RemindersPanel tasks={tasks} />}
          {view === "user" && <UserTaskView tasks={tasks} onUpdateTask={updateTask} />}
        </div>
      </div>

      {/* Modals */}
      {showForm && (
        <Modal title={editTask ? "Edit Task" : "Create & Assign New Task"} onClose={() => { setShowForm(false); setEditTask(null); }}>
          <TaskForm onSave={saveTask} onClose={() => { setShowForm(false); setEditTask(null); }} existing={editTask} />
        </Modal>
      )}

      {detailTask && (
        <TaskDetail task={detailTask} onClose={() => setDetailTask(null)} onUpdateTask={(t) => { updateTask(t); setDetailTask(t); }} isAdmin={isAdmin} />
      )}
    </div>
  );
}
