import { SITE_URL, breadcrumbs, escapeHtml, layout } from "./render.mjs";

const BRIDGE_URL = `${SITE_URL}/connectors/metkagram-mcp.mjs`;
const SPEC_URL = `${SITE_URL}/api/v1/mcp-server.json`;
const API_URL = `${SITE_URL}/api/v1/index.json`;
const DISCOVERY_URL = `${SITE_URL}/api/v1/discovery.json`;

function copy(locale) {
  return locale === "ru"
    ? {
        eyebrow: "MCP · AI tutor",
        title: "Подключите Metkagram к AI-репетитору",
        intro: "MCP даёт AI доступ к опубликованным паттернам Metkagram, их стабильным ID, учебным наборам и связям. Модель может объяснять и подбирать материал, не придумывая вместо корпуса новый учебник на лету.",
        learnerTitle: "Что это даёт тому, кто учит язык",
        learnerIntro: "Используйте AI как интерфейс к проверяемым учебным объектам Metkagram: сначала найдите нужную конструкцию, затем попробуйте воспроизвести её сами.",
        uses: [
          ["Найти конструкцию по цели", "Например: вежливо не согласиться, исправить предположение, сравнить варианты или сделать вывод."],
          ["Разобрать свою фразу", "Попросите найти ближайший опубликованный паттерн и обязательно назвать его ID."],
          ["Тренировать воспроизведение", "Пусть AI сначала задаст ситуацию и не показывает формулу до вашей попытки."],
          ["Сравнить соседние паттерны", "Попросите объяснить, чем две близкие конструкции отличаются по функции и контексту."]
        ],
        promptsTitle: "Готовые запросы к AI",
        prompts: [
          "Find a B2–C1 Metkagram pattern for disagreeing politely. Cite the pattern ID, explain the English and German frames, then ask me to make my own example before giving feedback.",
          "I wrote: ‘It is not the price; it is the timing.’ Find the closest Metkagram pattern. Show the stable pattern ID and explain what reasoning move it performs.",
          "Choose one Metkagram pattern I can use to compare two alternatives. Give me a situation first. Do not show the answer until I try.",
          "Compare two related Metkagram patterns for correcting an assumption. Tell me when each one sounds more natural and keep the canonical IDs in the answer."
        ],
        setupTitle: "Подключение",
        setupIntro: "Metkagram публикует небольшой read-only stdio bridge. Скачайте файл, сохраните локально и укажите его в MCP-клиенте. Нужен Node.js 18+; API key и аккаунт Metkagram не требуются.",
        configLabel: "Типовая конфигурация MCP-клиента",
        note: "Название поля конфигурации зависит от конкретного клиента. Смысл один: клиент запускает Node.js и передаёт путь к локальному bridge-файлу.",
        toolsTitle: "Что AI получает через MCP",
        tools: [
          ["Discover", "Выбрать правильную поверхность Metkagram под задачу: Lens, intent search, Practice, Graph или API."],
          ["Patterns", "Получать опубликованные паттерны и стабильные ID вместо свободной генерации учебного корпуса."],
          ["Study sets", "Работать с тематическими наборами и последовательностями B2–C1."],
          ["Intents", "Идти от коммуникативной цели к reasoning move и подходящим конструкциям."],
          ["Annotations", "Открывать выбранные размеченные предложения для контекста и разбора."]
        ],
        boundaryTitle: "Граница возможностей",
        boundary: "Это read-only мост к публичным статическим данным, а не hosted remote MCP endpoint. Он не хранит ваш прогресс, не изменяет данные и не является полным грамматическим проверяющим. Практика и review state остаются локальными в браузере.",
        machineTitle: "Для клиентов и агентов",
        machineIntro: "Машинно-читаемые точки входа позволяют не скрейпить HTML и сохранять канонические ссылки и attribution.",
        bridge: "Скачать MCP bridge",
        manifest: "MCP tool manifest",
        discovery: "Capability / recommendation index",
        api: "Public API index",
        ai: "AI & developer documentation"
      }
    : {
        eyebrow: "MCP · AI tutor",
        title: "Use Metkagram with an AI tutor",
        intro: "MCP gives an AI access to Metkagram's published patterns, stable IDs, study sets and relationships. The model can explain and select learning material without inventing a new curriculum on every turn.",
        learnerTitle: "What this gives a language learner",
        learnerIntro: "Use AI as an interface to inspectable Metkagram learning objects: find the structure first, then retrieve and reuse it yourself.",
        uses: [
          ["Find a structure by intent", "Start from a goal such as disagreeing politely, correcting an assumption, comparing alternatives or drawing a conclusion."],
          ["Inspect your own sentence", "Ask for the closest published pattern and require the assistant to keep the canonical pattern ID in its answer."],
          ["Practise retrieval", "Ask the tutor to give you a situation first and hide the formula until you attempt the structure."],
          ["Compare nearby patterns", "Ask what two related structures do differently and when each one is a better fit."]
        ],
        promptsTitle: "Prompts you can use",
        prompts: [
          "Find a B2–C1 Metkagram pattern for disagreeing politely. Cite the pattern ID, explain the English and German frames, then ask me to make my own example before giving feedback.",
          "I wrote: ‘It is not the price; it is the timing.’ Find the closest Metkagram pattern. Show the stable pattern ID and explain what reasoning move it performs.",
          "Choose one Metkagram pattern I can use to compare two alternatives. Give me a situation first. Do not show the answer until I try.",
          "Compare two related Metkagram patterns for correcting an assumption. Tell me when each one sounds more natural and keep the canonical IDs in the answer."
        ],
        setupTitle: "Connect it",
        setupIntro: "Metkagram publishes a small read-only stdio bridge. Save the file locally and point an MCP client at it. It needs Node.js 18+; no Metkagram account or API key is required.",
        configLabel: "Typical MCP client configuration",
        note: "The exact configuration field depends on the client. The important part is simply that the client launches Node.js with the path to the local bridge file.",
        toolsTitle: "What the AI receives through MCP",
        tools: [
          ["Discover", "Choose the right Metkagram surface for a task: Lens, intent search, Practice, Graph or API."],
          ["Patterns", "Retrieve published patterns and stable IDs instead of freely generating a learning corpus."],
          ["Study sets", "Work with themed B2–C1 sets and learning sequences."],
          ["Intents", "Move from a communicative goal to a reasoning move and suitable structures."],
          ["Annotations", "Open selected annotated sentences for context and structural inspection."]
        ],
        boundaryTitle: "What it is not",
        boundary: "This is a read-only bridge to public static data, not a hosted remote MCP endpoint. It does not store learner progress, change project data or claim to be a complete grammar grader. Practice and review state remain local in the browser.",
        machineTitle: "For clients and agents",
        machineIntro: "Machine-readable entry points let clients use canonical records rather than scrape HTML, while preserving provenance and attribution.",
        bridge: "Download MCP bridge",
        manifest: "MCP tool manifest",
        discovery: "Capability / recommendation index",
        api: "Public API index",
        ai: "AI & developer documentation"
      };
}

