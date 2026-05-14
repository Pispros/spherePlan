/* ─── TRANSLATIONS ──────────────────────────────────────────────────── */
const TRANSLATIONS = {
  fr: {
    // Topbar
    homeView: "Accueil",
    noProject: "Aucun projet",
    newProject: "Nouveau projet",
    exportJson: "Exporter JSON",
    importJson: "Importer",
    aiActive: "IA active",
    settings: "Paramètres",
    // Empty state
    buildFirstConstellation: "Construis ta première constellation",
    emptyDesc:
      "Donne un objectif à l'IA (en lui précisant de faire une recherche dédiée sur le net) et reçois une roadmap visuelle de tâches connectées, avec dates, ressources et dépendances. Tu valides chaque proposition avant qu'elle soit appliquée.",
    createProject: "Créer un projet",
    // Legend
    connections: "Liaisons",
    sequential: "Séquentielle",
    parallel: "Parallèle",
    critical: "Critique",
    optional: "Optionnelle",
    // Hints
    hintLink: "Créer un lien",
    hintNewTask: "Nouvelle tâche",
    hintDelete: "Effacer",
    hintDeselect: "Désélectionner",
    // Nodes
    pending: "À faire",
    active: "En cours",
    done: "Terminé",
    blocked: "Bloqué",
    toSchedule: "À planifier",
    task: "tâche",
    edit: "Éditer",
    noTasks: "Vide",
    noDescription: "Aucune description",
    details: "Détails",
    step: "étape",
    noProjects: "Aucun projet pour l'instant",
    // Detail panel
    title: "Titre",
    description: "Description",
    descPlaceholder: "Décris cette étape…",
    startDate: "Date de début",
    endDate: "Date de fin",
    status: "Statut",
    category: "Catégorie",
    research: "Recherche",
    build: "Construction",
    learn: "Apprentissage",
    tasks: "Tâches",
    informations: "Informations",
    train: "Entraînement",
    launch: "Lancement",
    resources: "Ressources",
    noResources: "Aucune ressource — utilise le réexamen IA pour en suggérer.",
    resourceTitle: "Titre de la ressource",
    resourceUrl: "URL (optionnel)",
    resourceTitleRequired: "Le titre est requis",
    openLink: "Ouvrir le lien",
    add: "Ajouter",
    confirmDeleteProject: "Supprimer le projet",
    confirmDeleteMessage:
      "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.",
    confirm: "Confirmer",
    cancel: "Annuler",
    delete: "Supprimer",
    reexploreBtn: "Réexplorer cette étape avec l'IA",
    addTask: "Ajouter une tâche",
    newTask: "Nouvelle tâche",
    // Events
    events: "Événements",
    addEvent: "+ Ajouter",
    noEvents: "Aucun événement — ajoute des notes ou annotations.",
    eventName: "Nom de l'événement",
    eventNamePlaceholder: "Ex. Réunion de lancement…",
    textNote: "Note texte",
    handwrittenNote: "Note manuscrite",
    writeHere: "Écris ici…",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    // Notebook
    pen: "Stylo",
    eraser: "Gomme",
    clear: "Effacer tout",
    fullscreen: "Plein écran",
    exitFullscreen: "Quitter le plein écran",
    // Project notes (multi-sheet notebook)
    notes: "Notes",
    notesTitle: "Notes du projet",
    notesSubtitle:
      "Un cahier dédié au projet. Ajoute autant de feuilles que tu veux : texte ou manuscrit.",
    addNote: "Ajouter une feuille",
    addNoteShort: "+ Feuille",
    notesFabLabel: "Notes",
    newNote: "Nouvelle feuille",
    noNotes: "Aucune feuille pour l'instant",
    noNotesHint: "Crée ta première feuille pour commencer à prendre des notes.",
    selectNote: "Sélectionne une feuille",
    selectNoteHint: "Choisis une feuille à gauche pour la prévisualiser.",
    noteTitle: "Titre de la feuille",
    noteTitlePlaceholder: "Ex. Idées initiales, Réunion du 12 mars…",
    notePreview: "Aperçu",
    expand: "Agrandir",
    untitledNote: "Sans titre",
    deleteNoteConfirm: "Supprimer cette feuille ?",
    deleteNoteMessage:
      "La feuille sera définitivement supprimée. Cette action est irréversible.",
    notesCount: "feuille(s)",
    updatedOn: "Mise à jour",
    createdOn: "Créée",
    closeEditor: "Fermer l'éditeur",
    saveNote: "Enregistrer la feuille",
    // Edge popover
    sequence: "Séquence",
    // Modal new project
    newProjectEyebrow: "Nouveau projet",
    newProjectTitle: "Donne vie à un nouvel objectif",
    newProjectSubtitle:
      "Décris ton intention. L'IA proposera une roadmap complète, que tu pourras ajuster avant qu'elle ne soit appliquée.",
    projectName: "Nom du projet",
    projectNamePlaceholder: "Ex. Lancer mon SaaS, Marathon Paris…",
    descriptionOptional: "Description (optionnelle)",
    descriptionPlaceholder:
      "Précise le contexte, les contraintes ou l'audience visée…",
    objective: "Objectif à décomposer",
    objectivePlaceholder:
      "Décris l'objectif que l'IA doit transformer en roadmap structurée.",
    modelToUse: "Modèle à utiliser",
    aiWillPropose:
      "L'IA proposera une roadmap. Tu valideras chaque étape avant qu'elle ne soit appliquée.",
    cancel2: "Annuler",
    generateRoadmap: "Générer avec l'IA",
    createEmpty: "Créer vide",
    generationSeparator: "GÉNÉRATION IA",
    noProviderHint:
      "Aucun fournisseur IA configuré. Tu peux créer le projet manuellement et ajouter des tâches à la main.",
    createEmptyOrGenerate: "Crée vide ou génère avec l'IA.",
    taskSingular: "tâche",
    taskPlural: "tâches",
    deletedSingular: "supprimée",
    deletedPlural: "supprimées",
    // Preview modal
    previewEyebrow: "Prévisualisation IA",
    previewTitle: "Roadmap proposée",
    previewSubtitle:
      "Édite, supprime ou ajoute des tâches avant d'appliquer. Rien n'est créé tant que tu ne valides pas.",
    previewTasksInfo: "tâches proposées",
    reject: "Rejeter",
    applyRoadmap: "Appliquer la roadmap",
    addTaskManually: "Ajouter une tâche manuellement",
    start: "Début",
    end: "Fin",
    // Reexplore
    reexploreEyebrow: "Réexamen IA",
    reexploreTitle: "Enrichissement proposé",
    reexploreSubtitle:
      "Ajuste les modifications proposées avant qu'elles ne soient appliquées à la tâche.",
    confirmationTitle: "Confirmation",
    confirmationMessage: "Êtes-vous sûr de vouloir effectuer cette action ?",
    aiProposes: "L'IA propose des révisions — tu décides.",
    applyChanges: "Appliquer les changements",
    proposedDescription: "Description proposée",
    whyMatters: "Pourquoi cette étape compte",
    suggestedResources: "Ressources suggérées",
    suggestedSubtasks: "Sous-tâches suggérées",
    subtasksNote:
      "Les sous-tâches seront enregistrées dans la tâche et tu pourras cocher chaque étape pour suivre la progression.",
    subtasks: "Sous-tâches",
    noSubtasks:
      "Aucune sous-tâche — utilise le ré-examen IA pour en suggérer ou ajoute-en manuellement.",
    newSubtask: "Nouvelle sous-tâche",
    markDone: "Marquer comme terminée",
    markUndone: "Marquer comme non terminée",
    markTaskDone: "Marquer la tâche comme terminée",
    taskDone: "Tâche terminée",
    warningPoint: "⚠ Point de vigilance",
    // Settings
    settingsEyebrow: "Paramètres",
    projectEditTitle: "Éditer le projet",
    projectLabel: "Projet",
    // Quick settings popover
    quickSettingsTitle: "Paramètres rapides",
    importProject: "Importer projet",
    exportProject: "Exporter projet",
    aiActiveToggle: "IA active",
    configureLLMs: "Configurer LLMs",
    fullSettings: "Paramètres complets",
    // Cloud sync
    cloudUpload: "Synchroniser Tous les Projets ↑ (Upload)",
    cloudDownload: "Synchroniser Tous les Projets ↓ (Download)",
    cloudSyncStarting: "Préparation…",
    cloudSyncFetching: "Récupération…",
    cloudUploadSuccess: "{n} projet(s) envoyé(s) au cloud",
    cloudUploadPartial: "{ok}/{total} projet(s) envoyé(s)",
    cloudUploadError: "Erreur d'envoi",
    cloudDownloadSuccess: "{n} projet(s) téléchargé(s) du cloud",
    cloudDownloadError: "Erreur de téléchargement",
    cloudNoLocalProjects: "Aucun projet local à synchroniser",
    cloudNoCloudProjects: "Aucun projet dans le cloud",
    cloudNoProjectOpen: "Ouvre un projet pour le synchroniser",
    cloudProjectSyncTitle: "Synchroniser ce projet avec le cloud",
    cloudProjectSyncSuccess: "« {name} » synchronisé",
    cloudProjectSyncError: "Synchro projet échouée",
    cloudOrphanTitle: "Projets locaux uniques",
    cloudOrphanMsg:
      "{n} projet(s) local/aux ne sont pas dans le cloud :\n\n{list}\n\nVoulez-vous les SUPPRIMER (ou les conserver localement) ?",
    cloudOrphanDelete: "Supprimer",
    cloudOrphanKeep: "Conserver",
    cloudNotConnected: "Non connecté",
    // Auth modal
    cloudAuthEyebrow: "Synchronisation cloud",
    cloudAuthLoginTitle: "Connexion",
    cloudAuthSignupTitle: "Inscription",
    cloudAuthLoginSubtitle:
      "Connecte-toi pour synchroniser tes projets avec le cloud.",
    cloudAuthSignupSubtitle:
      "Crée un compte pour commencer à synchroniser tes projets.",
    cloudAuthLogin: "Connexion",
    cloudAuthSignup: "Inscription",
    cloudAuthLoginBtn: "Se connecter",
    cloudAuthSignupBtn: "Créer un compte",
    cloudAuthInProgress: "Patiente…",
    cloudAuthEmailLabel: "Email",
    cloudAuthEmailPlaceholder: "vous@exemple.com",
    cloudAuthPasswordLabel: "Mot de passe",
    cloudAuthPasswordConfirmLabel: "Confirmer le mot de passe",
    cloudAuthPasswordPlaceholder: "••••••••",
    cloudAuthFieldsRequired: "Email et mot de passe requis",
    cloudAuthEmailInvalid: "Email invalide",
    cloudAuthPasswordMismatch: "Les mots de passe ne correspondent pas",
    cloudAuthPasswordTooShort: "Mot de passe trop court (min. 8 caractères)",
    cloudAuthInvalid: "Identifiants incorrects",
    cloudAuthSuccess: "Connecté",
    cloudAuthError: "Erreur d'authentification",
    cloudAuthFirstNameLabel: "Prénom",
    cloudAuthLastNameLabel: "Nom",
    cloudAuthFirstNamePlaceholder: "Jean",
    cloudAuthLastNamePlaceholder: "Dupont",
    cloudAuthNamesRequired: "Prénom et nom requis pour l'inscription",
    cloudLogoutBtn: "Se déconnecter",
    cloudLogoutSuccess: "Déconnecté",
    // Project lifecycle (form fields)
    status: "Statut",
    statusPending: "En cours",
    statusCompleted: "Terminé",
    startDate: "Date de début",
    endDate: "Date de fin",
    notDefined: "—",
    completion: "Avancement",
    // Misc missing keys
    importError: "Erreur d'import",
    imported: "importé",
    titlePlaceholder: "Sans titre",
    exportAllProjects: "Exporter tous les projets",
    // Quick settings (suite)
    projectDescriptionPlaceholder: "Description du projet...",
    aiProviders: "Fournisseurs IA",
    settingsSubtitle:
      "Saisis ta clé API et l'identifiant du modèle pour chaque fournisseur. Les clés sont chiffrées (AES-GCM) et stockées localement.",
    securityWarning: "Sécurité :",
    securityText:
      "les clés sont chiffrées avant stockage local, mais le code source contient le sel et la passphrase. Cette protection est de l'obfuscation. Ne pas utiliser sur un appareil partagé sans modifier",
    securityText2: "ENCRYPTION_SALT et ENCRYPTION_PASSPHRASE dans crypto.js.",
    providerAnthropic: "Anthropic - Claude",
    providerOpenAI: "OpenAI - GPT",
    providerDeepSeek: "DeepSeek",
    modelClaudePlaceholder: "claude-opus-4-7",
    modelOpenAIPlaceholder: "gpt-5.4",
    modelDeepSeekPlaceholder: "deepseek-v4-pro",
    modelClaudeInfo: "claude-opus-4-7 - claude-sonnet-4-6 - claude-haiku-4-5",
    modelOpenAIInfo: "gpt-5.5 - gpt-5.4 - gpt-5.4-mini - gpt-5",
    modelDeepSeekInfo: "deepseek-v4-pro - deepseek-v4-flash",
    modelId: "Identifiant du modèle",
    apiKey: "Clé API",
    test: "Tester",
    close: "Fermer",
    saveSettings: "Enregistrer",
    keysNeverLeave:
      "Tes clés ne quittent jamais ton navigateur, sauf vers l'API du fournisseur.",
    // Toasts
    toastSaved: "Paramètres enregistrés",
    toastError: "Erreur d'enregistrement",
    toastExported: "JSON exporté",
    toastEnriched: "Étape enrichie",
    toastConfigureFirst: "Configure un fournisseur IA d'abord",
    toastProviderNotConfigured: "Le fournisseur n'est pas configuré",
    toastAtLeastOne: "Au moins une tâche est requise",
    toastGiveName: "Donne un nom à ton projet",
    toastDescribeObjective: "Décris ton objectif",
    // Prompt dock
    promptPlaceholder: "Décris un objectif et l'IA construira la roadmap…",
    generate: "Générer",
    noProvider: "Aucun fournisseur",
    configureSettings: "Paramètres…",
    // Suggestions
    suggest1: "Lancer un MVP en 30 jours",
    suggest2: "Apprendre Rust",
    suggest3: "Marathon en 6 mois",
    // Project created
    projectCreated: "Projet",
    projectCreatedSuffix: "créé",
    // Provider
    notConfigured: "Non configuré",
    configured: "Configuré",
    connectionOk: "Connexion OK",
    testInProgress: "Test en cours…",
    keyAndModelRequired: "Clé et modèle requis",
    generatingRoadmap: "Génération de la roadmap…",
    decomposing:
      "décompose ton objectif en étapes structurées. Cela peut prendre quelques secondes.",
    reexamining: "Réexamen en cours…",
    deepening: "approfondit l'étape",
    generating: "Génération…",
    providerLabel: "Fournisseur :",
  },
  en: {
    // Topbar
    homeView: "Home",
    noProject: "No project",
    newProject: "New project",
    exportJson: "Export JSON",
    importJson: "Import",
    aiActive: "AI active",
    settings: "Settings",
    // Empty state
    buildFirstConstellation: "Build your first constellation",
    emptyDesc:
      "Give the AI a goal (asking it to make a dedicated web search) and receive a visual roadmap of connected tasks, with dates, resources and dependencies. You validate each proposal before it's applied.",
    createProject: "Create a project",
    // Legend
    connections: "Connections",
    sequential: "Sequential",
    parallel: "Parallel",
    critical: "Critical",
    optional: "Optional",
    // Hints
    hintLink: "Create a link",
    hintNewTask: "New task",
    hintDelete: "Delete",
    hintDeselect: "Deselect",
    // Nodes
    pending: "To do",
    active: "In progress",
    done: "Done",
    blocked: "Blocked",
    toSchedule: "To schedule",
    task: "task",
    edit: "Edit",
    noTasks: "Empty",
    noDescription: "No description",
    details: "Details",
    step: "step",
    noProjects: "No projects yet",
    // Detail panel
    title: "Title",
    description: "Description",
    descPlaceholder: "Describe this step…",
    startDate: "Start date",
    endDate: "End date",
    status: "Status",
    category: "Category",
    research: "Research",
    build: "Build",
    learn: "Learning",
    tasks: "Tasks",
    informations: "Information",
    train: "Train",
    launch: "Launch",
    resources: "Resources",
    noResources: "No resources — use AI re-exploration to suggest some.",
    resourceTitle: "Resource title",
    resourceUrl: "URL (optional)",
    resourceTitleRequired: "Title is required",
    openLink: "Open link",
    add: "Add",
    confirmDeleteProject: "Delete project",
    confirmDeleteMessage:
      "Are you sure you want to delete this project? This action cannot be undone.",
    confirm: "Confirm",
    cancel: "Cancel",
    delete: "Delete",
    reexploreBtn: "Re-explore this step with AI",
    addTask: "Add a task",
    newTask: "New task",
    // Events
    events: "Events",
    addEvent: "+ Add",
    noEvents: "No events — add notes or annotations.",
    eventName: "Event name",
    eventNamePlaceholder: "E.g. Launch meeting…",
    textNote: "Text note",
    handwrittenNote: "Handwritten note",
    writeHere: "Write here…",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    // Notebook
    pen: "Pen",
    eraser: "Eraser",
    clear: "Clear all",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    // Project notes (multi-sheet notebook)
    notes: "Notes",
    notesTitle: "Project notes",
    notesSubtitle:
      "A dedicated notebook for this project. Add as many sheets as you want: text or handwritten.",
    addNote: "Add a sheet",
    addNoteShort: "+ Sheet",
    notesFabLabel: "Notes",
    newNote: "New sheet",
    noNotes: "No sheets yet",
    noNotesHint: "Create your first sheet to start taking notes.",
    selectNote: "Select a sheet",
    selectNoteHint: "Pick a sheet on the left to preview it.",
    noteTitle: "Sheet title",
    noteTitlePlaceholder: "E.g. Initial ideas, March 12 meeting…",
    notePreview: "Preview",
    expand: "Expand",
    untitledNote: "Untitled",
    deleteNoteConfirm: "Delete this sheet?",
    deleteNoteMessage:
      "The sheet will be permanently deleted. This action cannot be undone.",
    notesCount: "sheet(s)",
    updatedOn: "Updated",
    createdOn: "Created",
    closeEditor: "Close editor",
    saveNote: "Save sheet",
    // Edge popover
    sequence: "Sequence",
    // Modal new project
    newProjectEyebrow: "New project",
    newProjectTitle: "Bring a new goal to life",
    newProjectSubtitle:
      "Describe your intention. The AI will propose a complete roadmap that you can adjust before it's applied.",
    projectName: "Project name",
    projectNamePlaceholder: "E.g. Launch my SaaS, Paris Marathon…",
    descriptionOptional: "Description (optional)",
    descriptionPlaceholder: "Specify context, constraints or target audience…",
    objective: "Objective to decompose",
    objectivePlaceholder:
      "Describe the goal the AI should turn into a structured roadmap.",
    modelToUse: "Model to use",
    aiWillPropose:
      "The AI will propose a roadmap. You'll validate each step before it's applied.",
    cancel2: "Cancel",
    generateRoadmap: "Generate with AI",
    createEmpty: "Create empty",
    generationSeparator: "AI GENERATION",
    noProviderHint:
      "No AI provider configured. You can create the project manually and add tasks by hand.",
    createEmptyOrGenerate: "Create empty or generate with AI.",
    taskSingular: "task",
    taskPlural: "tasks",
    deletedSingular: "deleted",
    deletedPlural: "deleted",
    // Preview modal
    previewEyebrow: "AI Preview",
    previewTitle: "Proposed roadmap",
    previewSubtitle:
      "Edit, remove or add tasks before applying. Nothing is created until you confirm.",
    previewTasksInfo: "proposed tasks",
    reject: "Reject",
    applyRoadmap: "Apply roadmap",
    addTaskManually: "Add a task manually",
    start: "Start",
    end: "End",
    // Reexplore
    reexploreEyebrow: "AI Re-exploration",
    reexploreTitle: "Proposed enrichment",
    reexploreSubtitle:
      "Adjust the proposed changes before they're applied to the task.",
    confirmationTitle: "Confirmation",
    confirmationMessage: "Are you sure you want to perform this action?",
    aiProposes: "The AI proposes revisions — you decide.",
    applyChanges: "Apply changes",
    proposedDescription: "Proposed description",
    whyMatters: "Why this step matters",
    suggestedResources: "Suggested resources",
    suggestedSubtasks: "Suggested subtasks",
    subtasksNote:
      "Subtasks will be saved in this task — you can tick each one to track progress.",
    subtasks: "Subtasks",
    noSubtasks:
      "No subtasks — use the AI re-examine to suggest some or add them manually.",
    newSubtask: "New subtask",
    markDone: "Mark as done",
    markUndone: "Mark as not done",
    markTaskDone: "Mark task as done",
    taskDone: "Task completed",
    warningPoint: "⚠ Watch out",
    // Settings
    settingsEyebrow: "Settings",
    projectEditTitle: "Edit project",
    projectLabel: "Project",
    // Quick settings popover
    quickSettingsTitle: "Quick settings",
    importProject: "Import project",
    exportProject: "Export project",
    aiActiveToggle: "AI active",
    configureLLMs: "Configure LLMs",
    fullSettings: "Full settings",
    // Cloud sync
    cloudUpload: "Sync All Projects ↑ (Upload)",
    cloudDownload: "Sync All Projects ↓ (Download)",
    cloudSyncStarting: "Preparing…",
    cloudSyncFetching: "Fetching…",
    cloudUploadSuccess: "{n} project(s) sent to cloud",
    cloudUploadPartial: "{ok}/{total} project(s) sent",
    cloudUploadError: "Upload error",
    cloudDownloadSuccess: "{n} project(s) downloaded from cloud",
    cloudDownloadError: "Download error",
    cloudNoLocalProjects: "No local projects to sync",
    cloudNoCloudProjects: "No projects in the cloud",
    cloudNoProjectOpen: "Open a project to sync it",
    cloudProjectSyncTitle: "Sync this project with the cloud",
    cloudProjectSyncSuccess: "« {name} » synced",
    cloudProjectSyncError: "Project sync failed",
    cloudOrphanTitle: "Local-only projects",
    cloudOrphanMsg:
      "{n} local project(s) are not in the cloud:\n\n{list}\n\nDo you want to DELETE them (or keep them locally)?",
    cloudOrphanDelete: "Delete",
    cloudOrphanKeep: "Keep",
    cloudNotConnected: "Not connected",
    // Auth modal
    cloudAuthEyebrow: "Cloud sync",
    cloudAuthLoginTitle: "Sign in",
    cloudAuthSignupTitle: "Sign up",
    cloudAuthLoginSubtitle: "Sign in to sync your projects with the cloud.",
    cloudAuthSignupSubtitle:
      "Create an account to start syncing your projects.",
    cloudAuthLogin: "Sign in",
    cloudAuthSignup: "Sign up",
    cloudAuthLoginBtn: "Sign in",
    cloudAuthSignupBtn: "Create account",
    cloudAuthInProgress: "Please wait…",
    cloudAuthEmailLabel: "Email",
    cloudAuthEmailPlaceholder: "you@example.com",
    cloudAuthPasswordLabel: "Password",
    cloudAuthPasswordConfirmLabel: "Confirm password",
    cloudAuthPasswordPlaceholder: "••••••••",
    cloudAuthFieldsRequired: "Email and password required",
    cloudAuthEmailInvalid: "Invalid email",
    cloudAuthPasswordMismatch: "Passwords don't match",
    cloudAuthPasswordTooShort: "Password too short (min. 8 characters)",
    cloudAuthInvalid: "Invalid credentials",
    cloudAuthSuccess: "Signed in",
    cloudAuthError: "Authentication error",
    cloudAuthFirstNameLabel: "First name",
    cloudAuthLastNameLabel: "Last name",
    cloudAuthFirstNamePlaceholder: "Jane",
    cloudAuthLastNamePlaceholder: "Doe",
    cloudAuthNamesRequired: "First and last name required for sign-up",
    cloudLogoutBtn: "Sign out",
    cloudLogoutSuccess: "Signed out",
    // Project lifecycle (form fields)
    status: "Status",
    statusPending: "In progress",
    statusCompleted: "Completed",
    startDate: "Start date",
    endDate: "End date",
    notDefined: "—",
    completion: "Progress",
    // Misc missing keys
    importError: "Import error",
    imported: "imported",
    titlePlaceholder: "Untitled",
    exportAllProjects: "Export all projects",
    projectDescriptionPlaceholder: "Project description...",
    aiProviders: "AI Providers",
    settingsSubtitle:
      "Enter your API key and model identifier for each provider. Keys are encrypted (AES-GCM) and stored locally.",
    securityWarning: "Security:",
    securityText:
      "keys are encrypted before local storage, but the source code contains the salt and passphrase. This protection is obfuscation. Do not use on a shared device without modifying",
    securityText2: "ENCRYPTION_SALT and ENCRYPTION_PASSPHRASE in crypto.js.",
    providerAnthropic: "Anthropic - Claude",
    providerOpenAI: "OpenAI - GPT",
    providerDeepSeek: "DeepSeek",
    modelClaudePlaceholder: "claude-opus-4-7",
    modelOpenAIPlaceholder: "gpt-5.4",
    modelDeepSeekPlaceholder: "deepseek-v4-pro",
    modelClaudeInfo: "claude-opus-4-7 - claude-sonnet-4-6 - claude-haiku-4-5",
    modelOpenAIInfo: "gpt-5.5 - gpt-5.4 - gpt-5.4-mini - gpt-5",
    modelDeepSeekInfo: "deepseek-v4-pro - deepseek-v4-flash",
    modelId: "Model identifier",
    apiKey: "API Key",
    test: "Test",
    close: "Close",
    saveSettings: "Save",
    keysNeverLeave:
      "Your keys never leave your browser, except to the provider's API.",
    // Toasts
    toastSaved: "Settings saved",
    toastError: "Save error",
    toastExported: "JSON exported",
    toastEnriched: "Step enriched",
    toastConfigureFirst: "Configure an AI provider first",
    toastProviderNotConfigured: "Provider is not configured",
    toastAtLeastOne: "At least one task is required",
    toastGiveName: "Give your project a name",
    toastDescribeObjective: "Describe your objective",
    // Prompt dock
    promptPlaceholder: "Describe a goal and the AI will build the roadmap…",
    generate: "Generate",
    noProvider: "No provider",
    configureSettings: "Settings…",
    // Suggestions
    suggest1: "Launch an MVP in 30 days",
    suggest2: "Learn Rust",
    suggest3: "Marathon in 6 months",
    // Project created
    projectCreated: "Project",
    projectCreatedSuffix: "created",
    // Provider
    notConfigured: "Not configured",
    configured: "Configured",
    connectionOk: "Connection OK",
    testInProgress: "Testing…",
    keyAndModelRequired: "Key and model required",
    generatingRoadmap: "Generating roadmap…",
    decomposing:
      "is decomposing your goal into structured steps. This may take a few seconds.",
    reexamining: "Re-examining…",
    deepening: "is deepening the step",
    generating: "Generating…",
    providerLabel: "Provider:",
  },
};

