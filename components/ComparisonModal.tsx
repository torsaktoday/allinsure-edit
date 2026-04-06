
import React, { useEffect, useState } from 'react';
import { InsurancePlan, Company } from '../types';
import { X, Shield, ChevronRight } from 'lucide-react';
import { comparePlansWithGemini } from '../services/geminiService';

interface ComparisonModalProps {
    plans: InsurancePlan[];
    companies: Company[];
    onClose: () => void;
    onBuy: (plan: InsurancePlan) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ plans, companies, onClose, onBuy }) => {
    const [aiSummary, setAiSummary] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Helper to get company details
    const getCompany = (id: string) => companies.find(c => c.id === id);

    useEffect(() => {
        const generateAiSummary = async () => {
            if (plans.length < 2) return;
            setIsGenerating(true);
            try {
                // Try AI Generation
                const summary = await comparePlansWithGemini(plans);
                setAiSummary(summary);
            } catch (error) {
                // Fallback to AppEngine Logic
                console.warn("AI Compare Failed, using fallback:", error);
                const fallback = generateFallbackSummary();
                setAiSummary(fallback);
            } finally {
                setIsGenerating(false);
            }
        };

        generateAiSummary();
    }, [plans]);

    // Fallback AppEngine Logic (Manual Calculation) - Updated with FA Icons
    const generateFallbackSummary = () => {
        const cheapest = plans.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
        const mostExpensive = plans.reduce((prev, curr) => prev.price > curr.price ? prev : curr);
        const highestSum = plans.reduce((prev, curr) => prev.sumInsured > curr.sumInsured ? prev : curr);

        const diffs = [];
        diffs.push(`<i class="fa-solid fa-tag text-blue-500 mr-2"></i> <b>ราคา</b>: แผนของ ${getCompany(cheapest.companyId)?.name} ถูกที่สุด (${cheapest.price.toLocaleString()} บ.)`);
        diffs.push(`<i class="fa-solid fa-shield-halved text-green-500 mr-2"></i> <b>ทุนประกัน</b>: ${getCompany(highestSum.companyId)?.name} สูงสุดที่ ${highestSum.sumInsured.toLocaleString()} บ.`);

        const repairTypes = new Set(plans.map(p => p.repairType));
        if (repairTypes.size > 1) {
            diffs.push(`<i class="fa-solid fa-screwdriver-wrench text-orange-500 mr-2"></i> <b>ซ่อม</b>: มีทั้งซ่อมอู่และซ่อมห้าง`);
        } else {
             diffs.push(`<i class="fa-solid fa-screwdriver-wrench text-orange-500 mr-2"></i> <b>ซ่อม</b>: ทุกแผนเป็นแบบ ${plans[0].repairType === 'MALL' ? 'ซ่อมห้าง' : 'ซ่อมอู่'}`);
        }

        return diffs.map(d => `<li class="mb-1 flex items-start text-sm">${d}</li>`).join('');
    };

    return (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-fade-in" onClick={onClose}>
            <div className="bg-[#F5F5F7] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-7xl md:rounded-[24px] shadow-2xl overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl sticky top-0 z-20 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-[#1d1d1f] flex items-center gap-2 tracking-tight">
                            <i className="fa-solid fa-code-compare text-blue-600"></i> เปรียบเทียบแผนประกัน
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-[#E8E8ED] hover:bg-[#dcdcde] rounded-full flex items-center justify-center transition">
                        <X size={16} className="text-[#1d1d1f]"/>
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-[#F5F5F7] custom-scrollbar">
                    
                    {/* Compact Main Comparison Table */}
                    <div className="p-4 md:p-6 overflow-x-auto">
                        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-200/60 overflow-hidden min-w-max">
                            <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `130px repeat(${plans.length}, minmax(140px, 1fr))` }}>
                                
                                {/* Header Row */}
                                <div className="p-3 bg-slate-50/50 font-bold text-slate-500 text-xs flex items-center justify-center">แผนประกัน</div>
                                {plans.map(p => {
                                    const c = getCompany(p.companyId);
                                    return (
                                        <div key={p.id} className="p-3 flex flex-col items-center text-center gap-2 bg-white">
                                            <div className="h-10 w-auto flex items-center justify-center">
                                                {c ? <img src={c.logoUrl} className="max-h-full max-w-[80px] object-contain"/> : <Shield size={24}/>}
                                            </div>
                                            <div className="w-full">
                                                <div className="font-bold text-[#1d1d1f] text-xs leading-tight truncate px-1">{p.planName}</div>
                                                <div className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded mt-1 inline-block uppercase">{p.type}</div>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Price Row */}
                                <div className="p-3 bg-slate-50/50 font-bold text-slate-500 text-xs flex flex-col items-center justify-center border-t border-slate-100 gap-1">
                                    <i className="fa-solid fa-tag text-sm text-slate-400"></i>
                                    <span>เบี้ยประกัน</span>
                                </div>
                                {plans.map(p => (
                                    <div key={p.id} className="p-3 text-center border-t border-slate-100 bg-white flex flex-col justify-center">
                                        <div className="text-base font-bold text-[#0071e3] leading-none">{p.price.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">บาท/ปี</div>
                                    </div>
                                ))}

                                {/* Sum Insured Row */}
                                <div className="p-3 bg-slate-50/50 font-bold text-slate-500 text-xs flex flex-col items-center justify-center border-t border-slate-100 gap-1">
                                    <i className="fa-solid fa-shield-halved text-sm text-slate-400"></i>
                                    <span>ทุนประกัน</span>
                                </div>
                                {plans.map(p => (
                                    <div key={p.id} className="p-3 text-center font-bold text-[#1d1d1f] text-sm border-t border-slate-100 bg-white flex items-center justify-center">
                                        {p.sumInsured.toLocaleString()}
                                    </div>
                                ))}

                                {/* Deductible Row */}
                                <div className="p-3 bg-slate-50/50 font-bold text-slate-500 text-xs flex flex-col items-center justify-center border-t border-slate-100 gap-1">
                                    <i className="fa-solid fa-hand-holding-dollar text-sm text-slate-400"></i>
                                    <span>ค่าเสียหายฯ</span>
                                </div>
                                {plans.map(p => (
                                    <div key={p.id} className="p-3 text-center font-bold text-sm border-t border-slate-100 bg-white flex items-center justify-center">
                                        {p.deductible === 0 ? <span className="text-green-600">ไม่มี</span> : p.deductible.toLocaleString()}
                                    </div>
                                ))}

                                {/* Repair Type Row */}
                                <div className="p-3 bg-slate-50/50 font-bold text-slate-500 text-xs flex flex-col items-center justify-center border-t border-slate-100 gap-1">
                                    <i className="fa-solid fa-screwdriver-wrench text-sm text-slate-400"></i>
                                    <span>ซ่อม</span>
                                </div>
                                {plans.map(p => (
                                    <div key={p.id} className="p-3 text-center font-bold text-[#1d1d1f] text-xs border-t border-slate-100 bg-white flex items-center justify-center">
                                        {p.repairType === 'MALL' ? 'ห้าง/ศูนย์' : 'อู่มาตรฐาน'}
                                    </div>
                                ))}
                                
                                {/* Flood Coverage Row */}
                                <div className="p-3 bg-slate-50/50 font-bold text-slate-500 text-xs flex flex-col items-center justify-center border-t border-slate-100 gap-1">
                                    <i className="fa-solid fa-cloud-showers-heavy text-sm text-slate-400"></i>
                                    <span>น้ำท่วม</span>
                                </div>
                                {plans.map(p => (
                                    <div key={p.id} className="p-3 text-center font-bold text-[#1d1d1f] text-xs border-t border-slate-100 bg-white flex items-center justify-center">
                                        {p.floodCoverage > 0 ? p.floodCoverage.toLocaleString() : <span className="text-slate-300">-</span>}
                                    </div>
                                ))}

                                {/* Action Button Row */}
                                <div className="p-3 bg-slate-50/50 border-t border-slate-100"></div>
                                {plans.map(p => (
                                    <div key={p.id} className="p-3 text-center border-t border-slate-100 bg-white">
                                         <button 
                                            onClick={() => onBuy(p)}
                                            className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-lg font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1"
                                         >
                                            เลือกแผนนี้ <ChevronRight size={12}/>
                                         </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Summary Section */}
                    <div className="px-4 md:px-6 pb-6">
                         <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm relative overflow-hidden">
                             {/* Header */}
                             <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                                    {isGenerating ? <i className="fa-solid fa-circle-notch fa-spin text-[10px]"></i> : <i className="fa-solid fa-wand-magic-sparkles text-[10px]"></i>}
                                </div>
                                <h3 className="font-bold text-sm text-[#1d1d1f]">บทวิเคราะห์จาก AI</h3>
                             </div>
                             
                             <div className="text-sm text-[#1d1d1f] leading-relaxed opacity-90">
                                 {aiSummary ? (
                                     <ul className="list-none space-y-1" dangerouslySetInnerHTML={{__html: aiSummary}} />
                                 ) : (
                                     <div className="h-16 bg-slate-50 animate-pulse rounded-lg"></div>
                                 )}
                             </div>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
