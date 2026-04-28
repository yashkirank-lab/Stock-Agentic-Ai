/**
 * APEX Broker Tool Definitions for Gemini Function Calling
 */

export const TOOL_DEFINITIONS = [
  {
    name: "get_stock_quote",
    description: "Fetch real-time stock quote for a given symbol.",
    parameters: {
      type: "OBJECT",
      properties: {
        symbol: {
          type: "STRING",
          description: "The stock ticker symbol (e.g., AAPL, TSLA).",
        },
      },
      required: ["symbol"],
    },
  },
  {
    name: "get_historical_data",
    description: "Fetch historical price data for a stock.",
    parameters: {
      type: "OBJECT",
      properties: {
        symbol: {
          type: "STRING",
          description: "The stock ticker symbol.",
        },
        days: {
          type: "NUMBER",
          description: "Number of days of history (max 365).",
        },
      },
      required: ["symbol", "days"],
    },
  },
  {
    name: "search_news",
    description: "Search for the latest news about a company or stock.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "The search query (e.g., Apple stock news).",
        },
        limit: {
          type: "NUMBER",
          description: "Maximum number of news articles to return (default 5).",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "assess_integrity_score",
    description: "Calculate a composite integrity score for a company based on fundamentals and governance.",
    parameters: {
      type: "OBJECT",
      properties: {
        symbol: {
          type: "STRING",
          description: "The company ticker symbol.",
        },
      },
      required: ["symbol"],
    },
  },
];
