import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyPlan, QuizQuestion, ModuleResource } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const cleanJson = (text: string): string => {
  return text.replace(/```json\n?|\n?```/g, '').trim();
};

export const generateStudyPlan = async (topic: string, targetMinutes?: number): Promise<StudyPlan> => {
  const modelId = "gemini-3-flash-preview";
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      modules: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            estimatedMinutes: { type: Type.INTEGER },
            topics: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["id", "title", "description", "estimatedMinutes", "topics"]
        }
      }
    },
    required: ["topic", "modules"]
  };

  const timeConstraintPrompt = targetMinutes 
    ? `The user wants to spend approximately ${targetMinutes} minutes in total. Adjust the module count and depth of content to fit this total timeframe roughly.`
    : "Create a comprehensive plan with a realistic timeframe.";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create a step-by-step study plan for learning: "${topic}". 
      ${timeConstraintPrompt}
      Break it down into distinct modules. 
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an expert curriculum designer. create structured, engaging learning paths that respect the user's time constraints."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJson(text)) as StudyPlan;
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw error;
  }
};

export const fetchModuleResources = async (moduleTitle: string, topics: string[]): Promise<{ advice: string, resources: ModuleResource[] }> => {
  const modelId = "gemini-3-flash-preview";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Find the best online resources (articles, documentation, official guides, videos) to learn about: ${topics.join(', ')}. 
      Also provide brief strategic advice on how a student should approach learning this module specifically.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const advice = response.text || "Start with the basics and practice as you go.";
    const resources: ModuleResource[] = [];
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri) {
          resources.push({
            title: chunk.web.title || "External Resource",
            url: chunk.web.uri,
            source: new URL(chunk.web.uri).hostname
          });
        }
      });
    }

    const uniqueResources = resources.filter((v, i, a) => a.findIndex(t => (t.url === v.url)) === i);

    return { advice, resources: uniqueResources.slice(0, 5) };
  } catch (error) {
    console.error("Error fetching resources:", error);
    return { advice: "Error fetching specific resources.", resources: [] };
  }
};

export const generateQuiz = async (topic: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<QuizQuestion[]> => {
  const modelId = "gemini-3-flash-preview";

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }
        },
        correctAnswerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING }
      },
      required: ["id", "question", "options", "correctAnswerIndex", "explanation"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate 5 multiple-choice questions about "${topic}" at a ${difficulty} difficulty level. 
      Provide 4 options for each question. Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(cleanJson(text)) as QuizQuestion[];
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const getTutorResponse = async (history: { role: string, parts: { text: string }[] }[], newMessage: string): Promise<string> => {
  const modelId = "gemini-3-flash-preview";

  try {
    const chat = ai.chats.create({
        model: modelId,
        history: history,
        config: {
            systemInstruction: "You are a helpful, encouraging, and Socratic tutor. Don't just give answers; guide the student to understanding. Keep responses concise unless asked for elaboration."
        }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I'm having trouble thinking of an answer right now.";
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm sorry, I encountered an error. Please try again.";
  }
};