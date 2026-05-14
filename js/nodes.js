/* ─── NODE RENDERING ────────────────────────────────────────────────── */

/* ─── JIRA-LIKE EDITABLE FIELD (unified, lazy-mount) ─────────────────────
 * Used by both the node detail panel and the project edit drawer.
 *
 * KEY DESIGN: The edit view (input + action buttons) is NOT in the DOM
 * by default. It's constructed and mounted only when the user clicks the
 * read view, and removed entirely when they save/cancel. This means it's
 * physically impossible for the input or its actions to leak into the
 * read-mode display, regardless of CSS state.
 *
 * config = {
 *   label, value, field, type ('text'|'textarea'|'select'|'date'),
 *   placeholder, options, aiToolbar, onAiImprove, emptyText,
 * }
 *
 * The returned container exposes onSave(newValue) which the caller assigns:
 *   const f = createEditableField({...});
 *   f.onSave = (newValue) => { ... };
 * ─────────────────────────────────────────────────────────────────────── */

// Module-level singleton: at most one field can be in edit mode at a time.
let __jiraActiveField = null;

function __jiraExitActive(opts) {
  if (__jiraActiveField && __jiraActiveField.__exit) {
    __jiraActiveField.__exit(opts || { restore: true });
  }
}

// Single document-level outside-click listener (installed once).
if (typeof document !== "undefined" && !window.__jiraOutsideClickInstalled) {
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!__jiraActiveField) return;
      if (!e.target.closest(".jira-field")) {
        __jiraExitActive({ restore: true });
      }
    },
    true,
  );
  window.__jiraOutsideClickInstalled = true;
}

