/* ─── PROVIDER SELECTOR (bottom bar) ────────────────────────────────── */
function renderProviderMenu() {
  const menu = $("#modelMenu");
  menu.innerHTML = "";
  Object.entries(PROVIDERS).forEach(([key, prov]) => {
    const cred = STATE.credentials[key];
    const ok = !!(cred?.apiKey && cred?.model);
    const btn = document.createElement("button");
    btn.className =
      "model-option" +
      (key === STATE.selectedProvider ? " current" : "") +
      (ok ? "" : " disabled");
    btn.dataset.provider = key;
    btn.innerHTML = `
      <span class="model-option-mark" style="background: ${prov.color};"></span>
      <div style="flex:1;min-width:0;">
        <div class="model-option-name">${escapeHtml(prov.name.split(" — ")[0])}${ok ? "" : `<span class="config-badge">${t("notConfigured")}</span>`}</div>
        <div class="model-option-meta" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ok ? escapeHtml(cred.model) : t("notConfigured")}</div>
      </div>`;
    btn.addEventListener("click", () => {
      if (!ok) {
        $("#modelMenu").classList.remove("open");
        openSettings();
        return;
      }
      STATE.selectedProvider = key;
      updateProviderBtn();
      renderProviderMenu();
      $("#modelMenu").classList.remove("open");
      showToast(
        `${t("providerLabel")} ${prov.name.split(" — ")[0]} · ${cred.model}`,
      );
    });
    menu.appendChild(btn);
  });
  const div = document.createElement("div");
  div.className = "divider";
  div.style.cssText = "height:1px;background:var(--border);margin:4px 2px;";
  menu.appendChild(div);
  const cfg = document.createElement("button");
  cfg.className = "model-option";
  cfg.style.color = "var(--pink)";
  cfg.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;">
      <circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
    </svg>
    <span class="model-option-name" style="color:var(--pink);">${t("configureSettings")}</span>`;
  cfg.addEventListener("click", () => {
    $("#modelMenu").classList.remove("open");
    openSettings();
  });
  menu.appendChild(cfg);
}

function updateProviderBtn() {
  const key = STATE.selectedProvider;
  const prov = PROVIDERS[key];
  const cred = STATE.credentials[key];
  if (cred?.model && prov) {
    $("#modelBtnLabel").textContent =
      `${prov.name.split(" — ")[0]} · ${cred.model}`;
    $("#modelBtn .model-mark").style.background = prov.color;
  } else {
    const configured = configuredProviders();
    if (configured.length > 0) {
      STATE.selectedProvider = configured[0];
      updateProviderBtn();
    } else {
      $("#modelBtnLabel").textContent = t("noProvider");
      $("#modelBtn .model-mark").style.background = "var(--fg-faint)";
    }
  }
}

/* ─── ZOOM & PAN ────────────────────────────────────────────────────── */
function applyTransform() {
  const world = $("#world");
  world.style.transform = `translate(${STATE.panX}px, ${STATE.panY}px) scale(${STATE.scale})`;
  $("#zoomLevel").textContent = Math.round(STATE.scale * 100) + "%";
  if (STATE.selectedEdge) positionEdgePopover(STATE.selectedEdge);
}

function fitToView() {
  const proj = getCurrentProject();
  const canvas = $("#canvas");
  if (!proj || proj.nodes.length === 0) {
    STATE.scale = 1;
    STATE.panX = 0;
    STATE.panY = 0;
    applyTransform();
    return;
  }
  const xs = proj.nodes.map((n) => n.x);
  const ys = proj.nodes.map((n) => n.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs) + 232;
  const minY = Math.min(...ys),
    maxY = Math.max(...ys) + 132;
  const W = canvas.clientWidth,
    H = canvas.clientHeight;
  const margin = 80;
  const sx = (W - margin * 2) / (maxX - minX);
  const sy = (H - margin * 2) / (maxY - minY);
  STATE.scale = Math.min(1, Math.min(sx, sy));
  STATE.panX = -minX * STATE.scale + (W - (maxX - minX) * STATE.scale) / 2;
  STATE.panY = -minY * STATE.scale + (H - (maxY - minY) * STATE.scale) / 2;
  applyTransform();
}

/* ─── PROMPT DOCK ───────────────────────────────────────────────────── */
function initPromptDock() {
  const promptInput = $("#promptInput");
  const promptSend = $("#promptSend");

  $$(".suggest").forEach((btn) => {
    btn.addEventListener("click", () => {
      promptInput.value = btn.textContent;
      promptInput.focus();
    });
  });

  async function submitPromptDock() {
    const objective = promptInput.value.trim();
    if (!objective) return;
    if (configuredProviders().length === 0) {
      showToast(t("toastConfigureFirst"), "error");
      openSettings();
      return;
    }
    const providerKey = isProviderConfigured(STATE.selectedProvider)
      ? STATE.selectedProvider
      : configuredProviders()[0];
    const name = objective.split("\n")[0].slice(0, 60);
    promptSend.disabled = true;
    const oldHtml = promptSend.innerHTML;
    promptSend.innerHTML = t("generating");

    // Show loading modal
    const provider = PROVIDERS[providerKey];
    showPromptLoading(
      t("generatingRoadmap"),
      `${provider.name} ${t("decomposing")}`,
    );

    try {
      const result = await callLLMForProject({
        projectName: name,
        description: "",
        objective,
        providerKey,
      });
      promptInput.value = "";
      hidePromptLoading();
      openPreview({
        ...result,
        name,
        description: "",
        model: result.model,
        provider: providerKey,
      });
    } catch (err) {
      console.error(err);
      hidePromptLoading();
      showToast(err.message || t("toastError"), "error");
    } finally {
      promptSend.disabled = false;
      promptSend.innerHTML = oldHtml;
    }
  }

  promptSend.addEventListener("click", submitPromptDock);

  // Make provider button open settings directly if no provider is configured
  $("#modelBtn").addEventListener("click", (e) => {
    if (configuredProviders().length === 0) {
      e.stopPropagation();
      showToast(t("toastConfigureFirst"), "error");
      openSettings();
      return;
    }
    // Otherwise let the original handler (in initProjectMenu) handle it
  });
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitPromptDock();
    }
  });
}

/* ─── EXPORT JSON ───────────────────────────────────────────────────── */
function _projectToExportPayload(proj) {
  // CRITICAL: Always recompute metrics before serialization. The cached
  // proj.percentage / proj.status values may be stale (the edit modal
  // computes percentage live for display without mutating the project,
  // and not every code path that mutates tasks calls saveProjects).
  // Recomputing here guarantees the exported JSON reflects reality.
  if (typeof recomputeProjectMetrics === "function") {
    recomputeProjectMetrics(proj);
  }
  const pct =
    typeof computeProjectPercentage === "function"
      ? computeProjectPercentage(proj)
      : typeof proj.percentage === "number"
        ? proj.percentage
        : 0;
  // Auto-complete status when fully done (mirrors recomputeProjectMetrics)
  const status =
    pct === 100
      ? "completed"
      : proj.status === "completed"
        ? "completed"
        : "pending";

  return {
    // Project metadata
    name: proj.name,
    description: proj.description,
    model: proj.model,
    provider: proj.provider,
    color: proj.color,
    // Lifecycle (always freshly computed — never trust the cache here)
    status,
    percentage: pct,
    startDate: proj.startDate || null,
    endDate: proj.endDate || null,
    createdAt: proj.createdAt || null,
    updatedAt: proj.updatedAt || null,
    // Tasks (with all nested content: subtasks, events, prerequisites, resources)
    tasks: proj.nodes.map(
      ({
        id,
        title,
        description,
        category,
        status,
        startDate,
        endDate,
        prerequisites,
        resources,
        events,
        subtasks,
        x,
        y,
      }) => ({
        id,
        title,
        description,
        category,
        status,
        startDate,
        endDate,
        prerequisites: prerequisites || [],
        resources: resources || [],
        events: (events || []).map((ev) => ({
          name: ev.name || "",
          type: ev.type === "handwritten" ? "handwritten" : "text",
          description: ev.description || "",
          canvasData: ev.canvasData || "",
        })),
        subtasks: (subtasks || []).map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          estimatedDays: s.estimatedDays || 0,
          done: !!s.done,
        })),
        x,
        y,
      }),
    ),
    // Edges (task dependencies)
    edges: proj.edges.map(({ from, to, type }) => ({ from, to, type })),
    // Project-level notes (multi-sheet notebook)
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
}

function exportProject() {
  const proj = getCurrentProject();
  if (!proj) return false;
  const exportData = {
    ..._projectToExportPayload(proj),
    // Export format version
    exportVersion: 3,
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${proj.name.toLowerCase().replace(/\s+/g, "-")}-roadmap.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t("toastExported"));
  return true;
}

/**
 * Exporte TOUS les projets locaux dans un seul fichier JSON.
 * Format : { exportVersion, exportedAt, projects: [...] }
 */
function exportAllProjects() {
  const projects = Object.values(STATE.projects || {});
  if (projects.length === 0) {
    showToast(t("cloudNoLocalProjects") || "Aucun projet à exporter", "error");
    return false;
  }
  const exportData = {
    exportVersion: 3,
    exportedAt: new Date().toISOString(),
    projects: projects.map(_projectToExportPayload),
  };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `naanoplanner-all-projects-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t("toastExported"));
  return true;
}

