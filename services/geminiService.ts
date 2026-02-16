import { GoogleGenAI } from "@google/genai";
import { AICommentary } from "../types";

const apiKey = process.env.API_KEY || '';
// We won't crash if no key, but we'll return a dummy response.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getAICommentary = async (
  event: string,
  boardSnapshot: string,
  score: number,
  lines: number
): Promise<AICommentary> => {
  if (!ai) {
    console.warn("Gemini API Key missing");
    return { text: "API Key missing. I can't see your terrible gameplay.", mood: 'neutral' };
  }

  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a sarcastic, witty, and sometimes helpful Tetris coach/heckler.
    Your goal is to comment on the player's performance in a video game.
    Keep comments short (under 20 words).
    If the board is high (near the top), panic or mock them.
    If they score a Tetris (4 lines), be impressed or jealous.
    If they Game Over, roast them gently.
    The board is provided as a grid where '.' is empty and 'X' is a block.
  `;

  const prompt = `
    Event Trigger: ${event}
    Current Score: ${score}
    Lines Cleared: ${lines}
    Board State:
    ${boardSnapshot}
    
    Generate a short comment.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        maxOutputTokens: 50,
      }
    });

    const text = response.text || "...";
    
    // Simple sentiment mapping based on event for UI color
    let mood: AICommentary['mood'] = 'neutral';
    if (event === 'GAME_OVER') mood = 'roasting';
    else if (event === 'TETRIS') mood = 'encouraging';
    else if (text.toLowerCase().includes('oops') || text.toLowerCase().includes('mess')) mood = 'sarcastic';

    return { text, mood };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having a glitch... just like your gameplay.", mood: 'neutral' };
  }
};