function createEditableField(config) {
  const {
    label,
    value = "",
    field,
    type = "text",
    placeholder = "",
    options = [],
    aiToolbar = false,
    onAiImprove,
    emptyText,
  } = config;

  const container = document.createElement("div");
  container.className = "editable-field";

  if (label) {
    const labelEl = document.createElement("label");
    labelEl.className = "field-label";
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  // Closure-held current value — single source of truth for the field.
  let currentValue = value || "";

  // Shell — only ever contains the read view (or a temporarily-mounted edit view).
  const jiraField = document.createElement("div");
  jiraField.className = "jira-field";
  jiraField.dataset.mode = "read";
  jiraField.dataset.field = field || "";
  jiraField.dataset.type = type;
  const placeholderForEmpty = emptyText || placeholder || "—";

  // ── READ VIEW (always exists) ──────────────────────────────────────
  const readView = document.createElement("div");
  readView.className =
    "jira-readview" + (type === "textarea" ? " is-multiline" : "");
  readView.tabIndex = 0;
  readView.setAttribute("role", "button");
  readView.setAttribute("aria-label", `Modifier ${label || field || ""}`);

  function refreshReadView() {
    if (currentValue && String(currentValue).trim()) {
      // For selects, render the option label not the raw value.
      if (type === "select") {
        const opt = options.find((o) => o.value === currentValue);
        readView.textContent = opt ? opt.label : currentValue;
      } else {
        readView.textContent = currentValue;
      }
      readView.classList.remove("is-empty");
    } else {
      readView.textContent = placeholderForEmpty;
      readView.classList.add("is-empty");
    }
  }
  refreshReadView();
  jiraField.appendChild(readView);

  container.appendChild(jiraField);

  // ── BUILD edit view on demand ──────────────────────────────────────
  function buildEditView() {
    const editView = document.createElement("div");
    editView.className = "jira-editview";

    let inputEl;
    let actionsEl;

    if (type === "textarea") {
      const wrap = document.createElement("div");
      wrap.className = "jira-textarea-wrap";

      if (aiToolbar) {
        const toolbar = document.createElement("div");
        toolbar.className = "jira-toolbar";
        const aiBtn = document.createElement("button");
        aiBtn.type = "button";
        aiBtn.className = "jira-tb-btn jira-tb-ai";
        aiBtn.tabIndex = -1;
        aiBtn.title = "Améliorer la description";
        aiBtn.innerHTML = `
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M6 1.5l1.1 2.4 2.4 1.1-2.4 1.1L6 8.5 4.9 6.1 2.5 5l2.4-1.1L6 1.5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
            <path d="M9.5 8l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/>
          </svg>
          <span>Améliorer la description</span>`;
        aiBtn.addEventListener("mousedown", (e) => e.preventDefault());
        aiBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (typeof onAiImprove === "function") onAiImprove();
        });
        toolbar.appendChild(aiBtn);
        wrap.appendChild(toolbar);
      }

      inputEl = document.createElement("textarea");
      inputEl.className = "field-textarea jira-edit-input";
      inputEl.placeholder = placeholder;
      inputEl.value = currentValue;
      inputEl.rows = 4;
      if (field) inputEl.dataset.field = field;
      wrap.appendChild(inputEl);
      editView.appendChild(wrap);

      actionsEl = document.createElement("div");
      actionsEl.className = "jira-actions jira-actions-text";
      actionsEl.innerHTML = `
        <button type="button" class="btn btn-small btn-primary" data-act="save">${t("save") || "Enregistrer"}</button>
        <button type="button" class="btn btn-small btn-text" data-act="cancel">${t("cancel") || "Annuler"}</button>`;
      editView.appendChild(actionsEl);
    } else if (type === "select") {
      inputEl = document.createElement("select");
      inputEl.className = "field-select jira-edit-input";
      if (field) inputEl.dataset.field = field;
      options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        o.selected = opt.value === currentValue;
        inputEl.appendChild(o);
      });
      editView.appendChild(inputEl);

      actionsEl = document.createElement("div");
      actionsEl.className = "jira-actions jira-actions-text";
      actionsEl.innerHTML = `
        <button type="button" class="btn btn-small btn-primary" data-act="save">${t("save") || "Enregistrer"}</button>
        <button type="button" class="btn btn-small btn-text" data-act="cancel">${t("cancel") || "Annuler"}</button>`;
      editView.appendChild(actionsEl);
    } else {
      inputEl = document.createElement("input");
      inputEl.className =
        "field-input jira-edit-input" +
        (field === "title" || field === "name" ? " title-input" : "");
      inputEl.type = type === "date" ? "date" : "text";
      inputEl.placeholder = placeholder;
      inputEl.value = currentValue;
      if (field) inputEl.dataset.field = field;
      editView.appendChild(inputEl);

      actionsEl = document.createElement("div");
      actionsEl.className = "jira-actions jira-actions-icons";
      actionsEl.innerHTML = `
        <div class="jira-actions-right">
          <button type="button" class="jira-icon-btn jira-confirm" data-act="save" title="${t("save") || "Enregistrer"}">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M10 3.5L4.75 8.75 2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button type="button" class="jira-icon-btn" data-act="cancel" title="${t("cancel") || "Annuler"}">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>`;
      editView.appendChild(actionsEl);
    }

    return { editView, inputEl, actionsEl };
  }

  // ── BEHAVIOUR ──────────────────────────────────────────────────────
  function enterEditMode() {
    if (__jiraActiveField === jiraField) return; // already editing
    if (__jiraActiveField) __jiraExitActive({ restore: true });

    const built = buildEditView();
    const { editView, inputEl, actionsEl } = built;

    // Wire actions
    actionsEl.querySelectorAll("[data-act]").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => e.preventDefault());
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = btn.dataset.act;
        if (act === "save") commit(inputEl);
        else if (act === "cancel") cancel(inputEl);
      });
    });

    // Keyboard shortcuts
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel(inputEl);
      } else if (e.key === "Enter") {
        const isTextarea = inputEl.tagName === "TEXTAREA";
        if (!isTextarea && !e.shiftKey) {
          e.preventDefault();
          commit(inputEl);
        } else if (isTextarea && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          commit(inputEl);
        }
      }
    });

    // Select fires change immediately (matches native select UX)
    if (type === "select") {
      inputEl.addEventListener("change", () => commit(inputEl));
    }

    // Swap: read view OUT, edit view IN
    jiraField.replaceChild(editView, readView);
    jiraField.dataset.mode = "edit";
    __jiraActiveField = jiraField;

    // Set up the exit closure so __jiraExitActive can call us back.
    jiraField.__exit = (opts) => {
      const restore = opts && opts.restore;
      if (!restore) {
        // Save: pull value from the input *before* we destroy it
        currentValue = inputEl.value;
      }
      // Swap back: edit view OUT, read view IN
      try {
        jiraField.replaceChild(readView, editView);
      } catch (e) {
        // If editView is no longer a child (already swapped), append readView
        jiraField.innerHTML = "";
        jiraField.appendChild(readView);
      }
      jiraField.dataset.mode = "read";
      refreshReadView();
      jiraField.__exit = null;
      if (__jiraActiveField === jiraField) __jiraActiveField = null;
    };

    // Focus & select after the swap is committed to the DOM
    requestAnimationFrame(() => {
      try {
        inputEl.focus();
        if (inputEl.tagName === "TEXTAREA") {
          const len = inputEl.value.length;
          inputEl.setSelectionRange(len, len);
        } else if (inputEl.tagName === "INPUT") {
          inputEl.select();
        }
      } catch (e) {}
    });
  }

  function commit(inputEl) {
    const newValue = (inputEl.value || "").toString();
    const trimmed = newValue.trim();
    const original = currentValue;
    if (trimmed !== (original || "").toString().trim()) {
      if (typeof container.onSave === "function") {
        const result = container.onSave(trimmed);
        if (result === false) return; // handler rejected; stay in edit mode
      }
      currentValue = trimmed;
    }
    __jiraExitActive({ restore: false });
  }

  function cancel() {
    __jiraExitActive({ restore: true });
  }

  // Click / keyboard entry from the read view
  readView.addEventListener("click", () => enterEditMode());
  readView.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enterEditMode();
    }
  });

  // Programmatic API
  container.setValue = (v) => {
    currentValue = v || "";
    refreshReadView();
  };
  container.getValue = () => currentValue;

  return container;
}

// Expose globally for other modules (projects.js)
window.createEditableField = createEditableField;

/* ─── DROPDOWN WIDGET ────────────────────────────────────────────────────
 * Drop-in replacement for native <select>, styled to the design system.
 * Renders as a button-trigger + popover with clickable options.
 *
 * config = {
 *   value,         // initial selected value
 *   options,       // [{ value, label, color?, icon? }]
 *   placeholder,   // shown when no value selected
 *   onChange,      // callback(newValue, option) on selection
 *   align,         // 'left' (default) or 'right' — popover horizontal anchor
 * }
 *
 * Returned element exposes:
 *   - .value                — current value
 *   - .setValue(v)          — programmatically set
 *   - .onChange = fn        — assign or override callback
 * ─────────────────────────────────────────────────────────────────────── */

let __dropdownActiveOpen = null;

