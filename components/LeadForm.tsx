import React, { useState } from 'react';
import { Lead, InsurancePlan, Company, SearchResult, PlanType } from '../types';
import { Send, CheckCircle, X, Shield, FileText, SearchX, ArrowRight, Check, IdCard, Wallet, Star, Car, MessageSquare } from 'lucide-react';

interface LeadFormProps {
  query: string;
  fullContextQuery?: string;
  onSubmit: (lead: Omit<Lead, 'id' | 'status' | 'createdAt'>) => void;
  onCancel: () => void;
  selectedPlan?: InsurancePlan;
  company?: Company;
  isMissing?: boolean;
  carContext?: SearchResult | null;
  carLogoUrl?: string;
}

export const LeadForm: React.FC<LeadFormProps> = ({ query, fullContextQuery, onSubmit, onCancel, selectedPlan, company, isMissing, carContext, carLogoUrl }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMember, setIsMember] = useState(false); // MGM Membership Upsell Toggle

  const getPlanDiscountInfo = () => {
      if (!selectedPlan) return { rate: 0, percent: 0, installment: 0 };
      // Discount Logic: Class 1 -> 17%, Others -> 12%
      // Installment: Class 1 -> 10 months, Others -> 6 months
      if (selectedPlan.type === PlanType.CLASS_1 || selectedPlan.type.includes('1')) {
          return { rate: 0.17, percent: 17, installment: 10 };
      } else {
          return { rate: 0.12, percent: 12, installment: 6 };
      }
  };

  const calculateFinalPrice = () => {
    if (!selectedPlan) return 0;
    if (!isMember) return selectedPlan.price;

    const { rate } = getPlanDiscountInfo();
    // Formula: (Price * (1 - rate)) + 200 (Membership/Fee)
    const discountedPrice = Math.floor(selectedPlan.price * (1 - rate));
    return discountedPrice + 200;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct Detailed Summary for Admin
    let summary = `ลูกค้าสนใจ: ${fullContextQuery || query}`;
    
    if (selectedPlan && !isMissing) {
        summary = `[สั่งซื้อ] แผน: ${selectedPlan.planName} (${selectedPlan.type})`;
        summary += ` | บริษัท: ${company?.name || '-'}`;
        
        if (carContext) {
            summary += ` | รถ: ${carContext.make} ${carContext.model} ${carContext.year || ''}`;
        } else {
            summary += ` | รถ: (ตามบทสนทนา)`;
        }

        if (isMember) {
            const { percent, installment } = getPlanDiscountInfo();
            const finalPrice = calculateFinalPrice();
            summary += ` | **สมัครสมาชิก MGM** (ลด ${percent}%, ผ่อน 0% ${installment}ด.)`;
            summary += ` | ราคาสุทธิ: ${finalPrice.toLocaleString()} บาท (จาก ${selectedPlan.price.toLocaleString()})`;
        } else {
            summary += ` | ราคาปกติ: ${selectedPlan.price.toLocaleString()} บาท`;
        }
    } else {
        // Missing Plan Case
        summary = `[ฝากเรื่องหาแผน] ${query}`;
        if (carContext) {
             summary += ` | รถ: ${carContext.make} ${carContext.model} ${carContext.year || ''}`;
        }
    }

    const systemNote = isMissing ? 'Plan Not Found (User Request)' : (isMember ? 'INTERESTED_IN_MEMBER_MGM' : 'STANDARD_BUY');
    const finalNote = remarks.trim() ? `User Note: ${remarks} | ${systemNote}` : systemNote;

    onSubmit({
      customerName: name,
      contactInfo: contact,
      query: summary,
      carDetails: carContext ? `${carContext.make} ${carContext.model} ${carContext.year || ''}` : query,
      notes: finalNote
    });
    setSubmitted(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] bg-white sm:bg-black/60 sm:backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" onClick={handleBackdropClick}>
          <div className="bg-white w-full h-full sm:h-auto sm:rounded-[32px] sm:max-w-sm p-8 text-center shadow-none sm:shadow-2xl animate-scale-up relative overflow-hidden flex flex-col justify-center sm:block border-none sm:border border-white" onClick={(e) => e.stopPropagation()}>
            <div className="hidden sm:block absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-green-500"></div>
            
            <div className="w-24 h-24 sm:w-20 sm:h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 sm:w-10 sm:h-10 text-green-500 animate-bounce" />
            </div>

            <h3 className="text-3xl sm:text-2xl font-bold text-slate-800 mb-2">ส่งข้อมูลสำเร็จ!</h3>
            <p className="text-slate-500 mb-8 leading-relaxed text-base sm:text-sm">
            เจ้าหน้าที่จะติดต่อกลับที่เบอร์/ไลน์<br/>
            <span className="font-bold text-slate-800">{contact}</span> ภายใน 15 นาที
            </p>

            <button 
            onClick={onCancel}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 sm:py-3 rounded-2xl sm:rounded-xl font-bold text-lg sm:text-sm transition"
            >
            ปิดหน้าต่าง
            </button>
        </div>
      </div>
    );
  }

  // CASE 1: BUY FLOW (Existing Premium UI)
  if (selectedPlan && !isMissing) {
      const finalPrice = calculateFinalPrice();
      const { installment } = getPlanDiscountInfo(); 
      const saving = selectedPlan.price - finalPrice;

      return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" onClick={handleBackdropClick}>
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl shadow-2xl relative flex flex-col animate-scale-up overflow-hidden" onClick={(e) => e.stopPropagation()}>
                
                <div className="absolute top-4 right-4 z-50">
                     <button 
                        onClick={onCancel}
                        className="bg-slate-100/80 hover:bg-slate-200 backdrop-blur-md text-slate-500 p-2 rounded-full transition shadow-sm border border-slate-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 sm:p-8 pb-4">
                        <div className="flex flex-col items-start mb-6">
                            <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 p-1 shadow-sm flex items-center justify-center mb-2">
                                {company ? <img src={company.logoUrl} className="w-full h-full object-contain"/> : <Shield className="text-blue-500 w-6 h-6"/>}
                            </div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className={`font-black text-5xl tracking-tight transition-all duration-300 ${isMember ? 'text-green-600' : 'text-slate-900'}`}>
                                    {isMember ? finalPrice.toLocaleString() : selectedPlan.price.toLocaleString()}
                                </span>
                                <span className="text-slate-500 font-bold text-lg">บาท/ปี</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-200 mb-6 flex flex-row items-center gap-4 shadow-sm relative overflow-hidden">
                            <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center">
                                {carLogoUrl ? (
                                    <img src={carLogoUrl} className="w-full h-full object-contain" alt="Car Logo"/>
                                ) : (
                                    <Car className="text-slate-400 w-8 h-8"/>
                                )}
                            </div>
                            
                            <div className="relative z-10 flex-1 min-w-0">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">สรุปรายการ</h4>
                                <div className="font-bold text-xl text-slate-800 leading-tight flex flex-wrap gap-x-2 items-baseline">
                                    {carContext ? (
                                        <>
                                            <span>{carContext.make} {carContext.model}</span>
                                            {carContext.year && <span>{carContext.year}</span>}
                                        </>
                                    ) : (
                                        <span>รถยนต์ของคุณ</span>
                                    )}
                                </div>
                                <div className="text-sm text-slate-600 font-medium mt-1 flex items-center gap-1">
                                    <Shield size={12} className="text-blue-500"/>
                                    <span className="truncate">{selectedPlan.planName}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${selectedPlan.type === PlanType.CLASS_1 ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                                        {selectedPlan.type}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div 
                            onClick={() => setIsMember(!isMember)}
                            className={`relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 overflow-hidden group ${isMember ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100' : 'bg-white border-slate-200 hover:border-green-300 shadow-sm'}`}
                        >
                            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isMember ? 'bg-green-500 border-green-500' : 'border-slate-300 bg-white'}`}>
                                {isMember && <Check size={14} className="text-white"/>}
                            </div>

                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isMember ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    <IdCard size={28} strokeWidth={1.5} />
                                </div>

                                <div className="flex-1">
                                    <h4 className={`font-bold text-lg leading-tight ${isMember ? 'text-green-800' : 'text-slate-700'}`}>
                                        สมัครสมาชิก Sk Member Card
                                    </h4>
                                    <div className="text-sm text-slate-500 mb-2">บัตรสมาชิกส่วนลดระบบ MGM ศรีกรุงโบรคเกอร์</div>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${isMember ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                            ส่วนลดสมาชิกพิเศษ
                                        </span>
                                    </div>

                                    <div className="text-xs text-slate-600 mb-3 space-y-1">
                                        <p className="font-bold flex items-center gap-1 text-slate-700">
                                            <Wallet size={12}/> สมาชิกสามารถผ่อน 0% ได้ {installment} เดือน
                                        </p>
                                        <div className="flex gap-3 opacity-90">
                                            <span className="flex items-center gap-1 font-medium"><CheckCircle size={10} className="text-green-500"/> ผ่อนเงินสด</span>
                                            <span className="flex items-center gap-1 font-medium"><CheckCircle size={10} className="text-green-500"/> ผ่อนบัตรเครดิต</span>
                                        </div>
                                    </div>

                                    {isMember && (
                                        <div className="bg-white/60 rounded-xl p-3 border border-green-100/50 backdrop-blur-sm mt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-green-700">สมาชิกประหยัดทันที</span>
                                                <span className="text-xs font-black text-white bg-green-500 px-2 py-0.5 rounded-md">
                                                    {saving.toLocaleString()} บาท
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-green-100 pt-2">
                                                <div className="flex flex-col text-left">
                                                    <span className="text-[10px] font-bold text-slate-400">ราคาปกติ</span>
                                                    <span className="text-xs font-bold text-slate-400 line-through">{selectedPlan.price.toLocaleString()}</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[10px] font-bold text-green-700">ราคาสมาชิก</span>
                                                    <span className="text-lg font-black text-green-600 leading-none">{finalPrice.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isMember && (
                                <div className="mt-3 text-center border-t border-slate-100 pt-2">
                                    <span className="text-xs font-bold text-green-600 group-hover:underline flex items-center justify-center gap-1 animate-pulse">
                                        คลิกเพื่อรับส่วนลดสมาชิก <ArrowRight size={12}/>
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <p className="text-xs text-slate-400 mt-3 text-center">
                            กรุณากรอกข้อมูลด้านล่าง เพื่อยืนยันสิทธิ์
                        </p>
                    </div>

                    <div className="bg-white px-6 sm:px-8 pb-8 pt-4 border-t border-slate-100 sm:rounded-b-3xl">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">ชื่อ-นามสกุล</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition font-bold text-slate-800 text-base"
                                        placeholder="เช่น สมชาย ใจดี"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">เบอร์โทร / Line ID</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition font-bold text-slate-800 text-base"
                                        placeholder="เบอร์โทร หรือ Line ID (ตัวเลข/ตัวอักษร)"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">ข้อความเพิ่มเติม (ถ้ามี)</label>
                                    <div className="relative">
                                        <MessageSquare size={16} className="absolute top-3.5 left-4 text-slate-400"/>
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition font-medium text-slate-700 text-sm"
                                            placeholder="เช่น สะดวกคุยหลัง 5 โมงเย็น"
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`w-full text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-lg mt-2 active:scale-[0.98] ${isMember ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-green-500/30' : 'bg-slate-900 hover:bg-black shadow-slate-900/20'}`}
                            >
                                {isMember ? <Star size={20} className="fill-white text-white"/> : <Send size={20} />}
                                {isMember ? 'ยืนยันสมัครและรับส่วนลด' : 'ยืนยันการสั่งซื้อ'}
                            </button>
                            
                            <p className="text-center text-xs text-slate-400 mt-2">
                            เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันข้อมูลและเอกสารประกอบ
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // CASE 2: MISSING PLAN FLOW (Redesigned to be Premium iOS Style)
  return (
    <div className="fixed inset-0 z-[60] bg-white sm:bg-black/60 sm:backdrop-blur-sm flex items-center justify-center p-0 sm:p-4" onClick={handleBackdropClick}>
        <div className="w-full h-full sm:h-auto sm:max-w-md bg-white/95 backdrop-blur-xl sm:rounded-[36px] shadow-none sm:shadow-2xl relative animate-scale-up flex flex-col border-none sm:border border-white/50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Header / Car Context */}
            <div className="relative pt-12 pb-6 px-8 text-center bg-gradient-to-b from-blue-50/50 to-transparent">
                <button 
                    onClick={onCancel}
                    className="absolute top-4 right-4 z-10 text-slate-400 hover:text-slate-600 bg-white/50 p-2 rounded-full transition"
                >
                    <X size={20} />
                </button>

                {carLogoUrl ? (
                     <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-2xl shadow-lg border border-white flex items-center justify-center relative z-10">
                        <img src={carLogoUrl} className="w-16 h-16 object-contain" alt="Car Brand"/>
                     </div>
                ) : (
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
                        <SearchX size={36} className="text-orange-500"/>
                    </div>
                )}

                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    {isMissing ? 'เราจะหาให้คุณ!' : 'สนใจแผนนี้?'}
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed px-4">
                    {isMissing ? (
                        <>ยังไม่พบแผนสำหรับ <span className="text-slate-800 font-bold">{fullContextQuery || query}</span> บนหน้าเว็บ<br/>ฝากข้อมูลให้เราเช็คเบี้ยพิเศษให้คุณ</>
                    ) : (
                        <>ฝากข้อมูลติดต่อกลับสำหรับ<br/><span className="text-blue-600 font-bold">{query}</span></>
                    )}
                </p>
            </div>

            {/* Premium Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-4">
                <div className="space-y-4">
                    <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-transparent border-none outline-none font-bold text-slate-700 placeholder-slate-400 text-base text-center"
                            placeholder="ชื่อของคุณ"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                         <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-transparent border-none outline-none font-bold text-slate-700 placeholder-slate-400 text-base text-center"
                            placeholder="เบอร์โทร / Line ID"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                        />
                    </div>

                    <div className="bg-slate-50 p-1 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                        <input
                            type="text"
                            className="w-full px-4 py-3 bg-transparent border-none outline-none font-medium text-slate-600 placeholder-slate-400 text-sm text-center"
                            placeholder="ข้อความเพิ่มเติม (ถ้ามี)"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-slate-300 flex items-center justify-center gap-2 mt-2 text-base"
                >
                    <Send size={18} />
                    {isMissing ? 'ฝากเรื่องให้เจ้าหน้าที่' : 'ยืนยันข้อมูล'}
                </button>
            </form>
        </div>
    </div>
  );
};