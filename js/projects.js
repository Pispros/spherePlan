/* ─── PROJECT MANAGEMENT ───────────────────────────────────────────── */

function createProject({
  name,
  description,
  model,
  provider,
  tasks,
  edges,
  notes,
  status,
  startDate,
  endDate,
}) {
  const id = uid("p");
  const colorIdx = Object.keys(STATE.projects).length % COLORS.length;
  const now = new Date().toISOString();
  const project = {
    id,
    name: name || "Sans titre",
    description: description || "",
    model: model || STATE.credentials[provider]?.model || "?",
    provider: provider || STATE.selectedProvider,
    color: COLORS[colorIdx],
    // Cycle de vie
    status: status === "completed" ? "completed" : "pending",
    percentage: 0, // recalculé par computeProjectPercentage
    startDate: startDate || null,
    endDate: endDate || null,
    createdAt: now,
    updatedAt: now,
    // cloudId est attribué après le 1er upload sur le cloud
    cloudId: null,
    nodes: (tasks || []).map((t) => ({
      id: t.id || uid("n"),
      title: t.title,
      description: t.description,
      category: t.category || "build",
      status: t.status || "pending",
      startDate: t.startDate,
      endDate: t.endDate,
      prerequisites: t.prerequisites || [],
      resources: t.resources || [],
      // Normalize each event to a consistent shape: { name, type,
      // description, canvasData }. Without this, a malformed import
      // (missing field, wrong type) would propagate silently into
      // the state and could fail to round-trip.
      events: Array.isArray(t.events)
        ? t.events.map((ev) => ({
            name: String(ev?.name || ""),
            type: ev?.type === "handwritten" ? "handwritten" : "text",
            description: String(ev?.description || ""),
            canvasData: String(ev?.canvasData || ""),
          }))
        : [],
      subtasks: Array.isArray(t.subtasks)
        ? t.subtasks.map((s, i) => ({
            id:
              s.id ||
              `st_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
            title: String(s.title || ""),
            description: String(s.description || ""),
            estimatedDays: Number(s.estimatedDays) || 0,
            done: !!s.done,
          }))
        : [],
      x: t.x ?? 100,
      y: t.y ?? 100,
    })),
    edges: (edges || []).map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type || "solid",
    })),
    notes: Array.isArray(notes)
      ? notes.map((n, i) => ({
          id:
            n.id ||
            `note_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          title: String(n.title || ""),
          type: n.type === "handwritten" ? "handwritten" : "text",
          content: String(n.content || ""),
          canvasData: String(n.canvasData || ""),
          createdAt: n.createdAt || new Date().toISOString(),
          updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
        }))
      : [],
  };
  STATE.projects[id] = project;
  STATE.currentProjectId = id;
  recomputeProjectMetrics(project);
  saveProjects();
  renderProjectMenu();
  renderCurrentProject();
  return project;
}

/* ─── PROJECT METRICS ──────────────────────────────────────────────────
 * Compute completion percentage from tasks. The canonical task-done
 * marker in this codebase is `n.status === "done"` (NOT "completed" —
 * "completed" is the project-level status). We mirror exactly the
 * granular formula used by renderProjectsOverview so that the home
 * overview, the edit modal, the JSON export, and the cloud sync all
 * report the same number for the same project.
 *
 * Granular model: each subtask counts as 1 unit; a task without
 * subtasks counts as 1 unit. A task marked `status === "done"`
 * contributes ALL its subtask units as done regardless of individual
 * subtask flags.
 *
 * When the resulting percentage is 100, the project's status field is
 * forced to "completed".
 * ─────────────────────────────────────────────────────────────────── */
function computeProjectPercentage(project) {
  if (!project || !Array.isArray(project.nodes) || project.nodes.length === 0) {
    return 0;
  }
  let totalUnits = 0;
  let doneUnits = 0;
  for (const n of project.nodes) {
    const subs = Array.isArray(n.subtasks) ? n.subtasks : [];
    if (subs.length > 0) {
      totalUnits += subs.length;
      doneUnits +=
        n.status === "done" ? subs.length : subs.filter((s) => s.done).length;
    } else {
      totalUnits += 1;
      if (n.status === "done") doneUnits += 1;
    }
  }
  return totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;
}

function recomputeProjectMetrics(project) {
  if (!project) return;
  const pct = computeProjectPercentage(project);
  const prevPct = project.percentage;
  const prevStatus = project.status;
  project.percentage = pct;
  // Auto-completion lorsque 100%
  if (pct === 100) {
    project.status = "completed";
  }
  if (prevPct !== project.percentage || prevStatus !== project.status) {
    project.updatedAt = new Date().toISOString();
  }
}

function recomputeAllProjectMetrics() {
  for (const id of Object.keys(STATE.projects || {})) {
    recomputeProjectMetrics(STATE.projects[id]);
  }
}

function deleteProject(id) {
  if (!STATE.projects[id]) return;
  delete STATE.projects[id];
  if (STATE.currentProjectId === id) {
    const remaining = Object.keys(STATE.projects);
    STATE.currentProjectId = remaining[0] || null;
  }

  // Remove home edges connected to this project
  const homeEdges = loadHomeEdges();
  const updatedEdges = homeEdges.filter((e) => e.from !== id && e.to !== id);
  if (updatedEdges.length !== homeEdges.length) {
    saveHomeEdges(updatedEdges);
  }

  saveProjects();
  renderProjectMenu();
  renderCurrentProject();
}

function switchProject(id) {
  if (!STATE.projects[id]) return;
  STATE.currentProjectId = id;
  saveProjects();
  renderProjectMenu();
  renderCurrentProject();
}

/* ─── HOME — retour à l'accueil (vue projets) ───────────────────────── */
function goHome() {
  STATE.currentProjectId = null;
  saveProjects();
  renderProjectMenu();
  renderCurrentProject();
}

/* ─── PROJECT MENU ──────────────────────────────────────────────────── */
function renderProjectMenu() {
  const projectMenu = $("#projectMenu");
  const projs = Object.values(STATE.projects);
  projectMenu.innerHTML = "";

  if (projs.length === 0) {
    projectMenu.innerHTML = `
      <div class="project-menu-empty">${t("noProjects")}</div>
      <div class="divider"></div>
      <button class="project-item new-project" id="menuNewProject">
        <span class="project-item-mark" style="background: var(--pink);"></span>
        <span class="project-item-name">${t("newProject")}…</span>
      </button>`;
  } else {
    // Home button
    const homeBtn = document.createElement("button");
    homeBtn.className =
      "project-item" + (!STATE.currentProjectId ? " current" : "");
    homeBtn.innerHTML = `
      <span class="project-item-mark" style="background: var(--fg-faint); display:flex; align-items:center; justify-content:center;">
        <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
          <path d="M1 6L6 1l5 5M2 5.5V11h3V8h2v3h3V5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="project-item-name">${t("homeView") || "Accueil"}</span>`;
    homeBtn.addEventListener("click", () => {
      goHome();
      projectMenu.classList.remove("open");
    });
    projectMenu.appendChild(homeBtn);

    const divTop = document.createElement("div");
    divTop.className = "divider";
    projectMenu.appendChild(divTop);

    projs.forEach((p) => {
      const btn = document.createElement("button");
      btn.className =
        "project-item" + (p.id === STATE.currentProjectId ? " current" : "");
      btn.innerHTML = `
        <span class="project-item-mark" style="background: ${p.color};"></span>
        <span class="project-item-name">${escapeHtml(p.name)}</span>
        <span class="project-item-meta">${p.nodes.length} ${t("step")}${p.nodes.length > 1 ? "s" : ""}</span>`;
      btn.addEventListener("click", () => {
        switchProject(p.id);
        projectMenu.classList.remove("open");
      });
      projectMenu.appendChild(btn);
    });

    const div = document.createElement("div");
    div.className = "divider";
    projectMenu.appendChild(div);

    const newBtn = document.createElement("button");
    newBtn.className = "project-item new-project";
    newBtn.id = "menuNewProject";
    newBtn.innerHTML = `
      <span class="project-item-mark" style="background: var(--pink);"></span>
      <span class="project-item-name">${t("newProject")}…</span>`;
    projectMenu.appendChild(newBtn);
  }

  const nb = $("#menuNewProject");
  if (nb)
    nb.addEventListener("click", () => {
      projectMenu.classList.remove("open");
      openNewProjectModal();
    });
}

/* ─── RENDER CURRENT PROJECT (or home) ─────────────────────────────── */
function renderCurrentProject() {
  const proj = getCurrentProject();
  const ps = $("#projectSwitch");
  const emptyState = $("#emptyState");
  const legend = $("#legend");
  const fab = $("#addNodeFab");
  const notesFab = $("#notesFab");
  const zoomCtrl = $("#zoomCtrl");
  const nodesLayer = $("#nodes");
  const svg = $("#connections");
  const projectSyncBtn = $("#projectSyncBtn");

  if (proj) {
    ps.disabled = false;
    $("#currentProjectName").textContent = proj.name;
    $("#currentMark").style.background = proj.color;
    // Bouton "Exporter projet" visible uniquement quand un projet est ouvert
    const quickExportBtn = $("#quickExportBtn");
    const quickExportAllBtn = $("#quickExportAllBtn");
    if (quickExportBtn) {
      quickExportBtn.style.display = "";
      quickExportBtn.disabled = false;
    }
    if (quickExportAllBtn) quickExportAllBtn.style.display = "none";
    if (projectSyncBtn) projectSyncBtn.classList.add("visible");
    emptyState.style.display = "none";
    legend.classList.add("visible");
    fab.classList.add("visible");
    if (notesFab) notesFab.classList.add("visible");
    zoomCtrl.classList.add("visible");
  } else {
    ps.disabled = false; // enable so user can open menu from home
    $("#currentProjectName").textContent = t("homeView") || "Accueil";
    $("#currentMark").style.background = "var(--fg-faint)";
    // Bouton "Exporter tous les projets" visible uniquement sur la liste
    const quickExportBtn = $("#quickExportBtn");
    const quickExportAllBtn = $("#quickExportAllBtn");
    if (quickExportBtn) quickExportBtn.style.display = "none";
    if (quickExportAllBtn) {
      const hasAny = Object.keys(STATE.projects || {}).length > 0;
      quickExportAllBtn.style.display = "";
      quickExportAllBtn.disabled = !hasAny;
    }
    if (projectSyncBtn) projectSyncBtn.classList.remove("visible");
    legend.classList.remove("visible");
    fab.classList.remove("visible");
    if (notesFab) notesFab.classList.remove("visible");
    zoomCtrl.classList.add("visible");
  }

  nodesLayer.innerHTML = "";
  svg.innerHTML = "";
  closeDetail();
  closeEdgePopover();

  if (!proj) {
    renderProjectsOverview();
    return;
  }

  proj.nodes.forEach((n, i) => renderNodeElement(n, i));
  proj.edges.forEach((e) => renderEdge(e));
  updateAllPaths();
  fitToView();
}

/* ─── HOME OVERVIEW — projets comme nœuds ──────────────────────────── */

// Home-level edges between projects (persisted in localStorage)
const HOME_EDGES_KEY = "naanoplanner:home-edges:v1";

function loadHomeEdges() {
  try {
    const raw = localStorage.getItem(HOME_EDGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHomeEdges(edges) {
  try {
    localStorage.setItem(
      HOME_EDGES_KEY,
      JSON.stringify(
        edges.map((e) => ({ from: e.from, to: e.to, type: e.type || "solid" })),
      ),
    );
  } catch {}
}

function renderProjectsOverview() {
  const emptyState = $("#emptyState");
  const nodesLayer = $("#nodes");
  const svgLayer = $("#connections");
  const projs = Object.values(STATE.projects);

  if (projs.length === 0) {
    emptyState.style.display = "flex";
    STATE.scale = 1;
    STATE.panX = 0;
    STATE.panY = 0;
    if (typeof applyTransform === "function") applyTransform();
    return;
  }

  emptyState.style.display = "none";

  // Default grid positions for projects that have never been placed
  const COLS = Math.min(3, projs.length);
  const GAP_X = 300,
    GAP_Y = 230;

  projs.forEach((proj, i) => {
    // Use persisted homeX/homeY, fall back to grid
    if (proj.homeX === undefined || proj.homeY === undefined) {
      proj.homeX = (i % COLS) * GAP_X + 60;
      proj.homeY = Math.floor(i / COLS) * GAP_Y + 60;
    }
    const x = proj.homeX;
    const y = proj.homeY;

    const el = document.createElement("div");
    el.className = "node project-node";
    el.dataset.projectId = proj.id;
    el.dataset.id = proj.id; // needed for edge linking
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.animationDelay = i * 60 + "ms";
    el.style.setProperty("--cat-color", proj.color);

    const taskCount = proj.nodes.length;
    const doneCount = proj.nodes.filter((n) => n.status === "done").length;
    const activeCount = proj.nodes.filter((n) => n.status === "active").length;

    // Granular progress: each subtask is a unit; tasks without subtasks count as 1 unit.
    let totalUnits = 0;
    let doneUnits = 0;
    proj.nodes.forEach((n) => {
      const subs = Array.isArray(n.subtasks) ? n.subtasks : [];
      if (subs.length > 0) {
        totalUnits += subs.length;
        // If task itself is marked done, all its subtasks count as done.
        doneUnits +=
          n.status === "done" ? subs.length : subs.filter((s) => s.done).length;
      } else {
        totalUnits += 1;
        if (n.status === "done") doneUnits += 1;
      }
    });
    const progress =
      totalUnits > 0 ? Math.round((doneUnits / totalUnits) * 100) : 0;

    let statusLabel, statusColor;
    if (taskCount === 0) {
      statusLabel = t("noTasks") || "Vide";
      statusColor = "var(--fg-faint)";
    } else if (progress === 100) {
      statusLabel = t("done") || "Terminé";
      statusColor = "var(--green)";
    } else if (activeCount > 0) {
      statusLabel = t("active") || "En cours";
      statusColor = "var(--cyan)";
    } else {
      statusLabel = t("pending") || "À faire";
      statusColor = "var(--fg-faint)";
    }

    el.innerHTML = `
      <div class="node-head">
        <span class="node-status">
          <span class="status-dot" style="background:${statusColor};${activeCount > 0 ? `box-shadow:0 0 6px ${statusColor}88;animation:pulse 2s ease-in-out infinite;` : ""}"></span>
          ${escapeHtml(statusLabel)}
        </span>
        <span class="node-step" style="font-family:var(--font-mono);font-size:9.5px;color:var(--fg-faint);">
          ${taskCount} ${t("task") || "tâche"}${taskCount > 1 ? "s" : ""}
        </span>
      </div>
      <h3 class="node-title">${escapeHtml(proj.name)}</h3>
      <p class="node-desc">${escapeHtml(proj.description || t("noDescription") || "Aucune description")}</p>
      <div class="node-meta">
        <span class="node-date">
          <svg viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="0.9"/>
            <path d="M6 3.5v2.5l1.5 1.5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
          </svg>
          ${progress}%
        </span>
      </div>
      <div class="project-node-progress">
        <div class="project-node-progress-bar" style="width:${progress}%;background:${proj.color};"></div>
      </div>
      <span class="handle handle-n" data-side="n"></span>
      <span class="handle handle-e" data-side="e"></span>
      <span class="handle handle-s" data-side="s"></span>
      <span class="handle handle-w" data-side="w"></span>
      <button class="node-edit" title="${t("edit") || "Éditer"}">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M8 3l1 1-5.5 5.5-2 .5.5-2L8 3zM9.5 1.5a1 1 0 0 1 1.5 1.5l-.5.5-1.5-1.5.5-.5z"
                stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="node-trash" title="${t("delete") || "Supprimer"}">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M3 4h6m-1 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4M5 4V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4"
                stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>`;

    // Draggable with homeX/homeY persistence
    const pos = { id: proj.id, x, y };
    let startX,
      startY,
      originX,
      originY,
      dragging = false,
      moved = false;
    el.addEventListener("pointerdown", (e) => {
      if (
        e.target.closest(".handle") ||
        e.target.closest(".node-edit") ||
        e.target.closest(".node-trash") ||
        e.target.closest(".project-open-btn")
      )
        return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      originX = pos.x;
      originY = pos.y;
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / STATE.scale;
      const dy = (e.clientY - startY) / STATE.scale;
      // Higher threshold for pen/touch — a stylus tip wobbles 3-5 px on
      // a normal "click", which used to false-trigger the drag suppressor
      // and silently eat the next click on the trash / edit buttons.
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
      pos.x = originX + dx;
      pos.y = originY + dy;
      el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      // Update home edges paths with temporary position
      updateHomeEdgesForProject(proj.id, pos.x, pos.y);
    });
    el.addEventListener("pointerup", (e) => {
      dragging = false;
      el.classList.remove("dragging");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
      if (moved) {
        // Persist new home position
        proj.homeX = pos.x;
        proj.homeY = pos.y;
        saveProjects();
        el.addEventListener(
          "click",
          (ev) => {
            // Critical: never swallow clicks targeted at action buttons.
            // Without this guard, a tiny drag wobble blocks the very next
            // trash / edit click — the user has to click the project body
            // first to "consume" this suppressor.
            if (
              ev.target.closest(".node-trash") ||
              ev.target.closest(".node-edit") ||
              ev.target.closest(".project-open-btn")
            ) {
              return;
            }
            ev.stopPropagation();
            ev.preventDefault();
          },
          { once: true, capture: true },
        );
      }
    });
    el.addEventListener("pointercancel", (e) => {
      // OS hijack (palm rejection, scroll heuristics) — release cleanly.
      dragging = false;
      el.classList.remove("dragging");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (_) {}
    });

    // Handle linking between projects
    el.querySelectorAll(".handle").forEach((h) => {
      h.addEventListener("pointerdown", (e) =>
        startHomeLinking(e, proj, h.dataset.side),
      );
    });

    // Click card → open project
    el.addEventListener("click", (e) => {
      if (e.target.closest(".node-trash") || e.target.closest(".handle"))
        return;
      switchProject(proj.id);
    });

    // Add click event for edit button
    const editBtn = el.querySelector(".node-edit");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openProjectEditModal(proj);
      });
    }

    // Add click event for trash button
    const trashBtn = el.querySelector(".node-trash");
    if (trashBtn) {
      trashBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openConfirmModal(
          t("confirmDeleteProject") || "Supprimer le projet",
          (t("confirmDeleteMessage") ||
            "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.") +
            `\n\n"${proj.name}"`,
          t("delete") || "Supprimer",
          t("cancel") || "Annuler",
          () => deleteProject(proj.id),
        );
      });
    }

    nodesLayer.appendChild(el);
  });

  // Render persisted home edges
  const homeEdges = loadHomeEdges().filter(
    (e) => STATE.projects[e.from] && STATE.projects[e.to],
  );
  homeEdges.forEach((edge) => renderHomeEdge(edge));

  // Fit view
  const xs = projs.map((p) => p.homeX);
  const ys = projs.map((p) => p.homeY);
  const canvas = $("#canvas");
  const minX = Math.min(...xs),
    maxX = Math.max(...xs) + 260;
  const minY = Math.min(...ys),
    maxY = Math.max(...ys) + 160;
  const W = canvas.clientWidth,
    H = canvas.clientHeight;
  const margin = 80;
  const sx = (W - margin * 2) / (maxX - minX || 1);
  const sy = (H - margin * 2) / (maxY - minY || 1);
  STATE.scale = Math.min(1, Math.min(sx, sy));
  STATE.panX = -minX * STATE.scale + (W - (maxX - minX) * STATE.scale) / 2;
  STATE.panY = -minY * STATE.scale + (H - (maxY - minY) * STATE.scale) / 2;
  if (typeof applyTransform === "function") applyTransform();
}

/* ─── HOME EDGES (liaisons entre projets) ───────────────────────────── */
function homeNodeAnchor(projId, tempX, tempY) {
  const el = $("#nodes").querySelector(
    `.project-node[data-project-id="${projId}"]`,
  );
  if (!el) return null;
  const proj = STATE.projects[projId];
  const w = 260,
    h = el.offsetHeight || 140;

  // Use temporary positions if provided, otherwise use saved positions
  // If no saved position yet (new project), use 0 as fallback
  const x = tempX !== undefined ? tempX : proj?.homeX || 0;
  const y = tempY !== undefined ? tempY : proj?.homeY || 0;

  return {
    cx: x + w / 2,
    cy: y + h / 2,
    rx: w / 2,
    ry: h / 2,
  };
}

function homeEdgePoint(box, dx, dy) {
  const { cx, cy, rx, ry } = box;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const t = Math.min(rx / Math.abs(dx), ry / Math.abs(dy));
  return { x: cx + dx * t, y: cy + dy * t };
}

function homePathFor(fromId, toId, tempFromX, tempFromY, tempToX, tempToY) {
  const A = homeNodeAnchor(fromId, tempFromX, tempFromY);
  const B = homeNodeAnchor(toId, tempToX, tempToY);
  if (!A || !B) return "";
  const dx = B.cx - A.cx,
    dy = B.cy - A.cy;
  const p1 = homeEdgePoint(A, dx, dy);
  const p2 = homeEdgePoint(B, -dx, -dy);
  const dist = Math.hypot(dx, dy);
  const handle = Math.min(160, Math.max(40, dist * 0.4));
  const horizontal = Math.abs(dx) > Math.abs(dy);
  let c1x, c1y, c2x, c2y;
  if (horizontal) {
    c1x = p1.x + Math.sign(dx) * handle;
    c1y = p1.y;
    c2x = p2.x - Math.sign(dx) * handle;
    c2y = p2.y;
  } else {
    c1x = p1.x;
    c1y = p1.y + Math.sign(dy) * handle;
    c2x = p2.x;
    c2y = p2.y - Math.sign(dy) * handle;
  }
  return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
}

// Helper function to update all edges connected to a project during drag
function updateHomeEdgesForProject(projId, tempX, tempY) {
  const svgLayer = $("#connections");
  svgLayer.querySelectorAll("path[data-from], path[data-to]").forEach((p) => {
    if (p.dataset.from === projId || p.dataset.to === projId) {
      // Get both projects
      const fromProj = STATE.projects[p.dataset.from];
      const toProj = STATE.projects[p.dataset.to];

      // Use temporary position for the dragged project, saved position for the other
      const fromX = p.dataset.from === projId ? tempX : fromProj?.homeX || 0;
      const fromY = p.dataset.from === projId ? tempY : fromProj?.homeY || 0;
      const toX = p.dataset.to === projId ? tempX : toProj?.homeX || 0;
      const toY = p.dataset.to === projId ? tempY : toProj?.homeY || 0;

      p.setAttribute(
        "d",
        homePathFor(p.dataset.from, p.dataset.to, fromX, fromY, toX, toY),
      );

      // If this edge is currently selected, reposition the popover
      if (
        STATE.selectedEdge &&
        STATE.selectedEdge._path === p &&
        typeof positionEdgePopover === "function"
      ) {
        positionEdgePopover(STATE.selectedEdge);
      }
    }
  });
}

function renderHomeEdge(edge) {
  const svg = $("#connections");
  const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
  hit.classList.add("connection-hit");
  hit.dataset.from = edge.from;
  hit.dataset.to = edge.to;
  hit.dataset.homeEdge = "1";
  svg.appendChild(hit);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("connection-path");
  path.dataset.from = edge.from;
  path.dataset.to = edge.to;
  path.dataset.homeEdge = "1";
  path.dataset.type = edge.type || "solid";
  if (typeof applyEdgeStyle === "function")
    applyEdgeStyle(path, edge.type || "solid");
  svg.appendChild(path);

  edge._hit = hit;
  edge._path = path;
  hit.setAttribute("d", homePathFor(edge.from, edge.to));
  path.setAttribute("d", homePathFor(edge.from, edge.to));

  hit.addEventListener("click", (e) => {
    e.stopPropagation();
    selectHomeEdge(edge);
  });
}

function selectHomeEdge(edge) {
  const edgePopover = $("#edgePopover");
  $$(".connection-path.selected").forEach((p) =>
    p.classList.remove("selected"),
  );
  $$(".node.selected").forEach((n) => n.classList.remove("selected"));
  STATE.selectedEdge = edge;
  STATE.selectedNodeId = null;
  if (edge._path) edge._path.classList.add("selected");
  edgePopover.querySelectorAll(".edge-popover-btn[data-type]").forEach((b) => {
    b.classList.toggle("active", b.dataset.type === edge.type);
  });
  positionEdgePopover(edge);
  edgePopover.classList.add("open");
}

function deleteHomeEdge(edge) {
  const edges = loadHomeEdges();
  const idx = edges.findIndex(
    (ed) => ed.from === edge.from && ed.to === edge.to,
  );
  if (idx !== -1) {
    edges.splice(idx, 1);
    saveHomeEdges(edges);
    if (edge._path) edge._path.remove();
    if (edge._hit) edge._hit.remove();
    closeEdgePopover();
  }
}

function updateHomeEdgeType(edge, type) {
  const edges = loadHomeEdges();
  const idx = edges.findIndex(
    (ed) => ed.from === edge.from && ed.to === edge.to,
  );
  if (idx !== -1) {
    edges[idx].type = type;
    saveHomeEdges(edges);
    edge.type = type;
    if (edge._path) {
      edge._path.dataset.type = type;
      applyEdgeStyle(edge._path, type);
    }
  }
}

function startHomeLinking(e, fromProj, side) {
  const canvas = $("#canvas");
  const svg = $("#connections");
  e.stopPropagation();
  e.preventDefault();
  const ghost = document.createElementNS("http://www.w3.org/2000/svg", "path");
  ghost.classList.add("ghost-path");
  svg.appendChild(ghost);
  document.body.classList.add("linking-active");
  e.target.classList.add("hot");

  function getHandlePos(proj, side) {
    const w = 260;
    const el = $("#nodes").querySelector(
      `.project-node[data-project-id="${proj.id}"]`,
    );
    const h = el?.offsetHeight || 140;
    switch (side) {
      case "n":
        return { x: proj.homeX + w / 2, y: proj.homeY };
      case "s":
        return { x: proj.homeX + w / 2, y: proj.homeY + h };
      case "w":
        return { x: proj.homeX, y: proj.homeY + h / 2 };
      case "e":
        return { x: proj.homeX + w, y: proj.homeY + h / 2 };
    }
  }

  const onMove = (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rect.left - STATE.panX) / STATE.scale;
    const my = (ev.clientY - rect.top - STATE.panY) / STATE.scale;
    const start = getHandlePos(fromProj, side);
    const dx = mx - start.x,
      dy = my - start.y;
    const dist = Math.hypot(dx, dy);
    const hl = Math.min(160, Math.max(40, dist * 0.4));
    const horiz = side === "e" || side === "w";
    let c1x, c1y, c2x, c2y;
    if (horiz) {
      const sign = side === "e" ? 1 : -1;
      c1x = start.x + sign * hl;
      c1y = start.y;
      c2x = mx - sign * Math.min(hl, Math.abs(dx) * 0.5);
      c2y = my;
    } else {
      const sign = side === "s" ? 1 : -1;
      c1x = start.x;
      c1y = start.y + sign * hl;
      c2x = mx;
      c2y = my - sign * Math.min(hl, Math.abs(dy) * 0.5);
    }
    ghost.setAttribute(
      "d",
      `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${mx} ${my}`,
    );
    $$(".project-node.drop-target").forEach((n) =>
      n.classList.remove("drop-target"),
    );
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const targetEl = elUnder?.closest(".project-node");
    if (targetEl && targetEl.dataset.projectId !== fromProj.id)
      targetEl.classList.add("drop-target");
  };

  const onUp = (ev) => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.body.classList.remove("linking-active");
    e.target.classList.remove("hot");
    ghost.remove();
    $$(".project-node.drop-target").forEach((n) =>
      n.classList.remove("drop-target"),
    );
    const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
    const targetEl = elUnder?.closest(".project-node");
    if (targetEl && targetEl.dataset.projectId !== fromProj.id) {
      const toId = targetEl.dataset.projectId;
      const edges = loadHomeEdges();
      if (!edges.find((ed) => ed.from === fromProj.id && ed.to === toId)) {
        const newEdge = { from: fromProj.id, to: toId, type: "solid" };
        edges.push(newEdge);
        saveHomeEdges(edges);
        renderHomeEdge(newEdge);
        setTimeout(() => selectHomeEdge(newEdge), 50);
      }
    }
  };
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

