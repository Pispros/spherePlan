/* ─── MODAL HELPERS ─────────────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

function initModals() {
  $$("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () =>
      closeModal(btn.dataset.close + "Backdrop"),
    );
  });
  $$(".modal-backdrop").forEach((bd) => {
    bd.addEventListener("click", (e) => {
      if (e.target === bd) bd.classList.remove("open");
    });
  });

  initConfirmModal();
}

/* ─── CONFIRMATION MODAL ────────────────────────────────────────────── */
let confirmCallback = null;

function openConfirmModal(title, message, confirmText, cancelText, onConfirm) {
  $("#confirmTitle").textContent = title;
  $("#confirmMessage").textContent = message;
  $("#confirmConfirmBtn").textContent = confirmText;
  $("#confirmCancelBtn").textContent = cancelText;
  confirmCallback = onConfirm;
  openModal("confirmBackdrop");
}

function initConfirmModal() {
  $("#confirmConfirmBtn").addEventListener("click", () => {
    if (confirmCallback) {
      confirmCallback();
      confirmCallback = null;
    }
    closeModal("confirmBackdrop");
  });

  $("#confirmCancelBtn").addEventListener("click", () => {
    confirmCallback = null;
    closeModal("confirmBackdrop");
  });

  $("#confirmBackdrop").addEventListener("click", (e) => {
    if (e.target === $("#confirmBackdrop")) {
      confirmCallback = null;
      closeModal("confirmBackdrop");
    }
  });
}

/* ─── NEW PROJECT MODAL ─────────────────────────────────────────────── */
function openNewProjectModal() {
  $("#npName").value = "";
  $("#npDescription").value = "";
  $("#npObjective").value = "";
  renderNewProjectChips();
  // Show/hide AI section depending on whether any provider is configured
  _syncNewProjectModalMode();
  openModal("newProjectBackdrop");
  setTimeout(() => $("#npName").focus(), 100);
}

function _syncNewProjectModalMode() {
  const hasProvider = configuredProviders().length > 0;
  const aiSection = $("#npAiSection");
  const manualBtn = $("#npCreateManual");
  const generateBtn = $("#npGenerate");
  const noProviderHint = $("#npNoProviderHint");

  if (aiSection) aiSection.style.display = hasProvider ? "" : "none";
  if (generateBtn) generateBtn.style.display = hasProvider ? "" : "none";
  if (manualBtn) manualBtn.style.display = "";
  if (noProviderHint) noProviderHint.style.display = hasProvider ? "none" : "";
}

function renderNewProjectChips() {
  const wrap = $("#npModelChips");
  if (!wrap) return;
  wrap.innerHTML = "";
  Object.entries(PROVIDERS).forEach(([key, prov]) => {
    const cred = STATE.credentials[key];
    const ok = !!(cred?.apiKey && cred?.model);
    const chip = document.createElement("button");
    chip.className =
      "model-chip" + (ok && key === STATE.selectedProvider ? " selected" : "");
    chip.dataset.provider = key;
    chip.disabled = !ok;
    chip.style.cursor = ok ? "pointer" : "not-allowed";
    chip.style.opacity = ok ? "1" : "0.45";
    chip.innerHTML = `
      <span class="model-chip-name">${prov.name.split(" — ")[0]}</span>
      <span class="model-chip-meta">${ok ? escapeHtml(cred.model) : t("notConfigured")}</span>`;
    if (ok) {
      chip.addEventListener("click", () => {
        $$("#npModelChips .model-chip").forEach((x) =>
          x.classList.remove("selected"),
        );
        chip.classList.add("selected");
      });
    }
    wrap.appendChild(chip);
  });
  if (!wrap.querySelector(".model-chip.selected")) {
    const firstOk = wrap.querySelector(".model-chip:not([disabled])");
    if (firstOk) firstOk.classList.add("selected");
  }
}