if (typeof document !== "undefined" && !window.__dropdownGlobalsInstalled) {
  document.addEventListener(
    "mousedown",
    (e) => {
      if (!__dropdownActiveOpen) return;
      if (
        !e.target.closest(".dd-popover") &&
        !e.target.closest(".dd-trigger")
      ) {
        __dropdownActiveOpen.__close();
      }
    },
    true,
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && __dropdownActiveOpen) {
      __dropdownActiveOpen.__close();
    }
  });
  window.addEventListener(
    "scroll",
    () => {
      if (__dropdownActiveOpen) __dropdownActiveOpen.__reposition();
    },
    true,
  );
  window.addEventListener("resize", () => {
    if (__dropdownActiveOpen) __dropdownActiveOpen.__close();
  });
  window.__dropdownGlobalsInstalled = true;
}

function createDropdown(config) {
  const {
    value: initialValue = "",
    options = [],
    placeholder = "—",
    align = "left",
  } = config;

  const wrapper = document.createElement("div");
  wrapper.className = "dd-wrapper";

  let currentValue = initialValue;
  let popover = null;
  let highlightedIdx = -1;

  // ── Trigger button ────────────────────────────────────────────────
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "dd-trigger";

  const dotEl = document.createElement("span");
  dotEl.className = "dd-dot";
  trigger.appendChild(dotEl);

  const labelEl = document.createElement("span");
  labelEl.className = "dd-label";
  trigger.appendChild(labelEl);

  const chevron = document.createElement("span");
  chevron.className = "dd-chevron";
  chevron.innerHTML = `<svg viewBox="0 0 12 12" fill="none">
      <path d="M3 5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  trigger.appendChild(chevron);

  wrapper.appendChild(trigger);

  function findOption(v) {
    return options.find((o) => o.value === v);
  }

  function refreshTrigger() {
    const opt = findOption(currentValue);
    if (opt) {
      labelEl.textContent = opt.label;
      labelEl.classList.remove("is-placeholder");
      if (opt.color) {
        dotEl.style.background = opt.color;
        dotEl.style.display = "";
      } else {
        dotEl.style.display = "none";
      }
    } else {
      labelEl.textContent = placeholder;
      labelEl.classList.add("is-placeholder");
      dotEl.style.display = "none";
    }
  }
  refreshTrigger();

  // ── Open / Close ──────────────────────────────────────────────────
  function open() {
    if (popover) return;
    if (__dropdownActiveOpen && __dropdownActiveOpen !== wrapper) {
      __dropdownActiveOpen.__close();
    }

    popover = document.createElement("div");
    popover.className = "dd-popover";

    options.forEach((opt, idx) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "dd-item";
      item.dataset.value = opt.value;
      item.dataset.idx = idx;
      if (opt.value === currentValue) item.classList.add("is-selected");

      // Mousedown picks the option (preventDefault to avoid losing focus
      // before click registers in IME/keyboard contexts)
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        select(opt.value);
      });
      item.addEventListener("mouseenter", () => {
        highlightedIdx = idx;
        refreshHighlight();
      });

      const swatch = document.createElement("span");
      swatch.className = "dd-item-dot";
      if (opt.color) {
        swatch.style.background = opt.color;
      } else {
        swatch.style.visibility = "hidden";
      }
      item.appendChild(swatch);

      const lbl = document.createElement("span");
      lbl.className = "dd-item-label";
      lbl.textContent = opt.label;
      item.appendChild(lbl);

      // Check icon for selected state
      const check = document.createElement("span");
      check.className = "dd-item-check";
      check.innerHTML = `<svg viewBox="0 0 12 12" fill="none">
          <path d="M10 3.5L4.75 8.75 2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      item.appendChild(check);

      popover.appendChild(item);
    });

    document.body.appendChild(popover);

    // Position
    reposition();

    // Setup callbacks for global handlers
    wrapper.__close = close;
    wrapper.__reposition = reposition;
    __dropdownActiveOpen = wrapper;

    trigger.classList.add("is-open");

    // Pre-highlight current value
    highlightedIdx = options.findIndex((o) => o.value === currentValue);
    refreshHighlight();

    // Animate in next frame
    requestAnimationFrame(() => popover && popover.classList.add("is-open"));
  }

  function close() {
    if (!popover) return;
    popover.remove();
    popover = null;
    trigger.classList.remove("is-open");
    if (__dropdownActiveOpen === wrapper) __dropdownActiveOpen = null;
    wrapper.__close = null;
    wrapper.__reposition = null;
  }

  function reposition() {
    if (!popover) return;
    const rect = trigger.getBoundingClientRect();
    const popH = popover.offsetHeight;
    const viewportH = window.innerHeight;

    // Vertical: prefer below, flip above if no room
    const spaceBelow = viewportH - rect.bottom;
    let top;
    if (spaceBelow < popH + 8 && rect.top > popH + 8) {
      top = rect.top - popH - 4;
    } else {
      top = rect.bottom + 4;
    }
    // Horizontal: align to trigger; ensure it fits
    let left = align === "right" ? rect.right - popover.offsetWidth : rect.left;
    const minWidth = rect.width;
    popover.style.minWidth = minWidth + "px";
    popover.style.top = top + "px";
    popover.style.left =
      Math.max(8, Math.min(left, window.innerWidth - popover.offsetWidth - 8)) +
      "px";
  }

  function refreshHighlight() {
    if (!popover) return;
    popover.querySelectorAll(".dd-item").forEach((it, i) => {
      it.classList.toggle("is-highlighted", i === highlightedIdx);
    });
  }

  function select(v) {
    currentValue = v;
    refreshTrigger();
    close();
    if (typeof wrapper.onChange === "function") {
      wrapper.onChange(v, findOption(v));
    }
  }

  // ── Trigger interactions ──────────────────────────────────────────
  trigger.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (popover) close();
    else open();
  });

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!popover) open();
      else {
        highlightedIdx = Math.min(options.length - 1, highlightedIdx + 1);
        refreshHighlight();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (popover) {
        highlightedIdx = Math.max(0, highlightedIdx - 1);
        refreshHighlight();
      }
    } else if (e.key === "Enter" && popover && highlightedIdx >= 0) {
      e.preventDefault();
      select(options[highlightedIdx].value);
    }
  });

  // Public API
  wrapper.setValue = (v) => {
    currentValue = v;
    refreshTrigger();
  };
  Object.defineProperty(wrapper, "value", {
    get() {
      return currentValue;
    },
    set(v) {
      this.setValue(v);
    },
  });
  wrapper.onChange = null;

  return wrapper;
}

