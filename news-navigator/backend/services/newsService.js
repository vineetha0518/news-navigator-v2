const axios = require("axios");
const RSSParser = require("rss-parser");

const parser = new RSSParser({
  customFields: { item: ["media:content", "media:thumbnail", "enclosure"] }
});

const KIDS_CORNER_PROMPT_TEMPLATE = `You are an educational AI assistant that explains business and technology news to children aged 10–14.

Topic: {topic}

Summary:
{summary}

Your task is to convert this news into simple, engaging, and easy-to-understand content for kids.

Instructions:
- Use very simple English
- Avoid technical jargon
- Keep sentences short and clear
- Use relatable examples if possible
- Be accurate but easy to understand
- Use a fun, playful tone with a little humor
- Make the explanation feel like a friendly story

Return ONLY a valid JSON object with the following structure:
{
  "kid_explanation": "Explain the topic in 4-5 simple sentences",
  "hard_words": {
    "word1": "simple meaning",
    "word2": "simple meaning"
  },
  "why_it_matters": "Explain why this topic is important in 2-3 simple sentences",
  "fun_fact": "Give one interesting and fun fact related to the topic",
  "quiz_question": "Create one simple multiple choice question with 3 options"
}

STRICT RULES:
- Do NOT include markdown (no ```json)
- Do NOT include extra text outside JSON
- Ensure JSON is valid and properly formatted
- Keep language suitable for children

Your goal is to make the news understandable and interesting for kids.
`;

function buildKidsPrompt(topic, summary) {
  return KIDS_CORNER_PROMPT_TEMPLATE
    .replace("{topic}", topic || "Latest news")
    .replace("{summary}", summary || "");
}

// ── Simple in-memory cache (5 min TTL) ────────────────
const cache = {};
function getCache(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < 5 * 60 * 1000) return entry.data;
  return null;
}
function setCache(key, data) {
  cache[key] = { data, ts: Date.now() };
}

// ── Category → GNews topic / RSS feed mapping ─────────
const CATEGORY_MAP = {
  general:  { gnewsTopic: "breaking-news", rss: "https://feeds.bbci.co.uk/news/rss.xml" },
  world:    { gnewsTopic: "world",         rss: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  tech:     { gnewsTopic: "technology",    rss: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  business: { gnewsTopic: "business",      rss: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  science:  { gnewsTopic: "science",       rss: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml" },
  health:   { gnewsTopic: "health",        rss: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  sports:   { gnewsTopic: "sports",        rss: "https://feeds.bbci.co.uk/sport/rss.xml" },
  entertainment: { gnewsTopic: "entertainment", rss: "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml" }
};

const LANG_MAP = {
  en: "en", ta: "ta", hi: "hi", fr: "fr", de: "de", es: "es", ar: "ar", zh: "zh"
};

// ── Normalise a GNews article ──────────────────────────
function normaliseGNews(a, cat) {
  return {
    id: Buffer.from(a.url).toString("base64").slice(0, 16),
    cat,
    catLabel: cat.charAt(0).toUpperCase() + cat.slice(1),
    title: a.title,
    summary: a.description || "",
    body: a.content || a.description || "",
    author: a.source?.name || "Unknown",
    source: a.source?.name || "News",
    sourceUrl: a.url,
    image: a.image || null,
    time: timeAgo(a.publishedAt),
    publishedAt: a.publishedAt,
    readTime: estimateReadTime(a.content || a.description || ""),
    lang: "en"
  };
}

// ── Normalise an RSS item ──────────────────────────────
function normaliseRSS(item, cat, sourceName) {
  const image =
    item["media:content"]?.$.url ||
    item["media:thumbnail"]?.$.url ||
    item.enclosure?.url ||
    null;
  return {
    id: Buffer.from(item.link || item.guid || item.title).toString("base64").slice(0, 16),
    cat,
    catLabel: cat.charAt(0).toUpperCase() + cat.slice(1),
    title: item.title || "",
    summary: stripHtml(item.contentSnippet || item.summary || ""),
    body: stripHtml(item.content || item.contentSnippet || item.summary || ""),
    author: item.creator || item.author || sourceName,
    source: sourceName,
    sourceUrl: item.link || "",
    image,
    time: item.pubDate ? timeAgo(item.pubDate) : "recently",
    publishedAt: item.pubDate || new Date().toISOString(),
    readTime: estimateReadTime(item.content || item.contentSnippet || ""),
    lang: "en"
  };
}

// ── Fetch from NewsAPI ───────────────────────────────
async function fetchNewsApi({ cat = "general", lang = "en", q = "", max = 10 }) {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey || apiKey === "your_newsapi_key_here") return null;

  const langCode = LANG_MAP[lang] || "en";
  const safeCat = cat === "all" ? "" : cat;
  let url;

  if (q) {
    url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${langCode}&pageSize=${max}&apiKey=${apiKey}`;
  } else {
    if (safeCat) {
      url = `https://newsapi.org/v2/top-headlines?category=${safeCat}&language=${langCode}&pageSize=${max}&apiKey=${apiKey}`;
    } else {
      url = `https://newsapi.org/v2/top-headlines?language=${langCode}&pageSize=${max}&apiKey=${apiKey}`;
    }
  }

  try {
    const res = await axios.get(url, { timeout: 8000 });
    return (res.data.articles || []).map(a => ({
      id: Buffer.from(a.url || a.title || Math.random().toString()).toString("base64").slice(0, 16),
      cat,
      catLabel: (safeCat || "general").charAt(0).toUpperCase() + (safeCat || "general").slice(1),
      title: a.title,
      summary: a.description || "",
      body: a.content || a.description || "",
      author: a.source?.name || "Unknown",
      source: a.source?.name || "News",
      sourceUrl: a.url,
      image: a.urlToImage || null,
      time: a.publishedAt ? timeAgo(a.publishedAt) : "recently",
      publishedAt: a.publishedAt || new Date().toISOString(),
      readTime: estimateReadTime(a.content || a.description || ""),
      lang: langCode
    }));
  } catch (err) {
    console.error("NewsAPI error:", err.message);
    return null;
  }
}