function _createManualProject() {
  const name = $("#npName").value.trim();
  if (!name) {
    showToast(t("toastGiveName"), "error");
    $("#npName").focus();
    return;
  }
  const description = $("#npDescription").value.trim();
  createProject({
    name,
    description,
    model: "manuel",
    provider: STATE.selectedProvider || "anthropic",
    tasks: [],
    edges: [],
  });
  closeModal("newProjectBackdrop");
  showToast(
    `${t("projectCreated") || "Projet"} « ${name} » ${t("projectCreatedSuffix") || "créé"}`,
  );
}

function initNewProjectModal() {
  $("#newProjectBtn").addEventListener("click", openNewProjectModal);
  $("#emptyCta").addEventListener("click", openNewProjectModal);

  // Manual creation button
  const manualBtn = $("#npCreateManual");
  if (manualBtn) manualBtn.addEventListener("click", _createManualProject);

  // Configure provider button in no-provider hint
  const configureProviderBtn = $("#configureProviderBtn");
  if (configureProviderBtn) {
    configureProviderBtn.addEventListener("click", openSettings);
  }

  $("#npGenerate").addEventListener("click", async () => {
    const name = $("#npName").value.trim();
    const description = $("#npDescription").value.trim();
    const objective = $("#npObjective").value.trim() || name;
    const selectedChip = $("#npModelChips .model-chip.selected");
    const providerKey = selectedChip
      ? selectedChip.dataset.provider
      : STATE.selectedProvider;

    if (!name) {
      showToast(t("toastGiveName"), "error");
      $("#npName").focus();
      return;
    }
    if (!objective) {
      showToast(t("toastDescribeObjective"), "error");
      $("#npObjective").focus();
      return;
    }
    if (!isProviderConfigured(providerKey)) {
      showToast(t("toastProviderNotConfigured"), "error");
      openSettings();
      return;
    }

    const provider = PROVIDERS[providerKey];
    showLoadingModal(
      "newProject",
      t("generatingRoadmap"),
      `${provider.name} ${t("decomposing")}`,
    );

    try {
      const result = await callLLMForProject({
        projectName: name,
        description,
        objective,
        providerKey,
      });
      hideLoadingModal("newProject");
      closeModal("newProjectBackdrop");
      openPreview({
        ...result,
        name,
        description,
        model: result.model,
        provider: providerKey,
      });
    } catch (err) {
      hideLoadingModal("newProject");
      console.error(err);
      showToast(err.message || t("toastError"), "error");
    }
  });
}

