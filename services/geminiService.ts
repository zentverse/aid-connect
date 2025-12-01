
import { GoogleGenAI, Type } from "@google/genai";
import { AidCategory } from "../types";

// Helper to get API key safely
const getApiKey = () => {
  return 'AIzaSyCiLaGU0xix59seNgVmuV85QrSkymF0UmY';
};

// --- Smart Fill ---
export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category: AidCategory;
  keywords: string[];
}

export const extractAidItems = async (text: string): Promise<ExtractedItem[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract aid items from the following request text. Map them to the closest category from this list: ${Object.values(AidCategory).join(', ')}. 
      For each item, also generate 5 specific and descriptive keywords or tags. 
      Avoid generic single adjectives (e.g., use "Casual Wear" instead of "Casual", "Dry Rations" instead of "Dry"). 
      Focus on specific types, synonyms, or functional attributes.
      Return a JSON array. Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Common name of the item" },
              quantity: { type: Type.NUMBER, description: "Numeric quantity" },
              unit: { type: Type.STRING, description: "Unit of measurement (e.g. kg, packs, liters)" },
              category: { type: Type.STRING, description: "One of the provided categories" },
              keywords: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "5 specific and descriptive keywords/tags" 
              }
            },
            required: ["name", "quantity", "category", "keywords"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractedItem[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Smart Fill Error:", error);
    return [];
  }
};

// --- Keyword Generation ---
export const generateItemKeywords = async (itemName: string, category: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 5 specific and descriptive keywords or tags for the aid item "${itemName}" which is in the category "${category}". 
      Avoid generic single adjectives (e.g., use "Casual Wear" instead of "Casual", "Dry Rations" instead of "Dry"). 
      Focus on specific types, synonyms, or functional attributes that help define the item clearly for donors and logistics.
      Return a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Keyword Gen Error:", error);
    return [];
  }
};

// --- Dashboard Insights ---
export const generateSituationReport = async (requestsJson: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Here is a dataset of aid requests in JSON format. Generate a concise, 3-paragraph executive summary for donors. 
      Paragraph 1: Overview of the most critical needs (high quantity items).
      Paragraph 2: Location-based analysis (which areas are suffering most).
      Paragraph 3: Recommendations for supply chain priority.
      
      Keep the tone professional and humanitarian.
      
      Dataset: ${requestsJson}`,
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Gemini Insights Error:", error);
    return "AI analysis unavailable at this time.";
  }
};
