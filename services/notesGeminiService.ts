
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateNoteContent = async (prompt: string, currentContent: string = ''): Promise<string> => {
  try {
    const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    
    let fullPrompt = prompt;
    if (currentContent) {
      fullPrompt = `Original context: "${currentContent}".\n\nTask: ${prompt}`;
    }

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text() || '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const summarizeNote = async (content: string): Promise<string> => {
    try {
        const modelName = import.meta.env.VITE_GEMINI_MODEL || "gemini-1.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(`Summarize the following text concisely:\n\n${content}`);
        const response = await result.response;
        return response.text() || '';
    } catch (error) {
        console.error("Gemini Summarize Error:", error);
        throw error;
    }
}
