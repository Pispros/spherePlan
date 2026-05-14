/* ─── TASK EVENTS — add/edit/delete, text/handwritten ───────────────── */

function renderEventsSection(node) {
  const container = $("#eventsSection");
  if (!container) return;
  if (!node.events) node.events = [];

  container.innerHTML = `
    <div class="events-panel">
      <div class="events-panel-header">
        <span class="events-panel-title">${t("events")}</span>
        <button class="events-add-btn" id="addEventBtn">${t("addEvent")}</button>
      </div>
      <div class="events-list" id="eventsList">
        ${
          node.events.length === 0
            ? `<div class="event-empty">${t("noEvents")}</div>`
            : node.events.map((ev, i) => renderEventItem(ev, i)).join("")
        }
      </div>
    </div>`;

  document
    .getElementById("addEventBtn")
    ?.addEventListener("click", () => openEventModal(node, null));

  container.querySelectorAll(".event-edit-btn").forEach((btn) => {
    const idx = parseInt(btn.dataset.idx);
    btn.addEventListener("click", () => openEventModal(node, idx));
  });
  container.querySelectorAll(".event-delete-btn").forEach((btn) => {
    const idx = parseInt(btn.dataset.idx);
    btn.addEventListener("click", () => deleteEvent(node, idx));
  });
  container
    .querySelectorAll(".event-handwritten-preview")
    .forEach((preview) => {
      const idx = parseInt(preview.dataset.idx);
      preview.addEventListener("click", () => openEventModal(node, idx));
    });
}

function renderEventItem(ev, i) {
  const typeClass = ev.type === "handwritten" ? "handwritten" : "text";
  const typeLabelKey =
    ev.type === "handwritten" ? "handwrittenNote" : "textNote";
  let contentHtml = "";
  if (ev.type === "handwritten" && ev.canvasData) {
    contentHtml = `<div class="event-handwritten-preview" data-idx="${i}">
            <img src="${ev.canvasData}" style="width:100%;display:block;border-radius:4px;" alt="note manuscrite"/>
        </div>`;
  } else if (ev.type === "text" && ev.description) {
    contentHtml = `<div class="event-description">${escapeHtml(ev.description)}</div>`;
  }
  return `
    <div class="event-item">
      <div class="event-item-header">
        <input class="event-item-name" value="${escapeHtml(ev.name || "")}" data-ev-idx="${i}" data-ev-field="name" readonly />
        <span class="event-type-badge ${typeClass}">${t(typeLabelKey)}</span>
        <div class="event-item-actions">
          <button class="event-action-btn event-edit-btn" data-idx="${i}" title="${t("edit")}">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="event-action-btn event-delete-btn danger" data-idx="${i}" title="${t("delete")}">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M3 4h6m-1 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4M5 4V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      ${contentHtml}
    </div>`;
}

function deleteEvent(node, idx) {
  node.events.splice(idx, 1);
  saveProjects();
  renderEventsSection(node);
}

/* ─── EVENT MODAL ───────────────────────────────────────────────────── */
let _eventModalNode = null;
let _eventModalIdx = null;
let _notebookCanvas = null;
let _notebookCtx = null;
let _notebookTool = "pen";
let _notebookColor = "#fafaf8";
let _notebookSize = 1.5;
const NOTEBOOK_SIZE_PRESETS = [0.5, 1, 1.5, 2.5, 4, 7];
const NOTEBOOK_PAPER_BG = "#0d0d11";
const NOTEBOOK_COLORS = [
  "#fafaf8",
  "#5eead4",
  "#60a5fa",
  "#a78bfa",
  "#fbbf24",
  "#4ade80",
  "#ff6b9d",
  "#f87171",
];