let currentLang = localStorage.getItem("currentLanguage") || "fr";

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS["fr"])[key] || key;
}

async function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("currentLanguage", lang);
  applyTranslations();
  await updateUserLang();
}

function applyTranslations() {
  // Update lang switcher buttons
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });
  // Update html lang attribute
  document.documentElement.lang = currentLang;
  // Re-render dynamic content
  const proj = getCurrentProject ? getCurrentProject() : null;
  if (typeof renderProjectMenu === "function") renderProjectMenu();
  if (typeof renderCurrentProject === "function" && proj)
    renderCurrentProject();
  // Update modals
  updateModalTranslations();
  // Update static translatable elements
  const staticKeys = {
    "#aiPill": "aiActive",
    "#newProjectBtn-text": "newProject",
    ".empty-title": "buildFirstConstellation",
    ".empty-desc": "emptyDesc",
    "#emptyCta-text": "createProject",
    ".legend-title": "connections",
    "#addNodeFab-text": "addTask",
    "#promptInput": null, // placeholder
    "#promptSend-text": "generate",
    "#modelBtnLabel": null, // dynamic
  };
  // Hints
  const hints = document.querySelectorAll(".hints span");
  if (hints.length >= 4) {
    hints[0].innerHTML = `<kbd>Drag handle</kbd>${t("hintLink")}`;
    hints[2].innerHTML = `<kbd>Suppr</kbd>${t("hintDelete")}`;
    hints[3].innerHTML = `<kbd>Esc</kbd>${t("hintDeselect")}`;
  }
  // Legend rows
  const legendRows = document.querySelectorAll(".legend-row span:last-child");
  if (legendRows.length >= 4) {
    legendRows[0].textContent = t("sequential");
    legendRows[1].textContent = t("parallel");
    legendRows[2].textContent = t("critical");
    legendRows[3].textContent = t("optional");
  }
  const legendTitle = document.querySelector(".legend-title");
  if (legendTitle) legendTitle.textContent = t("connections");
  // Prompt
  const promptInput = document.querySelector("#promptInput");
  if (promptInput) promptInput.placeholder = t("promptPlaceholder");
  // Suggestions
  const suggests = document.querySelectorAll(".suggest");
  if (suggests.length >= 3) {
    suggests[0].textContent = t("suggest1");
    suggests[1].textContent = t("suggest2");
    suggests[2].textContent = t("suggest3");
  }
  // Empty state
  const emptyTitle = document.querySelector(".empty-title");
  if (emptyTitle) emptyTitle.textContent = t("buildFirstConstellation");
  const emptyDesc = document.querySelector(".empty-desc");
  if (emptyDesc) emptyDesc.textContent = t("emptyDesc");
  const emptyCta = document.querySelector("#emptyCta");
  if (emptyCta) {
    const svg = emptyCta.querySelector("svg");
    emptyCta.textContent = t("createProject");
    if (svg) emptyCta.prepend(svg);
  }
  // AI pill
  const aiPill = document.querySelector(".ai-pill");
  if (aiPill) {
    const dot = aiPill.querySelector(".dot");
    aiPill.textContent = t("aiActive");
    if (dot) aiPill.prepend(dot);
  }
  // Quick settings popover
  const quickSettingsTitle = document.querySelector(
    ".popover-title[data-i18n='quickSettingsTitle']",
  );
  if (quickSettingsTitle)
    quickSettingsTitle.textContent = t("quickSettingsTitle");

  const importProjectText = document.querySelector(
    "#quickImportBtn [data-i18n='importProject']",
  );
  if (importProjectText) importProjectText.textContent = t("importProject");

  const exportProjectText = document.querySelector(
    "#quickExportBtn [data-i18n='exportProject']",
  );
  if (exportProjectText) exportProjectText.textContent = t("exportProject");

  const aiActiveToggleText = document.querySelector(
    ".popover-switch-label[data-i18n='aiActiveToggle']",
  );
  if (aiActiveToggleText) aiActiveToggleText.textContent = t("aiActiveToggle");

  const configureLLMsText = document.querySelector(
    "#configureLLMsBtn [data-i18n='configureLLMs']",
  );
  if (configureLLMsText) configureLLMsText.textContent = t("configureLLMs");

  const fullSettingsText = document.querySelector(
    "#fullSettingsBtn [data-i18n='fullSettings']",
  );
  if (fullSettingsText) fullSettingsText.textContent = t("fullSettings");

  // Quick settings button title
  const quickSettingsBtn = document.querySelector("#quickSettingsBtn");
  if (quickSettingsBtn && quickSettingsBtn.hasAttribute("data-i18n-title")) {
    quickSettingsBtn.title = t("quickSettingsTitle");
  }

  // New project btn
  const newProjectBtn = document.querySelector("#newProjectBtn");
  if (newProjectBtn) {
    const svg = newProjectBtn.querySelector("svg");
    newProjectBtn.textContent = t("newProject");
    if (svg) newProjectBtn.prepend(svg);
  }
  // Add node fab
  const fab = document.querySelector("#addNodeFab");
  if (fab) {
    const plus = fab.querySelector(".plus");
    const kbd = fab.querySelector("kbd");
    fab.textContent = t("addTask");
    if (plus) fab.prepend(plus);
    if (kbd) fab.appendChild(kbd);
  }
  // Notes fab (project-level notes)
  const notesFab = document.querySelector("#notesFab");
  if (notesFab) {
    const icon = notesFab.querySelector(".notes-fab-icon");
    const labelEl = notesFab.querySelector(".notes-fab-label");
    if (labelEl) labelEl.textContent = t("notesFabLabel");
    if (icon && labelEl) {
      // ensure order: icon first then label (already in markup)
    } else if (icon) {
      // Fallback: replace text but keep icon
      notesFab.textContent = t("notesFabLabel");
      notesFab.prepend(icon);
    }
  }
  // Edge popover labels
  const edgeBtns = document.querySelectorAll(".edge-popover-btn[data-type]");
  const edgeLabels = {
    solid: t("sequence"),
    dashed: t("parallel"),
    critical: t("critical"),
    optional: t("optional"),
  };
  edgeBtns.forEach((btn) => {
    const swatch = btn.querySelector(".swatch");
    btn.textContent = edgeLabels[btn.dataset.type] || btn.textContent;
    if (swatch) btn.prepend(swatch);
  });
  // Reexplore btn
  const reexploreBtn = document.querySelector("#reexploreBtn");
  if (reexploreBtn) {
    const svg = reexploreBtn.querySelector("svg");
    reexploreBtn.textContent = t("reexploreBtn");
    if (svg) reexploreBtn.prepend(svg);
  }
  // Generate btn
  const promptSend = document.querySelector("#promptSend");
  if (promptSend) {
    const kbd = promptSend.querySelector("kbd");
    promptSend.textContent = t("generate");
    if (kbd) promptSend.appendChild(kbd);
  }
  // Cloud sync (boutons popover, libellés modal d'auth)
  if (typeof applyCloudSyncTranslations === "function") {
    applyCloudSyncTranslations();
  }
}