function showLoadingModal(modalKey, title, text) {
  const modal = document.querySelector(`#${modalKey}Backdrop .modal`);
  if (!modal) return;
  let overlay = modal.querySelector(".modal-loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "modal-loading-overlay";
    modal.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="loading-shell">
      <div class="loading-orb"></div>
      <h3 class="loading-title">${escapeHtml(title)}</h3>
      <p class="loading-text">${escapeHtml(text)}</p>
    </div>`;
  overlay.style.display = "flex";
}

function hideLoadingModal(modalKey) {
  const modal = document.querySelector(`#${modalKey}Backdrop .modal`);
  if (!modal) return;
  const overlay = modal.querySelector(".modal-loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function showPromptLoading(title, text) {
  // Open the loading modal first
  $("#loadingBackdrop").classList.add("open");
  // Then show the loading overlay inside it
  showLoadingModal("loading", title, text);
}

function hidePromptLoading() {
  hideLoadingModal("loading");
  $("#loadingBackdrop").classList.remove("open");
}

/* ─── AI PREVIEW MODAL ──────────────────────────────────────────────── */
function openPreview(payload) {
  STATE.pendingPreview = JSON.parse(
    JSON.stringify({
      name: payload.name || payload.projectName,
      description: payload.description || "",
      model: payload.model,
      provider: payload.provider,
      tasks: payload.tasks,
      edges: payload.edges,
    }),
  );
  $("#previewTitle").textContent =
    `${t("previewTitle")} « ${STATE.pendingPreview.name} »`;
  const provName = PROVIDERS[STATE.pendingPreview.provider]?.name || "l'IA";
  $("#previewSubtitle").textContent =
    `${t("previewEyebrow")} ${provName} (${STATE.pendingPreview.model}). ${t("previewSubtitle")}`;
  renderPreview();
  openModal("previewBackdrop");
}

function renderPreview() {
  const body = $("#previewBody");
  const tasks = STATE.pendingPreview.tasks;
  body.innerHTML = "";
  tasks.forEach((task, i) => {
    const card = document.createElement("div");
    card.className = "preview-task";
    if (task._removed) card.classList.add("removed");
    card.dataset.id = task.id;
    card.innerHTML = `
      <div class="preview-task-head">
        <span class="preview-task-num">${String(i + 1).padStart(2, "0")}</span>
        <input class="preview-task-title" data-pe="title" value="${escapeHtml(task.title)}" />
        <div class="preview-task-actions">
          ${
            task._removed
              ? `<button class="preview-restore" data-restore>${t("cancel")}</button>`
              : `<button class="detail-icon-btn" data-remove title="${t("delete")}">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M3 4h6m-1 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4M5 4V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>`
          }
        </div>
      </div>
      <div class="preview-fields">
        <div class="field">
          <label class="field-label">${t("description")}</label>
          <textarea class="field-textarea" data-pe="description" placeholder="${t("descPlaceholder")}">${escapeHtml(task.description || "")}</textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label">${t("start")}</label>
            <input class="field-input" type="date" data-pe="startDate" value="${task.startDate || ""}" />
          </div>
          <div class="field">
            <label class="field-label">${t("end")}</label>
            <input class="field-input" type="date" data-pe="endDate" value="${task.endDate || ""}" />
          </div>
          <div class="field">
            <label class="field-label">${t("category")}</label>
            <div data-slot="category"></div>
          </div>
        </div>
      </div>`;
    body.appendChild(card);

    card.querySelectorAll("[data-pe]").forEach((input) => {
      input.addEventListener("input", () => {
        task[input.dataset.pe] = input.value;
      });
      input.addEventListener("change", () => {
        task[input.dataset.pe] = input.value;
      });
    });

    // Mount category dropdown
    const catSlot = card.querySelector('[data-slot="category"]');
    if (catSlot && typeof createDropdown === "function") {
      const catDd = createDropdown({
        value: task.category || "research",
        options: categoryOptions(),
      });
      catDd.onChange = (v) => {
        task.category = v;
      };
      catSlot.replaceWith(catDd);
    }
    card.querySelector("[data-remove]")?.addEventListener("click", () => {
      task._removed = true;
      renderPreview();
    });
    card.querySelector("[data-restore]")?.addEventListener("click", () => {
      task._removed = false;
      renderPreview();
    });
  });

  const addBtn = document.createElement("button");
  addBtn.className = "preview-add-btn";
  addBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </svg>
    ${t("addTaskManually")}`;
  addBtn.addEventListener("click", () => {
    const last = tasks[tasks.length - 1];
    const lastEnd = last?.endDate || todayISO();
    tasks.push({
      id: uid("t"),
      title: t("newProject"),
      description: "",
      category: "build",
      status: "pending",
      startDate: lastEnd,
      endDate: addDaysISO(lastEnd, 7),
      prerequisites: [],
      resources: [],
      events: [],
      x: 100 + tasks.length * 280,
      y: 100,
    });
    renderPreview();
  });
  body.appendChild(addBtn);

  const active = tasks.filter((task) => !task._removed).length;
  const taskWord = active === 1 ? t("taskSingular") : t("taskPlural");
  const deletedCount = tasks.length - active;
  const deletedWord =
    deletedCount === 1 ? t("deletedSingular") : t("deletedPlural");
  $("#previewFootInfo").textContent =
    `${active} ${taskWord} · ${deletedCount} ${deletedWord}`;
}

function initPreviewModal() {
  $("#previewApply").addEventListener("click", () => {
    if (!STATE.pendingPreview) return;
    const p = STATE.pendingPreview;
    const keptTasks = p.tasks.filter((task) => !task._removed);
    if (keptTasks.length === 0) {
      showToast(t("toastAtLeastOne"), "error");
      return;
    }
    const keptIds = new Set(keptTasks.map((task) => task.id));
    const keptEdges = p.edges.filter(
      (e) => keptIds.has(e.from) && keptIds.has(e.to),
    );
    createProject({
      name: p.name,
      description: p.description,
      model: p.model,
      provider: p.provider,
      tasks: keptTasks.map((task) => ({ ...task, _removed: undefined })),
      edges: keptEdges,
    });
    closeModal("previewBackdrop");
    showToast(
      `${t("projectCreated")} « ${p.name} » ${t("projectCreatedSuffix")}`,
    );
    STATE.pendingPreview = null;
  });
}

/* ─── RE-EXPLORE FLOW ───────────────────────────────────────────────── */
function initReexploreModal() {
  $("#reexploreBtn").addEventListener("click", async () => {
    const proj = getCurrentProject();
    if (!proj || !STATE.selectedNodeId) return;
    const node = proj.nodes.find((n) => n.id === STATE.selectedNodeId);
    if (!node) return;
    const idx = proj.nodes.findIndex((n) => n.id === node.id);

    if (configuredProviders().length === 0) {
      showToast(t("toastConfigureFirst"), "error");
      openSettings();
      return;
    }
    const providerKey = isProviderConfigured(STATE.selectedProvider)
      ? STATE.selectedProvider
      : configuredProviders()[0];
    const provider = PROVIDERS[providerKey];

    openModal("reexploreBackdrop");
    const body = $("#reexploreBody");
    body.innerHTML = `
    <div class="loading-shell">
      <div class="loading-orb"></div>
      <h3 class="loading-title">${t("reexamining")}</h3>
      <p class="loading-text">${escapeHtml(provider.name)} ${t("deepening")} « ${escapeHtml(node.title)} ».</p>
    </div>`;

    // Cacher les boutons pendant le chargement
    const modalFootActions = document.querySelector(
      "#reexploreBackdrop .modal-foot-actions",
    );
    if (modalFootActions) {
      modalFootActions.style.display = "none";
    }

    try {
      const result = await callLLMForReexplore({
        projectName: proj.name,
        task: node,
        stepIndex: String(idx + 1).padStart(2, "0"),
        total: String(proj.nodes.length).padStart(2, "0"),
        providerKey,
      });
      STATE.pendingReexplore = { node, result };
      renderReexplorePreview();
    } catch (err) {
      console.error(err);
      showToast(err.message || t("toastError"), "error");
      closeModal("reexploreBackdrop");
      // Réafficher les boutons en cas d'erreur
      if (modalFootActions) {
        modalFootActions.style.display = "flex";
      }
    }
  });

  $("#reexploreApply").addEventListener("click", () => {
    if (!STATE.pendingReexplore) return;
    const { node, result } = STATE.pendingReexplore;
    node.description = result.updatedDescription;
    if (result.resources && result.resources.length)
      node.resources = result.resources;

    // Merge subtasks: preserve done state for subtasks whose title still matches.
    if (result.subtasks && result.subtasks.length) {
      const previousByTitle = {};
      (node.subtasks || []).forEach((s) => {
        if (s && s.title) previousByTitle[s.title.trim().toLowerCase()] = s;
      });
      node.subtasks = result.subtasks.map((s, i) => {
        const key = (s.title || "").trim().toLowerCase();
        const prev = previousByTitle[key];
        return {
          id:
            prev?.id ||
            `st_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          title: String(s.title || "").trim(),
          description: String(s.description || "").trim(),
          estimatedDays: Number(s.estimatedDays) || 1,
          done: prev?.done || false,
        };
      });
    }
    saveProjects();
    closeModal("reexploreBackdrop");
    showToast(t("toastEnriched"));
    if (STATE.selectedNodeId === node.id) openDetail(node);
    const nodesLayer = $("#nodes");
    const el = nodesLayer.querySelector(`.node[data-id="${node.id}"]`);
    if (el) el.querySelector(".node-desc").textContent = node.description;
    STATE.pendingReexplore = null;
  });
}

