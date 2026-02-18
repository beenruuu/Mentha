import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBrandPresence = async (brandName: string, productCategory: string) => {
  try {
    const prompt = `
      Act as an advanced AEO (Answer Engine Optimization) analysis tool.
      Analyze the hypothetical presence of the brand "${brandName}" in the product category "${productCategory}" within Large Language Models.
      
      Provide a structured response that simulates a "Share of Model" audit.
      
      Return a JSON object with these keys:
      - sentiment: (string, e.g., "Positive", "Neutral", "Mixed")
      - visibilityScore: (number, 0-100)
      - topAssociation: (string, the main keyword associated with the brand)
      - recommendation: (string, one concise strategic action)
      - simulationOutput: (string, a simulated short response a model like ChatGPT might give about this brand)

      Do not use Markdown formatting in the response, just raw JSON text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback mock data if API fails or key is missing
    return {
      sentiment: "Analyzing...",
      visibilityScore: 0,
      topAssociation: "Processing",
      recommendation: "Please try again later or contact us.",
      simulationOutput: "System is currently experiencing heavy load. Unable to generate real-time simulation."
    };
  }
};
