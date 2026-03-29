const API = (() => {
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    return "/api";
  }
  return "http://localhost:3002/api";
})();

let currentCat  = "general";
let currentLang = "en";
let searchQuery = "";
let searchTimer = null;
let viewMode = "news";
let askAnswer = "";
let currentKidsData = null;

const VIEW_MODES = ["news", "briefing", "timeline", "kids", "ask"];
const SUPPORTED_LANGS = ["en","hi","ta","fr","de","es","ar","zh"];
const LANG_LOCALES = {
  en: "en-US",
  hi: "hi-IN",
  ta: "ta-IN",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
  ar: "ar-SA",
  zh: "zh-CN"
};

const TRANSLATIONS = {
  en: {
    searchPlaceholder: "Search live news…",
    cats: ["Top Stories","World","Technology","Business","Science","Health","Sports","Entertainment"],
    trendingNow: "Trending now",
    weather: "Weather",
    backToHeadlines: "Back to headlines",
    noArticles: "No articles found. Try a different category or search.",
    couldNotConnect: "Could not connect to backend.",
    loadingFeed: "Fetching live news…",
    trendingUnavailable: "Trending unavailable",
    weatherUnavailable: "Weather unavailable",
    sourceRead: "Read original article →"
  },
  hi: {
    searchPlaceholder: "लाइव समाचार खोजें…",
    cats: ["शीर्ष समाचार","दुनिया","टेक्नोलॉजी","व्यापार","विज्ञान","स्वास्थ्य","खेल","मनोरंजन"],
    trendingNow: "ट्रेंडिंग अभी",
    weather: "मौसम",
    backToHeadlines: "शीर्षकों पर वापस",
    noArticles: "कोई लेख नहीं मिला। किसी अन्य श्रेणी या खोज को आज़माएँ।",
    couldNotConnect: "बैकएंड से कनेक्ट नहीं कर सके।",
    loadingFeed: "लाइव समाचार लाया जा रहा है…",
    trendingUnavailable: "रुझान उपलब्ध नहीं",
    weatherUnavailable: "मौसम उपलब्ध नहीं",
    sourceRead: "मूल लेख पढ़ें →"
  },
  ta: {
    searchPlaceholder: "লাইভ সংবাদ সন্ধান করুন…",
    cats: ["முக்கிய செய்திகள்","உலகம்","தொழில்நுட்பம்","வணிகம்","வியல்","சுகம்","விளையாட்டு","பெருந் பொழுதுபோக்கு"],
    trendingNow: "பிரபலம் இப்போது",
    weather: "வானிலை",
    backToHeadlines: "தகவல்களுக்கு திரும்புங்கள்",
    noArticles: "நிரலைக் காண முடியவில்லை. வேறு வகையை அல்லது தேடலை முயற்சிக்கவும்.",
    couldNotConnect: "பின்தளம் தொடர்பு கொள்ள இயலவில்லை.",
    loadingFeed: "லைவ் செய்திகள் எடுக்கப்படுகின்றன…",
    trendingUnavailable: "பிரபலம் கிடைக்கவில்லை",
    weatherUnavailable: "வானிலை கிடைக்கவில்லை",
    sourceRead: "மூலக் கட்டுரையைப் படிக்க →"
  },
  fr: {
    searchPlaceholder: "Rechercher des actualités…",
    cats: ["À la une","Monde","Technologie","Business","Science","Santé","Sport","Divertissement"],
    trendingNow: "Tendances du moment",
    weather: "Météo",
    backToHeadlines: "Retour aux titres",
    noArticles: "Aucun article trouvé. Essayez une autre catégorie ou recherche.",
    couldNotConnect: "Impossible de se connecter au backend.",
    loadingFeed: "Récupération des actualités…",
    trendingUnavailable: "Tendances indisponibles",
    weatherUnavailable: "Météo indisponible",
    sourceRead: "Lire l'article original →"
  },
  de: {
    searchPlaceholder: "Live-Nachrichten suchen…",
    cats: ["Top-Nachrichten","Welt","Technologie","Business","Wissenschaft","Gesundheit","Sport","Unterhaltung"],
    trendingNow: "Aktuell im Trend",
    weather: "Wetter",
    backToHeadlines: "Zurück zu den Schlagzeilen",
    noArticles: "Keine Artikel gefunden. Versuche eine andere Kategorie oder Suche.",
    couldNotConnect: "Keine Verbindung zum Backend möglich.",
    loadingFeed: "Live-Nachrichten werden geladen…",
    trendingUnavailable: "Trends nicht verfügbar",
    weatherUnavailable: "Wetter nicht verfügbar",
    sourceRead: "Originalartikel lesen →"
  },
  es: {
    searchPlaceholder: "Buscar noticias en vivo…",
    cats: ["Titulares","Mundo","Tecnología","Negocios","Ciencia","Salud","Deportes","Entretenimiento"],
    trendingNow: "Tendencias ahora",
    weather: "Clima",
    backToHeadlines: "Volver a los titulares",
    noArticles: "No se encontraron artículos. Prueba otra categoría o búsqueda.",
    couldNotConnect: "No se pudo conectar al backend.",
    loadingFeed: "Recuperando noticias en vivo…",
    trendingUnavailable: "Tendencias no disponibles",
    weatherUnavailable: "Clima no disponible",
    sourceRead: "Leer artículo original →"
  },
  ar: {
    searchPlaceholder: "ابحث عن الأخبار الحية…",
    cats: ["أهم الأخبار","العالم","التقنية","الأعمال","العلوم","الصحة","الرياضة","الترفيه"],
    trendingNow: "الرائج الآن",
    weather: "الطقس",
    backToHeadlines: "العودة إلى العناوين",
    noArticles: "لم يتم العثور على مقالات. حاول فئة أو بحثًا آخر.",
    couldNotConnect: "تعذر الاتصال بالخادم.",
    loadingFeed: "جلب الأخبار المباشرة…",
    trendingUnavailable: "الاتجاهات غير متوفرة",
    weatherUnavailable: "الطقس غير متوفر",
    sourceRead: "اقرأ المقال الأصلي →"
  },
  zh: {
    searchPlaceholder: "搜索实时新闻…",
    cats: ["头条","世界","技术","商业","科学","健康","体育","娱乐"],
    trendingNow: "实时趋势",
    weather: "天气",
    backToHeadlines: "返回头条",
    noArticles: "未找到文章。请尝试其他分类或搜索。",
    couldNotConnect: "无法连接到后端。",
    loadingFeed: "正在获取实时新闻…",
    trendingUnavailable: "趋势不可用",
    weatherUnavailable: "天气不可用",
    sourceRead: "阅读原文 →"
  }
};

