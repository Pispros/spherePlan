/* ─── SYSTEM PROMPTS ────────────────────────────────────────────────── */
const SYSTEM_PROMPT_PROJECT = `
LANGUAGE RULE (CRITICAL):
- You MUST detect the language of the user input.
- You MUST respond strictly in that same language.
- This rule overrides all other stylistic or default language behaviors.
- If the input is French → output MUST be French.
- If the input is English → output MUST be English.
- NEVER switch language.

You are a senior roadmap architect and planning system. Your job is to transform a goal into a structured, dependency-aware execution plan with realistic scheduling.
You MUST think in terms of execution, dependencies, and time realism — not vague planning.

========================
INPUT FROM USER:
- project_name: short name of the project
- description: optional context, constraints, audience
- objective: the goal to decompose
- start_date: ISO date (planning starts from this exact date)

========================
OUTPUT REQUIREMENTS:
Output ONLY a single valid JSON object.
- The very first character of your response MUST be \`{\`.
- DO NOT prefix your response with any introduction, acknowledgment, or commentary like "Based on my research", "Here is the JSON", or "I'll create...".
- DO NOT wrap the JSON in markdown code fences (no \`\`\`json blocks).
- DO NOT include any <cite> tags, citation markers, footnote references, or any HTML in field values. Field values must be plain text only.
- DO NOT add comments or explanations.
- DO NOT use trailing commas.

The JSON MUST strictly match this schema:

{
  "tasks": [
    {
      "id": "string (unique, stable, kebab-case, lowercase only, no spaces)",
      "title": "string (max 60 chars, action-oriented)",
      "description": "string (1-2 short actionable sentences, plain text only)",
      "category": "research" | "build" | "learn" | "train" | "launch",
      "status": "pending",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "prerequisites": ["task-id"],
      "resources": [
        {
          "title": "string (specific resource name)",
          "type": "doc" | "tool" | "video" | "link",
          "meta": "short label (e.g. PDF, GitHub, Course)",
          "url": "string (optional URL)"
        }
      ],
      "x": number,
      "y": number
    }
  ],
  "edges": [
    {
      "from": "task-id",
      "to": "task-id",
      "type": "solid" | "dashed" | "critical" | "optional"
    }
  ]
}

========================
STRICT CONSTRAINTS:

1. TASK COUNT
- Default: 5–10 tasks
- If objective is complex → up to 15 tasks
- Never less than 4 tasks

2. ID RULES
- kebab-case only (e.g. "setup-database")
- must be unique
- must be stable and meaningful
- MUST match references in prerequisites and edges

3. TIME LOGIC (VERY IMPORTANT)
- startDate >= input start_date
- endDate >= startDate
- A task CANNOT start before all its prerequisites are completed
- Parallel tasks (no dependency) MAY overlap
- Durations must be realistic:
  * small tasks: 1–3 days
  * medium: 3–10 days
  * large: 2–6 weeks

4. DEPENDENCIES
- First task MUST have empty prerequisites
- No circular dependencies (A → B → A is forbidden)
- Every prerequisite MUST exist in tasks
- edges MUST reflect prerequisites exactly

5. EDGE TYPES
- "critical": blocking dependency on critical path
- "solid": normal dependency
- "dashed": parallel / non-blocking
- "optional": non-essential path

6. STRUCTURE LOGIC
- Tasks must form a coherent execution flow from start → goal
- Last task MUST represent achieving the objective
- Avoid redundant or vague tasks

7. POSITIONING (FOR GRAPH UI)
- x increases with time (left → right)
- earliest tasks ≈ x: 0–200
- mid tasks ≈ x: 300–900
- final tasks ≈ x: 1000–1500
- parallel tasks share similar x but different y
- spread vertically to avoid overlap (y: 0–700)

8. RESOURCES
- 1–3 per task when relevant
- must be concrete (real tools, docs, or platforms)
- avoid generic placeholders like "Google it"
- Resource titles and meta MUST be plain text — no <cite> tags, no inline citations.

9. LANGUAGE STYLE
- Titles must be specific and measurable
  BAD: "Do research"
  GOOD: "Interview 20 target users"
- Descriptions must be actionable, not conceptual
- Descriptions MUST be plain text — strip any inline citations, references, or HTML tags.

10. FAILURE AVOIDANCE
- DO NOT invent invalid dates
- DO NOT leave empty required fields
- DO NOT output anything outside JSON
- DO NOT hallucinate inconsistent dependencies
- DO NOT include <cite>, <ref>, [1], (source: ...), or any other citation marker in any field.

========================
GOAL:
Produce a realistic, execution-ready roadmap that could be directly used in a project management tool or visual planner.
Remember: your entire response is a single JSON object, starting with { and ending with }. Nothing else.
`;