// ── Fetch from GNews ───────────────────────────────────
async function fetchGNews({ cat = "general", lang = "en", q = "", max = 10 }) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey || apiKey === "your_gnews_api_key_here") return null;

  const topic = CATEGORY_MAP[cat]?.gnewsTopic || "breaking-news";
  const langCode = LANG_MAP[lang] || "en";

  let url;
  if (q) {
    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${langCode}&max=${max}&apikey=${apiKey}`;
  } else {
    url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=${langCode}&max=${max}&apikey=${apiKey}`;
  }

  try {
    const res = await axios.get(url, { timeout: 8000 });
    return (res.data.articles || []).map(a => normaliseGNews(a, cat));
  } catch (err) {
    console.error("GNews error:", err.message);
    return null;
  }
}

// ── Fetch from RSS (fallback) ──────────────────────────
async function fetchRSS(cat = "general") {
  const feeds = [];
  if (cat === "all") {
    const uniqueFeeds = [...new Set(Object.values(CATEGORY_MAP).map(item => item.rss))];
    feeds.push(...uniqueFeeds.map(rssUrl => {
      const found = Object.entries(CATEGORY_MAP).find(([, item]) => item.rss === rssUrl);
      return { rssUrl, cat: found ? found[0] : "general" };
    }));
  } else {
    const feedUrl = CATEGORY_MAP[cat]?.rss || CATEGORY_MAP.general.rss;
    feeds.push({ rssUrl: feedUrl, cat });
  }

  try {
    const results = await Promise.all(feeds.map(async ({ rssUrl, cat: feedCat }) => {
      try {
        const feed = await parser.parseURL(rssUrl);
        const sourceName = feed.title || "News";
        return (feed.items || []).slice(0, 10).map(item => normaliseRSS(item, feedCat, sourceName));
      } catch (err) {
        console.error("RSS feed error for", rssUrl, err.message);
        return [];
      }
    }));

    return results.flat().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 40);
  } catch (err) {
    console.error("RSS error:", err.message);
    return [];
  }
}

