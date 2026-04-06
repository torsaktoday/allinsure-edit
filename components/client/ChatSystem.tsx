
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Search, CheckCircle, Bot, User as UserIcon, AlertCircle, Send, X, ChevronRight, FileText, Check, Activity, Car, Users, Zap, MessageSquare, Scale } from 'lucide-react';
import { ChatMessage, SearchResult, InsurancePlan, Company, CarMake, CarModel, KnowledgeBaseItem, SystemSetting, SearchQuery } from '../../types';
import { PlanCard } from '../PlanCard';
import { LeadForm } from '../LeadForm';
import { ComparisonModal } from '../ComparisonModal';
import { SearchEngine, SearchAction, SearchFilters } from '../../services/searchEngine';
import { processChatWithGemini } from '../../services/geminiService';
import { processChatWithGroq } from '../../services/groqService';
import { api } from '../../services/api';

interface ChatSystemProps {
    masterData: {
        companies: Company[];
        makes: CarMake[];
        models: CarModel[];
        kb: KnowledgeBaseItem[];
        plans: InsurancePlan[];
    };
    settings?: SystemSetting[];
    onAdminLoginClick: () => void;
    onAdminPanelClick?: () => void; // NEW: Switch to admin panel
}

const FALLBACK_MESSAGE = "สวัสดีครับ วันนี้มีรถยี่ห้อไหนจะให้ผมช่วยเช็คประกันมั้ยครับ เลือกจากด้านล่างนี้เลย";

