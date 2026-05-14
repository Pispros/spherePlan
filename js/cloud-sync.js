/**
 * Cloud Sync — synchronisation des projets avec PocketBase
 * Backend: https://apw.naanocorp.com
 *
 * Flow :
 *   1) Avant toute opération cloud → ensureCloudAuth()
 *      - si aucun token / token expiré → modal d'authentification
 *      - si token expire dans < 2 jours → tentative de refresh
 *   2) Upload global  : envoi projet par projet (POST si nouveau, PATCH sinon)
 *   3) Download global: GET de tous les records de l'utilisateur, remplacement local
 *   4) Sync projet    : upload du projet courant uniquement
 *
 * Schéma PocketBase attendu (collection "projects") :
 *   - owner     (relation users, required)
 *   - localId   (text, required, unique with owner)
 *   - name      (text)
 *   - data      (json) — payload complet du projet
 */

const CLOUD = {
  baseUrl: "https://apw.naanocorp.com",
  authStorageKey: "naanoplanner:cloud-auth:v1",

  // Session active (en mémoire)
  token: null,
  userId: null,
  email: null,
  firstName: "",
  lastName: "",
  expiresAt: null, // ms timestamp Unix

  // État de synchro courant (évite les opérations concurrentes)
  syncing: false,
};

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/* ─── JWT helpers ──────────────────────────────────────────────────── */

function _decodeJWT(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function _tokenExpiresAt(token) {
  const p = _decodeJWT(token);
  if (!p || !p.exp) return null;
  return p.exp * 1000;
}

/* ─── Auth persistence (localStorage) ──────────────────────────────── */

function loadCloudAuth() {
  try {
    const raw = localStorage.getItem(CLOUD.authStorageKey);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data.token || !data.userId) return;
    const exp = _tokenExpiresAt(data.token);
    if (!exp || exp <= Date.now()) {
      // Token expiré — purge silencieuse
      localStorage.removeItem(CLOUD.authStorageKey);
      return;
    }
    CLOUD.token = data.token;
    CLOUD.userId = data.userId;
    CLOUD.email = data.email || "";
    CLOUD.firstName = data.firstName || "";
    CLOUD.lastName = data.lastName || "";
    CLOUD.expiresAt = exp;
  } catch (err) {
    console.warn("Cloud auth: erreur de chargement", err);
  }
}

function saveCloudAuth() {
  try {
    if (!CLOUD.token) {
      localStorage.removeItem(CLOUD.authStorageKey);
      return;
    }
    localStorage.setItem(
      CLOUD.authStorageKey,
      JSON.stringify({
        token: CLOUD.token,
        userId: CLOUD.userId,
        email: CLOUD.email,
        firstName: CLOUD.firstName,
        lastName: CLOUD.lastName,
      }),
    );
  } catch (err) {
    console.warn("Cloud auth: erreur de sauvegarde", err);
  }
}

function clearCloudAuth() {
  CLOUD.token = null;
  CLOUD.userId = null;
  CLOUD.email = null;
  CLOUD.firstName = "";
  CLOUD.lastName = "";
  CLOUD.expiresAt = null;
  try {
    localStorage.removeItem(CLOUD.authStorageKey);
  } catch {}
}

/* ─── PocketBase REST helpers ──────────────────────────────────────── */