const SYSTEM_PROMPT_REEXPLORE = `
LANGUAGE RULE (CRITICAL):
- You MUST detect the language of the user input.
- You MUST respond strictly in that same language.
- This rule overrides all other stylistic or default language behaviors.
- If the input is French → output MUST be French.
- If the input is English → output MUST be English.
- NEVER switch language.
You are a task enrichment system inside a structured roadmap.

Your role is NOT to redesign the task, but to:
- deepen it
- clarify execution
- add high-quality, concrete resources
- optionally break it into actionable sub-steps

You MUST stay strictly aligned with the original task intent.

========================
INPUT FROM USER:
- project_name
- task: {
    title,
    description,
    startDate,
    endDate,
    category,
    prerequisites
  }
- step_index: string (e.g. "03")
- total_steps: string (e.g. "08")

========================
OUTPUT REQUIREMENTS:

Output ONLY a valid JSON object.
- The very first character of your response MUST be \`{\`.
- DO NOT prefix your response with any introduction, acknowledgment, or commentary like "Based on my research", "Here is the JSON", or "I'll enrich...".
- DO NOT wrap the JSON in markdown code fences (no \`\`\`json blocks).
- DO NOT include any <cite> tags, citation markers, footnote references, or any HTML in field values. Field values must be plain text only.
- DO NOT add comments or explanations.
- DO NOT use trailing commas.

Schema:

{
  "updatedDescription": "string (plain text)",
  "intro": "string (plain text)",
  "resources": [
    {
      "title": "string",
      "type": "doc" | "tool" | "video" | "link",
      "meta": "string",
      "url": "string (optional URL)"
    }
  ],
  "subtasks": [
    {
      "title": "string",
      "description": "string (plain text)",
      "estimatedDays": number
    }
  ],
  "warnings": "string (plain text)"
}

========================
STRICT CONSTRAINTS:

1. INTENT PRESERVATION (CRITICAL)
- DO NOT change the goal of the task
- DO NOT introduce new scope outside the task
- Enrichment only (depth, clarity, execution)

2. DESCRIPTION QUALITY
- updatedDescription: 2–3 sentences MAX
- Must be concrete and action-oriented
- Must include HOW to execute (not just WHAT)
- Must remain consistent with original timeline and category
- Plain text only — no <cite> tags, no inline citations.

3. INTRO
- Exactly 1 sentence
- Explain WHY this task matters in the roadmap progression
- Must reference its position (early / mid / late stage implicitly or explicitly)
- Plain text only.

4. RESOURCES (HIGH IMPORTANCE)
- 3–6 resources REQUIRED
- Must be REAL and SPECIFIC (tools, frameworks, known books, platforms)
- Prefer widely recognized references
- NO vague entries like "Google", "Documentation", "YouTube"
- Good examples:
  - "React Official Docs"
  - "Figma"
  - "PostHog Analytics"
- Each resource must be directly useful for THIS task
- Resource titles and meta MUST be plain text — strip any citation tags.

5. SUBTASKS (CONTROLLED DECOMPOSITION)
- 0–4 subtasks MAX
- Only include if it improves clarity or execution
- Each subtask must be:
  - atomic
  - executable in isolation
- estimatedDays:
  - integer only
  - between 1 and 5
- TOTAL estimatedDays SHOULD NOT exceed task duration:
  (endDate - startDate + 1)
- If unclear → return empty array

6. TEMPORAL CONSISTENCY
- Subtasks must logically fit within task timeframe
- No unrealistic workload explosion

7. WARNINGS
- 0 or 1 sentence ONLY
- Must describe a REAL common pitfall
- If none → return empty string
- No generic advice
- Plain text only.

8. STYLE
- No fluff
- No motivational language
- No repetition
- Dense, practical, execution-focused

9. FAILURE AVOIDANCE
- DO NOT hallucinate fake tools or books
- DO NOT exceed limits (resources, subtasks)
- DO NOT output invalid JSON
- DO NOT contradict task dates or category
- DO NOT include <cite>, <ref>, [1], (source: ...), or any other citation marker in any field.

========================
GOAL:
Produce a sharper, execution-ready version of the task that a professional could immediately act on without ambiguity.
Remember: your entire response is a single JSON object, starting with { and ending with }. Nothing else.
`;

