# APEX — Agentic AI Stock Broker

An open-source, AI-powered stock analysis platform that uses autonomous research agents to analyze companies, evaluate market conditions, and provide transparent investment insights.

## Features
- **APEX Research Agent**: Autonomous analysis using Gemini 1.5 with full tool-calling capabilities.
- **Integrity Audit**: Composite 0-100 scoring based on fundamentals, governance, and social sentiment.
- **Real-Time Dashboard**: High-fidelity charts and technical indicator monitoring.
- **Portfolio Tracking**: Manage holdings and track performance (SQL-backed).

## Tech Stack
- **Frontend**: React 18, TypeScript, Recharts, Zustand, TanStack Query, Tailwind CSS, Motion.
- **Backend**: Node.js, Express, Better-SQLite3.
- **AI**: Google Gemini 1.5 Flash.

## setup
1. Set `GEMINI_API_KEY` in your environment.
2. Run `npm install`.
3. Run `npm run dev` to start the full-stack application.

## AI Tools
APEX uses the following tools to reason:
- `get_stock_quote`: Real-time pricing and fundamentals.
- `get_historical_data`: Historical price trends for charting.
- `search_news`: Agentic news gathering.
- `assess_integrity_score`: Governance and risk assessment.

*This is for educational purposes only. Not financial advice.*
