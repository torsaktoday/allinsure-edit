import React, { useState, useEffect } from 'react';
import { User, UserRole, Lead, InsurancePlan, Company, CarMake, CarModel, KnowledgeBaseItem, SystemSetting, ChatLog } from '../../types';
import { LayoutDashboard, User as UserIcon, FileText, Briefcase, Car, HelpCircle, Settings, LogOut, Activity, Server, Cpu, Edit, Trash, Eye, X, Palette, Image as ImageIcon, Sparkles, MessageSquare, Menu, RefreshCw, AlertTriangle, Trash2, Database, Search, Download, MapPin, Globe, Wifi, Link as LinkIcon, Shield, FileText as FileTextIcon, Zap, Bot, User as UserCircle } from 'lucide-react';
import { api } from '../../services/api';
import { checkGeminiConnection } from '../../services/geminiService';
import { PlanEditorModal } from './PlanEditorModal';

interface AdminSystemProps {
    currentUser: User;
    onLogout: () => void;
    masterData: {
        users: User[];
        companies: Company[];
        makes: CarMake[];
        models: CarModel[];
        kb: KnowledgeBaseItem[];
        plans: InsurancePlan[];
        leads: Lead[];
        settings: SystemSetting[];
    };
    refreshData: () => Promise<void> | void;
    onSwitchToChat?: () => void; // NEW: Switch back to chat
}