function initExport() {
  // La fonction d'export est maintenant gérée par exportProject() / exportAllProjects()
  // et appelée depuis quick-settings.js
}

// Exposer globalement
window.exportProject = exportProject;
window.exportAllProjects = exportAllProjects;

/* ─── KEYBOARD ──────────────────────────────────────────────────────── */
function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    const ae = document.activeElement;
    if (
      ae &&
      (ae.tagName === "INPUT" ||
        ae.tagName === "TEXTAREA" ||
        ae.tagName === "SELECT")
    ) {
      if (e.key === "Escape") ae.blur();
      return;
    }
    const modalOpen = document.querySelector(".modal-backdrop.open");
    if (modalOpen) {
      if (e.key === "Escape") modalOpen.classList.remove("open");
      return;
    }
    if (e.key === "Escape") {
      closeDetail();
      closeEdgePopover();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      if (STATE.selectedEdge) {
        e.preventDefault();
        deleteEdge(STATE.selectedEdge);
      } else if (STATE.selectedNodeId) {
        e.preventDefault();
        deleteNode(STATE.selectedNodeId);
      }
    }
    if (e.key.toLowerCase() === "n" && getCurrentProject()) {
      $("#addNodeFab").click();
    }
  });
}

/* ─── CANVAS INTERACTIONS ───────────────────────────────────────────── */
function initCanvasInteractions() {
  const canvas = $("#canvas");
  const world = $("#world");
  const svg = $("#connections");

  canvas.addEventListener("click", (e) => {
    if (e.target === canvas || e.target === world || e.target === svg)
      closeEdgePopover();
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.002;
        const newScale = Math.max(0.3, Math.min(2, STATE.scale * (1 + delta)));
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left,
          my = e.clientY - rect.top;
        const wx = (mx - STATE.panX) / STATE.scale;
        const wy = (my - STATE.panY) / STATE.scale;
        STATE.scale = newScale;
        STATE.panX = mx - wx * STATE.scale;
        STATE.panY = my - wy * STATE.scale;
        applyTransform();
      } else {
        STATE.panX -= e.deltaX;
        STATE.panY -= e.deltaY;
        applyTransform();
      }
    },
    { passive: false },
  );

  let panDragging = false,
    panStart;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target !== canvas && e.target !== world && e.target !== svg) return;
    panDragging = true;
    panStart = { x: e.clientX - STATE.panX, y: e.clientY - STATE.panY };
    canvas.style.cursor = "grabbing";
    closeEdgePopover();
  });
  window.addEventListener("pointermove", (e) => {
    if (!panDragging) return;
    STATE.panX = e.clientX - panStart.x;
    STATE.panY = e.clientY - panStart.y;
    applyTransform();
  });
  window.addEventListener("pointerup", () => {
    panDragging = false;
    canvas.style.cursor = "";
  });

  $("#addNodeFab").addEventListener("click", () => {
    const proj = getCurrentProject();
    if (!proj) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2,
      cy = rect.height / 2;
    addNodeAt((cx - STATE.panX) / STATE.scale, (cy - STATE.panY) / STATE.scale);
  });

  $("#zoomIn").addEventListener("click", () => {
    STATE.scale = Math.min(2, STATE.scale * 1.15);
    applyTransform();
  });
  $("#zoomOut").addEventListener("click", () => {
    STATE.scale = Math.max(0.3, STATE.scale / 1.15);
    applyTransform();
  });
  $("#zoomReset").addEventListener("click", fitToView);

  window.addEventListener("resize", () => updateAllPaths());
}

