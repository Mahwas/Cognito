import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StudyPlan, QuizQuestion, ModuleResource } from "../types";

const apiKey = process.env.GEMINI_API_KEY || '';
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

  const totalBudget = targetMinutes || 120;
  // Aim for roughly 60 minute modules
  const moduleCount = Math.max(1, Math.round(totalBudget / 60));

  const instruction = `The user wants a study plan for "${topic}" with a total budget of ${totalBudget} minutes.
       
       CRITICAL GRANULARITY RULE:
       - Generate exactly ${moduleCount} module(s).
       - Each module should be approximately 60 minutes long.
       - If the total time is less than 60 minutes, generate 1 module for the full duration.
       
       PEDAGOGICAL STRUCTURE:
       - Module 1 MUST be a "Big Picture" introduction. Focus on the 'Why', real-world context, and mental models to orient the learner.
       - Subsequent modules should follow a logical deep-dive progression: Foundational Tools -> Implementation -> Advanced Synthesis.
       
       Every plan starts with high-level intuition before technical depth.`;

  const prompt = `Design a study plan for: "${topic}".

${instruction}

Each module must include:
- A concise, punchy title.
- A description explaining exactly why this step is necessary in the current progression.
- An estimatedMinutes value (usually 60, unless total budget is small).
- A focused list of 3-5 subtopics (topics array).

DO NOT start with niche academic debates. Start with an accessible hook and broad context.

Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are an elite educational strategist who believes in deep-work blocks. You structure learning into substantial 1-hour modules rather than fragmented tasks."
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

export const fetchModuleResources = async (overallTopic: string, moduleTitle: string, topics: string[], estimatedMinutes: number): Promise<{ advice: string, resources: ModuleResource[], isFallback?: boolean }> => {
  const modelId = "gemini-3-flash-preview";

  const prompt = `Generate a comprehensive learning strategy for the module: "${moduleTitle}" which is part of a larger plan for "${overallTopic}".
The focus of this module is: ${topics.join(', ')}.
Total Session Duration: ${estimatedMinutes} minutes.

BROAD STRUCTURAL GUIDELINES:
- Avoid micro-managing the user's time with tiny minute increments (e.g., "3 mins for intro").
- Instead, divide the session into major strategic phases (e.g., Conceptual Grounding, Hands-on Implementation, Synthesis/Review).
- Ensure the complexity of instructions matches the ${estimatedMinutes}-minute window.
- Ensure the content fits to learning speed of humans. dont use strict time planning.

STRUCTURE YOUR GUIDANCE AS FOLLOWS:

# Master Goal: [The overarching outcome of this module]

Briefly introduce the context of this specific module within the study of ${overallTopic}. Why is it the next logical step?

**Phase: [Name of Phase]**
Focus on high-level instructions. Explain *what* to learn and *how* to process it.
If a link is needed, list it immediately below the phase description on its own line: [Link Title](URL).

**Phase: [Name of Phase]**
Continue the logical progression. 

# Strategic Triage
- Use bullets to highlight the "High Signal" concepts to focus on.

CURATION RULE: Max 3-4 high-signal resources. You MUST use Google Search to verify each link is currently active and relevant. Output clean Markdown. Do not include specific "Orientation Buffer" headings with fixed small timers.`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a master curator. You MUST use the Google Search tool to verify that every resource and link you recommend is currently active, relevant, and accessible. Organize information into logical, flowing phases."
      }
    });

    const advice = response.text || "Focus on the basics and keep moving.";
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

    return { advice, resources: uniqueResources.slice(0, 5), isFallback: false };
  } catch (error: any) {
    console.warn("Primary search-enabled fetch failed. Attempting Analytical Fallback.", error);

    // Fallback: Analytical Mode (No Search)
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
          systemInstruction: "You are a master curator. Deep search is currently unavailable due to high demand. You MUST provide a 'Pure Analytical Mode' response. Focus intensely on Conceptual Explanations and Mental Models. Do NOT invent fake links. Instead of links, provide precise search terms that the user can use later."
        }
      });

      return {
        advice: fallbackResponse.text || "Focus on the basics and keep moving.",
        resources: [],
        isFallback: true
      };
    } catch (fallbackError) {
      console.error("Critical failure in both Search and Analytical modes:", fallbackError);
      return { advice: "Error fetching content. Please try again in a moment.", resources: [], isFallback: false };
    }
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