const CATEGORY_KEYS = ["general","world","tech","business","science","health","sports","entertainment"];

// ── Category colors ────────────────────────────────────
const CAT_COLORS = {
  general:       { bg:"#EAF3DE", text:"#27500A" },
  tech:          { bg:"#E6F1FB", text:"#0C447C" },
  world:         { bg:"#FAECE7", text:"#712B13" },
  business:      { bg:"#EAF3DE", text:"#27500A" },
  science:       { bg:"#E1F5EE", text:"#085041" },
  health:        { bg:"#FBEAF0", text:"#72243E" },
  sports:        { bg:"#FAEEDA", text:"#633806" },
  entertainment: { bg:"#EEEDFE", text:"#3C3489" },
};
function cc(cat) { return CAT_COLORS[cat] || { bg:"#F1EFE8", text:"#444441" }; }

function updateFeatureButtons() {
  document.querySelectorAll(".feature-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim().toLowerCase().includes(viewMode));
  });
}

function setFeature(mode) {
  if (!VIEW_MODES.includes(mode)) mode = "news";
  viewMode = mode;
  if (mode !== "kids") currentKidsData = null;
  updateFeatureButtons();
  renderFeatureWidget();
  if (mode === "ask") {
    document.getElementById("askPanel")?.classList.remove("hidden");
  }
  loadFeed();
}