function openEventModal(node, idx) {
  _eventModalNode = node;
  _eventModalIdx = idx;
  const isEdit = idx !== null && idx !== undefined;
  const ev = isEdit ? node.events[idx] : null;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop open";
  backdrop.id = "eventModalBackdrop";
  backdrop.innerHTML = `
    <div class="modal notebook-mode" role="dialog">
      <div class="modal-head">
        <div>
          <div class="modal-eyebrow">${isEdit ? t("edit") : t("addEvent")}</div>
          <h3 class="modal-title">${isEdit ? t("edit") + " " + t("events").toLowerCase() : t("events")}</h3>
        </div>
        <button class="modal-close" id="eventModalClose">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="modal-body" style="gap: 12px;">
        <div class="field">
          <label class="field-label">${t("eventName")}</label>
          <input class="field-input" id="eventNameInput" placeholder="${t("eventNamePlaceholder")}" value="${escapeHtml(ev?.name || "")}" />
        </div>
        <div class="event-modal-tabs">
          <button class="event-tab-btn${!ev || ev.type === "text" ? " active" : ""}" data-tab="text">${t("textNote")}</button>
          <button class="event-tab-btn${ev?.type === "handwritten" ? " active" : ""}" data-tab="handwritten">${t("handwrittenNote")}</button>
        </div>
        <div class="event-tab-content${!ev || ev.type === "text" ? " active" : ""}" id="tabText">
          <div class="field">
            <textarea class="field-textarea" id="eventTextInput" placeholder="${t("writeHere")}">${escapeHtml(ev?.type === "text" ? ev.description || "" : "")}</textarea>
          </div>
        </div>
        <div class="event-tab-content${ev?.type === "handwritten" ? " active" : ""}" id="tabHandwritten">
          <div class="notebook-wrapper" id="notebookWrapper">
            <div class="notebook-toolbar">
              <button class="notebook-tool-btn${_notebookTool === "pen" ? " active" : ""}" id="nbPen" title="${t("pen")}">
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                  <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
                </svg>
              </button>
              <button class="notebook-tool-btn${_notebookTool === "eraser" ? " active" : ""}" id="nbEraser" title="${t("eraser")}">
                <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                  <rect x="1" y="4" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.1"/>
                  <path d="M5 4V2M7 4V2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
                </svg>
              </button>
              <div class="notebook-toolbar-sep"></div>
              ${NOTEBOOK_COLORS.map(
                (c) =>
                  `<button class="notebook-color-btn${_notebookColor === c ? " active" : ""}" data-color="${c}" style="background:${c};" title="${c}"></button>`,
              ).join("")}
              <div class="notebook-toolbar-sep"></div>
              <div class="notebook-size-presets" id="nbSizePresets">
                ${NOTEBOOK_SIZE_PRESETS.map((s) => {
                  const dot = Math.max(2, Math.min(14, s * 2 + 2));
                  return `<button class="notebook-size-btn${_notebookSize === s ? " active" : ""}" data-size="${s}" title="${s}px">
                        <span class="nb-size-dot" style="width:${dot}px;height:${dot}px;"></span>
                    </button>`;
                }).join("")}
              </div>
              <input type="range" class="notebook-size-slider" id="nbSize" min="0.5" max="20" step="0.5" value="${_notebookSize}" title="${_notebookSize}px"/>
              <div class="notebook-toolbar-sep"></div>
              <button class="notebook-clear-btn" id="nbClear">${t("clear")}</button>
              <button class="notebook-fullscreen-btn" id="nbFullscreen" title="${t("fullscreen")}">
                <svg class="icon-expand" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 5V2h3M9 2h3v3M12 9v3h-3M5 12H2v-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <svg class="icon-compress" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2v3H2M9 5h3V2M12 9h-3v3M2 9h3v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="notebook-scroll" id="notebookScroll">
              <div class="notebook-paper" id="notebookPaper">
                <canvas class="notebook-canvas" id="notebookCanvas"></canvas>
                <div class="notebook-lines"></div>
                <div class="notebook-margin"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <span class="modal-foot-info"></span>
        <div class="modal-foot-actions">
          <button class="btn btn-bordered" id="eventModalCancel">${t("cancel")}</button>
          <button class="btn btn-primary" id="eventModalSave">${t("save")}</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(backdrop);

  // Tab switching
  backdrop.querySelectorAll(".event-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      backdrop
        .querySelectorAll(".event-tab-btn")
        .forEach((b) => b.classList.remove("active"));
      backdrop
        .querySelectorAll(".event-tab-content")
        .forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      backdrop
        .querySelector(
          `#tab${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`,
        )
        .classList.add("active");
      if (btn.dataset.tab === "handwritten") initNotebook(ev);
    });
  });

  if (ev?.type === "handwritten") {
    setTimeout(() => initNotebook(ev), 50);
  }

  // Close
  const closeModal = () => {
    // Always exit notebook fullscreen on close, otherwise residual styles
    // could leak if the wrapper survives detachment somehow.
    const wrapper = backdrop.querySelector(".notebook-wrapper");
    wrapper?.classList.remove("fullscreen");
    document.body.classList.remove("nb-fullscreen-active");
    backdrop.remove();
    _notebookCanvas = null;
    _notebookCtx = null;
    document.removeEventListener("keydown", onKey);
  };
  backdrop
    .querySelector("#eventModalClose")
    .addEventListener("click", closeModal);
  backdrop
    .querySelector("#eventModalCancel")
    .addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  // ESC: exit fullscreen first if active, otherwise close the modal.
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    const wrapper = backdrop.querySelector(".notebook-wrapper");
    if (wrapper?.classList.contains("fullscreen")) {
      toggleNotebookFullscreen(wrapper, false);
    } else {
      closeModal();
    }
  };
  document.addEventListener("keydown", onKey);

  // Save
  backdrop.querySelector("#eventModalSave").addEventListener("click", () => {
    const name = backdrop.querySelector("#eventNameInput").value.trim();
    const activeTab =
      backdrop.querySelector(".event-tab-btn.active")?.dataset.tab || "text";
    let newEvent;
    if (activeTab === "text") {
      const desc = backdrop.querySelector("#eventTextInput").value;
      newEvent = {
        name: name || t("textNote"),
        type: "text",
        description: desc,
      };
    } else {
      const canvasData = _notebookCanvas
        ? _notebookCanvas.toDataURL("image/png")
        : ev?.canvasData || "";
      newEvent = {
        name: name || t("handwrittenNote"),
        type: "handwritten",
        canvasData,
      };
    }
    if (isEdit) {
      _eventModalNode.events[_eventModalIdx] = newEvent;
    } else {
      _eventModalNode.events.push(newEvent);
    }
    // CRITICAL: persist the change. Without this, the event lives only
    // in memory — it survives the current session but disappears on
    // reload, and it is missing from any export performed after a
    // reload. This was the bug behind "events are neither saved nor
    // exported".
    saveProjects();
    closeModal();
    renderEventsSection(_eventModalNode);
  });
}