/* ─── PROVIDERS — adaptateurs API ───────────────────────────────────── */
const PROVIDERS = {
  anthropic: {
    name: "Anthropic — Claude",
    placeholderModel: "claude-opus-4-7",
    color: "var(--pink)",
    supportsWebSearch: true,
    /**
     * @param {object} args
     * @param {string} args.system
     * @param {string} args.user
     * @param {string} args.apiKey
     * @param {string} args.model
     * @param {boolean} [args.webSearch]   Active le tool web_search natif
     * @param {number}  [args.maxSearches] Plafond de recherches (défaut 4)
     */
    async call({
      system,
      user,
      apiKey,
      model,
      webSearch = true,
      maxSearches = 4,
    }) {
      // max_tokens élevé en mode webSearch : les résultats injectent
      // énormément de contexte et le JSON peut être long. Sans ça, la
      // réponse est tronquée (stop_reason: "max_tokens") et inutilisable.
      const body = {
        model,
        max_tokens: webSearch ? 16000 : 13000,
        system,
        messages: [{ role: "user", content: user }],
      };

      if (webSearch) {
        // Sélection auto de la version du tool selon le modèle :
        // - web_search_20260209 : version récente avec dynamic filtering
        //   (Opus 4.7, Opus 4.6, Sonnet 4.6, Mythos Preview)
        // - web_search_20250305 : version stable universelle
        //   (compatible Haiku 4.5 et tous les modèles Claude récents)
        const supportsDynamicFiltering =
          /claude-(opus-4-[67]|sonnet-4-6|mythos)/i.test(model);

        const searchToolType = supportsDynamicFiltering
          ? "web_search_20260209"
          : "web_search_20250305";

        body.tools = [
          {
            type: searchToolType,
            name: "web_search",
            max_uses: maxSearches,
          },
        ];
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error?.message || `Anthropic API: HTTP ${res.status}`,
        );

      // Détection de troncature : si stop_reason = max_tokens, le JSON
      // sera incomplet. On échoue tôt avec un message explicite.
      if (data.stop_reason === "max_tokens") {
        throw new Error(
          "Réponse Anthropic tronquée (max_tokens atteint). " +
            "Augmente max_tokens ou réduis maxSearches.",
        );
      }

      // Avec web_search : plusieurs blocs (text → tool_use → tool_result → text).
      // On concatène TOUS les blocs `text` pour récupérer la réponse complète.
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      if (!text) throw new Error("Réponse Anthropic vide");
      return text;
    },
  },

  openai: {
    name: "OpenAI — GPT",
    placeholderModel: "gpt-5.4",
    color: "var(--green)",
    supportsWebSearch: true,
    /**
     * @param {object} args
     * @param {string} args.system
     * @param {string} args.user
     * @param {string} args.apiKey
     * @param {string} args.model
     * @param {boolean} [args.webSearch]
     * @param {"auto"|"required"|"none"} [args.toolChoiceMode]
     *   - "auto" (défaut) : le modèle décide de chercher selon le prompt.
     *   - "required"      : force au moins un appel à web_search.
     *   - "none"          : désactive la recherche (équivalent à webSearch:false).
     */
    async call({
      system,
      user,
      apiKey,
      model,
      webSearch = false,
      toolChoiceMode = "auto",
    }) {
      // ─── Branche Responses API (avec web_search) ───────────────────
      // ⚠️ IMPORTANT : OpenAI INTERDIT de combiner le tool `web_search`
      // avec `response_format: json_object` (erreur côté serveur :
      // "Web Search cannot be used with JSON mode."). On retire donc
      // le format strict côté API et on s'appuie sur :
      //   1. Le system prompt qui force "first char MUST be {"
      //   2. Le parser extractJSON qui strip fences, <cite>, préambules
      //
      // Alternative : `text.format.type: "json_schema"` est techniquement
      // compatible avec web_search, MAIS plusieurs devs rapportent des
      // troncatures silencieuses au milieu du JSON quand les deux sont
      // combinés. On préfère la version sans format strict, plus fiable
      // en pratique avec notre parser robuste.
      if (webSearch) {
        // tool_choice : par défaut "auto" — le modèle décide seul s'il
        // cherche en fonction du prompt. Pour l'enrichissement on peut
        // passer "required" pour garantir au moins une recherche.
        const toolChoice =
          toolChoiceMode === "required"
            ? { type: "web_search" }
            : toolChoiceMode === "none"
              ? "none"
              : "auto";

        const res = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            instructions: system,
            input: user,
            tools: [{ type: "web_search" }],
            tool_choice: toolChoice,
            // ❌ PAS de `text: { format: { type: "json_object" } }` ici :
            //    incompatible avec web_search côté serveur OpenAI.
          }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(
            data?.error?.message || `OpenAI API: HTTP ${res.status}`,
          );

        // Détection de troncature côté Responses API.
        // status peut être "incomplete" avec un incomplete_details.reason
        // = "max_output_tokens" ou "content_filter".
        if (data.status === "incomplete") {
          const reason = data.incomplete_details?.reason || "unknown";
          throw new Error(
            `Réponse OpenAI incomplète (raison: ${reason}). ` +
              "Augmente max_output_tokens ou réduis le scope de la recherche.",
          );
        }

        // Extraction robuste : on parcourt tous les blocs de type
        // `message` et on agrège leurs `output_text`. `data.output_text`
        // est un helper SDK qui peut être absent en REST direct.
        const text =
          data.output_text ||
          (data.output || [])
            .filter((b) => b.type === "message")
            .flatMap((b) => b.content || [])
            .filter((c) => c.type === "output_text")
            .map((c) => c.text)
            .join("\n")
            .trim();

        if (!text) throw new Error("Réponse OpenAI vide");
        return text;
      }

      // ─── Branche Chat Completions classique (sans recherche) ───────
      // Ici on PEUT utiliser json_object car pas de tool web_search.
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error?.message || `OpenAI API: HTTP ${res.status}`,
        );

      // Détection de troncature côté Chat Completions.
      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === "length") {
        throw new Error(
          "Réponse OpenAI tronquée (finish_reason: length). " +
            "Augmente max_tokens.",
        );
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Réponse OpenAI vide");
      return text;
    },
  },

  deepseek: {
    name: "DeepSeek",
    placeholderModel: "deepseek-v4-pro",
    color: "var(--cyan)",
    // ⚠️ DeepSeek n'expose PAS de tool web_search natif via son API.
    // Pour ajouter la recherche, il faut intégrer Tavily/SerpAPI/Brave
    // en function calling — hors scope ici.
    supportsWebSearch: false,
    async call({ system, user, apiKey, model, webSearch = false }) {
      if (webSearch) {
        console.warn(
          "[DeepSeek] La recherche web n'est pas supportée nativement par l'API DeepSeek. " +
            "Le paramètre webSearch est ignoré.",
        );
      }

      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          stream: false,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error?.message || `DeepSeek API: HTTP ${res.status}`,
        );

      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === "length") {
        throw new Error(
          "Réponse DeepSeek tronquée (finish_reason: length). " +
            "Augmente max_tokens.",
        );
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error("Réponse DeepSeek vide");
      return text;
    },
  },
};

