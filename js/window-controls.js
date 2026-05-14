/**
 * Contrôles de fenêtre personnalisés pour Electron
 * Gère les boutons de minimiser, agrandir/réduire, fermer
 */

// Initialiser les contrôles de fenêtre
function initWindowControls() {
  // Vérifier si nous sommes dans Electron
  if (!window.electronAPI) {
    console.log("Mode web - contrôles de fenêtre désactivés");
    return;
  }

  console.log("Mode Electron - initialisation des contrôles de fenêtre");

  // Afficher les contrôles
  const windowControls = document.getElementById("windowControls");
  if (windowControls) {
    windowControls.style.display = "flex";

    // Ajouter la plateforme comme attribut pour le CSS
    document.body.setAttribute("data-platform", window.electronAPI.platform);
    document.body.setAttribute("data-electron", "true");
  }

  // Récupérer les boutons
  const minimizeBtn = document.getElementById("windowMinimize");
  const maximizeBtn = document.getElementById("windowMaximize");
  const closeBtn = document.getElementById("windowClose");

  // Icônes pour les états maximisé/normal
  const maximizeIcon = `
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 3v6h6V3H3z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const restoreIcon = `
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 4v4h4V4H4z M2 2h8v8H2z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  // Mettre à jour l'icône du bouton maximise/restore
  function updateMaximizeIcon(isMaximized) {
    if (maximizeBtn) {
      maximizeBtn.innerHTML = isMaximized ? restoreIcon : maximizeIcon;
      maximizeBtn.title = isMaximized ? "Restaurer" : "Agrandir";
    }
  }

  // Écouter les changements d'état de maximisation
  window.electronAPI.onWindowMaximized((isMaximized) => {
    updateMaximizeIcon(isMaximized);
  });

  // Gérer le clic sur le bouton minimiser
  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => {
      window.electronAPI.minimizeWindow();
    });
  }

  // Gérer le clic sur le bouton maximise/restore
  if (maximizeBtn) {
    maximizeBtn.addEventListener("click", () => {
      window.electronAPI.maximizeWindow();
    });
  }

  // Gérer le clic sur le bouton fermer
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.electronAPI.closeWindow();
    });
  }

  // Ajouter le drag pour la fenêtre (barre de titre personnalisée)
  initWindowDrag();
}

// Initialiser le drag natif (via -webkit-app-region) et double-clic pour maximiser/restaurer
function initWindowDrag() {
  const topbar = document.querySelector(".topbar");
  if (!topbar || !window.electronAPI) return;

  // Double-clic sur la topbar (hors boutons) = maximiser/restaurer
  topbar.addEventListener("dblclick", (e) => {
    // Ne pas déclencher si on double-clique sur un bouton, input, etc.
    const tag = e.target.tagName.toLowerCase();
    if (
      tag === "button" ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      tag === "a"
    ) {
      return;
    }
    // Vérifier aussi les parents
    let parent = e.target.parentElement;
    while (parent && parent !== topbar) {
      const ptag = parent.tagName.toLowerCase();
      if (
        ptag === "button" ||
        ptag === "input" ||
        ptag === "textarea" ||
        ptag === "select" ||
        ptag === "a"
      ) {
        return;
      }
      parent = parent.parentElement;
    }
    window.electronAPI.maximizeWindow();
  });
}

// Initialiser au chargement du DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWindowControls);
} else {
  initWindowControls();
}

// Exposer pour le débogage
window.initWindowControls = initWindowControls;
