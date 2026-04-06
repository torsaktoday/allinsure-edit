
import { CarMake, CarModel, InsurancePlan, KnowledgeBaseItem, SearchResult } from "../types";

// --- CONSTANTS & MAPS ---
export const THAI_BRAND_MAP: Record<string, string> = {
    'โตโยต้า': 'Toyota', 'โตโยตา': 'Toyota', 'toyota': 'Toyota', 'toyato': 'Toyota',
    'ฮอนด้า': 'Honda', 'honda': 'Honda',
    'มาสด้า': 'Mazda', 'mazda': 'Mazda', 'มาดดา': 'Mazda',
    'อีซูซุ': 'Isuzu', 'อีสุสุ': 'Isuzu', 'isuzu': 'Isuzu', 'อีสุ': 'Isuzu',
    'มิตซูบิชิ': 'Mitsubishi', 'มิตซู': 'Mitsubishi', 'mitsubishi': 'Mitsubishi', 'misubishi': 'Mitsubishi',
    'นิสสัน': 'Nissan', 'nissan': 'Nissan',
    'ฟอร์ด': 'Ford', 'ford': 'Ford',
    'เอ็มจี': 'MG', 'mg': 'MG',
    'บีเอ็ม': 'BMW', 'bmw': 'BMW',
    'เบนซ์': 'Mercedes-Benz', 'benz': 'Mercedes-Benz',
    'tesla': 'Tesla', 'เทสล่า': 'Tesla', 'เทสลา': 'Tesla',
    'byd': 'BYD', 'บีวายดี': 'BYD',
    'haval': 'Haval', 'ฮาวาล': 'Haval',
    'ora': 'ORA', 'โอร่า': 'ORA',
    'neta': 'Neta', 'เนต้า': 'Neta'
};

export const THAI_COMPANY_MAP: Record<string, string> = {
    'วิริยะ': 'วิริยะ', 'วิรริยะ': 'วิริยะ', 'วิรินะ': 'วิริยะ', 'viriyah': 'วิริยะ',
    'กรุงเทพ': 'กรุงเทพ', 'กรุงเทบ': 'กรุงเทพ', 'bangkok': 'กรุงเทพ', 'bki': 'กรุงเทพ',
    'เมืองไทย': 'เมืองไทย', 'mti': 'เมืองไทย',
    'ทิพย': 'ทิพย', 'ทิพ': 'ทิพย', 'dhipaya': 'ทิพย',
    'ธนชาต': 'ธนชาต', 'ธนชาติ': 'ธนชาต',
    'คุ้มภัย': 'คุ้มภัย',
    'ไทยวิวัฒน์': 'ไทยวิวัฒน์', 'thaivivat': 'ไทยวิวัฒน์',
    'อาคเนย์': 'อาคเนย์',
    'สินมั่นคง': 'สินมั่นคง',
    'แอกซ่า': 'แอกซ่า', 'axa': 'แอกซ่า',
    'lmg': 'lmg', 'แอลเอ็มจี': 'lmg',
    'msig': 'msig', 'เอ็มเอสไอจี': 'msig'
};

