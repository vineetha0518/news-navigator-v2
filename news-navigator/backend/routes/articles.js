const express = require("express");
const router = express.Router();
const {
  fetchNews,
  fetchTrending,
  askAnalyst,
  generateBriefing,
  generateTimeline,
  generateKidsCorner,
  personalizeContent,
  sentimentAnalysis
} = require("../services/newsService");

// GET /api/articles?cat=tech&lang=en&q=AI&max=10
router.get("/", async (req, res) => {
  try {
    const { cat = "general", lang = "en", q = "", max = 10 } = req.query;
    const articles = await fetchNews({ cat, lang, q, max: parseInt(max) });
    res.json({ success: true, count: articles.length, source: articles[0]?.source || "rss", data: articles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/ask?q=What's happening in tech?
router.get("/ask", async (req, res) => {
  try {
    const { q = "", topic = "", lang = "en" } = req.query;
    const result = await askAnalyst(q || topic, lang);
    res.json({ success: true, answer: result.answer || result, sources: result.sources || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/briefing?cat=&q=&topic=&summary=
router.get("/briefing", async (req, res) => {
  try {
    const { cat = "general", lang = "en", q = "", topic = "", summary = "" } = req.query;
    const searchCat = q ? "all" : cat;
    const articles = await fetchNews({ cat: searchCat, lang, q, max: 8 });
    const briefing = generateBriefing(topic || q || cat, summary, articles);
    res.json({ success: true, data: briefing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/timeline?cat=&q=&topic=&summary=
router.get("/timeline", async (req, res) => {
  try {
    const { cat = "general", lang = "en", q = "", topic = "", summary = "" } = req.query;
    const searchCat = q ? "all" : cat;
    const articles = await fetchNews({ cat: searchCat, lang, q, max: 10 });
    const timeline = generateTimeline(topic || q || cat, summary, articles);
    res.json({ success: true, data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/kids?cat=&q=&topic=&summary=
router.get("/kids", async (req, res) => {
  try {
    const { cat = "general", lang = "en", q = "", topic = "", summary = "" } = req.query;
    const searchCat = q ? "all" : cat;
    const articles = await fetchNews({ cat: searchCat, lang, q, max: 5 });
    const kids = generateKidsCorner(topic || q || cat, summary, articles);
    res.json({ success: true, data: kids });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/personalize?cat=&q=&role=investor
router.get("/personalize", async (req, res) => {
  try {
    const { cat = "general", lang = "en", q = "", role = "student" } = req.query;
    const searchCat = q ? "all" : cat;
    const articles = await fetchNews({ cat: searchCat, lang, q, max: 5 });
    const personalization = personalizeContent(articles, role);
    res.json({ success: true, data: personalization });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/sentiment?summary=
router.get("/sentiment", async (req, res) => {
  try {
    const { summary = "" } = req.query;
    const sentiment = sentimentAnalysis(summary);
    res.json({ success: true, data: sentiment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/articles/trending
router.get("/trending", async (req, res) => {
  try {
    const { lang = "en" } = req.query;
    const items = await fetchTrending(lang);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