/* ─── IMPORT PROJECT FROM JSON ──────────────────────────────────────── */
function importProjectFromJSON(jsonData) {
  try {
    const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    // Support both export formats: {name, tasks, edges} and {name, nodes, edges}
    const tasks = data.tasks || data.nodes || [];
    const edges = data.edges || [];
    const notes = data.notes || [];

    if (!data.name) throw new Error("JSON invalide : champ 'name' manquant");

    const proj = createProject({
      name: data.name,
      description: data.description || "",
      model: data.model || "?",
      provider: data.provider || STATE.selectedProvider,
      tasks,
      edges,
      notes,
    });

    // Restore original color if present
    if (data.color) {
      proj.color = data.color;
      saveProjects();
      renderProjectMenu();
      renderCurrentProject();
    }

    showToast(
      `${t("projectCreated") || "Projet"} « ${data.name} » ${t("imported") || "importé"}`,
    );
    return proj;
  } catch (err) {
    showToast(
      (t("importError") || "Erreur d'import") + " : " + err.message,
      "error",
    );
    return null;
  }
}

function initImportProject() {
  const importInput = $("#importFileInput");
  if (!importInput) return;

  // L'événement click est géré par quick-settings.js

  importInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importProjectFromJSON(ev.target.result);
      // Reset so the same file can be re-imported
      importInput.value = "";
    };
    reader.readAsText(file);
  });
}