async function _pbRequest(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  if (CLOUD.token && !opts.skipAuth) {
    headers.Authorization = `Bearer ${CLOUD.token}`;
  }
  const res = await fetch(`${CLOUD.baseUrl}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* corps vide ou non-JSON */
  }
  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function pbLogin(email, password) {
  const data = await _pbRequest("/api/collections/users/auth-with-password", {
    method: "POST",
    body: { identity: email, password },
    skipAuth: true,
  });
  CLOUD.token = data.token;
  CLOUD.userId = data.record.id;
  CLOUD.email = data.record.email || email;
  CLOUD.firstName = data.record.firstName || "";
  CLOUD.lastName = data.record.lastName || "";
  CLOUD.expiresAt = _tokenExpiresAt(data.token);
  saveCloudAuth();
  return data;
}

async function pbSignup(email, password, passwordConfirm, firstName, lastName) {
  await _pbRequest("/api/collections/users/records", {
    method: "POST",
    body: {
      email,
      password,
      passwordConfirm,
      firstName: firstName || "",
      lastName: lastName || "",
      emailVisibility: true,
    },
    skipAuth: true,
  });
  return pbLogin(email, password);
}

async function pbRefresh() {
  if (!CLOUD.token) throw new Error("Aucun jeton à rafraîchir");
  const data = await _pbRequest("/api/collections/users/auth-refresh", {
    method: "POST",
  });
  CLOUD.token = data.token;
  CLOUD.userId = data.record.id;
  CLOUD.email = data.record.email || CLOUD.email;
  // Refresh peut renvoyer des champs mis à jour (changement de prénom/nom)
  if (typeof data.record.firstName === "string") {
    CLOUD.firstName = data.record.firstName;
  }
  if (typeof data.record.lastName === "string") {
    CLOUD.lastName = data.record.lastName;
  }
  CLOUD.expiresAt = _tokenExpiresAt(data.token);
  saveCloudAuth();
  return data;
}

async function pbListMyProjects() {
  const filter = encodeURIComponent(`owner='${CLOUD.userId}'`);
  const items = [];
  let page = 1;
  // Pagination simple en cas de plus de 100 projets
  // (la collection est par owner, on s'attend rarement à dépasser ce volume)
  while (true) {
    const res = await _pbRequest(
      `/api/collections/projects/records?filter=${filter}&perPage=100&page=${page}&sort=-updated`,
    );
    items.push(...(res.items || []));
    if (!res.totalPages || page >= res.totalPages) break;
    page++;
  }
  return items;
}

async function pbFindByLocalId(localId) {
  const filter = encodeURIComponent(
    `owner='${CLOUD.userId}' && localId='${localId}'`,
  );
  const res = await _pbRequest(
    `/api/collections/projects/records?filter=${filter}&perPage=1`,
  );
  return (res.items || [])[0] || null;
}

async function pbCreateProject(payload) {
  return _pbRequest("/api/collections/projects/records", {
    method: "POST",
    body: payload,
  });
}

async function pbUpdateProject(recordId, payload) {
  return _pbRequest(`/api/collections/projects/records/${recordId}`, {
    method: "PATCH",
    body: payload,
  });
}

async function updateUserLang() {
  const lang = localStorage.getItem("currentLanguage");
  return _pbRequest(`/api/collections/users/records/${CLOUD.userId}`, {
    method: "PATCH",
    body: {
      language: lang ?? "fr",
    },
  });
}

/* ─── Auth gate ────────────────────────────────────────────────────── */

/**
 * Garantit qu'une session valide est disponible.
 * - si aucun token        → modal manuelle
 * - si token expiré       → modal manuelle
 * - si exp dans < 2 jours → tentative de refresh, fallback modal
 * - sinon                 → ok
 *
 * Retourne true si authentifié, false si l'utilisateur a annulé.
 */
async function ensureCloudAuth() {
  if (!CLOUD.token) loadCloudAuth();

  if (!CLOUD.token) {
    return await openCloudAuthModal("login");
  }

  const remaining = (CLOUD.expiresAt || 0) - Date.now();

  if (remaining <= 0) {
    clearCloudAuth();
    return await openCloudAuthModal("login");
  }

  if (remaining < TWO_DAYS_MS) {
    try {
      await pbRefresh();
      return true;
    } catch (err) {
      console.warn("Cloud auth: refresh échoué, reconnexion requise", err);
      clearCloudAuth();
      return await openCloudAuthModal("login");
    }
  }

  return true;
}

/* ─── Modal d'authentification ─────────────────────────────────────── */

let _authModalResolve = null;
let _authMode = "login"; // 'login' | 'signup'

function openCloudAuthModal(mode = "login") {
  return new Promise((resolve) => {
    // Si une modal est déjà en cours, on annule l'ancienne avant
    if (_authModalResolve) {
      const old = _authModalResolve;
      _authModalResolve = null;
      old(false);
    }
    _authModalResolve = resolve;
    _setAuthMode(mode);

    const emailEl = $("#cloudAuthEmail");
    const pwdEl = $("#cloudAuthPassword");
    const pwdConfirmEl = $("#cloudAuthPasswordConfirm");
    const firstNameEl = $("#cloudAuthFirstName");
    const lastNameEl = $("#cloudAuthLastName");
    if (pwdEl) pwdEl.value = "";
    if (pwdConfirmEl) pwdConfirmEl.value = "";
    if (firstNameEl) firstNameEl.value = "";
    if (lastNameEl) lastNameEl.value = "";
    if (emailEl && CLOUD.email) emailEl.value = CLOUD.email;
    _setAuthError("");

    openModal("cloudAuthBackdrop");
    setTimeout(
      () =>
        mode === "signup" && firstNameEl
          ? firstNameEl.focus()
          : emailEl && emailEl.focus(),
      100,
    );
  });
}

function _resolveAuthModal(success) {
  closeModal("cloudAuthBackdrop");
  if (_authModalResolve) {
    const r = _authModalResolve;
    _authModalResolve = null;
    r(!!success);
  }
}

function _setAuthMode(mode) {
  _authMode = mode === "signup" ? "signup" : "login";
  document.querySelectorAll("#cloudAuthBackdrop .auth-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === _authMode);
  });
  const title = $("#cloudAuthTitle");
  const subtitle = $("#cloudAuthSubtitle");
  const submit = $("#cloudAuthSubmit");
  const pwdConfirmField = $("#cloudAuthPasswordConfirmField");
  const namesField = $("#cloudAuthNamesField");
  if (title) {
    title.textContent = t(
      _authMode === "signup" ? "cloudAuthSignupTitle" : "cloudAuthLoginTitle",
    );
  }
  if (subtitle) {
    subtitle.textContent = t(
      _authMode === "signup"
        ? "cloudAuthSignupSubtitle"
        : "cloudAuthLoginSubtitle",
    );
  }
  if (submit) {
    submit.textContent = t(
      _authMode === "signup" ? "cloudAuthSignupBtn" : "cloudAuthLoginBtn",
    );
  }
  if (pwdConfirmField) {
    pwdConfirmField.style.display = _authMode === "signup" ? "" : "none";
  }
  if (namesField) {
    namesField.style.display = _authMode === "signup" ? "" : "none";
  }
  _setAuthError("");
}

function _setAuthError(msg) {
  const el = $("#cloudAuthError");
  if (!el) return;
  if (!msg) {
    el.style.display = "none";
    el.textContent = "";
  } else {
    el.style.display = "";
    el.textContent = msg;
  }
}

function _translatePbError(err) {
  if (err?.status === 401 || err?.status === 403) {
    return t("cloudAuthInvalid");
  }
  if (err?.status === 400 && err?.data?.data) {
    // Format PB: { data: { fieldName: { code, message } } }
    const fields = err.data.data;
    const firstField = Object.keys(fields)[0];
    if (firstField) {
      const fieldErr = fields[firstField];
      const m = fieldErr?.message || "";
      return `${firstField} : ${m || err.message}`;
    }
  }
  return err?.message || t("cloudAuthError");
}

async function _submitCloudAuth() {
  const emailEl = $("#cloudAuthEmail");
  const pwdEl = $("#cloudAuthPassword");
  const pwdConfirmEl = $("#cloudAuthPasswordConfirm");
  const firstNameEl = $("#cloudAuthFirstName");
  const lastNameEl = $("#cloudAuthLastName");
  const submit = $("#cloudAuthSubmit");

  const email = (emailEl?.value || "").trim();
  const password = pwdEl?.value || "";
  const firstName = (firstNameEl?.value || "").trim();
  const lastName = (lastNameEl?.value || "").trim();

  if (!email || !password) {
    _setAuthError(t("cloudAuthFieldsRequired"));
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    _setAuthError(t("cloudAuthEmailInvalid"));
    return;
  }

  if (_authMode === "signup") {
    const confirm = pwdConfirmEl?.value || "";
    if (password !== confirm) {
      _setAuthError(t("cloudAuthPasswordMismatch"));
      return;
    }
    if (password.length < 8) {
      _setAuthError(t("cloudAuthPasswordTooShort"));
      return;
    }
    if (!firstName || !lastName) {
      _setAuthError(t("cloudAuthNamesRequired"));
      return;
    }
  }

  submit.disabled = true;
  const oldText = submit.textContent;
  submit.textContent = t("cloudAuthInProgress");
  _setAuthError("");

  try {
    if (_authMode === "signup") {
      await pbSignup(email, password, password, firstName, lastName);
    } else {
      await pbLogin(email, password);
    }
    showToast(t("cloudAuthSuccess"));
    _updateCloudUiState();
    updateCloudPopoverUi();
    _resolveAuthModal(true);
  } catch (err) {
    console.error("Cloud auth error:", err);
    _setAuthError(_translatePbError(err));
  } finally {
    submit.disabled = false;
    submit.textContent = oldText;
  }
}

function initCloudAuthModal() {
  const submitBtn = $("#cloudAuthSubmit");
  const tabs = document.querySelectorAll("#cloudAuthBackdrop .auth-tab");
  const closeBtn = document.querySelector("#cloudAuthBackdrop .modal-close");
  const cancelBtn = $("#cloudAuthCancel");
  const backdrop = $("#cloudAuthBackdrop");

  if (submitBtn) submitBtn.addEventListener("click", _submitCloudAuth);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => _setAuthMode(tab.dataset.mode));
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => _resolveAuthModal(false));
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => _resolveAuthModal(false));
  }
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) _resolveAuthModal(false);
    });
  }

  // Soumission au clavier (Enter)
  [
    "cloudAuthFirstName",
    "cloudAuthLastName",
    "cloudAuthEmail",
    "cloudAuthPassword",
    "cloudAuthPasswordConfirm",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        _submitCloudAuth();
      }
    });
  });
}

/* ─── (Dé)sérialisation projet ↔ cloud ─────────────────────────────── */

function _projectToCloudPayload(proj) {
  // Defensive: recompute fresh metrics before serialization, regardless of
  // whether the caller (typically _buildPbRecord) already did. This costs
  // ~O(nodes) and guarantees the JSON in `data` matches the top-level PB
  // columns exactly, even if proj.percentage / proj.status have drifted.
  if (typeof recomputeProjectMetrics === "function") {
    recomputeProjectMetrics(proj);
  }
  const pct = computeProjectPercentage(proj);
  const status =
    pct === 100
      ? "completed"
      : proj.status === "completed"
        ? "completed"
        : "pending";

  // Forme stable et portable (équivalent au format export local)
  return {
    name: proj.name,
    description: proj.description || "",
    model: proj.model || "?",
    provider: proj.provider || "",
    color: proj.color || "",
    homeX: typeof proj.homeX === "number" ? proj.homeX : null,
    homeY: typeof proj.homeY === "number" ? proj.homeY : null,
    // Lifecycle — always freshly computed, never the cached value
    status,
    percentage: pct,
    startDate: proj.startDate || null,
    endDate: proj.endDate || null,
    createdAt: proj.createdAt || null,
    updatedAt: proj.updatedAt || null,
    nodes: (proj.nodes || []).map((n) => ({
      id: n.id,
      title: n.title,
      description: n.description,
      category: n.category,
      status: n.status,
      startDate: n.startDate,
      endDate: n.endDate,
      prerequisites: n.prerequisites || [],
      resources: n.resources || [],
      events: (n.events || []).map((ev) => ({
        name: ev.name || "",
        type: ev.type === "handwritten" ? "handwritten" : "text",
        description: ev.description || "",
        canvasData: ev.canvasData || "",
      })),
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
    edges: (proj.edges || []).map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type,
    })),
    notes: (proj.notes || []).map((n) => ({
      id: n.id,
      title: n.title || "",
      type: n.type === "handwritten" ? "handwritten" : "text",
      content: n.content || "",
      canvasData: n.canvasData || "",
      createdAt: n.createdAt || null,
      updatedAt: n.updatedAt || null,
    })),
    syncVersion: 2,
  };
}

/**
 * Construit le record PocketBase complet à envoyer (POST/PATCH).
 * - les colonnes top-level (owner, localId, name, status, percentage)
 *   sont indexables/triables côté PB
 * - le payload entier est dans `data` (json) pour la portabilité
 */
function _buildPbRecord(proj) {
  // Recompute first so the top-level PB columns AND the json `data` blob
  // share the exact same fresh values. (`_projectToCloudPayload` will
  // recompute again — that's intentional and cheap.)
  if (typeof recomputeProjectMetrics === "function") {
    recomputeProjectMetrics(proj);
  }
  const pct = computeProjectPercentage(proj);
  const status =
    pct === 100
      ? "completed"
      : proj.status === "completed"
        ? "completed"
        : "pending";
  return {
    owner: CLOUD.userId,
    localId: proj.id,
    name: proj.name || "Sans titre",
    status,
    percentage: pct,
    data: _projectToCloudPayload(proj),
  };
}

function _cloudDataToProject(localId, data, recordTopLevel) {
  // recordTopLevel = champs PB top-level (status, percentage, cloud id)
  const top = recordTopLevel || {};
  return {
    id: localId,
    name: data.name || top.name || "Sans titre",
    description: data.description || "",
    model: data.model || "?",
    provider: data.provider || STATE.selectedProvider,
    color: data.color || COLORS[0],
    homeX: typeof data.homeX === "number" ? data.homeX : undefined,
    homeY: typeof data.homeY === "number" ? data.homeY : undefined,
    // Lifecycle (top-level PB → fallback data → fallback default)
    status: top.status || data.status || "pending",
    percentage:
      typeof top.percentage === "number"
        ? top.percentage
        : typeof data.percentage === "number"
          ? data.percentage
          : 0,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    createdAt: data.createdAt || top.created || null,
    updatedAt: data.updatedAt || top.updated || null,
    cloudId: top.id || null,
    nodes: (data.nodes || []).map((n, i) => ({
      id: n.id || `n_${localId}_${i}`,
      title: n.title || "",
      description: n.description || "",
      category: n.category || "build",
      status: n.status || "pending",
      startDate: n.startDate,
      endDate: n.endDate,
      prerequisites: n.prerequisites || [],
      resources: n.resources || [],
      events: Array.isArray(n.events)
        ? n.events.map((ev) => ({
            name: String(ev?.name || ""),
            type: ev?.type === "handwritten" ? "handwritten" : "text",
            description: String(ev?.description || ""),
            canvasData: String(ev?.canvasData || ""),
          }))
        : [],
      subtasks: Array.isArray(n.subtasks)
        ? n.subtasks.map((s, j) => ({
            id: s.id || `st_${localId}_${i}_${j}`,
            title: String(s.title || ""),
            description: String(s.description || ""),
            estimatedDays: Number(s.estimatedDays) || 0,
            done: !!s.done,
          }))
        : [],
      x: typeof n.x === "number" ? n.x : 100,
      y: typeof n.y === "number" ? n.y : 100,
    })),
    edges: (data.edges || []).map((e) => ({
      from: e.from,
      to: e.to,
      type: e.type || "solid",
    })),
    notes: Array.isArray(data.notes)
      ? data.notes.map((n, i) => ({
          id: n.id || `note_${localId}_${i}`,
          title: String(n.title || ""),
          type: n.type === "handwritten" ? "handwritten" : "text",
          content: String(n.content || ""),
          canvasData: String(n.canvasData || ""),
          createdAt: n.createdAt || new Date().toISOString(),
          updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
        }))
      : [],
  };
}

/* ─── Upload : tous les projets ────────────────────────────────────── */

async function startCloudUploadAll() {
  if (CLOUD.syncing) return;

  CLOUD.syncing = true;
  try {
    const ok = await ensureCloudAuth();
    if (!ok) return;

    _showSyncIndicator("upload", 0, t("cloudSyncStarting"));

    const projects = Object.values(STATE.projects);
    const total = projects.length;
    if (total === 0) {
      showToast(t("cloudNoLocalProjects"));
      return;
    }

    // Récupère l'index distant une seule fois → POST vs PATCH
    _updateSyncIndicator(1, t("cloudSyncFetching"));
    const remote = await pbListMyProjects();
    const remoteByLocalId = new Map();
    for (const r of remote) {
      if (r.localId) remoteByLocalId.set(r.localId, r);
    }

    let done = 0;
    let failed = 0;
    for (const proj of projects) {
      const recordPayload = _buildPbRecord(proj);
      try {
        const existing = remoteByLocalId.get(proj.id);
        if (existing) {
          const updated = await pbUpdateProject(existing.id, recordPayload);
          proj.cloudId = updated?.id || existing.id;
        } else {
          const created = await pbCreateProject(recordPayload);
          proj.cloudId = created?.id || null;
        }
      } catch (err) {
        console.error("Upload échoué pour", proj.name, err);
        failed++;
      }
      done++;
      const pct = Math.round((done / total) * 100);
      _updateSyncIndicator(pct, `${done}/${total} · ${pct}%`);
    }

    // Persiste les cloudId attribués
    saveProjects();

    if (failed > 0) {
      showToast(
        t("cloudUploadPartial")
          .replace("{ok}", String(total - failed))
          .replace("{total}", String(total)),
        "error",
      );
    } else {
      showToast(t("cloudUploadSuccess").replace("{n}", String(total)));
    }
  } catch (err) {
    console.error(err);
    showToast(`${t("cloudUploadError")} : ${err.message}`, "error");
  } finally {
    _hideSyncIndicator();
    CLOUD.syncing = false;
  }
}

/* ─── Download : tous les projets ──────────────────────────────────── */

async function startCloudDownloadAll() {
  if (CLOUD.syncing) return;

  CLOUD.syncing = true;
  try {
    const ok = await ensureCloudAuth();
    if (!ok) return;

    _showSyncIndicator("download", 1, t("cloudSyncFetching"));

    const items = await pbListMyProjects();
    if (items.length === 0) {
      showToast(t("cloudNoCloudProjects"));
      return;
    }

    // Détection des projets locaux orphelins (présents en local, absents du cloud)
    const cloudLocalIds = new Set(
      items.map((it) => it.localId).filter(Boolean),
    );
    const orphans = Object.values(STATE.projects).filter(
      (p) => !cloudLocalIds.has(p.id),
    );

    // Application des records cloud → state local
    const total = items.length;
    let done = 0;
    for (const it of items) {
      const localId = it.localId || `p_cloud_${it.id}`;
      const data = it.data || {};
      STATE.projects[localId] = _cloudDataToProject(localId, data, it);
      done++;
      const pct = Math.round((done / total) * 100);
      _updateSyncIndicator(pct, `${done}/${total} · ${pct}%`);
      // Cède la main à l'UI (les events PB sont rapides, mais 1 tick aide)
      if (done % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    // Décision pour les orphelins (pendant la confirmation, on masque l'indicateur
    // pour ne pas continuer à laisser tourner l'animation alors qu'on attend
    // une réponse utilisateur)
    if (orphans.length > 0) {
      _hideSyncIndicator();
      const decision = await _askOrphanDecision(orphans);
      if (decision === "delete") {
        for (const o of orphans) {
          delete STATE.projects[o.id];
        }
        // Si le projet courant a été supprimé, retour à l'accueil
        if (STATE.currentProjectId && !STATE.projects[STATE.currentProjectId]) {
          STATE.currentProjectId = null;
        }
      }
    }

    saveProjects();
    if (typeof renderProjectMenu === "function") renderProjectMenu();
    if (typeof renderCurrentProject === "function") renderCurrentProject();

    showToast(t("cloudDownloadSuccess").replace("{n}", String(total)));
  } catch (err) {
    console.error(err);
    showToast(`${t("cloudDownloadError")} : ${err.message}`, "error");
  } finally {
    _hideSyncIndicator();
    CLOUD.syncing = false;
  }
}

/* ─── Sync projet courant uniquement ───────────────────────────────── */

async function startCloudSyncCurrentProject() {
  const proj = getCurrentProject();
  if (!proj) {
    showToast(t("cloudNoProjectOpen"), "error");
    return;
  }
  if (CLOUD.syncing) return;
  const btn = $("#projectSyncBtn");

  CLOUD.syncing = true;
  try {
    const ok = await ensureCloudAuth();
    if (!ok) return;

    // Indicateur global dans la topbar + spinner local sur le bouton projet
    _setBtnSyncing(btn, true);
    _showSyncIndicator("upload", 0, t("cloudSyncStarting"));

    const recordPayload = _buildPbRecord(proj);

    _updateSyncIndicator(50, `1/1 · 50%`);

    // Pas de requête de liste avant : on utilise le cloudId mémorisé
    // localement pour décider POST vs PATCH. Si le record a été supprimé
    // côté cloud (404 sur PATCH), on retombe sur POST.
    let result;
    if (proj.cloudId) {
      try {
        result = await pbUpdateProject(proj.cloudId, recordPayload);
      } catch (err) {
        if (err?.status === 404) {
          // Record supprimé côté cloud → on recrée
          proj.cloudId = null;
          result = await pbCreateProject(recordPayload);
        } else {
          throw err;
        }
      }
    } else {
      // Premier upload de ce projet
      try {
        result = await pbCreateProject(recordPayload);
      } catch (err) {
        // 400 sur (owner, localId) unique → un record existe déjà côté cloud
        // pour ce projet (créé sur un autre appareil par ex.). Dans ce cas on
        // accepte d'aller chercher l'id existant *uniquement* en cas de conflit.
        const isUniqueConflict =
          err?.status === 400 &&
          JSON.stringify(err?.data || {})
            .toLowerCase()
            .includes("unique");
        if (!isUniqueConflict) throw err;
        const existing = await pbFindByLocalId(proj.id);
        if (!existing) throw err;
        result = await pbUpdateProject(existing.id, recordPayload);
      }
    }

    proj.cloudId = result?.id || proj.cloudId;
    saveProjects();
    _updateSyncIndicator(100, `1/1 · 100%`);
    showToast(t("cloudProjectSyncSuccess").replace("{name}", proj.name || ""));
  } catch (err) {
    console.error(err);
    showToast(`${t("cloudProjectSyncError")} : ${err.message}`, "error");
  } finally {
    _setBtnSyncing(btn, false);
    _hideSyncIndicator();
    CLOUD.syncing = false;
  }
}

/* ─── Décision orphelins : conserver vs supprimer ──────────────────── */

function _askOrphanDecision(orphans) {
  return new Promise((resolve) => {
    let resolved = false;
    const settle = (decision) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(decision);
    };

    const cancelBtn = $("#confirmCancelBtn");
    const closeBtn = document.querySelector("#confirmBackdrop .modal-close");
    const backdrop = $("#confirmBackdrop");
    const onKeep = () => settle("keep");
    const onBackdrop = (e) => {
      if (e.target === backdrop) settle("keep");
    };

    function cleanup() {
      cancelBtn.removeEventListener("click", onKeep);
      if (closeBtn) closeBtn.removeEventListener("click", onKeep);
      backdrop.removeEventListener("click", onBackdrop);
    }

    cancelBtn.addEventListener("click", onKeep);
    if (closeBtn) closeBtn.addEventListener("click", onKeep);
    backdrop.addEventListener("click", onBackdrop);

    const list = orphans
      .slice(0, 6)
      .map((p) => `• ${p.name || "(sans nom)"}`)
      .join("\n");
    const more = orphans.length > 6 ? `\n…(+${orphans.length - 6})` : "";
    const message = t("cloudOrphanMsg")
      .replace("{n}", String(orphans.length))
      .replace("{list}", list + more);

    openConfirmModal(
      t("cloudOrphanTitle"),
      message,
      t("cloudOrphanDelete"),
      t("cloudOrphanKeep"),
      () => settle("delete"),
    );
  });
}

/* ─── UI helpers : indicateur global dans la topbar ────────────────── */

/**
 * Affiche l'indicateur de synchro dans la topbar.
 * @param {'upload'|'download'} direction — sens de la flèche
 * @param {number} pct — pourcentage initial (0..100)
 * @param {string} [tip] — tooltip (texte d'état)
 */
function _showSyncIndicator(direction, pct, tip) {
  const ind = $("#cloudSyncIndicator");
  const pctEl = $("#cloudSyncPct");
  if (!ind || !pctEl) return;
  ind.classList.remove("error");
  ind.classList.toggle("download", direction === "download");
  ind.style.display = "inline-flex";
  pctEl.textContent = `${Math.round(pct)}%`;
  if (tip) ind.title = tip;
}

function _updateSyncIndicator(pct, tip) {
  const ind = $("#cloudSyncIndicator");
  const pctEl = $("#cloudSyncPct");
  if (!ind || !pctEl) return;
  pctEl.textContent = `${Math.round(pct)}%`;
  if (tip) ind.title = tip;
}

function _hideSyncIndicator() {
  const ind = $("#cloudSyncIndicator");
  if (!ind) return;
  ind.style.display = "none";
  ind.classList.remove("download", "error");
  const pctEl = $("#cloudSyncPct");
  if (pctEl) pctEl.textContent = "0%";
  ind.title = "";
}

/* ─── UI helpers : bouton sync projet (topbar) ─────────────────────── */

function _setBtnSyncing(btn, on) {
  if (!btn) return;
  btn.classList.toggle("syncing", !!on);
  btn.disabled = !!on;
}

/* ─── Mise à jour visuelle (compte connecté / déconnecté) ──────────── */

function _updateCloudUiState() {
  const status = $("#cloudAuthStatus");
  if (status) {
    if (CLOUD.token && CLOUD.email) {
      status.textContent = CLOUD.email;
      status.classList.add("connected");
    } else {
      status.textContent = t("cloudNotConnected");
      status.classList.remove("connected");
    }
  }
}

/**
 * Met à jour l'en-tête de la popover des paramètres rapides :
 *  - si connecté → affiche "Prénom Nom" comme titre, email comme sous-titre
 *  - sinon       → titre "Paramètres rapides", sous-titre "Non connecté"
 * Met également à jour le libellé du bouton Connexion/Déconnexion.
 */
function updateCloudPopoverUi() {
  const titleEl = $("#popoverTitle");
  const subtitleEl = $("#popoverSubtitle");
  const authBtn = $("#cloudAuthBtn");
  const authBtnLabel = $("#cloudAuthBtnLabel");

  const connected = !!CLOUD.token;

  if (titleEl) {
    if (connected) {
      const fullName =
        `${CLOUD.firstName || ""} ${CLOUD.lastName || ""}`.trim();
      titleEl.textContent = fullName || CLOUD.email || t("quickSettingsTitle");
    } else {
      titleEl.textContent = t("quickSettingsTitle");
    }
  }
  if (subtitleEl) {
    if (connected && CLOUD.email) {
      subtitleEl.textContent = CLOUD.email;
      subtitleEl.style.display = "";
    } else {
      subtitleEl.textContent = t("cloudNotConnected");
      subtitleEl.style.display = connected ? "none" : "";
    }
  }
  if (authBtn) {
    authBtn.classList.toggle("danger", connected);
    authBtn.title = connected ? t("cloudLogoutBtn") : t("cloudAuthLoginBtn");
  }
  if (authBtnLabel) {
    authBtnLabel.textContent = connected
      ? t("cloudLogoutBtn")
      : t("cloudAuthLoginBtn");
  }
}

/**
 * Déconnexion : purge les credentials locaux + rafraîchit l'UI.
 * (Pas d'appel réseau — PocketBase ne nécessite rien côté serveur pour
 * invalider une session JWT.)
 */
function cloudLogout() {
  clearCloudAuth();
  _updateCloudUiState();
  updateCloudPopoverUi();
  showToast(t("cloudLogoutSuccess"));
}

/**
 * Ré-applique les libellés du module aux éléments DOM (appelé par i18n).
 */
function applyCloudSyncTranslations() {
  // Boutons popover
  const upText = document.querySelector(
    "#cloudUploadBtn [data-i18n='cloudUpload']",
  );
  if (upText) upText.textContent = t("cloudUpload");
  const dnText = document.querySelector(
    "#cloudDownloadBtn [data-i18n='cloudDownload']",
  );
  if (dnText) dnText.textContent = t("cloudDownload");

  // Bouton sync projet (titre)
  const projectSyncBtn = $("#projectSyncBtn");
  if (projectSyncBtn) projectSyncBtn.title = t("cloudProjectSyncTitle");

  // Modal d'auth
  const eyebrow = document.querySelector(
    "#cloudAuthBackdrop .modal-eyebrow[data-i18n='cloudAuthEyebrow']",
  );
  if (eyebrow) eyebrow.textContent = t("cloudAuthEyebrow");

  const tabLogin = document.querySelector(
    "#cloudAuthBackdrop .auth-tab[data-mode='login']",
  );
  if (tabLogin) tabLogin.textContent = t("cloudAuthLogin");
  const tabSignup = document.querySelector(
    "#cloudAuthBackdrop .auth-tab[data-mode='signup']",
  );
  if (tabSignup) tabSignup.textContent = t("cloudAuthSignup");

  const labelEmail = document.querySelector(
    "#cloudAuthBackdrop label[for='cloudAuthEmail']",
  );
  if (labelEmail) labelEmail.textContent = t("cloudAuthEmailLabel");
  const labelPwd = document.querySelector(
    "#cloudAuthBackdrop label[for='cloudAuthPassword']",
  );
  if (labelPwd) labelPwd.textContent = t("cloudAuthPasswordLabel");
  const labelPwdConfirm = document.querySelector(
    "#cloudAuthBackdrop label[for='cloudAuthPasswordConfirm']",
  );
  if (labelPwdConfirm) {
    labelPwdConfirm.textContent = t("cloudAuthPasswordConfirmLabel");
  }
  const labelFirstName = document.querySelector(
    "#cloudAuthBackdrop label[for='cloudAuthFirstName']",
  );
  if (labelFirstName) labelFirstName.textContent = t("cloudAuthFirstNameLabel");
  const labelLastName = document.querySelector(
    "#cloudAuthBackdrop label[for='cloudAuthLastName']",
  );
  if (labelLastName) labelLastName.textContent = t("cloudAuthLastNameLabel");

  const emailEl = $("#cloudAuthEmail");
  if (emailEl) emailEl.placeholder = t("cloudAuthEmailPlaceholder");
  const pwdEl = $("#cloudAuthPassword");
  if (pwdEl) pwdEl.placeholder = t("cloudAuthPasswordPlaceholder");
  const pwdConfirmEl = $("#cloudAuthPasswordConfirm");
  if (pwdConfirmEl) {
    pwdConfirmEl.placeholder = t("cloudAuthPasswordPlaceholder");
  }
  const firstNameEl = $("#cloudAuthFirstName");
  if (firstNameEl) firstNameEl.placeholder = t("cloudAuthFirstNamePlaceholder");
  const lastNameEl = $("#cloudAuthLastName");
  if (lastNameEl) lastNameEl.placeholder = t("cloudAuthLastNamePlaceholder");

  const cancelBtn = $("#cloudAuthCancel");
  if (cancelBtn) cancelBtn.textContent = t("cancel2");

  // Re-set du mode courant pour rafraîchir titre/sous-titre/CTA
  _setAuthMode(_authMode);

  _updateCloudUiState();
  updateCloudPopoverUi();
}

/* ─── Init ─────────────────────────────────────────────────────────── */

function initCloudSync() {
  loadCloudAuth();
  initCloudAuthModal();

  const uploadBtn = $("#cloudUploadBtn");
  const downloadBtn = $("#cloudDownloadBtn");
  const projectSyncBtn = $("#projectSyncBtn");
  const authBtn = $("#cloudAuthBtn");

  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      // La progression est affichée dans la topbar → on peut fermer la popover.
      if (typeof closeQuickSettingsPopover === "function") {
        closeQuickSettingsPopover();
      }
      startCloudUploadAll();
    });
  }
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      if (typeof closeQuickSettingsPopover === "function") {
        closeQuickSettingsPopover();
      }
      startCloudDownloadAll();
    });
  }
  if (projectSyncBtn) {
    projectSyncBtn.addEventListener("click", () => {
      startCloudSyncCurrentProject();
    });
  }

  // Bouton bas de popover : connexion ou déconnexion selon l'état
  if (authBtn) {
    authBtn.addEventListener("click", async () => {
      if (CLOUD.token) {
        cloudLogout();
      } else {
        if (typeof closeQuickSettingsPopover === "function") {
          closeQuickSettingsPopover();
        }
        await openCloudAuthModal("login");
      }
    });
  }

  applyCloudSyncTranslations();
  _updateCloudUiState();
  updateCloudPopoverUi();
}

// Expose globally
window.initCloudSync = initCloudSync;
window.startCloudUploadAll = startCloudUploadAll;
window.startCloudDownloadAll = startCloudDownloadAll;
window.startCloudSyncCurrentProject = startCloudSyncCurrentProject;
window.openCloudAuthModal = openCloudAuthModal;
window.clearCloudAuth = clearCloudAuth;
window.cloudLogout = cloudLogout;
window.applyCloudSyncTranslations = applyCloudSyncTranslations;
window.updateCloudPopoverUi = updateCloudPopoverUi;
window.updateUserLang = updateUserLang;