export const AdminSystem: React.FC<AdminSystemProps> = ({ currentUser, onLogout, masterData, refreshData, onSwitchToChat }) => {
    const [activeAdminTab, setActiveAdminTab] = useState<'dashboard'|'leads'|'plans'|'companies'|'cars'|'kb'|'settings'|'ui'|'logs'>('dashboard');
    const [systemStatus, setSystemStatus] = useState({ db: 'รอตรวจสอบ', api: 'รอตรวจสอบ' });
    const [isSyncing, setIsSyncing] = useState(false);
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');
    const [customKey, setCustomKey] = useState('');

    // UI Customization State
    const [bgUrl, setBgUrl] = useState('');
    const [themeGradient, setThemeGradient] = useState('');
    const [cardStyle, setCardStyle] = useState('vibrant');
    const [isSavingUI, setIsSavingUI] = useState(false);

    // Logs State
    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

    // Plan Search State
    const [planSearchQuery, setPlanSearchQuery] = useState('');

    // Modals
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [showCarModal, setShowCarModal] = useState(false);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showKBModal, setShowKBModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showLeadDetailModal, setShowLeadDetailModal] = useState(false);
    const [showLogDetailModal, setShowLogDetailModal] = useState(false);
    
    // Edit States
    const [tempData, setTempData] = useState<any>({});
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);

    // Mobile Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        refreshSystemStatus();

        // Load Settings from DB
        const dbModel = masterData.settings.find(s => s.key === 'safeguard_ai_model')?.value;
        const dbKey = masterData.settings.find(s => s.key === 'safeguard_custom_api_key')?.value; // Load API Key from DB
        const bg = masterData.settings.find(s => s.key === 'home_bg_url')?.value;
        const th = masterData.settings.find(s => s.key === 'theme_gradient')?.value;
        const cs = masterData.settings.find(s => s.key === 'card_style')?.value;

        // Model Logic: DB > Local
        if (dbModel) {
            setAiModel(dbModel);
            localStorage.setItem('safeguard_ai_model', dbModel); // Sync to local
        } else {
            const savedModel = localStorage.getItem('safeguard_ai_model');
            if (savedModel) setAiModel(savedModel);
        }

        if (dbKey) {
            setCustomKey(dbKey);
        }

        setBgUrl(bg || 'https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2940&auto=format&fit=crop');
        setThemeGradient(th || 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)');
        setCardStyle(cs || 'vibrant');
    }, [masterData.settings]);

    useEffect(() => {
        if (activeAdminTab === 'logs') {
            api.getChatLogs().then(setChatLogs).catch(err => console.error("Fetch logs failed", err));
        }
    }, [activeAdminTab]);

    const refreshSystemStatus = async () => {
        setSystemStatus(prev => ({ ...prev, db: 'กำลังตรวจสอบ...', api: 'กำลังตรวจสอบ...' }));
        try {
            await api.getMasterData();
            setSystemStatus(prev => ({ ...prev, db: 'เชื่อมต่อแล้ว' }));
        } catch {
            setSystemStatus(prev => ({ ...prev, db: 'ไม่พบการเชื่อมต่อ' }));
        }
        
        // Pass the current custom key (from state) to check connection
        const apiOk = await checkGeminiConnection(aiModel, customKey);
        setSystemStatus(prev => ({ ...prev, api: apiOk ? 'เชื่อมต่อแล้ว' : 'ขัดข้อง (ตรวจสอบ Key)' }));
    };
    
    const handleSyncDatabase = async (mode: 'SYNC' | 'RESET') => {
        const msg = mode === 'RESET' 
            ? '⚠️ คำเตือน: "Factory Reset" จะลบข้อมูลแผนประกันทั้งหมดและสร้างข้อมูลจำลองใหม่\n\nยืนยันการล้างข้อมูลหรือไม่?'
            : 'ยืนยันการซิงค์และอัปเดตฐานข้อมูล? \nขั้นตอนนี้ปลอดภัยและจะทำการเพิ่มตาราง/คอลัมน์ที่ขาดหายไปเท่านั้น';
            
        if (!confirm(msg)) return;

        setIsSyncing(true);
        try {
            const result = await api.syncDatabase(mode);
            console.log('Sync Logs:', result.logs);
            alert(mode === 'RESET' ? 'ล้างระบบและสร้างฐานข้อมูลใหม่สำเร็จ!' : 'ซิงค์ฐานข้อมูลสำเร็จ!');
            await refreshData();
        } catch (e: any) {
            console.error('Sync failed:', e);
            alert('เกิดข้อผิดพลาด: ' + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReindexKB = async () => {
        if (!confirm('ยืนยันการสร้าง Index ใหม่สำหรับ Plan KB? \n(ช่วยแก้ปัญหาค้นหาไม่เจอ)')) return;
        setIsSyncing(true);
        try {
            // Call API with action REINDEX
            await fetch('/api/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REINDEX' })
            });
            alert('Re-index ข้อมูลลง Plan KB สำเร็จ!');
            await refreshData();
        } catch (e: any) {
             alert('เกิดข้อผิดพลาด: ' + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDelete = async (type: 'COMPANY'|'MAKE'|'MODEL'|'KB'|'PLAN', id: string) => {
        if(!confirm('ยืนยันการลบข้อมูล?')) return;
        try {
            if(type === 'PLAN') await api.deletePlan(id);
            else await api.updateMasterData(type as any, 'DELETE', id);
            await refreshData();
        } catch (e: any) {
            alert('เกิดข้อผิดพลาด: ' + e.message);
        }
    };
    
    const handleLogAction = async (action: 'DELETE'|'CLEAR_ALL', id?: string) => {
        const confirmMsg = action === 'CLEAR_ALL' ? '⚠️ ยืนยันการลบประวัติแชท "ทั้งหมด" ?' : 'ยืนยันการลบ Log นี้?';
        if (!confirm(confirmMsg)) return;
        
        try {
            await fetch('/api/chat_logs', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    action: 'DELETE', 
                    id: action === 'CLEAR_ALL' ? 'ALL' : id 
                })
            });
            
            // Refresh logs
            const newLogs = await api.getChatLogs();
            setChatLogs(newLogs);
            if (showLogDetailModal) setShowLogDetailModal(false);
            
        } catch (e) {
            alert('Failed: ' + e);
        }
    };

    const handleSave = async (type: 'COMPANY'|'MAKE'|'MODEL'|'KB'|'PLAN'|'SETTING', data: any) => {
        try {
            if(type === 'PLAN') await api.savePlan(data);
            else await api.updateMasterData(type, 'CREATE', data);
            
            await refreshData();
            setTempData({});
            setShowCompanyModal(false); setShowCarModal(false); setShowKBModal(false); setShowPlanModal(false); setShowModelModal(false);
            alert('บันทึกข้อมูลสำเร็จ');
        } catch (e: any) {
            console.error(e);
            alert('บันทึกไม่สำเร็จ: ' + e.message);
        }
    };

    const saveUISettings = async () => {
        setIsSavingUI(true);
        try {
            // Run sequentially to prevent SQLite locking/race conditions
            await api.updateMasterData('SETTING', 'CREATE', { key: 'home_bg_url', value: bgUrl });
            await api.updateMasterData('SETTING', 'CREATE', { key: 'theme_gradient', value: themeGradient });
            await api.updateMasterData('SETTING', 'CREATE', { key: 'card_style', value: cardStyle });
            
            await refreshData();
            alert('บันทึกการตั้งค่าหน้าเว็บเรียบร้อยแล้ว');
        } catch (e) {
            console.error("Failed to save UI settings:", e);
            alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
        } finally {
            setIsSavingUI(false);
        }
    };

    const handleSaveApiKey = async () => {
        try {
            await api.updateMasterData('SETTING', 'CREATE', { key: 'safeguard_custom_api_key', value: customKey });
            await refreshData();
            refreshSystemStatus(); // Check connection with new key
            alert('บันทึก API Key ลงฐานข้อมูลแล้ว');
        } catch (e: any) {
            alert('บันทึกไม่สำเร็จ: ' + e.message);
        }
    };

    const handleDeleteApiKey = async () => {
        if(!confirm('ยืนยันการลบ API Key?')) return;
        try {
             // We use 'CREATE' with empty string or handle DELETE logic for setting if supported. 
             // Currently UPDATE/CREATE is upsert.
            await api.updateMasterData('SETTING', 'CREATE', { key: 'safeguard_custom_api_key', value: '' });
            setCustomKey('');
            await refreshData();
            refreshSystemStatus();
            alert('ลบ API Key แล้ว');
        } catch (e: any) {
            alert('ลบไม่สำเร็จ: ' + e.message);
        }
    };

    // Filter Logic for Plans
    const filteredPlans = masterData.plans.filter(p => {
        if (!planSearchQuery.trim()) return true;
        
        const q = planSearchQuery.toLowerCase();
        const qNum = q.replace(/,/g, ''); // Handle numbers like 800,000 -> 800000
        const companyName = masterData.companies.find(c => c.id === p.companyId)?.name.toLowerCase() || '';
        
        // Search in Name, Price, Company, Type, or Searchable Attributes (Computed on server)
        return (
            p.planName.toLowerCase().includes(q) ||
            p.price.toString().includes(qNum) ||
            p.sumInsured.toString().includes(qNum) || // Added Sum Insured Search
            companyName.includes(q) ||
            p.type.toLowerCase().includes(q) ||
            (p.searchable_attributes && p.searchable_attributes.toLowerCase().includes(q))
        );
    });

    const handleExportPlans = () => {
        // Create CSV Content with BOM for UTF-8 Support in Excel
        const headers = ['ชื่อแผน', 'บริษัท', 'ประเภท', 'ราคา', 'ทุนประกัน', 'ประเภทซ่อม', 'รถที่รับประกัน (ตัวอย่าง)'];
        
        const rows = filteredPlans.map(p => {
            const company = masterData.companies.find(c => c.id === p.companyId)?.name || 'Unknown';
            const cars = p.applicableCars?.map(c => {
                 const make = masterData.makes.find(m => m.id === c.carMakeId)?.name || '';
                 const model = masterData.models.find(m => m.id === c.carModelId)?.name || 'All';
                 return `${make} ${model} (${c.yearMin}-${c.yearMax})`;
            }).join('; ') || 'All';
            
            // Escape double quotes by doubling them
            return [
                `"${p.planName.replace(/"/g, '""')}"`,
                `"${company}"`,
                `"${p.type}"`,
                p.price,
                p.sumInsured,
                `"${p.repairType === 'MALL' ? 'ห้าง/ศูนย์' : 'อู่'}"`,
                `"${cars.replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `InsurancePlans_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openLeadDetails = (lead: Lead) => {
        setSelectedLead(lead);
        setShowLeadDetailModal(true);
    };

    const isSuperAdmin = currentUser.role === UserRole.ADMIN;
    const menuItems = [
        {id:'dashboard', icon:Activity, label:'ภาพรวม', allowed: true},
        {id:'leads', icon:UserIcon, label:'ผู้สนใจ (Leads)', allowed: true},
        {id:'plans', icon:FileText, label:'แผนประกัน', allowed: true},
        {id:'companies', icon:Briefcase, label:'บริษัทประกัน', allowed: isSuperAdmin},
        {id:'cars', icon:Car, label:'ข้อมูลรถ', allowed: isSuperAdmin},
        {id:'kb', icon:HelpCircle, label:'คลังความรู้ (KB)', allowed: isSuperAdmin},
        {id:'logs', icon:MessageSquare, label:'ประวัติการแชท', allowed: isSuperAdmin},
        {id:'ui', icon:Palette, label:'ตกแต่งร้านค้า', allowed: isSuperAdmin},
        {id:'settings', icon:Settings, label:'ตั้งค่าระบบ', allowed: true},
    ].filter(item => item.allowed);

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
            
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-30 flex items-center px-4 justify-between shadow-md">
                <button onClick={onSwitchToChat} className="font-bold text-lg flex items-center gap-2 hover:opacity-80 transition">
                    <LayoutDashboard className="text-white"/> SafeGuard
                </button>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
                    {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                    <div className="p-6 font-bold text-xl items-center gap-2 border-b border-slate-800 bg-gradient-to-r from-blue-600 to-blue-800 hidden md:flex justify-between">
                        <button onClick={onSwitchToChat} className="flex items-center gap-2 hover:opacity-80 transition">
                            <LayoutDashboard className="text-white"/> SafeGuard
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{currentUser.role}</span>
                        </button>
                    </div>
                    {/* Mobile Only Header inside Sidebar (optional space filler or User Info) */}
                    <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-blue-600 to-blue-800 md:hidden mt-16">
                         <div className="font-bold text-lg">{currentUser.name}</div>
                         <div className="text-xs opacity-70">{currentUser.role}</div>
                    </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {menuItems.map(item => (
                        <button key={item.id} onClick={()=>{setActiveAdminTab(item.id as any); setIsSidebarOpen(false);}} className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${activeAdminTab===item.id?'bg-blue-600 text-white shadow-lg shadow-blue-900/50':'hover:bg-slate-800 text-slate-300'}`}>
                            <item.icon size={18}/> {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition text-sm font-bold flex items-center justify-center gap-2"><LogOut size={14}/> ออกจากระบบ</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full">
                {activeAdminTab === 'dashboard' && (
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold text-slate-800 mb-6">ภาพรวมระบบ</h1>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div onClick={()=>setActiveAdminTab('leads')} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2"><div className="p-3 bg-blue-100 rounded-xl text-blue-600"><UserIcon size={24}/></div><span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-lg">Active</span></div>
                                <div className="text-3xl font-bold text-slate-800">{masterData.leads.length}</div>
                                <div className="text-slate-500 text-sm">ผู้สนใจทั้งหมด</div>
                            </div>
                            <div onClick={()=>setActiveAdminTab('plans')} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2"><div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><FileText size={24}/></div></div>
                                <div className="text-3xl font-bold text-slate-800">{masterData.plans.length}</div>
                                <div className="text-slate-500 text-sm">แผนประกันที่ขาย</div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2"><div className={`p-3 rounded-xl ${systemStatus.db === 'เชื่อมต่อแล้ว' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}><Server size={24}/></div></div>
                                <div className={`text-xl font-bold ${systemStatus.db === 'เชื่อมต่อแล้ว' ? 'text-green-600' : 'text-red-500'}`}>{systemStatus.db}</div>
                                <div className="text-slate-500 text-sm">สถานะฐานข้อมูล</div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-2"><div className={`p-3 rounded-xl ${systemStatus.api === 'เชื่อมต่อแล้ว' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}><Cpu size={24}/></div></div>
                                <div className={`text-xl font-bold ${systemStatus.api === 'เชื่อมต่อแล้ว' ? 'text-green-600' : 'text-red-500'}`}>{systemStatus.api}</div>
                                <div className="text-slate-500 text-sm">สถานะ AI API</div>
                            </div>
                        </div>

                        {/* System Maintenance Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings className="text-slate-500"/> System Maintenance</h2>
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg text-amber-800">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="mt-1 text-amber-500 shrink-0"/>
                                    <div>
                                        <h3 className="font-bold">จัดการฐานข้อมูล (Database Management)</h3>
                                        <p className="text-sm mt-1 mb-3">หากการค้นหาไม่แม่นยำ กรุณากดปุ่มเพื่อซิงค์ข้อมูล หรือ Re-index เพื่อปรับปรุงระบบ Plan KB</p>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            {/* Sync Button */}
                                            <button 
                                                onClick={() => handleSyncDatabase('SYNC')}
                                                disabled={isSyncing}
                                                className="bg-amber-500 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                {isSyncing ? <RefreshCw size={16} className="animate-spin"/> : <RefreshCw size={16}/>}
                                                {isSyncing ? 'กำลังทำงาน...' : 'Sync Structure'}
                                            </button>

                                            {/* Re-index KB Button */}
                                            <button 
                                                onClick={handleReindexKB}
                                                disabled={isSyncing}
                                                className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Database size={16}/> สร้าง/Re-index Plan KB
                                            </button>

                                            {/* Hard Reset Button */}
                                            <button 
                                                onClick={() => handleSyncDatabase('RESET')}
                                                disabled={isSyncing}
                                                className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Trash2 size={16}/> Factory Reset (ล้างระบบใหม่)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeAdminTab === 'leads' && (
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold text-slate-800">ผู้สนใจ (Leads)</h1>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="p-4">ชื่อลูกค้า</th><th className="p-4">เบอร์โทร</th><th className="p-4">ความสนใจ</th><th className="p-4">สถานะ</th><th className="p-4">วันที่</th><th className="p-4">จัดการ</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {masterData.leads.map(l => (
                                        <tr key={l.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-800">{l.customerName}</td>
                                            <td className="p-4 text-slate-600">{l.contactInfo}</td>
                                            <td className="p-4 text-slate-600 truncate max-w-xs">{l.query}</td>
                                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${l.status==='NEW'?'bg-blue-100 text-blue-600':'bg-gray-100 text-gray-600'}`}>{l.status}</span></td>
                                            <td className="p-4 text-slate-400">{new Date(l.createdAt).toLocaleDateString('th-TH')}</td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={()=>openLeadDetails(l)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="ดูรายละเอียด"><Eye size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {activeAdminTab === 'logs' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-slate-800">ประวัติการแชท (Logs)</h1>
                            <div className="flex gap-2">
                                <button onClick={()=>handleLogAction('CLEAR_ALL')} className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200">
                                    <Trash2 size={14}/> ลบทั้งหมด
                                </button>
                                <button onClick={()=>api.getChatLogs().then(setChatLogs)} className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                                    <RefreshCw size={14}/> รีเฟรช
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4">เวลา</th>
                                            <th className="p-4">IP Address (Click)</th>
                                            <th className="p-4">Role</th>
                                            <th className="p-4 w-1/3 min-w-[200px]">ข้อความ</th>
                                            <th className="p-4">Device</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {chatLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-slate-50">
                                                <td className="p-4 text-slate-500 text-xs">{new Date(log.timestamp).toLocaleString('th-TH')}</td>
                                                <td className="p-4">
                                                    <button 
                                                        onClick={() => { setSelectedLog(log); setShowLogDetailModal(true); }}
                                                        className="text-blue-600 font-bold font-mono text-xs hover:underline flex items-center gap-1"
                                                    >
                                                        {log.ip || '-'}
                                                        {log.city && <span className="text-[10px] text-slate-400 no-underline ml-1">({log.city})</span>}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                                        log.role === 'user' ? 'bg-blue-100 text-blue-700' : 
                                                        log.role === 'AI' ? 'bg-purple-100 text-purple-700' : 
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {log.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-700 font-medium truncate max-w-xs" title={log.message}>{log.message}</td>
                                                <td className="p-4 text-slate-500 text-xs">{log.deviceInfo || 'Unknown'}</td>
                                                <td className="p-4">
                                                    <button onClick={()=>handleLogAction('DELETE', log.id)} className="text-red-400 hover:text-red-600 p-1">
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {chatLogs.length === 0 && (
                                            <tr><td colSpan={6} className="text-center p-10 text-slate-400">ยังไม่มีประวัติการแชท</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeAdminTab === 'plans' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-slate-800">จัดการแผนประกัน</h1><button onClick={()=>{setEditingPlan(null); setShowPlanModal(true)}} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">เพิ่มแผน</button></div>
                            
                            {/* Search & Export Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-2 mb-2 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="ค้นหาแผน, บริษัท, รุ่นรถ, ราคา, ทุนประกัน..." 
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-slate-700"
                                        value={planSearchQuery}
                                        onChange={(e) => setPlanSearchQuery(e.target.value)}
                                    />
                                    {planSearchQuery && (
                                        <button onClick={() => setPlanSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                                            <X size={16}/>
                                        </button>
                                    )}
                                </div>
                                <button 
                                    onClick={handleExportPlans} 
                                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-sm hover:bg-green-700 transition"
                                >
                                    <Download size={18} /> Export Excel
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
                                {filteredPlans.length > 0 ? (
                                    filteredPlans.map(p => (
                                        <div key={p.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-12 h-12 shrink-0 border rounded-lg p-1 bg-white flex items-center justify-center">
                                                    <img src={masterData.companies.find(c=>c.id===p.companyId)?.logoUrl} className="max-w-full max-h-full object-contain"/>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-slate-800 truncate pr-2">{p.planName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                                                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{p.type}</span>
                                                        <span className="font-bold text-blue-600">฿{p.price.toLocaleString()}</span>
                                                        <span className="text-slate-500">• ทุน {p.sumInsured.toLocaleString()}</span>
                                                        <span className="text-slate-400 hidden sm:inline">• {p.applicableCars?.length || 0} เงื่อนไขรถ</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 self-end md:self-auto shrink-0">
                                                <button onClick={()=>{setEditingPlan(p); setShowPlanModal(true)}} className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition"><Edit size={16}/></button>
                                                <button onClick={()=>handleDelete('PLAN', p.id)} className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition"><Trash size={16}/></button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Search size={24} className="text-slate-300"/>
                                        </div>
                                        <div>ไม่พบแผนประกันที่ตรงกับคำค้นหา</div>
                                        <button onClick={() => setPlanSearchQuery('')} className="text-blue-600 text-sm font-bold hover:underline">ล้างคำค้นหา</button>
                                    </div>
                                )}
                            </div>
                        </div>
                )}
                
                {activeAdminTab === 'companies' && (
                    <div className="space-y-4">
                            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-slate-800">บริษัทประกัน</h1><button onClick={()=>{setTempData({id:Date.now().toString()}); setShowCompanyModal(true)}} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">เพิ่มบริษัท</button></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {masterData.companies.map(c => (
                                <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center gap-3 relative group">
                                    <img src={c.logoUrl} className="h-16 object-contain"/>
                                    <span className="font-bold text-slate-800 text-center">{c.name}</span>
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={()=>{setTempData(c); setShowCompanyModal(true)}} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit size={14}/></button>
                                        <button onClick={()=>handleDelete('COMPANY', c.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash size={14}/></button>
                                    </div>
                                </div>
                            ))}
                            </div>
                    </div>
                )}

                {activeAdminTab === 'cars' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-slate-800">ข้อมูลรถยนต์</h1>
                            <div className="flex gap-2">
                                <button onClick={()=>{setTempData({id:Date.now().toString()}); setShowCarModal(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">เพิ่มยี่ห้อ</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {masterData.makes.map(m => (
                                <div key={m.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src={m.logoUrl} className="w-10 h-10 object-contain"/>
                                            <span className="font-bold text-lg">{m.name}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={()=>{setTempData(m); setShowCarModal(true)}} className="p-1.5 text-blue-500"><Edit size={16}/></button>
                                            <button onClick={()=>handleDelete('MAKE', m.id)} className="p-1.5 text-red-500"><Trash size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                                        {masterData.models.filter(mo=>mo.makeId===m.id).map(mo => (
                                            <div key={mo.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg group">
                                                <span>{mo.name} <span className="text-slate-400 text-xs">({mo.subModels.length} รุ่นย่อย)</span></span>
                                                <div className="opacity-100 md:opacity-0 group-hover:opacity-100 flex gap-1">
                                                    <button onClick={()=>{setTempData({...mo}); setShowModelModal(true)}} className="text-blue-500"><Edit size={14}/></button>
                                                    <button onClick={()=>handleDelete('MODEL', mo.id)} className="text-red-500"><Trash size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={()=>{setTempData({id:Date.now().toString(), makeId:m.id, subModels:[]}); setShowModelModal(true)}} className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-blue-500 hover:bg-slate-50 rounded-lg border border-dashed border-slate-200">+ เพิ่มรุ่นรถ</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeAdminTab === 'kb' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-slate-800">คลังความรู้ (KB)</h1><button onClick={()=>{setTempData({id:Date.now().toString()}); setShowKBModal(true)}} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">เพิ่มข้อมูล</button></div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><tr><th className="p-4">คำถาม / Keyword</th><th className="p-4">คำตอบ</th><th className="p-4">หมวดหมู่</th><th className="p-4">จัดการ</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {masterData.kb.map(k => (
                                        <tr key={k.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-800">{k.question}</td>
                                            <td className="p-4 text-slate-600 max-w-xs truncate">{k.answer}</td>
                                            <td className="p-4"><span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-xs font-bold">{k.category}</span></td>
                                            <td className="p-4 flex gap-2">
                                                <button onClick={()=>{setTempData(k); setShowKBModal(true)}} className="p-2 text-blue-500"><Edit size={16}/></button>
                                                <button onClick={()=>handleDelete('KB', k.id)} className="p-2 text-red-500"><Trash size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeAdminTab === 'ui' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2"><Palette size={32} className="text-purple-600"/> ตกแต่งร้านค้า</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700 flex items-center gap-2"><ImageIcon size={18}/> พื้นหลังหน้าแรก (URL)</label>
                                    <input type="text" value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" placeholder="https://..."/>
                                    <p className="text-xs text-slate-400">ลิงก์รูปภาพสำหรับพื้นหลังหน้าแรก (แนะนำรูปแนวนอน ความละเอียดสูง)</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700 flex items-center gap-2"><Palette size={18}/> โทนสีหลัก (Gradient)</label>
                                    <select value={themeGradient} onChange={(e) => setThemeGradient(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 font-medium">
                                        <option value="linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)">🔵 ฟ้า-คราม (Default)</option>
                                        <option value="linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)">🟠 ส้ม-พีช (Summer)</option>
                                        <option value="linear-gradient(135deg, #10B981 0%, #3B82F6 100%)">🟢 เขียว-ฟ้า (Nature)</option>
                                        <option value="linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)">🟣 ม่วง-ชมพู (Vibrant)</option>
                                        <option value="linear-gradient(135deg, #1E293B 0%, #334155 100%)">⚫️ ดำ-เทา (Dark Mode)</option>
                                    </select>
                                    <input type="text" value={themeGradient} onChange={e => setThemeGradient(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50 text-xs text-slate-500" placeholder="หรือใส่ CSS Gradient เอง..."/>
                                </div>

                                <div className="space-y-2">
                                    <label className="font-bold text-slate-700 flex items-center gap-2"><Sparkles size={18}/> สไตล์การ์ด (Card Style)</label>
                                    <div className="flex gap-2">
                                        <button onClick={()=>setCardStyle('minimal')} className={`flex-1 py-3 border rounded-xl font-bold ${cardStyle==='minimal'?'bg-slate-800 text-white':'bg-slate-50 text-slate-500'}`}>Minimal (Gray)</button>
                                        <button onClick={()=>setCardStyle('vibrant')} className={`flex-1 py-3 border rounded-xl font-bold ${cardStyle==='vibrant'?'bg-blue-600 text-white':'bg-slate-50 text-slate-500'}`}>Vibrant (Color)</button>
                                    </div>
                                    <p className="text-xs text-slate-400">เลือกสไตล์การแสดงผลของโลโก้และการ์ดต่างๆ บนหน้าแรก</p>
                                </div>

                                <button onClick={saveUISettings} disabled={isSavingUI} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 transition disabled:opacity-50">
                                    {isSavingUI ? 'กำลังบันทึก...' : 'บันทึกการตกแต่ง'}
                                </button>
                            </div>

                            <div className="border rounded-2xl p-4 bg-slate-50">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-4 block">ตัวอย่างการแสดงผล</label>
                                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg group">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgUrl}')` }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
                                    <div className="absolute top-0 w-full p-2 flex justify-between items-center" style={{ background: themeGradient }}>
                                        <div className="text-white font-bold text-xs">AutoShield</div>
                                        <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-center">
                                        <div className="text-white font-bold text-lg mb-2">ตัวอย่างพื้นหลัง</div>
                                        <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center text-white shadow-md" style={{ background: themeGradient }}>
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeAdminTab === 'settings' && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                        <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าระบบ</h1>
                        
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">AI Model</label>
                            <select 
                                value={aiModel} 
                                onChange={async (e) => { 
                                    const val = e.target.value;
                                    setAiModel(val); 
                                    localStorage.setItem('safeguard_ai_model', val);
                                    // SAVE TO DB
                                    await api.updateMasterData('SETTING', 'CREATE', { key: 'safeguard_ai_model', value: val });
                                    refreshData();
                                }} 
                                className="w-full p-3 border rounded-xl bg-slate-50"
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                            </select>
                            <p className="text-xs text-slate-400">เลือกโมเดล AI ที่ต้องการใช้งานสำหรับการตอบแชท (บันทึกลง Database)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="font-bold text-slate-700">Custom API Key</label>
                            <div className="flex gap-2">
                                <input type="password" placeholder="AI Studio API Key" value={customKey} onChange={e=>setCustomKey(e.target.value)} className="flex-1 p-3 border rounded-xl bg-slate-50"/>
                                <button onClick={handleSaveApiKey} className="bg-blue-600 text-white px-4 rounded-xl font-bold">บันทึก</button>
                                <button onClick={handleDeleteApiKey} className="bg-slate-200 text-slate-600 px-4 rounded-xl font-bold">ลบ</button>
                            </div>
                            <p className="text-xs text-slate-400">ใช้ Key ส่วนตัวกรณี Key หลักมีปัญหา (บันทึกใน Database)</p>
                        </div>
                    </div>
                )}
            </main>

            {/* --- Modals for Admin --- */}
            {showPlanModal && (
                <PlanEditorModal 
                    plan={editingPlan}
                    companies={masterData.companies}
                    makes={masterData.makes}
                    models={masterData.models}
                    onCancel={() => setShowPlanModal(false)}
                    onSave={async (plan) => { await handleSave('PLAN', plan); }}
                />
            )}

            {/* Other small modals (Company, Car, KB, Lead Detail) are kept inline for brevity but could be split further if needed */}
             {showCompanyModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                            <h3 className="font-bold text-lg mb-4">{tempData.id ? 'แก้ไขบริษัท' : 'เพิ่มบริษัท'}</h3>
                            <div className="space-y-3">
                                <input className="w-full p-3 border rounded-xl" placeholder="ชื่อบริษัท" value={tempData.name||''} onChange={e=>setTempData({...tempData, name:e.target.value})}/>
                                <input className="w-full p-3 border rounded-xl" placeholder="Logo URL" value={tempData.logoUrl||''} onChange={e=>setTempData({...tempData, logoUrl:e.target.value})}/>
                                <div className="flex gap-2"><button onClick={()=>setShowCompanyModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">ยกเลิก</button><button onClick={()=>handleSave('COMPANY', tempData)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">บันทึก</button></div>
                            </div>
                    </div>
                </div>
            )}
            
            {/* KB Modal */}
            {showKBModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                            <h3 className="font-bold text-lg mb-4">{tempData.id ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล KB'}</h3>
                            <p className="text-xs text-slate-500 mb-2">เคล็ดลับ: ใส่หลาย Keyword คั่นด้วยคอมม่า (,) เช่น: ผ่อน, บัตรเครดิต, แบ่งจ่าย</p>
                            <div className="space-y-3">
                                <input className="w-full p-3 border rounded-xl" placeholder="คำถาม / Keywords (เช่น ผ่อน, บัตรเครดิต)" value={tempData.question||''} onChange={e=>setTempData({...tempData, question:e.target.value})}/>
                                <textarea className="w-full p-3 border rounded-xl h-32" placeholder="คำตอบ" value={tempData.answer||''} onChange={e=>setTempData({...tempData, answer:e.target.value})}/>
                                <input className="w-full p-3 border rounded-xl" placeholder="หมวดหมู่" value={tempData.category||'General'} onChange={e=>setTempData({...tempData, category:e.target.value})}/>
                                <div className="flex gap-2"><button onClick={()=>setShowKBModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">ยกเลิก</button><button onClick={()=>handleSave('KB', tempData)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">บันทึก</button></div>
                            </div>
                    </div>
                </div>
            )}

             {/* Car Modal */}
             {showCarModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                            <h3 className="font-bold text-lg mb-4">{tempData.id ? 'แก้ไขยี่ห้อรถ' : 'เพิ่มยี่ห้อรถ'}</h3>
                            <div className="space-y-3">
                                <input className="w-full p-3 border rounded-xl" placeholder="ยี่ห้อรถ" value={tempData.name||''} onChange={e=>setTempData({...tempData, name:e.target.value})}/>
                                <input className="w-full p-3 border rounded-xl" placeholder="Logo URL" value={tempData.logoUrl||''} onChange={e=>setTempData({...tempData, logoUrl:e.target.value})}/>
                                <div className="flex gap-2"><button onClick={()=>setShowCarModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">ยกเลิก</button><button onClick={()=>handleSave('MAKE', tempData)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">บันทึก</button></div>
                            </div>
                    </div>
                </div>
            )}

            {/* Model Modal */}
            {showModelModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                            <h3 className="font-bold text-lg mb-4">{tempData.id ? 'แก้ไขรุ่นรถ' : 'เพิ่มรุ่นรถ'}</h3>
                            <div className="space-y-3">
                                <select className="w-full p-3 border rounded-xl" value={tempData.makeId||''} onChange={e=>setTempData({...tempData, makeId:e.target.value})}>
                                    <option value="">-- เลือกยี่ห้อ --</option>
                                    {masterData.makes.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <input className="w-full p-3 border rounded-xl" placeholder="ชื่อรุ่น (เช่น City, Civic)" value={tempData.name||''} onChange={e=>setTempData({...tempData, name:e.target.value})}/>
                                
                                <div className="p-3 bg-slate-50 rounded-xl border">
                                    <label className="text-xs font-bold text-slate-400 mb-2 block">รุ่นย่อย (กด Enter เพื่อเพิ่ม)</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {tempData.subModels?.map((s:string, i:number) => (
                                            <span key={i} className="bg-white border px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                                {s} <button onClick={()=>{
                                                    const n = [...tempData.subModels]; n.splice(i,1); setTempData({...tempData, subModels:n});
                                                }}><X size={10}/></button>
                                            </span>
                                        ))}
                                    </div>
                                    <input 
                                        className="w-full p-2 text-sm border rounded-lg" 
                                        placeholder="พิมพ์แล้วกด Enter"
                                        onKeyDown={(e)=>{
                                            if(e.key==='Enter'){
                                                e.preventDefault();
                                                const val = e.currentTarget.value.trim();
                                                if(val) {
                                                    setTempData({...tempData, subModels: [...(tempData.subModels||[]), val]});
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                <div className="flex gap-2"><button onClick={()=>setShowModelModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">ยกเลิก</button><button onClick={()=>handleSave('MODEL', tempData)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold">บันทึก</button></div>
                            </div>
                    </div>
                </div>
            )}

            {/* Lead Detail Modal */}
            {showLeadDetailModal && selectedLead && (
                 <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setShowLeadDetailModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={20}/></button>
                        <h3 className="font-bold text-2xl text-slate-800 mb-6 flex items-center gap-2"><UserIcon size={24} className="text-blue-600"/> รายละเอียดลูกค้า</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <label className="text-xs font-bold text-slate-400 uppercase">ชื่อลูกค้า</label>
                                <div className="font-bold text-lg text-slate-800">{selectedLead.customerName}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <label className="text-xs font-bold text-slate-400 uppercase">เบอร์ติดต่อ</label>
                                <div className="font-bold text-lg text-slate-800">{selectedLead.contactInfo}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl md:col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">สิ่งที่สนใจ / คำค้นหา</label>
                                <div className="font-medium text-slate-700">{selectedLead.query}</div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-64 overflow-y-auto">
                             <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">ประวัติการแชท</label>
                             <div className="space-y-3">
                                {selectedLead.chatHistory?.map((msg, i) => (
                                    <div key={i} className={`flex gap-2 ${msg.role==='user'?'flex-row-reverse':''}`}>
                                        <div className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${msg.role==='user'?'bg-blue-600 text-white':'bg-white border text-slate-600'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {(!selectedLead.chatHistory || selectedLead.chatHistory.length === 0) && <div className="text-center text-slate-400 py-10">ไม่มีประวัติการสนทนา</div>}
                             </div>
                        </div>

                        <div className="mt-6 flex flex-col md:flex-row justify-end gap-3">
                             <select 
                                value={selectedLead.status} 
                                onChange={async (e) => {
                                    const newStatus = e.target.value as any;
                                    await api.saveLead({...selectedLead, status: newStatus});
                                    setSelectedLead({...selectedLead, status: newStatus});
                                    refreshData();
                                }}
                                className="px-4 py-2 border rounded-xl font-bold bg-white"
                             >
                                <option value="NEW">✨ ใหม่</option>
                                <option value="CONTACTED">📞 ติดต่อแล้ว</option>
                                <option value="CLOSED">✅ ปิดการขาย</option>
                                <option value="LOST">❌ ไม่สนใจ</option>
                             </select>
                             <div className="flex gap-3">
                                <button onClick={()=>handleDelete('LEAD' as any, selectedLead.id)} className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100">ลบข้อมูล</button>
                                <button onClick={()=>setShowLeadDetailModal(false)} className="flex-1 md:flex-none px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-black">ปิด</button>
                             </div>
                        </div>
                    </div>
                 </div>
            )}
            
            {/* Detailed LOG Modal (Full Width) */}
            {showLogDetailModal && selectedLog && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white z-10">
                            <h3 className="font-bold text-2xl text-slate-800 flex items-center gap-2">
                                <Activity size={28} className="text-blue-600"/> รายละเอียด Log
                                <span className="text-sm font-normal text-slate-400 ml-2">Session: {selectedLog.sessionId}</span>
                            </h3>
                            <button onClick={()=>setShowLogDetailModal(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200 transition">
                                <X size={24} className="text-slate-500"/>
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row h-full overflow-hidden">
                            {/* Left Panel: Conversation History */}
                            <div className="flex-1 bg-slate-50 overflow-y-auto p-6 border-r border-slate-200">
                                <div className="space-y-6">
                                    <div className="text-center">
                                         <span className="bg-slate-200 text-slate-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                            เริ่มการสนทนา {new Date(selectedLog.timestamp).toLocaleDateString('th-TH')}
                                         </span>
                                    </div>
                                    
                                    {chatLogs
                                        .filter(l => l.sessionId === selectedLog.sessionId)
                                        // Sort chronological
                                        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                        .map((log, i) => {
                                            const isUser = log.role === 'user';
                                            const isAppEngine = log.role === 'AppEngine';
                                            
                                            // Safe Parse MetaData
                                            let meta: any = null;
                                            if (typeof log.metaData === 'string') {
                                                try { meta = JSON.parse(log.metaData); } catch(e){}
                                            } else {
                                                meta = log.metaData;
                                            }

                                            return (
                                                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                                                    <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                                                        
                                                        {/* Responder Badge */}
                                                        <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isUser ? 'text-slate-400' : (isAppEngine ? 'text-orange-500' : 'text-purple-500')}`}>
                                                            {isUser ? <UserCircle size={12}/> : (isAppEngine ? <Zap size={12}/> : <Bot size={12}/>)}
                                                            {isUser ? 'User' : (isAppEngine ? 'App Engine' : 'AI (Gemini)')}
                                                            <span className="text-slate-300 font-normal ml-1">
                                                                {new Date(log.timestamp).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>

                                                        {/* Message Bubble */}
                                                        <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                                                            isUser 
                                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                                                        }`}>
                                                            {log.message}
                                                        </div>

                                                        {/* Visual MetaData Rendering */}
                                                        {meta && (
                                                            <div className="mt-2 space-y-2 w-full">
                                                                
                                                                {/* 1. Plans Display (Visual Cards) */}
                                                                {meta.attachedPlans && meta.attachedPlans.length > 0 && (
                                                                    <div className="bg-blue-50/50 border border-blue-100 p-2 rounded-xl">
                                                                         <div className="text-[10px] font-bold text-blue-600 mb-2 flex items-center gap-1 uppercase tracking-wide px-1">
                                                                             <Shield size={10}/> Attached Plans ({meta.attachedPlans.length})
                                                                         </div>
                                                                         <div className="space-y-2">
                                                                             {meta.attachedPlans.map((p:any, idx:number) => {
                                                                                 // Find company logo
                                                                                 const company = masterData.companies.find(c => c.id === p.companyId);
                                                                                 return (
                                                                                     <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-3 shadow-sm hover:shadow-md transition">
                                                                                         <div className="w-10 h-10 rounded-lg border border-slate-100 bg-white p-1 flex items-center justify-center shrink-0">
                                                                                            {company ? <img src={company.logoUrl} className="w-full h-full object-contain"/> : <Shield size={16} className="text-blue-300"/>}
                                                                                         </div>
                                                                                         <div className="min-w-0 flex-1">
                                                                                            <div className="font-bold text-slate-800 text-xs truncate">{p.planName}</div>
                                                                                            <div className="text-blue-600 font-bold text-xs">{p.price?.toLocaleString()} บ./ปี</div>
                                                                                         </div>
                                                                                     </div>
                                                                                 );
                                                                             })}
                                                                         </div>
                                                                    </div>
                                                                )}

                                                                {/* 2. Brand Selection Grid */}
                                                                {meta.inputType === 'select-brand' && (
                                                                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                                                                        <div className="text-xs font-bold text-slate-500 mb-2">แสดงรายการเลือกยี่ห้อรถ</div>
                                                                        <div className="grid grid-cols-4 gap-2">
                                                                            {masterData.makes.map(m => (
                                                                                <div key={m.id} className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center gap-1">
                                                                                    <img src={m.logoUrl} className="w-5 h-5 object-contain"/>
                                                                                    <span className="text-[8px] font-bold text-slate-500 truncate w-full">{m.name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* 3. Contact Form / Options */}
                                                                {meta.inputType === 'contact-options' && (
                                                                     <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex flex-col gap-2">
                                                                         <div className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                                                            <FileTextIcon size={12}/> แสดงฟอร์มติดต่อ/Line
                                                                         </div>
                                                                         {meta.options && meta.options.map((opt:string, idx:number) => (
                                                                             <div key={idx} className="text-[10px] bg-white px-2 py-1 rounded border border-orange-100 text-slate-500">
                                                                                 {opt}
                                                                             </div>
                                                                         ))}
                                                                     </div>
                                                                )}

                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                    <div className="h-10"></div> {/* Spacer */}
                                </div>
                            </div>

                            {/* Right Panel: Technical Details */}
                            <div className="w-full md:w-80 bg-white p-6 border-l border-slate-200 overflow-y-auto shrink-0">
                                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Cpu size={18}/> ข้อมูลเชิงเทคนิค</h4>
                                
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">IP Address</label>
                                        <div className="font-mono text-sm font-bold text-slate-700">{selectedLog.ip}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Globe size={10}/> {selectedLog.isp || 'Unknown ISP'}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Location</label>
                                        <div className="text-sm font-bold text-slate-700 flex items-center gap-1">
                                            <MapPin size={14} className="text-red-500"/> 
                                            {selectedLog.city || 'Unknown'}, {selectedLog.region || ''}
                                        </div>
                                        {selectedLog.lat && selectedLog.lng && (
                                            <a 
                                                href={`https://www.google.com/maps/search/?api=1&query=${selectedLog.lat},${selectedLog.lng}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="mt-2 text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                                            >
                                                ดูแผนที่ <LinkIcon size={10}/>
                                            </a>
                                        )}
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Source</label>
                                        <div className="text-sm font-bold text-slate-700 truncate" title={selectedLog.referrer}>
                                            {selectedLog.referrer === 'Direct' ? 'Direct Access' : selectedLog.referrer || 'Unknown'}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Device</label>
                                        <div className="text-xs text-slate-600 break-words">{selectedLog.userAgent}</div>
                                    </div>

                                    <button 
                                        onClick={()=>handleLogAction('DELETE', selectedLog.id)} 
                                        className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center gap-2 transition"
                                    >
                                        <Trash2 size={16}/> ลบ Log นี้
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};