export const ChatSystem: React.FC<ChatSystemProps> = ({ masterData, settings = [], onAdminLoginClick, onAdminPanelClick }) => {
    // Local State for Chat
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchContext, setSearchContext] = useState<SearchResult | null>(null);
    const [pendingFilters, setPendingFilters] = useState<SearchFilters>({}); // NEW: Filter persistence
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');
    const [isBgLoaded, setIsBgLoaded] = useState(false);
    const [showAllBrands, setShowAllBrands] = useState(false);
    
    // Compare Plans State
    const [compareList, setCompareList] = useState<InsurancePlan[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    
    // Session ID for Logging
    const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const sessionMetadataRef = useRef<any>({});

    // Dynamic Settings
    const homeBg = settings.find(s => s.key === 'home_bg_url')?.value || '';
    const themeGradient = settings.find(s => s.key === 'theme_gradient')?.value || 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)';
    const cardStyle = settings.find(s => s.key === 'card_style')?.value || 'vibrant';
    const aiModelSetting = settings.find(s => s.key === 'safeguard_ai_model')?.value;
    const customApiKey = settings.find(s => s.key === 'safeguard_custom_api_key')?.value;

    // Contact Info (Line)
    const lineId = masterData.kb.find(k => k.question.toLowerCase().includes('line') || k.question.includes('ไลน์'))?.answer || '@sisinsure';

    // Refs
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<string>('');
    const lastMessageTimeRef = useRef<number>(0);

    // Modals
    const [isPlanDetailOpen, setIsPlanDetailOpen] = useState(false);
    const [selectedDetailPlan, setSelectedDetailPlan] = useState<InsurancePlan | null>(null);
    const [leadFormState, setLeadFormState] = useState<{
        isOpen: boolean;
        plan?: InsurancePlan;
        query?: string;
        isMissing?: boolean;
        carContext?: SearchResult | null;
    }>({ isOpen: false });

    useEffect(() => {
        if (aiModelSetting) {
            setAiModel(aiModelSetting);
        } else {
            const savedModel = localStorage.getItem('safeguard_ai_model');
            if (savedModel) setAiModel(savedModel);
        }
    }, [aiModelSetting]);

    const tryGetHostname = (url: string) => {
        try { return new URL(url).hostname; } catch { return 'External'; }
    };

    // Preload Background Image & Metadata
    useEffect(() => {
        if (homeBg) {
            const img = new Image();
            img.src = homeBg;
            img.onload = () => setIsBgLoaded(true);
        } else {
            setIsBgLoaded(true); // No BG, just ready
        }

        // --- FETCH METADATA (Geo/ISP) ---
        const fetchMetadata = async () => {
            try {
                // Collect Referrer (Enhanced)
                // Priority: URL Params (UTM) > Document Referrer > Direct
                const params = new URLSearchParams(window.location.search);
                const marketingSource = params.get('utm_source') || params.get('source') || params.get('ref');
                const docReferrer = document.referrer;
                
                // Construct referrer string
                let referrer = 'Direct';
                if (marketingSource) {
                    referrer = marketingSource;
                    if (docReferrer) referrer += ` (via ${tryGetHostname(docReferrer)})`;
                } else if (docReferrer) {
                    referrer = docReferrer;
                }
                
                // Fetch IP Info (Free Service)
                const res = await fetch('https://ipwho.is/');
                const data = await res.json();
                
                if (data && data.success) {
                    sessionMetadataRef.current = {
                        lat: data.latitude,
                        lng: data.longitude,
                        city: data.city,
                        region: data.region,
                        isp: data.connection?.isp || data.isp,
                        referrer: referrer
                    };
                } else {
                    sessionMetadataRef.current = { referrer };
                }
            } catch (e) {
                console.warn("Metadata fetch failed", e);
                // Fallback logic
                const params = new URLSearchParams(window.location.search);
                const marketingSource = params.get('utm_source') || params.get('source') || params.get('ref');
                const referrer = marketingSource || document.referrer || 'Direct';
                sessionMetadataRef.current = { referrer };
            }
        };
        fetchMetadata();

    }, [homeBg]);

    const isHome = messages.length === 0;

    // Scroll Logic
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && !isHome) {
            setTimeout(() => {
                const element = document.getElementById(`msg-${lastMsg.id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }, [messages, isHome]);

    // Helper to log chat with rich metadata
    const logChat = async (role: string, message: string, extraData?: any) => {
        const metadata = sessionMetadataRef.current || {};
        await api.saveChatLog({
            id: Date.now().toString(),
            sessionId: sessionIdRef.current,
            role, 
            message,
            timestamp: new Date().toISOString(),
            ...metadata, // Spread geo info
            metaData: extraData // Save rich context like plans/input types
        });
    };

    // Updated addMessage to accept optional specific logging role
    const addMessage = (msg: ChatMessage, logRoleOverride?: string) => {
        setMessages(prev => [...prev, msg]);
        
        // Prepare rich metadata for logging
        const richMeta: any = {};
        if (msg.inputType) richMeta.inputType = msg.inputType;
        if (msg.attachedPlans && msg.attachedPlans.length > 0) {
            richMeta.attachedPlans = msg.attachedPlans.map(p => ({
                planName: p.planName,
                price: p.price,
                companyId: p.companyId
            }));
        }
        if (msg.options && msg.options.length > 0) richMeta.options = msg.options;
        if (msg.isAlternativeResult) richMeta.isAlternativeResult = true;

        // Use the override if provided, otherwise default to msg.role
        logChat(logRoleOverride || msg.role, msg.text, richMeta);
    };

    const getMakeId = (name: string) => masterData.makes.find(m => m.name.toLowerCase() === name.toLowerCase())?.id;
    
    const resetChat = () => {
        setMessages([]);
        setSearchContext(null);
        setPendingFilters({}); // Reset filters
        setInput('');
        setCompareList([]); // Reset compare list
        sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // New session on reset
    };

    const toggleCompare = (plan: InsurancePlan) => {
        setCompareList(prev => {
            if (prev.find(p => p.id === plan.id)) {
                return prev.filter(p => p.id !== plan.id);
            }
            if (prev.length >= 3) {
                alert('เปรียบเทียบได้สูงสุด 3 แผนครับ');
                return prev;
            }
            return [...prev, plan];
        });
    };

    // --- TEXT HIGHLIGHTING HELPER ---
    const renderMessageText = (text: string) => {
        return text.split('\n').map((line, i) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={i} className={`leading-relaxed ${i > 0 ? 'mt-2' : ''}`}>
                    {parts.map((part, index) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                                <strong key={index} className="font-bold text-slate-800 select-none">
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    // --- ASYNC SERVER-SIDE SEARCH ---
    const executePlanSearch = async (context: SearchResult, filters: SearchFilters) => {
        console.log("Executing Server-Side Search via PlanKB:", context, filters);
        
        // 1. Fetch Exact Matches from Server (Uses SQL JOIN with plan_kb)
        const exact = await api.searchPlans({
            make: context.make,
            model: context.model,
            year: context.year,
            filters: filters
        });

        // 2. Fetch Alternatives (Relaxed Constraints)
        // If exact is empty, try to find something by relaxing price/sum/company filters
        let alternative: InsurancePlan[] = [];
        
        if (exact.length === 0) {
             const relaxedFilters = { ...filters };
             // We relax strictly restrictive numeric/keyword filters to find alternatives
             delete relaxedFilters.maxPrice;
             delete relaxedFilters.minSumInsured;
             delete relaxedFilters.companyKeyword;
             
             const relaxedResults = await api.searchPlans({
                 make: context.make,
                 model: context.model,
                 year: context.year,
                 filters: relaxedFilters
             });
             
             alternative = relaxedResults;
        }
        
        return { exact, alternative };
    };

    const generateId = () => `${Date.now()}-${Math.random()}`;

    // --- UNIFIED SEARCH RESULT HANDLER ---
    const handleSearchResults = (
        query: string, 
        context: SearchResult, 
        filters: SearchFilters, 
        exact: InsurancePlan[], 
        alternative: InsurancePlan[]
    ) => {
        let responseText = '';
        let attachedPlans: InsurancePlan[] = [];
        let isAlt = false;
        let msgInputType: ChatMessage['inputType'] = undefined;
        let options: string[] | undefined = undefined;

        if (exact.length > 0) {
             // --- CASE 1: EXACT MATCH ---
             const filterParts = [];
             if (filters.companyKeyword) filterParts.push(`ของ ${filters.companyKeyword}`);
             if (filters.planType) filterParts.push(`ชั้น ${filters.planType.replace('ชั้น', '')}`);
             if (filters.maxPrice) filterParts.push(`งบ ${filters.maxPrice.toLocaleString()}`);
             if (filters.minSumInsured) filterParts.push(`ทุน ${(filters.minSumInsured/1000000).toFixed(1)}ล.`);
             
             responseText = `เจอแล้วครับ! แผนประกัน${filterParts.join(' ')} ที่ตรงเงื่อนไขเป๊ะ`;
             attachedPlans = exact;

        } else if (alternative.length > 0) {
            // --- CASE 2: ALTERNATIVE (Partial Match) ---
            isAlt = true;
            // Take top 3 closest
            attachedPlans = alternative.slice(0, 3);
            const bestPlan = alternative[0];
            
            // Analyze why it's alternative (Compare best plan vs filters)
            const mismatchReasons: string[] = [];
            const matchPoints: string[] = [];

            if (filters.maxPrice) {
                if (bestPlan.price > filters.maxPrice) mismatchReasons.push(`ราคาเกินงบ (${bestPlan.price.toLocaleString()})`);
                else matchPoints.push(`ราคาอยู่ในงบ`);
            }
            if (filters.minSumInsured) {
                if (bestPlan.sumInsured < filters.minSumInsured) mismatchReasons.push(`ทุนไม่ถึง ${(filters.minSumInsured/1000000).toFixed(1)} ล้าน`);
                else matchPoints.push(`ทุนสูงถึง ${(bestPlan.sumInsured/1000000).toFixed(1)} ล้าน`);
            }
            if (filters.companyKeyword) {
                 // Check if company name contains keyword
                 const companyName = masterData.companies.find(c => c.id === bestPlan.companyId)?.name || '';
                 if (!companyName.includes(filters.companyKeyword)) mismatchReasons.push(`คนละบริษัท`);
            }

            let intro = `ขออภัยครับ ไม่พบแผนที่ตรงเงื่อนไขครบทุกข้อ`;
            if (mismatchReasons.length > 0) {
                intro += ` (${mismatchReasons.join(', ')})`;
            }
            
            let pros = ``;
            if (matchPoints.length > 0) {
                pros = `แต่เรามีแผนใกล้เคียงครับ ${matchPoints.join(' และ ')}`;
            } else {
                pros = `แต่เรามีแผนใกล้เคียงมาแนะนำครับ`;
            }

            responseText = `${intro}\n${pros}\nมีแผนดังนี้ครับ`;

        } else {
            // --- CASE 3: NOT FOUND (Strict Fallback to Admin) ---
            const conditions = [];
            if (filters.companyKeyword) conditions.push(filters.companyKeyword);
            if (filters.planType) conditions.push(filters.planType);
            if (filters.maxPrice) conditions.push(`งบไม่เกิน ${filters.maxPrice.toLocaleString()}`);
            if (filters.minSumInsured) conditions.push(`ทุน ${filters.minSumInsured.toLocaleString()}`);
            if (filters.attributes?.includes('mall_repair')) conditions.push('ซ่อมห้าง');

            const summary = `${context.make} ${context.model} ${context.year} ${conditions.join(' ')}`;
            
            responseText = `สรุปข้อมูล: **${summary}**\n\nขณะนี้แผนที่ตรงกับเงื่อนไขยังไม่แสดงบนหน้าเว็บครับ\nแต่ทางเราสามารถค้นหา**ข้อเสนอพิเศษ**ให้คุณได้ทันที\n\nรบกวนเลือกช่องทางติดต่อด้านล่างเพื่อให้เจ้าหน้าที่ติดต่อกลับครับ`;
            
            msgInputType = 'contact-options';
            options = [summary];
        }

        addMessage({
            id: generateId(),
            role: 'ai',
            text: responseText,
            timestamp: Date.now(),
            attachedPlans: attachedPlans,
            attachedCar: context,
            isAlternativeResult: isAlt,
            inputType: msgInputType,
            options: options
        }, 'AppEngine');
    };

    const performAiSearch = async (query: string, searchContext: SearchResult | null, existingMessages: ChatMessage[]) => {
        try {
            // Check if this exact query was already asked recently to avoid duplicate processing
            const recentMessages = existingMessages.slice(-6);
            const isDuplicateQuery = recentMessages.some(msg => 
                msg.role === 'user' && msg.text.toLowerCase().trim() === query.toLowerCase().trim()
            );
            
            if (isDuplicateQuery) {
                console.log("Duplicate query detected, skipping AI processing");
                setIsLoading(false);
                return;
            }
            
            // Determine which AI service to use based on model
            let aiRes: AIProcessResult;
            
            if (aiModel.includes('groq') || aiModel.includes('openai/')) {
                // Use Groq (includes Groq models and OpenAI models hosted on Groq)
                aiRes = await processChatWithGroq(query, existingMessages, masterData.kb, aiModel, customApiKey);
            } else {
                // Use Gemini (default)
                aiRes = await processChatWithGemini(query, existingMessages, masterData.kb, aiModel, customApiKey);
            }
            
            if (aiRes.carData && aiRes.carData.make) {
                const aiContext = { 
                    make: aiRes.carData.make, 
                    model: aiRes.carData.model || '', 
                    year: aiRes.carData.year || '' 
                };

                // Update filters if AI found any new ones
                if (aiRes.filters) {
                    setPendingFilters(prev => ({...prev, ...aiRes.filters}));
                }
                const effectiveFilters = { ...pendingFilters, ...(aiRes.filters || {}) };
                
                // *** STRICT DATA COMPLETENESS CHECK (Even for AI) ***
                // 1. Missing Model
                if (!aiContext.model) {
                    const makeId = getMakeId(aiContext.make);
                    const availableModels = makeId 
                        ? masterData.models.filter(m => m.makeId === makeId).map(m => m.name) 
                        : [];
                    
                    setSearchContext(aiContext);
                    addMessage({ 
                        id: generateId(), 
                        role: 'ai', 
                        text: `รถ ${aiContext.make} รุ่นอะไรครับ?`, 
                        timestamp: Date.now(), 
                        inputType: 'select-model',
                        options: availableModels
                    }, 'AppEngine');
                    setIsLoading(false);
                    return;
                }

                // 2. Missing Year
                if (!aiContext.year) {
                    setSearchContext(aiContext);
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 15 }, (_, i) => (currentYear - i).toString());
                    addMessage({ 
                        id: generateId(), 
                        role: 'ai', 
                        text: `รถ ${aiContext.make} ${aiContext.model} ปีอะไรครับ?`, 
                        timestamp: Date.now(), 
                        inputType: 'select-year',
                        options: years
                    }, 'AppEngine');
                    setIsLoading(false);
                    return;
                }

                // *** UNLISTED CAR LOGIC (e.g. Hino) ***
                const knownMake = masterData.makes.find(m => m.name.toLowerCase() === aiContext.make.toLowerCase());
                
                if (!knownMake) {
                    setTimeout(() => {
                        const summary = `${aiContext.make} ${aiContext.model} ${aiContext.year}`;
                        addMessage({ 
                            id: generateId(), 
                            role: 'ai', 
                            text: `สรุปความต้องการของคุณคือ:\n**${summary}**\n\nสำหรับรถรุ่นนี้ ทางเราต้องเช็คเบี้ยประกันแบบพิเศษให้ครับ\n**เราทำราคาพิเศษเสนอให้ได้ครับ**\n\nรบกวนเลือกช่องทางติดต่อด้านล่างได้เลยครับ`, 
                            timestamp: Date.now(),
                            inputType: 'contact-options',
                            attachedCar: aiContext,
                            options: [summary]
                        }, 'AppEngine');
                    }, 800);
                    setIsLoading(false);
                    return;
                }

                // Perform Async Search
                const { exact: e2, alternative: a2 } = await executePlanSearch(aiContext, effectiveFilters);
                
                // Only show AI's original greeting if it found EXACT matches
                if (e2.length > 0 && aiRes.reply && !aiRes.reply.includes('มีอะไรให้ผมช่วยเช็ควันนี้ไหมครับ')) {
                     addMessage({ id: generateId(), role: 'ai', text: aiRes.reply, timestamp: Date.now() }, 'AI');
                }

                setSearchContext(aiContext);
                
                // --- DELEGATE TO UNIFIED HANDLER ---
                handleSearchResults(query, aiContext, effectiveFilters, e2, a2);

            } else {
                // FALLBACK LOGIC: If AI intent is SEARCHING but no data extracted, OR UNKNOWN
                if (aiRes.intent === 'SEARCHING' || aiRes.intent === 'UNKNOWN') {
                     // Always fallback to brand selection for general queries, questions, or incomplete attempts
                     // We ONLY show the contact form if we have SPECIFICALLY identified a car context but failed to find plans (handled above or via handleSearchResults)
                     addMessage({ 
                        id: generateId(), 
                        role: 'ai', 
                        text: FALLBACK_MESSAGE, 
                        timestamp: Date.now(), 
                        inputType: 'select-brand' 
                    }, 'AppEngine');
                } else {
                    addMessage({ id: generateId(), role: 'ai', text: aiRes.reply, timestamp: Date.now() }, 'AI');
                }
            }
        } catch (e) {
                console.error("AI Search Error", e);
                // Smart Fallback on Error/Crash
                addMessage({ 
                    id: `${Date.now()}-${Math.random()}`, 
                    role: 'ai', 
                    text: FALLBACK_MESSAGE, 
                    timestamp: Date.now(), 
                    inputType: 'select-brand'
                }, 'AppEngine');
        }
        setIsLoading(false);
    };

    const processInput = async (query: string) => {
        setIsLoading(true);
        // Use AppEngine for Search Logic
        const action: SearchAction = SearchEngine.analyzeQuery(query, searchContext, masterData.kb, masterData.models, masterData.makes);
        
        // Handle Filter State Persistence based on Action
        let nextFilters: SearchFilters = { ...pendingFilters };

        if (action.type === 'ASK_MODEL' || action.type === 'ASK_YEAR' || action.type === 'ASK_MAKE' || action.type === 'EXECUTE_SEARCH' || action.type === 'REFINE_SEARCH') {
            const newFilters = (action as any).filters || {};
            const shouldReset = (action as any).shouldResetFilters;
            
            if (shouldReset) {
                nextFilters = newFilters;
            } else {
                nextFilters = { ...nextFilters, ...newFilters };
            }
            setPendingFilters(nextFilters);
        }

        switch (action.type) {
            case 'ANSWER_KB':
                addMessage({ id: generateId(), role: 'ai', text: action.answer, timestamp: Date.now() }, 'AppEngine');
                setIsLoading(false);
                break;

            case 'OPEN_LEAD_FORM':
                addMessage({ id: generateId(), role: 'ai', text: `สำหรับเรื่อง "${query}" \nรบกวนฝากข้อมูลให้เจ้าหน้าที่ติดต่อกลับเพื่อแจ้งรายละเอียดโดยตรงนะครับ`, timestamp: Date.now() }, 'AppEngine');
                setLeadFormState({ 
                    isOpen: true, 
                    query: `${query} (${action.context ? `${action.context.make} ${action.context.model}` : 'สอบถามทั่วไป'})`, 
                    isMissing: false,
                    carContext: action.context 
                });
                setIsLoading(false);
                break;

            case 'ASK_MAKE':
                 setSearchContext(null);
                 addMessage({ 
                     id: generateId(), 
                     role: 'ai', 
                     text: action.message || 'รบกวนเลือกยี่ห้อรถด้านล่างได้เลยครับ', 
                     timestamp: Date.now(), 
                     inputType: 'select-brand' 
                 }, 'AppEngine');
                 setIsLoading(false);
                 break;

            case 'ASK_MODEL':
                setSearchContext({ make: action.make, model: '', year: '' });
                addMessage({ id: generateId(), role: 'ai', text: action.message, timestamp: Date.now(), inputType: 'select-model', options: action.options }, 'AppEngine');
                setIsLoading(false);
                break;

            case 'ASK_YEAR':
                setSearchContext({ make: action.make, model: action.model || '', year: '' });
                addMessage({ id: generateId(), role: 'ai', text: action.message, timestamp: Date.now(), inputType: 'select-year', options: action.options }, 'AppEngine');
                setIsLoading(false);
                break;

            case 'EXECUTE_SEARCH':
            case 'REFINE_SEARCH':
                const activeContext = action.type === 'REFINE_SEARCH' ? searchContext! : action.context;
                setSearchContext(activeContext);

                // Use calculated nextFilters, not stale state
                const { exact, alternative } = await executePlanSearch(activeContext, nextFilters);
                
                // Only delegate to AI if we have complete context and still found nothing
                if (exact.length === 0 && alternative.length === 0 && contextIsComplete(activeContext)) {
                     console.log("Local search 0 results with complete context. Delegating to AI...");
                     await performAiSearch(query, searchContext, messages); 
                     return;
                }
                
                // --- DELEGATE TO UNIFIED HANDLER ---
                handleSearchResults(query, activeContext, nextFilters, exact, alternative);
                setIsLoading(false);
                break;

            case 'CALL_AI':
                // If refining context, pass it
                if (!action.context && searchContext) action.context = searchContext;
                await performAiSearch(query, searchContext, messages);
                break;

            case 'ERROR':
                addMessage({ id: generateId(), role: 'ai', text: action.message, timestamp: Date.now() }, 'AppEngine');
                setIsLoading(false);
                break;
        }
    };
    
    // Helper to check if context is sufficient to trust a "Not Found" result
    const contextIsComplete = (c: SearchResult) => {
        return c.make && c.model && c.year;
    };

    const handleSendMessage = (e?: React.FormEvent, override?: string) => {
        e?.preventDefault();
        const text = override || input;
        
        const now = Date.now();
        if (!text.trim()) return;
        if (text === lastMessageRef.current && (now - lastMessageTimeRef.current) < 500) return;
        
        lastMessageRef.current = text;
        lastMessageTimeRef.current = now;

        setInput('');
        
        // User message always logs as 'user'
        addMessage({ 
            id: `${now}-${Math.random()}`, 
            role: 'user', 
            text, 
            timestamp: now 
        }, 'user');
        processInput(text);
    };

    const handleBuyPlan = (plan: InsurancePlan, attachedCar?: SearchResult) => {
        // No need to lookup from masterData, use passed object
        const contextToUse = attachedCar || searchContext;
        
        setLeadFormState({
            isOpen: true, 
            plan: plan, 
            query: `Buy ${plan.planName}`,
            carContext: contextToUse
        });
    };
    
    const openPlanDetail = (plan: InsurancePlan) => {
        setSelectedDetailPlan(plan);
        setIsPlanDetailOpen(true);
    };

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden text-slate-800 relative bg-[#F8FAFC]">
            
            <style>{`:root { --primary-gradient: ${themeGradient}; }`}</style>
            
            <div 
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${isHome && isBgLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                style={{ backgroundImage: homeBg ? `url('${homeBg}')` : undefined }}
            />
            
            <div className={`absolute inset-0 transition-opacity duration-1000 ${isHome && !isBgLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                 style={{ background: 'linear-gradient(to bottom right, #1e293b, #0f172a)' }}>
            </div>
            
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 transition-opacity duration-500 ${isHome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>
            <div className={`absolute inset-0 bg-[#F8FAFC] transition-opacity duration-700 ${!isHome ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

            <header className={`fixed top-0 w-full z-40 transition-all duration-500 ${isHome ? 'bg-transparent pt-safe top-4' : 'bg-gradient-to-r from-blue-600 to-cyan-500 py-3 shadow-lg'}`} style={!isHome ? { background: themeGradient } : {}}>
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={resetChat}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-md transition-colors ${isHome ? 'bg-white/20 text-white backdrop-blur-md' : 'bg-white text-blue-600'}`}>
                            <Shield size={20} strokeWidth={3} />
                        </div>
                        <h1 className={`text-lg font-extrabold tracking-wide transition-colors ${isHome ? 'text-white drop-shadow-md' : 'text-white'}`}>AutoShield</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {onAdminPanelClick && (
                            <button 
                                onClick={onAdminPanelClick}
                                className={`transition flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isHome ? 'bg-blue-500/30 text-white hover:bg-blue-500/50 backdrop-blur-md' : 'bg-blue-500/20 text-white/90 hover:text-white'}`}
                            >
                                <Lock size={12} /> ระบบแอดมิน
                            </button>
                        )}
                        <button 
                            onClick={onAdminLoginClick}
                            className={`transition flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isHome ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md' : 'bg-white/20 text-white/90 hover:text-white'}`}
                        >
                            <Lock size={12} /> เจ้าหน้าที่
                        </button>
                    </div>
                </div>
            </header>

            <main className={`flex-1 relative z-10 w-full ${isHome ? 'flex flex-col' : 'overflow-y-auto pt-24 pb-32 no-scrollbar'}`} ref={chatContainerRef}>
                
                {isHome && (
                    <div className="flex-1 flex flex-col items-center justify-between h-full pt-20 pb-safe px-4 w-full max-w-md mx-auto md:max-w-4xl">
                        <div className="flex-1 flex flex-col items-center justify-center text-center w-full min-h-0">
                            <div className="relative z-20 animate-fade-in">
                                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white leading-tight drop-shadow-xl mb-2">
                                    เช็คเบี้ยประกัน <br/>
                                    <span className="text-cyan-300">ง่ายนิดเดียว</span>
                                </h2>
                                <p className="text-slate-200 text-sm sm:text-base font-medium max-w-xs sm:max-w-sm mx-auto drop-shadow-md">
                                    รู้ผลทันที • เปรียบเทียบ 30+ บริษัท • การันตีราคาดีที่สุด
                                </p>
                            </div>
                        </div>

                        <div className="w-full flex flex-col items-center gap-3 relative z-30 mb-4 sm:mb-8 shrink-0 animate-slide-up">
                            <div className="w-full max-w-lg">
                                <form 
                                    onSubmit={(e) => handleSendMessage(e)}
                                    className="bg-white p-1.5 pl-5 rounded-full shadow-2xl shadow-blue-900/30 flex items-center gap-2 transition-transform hover:scale-[1.01]"
                                >
                                    <Search size={20} className="text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="รุ่นรถของคุณ (เช่น Civic 2023)..."
                                        className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-bold text-base sm:text-lg h-10 sm:h-12 min-w-0"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim()}
                                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50 transition-transform active:scale-95 shrink-0"
                                        style={{ background: themeGradient }}
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </form>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-2 px-2">
                                {[
                                    { label: 'ประกันชั้น 1', color: 'bg-white/90 text-blue-700' },
                                    { label: 'ผ่อน 0%', color: 'bg-white/90 text-orange-600' },
                                    { label: 'Civic', color: 'bg-white/90 text-pink-600' },
                                    { label: 'Toyota', color: 'bg-white/90 text-green-600' },
                                ].map((tag, i) => (
                                    <button key={i} onClick={() => handleSendMessage(undefined, tag.label)} className={`px-3 py-1.5 ${tag.color} backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold shadow-lg hover:bg-white hover:scale-105 transition-all`}>
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl z-20 shrink-0 mb-2 sm:mb-4 animate-slide-up ${cardStyle === 'minimal' ? 'bg-white/95 backdrop-blur-md' : 'bg-white'}`}>
                            <div className="flex items-baseline justify-between mb-3">
                                <div className="flex items-center gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-wider text-slate-400">
                                    <CheckCircle size={12} className="text-green-500"/> เลือกยี่ห้อรถยนต์
                                </div>
                                {masterData.makes.length > 6 && (
                                    <button 
                                        onClick={() => setShowAllBrands(!showAllBrands)}
                                        className="text-slate-500 hover:text-blue-600 text-[10px] sm:text-xs font-bold transition-all px-2 py-1 rounded-md hover:bg-slate-100"
                                    >
                                        {showAllBrands ? 'ย่อลง' : 'ดูเพิ่มเติม'}
                                    </button>
                                )}
                            </div>
                            
                            {masterData.makes.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
                                        {(showAllBrands ? masterData.makes : masterData.makes.slice(0, 6)).map((brand) => (
                                            <button 
                                            key={brand.id}
                                            onClick={() => handleSendMessage(undefined, brand.name)}
                                            className="group w-full p-2 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-lg bg-white transition-all flex flex-col items-center gap-1 sm:gap-3 active:scale-95 aspect-[4/3] sm:aspect-square justify-center"
                                            >
                                                <img src={brand.logoUrl} alt={brand.name} className="h-6 sm:h-10 w-auto object-contain transition-transform group-hover:scale-110" />
                                                <span className="font-bold text-[10px] sm:text-xs text-slate-600 group-hover:text-blue-600 truncate w-full text-center">{brand.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 animate-pulse">
                                    {[1,2,3,4,5,6].map(i => (
                                        <div key={i} className="h-20 bg-slate-100 rounded-xl flex flex-col items-center justify-center gap-2">
                                            <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                                            <div className="w-12 h-2 bg-slate-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {!isHome && (
                    <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6 min-h-full">
                        {messages.map((msg) => {
                            const isPlanResult = msg.attachedPlans && msg.attachedPlans.length > 0;
                            return (
                                <div key={msg.id} id={`msg-${msg.id}`} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up scroll-mt-28`}>
                                    <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse max-w-[90%]' : 'flex-row w-full md:w-[90%]'}`}>
                                        
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${msg.role === 'ai' ? 'bg-white' : 'bg-blue-600'}`}>
                                            {msg.role === 'ai' ? <Bot size={18} className="text-blue-600" /> : <UserIcon size={16} className="text-white" />}
                                        </div>

                                        <div className="flex flex-col gap-2 w-full min-w-0">
                                            {msg.text && (
                                                <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm self-start select-none ${
                                                    msg.role === 'user' 
                                                        ? 'bubble-user rounded-tr-none font-medium self-end' 
                                                        : 'bubble-ai rounded-tl-none bg-white'
                                                } ${msg.isError ? 'bg-red-50 text-red-600 border-red-100' : ''}`}>
                                                    {renderMessageText(msg.text)}
                                                </div>
                                            )}
                                            
                                            {msg.isAlternativeResult && (
                                                <div className="flex items-center gap-2 text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 self-start animate-fade-in">
                                                    <AlertCircle size={14}/> ระบบหาแผนใกล้เคียงมาให้ครับ
                                                </div>
                                            )}
                                            
                                            {/* CONTACT OPTIONS: LINE & FORM BUTTONS */}
                                            {msg.inputType === 'contact-options' && (
                                                <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full max-w-sm animate-fade-in">
                                                    <button
                                                        onClick={() => setLeadFormState({
                                                            isOpen: true,
                                                            query: msg.options?.[0] || msg.text,
                                                            isMissing: true,
                                                            carContext: msg.attachedCar
                                                        })}
                                                        className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center justify-center gap-2 transition-transform active:scale-95"
                                                    >
                                                        <FileText size={18} /> กรอกฟอร์มขอราคา
                                                    </button>
                                                    <a
                                                        href={`https://line.me/ti/p/~${lineId.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-1 py-3.5 bg-[#06C755] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-[#05b64d] flex items-center justify-center gap-2 transition-transform active:scale-95"
                                                    >
                                                        <MessageSquare size={18} /> ติดต่อทางไลน์
                                                    </a>
                                                </div>
                                            )}

                                            {msg.inputType === 'select-model' && msg.options && (
                                                <div className="flex flex-wrap gap-2 animate-fade-in mt-1">
                                                    {msg.options.map(opt => (
                                                        <button key={opt} onClick={() => handleSendMessage(undefined, opt)} className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition">
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {msg.inputType === 'select-year' && msg.options && (
                                                <div className="grid grid-cols-4 gap-2 animate-fade-in mt-1 max-w-sm">
                                                    {msg.options.map(opt => (
                                                        <button key={opt} onClick={() => handleSendMessage(undefined, opt)} className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-100 px-2 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition">
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {msg.inputType === 'select-brand' && (
                                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-fade-in mt-1 max-w-sm">
                                                    {masterData.makes.map(brand => (
                                                        <button 
                                                            key={brand.id} 
                                                            onClick={() => handleSendMessage(undefined, brand.name)} 
                                                            className="bg-white hover:border-blue-400 border border-slate-100 p-2 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center gap-1"
                                                        >
                                                            <img src={brand.logoUrl} className="h-8 w-auto object-contain"/>
                                                            <span className="text-[10px] font-bold text-slate-600">{brand.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {isPlanResult && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 w-full animate-fade-in">
                                                    {msg.attachedPlans?.map((plan, idx) => (
                                                        <div key={plan.id} className="w-full">
                                                            <PlanCard 
                                                                plan={plan} 
                                                                company={masterData.companies.find(c => c.id === plan.companyId)}
                                                                onBuy={(p) => handleBuyPlan(p, msg.attachedCar)}
                                                                onShowDetails={openPlanDetail}
                                                                otherPlansCount={(msg.attachedPlans?.length || 0) - 1}
                                                                isSelected={compareList.some(cp => cp.id === plan.id)}
                                                                onToggleCompare={toggleCompare}
                                                                onShowMoreCompanyPlans={()=>{}}
                                                                isFilteredView={false}
                                                                isAlternative={msg.isAlternativeResult && idx >= 0}
                                                                onRequestSpecialPlan={() => setLeadFormState({ isOpen: true, plan, query: 'Request Special Offer', isMissing: false, carContext: searchContext })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        {isLoading && (
                            <div className="flex justify-start w-full animate-fade-in">
                                <div className="flex max-w-[80%] gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                        <Bot size={18} className="text-blue-600 animate-pulse" />
                                    </div>
                                    <div className="bubble-ai px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 bg-white">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </main>

            {!isHome && (
                <div className="fixed bottom-0 w-full p-3 pb-safe z-30 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                    
                    {/* Compare Floating Bar */}
                    {compareList.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 p-4 flex justify-center pb-2 pointer-events-none">
                            <div className="bg-slate-900 text-white rounded-full shadow-2xl p-2 pl-6 pr-2 flex items-center gap-4 pointer-events-auto animate-slide-up">
                                <div className="text-sm font-bold flex items-center gap-2">
                                    <Scale size={16}/> เปรียบเทียบ {compareList.length}/3 แผน
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setCompareList([])} className="px-3 py-1.5 rounded-full text-xs font-bold hover:bg-white/10 text-slate-300">ล้าง</button>
                                    <button 
                                        onClick={() => setIsCompareModalOpen(true)}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-bold text-white shadow-lg transition active:scale-95"
                                    >
                                        ดูตารางเปรียบเทียบ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="max-w-5xl mx-auto">
                        <form 
                            onSubmit={(e) => handleSendMessage(e)}
                            className="bg-slate-100 p-1.5 pl-4 rounded-full flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="พิมพ์ข้อความ..."
                                className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 font-medium h-10"
                            />
                            <button 
                                type="submit" 
                                disabled={!input.trim()}
                                className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 transition-transform active:scale-95"
                                style={{ background: themeGradient }}
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {leadFormState.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <LeadForm 
                        query={leadFormState.query || ''} 
                        fullContextQuery={leadFormState.isMissing ? `${searchContext?.make} ${searchContext?.model} ${searchContext?.year || ''}`: undefined}
                        onSubmit={async (lead) => {
                             // Append chat history to lead
                             const leadData = {
                                ...lead,
                                id: Date.now().toString(),
                                status: 'NEW' as const,
                                createdAt: new Date().toISOString(),
                                chatHistory: messages
                             };
                             await api.saveLead(leadData);
                             setLeadFormState({ isOpen: false });
                             addMessage({ id: Date.now().toString(), role: 'ai', text: 'ขอบคุณครับ! เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุดครับ', timestamp: Date.now() }, 'AppEngine');
                        }}
                        onCancel={() => setLeadFormState({ isOpen: false })}
                        selectedPlan={leadFormState.plan}
                        company={leadFormState.plan ? masterData.companies.find(c => c.id === leadFormState.plan!.companyId) : undefined}
                        isMissing={leadFormState.isMissing}
                        carContext={leadFormState.carContext}
                        carLogoUrl={leadFormState.carContext?.make ? masterData.makes.find(m => m.name.toLowerCase() === leadFormState.carContext!.make.toLowerCase())?.logoUrl : undefined}
                    />
                </div>
            )}
            
            {isCompareModalOpen && (
                <ComparisonModal 
                    plans={compareList}
                    companies={masterData.companies}
                    onClose={() => setIsCompareModalOpen(false)}
                    onBuy={(p) => { setIsCompareModalOpen(false); handleBuyPlan(p); }}
                />
            )}

            {isPlanDetailOpen && selectedDetailPlan && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
                        <button onClick={() => setIsPlanDetailOpen(false)} className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition"><X size={20}/></button>
                        
                        <div className="bg-blue-600 p-6 text-white pt-10 relative overflow-hidden shrink-0" style={{ background: themeGradient }}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <h3 className="text-xl font-bold relative z-10">{selectedDetailPlan.planName}</h3>
                            <div className="flex items-end gap-2 mt-2 relative z-10">
                                <span className="text-4xl font-extrabold">{selectedDetailPlan.price.toLocaleString()}</span>
                                <span className="text-sm opacity-80 mb-1">บาท/ปี</span>
                            </div>
                        </div>

                        {/* Summary Badges - Highlights */}
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2 shrink-0">
                            <span className="bg-white text-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-blue-100 flex items-center gap-1">
                                {selectedDetailPlan.repairType === 'MALL' ? 'ซ่อมห้าง/ศูนย์' : 'ซ่อมอู่มาตรฐาน'}
                            </span>
                            {selectedDetailPlan.deductible === 0 && (
                                <span className="bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-green-100 flex items-center gap-1">
                                    <CheckCircle size={10} className="fill-green-600 text-white"/> ไม่มีค่าเสียหายส่วนแรก
                                </span>
                            )}
                            {selectedDetailPlan.emergencyService && (
                                <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-orange-100 flex items-center gap-1">
                                    <Zap size={10} className="fill-orange-500 text-white"/> ช่วยเหลือฉุกเฉิน 24 ชม.
                                </span>
                            )}
                            {(selectedDetailPlan.floodCoverage || 0) > 0 && (
                                <span className="bg-cyan-50 text-cyan-700 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm border border-cyan-100 flex items-center gap-1">
                                    คุ้มครองน้ำท่วม {(selectedDetailPlan.floodCoverage!).toLocaleString()}
                                </span>
                            )}
                        </div>

                        <div className="p-0 overflow-y-auto bg-white flex-1">
                             <div className="space-y-0 pb-6">
                                {/* Company Header */}
                                <div className="p-6 pb-4 flex items-center gap-4 border-b border-slate-50">
                                     <img src={masterData.companies.find(c=>c.id===selectedDetailPlan.companyId)?.logoUrl} className="h-10 w-auto object-contain" />
                                     <div>
                                        <div className="font-bold text-slate-800 text-base">{selectedDetailPlan.type}</div>
                                        <div className="text-xs text-slate-500">คุ้มครองโดย {masterData.companies.find(c=>c.id===selectedDetailPlan.companyId)?.name}</div>
                                     </div>
                                </div>
                                
                                {selectedDetailPlan.details.mainCustomCoverages && selectedDetailPlan.details.mainCustomCoverages.length > 0 && (
                                    <div className="px-6 py-4">
                                        <h4 className="font-bold text-xs text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2"><Shield size={14}/> ความคุ้มครองหลักอื่นๆ</h4>
                                        <div className="space-y-1">
                                            {selectedDetailPlan.details.mainCustomCoverages.map((item, idx) => (
                                                <div key={idx} className="flex justify-between py-1.5 items-center">
                                                    <span className="text-slate-600 text-sm font-medium">{item.name}</span>
                                                    <span className="font-bold text-slate-800 text-sm">{item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="px-6 py-4">
                                    <h4 className="font-bold text-xs text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2"><Car size={14}/> ความรับผิดชอบต่อรถยนต์</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">ทุนประกัน</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.sumInsured.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">ค่าเสียหายส่วนแรก</span>
                                            <span className={`font-bold text-sm ${selectedDetailPlan.deductible===0?'text-green-600':'text-slate-800'}`}>{selectedDetailPlan.deductible===0?'ไม่มี':`${selectedDetailPlan.deductible.toLocaleString()}`}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">ประเภทซ่อม</span>
                                            <span className={`font-bold text-slate-800 text-sm`}>
                                                {selectedDetailPlan.repairType === 'MALL' ? 'ซ่อมห้าง/ศูนย์' : 'ซ่อมอู่มาตรฐาน'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">รถยนต์สูญหาย / ไฟไหม้</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.fireTheft.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4 bg-slate-50/50">
                                    <h4 className="font-bold text-xs text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-2"><Users size={14}/> ความรับผิดชอบต่อบุคคลภายนอก</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">ทรัพย์สินบุคคลภายนอก</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.thirdPartyProperty.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">บาดเจ็บ/เสียชีวิต (ต่อคน)</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.thirdPartyPerson.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">บาดเจ็บ/เสียชีวิต (ต่อครั้ง)</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.thirdPartyTime.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-4">
                                    <h4 className="font-bold text-xs text-pink-600 uppercase tracking-wider mb-2 flex items-center gap-2"><Activity size={14}/> ความคุ้มครองต่อบุคคลสูงสุด</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">เสียชีวิต (ผู้ขับขี่)</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.paDriver.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">เสียชีวิต (ผู้โดยสาร)</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.paPassenger.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">ค่ารักษาพยาบาล</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.medicalExp.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 items-center">
                                            <span className="text-slate-600 text-sm">การประกันตัวผู้ขับขี่</span>
                                            <span className="font-bold text-slate-800 text-sm">{selectedDetailPlan.details.bailBond.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {((selectedDetailPlan.floodCoverage || 0) > 0 || selectedDetailPlan.emergencyService || (selectedDetailPlan.details.additionalCoverages && selectedDetailPlan.details.additionalCoverages.length > 0) || (selectedDetailPlan.details.otherServices && selectedDetailPlan.details.otherServices.length > 0)) && (
                                    <div className="mx-6 mt-2 bg-green-50 rounded-xl p-4 border border-green-100 mb-6">
                                        <h4 className="font-bold text-green-700 text-xs mb-3 uppercase tracking-wide">สิทธิพิเศษเพิ่มเติม</h4>
                                        <div className="space-y-2">
                                            {(selectedDetailPlan.floodCoverage || 0) > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                                                    <Check size={14} className="text-green-600"/> คุ้มครองน้ำท่วม <span className="font-bold">{(selectedDetailPlan.floodCoverage!).toLocaleString()}</span> บาท
                                                </div>
                                            )}
                                            {selectedDetailPlan.emergencyService && (
                                                <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                                                    <Check size={14} className="text-green-600"/> บริการช่วยเหลือฉุกเฉิน 24 ชม.
                                                </div>
                                            )}
                                            
                                            {/* Legacy Other Services */}
                                            {selectedDetailPlan.details.otherServices?.map((s, i) => (
                                                 <div key={`os-${i}`} className="flex items-center gap-2 text-sm text-green-800 font-medium">
                                                    <Check size={14} className="text-green-600"/> {s}
                                                </div>
                                            ))}

                                            {/* Structured Additional Coverages */}
                                            {selectedDetailPlan.details.additionalCoverages?.map((s, i) => (
                                                 <div key={`ac-${i}`} className="flex justify-between items-center text-sm text-green-800 bg-white/60 p-2 rounded-lg">
                                                    <div className="flex items-center gap-2 font-medium"><Check size={14} className="text-green-600"/> {s.name}</div>
                                                    {s.price > 0 && <div className="font-bold">+{s.price.toLocaleString()} บาท</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                             </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white shrink-0 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-20">
                            <button 
                                onClick={() => { setIsPlanDetailOpen(false); handleBuyPlan(selectedDetailPlan); }} 
                                className="w-full py-3.5 bg-[#007AFF] text-white rounded-2xl font-bold text-lg shadow-[0_4px_14px_0_rgba(0,118,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,118,255,0.23)] hover:bg-[#0071EB] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                ซื้อแผนนี้ทันที <ChevronRight size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