window.createDropdown = createDropdown;

/* ─── Category & status option helpers ───────────────────────────────── */
function categoryOptions() {
  return [
    {
      value: "research",
      label: t("research") || "Research",
      color: "var(--violet)",
    },
    { value: "build", label: t("build") || "Build", color: "var(--cyan)" },
    { value: "learn", label: t("learn") || "Learn", color: "var(--amber)" },
    { value: "train", label: t("train") || "Train", color: "var(--green)" },
    { value: "launch", label: t("launch") || "Launch", color: "var(--pink)" },
  ];
}

function statusOptions() {
  return [
    {
      value: "pending",
      label: t("pending") || "To do",
      color: "var(--fg-faint)",
    },
    {
      value: "active",
      label: t("active") || "In progress",
      color: "var(--cyan)",
    },
    { value: "done", label: t("done") || "Done", color: "var(--green)" },
    {
      value: "blocked",
      label: t("blocked") || "Blocked",
      color: "var(--pink)",
    },
  ];
}

function resourceTypeOptions() {
  return [
    { value: "link", label: "Lien", color: "var(--cyan)" },
    { value: "doc", label: "Document", color: "var(--violet)" },
    { value: "tool", label: "Outil", color: "var(--amber)" },
    { value: "video", label: "Vidéo", color: "var(--pink)" },
  ];
}

window.categoryOptions = categoryOptions;
window.statusOptions = statusOptions;
window.resourceTypeOptions = resourceTypeOptions;

