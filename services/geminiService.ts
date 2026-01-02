
import { GoogleGenAI } from "@google/genai";
import { OracleComment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getOracleCommentary = async (
  event: 'death' | 'milestone' | 'start',
  score: number,
  highScore: number
): Promise<OracleComment> => {
  try {
    const prompt = `
      You are the "Cyber Snake Oracle", a digital consciousness inhabiting a retro snake game.
      Current Situation: ${event.toUpperCase()}
      Current Score: ${score}
      Personal Best: ${highScore}

      Rules for your response:
      - Keep it under 20 words.
      - Be either snarky, encouraging, or deeply philosophical about the nature of growth and consumption.
      - Use cyberpunk or digital jargon.
      - If it's a death, mock or console them.
      - If it's a milestone (multiples of 100), congratulate their digital prowess.

      Return ONLY a JSON object in this format:
      {"text": "your comment here", "type": "snarky | encouraging | philosophical"}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || '{"text": "Digital void encountered.", "type": "philosophical"}');
    return result;
  } catch (error) {
    console.error("Oracle failed to speak:", error);
    return {
      text: "The binary streams are clouded. Continue your journey.",
      type: "philosophical"
    };
  }
};