function renderFeatureWidget() {
  const widget = document.getElementById("featureWidget");
  if (!widget) return;

  if (viewMode === "ask") {
    widget.innerHTML = `<div class="feature-widget"><strong>Ask Analyst</strong><p class="kid-note">Ask about today's headlines, trending topics, or global events.</p></div>`;
    document.getElementById("askPanel")?.classList.remove("hidden");
    return;
  }

  document.getElementById("askPanel")?.classList.add("hidden");

  if (viewMode === "briefing") {
    const briefing = generateBriefingText(currentArticles);
    widget.innerHTML = `<div class="feature-widget"><strong>AI News Briefing</strong><p>${briefing}</p></div>`;
  } else if (viewMode === "timeline") {
    widget.innerHTML = `<div class="feature-widget"><strong>Story Timeline</strong><p class="kid-note">The feed shows the story arc and event impact level.</p></div>`;
  } else if (viewMode === "kids") {
    if (currentKidsData) {
      widget.innerHTML = `
        <div class="feature-widget">
          <strong>Kids Corner</strong>
          <p>${currentKidsData.kid_explanation}</p>
          <p><strong>Hard words:</strong> ${Object.entries(currentKidsData.hard_words).map(([word, meaning]) => `${word}: ${meaning}`).join(", ")}</p>
          <p><strong>Why it matters:</strong> ${currentKidsData.why_it_matters}</p>
          <p><strong>Fun fact:</strong> ${currentKidsData.fun_fact}</p>
          <p><strong>Quiz:</strong> ${currentKidsData.quiz_question}</p>
        </div>`;
    } else {
      widget.innerHTML = `<div class="feature-widget"><strong>Kids Corner</strong><p class="kid-note">Loading a fun story for kids...</p></div>`;
      loadKidsCorner();
    }
  } else {
    widget.innerHTML = `<div class="feature-widget"><strong>Live News Dashboard</strong><p class="kid-note">Browse the latest headlines and switch between views.</p></div>`;
  }
}

function generateKidsSummary(articles) {
  if (!articles || articles.length === 0) return "No stories are available to simplify right now.";
  const top = articles[0];
  return `🌟 Fun story time! ${simplifyForKids(top.title || top.summary)}<br/><br/>🤔 Why it matters: ${kidWhyItMatters(top)}`;
}

function loadKidsCorner() {
  currentKidsData = null;
  const params = new URLSearchParams({ cat: searchQuery ? "all" : currentCat, lang: currentLang });
  if (searchQuery) params.set("q", searchQuery);
  fetch(`${API}/articles/kids?${params}`)
    .then(res => res.json())
    .then(json => {
      if (json.success) {
        currentKidsData = json.data;
      } else {
        currentKidsData = {
          kid_explanation: "Let’s get a fun kids version ready — hold tight!",
          hard_words: {"story": "a thing that happened", "important": "something that matters"},
          why_it_matters: "This story is interesting because it helps us learn about real life.",
          fun_fact: "Kids love news with cool facts!",
          quiz_question: "What was the most interesting thing in this news story?"
        };
      }
      renderFeatureWidget();
    })
    .catch(() => {
      currentKidsData = {
        kid_explanation: "The kids story is coming soon — stay tuned!",
        hard_words: {"story": "something that happened", "news": "information about events"},
        why_it_matters: "News helps us learn about the world.",
        fun_fact: "Sometimes headlines are like short stories.",
        quiz_question: "What new thing did you learn from this news?"
      };
      renderFeatureWidget();
    });
}

function generateBriefingText(articles) {
  if (!articles || articles.length === 0) return "No articles available for briefing right now.";
  const top = articles.slice(0, 3);
  const highlights = top.map((a, idx) => `<strong>${idx + 1}.</strong> ${a.title}`).join("<br/>");
  return `
    <strong>Key Highlights</strong><br/>
    ${highlights}<br/><br/>
    <strong>Investors</strong> → ${investorImpact(top)}<br/>
    <strong>Startups</strong> → ${startupImpact(top)}<br/>
    <strong>Future Outlook</strong> → ${futureOutlook(top)}
  `;
}

function investorImpact(articles) {
  const text = articles.map(a => a.title + " " + a.summary).join(" ").toLowerCase();
  if (/funding|ipo|acquisition|deal|investment/.test(text)) {
    return "Capital flows may shift toward companies with strong growth and clear business models.";
  }
  if (/technology|ai|software|platform/.test(text)) {
    return "Investors should watch for momentum in technology sectors and AI innovation.";
  }
  if (/health|science|medicine/.test(text)) {
    return "Healthcare and biotech may draw attention as new treatments and regulations emerge.";
  }
  return "Markets may react to sentiment around major events and corporate news.";
}

function startupImpact(articles) {
  const text = articles.map(a => a.title + " " + a.summary).join(" ").toLowerCase();
  if (/funding|launch|startup|seed|series/.test(text)) {
    return "Founders should prepare for fast-moving competition and funding shifts.";
  }
  if (/regulation|policy|government/.test(text)) {
    return "Startups may need to adapt quickly to new rules or changing market demand.";
  }
  return "Early-stage teams can use this news to refine product focus and investor messaging.";
}