function renderNodeElement(n, idx = 0) {
  const proj = getCurrentProject();
  const total = proj.nodes.length;
  const myIdx = proj.nodes.findIndex((x) => x.id === n.id);
  const stepLabel =
    String(myIdx + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");

  const el = document.createElement("div");
  el.className = "node";
  el.dataset.id = n.id;
  el.dataset.category = n.category;
  el.style.transform = `translate(${n.x}px, ${n.y}px)`;
  el.style.animationDelay = idx * 50 + "ms";

  const dateLabel =
    n.startDate && n.endDate
      ? dateRange(n.startDate, n.endDate)
      : t("toSchedule");
  const statusLabel =
    {
      pending: t("pending"),
      active: t("active"),
      done: t("done"),
      blocked: t("blocked"),
    }[n.status] || t("pending");

  el.innerHTML = `
    <div class="node-head">
      <span class="node-status">
        <span class="status-dot ${n.status}"></span>${statusLabel}
      </span>
      <span class="node-step">${stepLabel}</span>
    </div>
    <h3 class="node-title">${escapeHtml(n.title)}</h3>
    <p class="node-desc">${escapeHtml(n.description || "")}</p>
    <div class="node-meta">
      <span class="node-date">
        <svg viewBox="0 0 12 12" fill="none">
          <rect x="1.5" y="2.5" width="9" height="8" rx="1" stroke="currentColor" stroke-width="0.9"/>
          <path d="M1.5 5h9M4 1.5v2M8 1.5v2" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
        </svg>${dateLabel}
      </span>
      <button class="node-explore">
        ${t("details")}
        <svg viewBox="0 0 10 10" fill="none">
          <path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <span class="handle handle-n" data-side="n"></span>
    <span class="handle handle-e" data-side="e"></span>
    <span class="handle handle-s" data-side="s"></span>
    <span class="handle handle-w" data-side="w"></span>
    <button class="node-trash" title="${t("delete")}">
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M3 4h6m-1 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4M5 4V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;

  const nodesLayer = $("#nodes");
  nodesLayer.appendChild(el);
  makeDraggable(el, n);
  el.addEventListener("click", (e) => {
    if (e.target.closest(".handle") || e.target.closest(".node-trash")) return;
    openDetail(n);
  });
  el.querySelector(".node-trash").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteNode(n.id);
  });
  el.querySelectorAll(".handle").forEach((h) => {
    h.addEventListener("pointerdown", (e) =>
      startLinking(e, n, h.dataset.side),
    );
  });
}

/* ─── DRAG & DROP ───────────────────────────────────────────────────── */
function makeDraggable(el, data) {
  let startX,
    startY,
    originX,
    originY,
    dragging = false,
    moved = false,
    activePointerId = null;

  function endDrag() {
    dragging = false;
    el.classList.remove("dragging");
    if (activePointerId !== null) {
      try {
        el.releasePointerCapture(activePointerId);
      } catch (_) {}
      activePointerId = null;
    }
  }

  el.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".handle") || e.target.closest(".node-trash")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    originX = data.x;
    originY = data.y;

    try {
      el.setPointerCapture(e.pointerId);
      activePointerId = e.pointerId;
    } catch (_) {
      activePointerId = null;
    }
    el.classList.add("dragging");
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = (e.clientX - startX) / STATE.scale;
    const dy = (e.clientY - startY) / STATE.scale;
    // 5 px threshold tolerates stylus tip wobble — without it, a normal
    // click registers as a tiny drag and blocks the next trash click.
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
    data.x = originX + dx;
    data.y = originY + dy;
    el.style.transform = `translate(${data.x}px, ${data.y}px)`;
    updateAllPaths();
  });

  el.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    const wasMoved = moved;
    endDrag();
    if (wasMoved) {
      saveProjects();
      el.addEventListener(
        "click",
        (ev) => {
          // Never swallow clicks targeted at action buttons — the user
          // expects them to always work, even after a tiny drag wobble.
          if (
            ev.target.closest(".node-trash") ||
            ev.target.closest(".handle")
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

  el.addEventListener("pointercancel", () => {
    endDrag();
  });
}

/* ─── NODE CRUD ─────────────────────────────────────────────────────── */
function addNodeAt(worldX, worldY) {
  const proj = getCurrentProject();
  if (!proj) return;
  const newNode = {
    id: uid("n"),
    title: t("newTask") || "Nouvelle tâche",
    description: "",
    category: "build",
    status: "pending",
    startDate: todayISO(),
    endDate: addDaysISO(todayISO(), 7),
    prerequisites: [],
    resources: [],
    events: [],
    x: worldX - 116,
    y: worldY - 60,
  };
  proj.nodes.push(newNode);
  saveProjects();
  renderCurrentProject();
  setTimeout(() => {
    openDetail(newNode);
    requestAnimationFrame(() => {
      const titleInput = $("#detailBody .title-input");
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    });
  }, 50);
}

function deleteNode(id) {
  const proj = getCurrentProject();
  if (!proj) return;
  const nodesLayer = $("#nodes");
  const el = nodesLayer.querySelector(`.node[data-id="${id}"]`);
  if (el) {
    el.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    el.style.opacity = "0";
    el.style.transform += " scale(0.85)";
    setTimeout(() => el.remove(), 200);
  }
  proj.nodes = proj.nodes.filter((n) => n.id !== id);
  const removed = proj.edges.filter((e) => e.from === id || e.to === id);
  removed.forEach((e) => {
    if (e._path) e._path.remove();
    if (e._hit) e._hit.remove();
  });
  proj.edges = proj.edges.filter((e) => e.from !== id && e.to !== id);
  saveProjects();
  closeDetail();
  closeEdgePopover();
  setTimeout(() => renderCurrentProject(), 220);
}

/* ─── DETAIL PANEL ──────────────────────────────────────────────────── */
function openDetail(n) {
  const proj = getCurrentProject();
  if (!proj) return;
  const nodesLayer = $("#nodes");
  const detailPanel = $("#detailPanel");
  const detailBody = $("#detailBody");
  $$(".node.selected").forEach((el) => el.classList.remove("selected"));
  const el = nodesLayer.querySelector(`.node[data-id="${n.id}"]`);
  if (el) el.classList.add("selected");
  STATE.selectedNodeId = n.id;
  closeEdgePopover();

  const total = proj.nodes.length;
  const idx = proj.nodes.findIndex((x) => x.id === n.id);
  const stepLabel =
    String(idx + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
  $("#detailCat").textContent =
    `${t("step").toUpperCase()} ${stepLabel} · ${(n.category || "BUILD").toUpperCase()}`;

  // Title + description are inserted via createEditableField AFTER innerHTML
  // is set, so we leave placeholders here that we'll replace.
  detailBody.innerHTML = `
    <div class="field" data-slot="title"></div>
    <div class="field" data-slot="description"></div>
    <div class="field-row">
      <div class="field">
        <label class="field-label">${t("startDate")}</label>
        <input class="field-input" type="date" data-edit="startDate" value="${n.startDate || ""}" />
      </div>
      <div class="field">
        <label class="field-label">${t("endDate")}</label>
        <input class="field-input" type="date" data-edit="endDate" value="${n.endDate || ""}" />
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label class="field-label">${t("status")}</label>
        <div data-slot="status"></div>
      </div>
      <div class="field">
        <label class="field-label">${t("category")}</label>
        <div data-slot="category"></div>
      </div>
    </div>
    <div class="detail-section">
      <h4>${t("resources")}</h4>
      <div class="resource-list">
        ${
          n.resources && n.resources.length
            ? n.resources
                .map(
                  (r) => `
          <div class="resource">
            <span class="resource-icon">
              ${
                r.type === "link"
                  ? '<svg viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5H8a1.5 1.5 0 0 1 1.5 1.5v4M7.5 4.5l3-3M10.5 1.5v3h-3" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                  : r.type === "video"
                    ? '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 3.5v5l4-2.5-4-2.5z" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="0.9"/></svg>'
                    : r.type === "tool"
                      ? '<svg viewBox="0 0 12 12" fill="none"><path d="M4 2.5h4a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5zM3.5 5h5M3.5 7h5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>'
                      : '<svg viewBox="0 0 12 12" fill="none"><path d="M3 1.5h4l2 2v6.5a.5.5 0 0 1-.5.5h-5.5a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5z M7 1.5v2h2" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/></svg>'
              }
            </span>
            <span class="resource-text">${escapeHtml(r.title)}</span>
            <span class="resource-meta">${escapeHtml(r.meta || r.type || "")}</span>
            <div class="resource-buttons">
              ${
                r.url
                  ? `
              <button class="resource-link-btn" title="${t("openLink") || "Ouvrir le lien"}" data-url="${escapeHtml(r.url)}">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5H8a1.5 1.5 0 0 1 1.5 1.5v4M7.5 4.5l3-3M10.5 1.5v3h-3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              `
                  : ""
              }
              <button class="resource-delete-btn" title="${t("delete") || "Supprimer"}">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>`,
                )
                .join("")
            : `<div class="resource-empty">${t("noResources")}</div>`
        }
        <div class="resource-add-form">
          <div class="field-row" style="margin-top: 12px;">
            <div class="field" style="flex: 2;">
              <input class="field-input resource-title-input" placeholder="${t("resourceTitle") || "Titre de la ressource"}" />
            </div>
            <div class="field" style="flex: 1;">
              <div data-slot="resource-type"></div>
            </div>
          </div>
          <div class="field-row">
            <div class="field" style="flex: 2;">
              <input class="field-input resource-url-input" placeholder="${t("resourceUrl") || "URL (optionnel)"}" />
            </div>
            <div class="field" style="flex: 1;">
              <button class="resource-add-btn">${t("add") || "Ajouter"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="subtasksSection"></div>
    <div id="eventsSection"></div>
  `;

  // Mount the title field into its slot
  const titleField = createEditableField({
    label: t("title"),
    value: n.title || "",
    field: "title",
    type: "text",
    placeholder: t("titlePlaceholder") || "",
    emptyText: t("titlePlaceholder") || "Sans titre",
  });
  titleField.onSave = (newValue) => {
    updateNodeField(n, "title", newValue);
  };
  const titleSlot = detailBody.querySelector('[data-slot="title"]');
  titleSlot.replaceWith(titleField);

  // Mount the description field with the AI toolbar enabled
  const descField = createEditableField({
    label: t("description"),
    value: n.description || "",
    field: "description",
    type: "textarea",
    placeholder: t("descPlaceholder") || "",
    emptyText: t("descPlaceholder") || "Aucune description",
    aiToolbar: true,
    onAiImprove: () => {
      const trigger = document.querySelector("#reexploreBtn");
      if (trigger) trigger.click();
    },
  });
  descField.onSave = (newValue) => {
    updateNodeField(n, "description", newValue);
  };
  const descSlot = detailBody.querySelector('[data-slot="description"]');
  descSlot.replaceWith(descField);

  // Status dropdown
  const statusDd = createDropdown({
    value: n.status || "pending",
    options: statusOptions(),
    placeholder: t("status") || "Status",
  });
  statusDd.onChange = (v) => updateNodeField(n, "status", v);
  detailBody.querySelector('[data-slot="status"]').replaceWith(statusDd);

  // Category dropdown
  const catDd = createDropdown({
    value: n.category || "research",
    options: categoryOptions(),
    placeholder: t("category") || "Category",
  });
  catDd.onChange = (v) => updateNodeField(n, "category", v);
  detailBody.querySelector('[data-slot="category"]').replaceWith(catDd);

  // Other simple fields (dates) keep their direct binding.
  detailBody.querySelectorAll("[data-edit]").forEach((input) => {
    const key = input.dataset.edit;
    input.addEventListener("input", () => updateNodeField(n, key, input.value));
    input.addEventListener("change", () =>
      updateNodeField(n, key, input.value),
    );
  });

  // Initialize resource management
  initResourceManagement(n, detailBody);

  renderSubtasksSection(n);
  renderEventsSection(n);

  detailPanel.classList.add("open");
  detailPanel.setAttribute("aria-hidden", "false");
}

function closeDetail() {
  const detailPanel = $("#detailPanel");
  detailPanel.classList.remove("open");
  detailPanel.setAttribute("aria-hidden", "true");
  $$(".node.selected").forEach((el) => el.classList.remove("selected"));
  STATE.selectedNodeId = null;
}

// Expose globally for other modules
window.closeDetail = closeDetail;

/* ─── SUBTASKS SECTION ──────────────────────────────────────────────── */
function renderSubtasksSection(node) {
  const container = document.getElementById("subtasksSection");
  if (!container) return;
  if (!node.subtasks) node.subtasks = [];

  const subtasks = node.subtasks;
  const total = subtasks.length;
  const doneCount = subtasks.filter((s) => s.done).length;
  const allSubtasksDone = total > 0 && doneCount === total;
  const taskIsDone = node.status === "done";

  container.innerHTML = `
    <div class="subtasks-panel">
      <div class="subtasks-panel-header">
        <span class="subtasks-panel-title">
          ${t("subtasks") || "Sous-tâches"}
          ${total > 0 ? `<span class="subtasks-counter">${doneCount}/${total}</span>` : ""}
        </span>
        <button class="subtasks-add-btn" id="addSubtaskBtn">
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          ${t("add") || "Ajouter"}
        </button>
      </div>
      ${
        total === 0
          ? `<div class="subtasks-empty">${t("noSubtasks") || "Aucune sous-tâche — utilise le ré-examen IA pour en suggérer."}</div>`
          : `<div class="subtasks-list">
              ${subtasks
                .map(
                  (s, i) => `
                <div class="subtask-item${s.done ? " is-done" : ""}" data-idx="${i}">
                  <button class="subtask-checkbox" data-toggle="${i}" aria-label="${s.done ? t("markUndone") || "Marquer comme non terminée" : t("markDone") || "Marquer comme terminée"}">
                    ${
                      s.done
                        ? `<svg viewBox="0 0 12 12" fill="none"><path d="M10 3.5L4.75 8.75 2 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
                        : ""
                    }
                  </button>
                  <div class="subtask-body">
                    <div class="subtask-title" data-edit-st="${i}">${escapeHtml(s.title)}</div>
                    ${s.description ? `<div class="subtask-desc">${escapeHtml(s.description)}</div>` : ""}
                  </div>
                  ${s.estimatedDays ? `<span class="subtask-days">${s.estimatedDays}j</span>` : ""}
                  <button class="subtask-delete" data-delete="${i}" aria-label="${t("delete") || "Supprimer"}">
                    <svg viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                  </button>
                </div>`,
                )
                .join("")}
            </div>`
      }
    </div>

    <div class="task-done-row">
      <button class="task-done-btn${taskIsDone ? " is-done" : ""}" id="taskDoneBtn">
        <span class="task-done-check">
          ${
            taskIsDone
              ? `<svg viewBox="0 0 14 14" fill="none"><path d="M11.5 4L6 9.5 3 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
              : `<svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.3"/></svg>`
          }
        </span>
        <span class="task-done-label">
          ${
            taskIsDone
              ? t("taskDone") || "Tâche terminée"
              : t("markTaskDone") || "Marquer comme terminée"
          }
        </span>
      </button>
    </div>
  `;

  // Toggle subtask done state
  container.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.toggle);
      node.subtasks[i].done = !node.subtasks[i].done;
      saveProjects();
      renderSubtasksSection(node);
      updateNodeProgressOnCard(node);
      // Re-render canvas project cards to update % bar
      if (typeof renderCurrentProject === "function") {
        // Only re-render the project menu card, not the whole canvas
        if (typeof renderProjectMenu === "function") renderProjectMenu();
      }
    });
  });

  // Delete subtask
  container.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.delete);
      node.subtasks.splice(i, 1);
      saveProjects();
      renderSubtasksSection(node);
      updateNodeProgressOnCard(node);
      if (typeof renderProjectMenu === "function") renderProjectMenu();
    });
  });

  // Inline-rename subtask title (click to edit)
  container.querySelectorAll("[data-edit-st]").forEach((titleEl) => {
    titleEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const i = parseInt(titleEl.dataset.editSt);
      const current = node.subtasks[i].title;
      const input = document.createElement("input");
      input.type = "text";
      input.className = "subtask-title-input";
      input.value = current;
      titleEl.replaceWith(input);
      input.focus();
      input.select();
      const commit = () => {
        const v = input.value.trim();
        if (v) {
          node.subtasks[i].title = v;
          saveProjects();
        }
        renderSubtasksSection(node);
      };
      input.addEventListener("blur", commit);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          input.blur();
        } else if (ev.key === "Escape") {
          renderSubtasksSection(node);
        }
      });
    });
  });

  // Add subtask
  document.getElementById("addSubtaskBtn")?.addEventListener("click", () => {
    if (!node.subtasks) node.subtasks = [];
    node.subtasks.push({
      id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: t("newSubtask") || "Nouvelle sous-tâche",
      description: "",
      estimatedDays: 1,
      done: false,
    });
    saveProjects();
    renderSubtasksSection(node);
    updateNodeProgressOnCard(node);
    if (typeof renderProjectMenu === "function") renderProjectMenu();
    // Focus the new subtask's title for immediate rename
    requestAnimationFrame(() => {
      const lastTitle = container.querySelector(
        `[data-edit-st="${node.subtasks.length - 1}"]`,
      );
      lastTitle?.click();
    });
  });

  // Mark task as done toggle
  document.getElementById("taskDoneBtn")?.addEventListener("click", () => {
    const wasDone = node.status === "done";
    updateNodeField(node, "status", wasDone ? "active" : "done");
    // Refresh the status dropdown trigger label too
    const statusDd = document.querySelector(
      "#detailBody .dd-wrapper:nth-of-type(1)",
    );
    // Re-render this section to reflect new state
    renderSubtasksSection(node);
    if (typeof renderProjectMenu === "function") renderProjectMenu();
    // Update the status dropdown widget if exposed
    const statusWrapper = document.querySelectorAll(
      "#detailBody .dd-wrapper",
    )[0];
    if (statusWrapper && typeof statusWrapper.setValue === "function") {
      statusWrapper.setValue(node.status);
    }
  });
}

// Update the % indicator on this node's canvas card (lightweight, no full re-render)
function updateNodeProgressOnCard(node) {
  // No card-level % indicator in current design — but if present we'd update here.
  // Currently the per-task card on the canvas doesn't show a % bar (only the
  // project-menu card does). So this is a no-op stub for now.
}

window.renderSubtasksSection = renderSubtasksSection;

/* ─── RESOURCE MANAGEMENT ───────────────────────────────────────────── */
function initResourceManagement(n, detailBody) {
  const resourceList = detailBody.querySelector(".resource-list");
  const addBtn = detailBody.querySelector(".resource-add-btn");
  const titleInput = detailBody.querySelector(".resource-title-input");
  const urlInput = detailBody.querySelector(".resource-url-input");
  const typeSlot = detailBody.querySelector('[data-slot="resource-type"]');
  const typeDd = createDropdown({
    value: "link",
    options: resourceTypeOptions(),
  });
  if (typeSlot) typeSlot.replaceWith(typeDd);

  if (!addBtn || !resourceList) return;

  // Add new resource
  addBtn.addEventListener("click", () => {
    const title = titleInput.value.trim();
    const type = typeDd.value;
    const url = urlInput.value.trim();

    if (!title) {
      showToast(t("resourceTitleRequired") || "Le titre est requis", "error");
      return;
    }

    // Create new resource object
    const newResource = {
      title: title,
      type: type,
      meta: type.charAt(0).toUpperCase() + type.slice(1),
      url: url || null,
    };

    // Add to node's resources
    if (!n.resources) n.resources = [];
    n.resources.push(newResource);
    saveProjects();

    // Add to UI
    const resourceElement = createResourceElement(
      newResource,
      n.resources.length - 1,
      n,
    );
    resourceList.insertBefore(
      resourceElement,
      resourceList.querySelector(".resource-add-form"),
    );

    // Clear inputs
    titleInput.value = "";
    urlInput.value = "";
    typeDd.setValue("link");
    titleInput.focus();
  });

  // Allow Enter key to add resource
  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBtn.click();
    }
  });

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBtn.click();
    }
  });

  // Add delete and link handlers to existing resources
  resourceList.querySelectorAll(".resource").forEach((resourceEl, index) => {
    const deleteBtn = resourceEl.querySelector(".resource-delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        n.resources.splice(index, 1);
        saveProjects();
        resourceEl.remove();
        // Re-index remaining resources
        resourceList.querySelectorAll(".resource").forEach((el, newIndex) => {
          const btn = el.querySelector(".resource-delete-btn");
          if (btn) btn.dataset.index = newIndex;
        });
      });
    }

    const linkBtn = resourceEl.querySelector(".resource-link-btn");
    if (linkBtn) {
      linkBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const url = linkBtn.dataset.url;
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      });
    }
  });
}

function createResourceElement(resource, index, node) {
  const div = document.createElement("div");
  div.className = "resource";

  // Determine icon based on type
  let iconSvg = "";
  if (resource.type === "link") {
    iconSvg = `<svg viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5H8a1.5 1.5 0 0 1 1.5 1.5v4M7.5 4.5l3-3M10.5 1.5v3h-3" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  } else if (resource.type === "video") {
    iconSvg = `<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 3.5v5l4-2.5-4-2.5z" stroke="currentColor" stroke-width="0.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="0.9"/></svg>`;
  } else if (resource.type === "tool") {
    iconSvg = `<svg viewBox="0 0 12 12" fill="none"><path d="M4 2.5h4a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5zM3.5 5h5M3.5 7h5" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/></svg>`;
  } else {
    // Default document icon
    iconSvg = `<svg viewBox="0 0 12 12" fill="none"><path d="M3 1.5h4l2 2v6.5a.5.5 0 0 1-.5.5h-5.5a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5z M7 1.5v2h2" stroke="currentColor" stroke-width="0.9" stroke-linejoin="round"/></svg>`;
  }

  // Create link button if URL exists
  let linkButton = "";
  if (resource.url) {
    linkButton = `
      <button class="resource-link-btn" title="${t("openLink") || "Ouvrir le lien"}" data-url="${escapeHtml(resource.url)}">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M4.5 2.5H8a1.5 1.5 0 0 1 1.5 1.5v4M7.5 4.5l3-3M10.5 1.5v3h-3" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
  }

  div.innerHTML = `
    <span class="resource-icon">
      ${iconSvg}
    </span>
    <span class="resource-text">${escapeHtml(resource.title)}</span>
    <span class="resource-meta">${escapeHtml(resource.meta || resource.type || "")}</span>
    <div class="resource-buttons">
      ${linkButton}
      <button class="resource-delete-btn" title="${t("delete") || "Supprimer"}" data-index="${index}">
        <svg viewBox="0 0 12 12" fill="none">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;

  // Add event listeners
  const deleteBtnEl = div.querySelector(".resource-delete-btn");
  if (deleteBtnEl) {
    deleteBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      node.resources.splice(index, 1);
      saveProjects();
      div.remove();
    });
  }

  const linkBtn = div.querySelector(".resource-link-btn");
  if (linkBtn) {
    linkBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = linkBtn.dataset.url;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  }

  return div;
}

