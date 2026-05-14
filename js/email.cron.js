cronAdd("send_reminder_emails", "0 7 * * *", () => {
  const today = new Date();

  // Do not send emails on Sundays :)
  if (today.getDay() === 0) {
    return;
  }

  // ─── HELPERS ────────────────────────────────────────────────
  function sendEmail(RESEND_API_KEY, html, text, to, subject) {
    try {
      const response = $http.send({
        url: "https://api.resend.com/emails",
        method: "POST",
        body: JSON.stringify({
          from: "Sphere Plan <noreply@tasks.spherenote.space>",
          to: [to],
          subject: subject,
          html: html,
          text: text,
        }),
        headers: {
          Authorization: "Bearer " + RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15,
      });

      console.log("Body : " + JSON.stringify(response.json));
    } catch (e) {
      console.log("ERREUR FATALE HTTP : " + e);
    }
  }

  /**
   * Appelle l'API OpenAI Responses avec le tool `web_search` restreint aux
   * 4 plateformes d'apprentissage (YouTube, Coursera, Udemy, Skillshare)
   * pour récupérer de vraies ressources avec de vrais liens, contextualisées
   * sur les tâches à échéance demain.
   *
   * ⚠️ Important : OpenAI INTERDIT de combiner `web_search` avec
   * `response_format: json_object`. On s'appuie donc sur :
   *   1. Un system prompt qui force "first char MUST be {"
   *   2. Un parser robuste qui strip fences, préambules et tags de citation
   *   3. Un post-filtre des URLs (sécurité contre hallucinations de domaine)
   *
   * Retourne un objet { intro, resources: [{ title, platform, url,
   * description, forTask }] } ou null en cas d'échec — le mail est alors
   * envoyé sans la section "comment commencer" (graceful degradation).
   */
  function fetchHowToStart(LLM_API_KEY, tasks, lang, projectName) {
    if (!LLM_API_KEY) {
      console.log("[LLM] Pas de clé API — section comment commencer ignorée");
      return null;
    }

    // Modèle OpenAI à utiliser. Ajuste si besoin (gpt-5, gpt-5-mini, etc.).
    // Doit être un modèle qui supporte le tool web_search via Responses API.
    const OPENAI_MODEL = "gpt-5.1";

    // On envoie au LLM un résumé léger de chaque tâche (titre + extrait
    // de description + catégorie). Pas besoin de tout le payload.
    const taskList = tasks.map((tk) => ({
      title: tk.title || "",
      description: String(tk.description || "").slice(0, 250),
      category: tk.category || "",
    }));

    const langLabel = lang === "fr" ? "French" : "English";

    const systemPrompt = `LANGUAGE RULE (ABSOLUTE):
    - You MUST respond ONLY in ${langLabel}.
    - Never switch language.
    - This rule overrides all other instructions.

    ROLE:
    You are an elite learning-resource discovery assistant.

    Your mission is to help users START EXECUTING QUICKLY using the BEST FREE, PRACTICAL, and HIGH-QUALITY resources available online.

    You are NOT a generic course recommender.
    You are a practical kickstart engine.

    RESOURCE DISCOVERY STRATEGY:
    Prioritize resources that help the user:
    - start immediately
    - build real projects
    - understand core concepts quickly
    - avoid tutorial paralysis
    - follow modern best practices

    ALLOWED RESOURCE TYPES:
    You may search and recommend ONLY:
    - YouTube tutorials and courses
    - Official documentation
    - GitHub repositories
    - Interactive learning platforms
    - Structured online courses

    ALLOWED SOURCES:
    - youtube.com
    - github.com
    - roadmap.sh
    - freecodecamp.org
    - exercism.org
    - coursera.org
    - udemy.com
    - skillshare.com
    - official framework/library documentation websites

    SEARCH EXECUTION RULES (CRITICAL):
    - You MUST use web_search to find REAL and CURRENT resources.
    - NEVER invent URLs or titles.
    - ALWAYS search YouTube first.
    - Search official documentation second.
    - Search GitHub repositories third.
    - Only include paid courses if free resources are insufficient.

    RESOURCE PRIORITY ORDER:
    1. Free practical YouTube tutorials
    2. Official documentation
    3. Real-world GitHub repositories
    4. Interactive practice platforms
    5. Structured online courses

    YOUTUBE RESOURCE RULES:
    Strongly prefer:
    - full courses
    - crash courses
    - build-along tutorials
    - project-based learning
    - step-by-step implementations
    - modern tech stack tutorials

    Avoid:
    - shorts
    - teaser videos
    - motivational content
    - clickbait
    - outdated tutorials
    - overly theoretical lectures
    - low-effort content

    OFFICIAL DOCUMENTATION RULES:
    Prefer official docs that contain:
    - quick start guides
    - installation/setup sections
    - beginner onboarding
    - tutorials
    - examples
    - practical guides

    GITHUB REPOSITORY RULES:
    Prefer repositories with:
    - good README documentation
    - active maintenance
    - clear setup instructions
    - real-world architecture
    - practical examples
    - beginner-friendly onboarding

    INTERACTIVE PLATFORM RULES:
    Prefer platforms that allow:
    - hands-on exercises
    - guided practice
    - real coding
    - incremental learning

    PAID COURSE RULES:
    Udemy, Skillshare, and paid Coursera content should ONLY appear when:
    - significantly better than free alternatives
    - highly practical
    - directly relevant
    - no strong free equivalent exists

    TASK MATCHING RULES:
    Each resource MUST:
    - directly help complete at least one task
    - provide immediate practical value
    - be highly relevant
    - avoid generic broad recommendations

    RESOURCE DISTRIBUTION RULES:
    - Return between 5 and 8 resources total
    - At least 50% MUST be free resources
    - At least 1 YouTube resource is REQUIRED
    - At least 1 official documentation resource is REQUIRED whenever relevant
    - At least 1 GitHub repository is REQUIRED for technical/build tasks whenever possible
    - Do NOT force platform diversity artificially
    - Prefer quality over diversity

    OUTPUT FORMAT (CRITICAL):
    Return ONLY ONE valid JSON object.

    STRICT JSON RULES:
    - First character MUST be {
    - Last character MUST be }
    - No markdown
    - No code fences
    - No explanations
    - No citations
    - No HTML
    - No comments
    - No trailing commas

    JSON SCHEMA:
    {
      "intro": "string",
      "resources": [
        {
          "title": "string",
          "type": "youtube" | "documentation" | "github" | "interactive" | "course",
          "platform": "string",
          "url": "string",
          "description": "string",
          "whyUseful": "string",
          "forTask": "string",
          "isFree": true
        }
      ]
    }

    FINAL INTERNAL VALIDATION:
    Before responding, internally verify:
    1. Did I prioritize free practical resources?
    2. Did I include actionable resources?
    3. Are the URLs real?
    4. Are the resources recent and modern?
    5. Did I avoid weak paid alternatives?
    6. Would these resources genuinely help someone start quickly?
    7. Did I avoid tutorial-paralysis-style recommendations?
    8. Are the resources implementation-focused rather than purely theoretical?
    `;

    const userPayload = JSON.stringify(
      {
        project_name: projectName,
        tasks_due_tomorrow: taskList,
      },
      null,
      2,
    );

    try {
      const response = $http.send({
        url: "https://api.openai.com/v1/responses",
        method: "POST",
        headers: {
          Authorization: "Bearer " + LLM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          instructions: systemPrompt,
          input: userPayload,
          max_output_tokens: 8000,
          // Tool web_search avec filtrage par domaine côté serveur OpenAI.
          // On laisse aussi le post-filtre côté client pour double sécurité.
          tools: [
            {
              type: "web_search",
              filters: {
                allowed_domains: [
                  "youtube.com",
                  "coursera.org",
                  "udemy.com",
                  "skillshare.com",
                ],
              },
            },
          ],
          // "auto" : le modèle décide. Passe à { type: "web_search" } pour
          // forcer au moins une recherche.
          tool_choice: "auto",
          // ❌ PAS de `text: { format: { type: "json_object" } }` ni de
          //    `response_format` ici : incompatible avec web_search côté
          //    OpenAI ("Web Search cannot be used with JSON mode").
        }),
        timeout: 120,
      });

      // PocketBase JSVM expose `statusCode`, pas `status`. On gère les deux
      // au cas où, mais surtout on ne bloque PAS si le code est undefined :
      // on s'appuie plutôt sur la présence d'un `error` dans le JSON, qui
      // est plus fiable côté OpenAI Responses API.
      const httpCode = response.statusCode || response.status;
      const data = response.json;

      if (!data) {
        console.log("[LLM] Pas de réponse JSON (HTTP " + httpCode + ")");
        return null;
      }

      if (data.error) {
        console.log(
          "[LLM] Erreur API (HTTP " +
            httpCode +
            ") : " +
            JSON.stringify(data.error),
        );
        return null;
      }

      // Détection de troncature côté Responses API.
      if (data.status === "incomplete") {
        const reason =
          (data.incomplete_details && data.incomplete_details.reason) ||
          "unknown";
        console.log("[LLM] Réponse incomplète (raison: " + reason + ")");
        return null;
      }

      // Extraction texte. `data.output_text` est un helper qui peut être
      // absent en REST direct (présent surtout via SDK officiel). On
      // parcourt donc `data.output[]` pour récupérer les blocs `message`
      // puis leurs contenus `output_text`.
      let text = data.output_text || "";
      if (!text) {
        text = (data.output || [])
          .filter((b) => b.type === "message")
          .map((b) =>
            (b.content || [])
              .filter((c) => c.type === "output_text")
              .map((c) => c.text)
              .join(""),
          )
          .join("\n")
          .trim();
      }

      if (!text) {
        console.log("[LLM] Réponse vide");
        return null;
      }

      // Parse JSON robuste : strip <cite>, fences, préambules.
      let cleaned = text
        .replace(/<cite\b[^>]*>([\s\S]*?)<\/cite>/gi, "$1")
        .replace(/<\/?cite\b[^>]*>/gi, "")
        .replace(/<\/?(?:ref|source|citation)\b[^>]*>/gi, "")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");
      if (first === -1 || last === -1 || last < first) {
        console.log("[LLM] Aucun JSON détecté");
        return null;
      }

      const parsed = JSON.parse(cleaned.slice(first, last + 1));

      if (
        !parsed ||
        !Array.isArray(parsed.resources) ||
        !parsed.resources.length
      ) {
        console.log("[LLM] Pas de ressources dans la réponse");
        return null;
      }

      // Filtre défensif : on ne garde que les ressources avec une URL valide
      // sur l'une des 4 plateformes autorisées (sécurité contre une éventuelle
      // hallucination du modèle, même si OpenAI a `filters.allowed_domains`).
      const allowed = [
        "youtube.com",
        "coursera.org",
        "udemy.com",
        "skillshare.com",
      ];
      parsed.resources = parsed.resources.filter((r) => {
        if (!r || !r.url || typeof r.url !== "string") return false;
        if (!r.url.startsWith("https://")) return false;
        return allowed.some((d) => r.url.indexOf(d) !== -1);
      });

      if (!parsed.resources.length) {
        console.log("[LLM] Toutes les ressources ont été filtrées");
        return null;
      }

      return {
        intro: String(parsed.intro || ""),
        resources: parsed.resources,
      };
    } catch (e) {
      console.log("[LLM] ERREUR : " + e);
      return null;
    }
  }

  /* ── Design tokens ─────────────────────────────────────────── */
  const C = {
    // Neutrals — light mode (overridés en dark via classes .e-*)
    bg: "#fafafa",
    bgCard: "#ffffff",
    fg: "#0f172a",
    fgMuted: "#475569",
    fgDim: "#64748b",
    fgFaint: "#94a3b8",
    border: "#e2e8f0",
    tagBg: "#f1f5f9",

    // Accents
    pink: "#ec4899",
    pinkBg: "#fce7f3",
    amber: "#d97706",
    amberBg: "#fef3c7",
    cyan: "#0891b2",
    cyanBg: "#cffafe",
    violet: "#7c3aed",
    violetBg: "#ede9fe",
    green: "#059669",
    greenBg: "#d1fae5",
    red: "#dc2626",
    redBg: "#fee2e2",
    blue: "#2563eb",
    blueBg: "#dbeafe",
    teal: "#0d9488",
    tealBg: "#ccfbf1",
  };

  // Couleurs par plateforme d'apprentissage
  const PLATFORM_STYLE = {
    youtube: { color: C.red, bg: C.redBg, label: "YouTube", cls: "e-pill-red" },
    coursera: {
      color: C.blue,
      bg: C.blueBg,
      label: "Coursera",
      cls: "e-pill-blue",
    },
    udemy: {
      color: C.violet,
      bg: C.violetBg,
      label: "Udemy",
      cls: "e-pill-violet",
    },
    skillshare: {
      color: C.teal,
      bg: C.tealBg,
      label: "Skillshare",
      cls: "e-pill-teal",
    },
  };

  /* ── i18n ──────────────────────────────────────────────────── */
  const I = {
    fr: {
      brand: "Sphere Plan",
      hello: "Bonjour",
      helloName: "Bonjour {name}",
      tasksDue:
        "Vous avez {done} tâche{pluralDone} terminée{pluralDone}, {count} tâche{plural} en cours et {expired} tâche{pluralExpired} expirée{pluralExpired} dans {project}.",
      noTasks:
        "Aucune tâche en cours dans {project}. Profitez de votre journée ! ✨",
      tomorrow: "demain",
      untitled: "Sans titre",
      done: "Terminé",
      footer: "Envoi automatique · Ne répondez pas à cet email",
      subject: "{count} tâche{plural} en cours — {projectName}",
      pageTitle: "Rappel de tâches",
      catBuild: "Développement",
      catDesign: "Design",
      catResearch: "Recherche",
      catReview: "Revue",
      catLearn: "Apprentissage",
      catTrain: "Formation",
      catLaunch: "Lancement",
      catDefault: "Tâche",
      subtasksLabel: "Sous-tâches",
      days: "j",
      resourcesLabel: "Ressources",
      howToStartTitle: "Comment commencer ?",
      howToStartFallbackIntro:
        "Voici quelques ressources concrètes pour vous lancer sur ces tâches dès demain.",
      howToStartForTask: "Pour",
    },
    en: {
      brand: "Sphere Plan",
      hello: "Hello",
      helloName: "Hello {name}",
      tasksDue:
        "You have {done} completed task{pluralDone}, {count} task{plural} in progress and {expired} expired task{pluralExpired} in {project}.",
      noTasks: "No active tasks in {project}. Enjoy your day! ✨",
      tomorrow: "tomorrow",
      untitled: "Untitled",
      done: "Done",
      footer: "Automatically Sent · Do not reply to this email",
      subject: "{count} active task{plural} — {projectName}",
      pageTitle: "Task reminder",
      catBuild: "Build",
      catDesign: "Design",
      catResearch: "Research",
      catReview: "Review",
      catLearn: "Learn",
      catTrain: "Training",
      catLaunch: "Launch",
      catDefault: "Task",
      subtasksLabel: "Subtasks",
      days: "d",
      resourcesLabel: "Resources",
      howToStartTitle: "How to get started ?",
      howToStartFallbackIntro:
        "Here are concrete resources to kick off these tasks tomorrow.",
      howToStartForTask: "For",
    },
  };

  const t = (lang, key, vars) => {
    const tmpl = (I[lang] || I.en)[key] || I.en[key] || key;
    if (!vars) return tmpl;
    return tmpl.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] != null ? vars[k] : `{${k}}`,
    );
  };

  const plural = (lang, n) =>
    lang === "fr" ? (n > 1 ? "s" : "") : n !== 1 ? "s" : "";

  const locale = (lang) => (lang === "fr" ? "fr-FR" : "en-US");

  /**
   * Formate une date selon la langue, SANS dépendre de Intl.DateTimeFormat
  /**
   * Formate une date selon la langue, SANS dépendre de Intl.DateTimeFormat
   * (Goja, le runtime JS de PocketBase, n'implémente pas l'API Intl, donc
   * `toLocaleDateString` retombe silencieusement sur un format type
   * "MM/DD/YYYY" qui ignore les options et le locale fournis).
   *
   *   formatDate(d, "fr") → "3 mai 2026"
   *   formatDate(d, "en") → "May 3, 2026"
   */
  const formatDate = (dateInput, lang) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const day = d.getDate();
    const month = d.getMonth(); // 0-11
    const year = d.getFullYear();
    const monthsFr = [
      "janv.",
      "févr.",
      "mars",
      "avr.",
      "mai",
      "juin",
      "juil.",
      "août",
      "sept.",
      "oct.",
      "nov.",
      "déc.",
    ];
    const monthsEn = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (lang === "fr") {
      return `${day} ${monthsFr[month]} ${year}`;
    }
    return `${monthsEn[month]} ${day}, ${year}`;
  };

  /**
   * Minifie le HTML pour rester sous la limite de clipping de Gmail
   * (~102 KB sur desktop, encore plus strict en mobile : ~75 KB Android,
   * ~20 KB iOS app dans certains cas). Quand un mail dépasse cette
   * limite, Gmail coupe en plein milieu du HTML — ce qui casse les
   * tags non fermés et donne des rendus type "[Message clipped]" avec
   * du contenu manquant ou cassé.
   *
   * Stratégie :
   *   1. Préserver les conditional comments Outlook MSO (sinon Outlook
   *      casse les ghost tables) en les remplaçant temporairement par
   *      un placeholder.
   *   2. Strip les autres commentaires HTML.
   *   3. Collapse les whitespaces ENTRE tags (jamais à l'intérieur du
   *      texte visible — on ne touche pas au contenu).
   *   4. Restore les MSO comments.
   *
   * Gain typique : 20 à 30 % sur un template comme celui-ci.
   */
  const minifyHtml = (html) => {
    if (!html) return "";
    const msoComments = [];
    let out = String(html).replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, (m) => {
      msoComments.push(m);
      return `__MSO_${msoComments.length - 1}__`;
    });
    // Strip non-MSO HTML comments
    out = out.replace(/<!--[\s\S]*?-->/g, "");
    // Collapse whitespace between tags only (preserves text content)
    out = out.replace(/>\s+</g, "><");
    // Collapse runs of newlines/tabs/spaces into a single space inside
    // attribute regions and other inter-tag spots
    out = out.replace(/[\n\t\r]+/g, " ").replace(/ {2,}/g, " ");
    // Restore MSO comments (their internal whitespace doesn't matter
    // for size since Outlook ignores it anyway)
    out = out.replace(/__MSO_(\d+)__/g, (_, i) => msoComments[parseInt(i, 10)]);
    return out.trim();
  };

  /* ── HTML builders ─────────────────────────────────────────── */
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const cat = (c, lang) => {
    // Normalise la casse : "Build", "BUILD", "build" → "build"
    const k = String(c || "").toLowerCase();
    const key = k
      ? `cat${k.charAt(0).toUpperCase()}${k.slice(1)}`
      : "catDefault";
    const label = t(lang, key);
    const base = {
      build: { color: C.amber, bg: C.amberBg, cls: "e-pill-amber" },
      design: { color: C.pink, bg: C.pinkBg, cls: "e-pill-pink" },
      research: { color: C.violet, bg: C.violetBg, cls: "e-pill-violet" },
      review: { color: C.cyan, bg: C.cyanBg, cls: "e-pill-cyan" },
      learn: { color: C.cyan, bg: C.cyanBg, cls: "e-pill-cyan" },
      train: { color: C.blue, bg: C.blueBg, cls: "e-pill-blue" },
      launch: { color: C.pink, bg: C.pinkBg, cls: "e-pill-pink" },
    };
    const def = { color: C.green, bg: C.greenBg, cls: "e-pill-green" };
    return { ...(base[k] || def), label };
  };

  const pill = (ci) =>
    `<span class="${ci.cls}" style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.02em;color:${esc(ci.color)};background:${esc(ci.bg)};border:1px solid ${esc(ci.color)}33;">${esc(ci.label)}</span>`;

  const taskCard = (tk, lang) => {
    const ci = cat(tk.category, lang);
    const done = tk.status === "done";
    const end = formatDate(tk.endDate, lang);
    const desc = tk.description || "";
    const endDate = new Date(tk?.endDate);
    const expired = today.getTime() > endDate.getTime();

    return `
    <table width="100%" cellpadding="0" cellspacing="0" class="e-card${expired ? " e-card-expired" : ""}" style="background:${C.bgCard};border:1px solid ${expired ? C.red : C.border};border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:16px 18px;">

          <!-- top row: pill + dates -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="left">
                ${pill(ci)}
              </td>
              <td align="right" class="e-fg-dim" style="font-size:11px;color:${C.fgDim};white-space:nowrap;text-align: right;padding-left: 20px;">
                ${end ? esc(end) : ""}
              </td>
            </tr>
          </table>

          <!-- title -->
          <div class="${done ? "e-fg-dim" : "e-fg"}" style="margin-top:12px;font-size:15px;font-weight:600;color:${done ? C.fgDim : C.fg};line-height:1.35;${done ? "text-decoration:line-through;" : ""}">
            ${esc(tk.title || t(lang, "untitled"))}
          </div>

          ${
            desc
              ? `
          <!-- description -->
          <div class="e-fg-muted" style="margin-top:6px;font-size:12.5px;color:${C.fgMuted};line-height:1.5;">
            ${esc(desc)}
          </div>`
              : ""
          }

          ${
            tk.resources && tk.resources.length
              ? `
          <!-- resources -->
          <div class="e-border-t" style="margin-top:14px;padding-top:12px;border-top:1px solid ${C.border};">
            <div class="e-fg-faint" style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${C.fgFaint};margin-bottom:10px;">${esc(t(lang, "resourcesLabel"))} (${tk.resources.length})</div>
            ${tk.resources
              .map(
                (r) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td class="e-fg-muted" style="font-size:11px;color:${C.fgMuted};padding-bottom:3px;">
                  <span style="display:inline-block;width:5px;height:5px;border-radius:2px;background:${ci.color};margin-right:6px;vertical-align:middle;opacity:0.6;"></span>
                  ${r.url ? `<a href="${esc(r.url)}" style="color:${C.cyan};text-decoration:none;font-weight:500;">${esc(r.title || "")}</a>` : `<span class="e-fg" style="font-weight:500;color:${C.fg};">${esc(r.title || "")}</span>`}
                  ${r.type ? `<span class="e-tag-bg e-fg-faint" style="margin-left:6px;font-size:9px;padding:1px 6px;border-radius:10px;background:${C.tagBg};color:${C.fgFaint};text-transform:uppercase;">${esc(r.type)}</span>` : ""}
                  ${r.meta ? `<div class="e-fg-faint" style="margin-top:2px;font-size:10px;color:${C.fgFaint};line-height:1.3;">${esc(r.meta)}</div>` : ""}
                </td>
              </tr>
            </table>`,
              )
              .join("")}
          </div>`
              : ""
          }

          ${
            tk.subtasks && tk.subtasks.length
              ? `
          <!-- subtasks -->
          <div class="e-border-t" style="margin-top:14px;padding-top:12px;border-top:1px solid ${C.border};">
            <div class="e-fg-faint" style="font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${C.fgFaint};margin-bottom:12px;">${esc(t(lang, "subtasksLabel"))} (${tk.subtasks.filter((st) => st.done).length}/${tk.subtasks.length})</div>
            ${tk.subtasks
              .map(
                (st) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
              <tr>
                <td style="width:22px;vertical-align:top;padding-top:2px;">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${st.done ? ci.color : "transparent"};border:1.5px solid ${st.done ? ci.color : C.fgFaint};text-align:center;line-height:14px;font-size:9px;color:${C.bgCard};">${st.done ? "&check;" : ""}</span>
                </td>
                <td class="${st.done ? "e-fg-dim" : "e-fg-muted"}" style="font-size:12px;color:${st.done ? C.fgDim : C.fgMuted};${st.done ? "text-decoration:line-through;" : ""}padding-bottom:2px;padding-left:5px;line-height:1.5;">
                  <span class="${st.done ? "" : "e-fg"}" style="font-weight:500;${st.done ? "" : `color:${C.fg};`}">${esc(st.title || st)}</span>
                  ${st.estimatedDays ? `<span class="e-fg-faint" style="margin-left:6px;font-size:10px;color:${C.fgFaint};">${esc(String(st.estimatedDays))}${esc(t(lang, "days"))}</span>` : ""}
                  ${st.description ? `<div class="e-fg-dim" style="margin-top:4px;font-size:11px;color:${C.fgDim};line-height:1.45;">${esc(st.description)}</div>` : ""}
                </td>
              </tr>
            </table>`,
              )
              .join("")}
          </div>`
              : ""
          }
        </td>
      </tr>
    </table>`;
  };

  /**
   * Construit la section "Comment commencer" avec ressources externes
   * (YouTube, Coursera, Udemy, Skillshare). N'est appelée que si le
   * owner a canUseKey=true et que le LLM a renvoyé des résultats.
   */
  const howToStartSection = (howToStart, lang) => {
    if (!howToStart || !howToStart.resources || !howToStart.resources.length) {
      return "";
    }

    const intro = howToStart.intro || t(lang, "howToStartFallbackIntro");

    const cards = howToStart.resources
      .map((r) => {
        const platformKey = String(r.platform || "").toLowerCase();
        const ps = PLATFORM_STYLE[platformKey] || {
          color: C.fgMuted,
          bg: C.tagBg,
          label: r.platform || "Link",
          cls: "e-tag-bg",
        };

        return `
        <table width="100%" cellpadding="0" cellspacing="0" class="e-card" style="background:${C.bgCard};border:1px solid ${C.border};border-radius:10px;overflow:hidden;margin-bottom:10px;">
          <tr>
            <td style="padding:14px 16px;">

              <!-- top row: platform pill + "for task" -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left">
                    <span class="${ps.cls}" style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:0.02em;color:${esc(ps.color)};background:${esc(ps.bg)};border:1px solid ${esc(ps.color)}33;">${esc(ps.label)}</span>
                  </td>
                  ${
                    r.forTask
                      ? `<td align="right" class="e-fg-dim" style="font-size:10px;color:${C.fgDim};white-space:nowrap;text-transform:uppercase;letter-spacing:0.04em;">
                    ${esc(t(lang, "howToStartForTask"))} · ${esc(String(r.forTask))}
                  </td>`
                      : ""
                  }
                </tr>
              </table>

              <!-- title (link) -->
              <div style="margin-top:10px;font-size:14px;font-weight:600;line-height:1.4;">
                <a href="${esc(r.url)}" class="e-fg" style="color:${C.fg};text-decoration:none;">
                  ${esc(r.title || r.url)}
                </a>
              </div>

              ${
                r.description
                  ? `
              <div class="e-fg-muted" style="margin-top:5px;font-size:12px;color:${C.fgMuted};line-height:1.5;">
                ${esc(String(r.description))}
              </div>`
                  : ""
              }

              <!-- url discreet -->
              <div class="e-fg-faint" style="margin-top:8px;font-size:10px;color:${C.fgFaint};word-break:break-all;">
                ${esc(r.url)}
              </div>
            </td>
          </tr>
        </table>`;
      })
      .join("");

    return `
    <!-- How to start section -->
    <tr>
      <td style="padding:32px 0 20px 0;">
        <div class="e-divider" style="height:1px;background:${C.border};"></div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 16px 0;">
        <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.pink};">
          ${esc(t(lang, "howToStartTitle"))}
        </div>
        <div class="e-fg-muted" style="margin-top:8px;font-size:13.5px;color:${C.fgMuted};line-height:1.55;">
          ${esc(intro)}
        </div>
      </td>
    </tr>
    <tr>
      <td>
        ${cards}
      </td>
    </tr>`;
  };

  const howToStartText = (howToStart, lang) => {
    if (!howToStart || !howToStart.resources || !howToStart.resources.length) {
      return [];
    }
    const intro = howToStart.intro || t(lang, "howToStartFallbackIntro");
    return [
      ``,
      `── ${t(lang, "howToStartTitle")} ──`,
      intro,
      ``,
      ...howToStart.resources.map((r) => {
        const platformKey = String(r.platform || "").toLowerCase();
        const label =
          (PLATFORM_STYLE[platformKey] || {}).label || r.platform || "";
        const forTask = r.forTask
          ? ` (${t(lang, "howToStartForTask")} : ${r.forTask})`
          : "";
        return `• [${label}] ${r.title || ""}${forTask}\n  ${r.description || ""}\n  ${r.url}`;
      }),
    ];
  };

  const emailContent = (owner, tasks, projectName, howToStart) => {
    const lang = owner?.language === "fr" ? "fr" : "en";
    const firstName = esc(owner?.firstName || owner?.lastName || "");
    const taskCount = tasks.length;
    const doneCount = tasks.filter((tk) => tk.status === "done").length;
    const expiredCount = tasks.filter((tk) => {
      if (tk.status === "done") return false;
      const endDate = new Date(tk?.endDate);
      return endDate.getTime() < today.getTime();
    }).length;
    const greeting = firstName
      ? t(lang, "helloName", { name: firstName })
      : t(lang, "hello");
    const pl = plural(lang, taskCount);
    const plDone = plural(lang, doneCount);
    const plExpired = plural(lang, expiredCount);

    // --- Pair tasks into rows of 2 ---
    const pairs = [];
    for (let i = 0; i < tasks.length; i += 2) pairs.push(tasks.slice(i, i + 2));

    // Pattern fluid hybrid : `inline-block` sur des div + ghost tables
    // Outlook. Ça permet aux clients qui ignorent les media queries
    // (Gmail web strict, anciens Outlook, etc.) de quand même collapser
    // proprement quand le viewport rétrécit, parce que les inline-block
    // wrappent naturellement quand ils ne tiennent plus côte à côte.
    const taskGrid = pairs
      .map(
        (pair) => `
          <tr>
            <td style="padding:0 0 12px 0;font-size:0;line-height:0;" align="left">
              <!--[if mso]>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="50%" valign="top" style="padding-right:6px;">
              <![endif]-->
              <div class="e-card-cell" style="display:inline-block;width:100%;max-width:308px;vertical-align:top;box-sizing:border-box;padding-right:6px;font-size:14px;line-height:normal;">
                ${taskCard(pair[0], lang)}
              </div>
              <!--[if mso]>
                  </td>
                  <td width="50%" valign="top" style="padding-left:6px;">
              <![endif]-->
              ${
                pair[1]
                  ? `<div class="e-card-cell" style="display:inline-block;width:100%;max-width:308px;vertical-align:top;box-sizing:border-box;padding-left:6px;font-size:14px;line-height:normal;">
                ${taskCard(pair[1], lang)}
              </div>`
                  : ""
              }
              <!--[if mso]>
                  </td>
                </tr>
              </table>
              <![endif]-->
            </td>
          </tr>`,
      )
      .join("");

    // --- Plain-text version ---
    const text = [
      `${greeting},`,
      ``,
      taskCount
        ? t(lang, "tasksDue", {
            count: taskCount,
            plural: pl,
            done: doneCount,
            pluralDone: plDone,
            expired: expiredCount,
            pluralExpired: plExpired,
            project: projectName,
          })
        : t(lang, "noTasks", { project: projectName }),
      ``,
      ...tasks.flatMap((tk) => [
        `• ${tk.title} — ${tk.endDate} (${cat(tk.category, lang).label})`,
        ...(tk.subtasks || []).map(
          (st) =>
            `    ${st.done ? "✓" : "○"} ${st.title || st}${st.estimatedDays ? ` (${st.estimatedDays}${t(lang, "days")})` : ""}`,
        ),
      ]),
      ...howToStartText(howToStart, lang),
      ``,
      `— ${t(lang, "brand")}`,
    ].join("\n");

    // --- HTML version ---
    const html = `<!DOCTYPE html>
  <html lang="${esc(lang)}">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${esc(t(lang, "pageTitle"))}</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    /* ===== DARK MODE (Apple Mail, iOS Mail, Outlook Mac/iOS) ===== */
    @media (prefers-color-scheme: dark) {
      .e-bg        { background: #0a0a0a !important; }
      .e-card            { background: #141414 !important; border-color: #262626 !important; }
      .e-card-expired    { border-color: #dc2626 !important; }
      .e-fg              { color: #fafafa !important; }
      .e-fg-muted  { color: #a3a3a3 !important; }
      .e-fg-dim    { color: #737373 !important; }
      .e-fg-faint  { color: #525252 !important; }
      .e-divider   { background: #262626 !important; }
      .e-border-t  { border-color: #262626 !important; }
      .e-tag-bg    { background: #0a0a0a !important; color: #525252 !important; }

      .e-pill-amber  { background: #2a1a00 !important; }
      .e-pill-pink   { background: #2a0a1c !important; }
      .e-pill-cyan   { background: #042a36 !important; }
      .e-pill-violet { background: #1f0d3d !important; }
      .e-pill-green  { background: #042a1f !important; }
      .e-pill-red    { background: #2a0a0a !important; }
      .e-pill-blue   { background: #0a1a3d !important; }
      .e-pill-teal   { background: #042a26 !important; }
    }

    /* ===== Outlook.com / Hotmail ===== */
    [data-ogsc] .e-bg        { background: #0a0a0a !important; }
    [data-ogsc] .e-card            { background: #141414 !important; border-color: #262626 !important; }
    [data-ogsc] .e-card-expired    { border-color: #dc2626 !important; }
    [data-ogsc] .e-fg              { color: #fafafa !important; }
    [data-ogsc] .e-fg-muted  { color: #a3a3a3 !important; }
    [data-ogsc] .e-fg-dim    { color: #737373 !important; }
    [data-ogsc] .e-fg-faint  { color: #525252 !important; }
    [data-ogsc] .e-divider   { background: #262626 !important; }
    [data-ogsc] .e-border-t  { border-color: #262626 !important; }
    [data-ogsc] .e-tag-bg    { background: #0a0a0a !important; color: #525252 !important; }
    [data-ogsc] .e-pill-amber  { background: #2a1a00 !important; }
    [data-ogsc] .e-pill-pink   { background: #2a0a1c !important; }
    [data-ogsc] .e-pill-cyan   { background: #042a36 !important; }
    [data-ogsc] .e-pill-violet { background: #1f0d3d !important; }
    [data-ogsc] .e-pill-green  { background: #042a1f !important; }
    [data-ogsc] .e-pill-red    { background: #2a0a0a !important; }
    [data-ogsc] .e-pill-blue   { background: #0a1a3d !important; }
    [data-ogsc] .e-pill-teal   { background: #042a26 !important; }

    /* ===== Mobile : grille 2 colonnes -> 1 colonne ===== */
        @media only screen and (max-width: 600px) {
          .e-card-cell {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 0 12px 0 !important;
          }
        }
  </style>
  </head>
  <body class="e-bg" style="margin:0;padding:0;background:${C.bg};font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;color:${C.fg};">

  <table width="100%" cellpadding="0" cellspacing="0" class="e-bg" style="background:${C.bg};">
    <tr>
      <td align="center" style="padding:40px 20px 60px;">

        <!-- Container : 640px pour la grille 2 colonnes -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 32px 0;">
              <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${C.pink};">${esc(t(lang, "brand"))}</div>
              <div class="e-fg" style="margin-top:8px;font-size:22px;font-weight:700;color:${C.fg};line-height:1.25;letter-spacing:-0.01em;">
                ${greeting} \uD83D\uDC4B
              </div>
              <div class="e-fg-muted" style="margin-top:6px;font-size:14px;color:${C.fgMuted};line-height:1.5;">
                ${
                  taskCount
                    ? t(lang, "tasksDue", {
                        count: `<strong class="e-fg" style="color:${C.amber};font-weight:600;">${taskCount}</strong>`,
                        plural: pl,
                        done: `<strong class="e-fg" style="color:${C.green};font-weight:600;">${doneCount}</strong>`,
                        pluralDone: plDone,
                        expired: `<strong class="e-fg" style="color:${C.red};font-weight:600;">${expiredCount}</strong>`,
                        pluralExpired: plExpired,
                        project: `<span class="e-fg" style="color:${C.fg};font-weight:500;">${esc(projectName)}</span>`,
                      })
                    : t(lang, "noTasks", {
                        project: `<span class="e-fg" style="color:${C.fg};font-weight:500;">${esc(projectName)}</span>`,
                      })
                }
              </div>
            </td>
          </tr>

          ${
            taskCount
              ? `
          <!-- Divider -->
          <tr>
            <td style="padding:0 0 20px 0;">
              <div class="e-divider" style="height:1px;background:${C.border};"></div>
            </td>
          </tr>

          <!-- Grille 2 colonnes -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${taskGrid}
              </table>
            </td>
          </tr>`
              : ""
          }

          ${howToStartSection(howToStart, lang)}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <div class="e-divider" style="height:1px;background:${C.border};"></div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td class="e-fg-faint" style="font-size:11px;color:${C.fgFaint};line-height:1.6;">
                    ${esc(t(lang, "footer"))}
                  </td>
                  <td align="right">
                    <span style="display:inline-block;width:3px;height:3px;border-radius:50%;background:${C.pink};box-shadow:0 0 8px ${C.pink}55;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  </body>
  </html>`;

    // Minifie le HTML pour rester sous la limite Gmail (~102 KB).
    // On log aussi la taille avant/après pour pouvoir détecter en prod
    // les emails à risque de clipping.
    const htmlMin = minifyHtml(html);
    const sizeBefore = html.length;
    const sizeAfter = htmlMin.length;
    const kbAfter = (sizeAfter / 1024).toFixed(1);
    let warn = "";
    if (sizeAfter > 102000) warn = " ⚠️  CLIP GMAIL TRÈS PROBABLE";
    else if (sizeAfter > 90000) warn = " ⚠️  RISQUE CLIP GMAIL";
    console.log(
      `[email] HTML ${kbAfter} KB (avant minify : ${(sizeBefore / 1024).toFixed(1)} KB, gain ${(((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(0)} %)${warn}`,
    );

    return { html: htmlMin, text };
  };

  // ─── CRON ───────────────────────────────────────────────────
  const confs = arrayOf(
    new DynamicModel({
      emailKey: "",
      llmKey: "",
    }),
  );

  $app.db().select("emailKey", "llmKey").from("conf").all(confs);

  if (!confs) return;
  const conf = confs[0];

  //const tomorrow = new Date();
  // tomorrow.setDate(tomorrow.getDate() + 1);
  // tomorrow.setHours(0, 0, 0, 0);

  const projects = $app.findRecordsByFilter(
    "projects",
    "status = 'pending'",
    "-created",
  );

  $app.expandRecords(projects, ["owner"], null);

  if (!projects.length) return;

  projects.forEach((p) => {
    const ownerRecord = p.expandedOne("owner");

    // canUseKey contrôle l'accès à la section LLM "comment commencer".
    // Si false ou absent → mail standard sans la section.
    let canUseKey = false;
    try {
      canUseKey = ownerRecord.getBool("canUseKey");
    } catch (e) {
      canUseKey = false;
    }

    const owner = {
      email: ownerRecord.getString("email"),
      language: ownerRecord.getString("language"),
      firstName: ownerRecord.getString("firstName"),
      lastName: ownerRecord.getString("lastName"),
      canUseKey: canUseKey,
    };

    if (!owner?.email) return;

    const dueTasks = [];

    const project = JSON.parse(p.getString("data"));

    project?.nodes?.forEach((task) => {
      if (!task?.endDate) return;
      if (task?.status !== "done" && dueTasks.length < 7) {
        dueTasks.push(task);
      }
    });

    if (!dueTasks.length) return;

    // Sort events by date ASC
    dueTasks.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    const lang = owner?.language === "fr" ? "fr" : "en";
    const pl = plural(lang, dueTasks.length);

    // ─── Section "Comment commencer" via LLM (opt-in par owner) ───
    // Activée uniquement si :
    //   1. conf.llmKey est défini
    //   2. l'appel LLM réussit
    // En cas d'échec à n'importe quelle étape, le mail part quand même
    // sans cette section (graceful degradation).
    const tasksToSearch = [];
    const dateInSevenDays = new Date();
    dateInSevenDays.setDate(dateInSevenDays.getDate() + 7);
    dateInSevenDays.setHours(0, 0, 0, 0);

    const dateSevenDaysBefore = new Date();
    dateSevenDaysBefore.setDate(dateSevenDaysBefore.getDate() - 7);
    dateSevenDaysBefore.setHours(0, 0, 0, 0);

    for (let i = 0; i < dueTasks.length; i++) {
      const task = dueTasks[i];
      const endDate = new Date(task.endDate);
      if (
        endDate.getTime() < dateInSevenDays.getTime() &&
        endDate.getTime() > dateSevenDaysBefore.getTime() &&
        task?.status !== "done"
      ) {
        tasksToSearch.push(task);
      }
    }
    let howToStart = null;
    if (tasksToSearch.length === 0) {
      tasksToSearch.push(dueTasks?.[0]);
    }
    if (conf?.llmKey) {
      try {
        howToStart = fetchHowToStart(
          conf.llmKey,
          tasksToSearch,
          lang,
          project?.name || "",
        );
      } catch (e) {
        console.log("[LLM] Exception non capturée : " + e);
        howToStart = null;
      }
    } else {
      console.log(
        "[LLM] Section comment commencer ignorée — canUseKey=" +
          owner.canUseKey +
          ", hasLlmKey=" +
          !!conf?.llmKey,
      );
    }

    const { html, text } = emailContent(
      owner,
      dueTasks,
      project?.name,
      howToStart,
    );

    sendEmail(
      conf?.emailKey || "",
      html,
      text,
      owner.email,
      t(lang, "subject", {
        count: dueTasks.length,
        plural: pl,
        projectName: project?.name,
      }),
    );
  });
});