function renderReexplorePreview() {
  const { node, result } = STATE.pendingReexplore;
  const body = $("#reexploreBody");

  // Afficher les boutons maintenant que les résultats sont disponibles
  const modalFootActions = document.querySelector(
    "#reexploreBackdrop .modal-foot-actions",
  );
  if (modalFootActions) {
    modalFootActions.style.display = "flex";
  }

  body.innerHTML = `
    <div class="reexplore-section">
      <h5>${t("proposedDescription")}</h5>
      <div class="diff-old">${escapeHtml(node.description || "(vide)")}</div>
      <textarea class="field-textarea" data-re="updatedDescription">${escapeHtml(result.updatedDescription)}</textarea>
    </div>
    <div class="reexplore-section">
      <h5>${t("whyMatters")}</h5>
      <textarea class="field-textarea" data-re="intro" style="min-height: 50px;">${escapeHtml(result.intro)}</textarea>
    </div>
    <div class="reexplore-section">
      <h5>${t("suggestedResources")}</h5>
      <div id="reResources" class="resource-list">
        ${result.resources
          .map(
            (r, i) => `
          <div class="resource" data-res-i="${i}">
            <span class="resource-icon">
              <svg viewBox="0 0 12 12" fill="none">
                <path d="M3 1.5h4l2 2v6.5a.5.5 0 0 1-.5.5h-5.5a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5z M7 1.5v2h2" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/>
              </svg>
            </span>
            <input class="field-input" style="border:0;background:transparent;padding:0;" data-res-title="${i}" value="${escapeHtml(r.title)}" />
            <span class="resource-meta">${escapeHtml(r.meta || r.type || "")}</span>
            <button class="detail-icon-btn" data-res-remove="${i}" title="${t("delete")}">
              <svg viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            </button>
          </div>`,
          )
          .join("")}
      </div>
    </div>
    ${
      result.subtasks && result.subtasks.length
        ? `
      <div class="reexplore-section">
        <h5>${t("suggestedSubtasks")}</h5>
        <div style="font-size:12px;color:var(--fg-dim);line-height:1.6;">
          ${result.subtasks
            .map(
              (s) => `
            <div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
              <span style="font-family:var(--font-mono);color:var(--fg-faint);flex-shrink:0;">${s.estimatedDays}j</span>
              <span>${escapeHtml(s.title)}</span>
            </div>`,
            )
            .join("")}
        </div>
        <p style="font-family:var(--font-mono);font-size:10.5px;color:var(--fg-faint);margin:6px 0 0;">${t("subtasksNote")}</p>
      </div>`
        : ""
    }
    ${
      result.warnings
        ? `
      <div class="reexplore-section" style="border-color:rgba(251,191,36,0.25);background:rgba(251,191,36,0.04);">
        <h5 style="color:var(--amber);">${t("warningPoint")}</h5>
        <p style="font-size:13px;color:var(--fg);line-height:1.5;margin:0;">${escapeHtml(result.warnings)}</p>
      </div>`
        : ""
    }`;

  body.querySelectorAll("[data-re]").forEach((input) => {
    input.addEventListener("input", () => {
      result[input.dataset.re] = input.value;
    });
  });
  body.querySelectorAll("[data-res-title]").forEach((input) => {
    input.addEventListener("input", () => {
      const i = parseInt(input.dataset.resTitle);
      result.resources[i].title = input.value;
    });
  });
  body.querySelectorAll("[data-res-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.dataset.resRemove);
      result.resources.splice(i, 1);
      renderReexplorePreview();
    });
  });
}

