import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { MarketDataService } from "./src/services/marketDataService.ts";
import dotenv from "dotenv";
import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import Parser from "rss-parser";

dotenv.config();

const rssParser = new Parser();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Metadata extraction for images and previews
  app.get("/api/news/metadata", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
        timeout: 5000
      });
      const dom = new JSDOM(response.data);
      const doc = dom.window.document;
      
      const getMeta = (prop: string) => 
        doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
        doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');

      res.json({
        title: getMeta('og:title') || doc.title,
        description: getMeta('og:description') || getMeta('description'),
        image: getMeta('og:image'),
        url
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  // News RSS Endpoint with enhanced source support
  app.get("/api/news/rss", async (req, res) => {
    const url = req.query.url as string || "https://finance.yahoo.com/rss/";
    try {
      const feed = await rssParser.parseURL(url);
      res.json(feed);
    } catch (error: any) {
      console.error(`RSS Error ${url}:`, error.message);
      res.status(500).json({ error: "Failed to fetch RSS feed" });
    }
  });

  // News Reader Endpoint with Refined Error Handling
  app.get("/api/news/reader", async (req, res) => {
    const url = req.query.url as string;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        },
        timeout: 10000
      });

      const dom = new JSDOM(response.data, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        throw new Error("Could not parse article content");
      }

      res.json({
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        siteName: article.siteName
      });
    } catch (error: any) {
      console.error(`Reader error for ${url}:`, error.message);
      
      const isHeaderOverflow = error.message.includes('Header overflow') || error.code === 'HPE_HEADER_OVERFLOW';
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;
      
      if (isHeaderOverflow || isAuthError) {
        return res.json({
          isRestricted: true,
          errorType: isHeaderOverflow ? 'HEADER_OVERFLOW' : 'AUTH_RESTRICTED',
          message: isHeaderOverflow 
            ? "This publisher uses advanced technical headers that prevent direct extraction." 
            : "This article is protected by a publisher paywall or authentication layer.",
          url: url
        });
      }

      res.status(500).json({ error: "Failed to extract article content. Please use the direct link." });
    }
  });

  // AI Analysis Endpoint
  app.post("/api/news/analyze", async (req, res) => {
    const { title, excerpt, textContent } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    try {
      const prompt = `Analyze this news article:
      TITLE: ${title}
      EXCERPT: ${excerpt}
      CONTENT: ${textContent?.substring(0, 3000)}
      
      Return a JSON object with:
      {
        "summary": ["Highlight 1", "Highlight 2", "Highlight 3"],
        "sentiment": "Positive" | "Negative" | "Neutral",
        "keyPoints": ["Fact 1", "Fact 2"]
      }`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        }
      );

      const result = JSON.parse(response.data.candidates[0].content.parts[0].text);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Initialize Database
  const db = new Database("apex.db");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS holdings (
      id TEXT PRIMARY KEY,
      portfolio_id TEXT,
      symbol TEXT,
      quantity REAL,
      average_cost REAL,
      acquired_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(portfolio_id) REFERENCES portfolios(id)
    );
    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      query TEXT,
      response TEXT,
      tools_used TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Market Data Endpoints
app.get("/api/stocks/:symbol", async (req, res) => {
  try {
    const data = await MarketDataService.getStockQuote(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stocks/:symbol/history", async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  try {
    const data = await MarketDataService.getHistoricalData(req.params.symbol, days);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/stocks/:symbol/news", async (req, res) => {
  try {
    const data = await MarketDataService.getNews(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/research/:symbol", async (req, res) => {
  try {
    const data = await MarketDataService.getIntegrityScore(req.params.symbol);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  try {
    const data = await MarketDataService.searchSymbols(query);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/news/trending", async (req, res) => {
  try {
    const category = req.query.category as string || 'Top Stories';
    // If user selects 'Research', we can return general market news or a specific set
    const searchCategory = category === 'Research' ? 'market analysis' : category;
    const data = await MarketDataService.getTrendingMarketNews(20, searchCategory);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Portfolio Endpoints
app.get("/api/portfolio", (req, res) => {
  const holdings = db.prepare("SELECT * FROM holdings").all();
  res.json(holdings);
});

app.post("/api/portfolio/add", (req, res) => {
  const { symbol, quantity, average_cost } = req.body;
  const id = Math.random().toString(36).substring(7);
  db.prepare("INSERT INTO holdings (id, symbol, quantity, average_cost) VALUES (?, ?, ?, ?)")
    .run(id, symbol, quantity, average_cost);
  res.json({ success: true, id });
});


  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
