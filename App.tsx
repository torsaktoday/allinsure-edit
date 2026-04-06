import React, { useState, useEffect } from 'react';
import { User, Company, CarMake, CarModel, InsurancePlan, Lead, KnowledgeBaseItem, UserRole, SystemSetting } from './types';
import { api } from './services/api';
import { Lock, X, Shield, Loader2 } from 'lucide-react';
import { AdminSystem } from './components/admin/AdminSystem';
import { ChatSystem } from './components/client/ChatSystem';

const CACHE_KEY = 'safeguard_master_data';
const ADMIN_SESSION_KEY = 'safeguard_admin_session';

const App: React.FC = () => {
    // --- Global Data State ---
    const [users, setUsers] = useState<User[]>([]);
    const [plans, setPlans] = useState<InsurancePlan[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [makes, setMakes] = useState<CarMake[]>([]);
    const [models, setModels] = useState<CarModel[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [kb, setKb] = useState<KnowledgeBaseItem[]>([]);
    const [settings, setSettings] = useState<SystemSetting[]>([]);

    // --- App State ---
    const [isInitializing, setIsInitializing] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    // --- Initialization ---
    useEffect(() => {
        const startUp = async () => {
            // 1. Restore Admin Session from localStorage
            const savedSession = localStorage.getItem(ADMIN_SESSION_KEY);
            if (savedSession) {
                try {
                    const user = JSON.parse(savedSession);
                    setCurrentUser(user);
                } catch (e) {
                    console.error("Session restore error", e);
                }
            }

            // 2. Instant Load from Cache
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    setUsers(data.users || []);
                    setCompanies(data.companies || []);
                    setMakes(data.makes || []);
                    setModels(data.models || []);
                    setKb(data.kb || []);
                    setSettings(data.settings || []);
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
            
            // UNBLOCK UI IMMEDIATELY
            // We set initializing to false immediately so the user sees the app (skeletons/cache)
            // while we fetch fresh data in the background.
            setIsInitializing(false);

            // 3. Fetch Fresh Data (Background)
            await fetchFreshData();
        };

        startUp();
    }, []);

    const fetchFreshData = async () => {
        try {
            // Fetch all data in parallel
            const [masterData, plansData, leadsData] = await Promise.all([
                api.getMasterData(),
                api.getPlans(),
                api.getLeads()
            ]);

            // Update State with Fresh Data
            if (masterData) {
                setUsers(masterData.users || []);
                setCompanies(masterData.companies || []);
                setMakes(masterData.makes || []);
                setModels(masterData.models || []);
                setKb(masterData.kb || []);
                setSettings(masterData.settings || []);
                
                // Update Cache
                localStorage.setItem(CACHE_KEY, JSON.stringify(masterData));
            }
            if (plansData) setPlans(plansData);
            if (leadsData) setLeads(leadsData);

            // Preload Background Image (Non-blocking)
            const bgUrl = masterData?.settings?.find((s: SystemSetting) => s.key === 'home_bg_url')?.value;
            if (bgUrl) {
                const img = new Image();
                img.src = bgUrl;
            }

        } catch (e) {
            console.error("Data Fetch Failed:", e);
        }
    };

    const handleLogin = () => {
        if ((adminUsername === 'admin' || adminUsername === 'agent') && adminPassword === 'sis1234') {
            const role = adminUsername === 'admin' ? UserRole.ADMIN : UserRole.AGENT;
            const user = { id: adminUsername, username: adminUsername, role: role, name: role === UserRole.ADMIN ? 'Super Admin' : 'Agent', status: 'ACTIVE' };
            setCurrentUser(user);
            // Save session to localStorage
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
            setShowAdminLogin(false);
        } else {
            alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        // Remove session from localStorage
        localStorage.removeItem(ADMIN_SESSION_KEY);
        fetchFreshData(); // Refresh to ensure latest settings are applied
    };

    // --- Loading Screen (Only shown if very first load fails/slow) ---
    // Since we unblock immediately, this might flicker briefly or not at all.
    if (isInitializing) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 animate-pulse"></div>
                <div className="z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl mb-6 animate-bounce">
                        <Shield size={40} className="text-white" strokeWidth={2.5} />
                    </div>
                </div>
            </div>
        );
    }

    // --- Main Render ---
    return (
        <div className="h-screen w-full overflow-hidden">
            {currentUser ? (
                // ADMIN VIEW
                <AdminSystem 
                    currentUser={currentUser} 
                    onLogout={handleLogout}
                    masterData={{ users, companies, makes, models, kb, plans, leads, settings }}
                    refreshData={fetchFreshData}
                />
            ) : (
                // CLIENT VIEW
                <ChatSystem 
                    masterData={{ companies, makes, models, kb, plans }} 
                    settings={settings}
                    onAdminLoginClick={() => setShowAdminLogin(true)}
                />
            )}

            {/* Admin Login Modal (Global) */}
            {showAdminLogin && !currentUser && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative animate-scale-up">
                        <button onClick={() => setShowAdminLogin(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={24} />
                        </button>
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบเจ้าหน้าที่</h2>
                            <p className="text-slate-500 mt-2">สำหรับผู้ดูแลระบบและตัวแทนฝ่ายขาย</p>
                        </div>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Username"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                                value={adminUsername}
                                onChange={(e) => setAdminUsername(e.target.value)}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                            />
                            <button
                                onClick={handleLogin}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg mt-2"
                            >
                                เข้าสู่ระบบ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;