/* ─── SETTINGS MODAL ────────────────────────────────────────────────── */
function openSettings() {
  Object.entries(PROVIDERS).forEach(([key, prov]) => {
    const card = document.querySelector(
      `.provider-card[data-provider="${key}"]`,
    );
    if (!card) return;
    const modelInput = card.querySelector('[data-field="model"]');
    const keyInput = card.querySelector('[data-field="apiKey"]');
    const cred = STATE.credentials[key];
    modelInput.value = cred?.model || "";
    modelInput.placeholder = prov.placeholderModel;
    keyInput.value = cred?.apiKey || "";
    keyInput.type = "password";
    refreshProviderStatus(key);
  });
  openModal("settingsBackdrop");
}

// Expose globally for onclick handlers
window.openSettings = openSettings;

function refreshProviderStatus(key, override) {
  const card = document.querySelector(`.provider-card[data-provider="${key}"]`);
  if (!card) return;
  const status = card.querySelector("[data-status]");
  card.classList.remove("configured");
  status.classList.remove("ok", "error", "testing");
  if (override) {
    status.textContent = override.text;
    if (override.cls) status.classList.add(override.cls);
    if (override.cls === "ok") card.classList.add("configured");
    return;
  }
  if (isProviderConfigured(key)) {
    status.textContent = t("configured");
    status.classList.add("ok");
    card.classList.add("configured");
  } else {
    status.textContent = t("notConfigured");
  }
}

