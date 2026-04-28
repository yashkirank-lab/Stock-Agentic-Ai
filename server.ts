import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { MarketDataService } from "./src/services/marketDataService.ts";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

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
