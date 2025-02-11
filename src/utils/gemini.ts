import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

interface ItemAnalysis {
  name: string;
  description: string;
  quantity: string;
  confidence: number;
  category: 'food' | 'utilities' | 'medicine';
}

export async function analyzeImage(imageData: string): Promise<ItemAnalysis> {
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Image = imageData.split(',')[1];

    // Define the schema for structured output
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        name: {
          type: SchemaType.STRING,
          description: "Name of the item",
          nullable: false,
        },
        description: {
          type: SchemaType.STRING,
          description: "Detailed description of the item including its condition",
          nullable: false,
        },
        quantity: {
          type: SchemaType.STRING,
          description: "Estimated quantity of the item as a number",
          nullable: false,
        },
        confidence: {
          type: SchemaType.NUMBER,
          description: "Confidence score between 0 and 1",
          nullable: false,
        },
        category: {
          type: SchemaType.STRING,
          description: "Category of the item: 'food', 'utilities', or 'medicine'",
          enum: ["food", "utilities", "medicine"],
          nullable: false,
        }
      },
      required: ["name", "description", "quantity", "confidence", "category"],
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    
    const prompt = `Analyze this image of an item for a donation box database. Consider:
    1. Accurate item name
    2. Concise description
    3. Realistic quantity estimation (must return integer)
    4. Categorize the item into one of these categories:
       - 'food': Any edible items or beverages
       - 'utilities': Household items, tools, or general supplies
       - 'medicine': Medical supplies, first aid items, or medications
    5. High confidence only when certain`;

    const result = await model.generateContent([
      { text: prompt },
      { 
        inlineData: { 
          mimeType: "image/jpeg",
          data: base64Image 
        } 
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Default analysis object
    const defaultAnalysis: ItemAnalysis = {
      name: "Unknown Item",
      description: "No description available",
      quantity: "1",
      confidence: 0.0,
      category: 'food'
    };

    try {
      // Parse response - should be properly structured due to schema
      const parsedResponse = JSON.parse(text.trim());
      return {
        name: parsedResponse.name,
        description: parsedResponse.description,
        quantity: parsedResponse.quantity,
        confidence: parsedResponse.confidence,
        category: parsedResponse.category
      };
    } catch {
      return defaultAnalysis;
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}