// ── Main fetch — NewsAPI / GNews / RSS fallback ─────────
async function fetchNews({ cat = "general", lang = "en", q = "", max = 10 }) {
  const effectiveCat = q ? "all" : cat;
  const cacheKey = `${effectiveCat}-${lang}-${q}-${max}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  let articles = await fetchNewsApi({ cat: effectiveCat, lang, q, max });

  if ((!articles || articles.length === 0) && process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== "your_gnews_api_key_here") {
    articles = await fetchGNews({ cat: effectiveCat, lang, q, max });
  }

  if (!articles || articles.length === 0) {
    console.log(`Primary news sources unavailable for cat=${effectiveCat}, falling back to RSS`);
    articles = await fetchRSS(effectiveCat);
  }

  // Search filter on fallback RSS results
  if (q && articles.length > 0) {
    const ql = q.toLowerCase();
    articles = articles.filter(
      a => a.title.toLowerCase().includes(ql) || a.summary.toLowerCase().includes(ql) || a.body.toLowerCase().includes(ql)
    );
  }

  setCache(cacheKey, articles);
  return articles;
}

// ── Ask Analyst ───────────────────────────────────────
function inferAnalystTone(question) {
  const q = (question || "").toLowerCase();
  if (/startup|founder|founders|series|seed/.test(q)) {
    return "For startups, this means focusing on product-market fit and funding momentum.";
  }
  if (/investor|stocks|market|shares|portfolio/.test(q)) {
    return "For investors, the key is to balance opportunity against near-term volatility.";
  }
  if (/future|outlook|predict|impact/.test(q)) {
    return "The outlook is that the next wave of headlines will determine whether this becomes a lasting trend.";
  }
  return "This is a signal to stay alert and adjust plans as the story develops.";
}

async function askAnalyst(question = "", lang = "en") {
  const cleanQuestion = (question || "").trim();
  if (!cleanQuestion) {
    return "Ask a question about the latest news, technology, health, sports, or world events.";
  }

  const category = Object.keys(CATEGORY_MAP).find(cat => cleanQuestion.toLowerCase().includes(cat)) || "general";
  const articles = await fetchNews({ cat: category, lang, q: cleanQuestion, max: 5 });

  if (!articles || articles.length === 0) {
    return "I couldn't fetch the latest headlines just now. Please try again in a moment.";
  }

  const sample = articles.slice(0, 3);
  const titles = sample.map(a => a.title).join("; ");
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const tone = inferAnalystTone(cleanQuestion);
  const sources = sample.map(a => ({ title: a.title, url: a.sourceUrl || a.source || "", source: a.source }));

  return {
    answer: `Based on recent ${categoryLabel} news, here are the key points: ${titles}. ${tone}`,
    sources
  };
}

function splitSentences(text) {
  if (!text) return [];
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function chooseHighlights(text, count = 3) {
  const sentences = splitSentences(text);
  return sentences.slice(0, count).map(s => s.replace(/[.!?]+$/, "")).filter(Boolean);
}

function normalizeWords(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9 ]+/gi, " ").replace(/\s+/g, " ").trim();
}

function roleImpact(text, role) {
  const normalized = normalizeWords(text);
  if (role === "investor") {
    if (/growth|revenue|profit|market|shares|stocks/.test(normalized)) {
      return "Investors should watch valuations and sector momentum to identify the strongest opportunities.";
    }
    if (/risk|decline|drop|loss/.test(normalized)) {
      return "This news suggests caution, as market sentiment may be unstable in the near term.";
    }
    return "The situation appears relevant for investors seeking strategic exposure to emerging themes.";
  }
  if (role === "founder") {
    if (/funding|startup|launch|innovation|partnership/.test(normalized)) {
      return "Founders should align their roadmap with changing customer demand and funding signals.";
    }
    if (/regulation|policy|governance/.test(normalized)) {
      return "Startups may need to adapt quickly to new rules or shifting industry requirements.";
    }
    return "This insight is useful for founders planning product, go-to-market, and investor conversations.";
  }
  return "This helps students understand the main idea and why it matters in everyday life.";
}

function futureOutlook(text) {
  const normalized = normalizeWords(text);
  if (/technology|ai|digital|innovation/.test(normalized)) {
    return "Expect continued momentum in innovation-led sectors and further product evolution.";
  }
  if (/health|science|medical/.test(normalized)) {
    return "The next phase will likely focus on research, adoption, and regulatory progress.";
  }
  if (/economy|trade|policy|government/.test(normalized)) {
    return "Broader macro trends may drive follow-on developments and policy responses.";
  }
  return "This story should be monitored as it develops over the coming days.";
}

function hardWordsFromText(text) {
  const words = (text || "").match(/\b[A-Za-z]{7,}\b/g) || [];
  const unique = [...new Set(words.map(w => w.toLowerCase()))];
  return unique.slice(0, 5);
}

function wordMeaning(word) {
  const mapping = {
    technology: "smart tools",
    artificial: "very smart",
    intelligence: "thinking power",
    startup: "new company",
    economy: "how money moves",
    regulation: "new rules",
    government: "people who make rules",
    investment: "money choices",
    market: "business activity",
    innovation: "new ideas"
  };
  return mapping[word.toLowerCase()] || "a word that is important in this story";
}

function hardWordsObject(text) {
  const words = hardWordsFromText(text).slice(0, 2);
  return Object.fromEntries(words.map(w => [w, wordMeaning(w)]));
}

function simplifyForKids(text) {
  const replacements = {
    technology: "smart tools",
    artificial: "very smart",
    intelligence: "thinking power",
    startup: "new company",
    economy: "how money moves",
    regulation: "new rules",
    government: "people who make rules",
    investment: "money choices",
    market: "business activity",
    innovation: "new ideas"
  };
  return (text || "")
    .replace(/\b(technology|artificial|intelligence|startup|economy|regulation|government|investment|market|innovation)\b/gi,
      m => replacements[m.toLowerCase()] || m)
    .replace(/\s+/g, " ")
    .trim();
}

function timelineImpactLevel(text) {
  const normalized = normalizeWords(text);
  if (/crisis|collapse|risk|urgent|decline|loss/.test(normalized)) return "High";
  if (/gain|rise|launch|growth|partnership|deal/.test(normalized)) return "Medium";
  return "Low";
}

function generateBriefing(topic = "", summary = "", articles = []) {
  const content = [topic, summary]
    .concat(articles.slice(0, 3).map(a => `${a.title}. ${a.summary}`))
    .filter(Boolean)
    .join(" ");
  return {
    topic: topic || "Latest news",
    key_highlights: chooseHighlights(content, 3),
    impact_on_investors: roleImpact(content, "investor"),
    impact_on_startups: roleImpact(content, "founder"),
    future_outlook: futureOutlook(content)
  };
}

function generateTimeline(topic = "", summary = "", articles = []) {
  const source = articles.length ? articles : [{ title: summary || topic, summary, publishedAt: new Date().toISOString() }];
  const sorted = [...source].sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  return sorted.slice(0, 6).map((item, index) => ({
    date: item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : `Event ${index + 1}`,
    event: item.title || item.summary || `Update ${index + 1}`,
    impact_level: timelineImpactLevel(item.title + " " + item.summary)
  }));
}

function generateKidsCorner(topic = "", summary = "", articles = []) {
  const sourceText = summary || articles[0]?.summary || articles[0]?.title || topic;
  const playfulText = simplifyForKids(sourceText);
  return {
    topic: topic || "Latest news",
    prompt: buildKidsPrompt(topic, summary || sourceText),
    kid_explanation: `Imagine this news is a cartoon: ${playfulText}`,
    hard_words: hardWordsObject(sourceText),
    why_it_matters: "This news is important because it helps you understand how the world is changing in a fun way.",
    fun_fact: `Fun fact: this kind of news can be as surprising as finding a cookie in your backpack!`,
    quiz_question: `If this news were a story, what would be the funniest part? A) the main idea B) the big surprise C) the made-up monster?`
  };
}

function personalizeContent(articles = [], role = "student") {
  const text = articles.slice(0, 3).map(a => `${a.title}. ${a.summary}`).join(" ");
  return {
    investor_view: roleImpact(text, "investor"),
    founder_view: roleImpact(text, "founder"),
    student_view: roleImpact(text, "student")
  };
}

function sentimentAnalysis(summary = "") {
  const positive = ["gain","rise","growth","strong","positive","up","win","opportunity","lead"];
  const negative = ["drop","decline","loss","risk","weak","negative","down","problem","crisis"];
  const text = normalizeWords(summary);
  const posCount = positive.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
  const negCount = negative.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
  const sentiment = posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";
  const reasoning = posCount !== negCount
    ? `The summary contains more ${sentiment} terms than the opposite tone.`
    : "The summary is balanced and does not strongly lean positive or negative.";
  return { sentiment, reasoning };
}

// ── Fetch trending (top headlines across all topics) ───
async function fetchTrending(lang = "en") {
  const cacheKey = `trending-${lang}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const newsApiKey = process.env.NEWSAPI_KEY;
  const gnewsApiKey = process.env.GNEWS_API_KEY;
  let items = [];
  const langCode = LANG_MAP[lang] || "en";

  if (newsApiKey && newsApiKey !== "your_newsapi_key_here") {
    try {
      const res = await axios.get(
        `https://newsapi.org/v2/top-headlines?language=${langCode}&pageSize=5&apiKey=${newsApiKey}`,
        { timeout: 8000 }
      );
      items = (res.data.articles || []).map((a, i) => ({
        id: i + 1,
        title: a.title,
        source: a.source?.name || "News",
        time: a.publishedAt ? timeAgo(a.publishedAt) : "recently",
        url: a.url
      }));
    } catch (err) {
      console.error("NewsAPI trending error:", err.message);
    }
  }

  if (items.length === 0 && gnewsApiKey && gnewsApiKey !== "your_gnews_api_key_here") {
    try {
      const res = await axios.get(
        `https://gnews.io/api/v4/top-headlines?lang=${langCode}&max=5&apikey=${gnewsApiKey}`,
        { timeout: 8000 }
      );
      items = (res.data.articles || []).map((a, i) => ({
        id: i + 1,
        title: a.title,
        source: a.source?.name || "News",
        time: timeAgo(a.publishedAt),
        url: a.url
      }));
    } catch (err) {
      console.error("GNews trending error:", err.message);
    }
  }

  // RSS fallback for trending
  if (items.length === 0) {
    try {
      const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
      items = (feed.items || []).slice(0, 5).map((item, i) => ({
        id: i + 1,
        title: item.title,
        source: "BBC News",
        time: item.pubDate ? timeAgo(item.pubDate) : "recently",
        url: item.link
      }));
    } catch (err) {
      console.error("RSS trending error:", err.message);
    }
  }

  setCache(cacheKey, items);
  return items;
}

// ── Helpers ────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function estimateReadTime(text) {
  const words = (text || "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

module.exports = {
  fetchNews,
  fetchTrending,
  askAnalyst,
  generateBriefing,
  generateTimeline,
  generateKidsCorner,
  personalizeContent,
  sentimentAnalysis
};
