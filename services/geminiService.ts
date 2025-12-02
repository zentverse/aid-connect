
import { GoogleGenAI, Type } from "@google/genai";
import { AidCategory } from "../types";
import { DISTRICTS } from "../constants";

// Helper to get API key safely
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY;
};

// --- Smart Fill ---
export interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  category: AidCategory;
  keywords: string[];
}

export interface ExtractedFormData {
  fullName?: string;
  nic?: string;
  contactNumber?: string;
  district?: string;
  region?: string;
  items: ExtractedItem[];
  notes?: string;
}

export const extractAidItems = async (text: string): Promise<ExtractedItem[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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

export const extractSmartFillData = async (text: string): Promise<ExtractedFormData | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are an AI assistant for a disaster relief app. Extract structured data from the following help request text.
      
      Fields to extract:
      1. Full Name
      2. NIC (National Identity Card Number)
      3. Contact Number
      4. District (Must be one of: ${DISTRICTS.join(', ')})
      5. Region (City or Town name)
      6. Notes (Any extra context, medical needs, or directions)
      7. Items (List of requested aid items with category, quantity, unit, and keywords)

      For items, map category to one of: ${Object.values(AidCategory).join(', ')}.
      Generate 5 specific descriptive keywords for each item.

      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            nic: { type: Type.STRING },
            contactNumber: { type: Type.STRING },
            district: { type: Type.STRING },
            region: { type: Type.STRING },
            notes: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  category: { type: Type.STRING },
                  keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "quantity", "category", "keywords"]
              }
            }
          },
          required: ["items"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractedFormData;
    }
    return null;
  } catch (error) {
    console.error("Gemini Full Smart Fill Error:", error);
    return null;
  }
};

// --- Keyword Generation ---
export const generateItemKeywords = async (itemName: string, category: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
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