/* ─── PROJECT EDIT MODAL ───────────────────────────────────────────── */
function openProjectEditModal(project) {
  if (!project) return;

  // Set title
  $("#projectEditTitle").textContent = project.name || "Projet";

  // Clear and rebuild the edit body with Jira-like fields
  const editBody = $("#projectEditBody");
  editBody.innerHTML = "";

  // Store current project ID for saving
  $("#projectEditPanel").dataset.projectId = project.id;

  // Create name field
  const nameField = createEditableField({
    label: t("projectName") || "Nom du projet",
    value: project.name || "",
    field: "name",
    type: "text",
    placeholder: t("projectNamePlaceholder") || "Ex. Lancer mon SaaS...",
  });

  nameField.onSave = (newValue) => {
    const projectId = $("#projectEditPanel").dataset.projectId;
    if (!projectId || !STATE.projects[projectId]) return;

    if (!newValue.trim()) {
      showToast(t("toastGiveName") || "Donne un nom à ton projet", "error");
      return;
    }

    STATE.projects[projectId].name = newValue.trim();
    saveProjects();
    renderProjectMenu();
    renderCurrentProject();
    $("#projectEditTitle").textContent = newValue.trim();
    showToast(t("toastSaved") || "Paramètres enregistrés");
  };

  editBody.appendChild(nameField);

  // Create description field
  const descField = createEditableField({
    label: t("descriptionOptional") || "Description (optionnelle)",
    value: project.description || "",
    field: "description",
    type: "textarea",
    placeholder:
      t("descriptionPlaceholder") ||
      "Précise le contexte, les contraintes ou l'audience visée…",
  });

  descField.onSave = (newValue) => {
    const projectId = $("#projectEditPanel").dataset.projectId;
    if (!projectId || !STATE.projects[projectId]) return;

    STATE.projects[projectId].description = newValue.trim();
    saveProjects();
    renderCurrentProject();
    showToast(t("toastSaved") || "Paramètres enregistrés");
  };

  editBody.appendChild(descField);

  // ── Statut (manuel — auto-forcé à "completed" si pourcentage = 100) ───
  const statusField = createEditableField({
    label: t("status") || "Statut",
    value: project.status || "pending",
    field: "status",
    type: "select",
    options: [
      { value: "pending", label: t("statusPending") || "En cours" },
      { value: "completed", label: t("statusCompleted") || "Terminé" },
    ],
  });
  statusField.onSave = (newValue) => {
    const projectId = $("#projectEditPanel").dataset.projectId;
    if (!projectId || !STATE.projects[projectId]) return;
    STATE.projects[projectId].status =
      newValue === "completed" ? "completed" : "pending";
    saveProjects();
    renderProjectMenu();
    renderCurrentProject();
    // Refresh percentage display
    updateProjectMetricsDisplay(STATE.projects[projectId]);
    showToast(t("toastSaved") || "Paramètres enregistrés");
  };
  editBody.appendChild(statusField);

  // ── Dates ─────────────────────────────────────────────────────────────
  const startDateField = createEditableField({
    label: t("startDate") || "Date de début",
    value: project.startDate || "",
    field: "startDate",
    type: "date",
    placeholder: t("notDefined") || "—",
  });
  startDateField.onSave = (newValue) => {
    const projectId = $("#projectEditPanel").dataset.projectId;
    if (!projectId || !STATE.projects[projectId]) return;
    STATE.projects[projectId].startDate = newValue || null;
    saveProjects();
    showToast(t("toastSaved") || "Paramètres enregistrés");
  };
  editBody.appendChild(startDateField);

  const endDateField = createEditableField({
    label: t("endDate") || "Date de fin",
    value: project.endDate || "",
    field: "endDate",
    type: "date",
    placeholder: t("notDefined") || "—",
  });
  endDateField.onSave = (newValue) => {
    const projectId = $("#projectEditPanel").dataset.projectId;
    if (!projectId || !STATE.projects[projectId]) return;
    STATE.projects[projectId].endDate = newValue || null;
    saveProjects();
    showToast(t("toastSaved") || "Paramètres enregistrés");
  };
  editBody.appendChild(endDateField);

  // Create read-only info section (incl. percentage)
  const pct = computeProjectPercentage(project);
  const infoSection = document.createElement("div");
  infoSection.className = "detail-section";
  infoSection.innerHTML = `
    <h3 class="detail-section-title">${t("informations") || "Informations"}</h3>
    <div class="project-progress" id="projectProgressBar">
      <div class="project-progress-head">
        <span class="project-progress-label">${t("completion") || "Avancement"}</span>
        <span class="project-progress-value" id="projectEditPercentage">${pct}%</span>
      </div>
      <div class="project-progress-track">
        <div class="project-progress-fill" id="projectEditPercentageFill" style="width:${pct}%"></div>
      </div>
    </div>
    <div class="detail-info-grid">
      <div class="detail-info-item">
        <span class="detail-info-label">${t("providerLabel") || "Fournisseur"}</span>
        <span class="detail-info-value" id="projectEditProvider">${project.provider || "-"}</span>
      </div>
      <div class="detail-info-item">
        <span class="detail-info-label">${t("modelId") || "Modèle"}</span>
        <span class="detail-info-value" id="projectEditModelDisplay">${project.model || "-"}</span>
      </div>
      <div class="detail-info-item">
        <span class="detail-info-label">${t("tasks") || "Tâches"}</span>
        <span class="detail-info-value" id="projectEditTaskCount">${project.nodes?.length || 0}</span>
      </div>
      <div class="detail-info-item">
        <span class="detail-info-label">${t("connections") || "Liens"}</span>
        <span class="detail-info-value" id="projectEditEdgeCount">${project.edges?.length || 0}</span>
      </div>
    </div>
  `;

  editBody.appendChild(infoSection);

  // Open the panel
  $("#projectEditPanel").classList.add("open");
  $("#projectEditPanel").setAttribute("aria-hidden", "false");

  // Close detail panel if open
  if (typeof window.closeDetail === "function") {
    window.closeDetail();
  }
}