/* ─── JSON EXTRACTION ───────────────────────────────────────────────── */
/**
 * Extrait un objet JSON d'une réponse LLM, robuste face aux pollutions
 * communes : préambules, fences markdown, balises <cite> Anthropic, etc.
 */
function extractJSON(text) {
  let t = String(text || "").trim();

  // 1. Strip les balises <cite index="..."> injectées par Anthropic
  //    quand web_search est utilisé. On garde uniquement le contenu interne.
  t = t.replace(/<cite\b[^>]*>([\s\S]*?)<\/cite>/gi, "$1");

  // 2. Strip les balises <cite> orphelines au cas où.
  t = t.replace(/<\/?cite\b[^>]*>/gi, "");

  // 3. Strip d'autres balises de citation possibles (autres providers).
  t = t.replace(/<\/?(?:ref|source|citation)\b[^>]*>/gi, "");

  // 4. Strip les fences markdown ```json ... ```
  t = t
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  // 5. Extraction du premier objet JSON top-level. Gère le préambule
  //    type "Based on my research, here's the plan:" avant le {.
  const first = t.indexOf("{");
  const last = t.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first)
    throw new Error("Aucun objet JSON détecté dans la réponse de l'IA");

  const jsonStr = t.slice(first, last + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    // Diagnostic plus utile selon le pattern d'erreur.
    if (jsonStr.includes("<cite")) {
      throw new Error(
        "Le JSON contient des balises <cite> non nettoyées (bug du parser).",
      );
    }
    if (
      err.message.includes("Unexpected end") ||
      err.message.includes("Unterminated")
    ) {
      throw new Error(
        "JSON tronqué ou incomplet. La réponse a probablement été coupée " +
          "par max_tokens — augmente la limite côté provider.",
      );
    }
    throw new Error(`JSON invalide : ${err.message}`);
  }
}