function updateNodeField(n, key, value) {
  n[key] = value;
  saveProjects();
  const nodesLayer = $("#nodes");
  const el = nodesLayer.querySelector(`.node[data-id="${n.id}"]`);
  if (!el) return;
  if (key === "title") {
    el.querySelector(".node-title").textContent = value || t("newProject");
  } else if (key === "description") {
    el.querySelector(".node-desc").textContent = value || "";
  } else if (key === "startDate" || key === "endDate") {
    const lbl =
      n.startDate && n.endDate
        ? dateRange(n.startDate, n.endDate)
        : t("toSchedule");
    const dateEl = el.querySelector(".node-date");
    const svgIcon = dateEl.querySelector("svg").outerHTML;
    dateEl.innerHTML = svgIcon + lbl;
  } else if (key === "status") {
    const dot = el.querySelector(".status-dot");
    dot.className = "status-dot " + value;
    const labelMap = {
      pending: t("pending"),
      active: t("active"),
      done: t("done"),
      blocked: t("blocked"),
    };
    el.querySelector(".node-status").innerHTML =
      `<span class="status-dot ${value}"></span>${labelMap[value]}`;
    const proj = getCurrentProject();
    const idx = proj.nodes.findIndex((x) => x.id === n.id);
    const stepLabel =
      String(idx + 1).padStart(2, "0") +
      " / " +
      String(proj.nodes.length).padStart(2, "0");
    $("#detailCat").textContent =
      `${t("step").toUpperCase()} ${stepLabel} · ${(n.category || "BUILD").toUpperCase()}`;
  } else if (key === "category") {
    el.dataset.category = value;
    const proj = getCurrentProject();
    const idx = proj.nodes.findIndex((x) => x.id === n.id);
    const stepLabel =
      String(idx + 1).padStart(2, "0") +
      " / " +
      String(proj.nodes.length).padStart(2, "0");
    $("#detailCat").textContent =
      `${t("step").toUpperCase()} ${stepLabel} · ${value.toUpperCase()}`;
  }
}