function closeProjectEditModal() {
  $("#projectEditPanel").classList.remove("open");
  $("#projectEditPanel").setAttribute("aria-hidden", "true");
  delete $("#projectEditPanel").dataset.projectId;
}

function initProjectEditModal() {
  // Close button
  $("#projectEditClose").addEventListener("click", closeProjectEditModal);

  // Close on backdrop click
  $("#projectEditPanel").addEventListener("click", (e) => {
    if (e.target === $("#projectEditPanel")) {
      closeProjectEditModal();
    }
  });
}

/**
 * Met à jour la barre de progression et le pourcentage affichés
 * dans le panneau d'édition projet (sans tout reconstruire).
 */
function updateProjectMetricsDisplay(project) {
  if (!project) return;
  recomputeProjectMetrics(project);
  const pctEl = $("#projectEditPercentage");
  const fillEl = $("#projectEditPercentageFill");
  if (pctEl) pctEl.textContent = `${project.percentage}%`;
  if (fillEl) fillEl.style.width = `${project.percentage}%`;
}
window.updateProjectMetricsDisplay = updateProjectMetricsDisplay;
window.computeProjectPercentage = computeProjectPercentage;
window.recomputeProjectMetrics = recomputeProjectMetrics;
window.recomputeAllProjectMetrics = recomputeAllProjectMetrics;
