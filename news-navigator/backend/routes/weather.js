const express = require("express");
const router = express.Router();
const axios = require("axios");

// City → lat/lon map (extend as needed)
const CITIES = {
  chennai:  { lat: 13.0827, lon: 80.2707, label: "Chennai, TN" },
  mumbai:   { lat: 19.0760, lon: 72.8777, label: "Mumbai, MH" },
  delhi:    { lat: 28.6139, lon: 77.2090, label: "New Delhi" },
  bangalore:{ lat: 12.9716, lon: 77.5946, label: "Bengaluru, KA" },
  london:   { lat: 51.5074, lon: -0.1278, label: "London, UK" },
  newyork:  { lat: 40.7128, lon: -74.0060, label: "New York, US" },
};

const WMO_CODES = {
  0:"Clear sky", 1:"Mainly clear", 2:"Partly cloudy", 3:"Overcast",
  45:"Foggy", 48:"Icy fog", 51:"Light drizzle", 53:"Drizzle", 55:"Heavy drizzle",
  61:"Light rain", 63:"Rain", 65:"Heavy rain", 71:"Light snow", 73:"Snow", 75:"Heavy snow",
  80:"Rain showers", 81:"Heavy showers", 82:"Violent showers",
  95:"Thunderstorm", 96:"Thunderstorm with hail", 99:"Heavy thunderstorm"
};

// GET /api/weather?city=chennai
router.get("/", async (req, res) => {
  try {
    const cityKey = (req.query.city || "chennai").toLowerCase().replace(/\s+/g, "");
    const city = CITIES[cityKey] || CITIES.chennai;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;

    const resp = await axios.get(url, { timeout: 6000 });
    const c = resp.data.current;
    const d = resp.data.daily;

    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const forecast = d.time.map((dateStr, i) => ({
      day: days[new Date(dateStr).getDay()],
      high: Math.round(d.temperature_2m_max[i]),
      low:  Math.round(d.temperature_2m_min[i]),
      desc: WMO_CODES[d.weathercode[i]] || "Clear"
    }));

    res.json({
      success: true,
      data: {
        city: city.label,
        temp: Math.round(c.temperature_2m),
        unit: "C",
        description: WMO_CODES[c.weathercode] || "Clear",
        humidity: c.relative_humidity_2m,
        wind: Math.round(c.windspeed_10m),
        forecast
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
