/* ─── STATE ─────────────────────────────────────────────────────────── */
const STATE = {
  projects: {},
  currentProjectId: null,
  selectedNodeId: null,
  selectedEdge: null,
  scale: 1,
  panX: 0,
  panY: 0,
  selectedProvider: "anthropic",
  credentials: {},
  pendingPreview: null,
  pendingReexplore: null,
  aiEnabled: true,
};

// Clé pour sauvegarder l'état de l'IA
const AI_STATE_KEY = "naanoplanner:ai-state:v1";

const COLORS = [
  "var(--pink)",
  "var(--violet)",
  "var(--green)",
  "var(--cyan)",
  "var(--amber)",
];

function isProviderConfigured(providerKey) {
  const c = STATE.credentials[providerKey];
  return !!(c && c.apiKey && c.model);
}
function configuredProviders() {
  return Object.keys(PROVIDERS).filter(isProviderConfigured);
}

/* ─── DOM REFS ──────────────────────────────────────────────────────── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ─── HELPERS ───────────────────────────────────────────────────────── */
function uid(prefix = "id") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

function escapeHtml(str) {
  return String(str ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function fmtDate(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    const lang = localStorage.getItem("currentLanguage") || "fr";
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Sauvegarde l'état de l'IA dans localStorage
 */
function saveState() {
  try {
    localStorage.setItem(
      AI_STATE_KEY,
      JSON.stringify({
        aiEnabled: STATE.aiEnabled,
      }),
    );
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'état AI:", err);
  }
}

/**
 * Charge l'état de l'IA depuis localStorage
 */
function loadAIState() {
  try {
    const raw = localStorage.getItem(AI_STATE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.aiEnabled === "boolean") {
        STATE.aiEnabled = data.aiEnabled;
      }
    }
  } catch (err) {
    console.error("Erreur lors du chargement de l'état AI:", err);
  }
}

function dateRange(start, end) {
  if (start === end) return fmtDate(start);
  return fmtDate(start) + " — " + fmtDate(end);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function showToast(msg, type = "success") {
  const t = $("#toast");
  $("#toastMsg").textContent = msg;
  t.classList.toggle("error", type === "error");
  t.classList.add("visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("visible"), 4000);
}

function getCurrentProject() {
  return STATE.currentProjectId ? STATE.projects[STATE.currentProjectId] : null;
}

/* ─── PROJECTS PERSISTENCE ──────────────────────────────────────────── */
const PROJECTS_STORAGE_KEY = "naanoplanner:projects:v1";

function saveProjects() {
  try {
    // Sérialiser proprement : retirer les refs DOM (_path, _hit) des edges
    const data = {};
    Object.entries(STATE.projects).forEach(([id, proj]) => {
      // Recompute metrics on every save so percentage/status reflect tasks
      if (typeof recomputeProjectMetrics === "function") {
        recomputeProjectMetrics(proj);
      }
      data[id] = {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        model: proj.model,
        provider: proj.provider,
        color: proj.color,
        // Project lifecycle
        status: proj.status || "pending",
        percentage: typeof proj.percentage === "number" ? proj.percentage : 0,
        startDate: proj.startDate || null,
        endDate: proj.endDate || null,
        createdAt: proj.createdAt || null,
        updatedAt: proj.updatedAt || null,
        cloudId: proj.cloudId || null,
        // Home overview position (persisted so layout survives refresh)
        homeX: proj.homeX,
        homeY: proj.homeY,
        nodes: proj.nodes.map((n) => ({
          id: n.id,
          title: n.title,
          description: n.description,
          category: n.category,
          status: n.status,
          startDate: n.startDate,
          endDate: n.endDate,
          prerequisites: n.prerequisites || [],
          resources: n.resources || [],
          // Normalize events on save — guarantees the canonical
          // {name, type, description, canvasData} shape lands in
          // localStorage regardless of what the runtime put there.
          events: Array.isArray(n.events)
            ? n.events.map((ev) => ({
                name: String(ev?.name || ""),
                type: ev?.type === "handwritten" ? "handwritten" : "text",
                description: String(ev?.description || ""),
                canvasData: String(ev?.canvasData || ""),
              }))
            : [],
          subtasks: (n.subtasks || []).map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description || "",
            estimatedDays: s.estimatedDays || 0,
            done: !!s.done,
          })),
          x: n.x,
          y: n.y,
        })),
        edges: proj.edges.map((e) => ({
          from: e.from,
          to: e.to,
          type: e.type,
        })),
        // Project notes — multi-sheet notebook (text or handwritten per sheet)
        notes: (proj.notes || []).map((n) => ({
          id: n.id,
          title: n.title || "",
          type: n.type === "handwritten" ? "handwritten" : "text",
          content: n.content || "",
          canvasData: n.canvasData || "",
          createdAt: n.createdAt || null,
          updatedAt: n.updatedAt || null,
        })),
      };
    });
    localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify({
        projects: data,
        currentProjectId: STATE.currentProjectId,
      }),
    );
  } catch (err) {
    console.warn("Erreur sauvegarde projets:", err);
  }
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data.projects) {
      Object.entries(data.projects).forEach(([id, proj]) => {
        STATE.projects[id] = {
          ...proj,
          // Restore home position (may be undefined for old data → grid fallback)
          homeX: typeof proj.homeX === "number" ? proj.homeX : undefined,
          homeY: typeof proj.homeY === "number" ? proj.homeY : undefined,
          nodes: (proj.nodes || []).map((n) => ({
            ...n,
            // Normalize events on load — same shape as export/save so
            // any drift in localStorage (older format, missing fields)
            // gets repaired and round-trips cleanly.
            events: Array.isArray(n.events)
              ? n.events.map((ev) => ({
                  name: String(ev?.name || ""),
                  type: ev?.type === "handwritten" ? "handwritten" : "text",
                  description: String(ev?.description || ""),
                  canvasData: String(ev?.canvasData || ""),
                }))
              : [],
            subtasks: Array.isArray(n.subtasks)
              ? n.subtasks.map((s, i) => ({
                  id:
                    s.id ||
                    `st_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
                  title: String(s.title || ""),
                  description: String(s.description || ""),
                  estimatedDays: Number(s.estimatedDays) || 0,
                  done: !!s.done,
                }))
              : [],
          })),
          edges: (proj.edges || []).map((e) => ({
            from: e.from,
            to: e.to,
            type: e.type || "solid",
          })),
          notes: Array.isArray(proj.notes)
            ? proj.notes.map((n, i) => ({
                id:
                  n.id ||
                  `note_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
                title: String(n.title || ""),
                type: n.type === "handwritten" ? "handwritten" : "text",
                content: String(n.content || ""),
                canvasData: String(n.canvasData || ""),
                createdAt: n.createdAt || new Date().toISOString(),
                updatedAt:
                  n.updatedAt || n.createdAt || new Date().toISOString(),
              }))
            : [],
        };
      });
    }
    if (data.currentProjectId !== undefined && data.currentProjectId !== null) {
      // currentProjectId is defined and not null (means a project is open)
      if (STATE.projects[data.currentProjectId]) {
        STATE.currentProjectId = data.currentProjectId;
      } else {
        // Project doesn't exist anymore, fall back to first project or home
        const keys = Object.keys(STATE.projects);
        STATE.currentProjectId = keys.length > 0 ? keys[0] : null;
      }
    } else if (data.currentProjectId === null) {
      // Explicitly saved as null (home view)
      STATE.currentProjectId = null;
    } else {
      // currentProjectId is undefined (old data or first load)
      const keys = Object.keys(STATE.projects);
      STATE.currentProjectId = keys.length > 0 ? keys[0] : null;
    }
  } catch (err) {
    console.warn("Erreur chargement projets:", err);
  }
}
