
import React from 'react';
import { InsurancePlan, Company, SearchResult, CoverageDetails } from '../types';
import { Shield, ChevronRight, Zap } from 'lucide-react';

interface PlanCardProps {
  plan: InsurancePlan;
  company?: Company;
  onBuy: (plan: InsurancePlan) => void;
  onShowDetails: (plan: InsurancePlan) => void;
  otherPlansCount: number;
  matchedCar?: SearchResult | null;
  isSelected: boolean;
  onToggleCompare: (plan: InsurancePlan) => void;
  onShowMoreCompanyPlans: (companyId: string) => void;
  isFilteredView: boolean;
  isAlternative?: boolean;
  isCompact?: boolean;
  originalQueryContext?: string;
  onRequestSpecialPlan?: (plan: InsurancePlan) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ 
  plan, 
  company, 
  onBuy, 
  onShowDetails, 
  isAlternative = false,
  onRequestSpecialPlan,
  isSelected = false,
  onToggleCompare,
  otherPlansCount
}) => {
  
  if (!plan) return null;

  const planName = plan.planName || 'ชื่อแผนประกัน';
  const repairTypeField = (plan.details as CoverageDetails).repairType;
  const isMallRepair = repairTypeField 
      ? repairTypeField === 'MALL' 
      : (planName.includes('ห้าง') || planName.includes('Center') || (plan.details as any).mallRepair === true || (plan.details as any).repairType === 'MALL');
      
  const type = plan.type || 'ประเภท';
  const price = plan.price || 0;
  
  const details: CoverageDetails = plan.details || {
    sumInsured: 0,
    deductible: 0,
    fireTheft: 0,
    thirdPartyProperty: 0,
    thirdPartyPerson: 0,
    thirdPartyTime: 0,
    paDriver: 0,
    paPassenger: 0,
    medicalExp: 0,
    bailBond: 0,
    emergencyService: false,
    otherServices: [],
    additionalCoverages: [],
    repairType: 'GARAGE'
  };

  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 w-full flex flex-col ${isAlternative ? 'border-2 border-orange-100 shadow-sm' : isSelected ? 'border-2 border-blue-500 shadow-xl scale-[1.02]' : 'border border-blue-50 shadow-lg hover:shadow-xl'}`}>

      {plan.isHotDeal && !isAlternative && (
        <div className="absolute top-0 right-0 z-10">
           <div className="bg-gradient-to-l from-red-500 to-pink-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
              <Zap size={10} className="fill-white"/> HOT DEAL
           </div>
        </div>
      )}

      {/* HEADER: Logo + Name + Price */}
      <div className="p-3 flex gap-3 items-start border-b border-slate-50 pt-4 sm:pt-3">
           <div className="w-12 h-12 shrink-0 rounded-xl border border-slate-100 bg-white p-1.5 flex items-center justify-center shadow-sm">
                {company ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                ) : (
                <Shield className="text-blue-500 w-6 h-6" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div className="pr-1">
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md border mb-0.5 ${type.includes('1') ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-teal-50 border-teal-100 text-teal-600'}`}>
                            {type}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight truncate">{planName}</h3>
                    </div>
                    <div className="text-right leading-none shrink-0">
                        <div className="text-lg font-black text-blue-600 tracking-tight">
                            {price.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold">บาท/ปี</div>
                    </div>
                </div>
            </div>
      </div>

      {/* COMPACT DETAILS GRID (3 Columns) */}
      <div className="p-3 bg-slate-50/50">
           <div className="grid grid-cols-3 gap-2 text-xs divide-x divide-slate-200/50">
               {/* 1. Sum Insured */}
               <div className="text-center px-1">
                   <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">ทุนประกัน</div>
                   <div className="font-bold text-slate-800 truncate">{details.sumInsured >= 1000000 ? `${(details.sumInsured/1000000).toFixed(1)} ล.` : details.sumInsured.toLocaleString()}</div>
               </div>
               
               {/* 2. Deductible */}
               <div className="text-center px-1">
                   <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">ค่าเสียหายส่วนแรก</div>
                   <div className={`font-bold truncate ${details.deductible === 0 ? 'text-green-600' : 'text-slate-800'}`}>
                       {details.deductible === 0 ? 'ไม่มี' : `${details.deductible.toLocaleString()}`}
                   </div>
               </div>

               {/* 3. Repair Type */}
               <div className="text-center px-1">
                   <div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">ประเภทซ่อม</div>
                   <div className="font-bold text-slate-800 truncate">{isMallRepair ? 'ห้าง/ศูนย์' : 'อู่'}</div>
               </div>
           </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="p-3 flex gap-2 items-center">
          {/* Smart Compare Button: Only show if there are other plans to compare with */}
          {onToggleCompare && otherPlansCount > 0 && (
              <button
                  onClick={(e) => { e.stopPropagation(); onToggleCompare(plan); }}
                  className={`w-9 h-9 shrink-0 rounded-lg border transition-all duration-300 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300 hover:text-blue-600 hover:border-blue-300'}`}
                  title="เปรียบเทียบ"
              >
                  <i className={`fa-solid fa-code-compare ${isSelected ? 'text-white' : ''} text-xs`}></i>
              </button>
          )}

          <button 
              onClick={() => onShowDetails(plan)}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 text-xs font-bold rounded-lg transition"
          >
              ดูเงื่อนไข
          </button>
          
          <button 
              onClick={() => onBuy(plan)}
              className={`flex-[1.5] px-3 py-2 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 shadow-md active:scale-95 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600`}
          >
              {isAlternative ? 'เลือกแผนนี้' : 'ซื้อออนไลน์'} <ChevronRight size={14}/>
          </button>
      </div>

      {isAlternative && onRequestSpecialPlan && (
          <div className="bg-orange-50 p-1.5 text-center cursor-pointer hover:bg-orange-100 transition border-t border-orange-100" onClick={() => onRequestSpecialPlan(plan)}>
              <span className="text-[10px] font-bold text-orange-600 flex items-center justify-center gap-1"><Zap size={10}/> ขอข้อเสนอพิเศษ</span>
          </div>
      )}
    </div>
  );
};
