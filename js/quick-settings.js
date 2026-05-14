/**
 * Gestionnaire des paramètres rapides (popover)
 */

// État de la popover
let quickSettingsOpen = false;

/**
 * Initialise la popover des paramètres rapides
 */
function initQuickSettings() {
  const quickSettingsBtn = $("#quickSettingsBtn");
  const quickSettingsPopover = $("#quickSettingsPopover");
  const closeQuickSettings = $("#closeQuickSettings");
  const quickSettingsBackdrop = $("#quickSettingsBackdrop");

  if (!quickSettingsBtn || !quickSettingsPopover) return;

  // Ouvrir/fermer la popover
  quickSettingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleQuickSettings();
  });

  // Fermer avec le bouton de fermeture
  closeQuickSettings.addEventListener("click", () => {
    closeQuickSettingsPopover();
  });

  // Fermer en cliquant en dehors
  quickSettingsBackdrop.addEventListener("click", () => {
    closeQuickSettingsPopover();
  });

  // Fermer avec la touche Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && quickSettingsOpen) {
      closeQuickSettingsPopover();
    }
  });

  // Gérer les boutons de la popover
  initQuickSettingsButtons();

  // Mettre à jour l'état des boutons
  updateQuickSettingsState();
}

/**
 * Basculer l'état d'ouverture de la popover
 */
function toggleQuickSettings() {
  if (quickSettingsOpen) {
    closeQuickSettingsPopover();
  } else {
    openQuickSettingsPopover();
  }
}

/**
 * Ouvrir la popover des paramètres rapides
 */
function openQuickSettingsPopover() {
  const quickSettingsPopover = $("#quickSettingsPopover");
  const quickSettingsBackdrop = $("#quickSettingsBackdrop");

  if (!quickSettingsPopover || !quickSettingsBackdrop) return;

  // Positionner la popover près du bouton
  const quickSettingsBtn = $("#quickSettingsBtn");
  if (quickSettingsBtn) {
    const rect = quickSettingsBtn.getBoundingClientRect();
    quickSettingsPopover.style.top = `${rect.bottom + 8}px`;
    quickSettingsPopover.style.right = `${window.innerWidth - rect.right}px`;
  }

  quickSettingsPopover.classList.add("open");
  quickSettingsBackdrop.style.display = "block";
  quickSettingsOpen = true;

  // Mettre à jour l'état des boutons
  updateQuickSettingsState();
  // Mettre à jour le header (nom de l'utilisateur) et le bouton login/logout
  if (typeof updateCloudPopoverUi === "function") {
    updateCloudPopoverUi();
  }
}

/**
 * Fermer la popover des paramètres rapides
 */
function closeQuickSettingsPopover() {
  const quickSettingsPopover = $("#quickSettingsPopover");
  const quickSettingsBackdrop = $("#quickSettingsBackdrop");

  if (!quickSettingsPopover || !quickSettingsBackdrop) return;

  quickSettingsPopover.classList.remove("open");
  quickSettingsBackdrop.style.display = "none";
  quickSettingsOpen = false;
}

/**
 * Initialiser les boutons de la popover
 */
function initQuickSettingsButtons() {
  const quickImportBtn = $("#quickImportBtn");
  const quickExportBtn = $("#quickExportBtn");
  const quickExportAllBtn = $("#quickExportAllBtn");
  const aiToggle = $("#aiToggle");
  const configureLLMsBtn = $("#configureLLMsBtn");
  const fullSettingsBtn = $("#fullSettingsBtn");

  if (configureLLMsBtn && !isElectronRuntime()) {
    configureLLMsBtn.style.display = "none";
  }

  // Importer projet
  if (quickImportBtn) {
    quickImportBtn.addEventListener("click", () => {
      closeQuickSettingsPopover();
      // Déclencher l'input file pour l'import
      const importInput = $("#importFileInput");
      if (importInput) importInput.click();
    });
  }

  // Exporter projet courant
  if (quickExportBtn) {
    quickExportBtn.addEventListener("click", () => {
      closeQuickSettingsPopover();
      if (typeof exportProject === "function") {
        exportProject();
      }
    });
  }

  // Exporter tous les projets (sur la liste / vue accueil)
  if (quickExportAllBtn) {
    quickExportAllBtn.addEventListener("click", () => {
      closeQuickSettingsPopover();
      if (typeof exportAllProjects === "function") {
        exportAllProjects();
      }
    });
  }

  // Toggle IA active
  if (aiToggle) {
    // Récupérer l'état initial depuis le state global
    aiToggle.checked = STATE?.aiEnabled !== false;

    aiToggle.addEventListener("change", (e) => {
      if (STATE) {
        STATE.aiEnabled = e.target.checked;
        // Mettre à jour le badge IA active dans le header
        updateAIPill();
        // Sauvegarder l'état
        saveState();
      }
    });
  }

  // Configurer LLMs (ouvrir les paramètres complets)
  if (configureLLMsBtn) {
    configureLLMsBtn.addEventListener("click", () => {
      closeQuickSettingsPopover();
      openSettings();
    });
  }

  // Paramètres complets (ouvrir la modal settings)
  if (fullSettingsBtn) {
    fullSettingsBtn.addEventListener("click", () => {
      closeQuickSettingsPopover();
      openSettings();
    });
  }
}

/**
 * Mettre à jour l'état des boutons de la popover
 */
function updateQuickSettingsState() {
  const quickExportBtn = $("#quickExportBtn");
  const quickExportAllBtn = $("#quickExportAllBtn");
  const aiToggle = $("#aiToggle");

  // Bouton "Exporter projet" : visible uniquement quand un projet est ouvert
  // Bouton "Exporter tous les projets" : visible uniquement sur la liste
  const hasProject = STATE?.currentProjectId !== null;
  const hasAny = Object.keys(STATE?.projects || {}).length > 0;
  if (quickExportBtn) {
    quickExportBtn.style.display = hasProject ? "" : "none";
    quickExportBtn.disabled = !hasProject;
  }
  if (quickExportAllBtn) {
    quickExportAllBtn.style.display = hasProject ? "none" : "";
    quickExportAllBtn.disabled = !hasAny;
  }

  // Toggle IA
  if (aiToggle && STATE) {
    aiToggle.checked = STATE.aiEnabled !== false;
  }
}

/**
 * Mettre à jour le badge IA active dans le header
 */
function updateAIPill() {
  const aiPill = document.querySelector(".ai-pill");
  if (!aiPill || !STATE) return;

  if (STATE.aiEnabled !== false) {
    aiPill.style.opacity = "1";
    aiPill.style.pointerEvents = "all";
  } else {
    aiPill.style.opacity = "0.4";
    aiPill.style.pointerEvents = "none";
  }
}

// Exposer les fonctions globalement
window.initQuickSettings = initQuickSettings;
window.toggleQuickSettings = toggleQuickSettings;
window.openQuickSettingsPopover = openQuickSettingsPopover;
window.closeQuickSettingsPopover = closeQuickSettingsPopover;
window.updateQuickSettingsState = updateQuickSettingsState;
window.updateAIPill = updateAIPill;