// Mapping for Thai keywords to STANDARD ENGLISH MODEL NAMES found in the database
export const NORMALIZED_MODEL_MAP: Record<string, string> = {
    // Toyota
    'yaris': 'Yaris', 'ยาริส': 'Yaris', 'ยารีส': 'Yaris', 'ยาริด': 'Yaris',
    'vios': 'Vios', 'วีออส': 'Vios', 'วิออส': 'Vios',
    'altis': 'Altis', 'อัลติส': 'Altis',
    'camry': 'Camry', 'คัมรี่': 'Camry', 'แคมรี่': 'Camry',
    'fortuner': 'Fortuner', 'ฟอร์จูนเนอร์': 'Fortuner', 'ฟอจูนเนอร์': 'Fortuner',
    'revo': 'Revo', 'รีโว่': 'Revo',
    'cross': 'Cross', 'ครอส': 'Cross',
    'chr': 'C-HR', 'c-hr': 'C-HR',
    'veloz': 'Veloz', 'เวลอซ': 'Veloz',
    'alphard': 'Alphard', 'อัลพาร์ด': 'Alphard',

    // Honda
    'city': 'City', 'ซิตี้': 'City', 'ชิตี้': 'City',
    'civic': 'Civic', 'ซีวิค': 'Civic', 'ซิวิค': 'Civic',
    'jazz': 'Jazz', 'แจ๊ส': 'Jazz', 'แจส': 'Jazz',
    'accord': 'Accord', 'แอคคอร์ด': 'Accord',
    'hrv': 'HR-V', 'hr-v': 'HR-V', 'เอชอาร์วี': 'HR-V',
    'crv': 'CR-V', 'cr-v': 'CR-V', 'ซีอาร์วี': 'CR-V',

    // Mazda
    'mazda2': 'Mazda2', 'มาสด้า2': 'Mazda2', 'มาสด้า 2': 'Mazda2',
    'mazda3': 'Mazda3', 'มาสด้า3': 'Mazda3', 'มาสด้า 3': 'Mazda3',
    'cx3': 'CX-3', 'cx-3': 'CX-3',
    'cx5': 'CX-5', 'cx-5': 'CX-5',
    'cx30': 'CX-30', 'cx-30': 'CX-30',

    // Isuzu
    'dmax': 'D-Max', 'd-max': 'D-Max', 'ดีแม็ก': 'D-Max', 'ดีแมค': 'D-Max', 'ดีแม็กซ์': 'D-Max',
    'mux': 'MU-X', 'mu-x': 'MU-X', 'มิวเอ็กซ์': 'MU-X',

    // Mitsubishi
    'triton': 'Triton', 'ไทรทัน': 'Triton',
    'pajero': 'Pajero', 'ปาเจโร่': 'Pajero',
    'xpander': 'Xpander', 'เอ็กซ์แพนเดอร์': 'Xpander',
    'mirage': 'Mirage', 'มิราจ': 'Mirage',
    'attrage': 'Attrage', 'แอททราจ': 'Attrage',

    // Nissan
    'almera': 'Almera', 'อัลเมร่า': 'Almera', 'อาเมร่า': 'Almera', 'อัลมีร่า': 'Almera',
    'navara': 'Navara', 'นาวาร่า': 'Navara',
    'kicks': 'Kicks', 'คิกส์': 'Kicks',
    
    // Ford
    'ranger': 'Ranger', 'เรนเจอร์': 'Ranger',
    'everest': 'Everest', 'เอเวอร์เรส': 'Everest',
    
    // EV
    'atto3': 'Atto 3', 'atto 3': 'Atto 3',
    'dolphin': 'Dolphin', 'ดอลฟิน': 'Dolphin',
    'model3': 'Model 3', 'model 3': 'Model 3',
    'modely': 'Model Y', 'model y': 'Model Y', 'โมเดลวาย': 'Model Y',
    'goodcat': 'Good Cat', 'good cat': 'Good Cat', 'กู๊ดแคท': 'Good Cat'
};

// Mapping for Make detection only
export const COMMON_MODEL_TO_MAKE_MAP: Record<string, string> = {
    'yaris': 'Toyota', 'vios': 'Toyota', 'altis': 'Toyota', 'camry': 'Toyota', 'fortuner': 'Toyota',
    'city': 'Honda', 'civic': 'Honda', 'jazz': 'Honda', 'accord': 'Honda', 'hrv': 'Honda', 'crv': 'Honda',
    'mazda2': 'Mazda', 'mazda3': 'Mazda', 'cx3': 'Mazda', 'cx5': 'Mazda',
    'dmax': 'Isuzu', 'mux': 'Isuzu',
    'triton': 'Mitsubishi', 'pajero': 'Mitsubishi', 'xpander': 'Mitsubishi', 'mirage': 'Mitsubishi',
    'almera': 'Nissan', 'navara': 'Nissan', 'kicks': 'Nissan',
    'ranger': 'Ford', 'everest': 'Ford',
    'atto3': 'BYD', 'dolphin': 'BYD',
    'model3': 'Tesla', 'modely': 'Tesla',
    'goodcat': 'ORA', 'h6': 'Haval'
};