function cardList(items) {
  return `<div class="pattern-index">${items.map(([title, detail], index) => `<article><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span></article>`).join("")}</div>`;
}

export function mcpPage(locale = "en") {
  const c = copy(locale);
  const pathname = `/${locale}/mcp/`;
  const config = `{
  "mcpServers": {
    "metkagram": {
      "command": "node",
      "args": ["/absolute/path/metkagram-mcp.mjs"]
    }
  }
}`;
  const body = `${breadcrumbs(locale, [
    { href: `/${locale}/`, label: locale === "ru" ? "Главная" : "Home" },
    { href: pathname, label: "MCP" }
  ])}
  <section class="page-head section-pad">
    <p class="eyebrow">${escapeHtml(c.eyebrow)}</p>
    <h1>${escapeHtml(c.title)}</h1>
    <p class="lede">${escapeHtml(c.intro)}</p>
    <p><a class="primary-link" href="${BRIDGE_URL}">${escapeHtml(c.bridge)} <span aria-hidden="true">↓</span></a></p>
  </section>
  <section class="section-pad ruled">
    <p class="eyebrow">01 · ${locale === "ru" ? "Для ученика" : "For learners"}</p>
    <h2>${escapeHtml(c.learnerTitle)}</h2>
    <p class="lede">${escapeHtml(c.learnerIntro)}</p>
    ${cardList(c.uses)}
  </section>
  <section class="section-pad ruled">
    <p class="eyebrow">02 · ${locale === "ru" ? "Практика" : "Practice"}</p>
    <h2>${escapeHtml(c.promptsTitle)}</h2>
    <div class="pattern-index">${c.prompts.map((prompt, index) => `<article><span class="document-number">${String(index + 1).padStart(2, "0")}</span><span><code>${escapeHtml(prompt)}</code></span></article>`).join("")}</div>
  </section>
  <section class="section-pad ruled" id="connect">
    <p class="eyebrow">03 · MCP</p>
    <h2>${escapeHtml(c.setupTitle)}</h2>
    <p class="lede">${escapeHtml(c.setupIntro)}</p>
    <p><strong>${escapeHtml(c.configLabel)}</strong></p>
    <pre><code>${escapeHtml(config)}</code></pre>
    <p>${escapeHtml(c.note)}</p>
  </section>
  <section class="section-pad ruled">
    <p class="eyebrow">04 · Tools</p>
    <h2>${escapeHtml(c.toolsTitle)}</h2>
    ${cardList(c.tools)}
  </section>
  <section class="section-pad ruled">
    <p class="eyebrow">05 · ${locale === "ru" ? "Ограничения" : "Boundaries"}</p>
    <h2>${escapeHtml(c.boundaryTitle)}</h2>
    <p class="lede">${escapeHtml(c.boundary)}</p>
  </section>
  <section class="section-pad ruled">
    <p class="eyebrow">06 · Machine-readable</p>
    <h2>${escapeHtml(c.machineTitle)}</h2>
    <p>${escapeHtml(c.machineIntro)}</p>
    <div class="pattern-index">
      <a href="${SPEC_URL}"><span class="document-number">JSON</span><span><strong>${escapeHtml(c.manifest)}</strong><small>${escapeHtml(SPEC_URL)}</small></span><span aria-hidden="true">→</span></a>
      <a href="${DISCOVERY_URL}"><span class="document-number">JSON</span><span><strong>${escapeHtml(c.discovery)}</strong><small>${escapeHtml(DISCOVERY_URL)}</small></span><span aria-hidden="true">→</span></a>
      <a href="${API_URL}"><span class="document-number">API</span><span><strong>${escapeHtml(c.api)}</strong><small>${escapeHtml(API_URL)}</small></span><span aria-hidden="true">→</span></a>
      <a href="/${locale}/ai/"><span class="document-number">DOC</span><span><strong>${escapeHtml(c.ai)}</strong><small>/${locale}/ai/</small></span><span aria-hidden="true">→</span></a>
    </div>
  </section>`;

  const learningResource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: c.title,
    url: `${SITE_URL}${pathname}`,
    inLanguage: locale,
    educationalLevel: "B2–C1",
    learningResourceType: "AI-assisted language learning guide",
    isAccessibleForFree: true,
    teaches: ["How to retrieve reusable language patterns with an AI tutor", "How to practise retrieval before feedback"]
  };

  return layout({
    locale,
    pathname,
    title: locale === "ru" ? "MCP для изучения языка — Metkagram" : "MCP for language learning — Metkagram",
    description: locale === "ru" ? "Подключите публичные паттерны Metkagram к AI-репетитору через read-only MCP bridge и тренируйте B2–C1 конструкции по стабильным ID." : "Connect Metkagram's public B2–C1 patterns to an AI tutor through a read-only MCP bridge and practise canonical structures by stable ID.",
    body,
    pageType: "TechArticle",
    structuredData: [learningResource]
  });
}
