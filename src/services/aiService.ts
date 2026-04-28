import { GoogleGenAI } from "@google/genai";
import { TOOL_DEFINITIONS } from "../tools/definitions";
import axios from "axios";

/**
 * Agentic AI service using Gemini with Function Calling (Frontend Safe)
 */
export async function analyzeStockAgent(query: string, history: any[] = []) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not available. Please ensure it is set in your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const contents = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : h.role,
    parts: h.parts || [{ text: h.content }]
  }));

  // Add the current user query
  contents.push({
    role: 'user',
    parts: [{ text: query }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: `You are APEX Broker. Speak in VERY SIMPLE English. 
      MAXIMUM BREVITY IS REQUIRED TO SAVE DATA.
      - Use ONLY bullet points.
      - USE DOLLAR SIGNS ($) for all money.
      - NO sentences longer than 10 words.
      - Explain complex terms in 1-3 simple words.
      - Never repeat information.

      REPORT FORMAT:
      - **Vibe**: 1 short phrase.
      - **Specs**: Trend [Rise/Slide], Risk [L/M/H], Target [Price/Goal].
      - **Why**: 2 bullets only.
      - **Risk**: 1 sentence warning.
      - **Score**: [0-100]

      Disclaimer: Not financial advice.`,
      tools: [{ functionDeclarations: TOOL_DEFINITIONS as any }],
    },
  });

  let currentResponse = response;
  
  // Handle function calls in a loop (Agentic loop)
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (currentResponse.functionCalls && iterations < MAX_ITERATIONS) {
    iterations++;
    const toolResults = [];

    for (const call of currentResponse.functionCalls) {
      const { name, args } = call;
      const resultData = await executeTool(name, args);
      toolResults.push({
        functionResponse: {
          name,
          response: { content: resultData }
        }
      });
    }

    // Capture the assistant's previous message (which contained the function calls)
    const assistantPart = currentResponse.candidates?.[0]?.content;
    if (!assistantPart) break;

    // Append to conversation
    contents.push(assistantPart as any);
    contents.push({
      role: 'user',
      parts: toolResults as any
    });

    currentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        tools: [{ functionDeclarations: TOOL_DEFINITIONS as any }]
      }
    });
  }

  return currentResponse.text || "I processed your request but couldn't generate a text response.";
}

async function executeTool(name: string, args: any) {
  console.log(`Executing tool via API: ${name}`, args);
  try {
    switch (name) {
      case "get_stock_quote": {
        const { data } = await axios.get(`/api/stocks/${args.symbol}`);
        return data;
      }
      case "get_historical_data": {
        const { data } = await axios.get(`/api/stocks/${args.symbol}/history?days=${args.days || 30}`);
        return data;
      }
      case "search_news": {
        // News is mock/limited in this environment, but we can search via proxy if we had one
        return { message: "News search not fully implemented, but trends suggest volatility..." };
      }
      case "assess_integrity_score": {
        const { data } = await axios.get(`/api/research/${args.symbol}`);
        return data;
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err: any) {
    return { error: `Tool execution failed: ${err.message}` };
  }
}