// --- TYPES ---
export interface SearchFilters {
    planType?: string;
    companyKeyword?: string;
    attributes?: string[];
    maxPrice?: number;
    minSumInsured?: number;
}

export type SearchAction = 
    | { type: 'ANSWER_KB'; answer: string }
    | { type: 'ASK_MODEL'; make: string; options: string[]; message: string; filters: SearchFilters; shouldResetFilters: boolean }
    | { type: 'ASK_YEAR'; make: string; model: string; options: string[]; message: string; filters: SearchFilters; shouldResetFilters: boolean }
    | { type: 'ASK_MAKE'; message: string; filters: SearchFilters; shouldResetFilters: boolean }
    | { type: 'EXECUTE_SEARCH'; context: SearchResult; filters: SearchFilters; shouldResetFilters: boolean }
    | { type: 'REFINE_SEARCH'; filters: SearchFilters; message: string }
    | { type: 'OPEN_LEAD_FORM'; reason: string; context: SearchResult | null }
    | { type: 'CALL_AI'; query: string; context: SearchResult | null }
    | { type: 'ERROR'; message: string };

export interface LocalExtractResult {
    make?: string;
    model?: string;
    year?: string;
    rawModelKeyword?: string;
    filters: SearchFilters;
    hasNewCarIntent: boolean;
    hasRelevance: boolean;
    hasPossibleYearTypo: boolean;
}

// --- ENGINE CLASS ---
export class SearchEngine {

