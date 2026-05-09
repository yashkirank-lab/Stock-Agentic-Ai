# APEX Broker — Institutional Grade Stock Intelligence

> [!IMPORTANT]
> **Copyright (c) 2026 Yash Killamsetty. All Rights Reserved.**
> Unauthorized copying, modification, or distribution of this software is strictly prohibited. This project is proprietary and confidential.

APEX Broker is a professional-grade agentic investment analysis platform. It combines real-time market data with advanced AI research capabilities to provide autonomous portfolio vetting and deep market oversight.

## 🚀 Key Features

- **Agentic Analysis**: Autonomous research agents powered by Gemini AI that synthesize news, fundamentals, and technicals.
- **Deep Market Oversight**: Live index feeds and institutional-grade data streaming.
- **AI Profit Cheat**: High-signal summaries for asset accumulation and tactical positioning.
- **Intelligence Terminal**: Real-time news aggregation with vector tracking.
- **Responsive Architecture**: Fully optimized for Desktop, iPad, and Mobile viewports.
- **Portfolio Tracking**: Management of holdings with real-time value synchronization.

## 🛠 Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (formerly Framer Motion)
- **Charts**: Recharts & Custom SVG Visualizers
- **Backend**: Node.js & Express (Full-stack)
- **LLM**: Google Gemini AI (via @google/genai)
- **Data Source**: Yahoo Finance API & Institutional RSS feeds
- **State Management**: Zustand & React Query

## 💻 Local Setup & Installation

To run this project locally on your machine, follow these steps:

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/)

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd apex-broker
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
touch .env
```
Add your API keys to the `.env` file:
```env
GEMINI_API_KEY=your_google_gemini_api_key
```
*Note: You can obtain a free API key from [Google AI Studio](https://aistudio.google.com/).*

### 5. Start the Application

#### Development Mode
Starts the full-stack app with hot reloading for the server and client:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Production Build
To create an optimized production build:
```bash
npm run build
npm start
```

## 📂 Project Structure

```text
├── src/
│   ├── components/       # UI Components (Dashboard, Terminal, etc.)
│   ├── services/         # API & AI Data Services
│   ├── lib/              # Utility functions & helpers
│   ├── App.tsx           # Main App entry point
│   └── main.tsx          # React DOM entry
├── server.ts             # Express server (Full-stack entry)
├── package.json          # Dependency & Script management
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## 📝 Usage

1. **Analyst View**: Select a stock ticker or search for an asset to see deep-dive AI analysis.
2. **Intelligence terminal**: Navigate to the "News" section to track specific "Intelligence Vectors" (topics like AI, Tesla, Markets).
3. **Portfolio**: Use the "Portfolio" tab to track your simulated holdings and visual diversification.
4. **AI Chat**: Use the "Advanced Chat" button or the bottom-right toggle to interact directly with the APEX intelligence agent.

---

*Disclaimer: This application is for educational and illustrative purposes only. Trade data and AI analysis should not be considered professional financial advice.*