/* ─── PARALLAX BACKGROUND ───────────────────────────────────────────── */
function initParallax() {
  window.addEventListener("pointermove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 12;
    const y = (e.clientY / window.innerHeight - 0.5) * 12;
    $("#stars").style.transform = `translate(${x}px, ${y}px)`;
  });
}

/* ─── PROJECT SWITCH MENU ───────────────────────────────────────────── */
function initProjectMenu() {
  const projectMenu = $("#projectMenu");
  $("#projectSwitch").addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.currentTarget.disabled) return;
    projectMenu.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest("#projectMenu") &&
      !e.target.closest("#projectSwitch")
    ) {
      projectMenu.classList.remove("open");
    }
    if (!e.target.closest("#modelMenu") && !e.target.closest("#modelBtn")) {
      $("#modelMenu").classList.remove("open");
    }
  });
  $("#modelBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    renderProviderMenu();
    $("#modelMenu").classList.toggle("open");
  });
}

/* ─── DETAIL PANEL BUTTONS ──────────────────────────────────────────── */
function initDetailPanel() {
  $("#detailClose").addEventListener("click", closeDetail);
  $("#detailDelete").addEventListener("click", () => {
    if (STATE.selectedNodeId) deleteNode(STATE.selectedNodeId);
  });
}

/* ─── INIT ──────────────────────────────────────────────────────────── */
(async function init() {
  // Load credentials
  STATE.credentials = await loadCredentials();
  const configured = configuredProviders();
  if (configured.length > 0) STATE.selectedProvider = configured[0];

  // Restore persisted projects
  loadProjects();

  // Load AI state
  loadAIState();

  // Update AI pill display
  updateAIPill();

  // Init language
  initLangSwitcher();

  // Init all modules
  initModals();
  initEdgePopover();
  initNewProjectModal();
  initPreviewModal();
  initReexploreModal();
  initSettingsModal();
  initProjectMenu();
  initDetailPanel();
  initProjectEditModal();
  initCanvasInteractions();
  initKeyboard();
  initPromptDock();
  initExport();
  initImportProject();
  initQuickSettings();
  initCloudSync();
  initParallax();
  initNotes();

  if (!isElectronRuntime()) {
    const settingsBackdrop = $("#settingsBackdrop");
    if (settingsBackdrop) {
      settingsBackdrop.classList.remove("open");
      settingsBackdrop.style.display = "none";
      settingsBackdrop.setAttribute("aria-hidden", "true");
    }
  }

  // Provider UI
  updateProviderBtn();
  renderProviderMenu();
  $("#quickSettingsBtn").classList.toggle(
    "has-warning",
    configured.length === 0,
  );

  // Render initial state (home overview or last open project)
  renderProjectMenu();
  renderCurrentProject();

  // Show hints briefly
  const hints = $("#hints");
  setTimeout(() => hints.classList.add("visible"), 800);
  setTimeout(() => hints.classList.remove("visible"), 7500);
})();