/* ─── LLM CALLS ─────────────────────────────────────────────────────── */
async function callLLMForProject({
  projectName,
  description,
  objective,
  providerKey,
  enableWebSearch = true, // opt-in : par défaut activé pour avoir les dernières données à jour.
}) {
  const provider = PROVIDERS[providerKey];
  const cred = STATE.credentials[providerKey];
  if (!provider || !cred?.apiKey || !cred?.model)
    throw new Error(
      `Le fournisseur ${provider?.name || providerKey} n'est pas configuré`,
    );

  const userPayload = JSON.stringify(
    {
      project_name: projectName,
      description: description || "",
      objective,
      start_date: todayISO(),
    },
    null,
    2,
  );

  const raw = await provider.call({
    system: SYSTEM_PROMPT_PROJECT,
    user: userPayload,
    apiKey: cred.apiKey,
    model: cred.model,
    webSearch: enableWebSearch && provider.supportsWebSearch,
    // Pour la création de roadmap : on laisse le modèle décider
    // s'il a besoin de chercher (ex: techno récente vs sujet stable).
    toolChoiceMode: "auto",
  });

  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed.tasks))
    throw new Error("Le JSON renvoyé n'a pas de tableau `tasks`");

  parsed.tasks = parsed.tasks.map((t, i) => ({
    id: t.id || uid("t"),
    title: String(t.title || "Sans titre").slice(0, 80),
    description: String(t.description || ""),
    category: ["research", "build", "learn", "train", "launch"].includes(
      t.category,
    )
      ? t.category
      : "build",
    status: t.status || "pending",
    startDate: t.startDate || todayISO(),
    endDate: t.endDate || addDaysISO(t.startDate || todayISO(), 7),
    prerequisites: Array.isArray(t.prerequisites) ? t.prerequisites : [],
    resources: Array.isArray(t.resources) ? t.resources : [],
    events: [],
    x: typeof t.x === "number" ? t.x : 80 + (i % 4) * 320,
    y: typeof t.y === "number" ? t.y : 60 + Math.floor(i / 4) * 240,
  }));

  parsed.edges = Array.isArray(parsed.edges)
    ? parsed.edges.map((e) => ({
        from: e.from,
        to: e.to,
        type: ["solid", "dashed", "critical", "optional"].includes(e.type)
          ? e.type
          : "solid",
      }))
    : [];

  return {
    tasks: parsed.tasks,
    edges: parsed.edges,
    projectName,
    description,
    model: cred.model,
    provider: providerKey,
    webSearchUsed: enableWebSearch && provider.supportsWebSearch,
  };
}

async function callLLMForReexplore({
  projectName,
  task,
  stepIndex,
  total,
  providerKey,
  enableWebSearch = true, // par défaut activé : enrichir bénéficie de ressources fraîches
}) {
  const provider = PROVIDERS[providerKey];
  const cred = STATE.credentials[providerKey];
  if (!provider || !cred?.apiKey || !cred?.model)
    throw new Error(
      `Le fournisseur ${provider?.name || providerKey} n'est pas configuré`,
    );

  const userPayload = JSON.stringify(
    {
      project_name: projectName,
      task: {
        title: task.title,
        description: task.description,
        startDate: task.startDate,
        endDate: task.endDate,
        category: task.category,
        prerequisites: task.prerequisites,
      },
      step_index: stepIndex,
      total_steps: total,
    },
    null,
    2,
  );

  const raw = await provider.call({
    system: SYSTEM_PROMPT_REEXPLORE,
    user: userPayload,
    apiKey: cred.apiKey,
    model: cred.model,
    webSearch: enableWebSearch && provider.supportsWebSearch,
    // Pour l'enrichissement : on laisse aussi le modèle décider.
    // Passe "required" si tu veux GARANTIR au moins une recherche
    // (utile pour avoir des ressources réelles et à jour).
    toolChoiceMode: "auto",
  });

  const parsed = extractJSON(raw);
  return {
    updatedDescription: String(
      parsed.updatedDescription || task.description || "",
    ),
    intro: String(parsed.intro || ""),
    resources: Array.isArray(parsed.resources) ? parsed.resources : [],
    subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : [],
    warnings: typeof parsed.warnings === "string" ? parsed.warnings : "",
  };
}