/* Notebook-only fullscreen — toggles a class on the wrapper that pins it
   over the entire viewport. The modal underneath stays mounted but hidden. */
function toggleNotebookFullscreen(wrapperEl, force) {
  const willFs =
    typeof force === "boolean"
      ? force
      : !wrapperEl.classList.contains("fullscreen");
  wrapperEl.classList.toggle("fullscreen", willFs);
  document.body.classList.toggle("nb-fullscreen-active", willFs);

  const btn = wrapperEl.querySelector("#nbFullscreen");
  if (btn) btn.title = willFs ? t("exitFullscreen") : t("fullscreen");
}

/* ─── NOTEBOOK CANVAS — pen draws, finger pans (OneNote-style) ─────── */
function initNotebook(existingEvent) {
  const canvasEl = document.getElementById("notebookCanvas");
  const paperEl = document.getElementById("notebookPaper");
  const scrollEl = document.getElementById("notebookScroll");
  const wrapperEl = document.getElementById("notebookWrapper");
  if (!canvasEl || !paperEl || !scrollEl || !wrapperEl) return;

  _notebookCanvas = canvasEl;
  _notebookCtx = canvasEl.getContext("2d", {
    desynchronized: true,
    willReadFrequently: false,
  });

  // OneNote-style sizing: start large (covers a big screen with room to
  // spare) and grow generously when the user writes near an edge.
  const INITIAL_W = 3200;
  const INITIAL_H = 2200;
  const GROW_STEP = 1600;
  const GROW_MARGIN = 400;

  sizePaper(INITIAL_W, INITIAL_H);

  _notebookCtx.fillStyle = NOTEBOOK_PAPER_BG;
  _notebookCtx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  if (existingEvent?.canvasData) {
    const img = new Image();
    img.onload = () => {
      if (img.width > canvasEl.width || img.height > canvasEl.height) {
        growCanvasTo(
          Math.max(img.width, canvasEl.width),
          Math.max(img.height, canvasEl.height),
        );
      }
      _notebookCtx.drawImage(img, 0, 0);
    };
    img.src = existingEvent.canvasData;
  }

  function sizePaper(w, h) {
    canvasEl.width = w;
    canvasEl.height = h;
    paperEl.style.width = w + "px";
    paperEl.style.height = h + "px";
  }

  function growCanvasTo(w, h) {
    const tmp = document.createElement("canvas");
    tmp.width = canvasEl.width;
    tmp.height = canvasEl.height;
    tmp.getContext("2d").drawImage(canvasEl, 0, 0);

    sizePaper(w, h);

    _notebookCtx.fillStyle = NOTEBOOK_PAPER_BG;
    _notebookCtx.fillRect(0, 0, w, h);
    _notebookCtx.drawImage(tmp, 0, 0);
  }

  function maybeGrow(x, y) {
    let newW = canvasEl.width;
    let newH = canvasEl.height;
    let need = false;
    if (x > newW - GROW_MARGIN) {
      newW = Math.ceil(x) + GROW_STEP;
      need = true;
    }
    if (y > newH - GROW_MARGIN) {
      newH = Math.ceil(y) + GROW_STEP;
      need = true;
    }
    if (need) growCanvasTo(newW, newH);
  }

  /* ── Two interaction modes on the same canvas:
       1. Pen / mouse → draw (uses pointer capture)
       2. Touch (finger) → pan the scroll container by translating
          scrollLeft/scrollTop manually. The browser's native pan
          can't be used because then the pen can't draw immediately
          (touch-action would need to be the same for both input types).
       This mirrors OneNote / Apple Pencil behavior: pen always draws,
       finger always pans. */

  let drawing = false;
  let drawPointerId = null;
  let lastX = 0,
    lastY = 0;

  let panning = false;
  let panPointerId = null;
  let panLastClientX = 0;
  let panLastClientY = 0;

  function getPos(e) {
    const rect = canvasEl.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function configurePen() {
    _notebookCtx.lineWidth =
      _notebookTool === "eraser"
        ? Math.max(6, _notebookSize * 6)
        : _notebookSize;
    _notebookCtx.lineCap = "round";
    _notebookCtx.lineJoin = "round";
    _notebookCtx.globalCompositeOperation = "source-over";
    if (_notebookTool === "eraser") {
      _notebookCtx.strokeStyle = NOTEBOOK_PAPER_BG;
      _notebookCtx.fillStyle = NOTEBOOK_PAPER_BG;
    } else {
      _notebookCtx.strokeStyle = _notebookColor;
      _notebookCtx.fillStyle = _notebookColor;
    }
  }

  function drawSegment(x, y) {
    _notebookCtx.beginPath();
    _notebookCtx.moveTo(lastX, lastY);
    _notebookCtx.lineTo(x, y);
    _notebookCtx.stroke();
    lastX = x;
    lastY = y;
  }

  function onPointerDown(e) {
    if (e.pointerType === "touch") {
      // Finger → pan. Don't preventDefault here; we still want a
      // potential tap on toolbar etc. to work, but on the canvas
      // surface itself we manage scrolling ourselves.
      e.preventDefault();
      panning = true;
      panPointerId = e.pointerId;
      panLastClientX = e.clientX;
      panLastClientY = e.clientY;
      try {
        canvasEl.setPointerCapture(e.pointerId);
      } catch (_) {}
      return;
    }

    // Pen / mouse → draw. Right-click on a mouse should not draw.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    e.preventDefault();
    drawing = true;
    drawPointerId = e.pointerId;
    try {
      canvasEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    configurePen();
    const p = getPos(e);
    lastX = p.x;
    lastY = p.y;

    // Render a dot for clean taps/clicks
    _notebookCtx.beginPath();
    _notebookCtx.arc(
      p.x,
      p.y,
      Math.max(0.5, _notebookCtx.lineWidth / 2),
      0,
      Math.PI * 2,
    );
    _notebookCtx.fill();
  }

  function onPointerMove(e) {
    // Finger panning takes priority (and is mutually exclusive with drawing)
    if (panning && e.pointerId === panPointerId) {
      e.preventDefault();
      const dx = e.clientX - panLastClientX;
      const dy = e.clientY - panLastClientY;
      scrollEl.scrollLeft -= dx;
      scrollEl.scrollTop -= dy;
      panLastClientX = e.clientX;
      panLastClientY = e.clientY;
      return;
    }
    if (!drawing || e.pointerId !== drawPointerId) return;
    e.preventDefault();

    // Use coalesced events: high-frequency stylus samples (Surface Pen
    // ~240 Hz) that the browser otherwise batches into a single move.
    const events =
      typeof e.getCoalescedEvents === "function"
        ? e.getCoalescedEvents()
        : null;
    if (events && events.length > 0) {
      for (const ev of events) {
        const p = getPos(ev);
        drawSegment(p.x, p.y);
      }
    } else {
      const p = getPos(e);
      drawSegment(p.x, p.y);
    }
    maybeGrow(lastX, lastY);
  }

  function endPointer(e) {
    if (panning && e.pointerId === panPointerId) {
      panning = false;
      panPointerId = null;
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
      return;
    }
    if (drawing && e.pointerId === drawPointerId) {
      drawing = false;
      drawPointerId = null;
      try {
        canvasEl.releasePointerCapture(e.pointerId);
      } catch (_) {}
      _notebookCtx.globalCompositeOperation = "source-over";
    }
  }

  canvasEl.addEventListener("pointerdown", onPointerDown);
  canvasEl.addEventListener("pointermove", onPointerMove);
  canvasEl.addEventListener("pointerup", endPointer);
  canvasEl.addEventListener("pointercancel", endPointer);

  // Toolbar
  const backdrop = canvasEl.closest(".modal-backdrop");
  backdrop?.querySelector("#nbPen")?.addEventListener("click", () => {
    _notebookTool = "pen";
    backdrop
      .querySelectorAll(".notebook-tool-btn")
      .forEach((b) => b.classList.remove("active"));
    backdrop.querySelector("#nbPen").classList.add("active");
  });
  backdrop?.querySelector("#nbEraser")?.addEventListener("click", () => {
    _notebookTool = "eraser";
    backdrop
      .querySelectorAll(".notebook-tool-btn")
      .forEach((b) => b.classList.remove("active"));
    backdrop.querySelector("#nbEraser").classList.add("active");
  });

  backdrop?.querySelectorAll(".notebook-color-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _notebookColor = btn.dataset.color;
      _notebookTool = "pen";
      backdrop
        .querySelectorAll(".notebook-color-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      backdrop
        .querySelectorAll(".notebook-tool-btn")
        .forEach((b) => b.classList.remove("active"));
      backdrop.querySelector("#nbPen").classList.add("active");
    });
  });

  function syncSizeUI() {
    const slider = backdrop?.querySelector("#nbSize");
    if (slider) {
      slider.value = _notebookSize;
      slider.title = _notebookSize + "px";
    }
    backdrop?.querySelectorAll(".notebook-size-btn").forEach((b) => {
      b.classList.toggle(
        "active",
        parseFloat(b.dataset.size) === _notebookSize,
      );
    });
  }
  backdrop?.querySelectorAll(".notebook-size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      _notebookSize = parseFloat(btn.dataset.size);
      syncSizeUI();
    });
  });
  backdrop?.querySelector("#nbSize")?.addEventListener("input", (e) => {
    _notebookSize = parseFloat(e.target.value);
    syncSizeUI();
  });

  backdrop?.querySelector("#nbClear")?.addEventListener("click", () => {
    _notebookCtx.globalCompositeOperation = "source-over";
    _notebookCtx.fillStyle = NOTEBOOK_PAPER_BG;
    _notebookCtx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  });

  // Notebook-only fullscreen (just the wrapper, not the modal)
  backdrop?.querySelector("#nbFullscreen")?.addEventListener("click", () => {
    toggleNotebookFullscreen(wrapperEl);
  });
}