function futureOutlook(articles) {
  const text = articles.map(a => a.title + " " + a.summary).join(" ").toLowerCase();
  if (/technology|ai|digital|software/.test(text)) {
    return "Expect continued innovation in digital services and platform ecosystems.";
  }
  if (/health|science|medical/.test(text)) {
    return "The next phase is likely to focus on research, approvals, and public adoption.";
  }
  if (/world|geopolitic|trade|economy/.test(text)) {
    return "Global events may shape policy and market sentiment for weeks ahead.";
  }
  return "This story may evolve quickly, so watch for follow-up headlines.";
}

function simplifyForKids(text) {
  if (!text) return "This story is about something important happening today.";
  let simplified = text
    .replace(/technology/gi, "smart tools")
    .replace(/artificial intelligence|AI/gi, "smart computers")
    .replace(/investment|investing/gi, "money choices")
    .replace(/startup/gi, "new company")
    .replace(/government/gi, "the people who make rules")
    .replace(/economy/gi, "how money moves")
    .replace(/regulation/gi, "new rules")
    .replace(/research/gi, "studies")
    .replace(/innovation/gi, "new ideas");
  simplified = simplified.replace(/[^a-zA-Z0-9 ,.?!]/g, "");
  if (simplified.length > 120) simplified = simplified.slice(0, 120) + "...";
  return simplified;
}

function kidWhyItMatters(article) {
  if (!article) return "This news is important because it affects people and businesses.";
  if (/technology|ai|software/.test(article.title + " " + article.summary)) {
    return "Kids should know that new tech can change how people work and play.";
  }
  if (/health|science/.test(article.title + " " + article.summary)) {
    return "This can help people stay healthy or learn about new science.";
  }
  if (/world|trade|government/.test(article.title + " " + article.summary)) {
    return "It matters because it can change how countries and people work together.";
  }
  return "It matters because it affects lives, money, and the future.";
}

function impactLevel(article) {
  if (!article) return "Medium";
  const text = (article.title + " " + article.summary).toLowerCase();
  if (/crisis|risk|surge|collapse|urgent/.test(text)) return "High";
  if (/rise|gain|launch|growth/.test(text)) return "Medium";
  return "Low";
}

function submitAnalystQuestion() {
  const question = document.getElementById("askInput")?.value || "";
  const result = document.getElementById("askResult");
  if (!question.trim()) {
    if (result) result.textContent = "Please enter a question for the analyst.";
    return;
  }
  if (result) result.textContent = "Analyzing the latest headlines...";

  fetch(`${API}/articles/ask?q=${encodeURIComponent(question)}&lang=${currentLang}`)
    .then(res => res.json())
    .then(json => {
      if (!json.success) {
        if (result) result.textContent = json.message || "Unable to answer right now.";
        return;
      }
      let html = `<p>${json.answer}</p>`;
      if (json.sources && json.sources.length) {
        html += `<div class="ask-sources"><strong>Read more:</strong><ul>${json.sources.map(src => `<li><a href="${src.url}" target="_blank" rel="noopener">${src.title || src.source || 'Source link'}</a></li>`).join("")}</ul></div>`;
      }
      if (result) result.innerHTML = html;
    })
    .catch(() => {
      if (result) result.textContent = "The analyst service is unavailable right now.";
    });
}

function translate(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
    ? TRANSLATIONS[currentLang][key]
    : TRANSLATIONS.en[key];
}

function detectUserLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage || "en").slice(0,2).toLowerCase();
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en";
}

function updateDateLabel() {
  const locale = LANG_LOCALES[currentLang] || "en-US";
  document.getElementById("dateLabel").textContent =
    new Date().toLocaleDateString(locale, { weekday:"short", year:"numeric", month:"short", day:"numeric" });
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.getElementById("searchInput").placeholder = translate("searchPlaceholder");
  const catEls = document.querySelectorAll(".cat");
  const catLabels = translate("cats");
  catEls.forEach((el, idx) => {
    if (catLabels[idx]) el.textContent = catLabels[idx];
  });
  const sideTitles = document.querySelectorAll(".side-title");
  if (sideTitles[0]) sideTitles[0].textContent = translate("trendingNow");
  if (sideTitles[1]) sideTitles[1].textContent = translate("weather");
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    const textNode = Array.from(backBtn.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.textContent = ` ${translate("backToHeadlines")}`;
  }
  updateDateLabel();
}

function setLanguage(lang) {
  currentLang = SUPPORTED_LANGS.includes(lang) ? lang : "en";
  const select = document.getElementById("langSelect");
  if (select) select.value = currentLang;
  applyTranslations();
}

