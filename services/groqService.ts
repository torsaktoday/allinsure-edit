import { AIProcessResult, ChatMessage, KnowledgeBaseItem } from "../types";

// Helper to get Groq API Key from environment
const getGroqApiKey = (): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_GROQ_API_KEY;
    }
  } catch (e) {}
  return '';
};

export const checkGroqConnection = async (model: string = 'mixtral-8x7b-32768', customKey?: string): Promise<boolean> => {
    const key = customKey || getGroqApiKey();
    if (!key) return false;
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 10
            })
        });
        return response.ok;
    } catch (error) {
        return false;
    }
};

export const processChatWithGroq = async (
  currentMessage: string, 
  history: ChatMessage[],
  kbItems: KnowledgeBaseItem[] = [],
  model: string = 'mixtral-8x7b-32768',
  customApiKey?: string
): Promise<AIProcessResult> => {
  
  // Build structured conversation context - only last 5 messages
  const recentHistory = history.slice(-5);
  const conversationContext = recentHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.text
  }));
  
  // All models use Groq API endpoint
  const apiKey = customApiKey || getGroqApiKey();

  if (!apiKey) {
    return { reply: "", isComplete: false, intent: 'UNKNOWN', isError: true };
  }

  try {
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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemInstruction },
          ...conversationContext.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: currentMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
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
    console.error("Groq API Error:", error);
    return { reply: "", isComplete: false, intent: 'UNKNOWN', isError: true };
  }
};