    static extractEntities(text: string, models: CarModel[]): LocalExtractResult {
        const lower = text.toLowerCase().replace(/\s+/g, ' '); 
        const textNoSpaces = text.toLowerCase().replace(/\s+/g, ''); 

        let processedText = lower.replace(/,/g, '');
        processedText = processedText.replace(/(\d\.?\d*)\s*แสน/g, (match, p1) => String(parseFloat(p1) * 100000));
        processedText = processedText.replace(/(\d\.?\d*)\s*ล้าน/g, (match, p1) => String(parseFloat(p1) * 1000000));
        processedText = processedText.replace(/(\d\.?\d*)\s*หมื่น/g, (match, p1) => String(parseFloat(p1) * 10000));
        processedText = processedText.replace(/(\d\.?\d*)\s*พัน/g, (match, p1) => String(parseFloat(p1) * 1000));

        const filters: SearchFilters = {};
        let make: string | undefined;
        let model: string | undefined;
        let year: string | undefined;
        let rawModelKeyword: string | undefined;
        let hasNewCarIntent = false;
        let hasRelevance = false;

        // 1. Plan Type Filters (Strict matching)
        if (lower.includes('ชั้น 1') || lower.includes('ชั้น1') || (text.includes('1') && !text.match(/20\d{2}|25\d{2}/) && !text.match(/\d+\+\d+/) && !text.match(/\d{4,}/))) {
            filters.planType = 'ชั้น 1';
            hasRelevance = true;
        }
        else if (lower.includes('2+') || lower.includes('2พลัส') || lower.includes('2 plus')) { filters.planType = 'ชั้น 2+'; hasRelevance = true; }
        else if (lower.includes('ชั้น 2') || lower.includes('ชั้น2')) { filters.planType = 'ชั้น 2'; hasRelevance = true; }
        else if (lower.includes('3+') || lower.includes('3พลัส') || lower.includes('3 plus')) { filters.planType = 'ชั้น 3+'; hasRelevance = true; }
        else if (lower.includes('ชั้น 3') || lower.includes('ชั้น3')) { filters.planType = 'ชั้น 3'; hasRelevance = true; }

        // 2. Company Filters
        for (const [key, value] of Object.entries(THAI_COMPANY_MAP)) {
            if (lower.includes(key)) {
                filters.companyKeyword = value;
                hasRelevance = true;
                break;
            }
        }

        // 3. Attributes & Special Coverages
        filters.attributes = [];
        // Deductible / Repair Type
        if (lower.includes('ไม่มีส่วนแรก') || lower.includes('no excess') || lower.includes('ไม่มีค่าเสียหายส่วนแรก') || lower.includes('ไม่เอาค่าเสียหายส่วนแรก') || lower.includes('ไม่มีค่า excess')) {
            filters.attributes.push('no_deductible');
            hasRelevance = true;
        }
        if (lower.includes('ซ่อมศูนย์') || lower.includes('ซ่อมห้าง') || lower.includes('mall repair')) {
             filters.attributes.push('mall_repair');
             hasRelevance = true;
        }
        if (lower.includes('ซ่อมอู่') || lower.includes('garage')) {
             filters.attributes.push('garage_repair');
             hasRelevance = true;
        }
        
        // Granular Coverage Attributes
        if (lower.includes('น้ำท่วม') || lower.includes('flood')) {
            filters.attributes.push('flood_coverage');
            hasRelevance = true;
        }
        if (lower.includes('ฉุกเฉิน') || lower.includes('emergency')) {
            filters.attributes.push('emergency_service');
            hasRelevance = true;
        }
        if (lower.includes('รถยก') || lower.includes('ลากรถ') || lower.includes('towing') || lower.includes('รถสไลด์') || lower.includes('สไลด์')) {
            filters.attributes.push('towing_service');
            hasRelevance = true;
        }
        if (lower.includes('ปะยาง') || lower.includes('ยางรั่ว') || lower.includes('tire')) {
            filters.attributes.push('tire_service');
            hasRelevance = true;
        }
        if (lower.includes('แบต') || lower.includes('battery')) {
            filters.attributes.push('battery_service');
            hasRelevance = true;
        }
        if (lower.includes('รถใช้ระหว่างซ่อม') || lower.includes('รถสำรอง') || lower.includes('รถทดแทน') || lower.includes('replacement car') || lower.includes('มีรถให้ใช้') || lower.includes('มีรถใช้')) {
            filters.attributes.push('replacement_car');
            hasRelevance = true;
        }
        
        if (lower.includes('ประกันตัว') || lower.includes('bail')) {
            filters.attributes.push('bail_bond');
            hasRelevance = true;
        }
        if (lower.includes('ค่ารักษา') || lower.includes('medical')) {
            filters.attributes.push('medical');
            hasRelevance = true;
        }
        if (lower.includes('ไฟไหม้') || lower.includes('สูญหาย') || lower.includes('fire') || lower.includes('theft') || lower.includes('รถหาย')) {
            filters.attributes.push('fire_theft_coverage');
            hasRelevance = true;
        }
        if (lower.includes('กระจก') || lower.includes('windshield')) {
            filters.attributes.push('windshield_coverage');
            hasRelevance = true;
        }

        // 4. FINANCIAL EXTRACTION (Strict Distinction between Price and Sum Insured)
        
        // A. Extract potential numbers first
        const numberMatches = Array.from(processedText.matchAll(/(\d{3,9})/g));
        
        // Keywords patterns
        const priceKeywords = /(?:ราคา|เบี้ย|งบ|จ่าย|ไม่เกิน|ต่ำกว่า|ถูกกว่า|price|premium|budget)/;
        const sumKeywords = /(?:ทุน|วงเงิน|คุ้มครอง|เคลม|ซ่อม|sum|cover)/;
        const yearKeywords = /(?:ปี|year|20\d\d|25\d\d)/;

        // Iterate through found numbers
        for (const match of numberMatches) {
            const val = parseInt(match[0]);
            const index = match.index || 0;
            
            // Check immediate context (preceding 20 chars)
            const prefix = processedText.substring(Math.max(0, index - 20), index);
            const isPriceContext = priceKeywords.test(prefix);
            const isSumContext = sumKeywords.test(prefix);
            const isYearContext = yearKeywords.test(prefix);

            // Ignore if looks like a year (e.g. 2018, 2565) unless explicitly marked as price
            if (val >= 1990 && val <= 2600 && !isPriceContext && !isSumContext) {
                 continue; // Likely a year
            }

            // Logic:
            // 1. Explicit keyword takes precedence
            if (isSumContext) {
                filters.minSumInsured = val;
                hasRelevance = true;
            } 
            else if (isPriceContext) {
                filters.maxPrice = val;
                hasRelevance = true;
            } 
            // 2. Heuristic fallback (if no keyword)
            else {
                // Price usually < 40,000 for standard car insurance
                if (val > 1000 && val <= 40000) {
                     // Assume Price if ambiguous and in reasonable range
                     filters.maxPrice = val;
                     hasRelevance = true;
                }
                // Sum Insured usually > 50,000
                else if (val >= 50000) {
                     filters.minSumInsured = val;
                     hasRelevance = true;
                }
            }
        }

        // 6. Model Normalization & Lookup
        const sortedDbModels = [...models].sort((a, b) => b.name.length - a.name.length);
        
        for (const dbModel of sortedDbModels) {
            const cleanDbName = dbModel.name.toLowerCase().replace(/\s+/g, ''); 
            if (textNoSpaces.includes(cleanDbName)) {
                 model = dbModel.name;
                 rawModelKeyword = dbModel.name;
                 hasNewCarIntent = true;
                 hasRelevance = true;
                 break;
            }
        }

        if (!model) {
            const sortedModelKeys = Object.keys(NORMALIZED_MODEL_MAP).sort((a, b) => b.length - a.length);
            for (const modelKey of sortedModelKeys) {
                if (lower.includes(modelKey)) {
                    const normalizedModelName = NORMALIZED_MODEL_MAP[modelKey];
                    const makeKey = Object.keys(COMMON_MODEL_TO_MAKE_MAP).find(k => normalizedModelName.toLowerCase().includes(k) || modelKey.includes(k));
                    if (makeKey) {
                        make = COMMON_MODEL_TO_MAKE_MAP[makeKey];
                    }
                    model = normalizedModelName;
                    rawModelKeyword = modelKey;
                    hasNewCarIntent = true;
                    hasRelevance = true;
                    break;
                }
            }
        }

        // 7. Make Lookup
        if (!make) {
            for (const [key, value] of Object.entries(THAI_BRAND_MAP)) {
                if (lower.includes(key)) {
                    make = value;
                    hasNewCarIntent = true;
                    hasRelevance = true;
                    break;
                }
            }
        }

        // 8. Year Lookup
        const yearRegex = /(?:ปี|\s|^)(25\d{2}|20\d{2})(?:\s|$|[^0-9])/;
        const yearMatch = text.match(yearRegex);
        let hasPossibleYearTypo = false;
        
        if (yearMatch) {
            const y = parseInt(yearMatch[1]);
            if (y >= 1990 && y <= 2600) {
                 year = (y > 2400 ? y - 543 : y).toString();
                 hasRelevance = true;
            }
        } else {
             // Fallback year check if regex missed but numbers exist
             const potentialNum = text.replace(/,/g, '').match(/\b(199\d|20\d\d|25\d\d)\b/);
             if (potentialNum) {
                 const num = parseInt(potentialNum[1]);
                 // Only treat as year if it wasn't already consumed as a price/sum filter
                 if (num < 2600 && num > 1990 && num !== filters.maxPrice && num !== filters.minSumInsured) { 
                     year = (num > 2400 ? num - 543 : num).toString();
                     hasRelevance = true;
                 }
             }
        }

        return { make, model, year, rawModelKeyword, filters, hasNewCarIntent, hasRelevance, hasPossibleYearTypo };
    }

