require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const articlesRouter = require("./routes/articles");
const weatherRouter  = require("./routes/weather");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/articles", articlesRouter);
app.use("/api/weather",  weatherRouter);

app.get("/api/health", (req, res) => {
  const hasGNewsKey = !!(process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== "your_gnews_api_key_here");
  res.json({
    success: true,
    message: "News Navigator API is running",
    newsSource: hasGNewsKey ? "GNews API (live)" : "RSS feeds (free fallback)",
    weatherSource: "Open-Meteo (free, no key needed)",
    timestamp: new Date().toISOString()
  });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ success: false, message: "Route not found" });
  }
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  const hasKey = !!(process.env.GNEWS_API_KEY && process.env.GNEWS_API_KEY !== "your_gnews_api_key_here");
  console.log(`\n  News Navigator API  →  http://localhost:${PORT}`);
  console.log(`  News source         →  ${hasKey ? "GNews API (live)" : "RSS feeds (free fallback — no key needed)"}`);
  console.log(`  Weather source      →  Open-Meteo (free, no key needed)\n`);
});