// ── Init ───────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(detectUserLanguage());
  updateFeatureButtons();
  renderFeatureWidget();
  loadFeed();
  loadTrending();
  loadWeather();
});

// ── Language change ────────────────────────────────────
function onLangChange(lang) {
  setLanguage(lang);
  loadFeed();
  loadTrending();
}

// ── Category change ────────────────────────────────────
function setCategory(cat, el) {
  currentCat  = cat;
  searchQuery = "";
  document.getElementById("searchInput").value = "";
  document.querySelectorAll(".cat").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  closeDetail();
  loadFeed();
}

// ── Search ─────────────────────────────────────────────
function onSearch(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = val.trim();
    closeDetail();
    loadFeed();
  }, 400);
}

// ── Load feed ──────────────────────────────────────────
async function loadFeed() {
  const feed = document.getElementById("feed");
  feed.innerHTML = `<div class="loading"><div class="spinner"></div>${translate("loadingFeed")}</div>`;

  try {
    const params = new URLSearchParams({ cat: searchQuery ? "all" : currentCat, lang: currentLang, max: 12 });
    if (searchQuery) params.set("q", searchQuery);

    const res  = await fetch(`${API}/articles?${params}`);
    const json = await res.json();

    currentArticles = json.data || [];
    renderFeatureWidget();

    if (!json.success || !json.data.length) {
      feed.innerHTML = `<div class="empty">${translate("noArticles")}</div>`;
      return;
    }
    renderFeed(json.data);
    if (viewMode === "kids") loadKidsCorner();
  } catch (err) {
    document.getElementById("feed").innerHTML = `
      <div class="error-msg">
        <strong>${translate("couldNotConnect")}</strong><br>
        Make sure the server is running: <code>cd backend && npm start</code>
      </div>`;
  }
}

// ── Render feed ────────────────────────────────────────
function renderFeed(articles) {
  const feed = document.getElementById("feed");
  const sorted = [...articles];
  if (viewMode === "timeline") {
    sorted.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  }

  const cards = sorted.map((a, i) => {
    const c = cc(a.cat);
    const kidClass = viewMode === "kids" ? " kid-card" : "";
    const cardClass = viewMode === "timeline" ? "timeline-card" : `card${kidClass}`;
    const imgEl = a.image
      ? `<img class="thumb${i===0?' big':''}" src="${a.image}" alt="" onerror="this.style.display='none'" loading="lazy"/>`
      : `<div class="thumb${i===0?' big':''} placeholder" style="background:${c.bg}"></div>`;
    const summaryText = viewMode === "kids" ? simplifyForKids(a.summary || a.title) : a.summary;
    const whyText = viewMode === "kids" ? `<div class="kid-note">Why it matters: ${kidWhyItMatters(a)}</div>` : "";
    const impact = viewMode === "timeline" ? `<span class="impact-level">${impactLevel(a)}</span>` : "";

    if (viewMode === "timeline") {
      return `
      <div class="${cardClass}" onclick="openDetail(${JSON.stringify(a).replace(/"/g,'&quot;')})">
        <div class="meta">
          <span class="cat-tag" style="background:${c.bg};color:${c.text}">${a.catLabel}</span>
          <span>${a.source}</span><span>·</span><span>${a.time}</span>
          ${impact}
        </div>
        <div class="art-title">${a.title}</div>
        <div class="art-summary">${summaryText}</div>
      </div>`;
    }

    if (i === 0) return `
      <div class="${cardClass} featured" onclick="openDetail(${JSON.stringify(a).replace(/"/g,'&quot;')})">
        ${imgEl}
        <div>
          <div class="meta">
            <span class="cat-tag" style="background:${c.bg};color:${c.text}">${a.catLabel}</span>
            <span>${a.source}</span><span>·</span><span>${a.time}</span>
            ${a.readTime ? `<span>·</span><span>${a.readTime}</span>` : ""}
          </div>
          <div class="art-title big">${a.title}</div>
          <div class="art-summary">${summaryText}</div>
          ${whyText}
          <span class="read-more">${translate("sourceRead")}</span>
        </div>
      </div>`;

    return `
      <div class="${cardClass}" onclick="openDetail(${JSON.stringify(a).replace(/"/g,'&quot;')})">
        ${a.image
          ? `<img class="thumb" src="${a.image}" alt="" onerror="this.style.display='none'" loading="lazy"/>`
          : `<div class="thumb placeholder" style="background:${c.bg}"></div>`}
        <div class="art-body">
          <div class="meta">
            <span class="cat-tag" style="background:${c.bg};color:${c.text}">${a.catLabel}</span>
            <span>${a.source}</span><span>·</span><span>${a.time}</span>
          </div>
          <div class="art-title">${a.title}</div>
          <div class="art-summary">${summaryText}</div>
          ${whyText}
        </div>
      </div>`;
  }).join("");

  if (viewMode === "timeline") {
    feed.innerHTML = `<div class="timeline-list">${cards}</div>`;
    return;
  }
  feed.innerHTML = cards;
}

