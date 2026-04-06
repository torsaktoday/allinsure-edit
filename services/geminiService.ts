
import { GoogleGenAI, Type } from "@google/genai";
import { AIProcessResult, ChatMessage, InsurancePlan, KnowledgeBaseItem } from "../types";

// Helper to get Environment Key only
const getEnvApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {}
  return '';
};

export const checkGeminiConnection = async (model: string = 'gemini-2.5-flash', customKey?: string): Promise<boolean> => {
    const key = customKey || getEnvApiKey();
    if (!key) return false;
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        await ai.models.generateContent({ model: model, contents: 'ping' });
        return true;
    } catch (error) {
        return false;
    }
};

export const processChatWithGemini = async (
  currentMessage: string, 
  history: ChatMessage[],
  kbItems: KnowledgeBaseItem[] = [],
  model: string = 'gemini-2.5-flash',
  customApiKey?: string
): Promise<AIProcessResult> => {
  
  // Build structured conversation context - only last 5 messages to avoid confusion
  const recentHistory = history.slice(-5);
  const conversationContext = recentHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
  
  // Priority: Database Key (passed as customApiKey) -> Environment Variable
  const currentKey = customApiKey || getEnvApiKey();

  if (!currentKey) {
    return { reply: "", isComplete: false, intent: 'UNKNOWN', isError: true };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: currentKey });
    
    // Updated instruction to allow unlisted brands, slang, and granular coverage extraction
    const systemInstruction = `
      You are SafeGuard, a smart insurance assistant.
      
      CRITICAL RULES:
      1. AVOID REPETITION: Check conversation history. If user already asked about a car model, don't repeat the same response.
      2. FOCUS ON CURRENT MESSAGE: Only respond to the current user message, not the entire history.
      3. NORMALIZE CONSISTENTLY: Always normalize car models to the same format.
      
      GOAL:
      1. Interpret user input (Thai/English) to find car insurance.
      2. NORMALIZE THAI TO ENGLISH (JSON) STRICTLY:
         - "ยารีส", "ยาริด", "yaris" -> Make: "Toyota", Model: "Yaris"
         - "วีออส", "vios" -> Make: "Toyota", Model: "Vios"
         - "อัลติส", "altis" -> Make: "Toyota", Model: "Altis"
         - "มาสด้า2", "mazda2", "มาสด้า 2" -> Make: "Mazda", Model: "Mazda2"
         - "มาสด้า3", "mazda3", "มาสด้า 3" -> Make: "Mazda", Model: "Mazda3"
         - "วิรริยะ", "วิริยะ", "viriyah" -> companyKeyword: "วิริยะ"
         - "ชั้น 1", "class 1", "1" (in insurance context) -> planType: "ชั้น 1"
         - "2+", "2พลัส", "2 plus" -> planType: "ชั้น 2+"
      3. HANDLE SLANG & TYPOS:
         - "อีสุ", "isuzu", "อีซูซุ" -> Make: "Isuzu"
         - "มิดซู", "mitsubishi", "misubishi" -> Make: "Mitsubishi"
         - "มาดดา", "mazda", "มาสด้า" -> Make: "Mazda"
         - "โตโย", "toyota" -> Make: "Toyota"
      4. EXTRACT ATTRIBUTES & BUDGET STRICTLY (Granular):
         - "ไม่มีค่าเสียหายส่วนแรก", "ไม่มีส่วนแรก", "no excess", "deductible 0" -> attributes: ["no_deductible"]
         - "ซ่อมห้าง", "ซ่อมศูนย์", "mall repair" -> attributes: ["mall_repair"]
         - "ซ่อมอู่", "garage repair" -> attributes: ["garage_repair"]
         - "คุ้มครองน้ำท่วม", "ประกันน้ำท่วม", "flood" -> attributes: ["flood_coverage"]
         - "ช่วยเหลือฉุกเฉิน", "บริการฉุกเฉิน", "emergency" -> attributes: ["emergency_service"]
         - "รถยก", "ลากรถ", "towing", "รถสไลด์", "slide" -> attributes: ["towing_service"]
         - "ปะยาง", "ยางรั่ว", "tire" -> attributes: ["tire_service"]
         - "จั๊มแบต", "battery" -> attributes: ["battery_service"]
         - "เคลมกระจก", "กระจกแตก", "windshield" -> attributes: ["windshield_coverage"]
         - "รถหาย", "ไฟไหม้", "theft", "fire" -> attributes: ["fire_theft_coverage"]
         - "รถใช้ระหว่างซ่อม", "มีรถสำรอง", "replacement car", "courtesy car" -> attributes: ["replacement_car"]
         
         - **FINANCIAL LOGIC (CRITICAL):**
           - User asking for price limit -> set "maxPrice".
           - User asking for coverage limit -> set "minSumInsured".
           - Examples:
             - "ราคาไม่เกิน 15000", "งบ 6000", "เบี้ย 5000" -> maxPrice: ...
             - "ทุน 5 แสน", "วงเงิน 600000" -> minSumInsured: ...
             
      5. UNLISTED CARS:
         - If valid brand/model (e.g. Hino, Ferrari) but not standard, extract it.
      6. OUTPUT JSON ONLY.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "reply": "Brief polite Thai response.",
        "carData": { 
            "make": "Mazda", 
            "model": "Mazda2", 
            "year": "2018" 
        },
        "filters": { 
            "planType": "ชั้น 1", 
            "companyKeyword": "วิริยะ", 
            "attributes": ["no_deductible", "mall_repair", "flood_coverage", "fire_theft_coverage", "windshield_coverage", "replacement_car"],
            "maxPrice": 15000,
            "minSumInsured": 500000
        },
        "intent": "SEARCHING"
      }
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...conversationContext.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user',
          parts: [{ text: currentMessage }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const result = JSON.parse(text);
    
    return {
        reply: result.reply || "",
        carData: result.carData ? {
            make: result.carData.make || '',
            model: result.carData.model || '',
            year: result.carData.year || ''
        } : undefined,
        filters: result.filters,
        isComplete: result.intent === 'SEARCHING',
        intent: result.intent || 'UNKNOWN'
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { reply: "", isComplete: false, intent: 'UNKNOWN', isError: true };
  }
};

export const consultPlanAgent = async (
    currentMessage: string,
    history: ChatMessage[],
    plan: InsurancePlan,
    companyName: string,
    model: string = 'gemini-2.5-flash',
    customApiKey?: string
): Promise<{ reply: string, showBuyButton: boolean }> => {
    const currentKey = customApiKey || getEnvApiKey();
    if (!currentKey) {
        return { reply: "กรุณาตรวจสอบ API Key", showBuyButton: false };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        const planDetails = JSON.stringify(plan);
        const systemInstruction = `
            You are an expert insurance consultant for SafeGuard.
            The user is asking about a specific plan: "${plan.planName}" by "${companyName}".
            
            Plan Details (JSON):
            ${planDetails}
            
            Your goal:
            1. Answer the user's question based strictly on the plan details provided.
            2. Be helpful, professional, and concise (Thai language).
            3. If the user asks about coverage not in the plan, say it's not covered.
            4. If the user indicates they want to buy, set "showBuyButton" to true.
            5. Highlight key strengths like "ซ่อมห้าง", "ไม่มีค่าเสียหายส่วนแรก", or "บริการฉุกเฉิน" if relevant to the question.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `User Question: "${currentMessage}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        reply: { type: Type.STRING },
                        showBuyButton: { type: Type.BOOLEAN }
                    }
                }
            }
        });

        const result = JSON.parse(response.text || '{}');
        return {
            reply: result.reply || "ขออภัยครับ ไม่สามารถให้ข้อมูลได้ในขณะนี้",
            showBuyButton: result.showBuyButton || false
        };

    } catch (error) {
        console.error("Consult Agent Error:", error);
        return { reply: "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI", showBuyButton: false };
    }
}

export const comparePlansWithGemini = async (
    plans: InsurancePlan[],
    model: string = 'gemini-2.5-flash',
    customApiKey?: string
): Promise<string> => {
    const currentKey = customApiKey || getEnvApiKey();
    if (!currentKey) {
        throw new Error("No API Key");
    }

    try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        const plansData = JSON.stringify(plans.map(p => ({
            planName: p.planName,
            price: p.price,
            sumInsured: p.sumInsured,
            deductible: p.deductible,
            repairType: p.repairType,
            floodCoverage: p.floodCoverage,
            details: p.details
        })));

        const systemInstruction = `
            You are an expert car insurance analyst (Thai language).
            Task: Compare the following insurance plans and provide a professional summary.
            
            Plans Data (JSON):
            ${plansData}
            
            Constraints:
            1. Language: Thai (Professional tone).
            2. Use ONLY the provided data. Do not use external knowledge.
            3. Structure:
               - Compare "Price" using <i class="fa-solid fa-tag text-blue-500 mr-1"></i> icon.
               - Compare "Sum Insured" using <i class="fa-solid fa-shield-halved text-green-500 mr-1"></i> icon.
               - Compare "Repair Type" using <i class="fa-solid fa-screwdriver-wrench text-orange-500 mr-1"></i> icon.
               - Highlight key pros/cons of each.
            4. Output format: HTML bullet points (<li>) without the surrounding <ul> or <html> tags. 
               Use <b> for emphasis. Use FontAwesome icons as specified.
            5. Keep it concise, single line per bullet point if possible.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: "Compare these plans.",
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "";

    } catch (error) {
        console.error("Gemini Compare Error:", error);
        throw error;
    }
};
