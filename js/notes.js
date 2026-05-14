/* ─── PROJECT NOTES — multi-sheet notebook ────────────────────────────
   Each project owns a `notes` array. Each sheet has:
     { id, title, type: "text" | "handwritten", content, canvasData,
       createdAt, updatedAt }
   The data model is persisted alongside the rest of the project (see
   state.js saveProjects / loadProjects, projects.js createProject /
   importProjectFromJSON, and main.js initExport). */

let _notesSelectedId = null; // currently previewed sheet id

function initNotes() {
  const notesFab = $("#notesFab");
  if (!notesFab) return;
  notesFab.addEventListener("click", () => {
    if (!getCurrentProject()) return;
    openNotesModal();
  });
}

/* ─── DATA HELPERS ───────────────────────────────────────────────────── */
function ensureProjectNotes(proj) {
  if (!Array.isArray(proj.notes)) proj.notes = [];
  return proj.notes;
}

function noteSnippet(note) {
  if (!note) return "";
  if (note.type === "handwritten") {
    return note.canvasData ? "—" : "";
  }
  const txt = (note.content || "").trim();
  if (!txt) return "";
  return txt.length > 140 ? txt.slice(0, 140) + "…" : txt;
}

function fmtNoteDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d)) return "—";
    const lang = localStorage.getItem("currentLanguage") || "fr";
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/* ─── NOTES MODAL — Roundcube-style (list left, preview right) ─────── */
function openNotesModal() {
  const proj = getCurrentProject();
  if (!proj) return;
  ensureProjectNotes(proj);

  // If a previous instance is still mounted (e.g. closed via X then
  // re-opened), nuke it first to avoid stale handlers.
  document.getElementById("notesBackdrop")?.remove();

  // Default selection: first note if any
  if (
    !_notesSelectedId ||
    !proj.notes.find((n) => n.id === _notesSelectedId)
  ) {
    _notesSelectedId = proj.notes[0]?.id || null;
  }

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop open";
  backdrop.id = "notesBackdrop";
  backdrop.innerHTML = `
    <div class="modal notes-mode" role="dialog" aria-labelledby="notesModalTitle">
      <div class="modal-head">
        <div>
          <div class="modal-eyebrow">${escapeHtml(t("notes"))}</div>
          <h3 class="modal-title" id="notesModalTitle">${escapeHtml(t("notesTitle"))}</h3>
          <p class="modal-subtitle">${escapeHtml(t("notesSubtitle"))}</p>
        </div>
        <button class="modal-close" id="notesModalClose" title="${escapeHtml(t("close") || "Fermer")}">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="notes-layout">
          <aside class="notes-sidebar">
            <div class="notes-sidebar-header">
              <span class="notes-sidebar-title">${escapeHtml(t("notes"))}</span>
              <button class="notes-add-btn" id="notesAddBtn" title="${escapeHtml(t("addNote"))}">
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                ${escapeHtml(t("addNoteShort"))}
              </button>
            </div>
            <div class="notes-list" id="notesList"></div>
            <div class="notes-sidebar-footer" id="notesSidebarFooter"></div>
          </aside>
          <section class="notes-preview" id="notesPreview"></section>
        </div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  // Initial render of list + preview
  renderNotesList();
  renderNotePreview();

  // Wiring
  backdrop
    .querySelector("#notesAddBtn")
    .addEventListener("click", () => openNoteEditor(null));
  backdrop
    .querySelector("#notesModalClose")
    .addEventListener("click", closeNotesModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeNotesModal();
  });

  // ESC closes the modal (unless the editor is open — its handler wins)
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    if (document.querySelector(".note-editor-fullscreen.open")) return;
    closeNotesModal();
  };
  document.addEventListener("keydown", onKey);
  backdrop._onKey = onKey;
}

function closeNotesModal() {
  const backdrop = document.getElementById("notesBackdrop");
  if (!backdrop) return;
  if (backdrop._onKey) document.removeEventListener("keydown", backdrop._onKey);
  backdrop.remove();
}

/* ─── LIST PANE ─────────────────────────────────────────────────────── */
function renderNotesList() {
  const proj = getCurrentProject();
  const list = document.getElementById("notesList");
  const footer = document.getElementById("notesSidebarFooter");
  if (!proj || !list) return;
  const notes = ensureProjectNotes(proj);

  if (notes.length === 0) {
    list.innerHTML = `
      <div class="notes-list-empty">
        <strong>${escapeHtml(t("noNotes"))}</strong>
        ${escapeHtml(t("noNotesHint"))}
      </div>`;
    if (footer) footer.textContent = `0 ${t("notesCount")}`;
    return;
  }

  // Sort by updatedAt desc so the most recent sheet is first
  const sorted = [...notes].sort((a, b) =>
    String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")),
  );

  list.innerHTML = sorted
    .map((n) => {
      const isActive = n.id === _notesSelectedId;
      const titleHtml = n.title
        ? `<span class="notes-list-item-title">${escapeHtml(n.title)}</span>`
        : `<span class="notes-list-item-title untitled">${escapeHtml(t("untitledNote"))}</span>`;
      const typeLabel = t(
        n.type === "handwritten" ? "handwrittenNote" : "textNote",
      );
      const snippet = noteSnippet(n);
      return `
        <div class="notes-list-item${isActive ? " active" : ""}" data-id="${escapeHtml(n.id)}">
          <div class="notes-list-item-actions">
            <button class="notes-list-item-action edit" data-action="edit" data-id="${escapeHtml(n.id)}" title="${escapeHtml(t("edit"))}">
              <svg viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="notes-list-item-action danger" data-action="delete" data-id="${escapeHtml(n.id)}" title="${escapeHtml(t("delete"))}">
              <svg viewBox="0 0 12 12" fill="none">
                <path d="M3 4h6m-1 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4M5 4V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="notes-list-item-head">
            ${titleHtml}
            <span class="notes-list-item-type ${n.type === "handwritten" ? "handwritten" : "text"}">${escapeHtml(typeLabel)}</span>
          </div>
          ${snippet ? `<div class="notes-list-item-snippet">${escapeHtml(snippet)}</div>` : ""}
          <div class="notes-list-item-meta">
            <span>${escapeHtml(t("updatedOn"))} ${escapeHtml(fmtNoteDate(n.updatedAt))}</span>
          </div>
        </div>`;
    })
    .join("");

  if (footer) footer.textContent = `${notes.length} ${t("notesCount")}`;

  // Item selection (click anywhere except an action button)
  list.querySelectorAll(".notes-list-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".notes-list-item-action")) return;
      _notesSelectedId = el.dataset.id;
      renderNotesList();
      renderNotePreview();
    });
  });
  // Per-item actions
  list.querySelectorAll(".notes-list-item-action").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === "edit") {
        const idx = proj.notes.findIndex((n) => n.id === id);
        if (idx >= 0) openNoteEditor(idx);
      } else if (action === "delete") {
        deleteNote(id);
      }
    });
  });
}

/* ─── PREVIEW PANE ──────────────────────────────────────────────────── */
function renderNotePreview() {
  const proj = getCurrentProject();
  const previewEl = document.getElementById("notesPreview");
  if (!proj || !previewEl) return;
  const note = (proj.notes || []).find((n) => n.id === _notesSelectedId);

  if (!note) {
    previewEl.innerHTML = `
      <div class="notes-preview-empty">
        <div class="notes-preview-empty-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M5 3h10l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
            <path d="M15 3v4h4" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
            <path d="M8 12h8M8 15h8M8 18h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </div>
        <h4>${escapeHtml(t("selectNote"))}</h4>
        <p>${escapeHtml(t("selectNoteHint"))}</p>
      </div>`;
    return;
  }

  const titleHtml = note.title
    ? `<h3 class="notes-preview-title">${escapeHtml(note.title)}</h3>`
    : `<h3 class="notes-preview-title untitled">${escapeHtml(t("untitledNote"))}</h3>`;

  let bodyHtml = "";
  if (note.type === "handwritten") {
    if (note.canvasData) {
      bodyHtml = `
        <div class="notes-preview-handwritten">
          <img src="${escapeHtml(note.canvasData)}" alt="${escapeHtml(t("handwrittenNote"))}" />
        </div>`;
    } else {
      bodyHtml = `<div class="notes-preview-text empty">${escapeHtml(t("noNotesHint"))}</div>`;
    }
  } else {
    if (note.content && note.content.trim()) {
      bodyHtml = `<div class="notes-preview-text">${escapeHtml(note.content)}</div>`;
    } else {
      bodyHtml = `<div class="notes-preview-text empty">${escapeHtml(t("writeHere"))}</div>`;
    }
  }

  previewEl.innerHTML = `
    <div class="notes-preview-header">
      <div class="notes-preview-meta">
        ${titleHtml}
        <div class="notes-preview-info">
          <span>${escapeHtml(t(note.type === "handwritten" ? "handwrittenNote" : "textNote"))}</span>
          <span>${escapeHtml(t("createdOn"))} ${escapeHtml(fmtNoteDate(note.createdAt))}</span>
          <span>${escapeHtml(t("updatedOn"))} ${escapeHtml(fmtNoteDate(note.updatedAt))}</span>
        </div>
      </div>
      <div class="notes-preview-actions">
        <button class="notes-preview-action" id="notesPreviewDelete" title="${escapeHtml(t("delete"))}">
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M3 4h6m-1 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4M5 4V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5V4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${escapeHtml(t("delete"))}
        </button>
        <button class="notes-preview-action primary" id="notesPreviewExpand" title="${escapeHtml(t("expand"))}">
          <svg viewBox="0 0 14 14" fill="none">
            <path d="M2 5V2h3M9 2h3v3M12 9v3h-3M5 12H2v-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          ${escapeHtml(t("expand"))}
        </button>
      </div>
    </div>
    <div class="notes-preview-body">${bodyHtml}</div>`;

  // Wiring
  document
    .getElementById("notesPreviewExpand")
    ?.addEventListener("click", () => {
      const idx = proj.notes.findIndex((n) => n.id === _notesSelectedId);
      if (idx >= 0) openNoteEditor(idx);
    });
  document
    .getElementById("notesPreviewDelete")
    ?.addEventListener("click", () => deleteNote(_notesSelectedId));
}

/* ─── DELETE ────────────────────────────────────────────────────────── */
function deleteNote(noteId) {
  const proj = getCurrentProject();
  if (!proj || !noteId) return;
  const note = (proj.notes || []).find((n) => n.id === noteId);
  if (!note) return;
  openConfirmModal(
    t("deleteNoteConfirm"),
    t("deleteNoteMessage"),
    t("delete"),
    t("cancel"),
    () => {
      proj.notes = (proj.notes || []).filter((n) => n.id !== noteId);
      if (_notesSelectedId === noteId) _notesSelectedId = null;
      saveProjects();
      renderNotesList();
      renderNotePreview();
    },
  );
}

/* ─── FULLSCREEN EDITOR ─────────────────────────────────────────────── */
let _noteEditorState = null; // { mode, idx, type, originalNote }

function openNoteEditor(idx) {
  const proj = getCurrentProject();
  if (!proj) return;
  ensureProjectNotes(proj);

  const isEdit = idx !== null && idx !== undefined;
  const note = isEdit ? proj.notes[idx] : null;

  // Determine starting tab. New notes default to text.
  const startType = isEdit ? note.type : "text";

  _noteEditorState = {
    mode: isEdit ? "edit" : "create",
    idx: isEdit ? idx : null,
    originalNote: note ? { ...note } : null,
  };

  // Remove any leftover editor (defensive)
  document.querySelector(".note-editor-fullscreen")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "note-editor-fullscreen open";
  overlay.id = "noteEditorOverlay";
  overlay.innerHTML = `
    <div class="note-editor-header">
      <span class="note-editor-eyebrow">${escapeHtml(isEdit ? t("edit") : t("newNote"))}</span>
      <input
        class="note-editor-title-input"
        id="noteEditorTitle"
        type="text"
        placeholder="${escapeHtml(t("noteTitlePlaceholder"))}"
        value="${escapeHtml(note?.title || "")}"
      />
      <div class="note-editor-actions">
        <button class="btn btn-bordered" id="noteEditorCancel">${escapeHtml(t("cancel"))}</button>
        <button class="btn btn-primary" id="noteEditorSave">${escapeHtml(t("saveNote"))}</button>
        <button class="modal-close" id="noteEditorClose" title="${escapeHtml(t("closeEditor"))}" style="margin-left:4px;">
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="note-editor-tabs">
      <button class="note-editor-tab${startType === "text" ? " active" : ""}" data-tab="text">${escapeHtml(t("textNote"))}</button>
      <button class="note-editor-tab${startType === "handwritten" ? " active" : ""}" data-tab="handwritten">${escapeHtml(t("handwrittenNote"))}</button>
    </div>
    <div class="note-editor-body">
      <div class="note-editor-text${startType === "text" ? " active" : ""}" id="noteEditorTextPane">
        <textarea
          class="note-editor-textarea"
          id="noteEditorTextarea"
          placeholder="${escapeHtml(t("writeHere"))}"
        >${escapeHtml(note?.type === "text" ? note?.content || "" : "")}</textarea>
      </div>
      <div class="note-editor-handwritten${startType === "handwritten" ? " active" : ""}" id="noteEditorHandwrittenPane">
        <div class="notebook-toolbar" id="noteNotebookToolbar">
          <button class="notebook-tool-btn${_notebookTool === "pen" ? " active" : ""}" data-tool="pen" title="${escapeHtml(t("pen"))}">
            <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
              <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="notebook-tool-btn${_notebookTool === "eraser" ? " active" : ""}" data-tool="eraser" title="${escapeHtml(t("eraser"))}">
            <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
              <rect x="1" y="4" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.1"/>
              <path d="M5 4V2M7 4V2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="notebook-toolbar-sep"></div>
          ${NOTEBOOK_COLORS.map(
            (c) =>
              `<button class="notebook-color-btn${_notebookColor === c ? " active" : ""}" data-color="${escapeHtml(c)}" style="background:${escapeHtml(c)};" title="${escapeHtml(c)}"></button>`,
          ).join("")}
          <div class="notebook-toolbar-sep"></div>
          <div class="notebook-size-presets">
            ${NOTEBOOK_SIZE_PRESETS.map((s) => {
              const dot = Math.max(2, Math.min(14, s * 2 + 2));
              return `<button class="notebook-size-btn${_notebookSize === s ? " active" : ""}" data-size="${s}" title="${s}px">
                  <span class="nb-size-dot" style="width:${dot}px;height:${dot}px;"></span>
                </button>`;
            }).join("")}
          </div>
          <input type="range" class="notebook-size-slider" id="noteNotebookSizeSlider" min="0.5" max="20" step="0.5" value="${_notebookSize}" title="${_notebookSize}px"/>
          <div class="notebook-toolbar-sep"></div>
          <button class="notebook-clear-btn" id="noteNotebookClear">${escapeHtml(t("clear"))}</button>
        </div>
        <div class="notebook-scroll" id="noteNotebookScroll">
          <div class="notebook-paper" id="noteNotebookPaper">
            <canvas class="notebook-canvas" id="noteNotebookCanvas"></canvas>
            <div class="notebook-lines"></div>
            <div class="notebook-margin"></div>
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  document.body.classList.add("note-editor-active");

  // ── State for the canvas (local — does NOT touch events.js globals
  //     for ctx/canvas refs; it does share user pen prefs).
  let canvasInstance = null;

  // Initialize the right pane immediately if starting on handwritten
  if (startType === "handwritten") {
    canvasInstance = setupNoteNotebook(note?.canvasData);
  }

  // ── Tab switching
  overlay.querySelectorAll(".note-editor-tab").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      overlay
        .querySelectorAll(".note-editor-tab")
        .forEach((b) => b.classList.remove("active"));
      tabBtn.classList.add("active");
      const tab = tabBtn.dataset.tab;
      const textPane = overlay.querySelector("#noteEditorTextPane");
      const drawPane = overlay.querySelector("#noteEditorHandwrittenPane");
      if (tab === "text") {
        textPane.classList.add("active");
        drawPane.classList.remove("active");
      } else {
        textPane.classList.remove("active");
        drawPane.classList.add("active");
        // First time on handwritten: spin up the canvas.
        if (!canvasInstance) {
          // Pull canvasData from the original note only if it was already
          // a handwritten note. Switching tabs from text to handwritten on
          // a new note → start blank.
          const seed =
            _noteEditorState.originalNote?.type === "handwritten"
              ? _noteEditorState.originalNote.canvasData
              : "";
          canvasInstance = setupNoteNotebook(seed);
        }
      }
    });
  });

  // ── Save
  function saveNote() {
    const proj2 = getCurrentProject();
    if (!proj2) return;
    ensureProjectNotes(proj2);

    const titleVal = overlay
      .querySelector("#noteEditorTitle")
      .value.trim();
    const activeTab =
      overlay.querySelector(".note-editor-tab.active")?.dataset.tab || "text";

    const now = new Date().toISOString();
    const isEdit2 = _noteEditorState.mode === "edit";
    const idx2 = _noteEditorState.idx;

    let payload;
    if (activeTab === "text") {
      const content = overlay.querySelector("#noteEditorTextarea").value;
      payload = {
        type: "text",
        content,
        canvasData: "",
      };
    } else {
      const data = canvasInstance ? canvasInstance.getDataUrl() : "";
      payload = {
        type: "handwritten",
        content: "",
        canvasData: data,
      };
    }

    if (isEdit2) {
      const existing = proj2.notes[idx2];
      proj2.notes[idx2] = {
        ...existing,
        title: titleVal,
        ...payload,
        updatedAt: now,
      };
      _notesSelectedId = existing.id;
    } else {
      const newId = `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      proj2.notes.push({
        id: newId,
        title: titleVal,
        ...payload,
        createdAt: now,
        updatedAt: now,
      });
      _notesSelectedId = newId;
    }
    saveProjects();
    closeNoteEditor();
    renderNotesList();
    renderNotePreview();
    showToast(t("saveNote"));
  }

  overlay
    .querySelector("#noteEditorSave")
    .addEventListener("click", saveNote);
  overlay
    .querySelector("#noteEditorCancel")
    .addEventListener("click", closeNoteEditor);
  overlay
    .querySelector("#noteEditorClose")
    .addEventListener("click", closeNoteEditor);

  // ESC closes the editor (inner ESC; the modal's ESC is suppressed
  // while the editor is mounted via the early-return in openNotesModal).
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    closeNoteEditor();
  };
  document.addEventListener("keydown", onKey);
  overlay._onKey = onKey;

  // Cmd/Ctrl + S to save (handy on a fullscreen surface)
  const onSaveKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveNote();
    }
  };
  document.addEventListener("keydown", onSaveKey);
  overlay._onSaveKey = onSaveKey;

  // Focus the title input on open for fast keyboard flow
  setTimeout(
    () => overlay.querySelector("#noteEditorTitle")?.focus(),
    50,
  );
}

function closeNoteEditor() {
  const overlay = document.getElementById("noteEditorOverlay");
  if (!overlay) return;
  if (overlay._onKey) document.removeEventListener("keydown", overlay._onKey);
  if (overlay._onSaveKey)
    document.removeEventListener("keydown", overlay._onSaveKey);
  overlay.remove();
  document.body.classList.remove("note-editor-active");
  _noteEditorState = null;
}

/* ─── NOTEBOOK CANVAS for the note editor ─────────────────────────────
   Parallel implementation to events.js initNotebook, but takes element
   refs from the editor overlay so it can coexist with the events
   notebook (different IDs). It shares the user's pen preferences
   (_notebookTool / _notebookColor / _notebookSize) so the choice
   carries between contexts. */
function setupNoteNotebook(existingDataUrl) {
  const canvasEl = document.getElementById("noteNotebookCanvas");
  const paperEl = document.getElementById("noteNotebookPaper");
  const scrollEl = document.getElementById("noteNotebookScroll");
  const toolbarEl = document.getElementById("noteNotebookToolbar");
  if (!canvasEl || !paperEl || !scrollEl) return null;

  const ctx = canvasEl.getContext("2d", {
    desynchronized: true,
    willReadFrequently: false,
  });

  // OneNote-style sizing (start big, grow as user writes).
  const INITIAL_W = 3200;
  const INITIAL_H = 2200;
  const GROW_STEP = 1600;
  const GROW_MARGIN = 400;

  function sizePaper(w, h) {
    canvasEl.width = w;
    canvasEl.height = h;
    paperEl.style.width = w + "px";
    paperEl.style.height = h + "px";
  }

  sizePaper(INITIAL_W, INITIAL_H);
  ctx.fillStyle = NOTEBOOK_PAPER_BG;
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  if (existingDataUrl) {
    const img = new Image();
    img.onload = () => {
      if (img.width > canvasEl.width || img.height > canvasEl.height) {
        growCanvasTo(
          Math.max(img.width, canvasEl.width),
          Math.max(img.height, canvasEl.height),
        );
      }
      ctx.drawImage(img, 0, 0);
    };
    img.src = existingDataUrl;
  }

  function growCanvasTo(w, h) {
    const tmp = document.createElement("canvas");
    tmp.width = canvasEl.width;
    tmp.height = canvasEl.height;
    tmp.getContext("2d").drawImage(canvasEl, 0, 0);

    sizePaper(w, h);
    ctx.fillStyle = NOTEBOOK_PAPER_BG;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0);
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
    ctx.lineWidth =
      _notebookTool === "eraser"
        ? Math.max(6, _notebookSize * 6)
        : _notebookSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "source-over";
    if (_notebookTool === "eraser") {
      ctx.strokeStyle = NOTEBOOK_PAPER_BG;
      ctx.fillStyle = NOTEBOOK_PAPER_BG;
    } else {
      ctx.strokeStyle = _notebookColor;
      ctx.fillStyle = _notebookColor;
    }
  }

  function drawSegment(x, y) {
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
  }

  function onPointerDown(e) {
    if (e.pointerType === "touch") {
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

    ctx.beginPath();
    ctx.arc(
      p.x,
      p.y,
      Math.max(0.5, ctx.lineWidth / 2),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  function onPointerMove(e) {
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
      ctx.globalCompositeOperation = "source-over";
    }
  }

  canvasEl.addEventListener("pointerdown", onPointerDown);
  canvasEl.addEventListener("pointermove", onPointerMove);
  canvasEl.addEventListener("pointerup", endPointer);
  canvasEl.addEventListener("pointercancel", endPointer);

  // ── Toolbar wiring (scoped to this toolbar element)
  if (toolbarEl) {
    toolbarEl
      .querySelector('[data-tool="pen"]')
      ?.addEventListener("click", () => {
        _notebookTool = "pen";
        toolbarEl
          .querySelectorAll(".notebook-tool-btn")
          .forEach((b) => b.classList.remove("active"));
        toolbarEl
          .querySelector('[data-tool="pen"]')
          .classList.add("active");
      });
    toolbarEl
      .querySelector('[data-tool="eraser"]')
      ?.addEventListener("click", () => {
        _notebookTool = "eraser";
        toolbarEl
          .querySelectorAll(".notebook-tool-btn")
          .forEach((b) => b.classList.remove("active"));
        toolbarEl
          .querySelector('[data-tool="eraser"]')
          .classList.add("active");
      });

    toolbarEl.querySelectorAll(".notebook-color-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        _notebookColor = btn.dataset.color;
        _notebookTool = "pen";
        toolbarEl
          .querySelectorAll(".notebook-color-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        toolbarEl
          .querySelectorAll(".notebook-tool-btn")
          .forEach((b) => b.classList.remove("active"));
        toolbarEl
          .querySelector('[data-tool="pen"]')
          .classList.add("active");
      });
    });

    function syncSizeUI() {
      const slider = document.getElementById("noteNotebookSizeSlider");
      if (slider) {
        slider.value = _notebookSize;
        slider.title = _notebookSize + "px";
      }
      toolbarEl.querySelectorAll(".notebook-size-btn").forEach((b) => {
        b.classList.toggle(
          "active",
          parseFloat(b.dataset.size) === _notebookSize,
        );
      });
    }
    toolbarEl.querySelectorAll(".notebook-size-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        _notebookSize = parseFloat(btn.dataset.size);
        syncSizeUI();
      });
    });
    document
      .getElementById("noteNotebookSizeSlider")
      ?.addEventListener("input", (e) => {
        _notebookSize = parseFloat(e.target.value);
        syncSizeUI();
      });

    document
      .getElementById("noteNotebookClear")
      ?.addEventListener("click", () => {
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = NOTEBOOK_PAPER_BG;
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
      });
  }

  return {
    getDataUrl: () => canvasEl.toDataURL("image/png"),
  };
}