function updateModalTranslations() {
  // Preview modal
  const previewEyebrow = document.querySelector(
    "#previewBackdrop .modal-eyebrow",
  );
  const previewTitle = document.querySelector("#previewBackdrop #previewTitle");
  const previewSubtitle = document.querySelector(
    "#previewBackdrop #previewSubtitle",
  );
  const previewFootInfo = document.querySelector(
    "#previewBackdrop #previewFootInfo",
  );
  const previewRejectBtn = document.querySelector(
    "#previewBackdrop .btn-danger[data-close='preview']",
  );
  const previewApplyBtn = document.querySelector(
    "#previewBackdrop #previewApply",
  );

  if (previewEyebrow) previewEyebrow.textContent = t("previewEyebrow");
  if (previewTitle) previewTitle.textContent = t("previewTitle");
  if (previewSubtitle) previewSubtitle.textContent = t("previewSubtitle");
  if (previewFootInfo)
    previewFootInfo.textContent = `- ${t("previewTasksInfo")}`;
  if (previewRejectBtn) previewRejectBtn.textContent = t("reject");
  if (previewApplyBtn) previewApplyBtn.textContent = t("applyRoadmap");

  // Reexplore modal
  const reexploreEyebrow = document.querySelector(
    "#reexploreBackdrop .modal-eyebrow",
  );
  const reexploreTitle = document.querySelector(
    "#reexploreBackdrop #reexploreTitle",
  );
  const reexploreSubtitle = document.querySelector(
    "#reexploreBackdrop .modal-subtitle",
  );
  const reexploreFootInfo = document.querySelector(
    "#reexploreBackdrop .modal-foot-info",
  );
  const reexploreRejectBtn = document.querySelector(
    "#reexploreBackdrop .btn-danger[data-close='reexplore']",
  );
  const reexploreApplyBtn = document.querySelector(
    "#reexploreBackdrop #reexploreApply",
  );

  if (reexploreEyebrow) reexploreEyebrow.textContent = t("reexploreEyebrow");
  if (reexploreTitle) reexploreTitle.textContent = t("reexploreTitle");
  if (reexploreSubtitle) reexploreSubtitle.textContent = t("reexploreSubtitle");
  if (reexploreFootInfo) reexploreFootInfo.textContent = t("aiProposes");
  if (reexploreRejectBtn) reexploreRejectBtn.textContent = t("reject");
  if (reexploreApplyBtn) reexploreApplyBtn.textContent = t("applyChanges");

  // New project modal
  const newProjectEyebrow = document.querySelector(
    "#newProjectBackdrop .modal-eyebrow",
  );
  const newProjectTitle = document.querySelector(
    "#newProjectBackdrop #newProjectTitle",
  );
  const newProjectSubtitle = document.querySelector(
    "#newProjectBackdrop .modal-subtitle",
  );
  const newProjectNameLabel = document.querySelector(
    "#newProjectBackdrop .field-label",
  );
  const newProjectDescLabel = document.querySelectorAll(
    "#newProjectBackdrop .field-label",
  )[1];
  const newProjectObjectiveLabel = document.querySelectorAll(
    "#newProjectBackdrop .field-label",
  )[2];
  const newProjectModelLabel = document.querySelectorAll(
    "#newProjectBackdrop .field-label",
  )[3];
  const newProjectSeparator = document.querySelector(
    "#newProjectBackdrop .modal-body span",
  );
  const newProjectFootInfo = document.querySelector(
    "#newProjectBackdrop #npFootInfo",
  );
  const newProjectCancelBtn = document.querySelector(
    "#newProjectBackdrop .btn-bordered[data-close='newProject']",
  );
  const newProjectCreateEmptyBtn = document.querySelector(
    "#newProjectBackdrop #npCreateManual",
  );
  const newProjectGenerateBtn = document.querySelector(
    "#newProjectBackdrop #npGenerate",
  );

  if (newProjectEyebrow) newProjectEyebrow.textContent = t("newProjectEyebrow");
  if (newProjectTitle) newProjectTitle.textContent = t("newProjectTitle");
  if (newProjectSubtitle)
    newProjectSubtitle.textContent = t("newProjectSubtitle");
  if (newProjectNameLabel)
    newProjectNameLabel.innerHTML = `${t("projectName")} <span style="color: var(--pink)">*</span>`;
  if (newProjectDescLabel)
    newProjectDescLabel.textContent = t("descriptionOptional");
  if (newProjectObjectiveLabel)
    newProjectObjectiveLabel.textContent = t("objective");
  if (newProjectModelLabel) newProjectModelLabel.textContent = t("modelToUse");
  if (newProjectSeparator) {
    newProjectSeparator.textContent = t("generationSeparator");
  }
  if (newProjectFootInfo)
    newProjectFootInfo.textContent = t("createEmptyOrGenerate");
  if (newProjectCancelBtn) newProjectCancelBtn.textContent = t("cancel2");

  // Hint quand aucun provider n'est configuré (préserver le SVG d'avertissement)
  const npNoProviderHint = document.querySelector("#npNoProviderHint");
  if (npNoProviderHint) {
    const svg = npNoProviderHint.querySelector("svg");
    npNoProviderHint.textContent = t("noProviderHint");
    if (svg) npNoProviderHint.prepend(svg);
  }
  if (newProjectCreateEmptyBtn) {
    const svg = newProjectCreateEmptyBtn.querySelector("svg");
    newProjectCreateEmptyBtn.textContent = t("createEmpty");
    if (svg) newProjectCreateEmptyBtn.prepend(svg);
  }
  if (newProjectGenerateBtn) {
    const svg = newProjectGenerateBtn.querySelector("svg");
    newProjectGenerateBtn.textContent = t("generateRoadmap");
    if (svg) newProjectGenerateBtn.prepend(svg);
  }

  // Update placeholders
  const npNameInput = document.querySelector("#npName");
  const npDescriptionInput = document.querySelector("#npDescription");
  const npObjectiveInput = document.querySelector("#npObjective");
  const npModelInputs = document.querySelectorAll(
    "#npAiSection input[data-field='model']",
  );

  if (npNameInput) npNameInput.placeholder = t("projectNamePlaceholder");
  if (npDescriptionInput)
    npDescriptionInput.placeholder = t("descriptionPlaceholder");
  if (npObjectiveInput)
    npObjectiveInput.placeholder = t("objectivePlaceholder");

  // Update model placeholders in settings modal
  const anthropicModelInput = document.querySelector(
    "#provider-anthropic input[data-field='model']",
  );
  const openaiModelInput = document.querySelector(
    "#provider-openai input[data-field='model']",
  );
  const deepseekModelInput = document.querySelector(
    "#provider-deepseek input[data-field='model']",
  );

  if (anthropicModelInput)
    anthropicModelInput.placeholder = t("modelClaudePlaceholder");
  if (openaiModelInput)
    openaiModelInput.placeholder = t("modelOpenAIPlaceholder");
  if (deepseekModelInput)
    deepseekModelInput.placeholder = t("modelDeepSeekPlaceholder");

  // Settings modal
  const settingsEyebrow = document.querySelector(
    "#settingsBackdrop .modal-eyebrow",
  );
  const settingsTitle = document.querySelector(
    "#settingsBackdrop .modal-title",
  );
  const settingsSubtitle = document.querySelector(
    "#settingsBackdrop .modal-subtitle",
  );
  const settingsWarning = document.querySelector(
    "#settingsBackdrop .settings-warning span",
  );
  const settingsFootInfo = document.querySelector(
    "#settingsBackdrop .modal-foot-info",
  );
  const settingsCloseBtn = document.querySelector(
    "#settingsBackdrop .btn-bordered[data-close='settings']",
  );

  if (settingsEyebrow) settingsEyebrow.textContent = t("settingsEyebrow");
  if (settingsTitle) settingsTitle.textContent = t("aiProviders");
  if (settingsSubtitle) settingsSubtitle.textContent = t("settingsSubtitle");
  if (settingsWarning) {
    settingsWarning.innerHTML = `<b>${t("securityWarning")}</b> ${t("securityText")} <code style="font-family:var(--font-mono);font-size:11px;">ENCRYPTION_SALT</code> et <code style="font-family:var(--font-mono);font-size:11px;">ENCRYPTION_PASSPHRASE</code> ${t("securityText2")}`;
  }
  if (settingsFootInfo) settingsFootInfo.textContent = t("keysNeverLeave");
  if (settingsCloseBtn) settingsCloseBtn.textContent = t("close");

  // Update provider cards
  const providerCards = document.querySelectorAll(".provider-card");
  providerCards.forEach((card) => {
    const providerName = card.querySelector(".provider-name");
    const providerStatus = card.querySelector(".provider-status[data-status]");
    const modelLabel = card.querySelector(".field-label");
    const apiKeyLabel = card.querySelectorAll(".field-label")[1];
    const testBtn = card.querySelector(".btn-bordered[data-test]");
    const modelInfo = card.querySelector(".provider-actions span");

    if (providerName) {
      const provider = card.dataset.provider;
      if (provider === "anthropic")
        providerName.textContent = t("providerAnthropic");
      else if (provider === "openai")
        providerName.textContent = t("providerOpenAI");
      else if (provider === "deepseek")
        providerName.textContent = t("providerDeepSeek");
    }

    if (providerStatus) {
      // Status will be updated dynamically by refreshProviderStatus
      providerStatus.textContent = t("notConfigured");
    }

    if (modelLabel && modelLabel.textContent.includes("Identifiant")) {
      modelLabel.textContent = t("modelId");
    }

    if (apiKeyLabel && apiKeyLabel.textContent.includes("Cle API")) {
      apiKeyLabel.textContent = t("apiKey");
    }

    if (testBtn) testBtn.textContent = t("test");

    if (modelInfo) {
      const provider = card.dataset.provider;
      if (provider === "anthropic")
        modelInfo.textContent = t("modelClaudeInfo");
      else if (provider === "openai")
        modelInfo.textContent = t("modelOpenAIInfo");
      else if (provider === "deepseek")
        modelInfo.textContent = t("modelDeepSeekInfo");
    }
  });

  // Confirm modal
  const confirmTitle = document.querySelector("#confirmBackdrop #confirmTitle");
  const confirmMessage = document.querySelector(
    "#confirmBackdrop #confirmMessage",
  );
  const confirmCancelBtn = document.querySelector(
    "#confirmBackdrop #confirmCancelBtn",
  );
  const confirmConfirmBtn = document.querySelector(
    "#confirmBackdrop #confirmConfirmBtn",
  );

  if (confirmTitle) confirmTitle.textContent = t("confirmationTitle");
  if (confirmMessage) confirmMessage.textContent = t("confirmationMessage");
  if (confirmCancelBtn) confirmCancelBtn.textContent = t("cancel");
  if (confirmConfirmBtn) confirmConfirmBtn.textContent = t("delete");

  // Loading modal
  const loadingTitle = document.querySelector("#loadingBackdrop #loadingTitle");
  const loadingTitleText = document.querySelector(
    "#loadingBackdrop #loadingTitleText",
  );
  const loadingText = document.querySelector("#loadingBackdrop #loadingText");

  if (loadingTitle) loadingTitle.textContent = t("generatingRoadmap");
  if (loadingTitleText) loadingTitleText.textContent = t("generatingRoadmap");
  if (loadingText) loadingText.textContent = t("decomposing");

  // Project edit panel
  const projectLabel = document.querySelector("#projectEditPanel .detail-cat");
  const projectEditTitle = document.querySelector(
    "#projectEditPanel #projectEditTitle",
  );
  const projectEditClose = document.querySelector(
    "#projectEditPanel #projectEditClose",
  );
  const projectNameLabel = document.querySelector(
    "#projectEditBody .field-label",
  );
  const projectDescLabel = document.querySelectorAll(
    "#projectEditBody .field-label",
  )[1];
  const projectInfoTitle = document.querySelector(
    "#projectEditBody .detail-section-title",
  );
  const providerLabel = document.querySelectorAll(
    "#projectEditBody .detail-info-label",
  )[0];
  const modelLabel = document.querySelectorAll(
    "#projectEditBody .detail-info-label",
  )[1];
  const tasksLabel = document.querySelectorAll(
    "#projectEditBody .detail-info-label",
  )[2];
  const connectionsLabel = document.querySelectorAll(
    "#projectEditBody .detail-info-label",
  )[3];

  if (projectLabel) projectLabel.textContent = t("projectLabel");
  if (projectEditTitle) projectEditTitle.textContent = t("projectEditTitle");
  if (projectEditClose) projectEditClose.title = t("close");
  if (projectNameLabel) projectNameLabel.textContent = t("title");
  if (projectDescLabel) projectDescLabel.textContent = t("description");
  if (projectInfoTitle) projectInfoTitle.textContent = t("informations");
  if (providerLabel) providerLabel.textContent = t("providerLabel");
  if (modelLabel) modelLabel.textContent = t("modelId");
  if (tasksLabel) tasksLabel.textContent = t("tasks");
  if (connectionsLabel) connectionsLabel.textContent = t("connections");
}

function initLangSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });
  applyTranslations();
}