// ── Detail view ────────────────────────────────────────
function openDetail(a) {
  if (typeof a === "string") a = JSON.parse(a);
  const c  = cc(a.cat);
  const imgEl = a.image
    ? `<img class="detail-img" src="${a.image}" alt="" onerror="this.style.display='none'"/>`
    : `<div class="detail-img placeholder"><svg width="40" height="40" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" stroke="${c.text}" stroke-width="1.5"/><circle cx="8.5" cy="8.5" r="1.5" fill="${c.text}"/><path d="M21 15l-5-5L5 21" stroke="${c.text}" stroke-width="1.5" stroke-linecap="round"/></svg></div>`;

  // Format body paragraphs
  const bodyHtml = (a.body || a.summary || "")
    .split(/\n\n+/)
    .map(p => `<p>${p.trim()}</p>`)
    .join("");

  document.getElementById("detailContent").innerHTML = `
    ${imgEl}
    <span class="detail-cat" style="background:${c.bg};color:${c.text}">${a.catLabel}</span>
    <div class="detail-title">${a.title}</div>
    <div class="detail-meta">
      <span>
        <svg width="13" height="13" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        ${a.time}
      </span>
      ${a.author ? `<span>By ${a.author}</span>` : ""}
      ${a.readTime ? `<span>${a.readTime}</span>` : ""}
      <span>${a.source}</span>
    </div>
    <div class="divider"></div>
    <div class="detail-body">${bodyHtml}</div>
    ${a.sourceUrl ? `<a class="source-link" href="${a.sourceUrl}" target="_blank" rel="noopener">
      ${translate("sourceRead")}
      <svg width="12" height="12" fill="none" viewBox="0 0 16 16"><path d="M6 3h7v7M13 3L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </a>` : ""}
  `;

  document.getElementById("feed").style.display   = "none";
  document.getElementById("detail").classList.add("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeDetail() {
  document.getElementById("detail").classList.remove("open");
  document.getElementById("feed").style.display = "flex";
}

// ── Trending ───────────────────────────────────────────
async function loadTrending() {
  try {
    const res  = await fetch(`${API}/articles/trending?lang=${currentLang}`);
    const json = await res.json();
    const el   = document.getElementById("trending");
    if (!json.success || !json.data.length) { el.innerHTML = `<div class='empty'>${translate("trendingUnavailable")}</div>`; return; }
    el.innerHTML = json.data.map((t, i) => `
      <div class="trend-item" onclick="window.open('${t.url||"#"}','_blank')">
        <div class="trend-num">${i+1}</div>
        <div>
          <div class="trend-text">${t.title}</div>
          <div class="trend-src">${t.source} · ${t.time}</div>
        </div>
      </div>`).join("");
  } catch {
    document.getElementById("trending").innerHTML = `<div class='empty'>${translate("trendingUnavailable")}</div>`;
  }
}

// ── Weather ────────────────────────────────────────────
async function loadWeather() {
  try {
    const res  = await fetch(`${API}/weather?city=Chennai`);
    const json = await res.json();
    const el   = document.getElementById("weather");
    if (!json.success) { el.innerHTML = "<div class='empty'>Weather unavailable</div>"; return; }
    const d = json.data;
    el.innerHTML = `
      <div class="weather-card">
        <div class="w-row">
          <div>
            <div class="w-city">${d.city}</div>
            <div class="w-desc">${d.description}</div>
            <div class="w-meta">Humidity ${d.humidity}% · Wind ${d.wind} km/h</div>
          </div>
          <div class="w-temp">${d.temp}°C</div>
        </div>
        <div class="w-days">
          ${d.forecast.map(f => `
            <div class="w-day">
              ${f.day}
              <strong>${f.high}°</strong>
              <small>${f.low}°</small>
            </div>`).join("")}
        </div>
      </div>`;
  } catch {
    document.getElementById("weather").innerHTML = `<div class='empty'>${translate("weatherUnavailable")}</div>`;
  }
}