function initSettingsModal() {
  // Le bouton settings original a été remplacé par quickSettingsBtn
  // L'ouverture des settings est maintenant gérée par quick-settings.js

  $$("[data-toggle-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector(
        'input[data-field="apiKey"]',
      );
      input.type = input.type === "password" ? "text" : "password";
    });
  });

  $$("[data-test]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".provider-card");
      const key = card.dataset.provider;
      const apiKey = card.querySelector('[data-field="apiKey"]').value.trim();
      const model = card.querySelector('[data-field="model"]').value.trim();
      if (!apiKey || !model) {
        refreshProviderStatus(key, {
          text: t("keyAndModelRequired"),
          cls: "error",
        });
        return;
      }
      refreshProviderStatus(key, { text: t("testInProgress"), cls: "testing" });
      btn.disabled = true;
      try {
        const reply = await PROVIDERS[key].call({
          system: "You output only valid JSON, nothing else.",
          user: 'Reply with exactly this JSON: {"ok": true}',
          apiKey,
          model,
        });
        try {
          extractJSON(reply);
        } catch {
          /* tolerant */
        }
        refreshProviderStatus(key, { text: t("connectionOk"), cls: "ok" });
      } catch (err) {
        console.error(err);
        refreshProviderStatus(key, {
          text: (err.message || t("toastError")).slice(0, 40),
          cls: "error",
        });
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Save credentials automatically when inputs change
  $$(".provider-card input[data-field]").forEach((input) => {
    input.addEventListener("change", async () => {
      const newCreds = {};
      Object.keys(PROVIDERS).forEach((key) => {
        const card = document.querySelector(
          `.provider-card[data-provider="${key}"]`,
        );
        const apiKey = card.querySelector('[data-field="apiKey"]').value.trim();
        const model = card.querySelector('[data-field="model"]').value.trim();
        if (apiKey && model) newCreds[key] = { apiKey, model };
      });
      try {
        await saveCredentials(newCreds);
        STATE.credentials = newCreds;
        refreshAfterCredentialChange();
      } catch (err) {
        console.error(err);
      }
    });
  });
}

function refreshAfterCredentialChange() {
  if (!isProviderConfigured(STATE.selectedProvider)) {
    const first = configuredProviders()[0];
    if (first) STATE.selectedProvider = first;
  }
  updateProviderBtn();
  renderProviderMenu();
  const warn = configuredProviders().length === 0;
  $("#quickSettingsBtn").classList.toggle("has-warning", warn);
}