    static analyzeQuery(
        query: string,
        currentContext: SearchResult | null,
        kb: KnowledgeBaseItem[],
        models: CarModel[],
        makes: CarMake[]
    ): SearchAction {
        const lower = query.toLowerCase();

        // 1. Check KB
        const kbMatch = kb.find(k => {
            const keywords = k.question.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            return keywords.some(keyword => lower.includes(keyword));
        });

        if (kbMatch) {
            return { type: 'ANSWER_KB', answer: kbMatch.answer };
        }

        // 2. Special Intent
        if (lower.includes('ผ่อน') || lower.includes('บัตรเครดิต')) {
             return { 
                 type: 'OPEN_LEAD_FORM', 
                 reason: 'สอบถามเรื่องการผ่อนชำระ',
                 context: currentContext
             };
        }

        // 3. Extract Entities
        const extraction = this.extractEntities(query, models);
        const shouldResetFilters = extraction.hasNewCarIntent;
        
        const isContextUpdate = 
            (extraction.make && !currentContext?.make) ||
            (extraction.model && !currentContext?.model) ||
            (extraction.year && !currentContext?.year);

        // 4. REFINE vs NEW SEARCH
        if (!extraction.hasNewCarIntent && !isContextUpdate && extraction.hasRelevance && currentContext && currentContext.make) {
            return { 
                type: 'REFINE_SEARCH', 
                filters: extraction.filters,
                message: 'Refining search based on filters...'
            };
        }

        // Call AI if nothing relevant
        if (!extraction.hasRelevance && !extraction.hasNewCarIntent && !currentContext) {
            return { type: 'CALL_AI', query, context: null };
        }

        // 5. Context Management
        let nextContext: SearchResult = currentContext ? { ...currentContext } : { make: '', model: '', year: '' };

        if (extraction.hasNewCarIntent) {
            nextContext = { 
                make: extraction.make || '', 
                model: extraction.model || '', 
                year: extraction.year || '' 
            };
            if (nextContext.model && !nextContext.make) {
                const dbModel = models.find(m => m.name === nextContext.model);
                if (dbModel) {
                     const dbMake = makes.find(m => m.id === dbModel.makeId);
                     if (dbMake) nextContext.make = dbMake.name;
                }
            }
        } else {
            if (extraction.year) nextContext.year = extraction.year;
        }

        // 6. Completeness Check
        if (!nextContext.make) return { type: 'CALL_AI', query, context: null };

        if (!nextContext.model) {
            const makeId = makes.find(m => m.name.toLowerCase() === nextContext.make.toLowerCase())?.id;
            const availableModels = makeId 
                ? models.filter(m => m.makeId === makeId).map(m => m.name) 
                : [];
            
            return { 
                type: 'ASK_MODEL', 
                make: nextContext.make, 
                options: availableModels,
                message: `ขออภัยครับ เพื่อความถูกต้อง รบกวนระบุ "รุ่นรถ" ของ ${nextContext.make} ให้ผมนิดนึงนะครับ`,
                filters: extraction.filters,
                shouldResetFilters
            };
        }

        if (!nextContext.year) {
            if (extraction.hasPossibleYearTypo) return { type: 'CALL_AI', query, context: null };

            const currentYear = new Date().getFullYear();
            const years = Array.from({ length: 15 }, (_, i) => (currentYear - i).toString());
            return { 
                type: 'ASK_YEAR', 
                make: nextContext.make, 
                model: nextContext.model, 
                options: years,
                message: `รถ ${nextContext.make} ${nextContext.model} "ปีอะไร" ครับ?`,
                filters: extraction.filters,
                shouldResetFilters
            };
        }

        return { 
            type: 'EXECUTE_SEARCH', 
            context: nextContext, 
            filters: extraction.filters,
            shouldResetFilters
        };
    }
}
