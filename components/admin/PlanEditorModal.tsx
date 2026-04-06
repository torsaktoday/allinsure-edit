
import React, { useState, useEffect } from 'react';
import { InsurancePlan, PlanType, PlanStatus, Company, CarMake, CarModel, VehicleCriteria, CoverageDetails } from '../../types';
import { Shield, Sparkles, Activity, User as UserIcon, Plus, Trash, X, Wrench, CheckCircle } from 'lucide-react';
import { PlanCard } from '../PlanCard';

interface PlanEditorModalProps {
    plan: InsurancePlan | null;
    companies: Company[];
    makes: CarMake[];
    models: CarModel[];
    onSave: (plan: InsurancePlan) => void;
    onCancel: () => void;
}

export const PlanEditorModal: React.FC<PlanEditorModalProps> = ({ 
    plan, companies, makes, models, onSave, onCancel 
}) => {
    const [planEditTab, setPlanEditTab] = useState<'basic'|'coverage'|'cars'|'preview'>('basic');
    const [tempPlanData, setTempPlanData] = useState<Partial<InsurancePlan>>({});
    
    // Criteria State
    const [newCriteria, setNewCriteria] = useState<{
        makeId: string;
        modelId: string;
        subModels: string[];
        minYear: string;
        maxYear: string;
    }>({ makeId: '', modelId: '', subModels: [], minYear: '', maxYear: '' });

    // Additional Service Input (Privileges)
    const [newService, setNewService] = useState('');
    const [newServicePrice, setNewServicePrice] = useState('');

    // Main Coverage Custom Input
    const [newMainCovName, setNewMainCovName] = useState('');
    const [newMainCovValue, setNewMainCovValue] = useState('');

    useEffect(() => {
        if (plan) {
            // Deep copy to ensure we don't mutate props and detach from parent updates
            setTempPlanData(JSON.parse(JSON.stringify(plan)));
        } else {
            // Set Defaults for New Plan
            setTempPlanData({
                id: Date.now().toString(),
                planName: 'แผนประกันตัวอย่าง',
                type: PlanType.CLASS_1,
                price: 15000,
                // Default to first company if available, or empty string
                companyId: companies.length > 0 ? companies[0].id : '',
                status: PlanStatus.ACTIVE,
                details: {
                    sumInsured: 600000, deductible: 0, fireTheft: 600000,
                    repairType: 'GARAGE',
                    thirdPartyProperty: 2500000, thirdPartyPerson: 500000, thirdPartyTime: 10000000,
                    paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000,
                    floodCoverage: 0, emergencyService: false, otherServices: [], additionalCoverages: [], 
                    mainCustomCoverages: []
                },
                applicableCars: []
            });
        }
        // FIXED: Only re-initialize if plan ID changes (switching plans or new plan). 
        // This prevents form reset/bouncing when parent re-renders with same plan object ref.
    }, [plan?.id]); 

    const addCriteria = () => {
        if (!newCriteria.makeId) return alert('กรุณาเลือกยี่ห้อรถ');
        const crit: VehicleCriteria = {
            id: Date.now().toString(),
            carMakeId: newCriteria.makeId,
            carModelId: newCriteria.modelId || undefined,
            subModels: newCriteria.subModels.length > 0 ? newCriteria.subModels : undefined,
            yearMin: newCriteria.minYear ? parseInt(newCriteria.minYear) : 2000,
            yearMax: newCriteria.maxYear ? parseInt(newCriteria.maxYear) : 2030
        };
        setTempPlanData(prev => ({ ...prev, applicableCars: [...(prev.applicableCars || []), crit] }));
        setNewCriteria(prev => ({ ...prev, modelId: '', subModels: [], minYear: '', maxYear: '' }));
    };

    const handleAddCoverage = () => {
        if(!newService.trim()) return;
        const currentDetails = (tempPlanData.details || { additionalCoverages: [] }) as CoverageDetails;
        const currentAdditional = currentDetails.additionalCoverages || [];
        
        const price = parseInt(newServicePrice) || 0;
        
        setTempPlanData({ 
            ...tempPlanData, 
            details: { 
                ...currentDetails, 
                additionalCoverages: [...currentAdditional, { name: newService, price: price }] 
            } as any 
        });
        setNewService('');
        setNewServicePrice('');
    };

    const handleAddMainCoverage = () => {
        if(!newMainCovName.trim()) return;
        const currentDetails = (tempPlanData.details || { mainCustomCoverages: [] }) as CoverageDetails;
        const currentMain = currentDetails.mainCustomCoverages || [];
        
        const value = parseInt(newMainCovValue) || 0;
        
        setTempPlanData({ 
            ...tempPlanData, 
            details: { 
                ...currentDetails, 
                mainCustomCoverages: [...currentMain, { name: newMainCovName, value: value }] 
            } as any 
        });
        setNewMainCovName('');
        setNewMainCovValue('');
    };

    const handleSave = () => {
        // Validation
        if(!tempPlanData.planName || !tempPlanData.price) {
            alert('กรุณากรอกชื่อแผนและราคา');
            return;
        }
        
        // Ensure object is fully typed
        const finalPlan = {
            ...tempPlanData,
            createdAt: tempPlanData.createdAt || new Date().toISOString(),
        } as InsurancePlan;
        
        onSave(finalPlan);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onCancel}>
            <div 
                className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()} // Stop click from closing modal
            >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-800">แก้ไขแผนประกัน</h3>
                        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <div className="flex border-b border-slate-100">
                        {['basic','coverage','cars','preview'].map(t => (
                            <button type="button" key={t} onClick={()=>setPlanEditTab(t as any)} className={`flex-1 py-3 text-sm font-bold uppercase transition ${planEditTab===t?'border-b-2 border-blue-600 text-blue-600 bg-blue-50':'text-slate-400 hover:bg-slate-50'}`}>
                                {{basic:'ข้อมูลพื้นฐาน', coverage:'ความคุ้มครอง', cars:'รุ่นรถที่รับ', preview:'ตัวอย่าง'}[t]}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                        {planEditTab === 'basic' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">ชื่อแผน</label><input className="w-full p-3 border rounded-xl" value={tempPlanData.planName || ''} onChange={e=>setTempPlanData({...tempPlanData, planName:e.target.value})}/></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">บริษัท</label><select className="w-full p-3 border rounded-xl" value={tempPlanData.companyId || ''} onChange={e=>setTempPlanData({...tempPlanData, companyId:e.target.value})}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 uppercase">ประเภทประกัน</label><select className="w-full p-3 border rounded-xl" value={tempPlanData.type || PlanType.CLASS_1} onChange={e=>setTempPlanData({...tempPlanData, type:e.target.value as any})}>{Object.values(PlanType).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase">เบี้ยประกัน (บาท/ปี)</label><input type="number" className="w-full p-3 border rounded-xl font-bold text-blue-600" value={tempPlanData.price || 0} onChange={e=>setTempPlanData({...tempPlanData, price:parseInt(e.target.value)||0})}/></div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Wrench size={12}/> ประเภทการซ่อม (Repair Type)</label>
                                        <select 
                                            className="w-full p-3 border rounded-xl bg-white"
                                            value={tempPlanData.details?.repairType || 'GARAGE'}
                                            onChange={e => setTempPlanData({
                                                ...tempPlanData,
                                                details: { ...tempPlanData.details!, repairType: e.target.value as 'MALL' | 'GARAGE' }
                                            })}
                                        >
                                            <option value="GARAGE">ซ่อมอู่มาตรฐาน (Garage)</option>
                                            <option value="MALL">ซ่อมห้าง/ศูนย์ (Mall/Dealer)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border mt-6">
                                        <input type="checkbox" checked={tempPlanData.isHotDeal || false} onChange={e=>setTempPlanData({...tempPlanData, isHotDeal:e.target.checked})} className="w-5 h-5"/>
                                        <label className="font-bold text-red-500 flex items-center gap-1"><Sparkles size={16}/> Hot Deal (โปรโมชั่นแรง)</label>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border">
                                    <select value={tempPlanData.status || 'ACTIVE'} onChange={e=>setTempPlanData({...tempPlanData, status:e.target.value as any})} className="p-2 border rounded-lg text-sm font-bold">
                                        <option value="ACTIVE">เปิดขาย</option>
                                        <option value="INACTIVE">ปิดชั่วคราว</option>
                                        <option value="PENDING">รออนุมัติ</option>
                                    </select>
                                    <span className="text-xs text-slate-400">สถานะแผน</span>
                                </div>
                            </div>
                        )}

                        {planEditTab === 'coverage' && (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-blue-700 mb-4 flex items-center gap-2"><Shield size={18}/> ความคุ้มครองหลักอื่นๆ (Custom Main Coverage)</h4>
                                    
                                    <div className="space-y-3">
                                        {/* Main Coverages List */}
                                        {tempPlanData.details?.mainCustomCoverages?.map((s, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-blue-50 p-2 rounded-lg border border-blue-100">
                                                <div className="flex-1 font-bold text-sm text-blue-900">{s.name}</div>
                                                <div className="text-sm text-blue-700 font-bold">{s.value.toLocaleString()} บาท/หน่วย</div>
                                                <button type="button" onClick={()=>{
                                                    const newCov = [...(tempPlanData.details?.mainCustomCoverages||[])];
                                                    newCov.splice(idx, 1);
                                                    setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, mainCustomCoverages:newCov}});
                                                }} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash size={14}/></button>
                                            </div>
                                        ))}

                                        {/* Add New Main Coverage */}
                                        <div className="flex gap-2 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">ชื่อความคุ้มครองหลัก</label>
                                                <input 
                                                    placeholder="เช่น คุ้มครองภัยก่อการร้าย" 
                                                    value={newMainCovName} 
                                                    onChange={e=>setNewMainCovName(e.target.value)} 
                                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">ราคา/วงเงิน</label>
                                                <input 
                                                    placeholder="0" 
                                                    type="number" 
                                                    value={newMainCovValue} 
                                                    onChange={e=>setNewMainCovValue(e.target.value)} 
                                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                                                />
                                            </div>
                                            <button type="button" onClick={handleAddMainCoverage} className="bg-slate-700 text-white px-3 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-slate-900 transition h-[42px] flex items-center gap-1">
                                                <Plus size={16}/> เพิ่ม
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-purple-700 mb-4 flex items-center gap-2"><Shield size={18}/> ความรับผิดชอบต่อรถยนต์ เสียหาย สูญหาย ไฟไหม้</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className="text-xs text-slate-400 font-bold">ความเสียหายต่อรถยนต์ (ทุนประกัน)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.sumInsured || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, sumInsured:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">ความเสียหายส่วนแรก</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.deductible || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, deductible:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">รถยนต์สูญหาย/ไฟไหม้</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.fireTheft || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, fireTheft:parseInt(e.target.value)||0}})}/></div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-indigo-700 mb-4 flex items-center gap-2"><UserIcon size={18}/> ความรับผิดชอบต่อบุคคลภายนอก</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className="text-xs text-slate-400 font-bold">ความเสียหายต่อทรัพย์สิน (ต่อครั้ง)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.thirdPartyProperty || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, thirdPartyProperty:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">บาดเจ็บ/เสียชีวิต (ต่อคน)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.thirdPartyPerson || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, thirdPartyPerson:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">บาดเจ็บ/เสียชีวิต (ต่อครั้ง)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.thirdPartyTime || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, thirdPartyTime:parseInt(e.target.value)||0}})}/></div>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-pink-700 mb-4 flex items-center gap-2"><Activity size={18}/> ความคุ้มครองต่อบุคคลสูงสุด</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div><label className="text-xs text-slate-400 font-bold">เสียชีวิต (ผู้ขับขี่)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.paDriver || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, paDriver:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">เสียชีวิต (ผู้โดยสาร)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.paPassenger || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, paPassenger:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">ค่ารักษาพยาบาล (ต่อคน)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.medicalExp || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, medicalExp:parseInt(e.target.value)||0}})}/></div>
                                        <div><label className="text-xs text-slate-400 font-bold">การประกันตัวผู้ขับขี่ (ต่อครั้ง)</label><input type="number" className="w-full p-2 border rounded-lg" value={tempPlanData.details?.bailBond || 0} onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, bailBond:parseInt(e.target.value)||0}})}/></div>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Plus size={18}/> สิทธิพิเศษ/ความคุ้มครองเพิ่มเติม (Privileges)</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        {/* Flood Coverage */}
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">คุ้มครองน้ำท่วม</label>
                                            {(tempPlanData.details?.floodCoverage || 0) > 0 ? (
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input 
                                                            type="number" 
                                                            className="w-full p-2 pr-8 border rounded-lg font-bold text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none" 
                                                            value={tempPlanData.details?.floodCoverage || 0} 
                                                            onChange={e=>setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, floodCoverage:parseInt(e.target.value)||0}})}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">บาท</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setTempPlanData({...tempPlanData, details: {...tempPlanData.details!, floodCoverage: 0}})} 
                                                        className="bg-red-100 text-red-500 p-2 rounded-lg hover:bg-red-200 transition border border-red-200"
                                                        title="ลบออก"
                                                    >
                                                        <Trash size={18}/>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    onClick={() => setTempPlanData({...tempPlanData, details: {...tempPlanData.details!, floodCoverage: 100000}})} 
                                                    className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-500 font-bold text-sm transition flex items-center justify-center gap-1"
                                                >
                                                    <Plus size={14}/> เพิ่มความคุ้มครองน้ำท่วม
                                                </button>
                                            )}
                                        </div>

                                        {/* Emergency Service */}
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">บริการช่วยเหลือฉุกเฉิน</label>
                                            {tempPlanData.details?.emergencyService ? (
                                                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-green-200 text-green-700 shadow-sm h-[42px]">
                                                    <div className="flex items-center gap-2 px-2">
                                                        <CheckCircle size={18}/>
                                                        <span className="font-bold text-sm">รวมบริการ 24 ชม.</span>
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => setTempPlanData({...tempPlanData, details: {...tempPlanData.details!, emergencyService: false}})} 
                                                        className="bg-red-100 text-red-500 p-1.5 rounded-lg hover:bg-red-200 transition border border-red-200"
                                                        title="ลบออก"
                                                    >
                                                        <Trash size={16}/>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    type="button"
                                                    onClick={() => setTempPlanData({...tempPlanData, details: {...tempPlanData.details!, emergencyService: true}})}
                                                    className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-blue-400 hover:text-blue-500 font-bold text-sm transition flex items-center justify-center gap-1"
                                                >
                                                    <Plus size={14}/> เพิ่มบริการช่วยเหลือฉุกเฉิน
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label className="text-xs text-slate-400 font-bold block">รายการเพิ่มเติมอื่นๆ</label>
                                        
                                        {/* Existing Additional Coverages (Structured) */}
                                        {tempPlanData.details?.additionalCoverages?.map((s, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-green-50 p-2 rounded-lg border border-green-200">
                                                <div className="flex-1 font-bold text-sm text-green-900">{s.name}</div>
                                                {s.price > 0 && <div className="text-sm text-green-700 font-bold">+{s.price.toLocaleString()} บาท</div>}
                                                <button type="button" onClick={()=>{
                                                    const newCov = [...(tempPlanData.details?.additionalCoverages||[])];
                                                    newCov.splice(idx, 1);
                                                    setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, additionalCoverages:newCov}});
                                                }} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash size={14}/></button>
                                            </div>
                                        ))}

                                        {/* Legacy otherServices (ReadOnly/Migrate manually) */}
                                        {tempPlanData.details?.otherServices?.map((s, idx) => (
                                            <div key={`legacy-${idx}`} className="flex gap-2 items-center opacity-70">
                                                <input disabled value={s} className="flex-1 p-2 bg-slate-100 border rounded-lg text-sm"/>
                                                <button type="button" onClick={()=>{
                                                    const newSv = [...(tempPlanData.details?.otherServices||[])];
                                                    newSv.splice(idx, 1);
                                                    setTempPlanData({...tempPlanData, details:{...tempPlanData.details!, otherServices:newSv}});
                                                }} className="text-red-500 text-xs">ลบ</button>
                                            </div>
                                        ))}

                                        {/* Add New (Structured with Price) */}
                                        <div className="flex gap-2 items-end bg-green-50 p-3 rounded-xl border border-green-100">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-bold text-green-700 uppercase mb-1 block">ชื่อสิทธิพิเศษ/บริการเสริม</label>
                                                <input 
                                                    placeholder="ชื่อบริการ (เช่น รถยกฟรี)" 
                                                    value={newService} 
                                                    onChange={e=>setNewService(e.target.value)} 
                                                    className="w-full p-2 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="text-[10px] font-bold text-green-700 uppercase mb-1 block">ราคา (บาท)</label>
                                                <input 
                                                    placeholder="0" 
                                                    type="number" 
                                                    value={newServicePrice} 
                                                    onChange={e=>setNewServicePrice(e.target.value)} 
                                                    className="w-full p-2 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-400 outline-none"
                                                />
                                            </div>
                                            <button type="button" onClick={handleAddCoverage} className="bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-green-700 transition h-[42px] flex items-center gap-1">
                                                <Plus size={16}/> เพิ่ม
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {planEditTab === 'cars' && (
                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-slate-700 mb-4">เงื่อนไขรถที่รับประกัน (Targeting)</h4>
                                    <div className="space-y-3 p-3 bg-slate-50 rounded-xl mb-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <select 
                                                className="p-2 border rounded-lg bg-white" 
                                                value={newCriteria.makeId} 
                                                onChange={e=>setNewCriteria({...newCriteria, makeId:e.target.value, modelId:'', subModels:[]})}
                                            >
                                                <option value="">-- เลือกยี่ห้อ --</option>
                                                {makes && makes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                            <select 
                                                className="p-2 border rounded-lg bg-white" 
                                                value={newCriteria.modelId} 
                                                onChange={e=>setNewCriteria({...newCriteria, modelId:e.target.value, subModels:[]})} 
                                                disabled={!newCriteria.makeId}
                                            >
                                                <option value="">-- ทุกรุ่น (All Models) --</option>
                                                {newCriteria.makeId && models && models.filter(m=>m.makeId===newCriteria.makeId).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                                            </select>
                                        </div>
                                        
                                        {newCriteria.modelId && (
                                            <div className="bg-white p-3 rounded-lg border">
                                                <label className="text-xs font-bold text-slate-400 block mb-2">เลือกรุ่นย่อย (เฉพาะบางรุ่น)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {models.find(m=>m.id===newCriteria.modelId)?.subModels.map(sub => (
                                                        <button type="button" key={sub} onClick={()=>{
                                                            const current = newCriteria.subModels.includes(sub) 
                                                                ? newCriteria.subModels.filter(x=>x!==sub) 
                                                                : [...newCriteria.subModels, sub];
                                                            setNewCriteria({...newCriteria, subModels:current});
                                                        }} className={`px-2 py-1 text-xs rounded-md border ${newCriteria.subModels.includes(sub)?'bg-blue-600 text-white border-blue-600':'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                            {sub}
                                                        </button>
                                                    ))}
                                                    {models.find(m=>m.id===newCriteria.modelId)?.subModels.length === 0 && <span className="text-xs text-slate-400">ไม่มีข้อมูลรุ่นย่อย</span>}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <input placeholder="ปีรถขั้นต่ำ (เช่น 2018)" type="number" className="flex-1 p-2 border rounded-lg" value={newCriteria.minYear} onChange={e=>setNewCriteria({...newCriteria, minYear:e.target.value})}/>
                                            <span>-</span>
                                            <input placeholder="ปีรถสูงสุด (เช่น 2024)" type="number" className="flex-1 p-2 border rounded-lg" value={newCriteria.maxYear} onChange={e=>setNewCriteria({...newCriteria, maxYear:e.target.value})}/>
                                        </div>
                                        <button type="button" onClick={addCriteria} className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-black">+ เพิ่มเงื่อนไข</button>
                                    </div>

                                    <div className="space-y-2">
                                        {tempPlanData.applicableCars?.map((c, idx) => {
                                            const mName = makes?.find(m=>m.id===c.carMakeId)?.name || 'Unknown Make';
                                            const moName = models?.find(mo=>mo.id===c.carModelId)?.name || 'ทุกรุ่น';
                                            return (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-white border border-blue-100 rounded-xl shadow-sm">
                                                    <div>
                                                        <div className="font-bold text-slate-800">{mName} {moName}</div>
                                                        <div className="text-xs text-slate-500">ปี {c.yearMin} - {c.yearMax} {c.subModels?.length ? `• ${c.subModels.join(', ')}` : ''}</div>
                                                    </div>
                                                    <button type="button" onClick={()=>{
                                                        const n = [...(tempPlanData.applicableCars||[])];
                                                        n.splice(idx, 1);
                                                        setTempPlanData({...tempPlanData, applicableCars:n});
                                                    }} className="text-red-500 bg-red-50 p-2 rounded-lg"><Trash size={14}/></button>
                                                </div>
                                            )
                                        })}
                                        {(!tempPlanData.applicableCars || tempPlanData.applicableCars.length === 0) && (
                                            <div className="text-center text-slate-400 py-4 border-2 border-dashed rounded-xl">ยังไม่ได้กำหนดเงื่อนไขรถ (จะแสดงผลกับรถทุกคัน)</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {planEditTab === 'preview' && (
                            <div className="flex justify-center items-start py-8">
                                <div className="w-full max-w-sm">
                                    <PlanCard 
                                        plan={tempPlanData as InsurancePlan} 
                                        company={companies.find(c=>c.id===tempPlanData.companyId)}
                                        onBuy={()=>{}}
                                        onShowDetails={()=>{}}
                                        otherPlansCount={0}
                                        isSelected={false}
                                        onToggleCompare={()=>{}}
                                        onShowMoreCompanyPlans={()=>{}}
                                        isFilteredView={false}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                        <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100">ยกเลิก</button>
                        <button type="button" onClick={handleSave} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg hover:bg-blue-700">บันทึกแผนประกัน</button>
                    </div>
            </div>
        </div>
    );
};
