
import { db } from './db.js';

// SEED DATA
const SEED_DATA = {
    users: [
        { id: 'u1', username: 'admin', role: 'ADMIN', name: 'Super Admin', status: 'ACTIVE' },
        { id: 'u2', username: 'agent', role: 'AGENT', name: 'Agent Smith', status: 'ACTIVE' }
    ],
    companies: [
        { id: 'c1', name: 'วิริยะประกันภัย', logoUrl: 'https://upload.wikimedia.org/wikipedia/th/thumb/1/1a/Viriyah_Insurance_Logo.svg/1200px-Viriyah_Insurance_Logo.svg.png', color: '#F59E0B' },
        { id: 'c2', name: 'กรุงเทพประกันภัย', logoUrl: 'https://upload.wikimedia.org/wikipedia/th/2/23/BKI_LOGO.png', color: '#1E3A8A' },
        { id: 'c3', name: 'เมืองไทยประกันภัย', logoUrl: 'https://www.muangthaiinsurance.com/upload/logo/logo_mti.png', color: '#BE185D' },
    ],
    makes: [
        { id: 'm1', name: 'Toyota', logoUrl: 'https://global.toyota/pages/global_toyota/mobility/toyota-brand/emblem_ogp_001.png' },
        { id: 'm2', name: 'Honda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Honda.svg/2560px-Honda.svg.png' },
        { id: 'm3', name: 'Mazda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Mazda_logo_with_emblem.svg/1024px-Mazda_logo_with_emblem.svg.png' },
        { id: 'm4', name: 'Isuzu', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Isuzu_Motors_Logo.svg/2560px-Isuzu_Motors_Logo.svg.png' },
        { id: 'm5', name: 'Mitsubishi', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Mitsubishi_logo.svg/1024px-Mitsubishi_logo.svg.png' },
        { id: 'm6', name: 'Nissan', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Nissan_2020_logo.svg/1200px-Nissan_2020_logo.svg.png' },
        { id: 'm7', name: 'Ford', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Ford_Motor_Company_Logo.svg/2560px-Ford_Motor_Company_Logo.svg.png' },
        { id: 'm8', name: 'MG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/MG_Motor_logo.svg/2560px-MG_Motor_logo.svg.png' },
        { id: 'm9', name: 'BMW', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/2048px-BMW.svg.png' },
        { id: 'm10', name: 'Tesla', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' }
    ],
    models: [
        { id: 'mo1', makeId: 'm1', name: 'Yaris', subModels: ['Entry', 'Sport', 'Sport Premium'] },
        { id: 'mo2', makeId: 'm1', name: 'Vios', subModels: ['Entry', 'Mid', 'High'] },
        { id: 'mo3', makeId: 'm1', name: 'Fortuner', subModels: ['Legender', 'Leader'] },
        { id: 'mo4', makeId: 'm2', name: 'Civic', subModels: ['EL', 'EL+', 'RS'] },
        { id: 'mo5', makeId: 'm2', name: 'City', subModels: ['S', 'V', 'SV', 'RS'] },
        { id: 'mo6', makeId: 'm3', name: 'Mazda2', subModels: ['C', 'S', 'SP'] },
        { id: 'mo7', makeId: 'm6', name: 'Almera', subModels: ['E', 'EL', 'V', 'VL'] },
    ],
    kb: [
        { id: 'kb1', question: 'ติดต่อ', answer: 'Line ID: @sisinsure, เบอร์โทร: 090-109-8403', category: 'Contact' },
    ],
    settings: [
        { key: 'safeguard_ai_model', value: 'gemini-2.5-flash' },
        { key: 'theme_gradient', value: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' },
        { key: 'card_style', value: 'vibrant' }
    ],
    plans: [
        {
            id: 'p1', agentId: 'u1', companyId: 'c1', planName: 'Viriyah Save Pack',
            applicableCars: [
                { id: 'v1', carMakeId: 'm1', carModelId: 'mo1', yearMin: 2018, yearMax: 2022 },
                { id: 'v2', carMakeId: 'm1', carModelId: 'mo2', yearMin: 2018, yearMax: 2022 }
            ],
            type: 'ชั้น 1', price: 15500, sumInsured: 650000, deductible: 0, repairType: 'GARAGE',
            emergencyService: true, floodCoverage: 100000,
            searchable_attributes: 'viriyah save pack toyota yaris vios ซ่อมอู่ ไม่มีค่าเสียหายส่วนแรก น้ำท่วม มีรถใช้ระหว่างซ่อม',
            details: JSON.stringify({ 
                sumInsured: 650000, deductible: 0, fireTheft: 650000, repairType: 'GARAGE', 
                thirdPartyProperty: 2500000, thirdPartyPerson: 1000000, thirdPartyTime: 10000000, 
                paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000, 
                emergencyService: true, floodCoverage: 100000, 
                otherServices: ['มีรถใช้ระหว่างซ่อม', 'ช่วยเหลือฉุกเฉิน'], 
                additionalCoverages: [], mainCustomCoverages: [] 
            }),
            status: 'ACTIVE', isHotDeal: 1, createdAt: '2023-10-01T10:00:00Z'
        },
        {
            id: 'p2', agentId: 'u2', companyId: 'c2', planName: 'BKI Special 2+',
            applicableCars: [ { id: 'v3', carMakeId: 'm2', carModelId: 'mo4', yearMin: 2015, yearMax: 2020 } ],
            type: 'ชั้น 2+', price: 8900, sumInsured: 200000, deductible: 0, repairType: 'GARAGE',
            emergencyService: false, floodCoverage: 0,
            searchable_attributes: 'bki special 2+ honda civic ซ่อมอู่',
            details: JSON.stringify({ sumInsured: 200000, deductible: 0, fireTheft: 200000, repairType: 'GARAGE', thirdPartyProperty: 1000000, thirdPartyPerson: 500000, thirdPartyTime: 10000000, paDriver: 100000, paPassenger: 100000, medicalExp: 50000, bailBond: 200000, emergencyService: false, floodCoverage: 0, otherServices: [], additionalCoverages: [], mainCustomCoverages: [] }),
            status: 'ACTIVE', isHotDeal: 0, createdAt: '2023-10-05T12:00:00Z'
        },
        {
            id: 'p3', agentId: 'u2', companyId: 'c3', planName: 'MTI 3+ Budget',
            applicableCars: [ { id: 'v4', carMakeId: 'm1', carModelId: 'mo1', yearMin: 2010, yearMax: 2024 } ],
            type: 'ชั้น 3+', price: 6500, sumInsured: 100000, deductible: 0, repairType: 'GARAGE',
            emergencyService: true, floodCoverage: 0,
            searchable_attributes: 'mti 3+ budget ซ่อมอู่ ล้างรถฟรี',
            details: JSON.stringify({ sumInsured: 100000, deductible: 0, fireTheft: 0, repairType: 'GARAGE', thirdPartyProperty: 1000000, thirdPartyPerson: 500000, thirdPartyTime: 10000000, paDriver: 50000, paPassenger: 50000, medicalExp: 50000, bailBond: 100000, emergencyService: true, floodCoverage: 0, otherServices: ['ล้างรถฟรี 1 ครั้ง'], additionalCoverages: [], mainCustomCoverages: [] }),
            status: 'ACTIVE', isHotDeal: 0, createdAt: '2023-10-26T09:00:00Z'
        },
        {
            id: 'p4', agentId: 'u1', companyId: 'c1', planName: 'Viriyah Gold Mazda 2',
            applicableCars: [ { id: 'v6', carMakeId: 'm3', carModelId: 'mo6', yearMin: 2015, yearMax: 2024 } ],
            type: 'ชั้น 1', price: 18500, sumInsured: 450000, deductible: 0, repairType: 'GARAGE',
            emergencyService: true, floodCoverage: 50000,
            searchable_attributes: 'viriyah gold mazda 2 ซ่อมอู่ บริการรถยกฟรี ช่วยเหลือฉุกเฉิน',
            details: JSON.stringify({ sumInsured: 450000, deductible: 0, fireTheft: 450000, repairType: 'GARAGE', thirdPartyProperty: 2500000, thirdPartyPerson: 1000000, thirdPartyTime: 10000000, paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000, emergencyService: true, floodCoverage: 50000, otherServices: ['บริการรถยกฟรี', 'ช่วยเหลือฉุกเฉิน'], additionalCoverages: [], mainCustomCoverages: [] }),
            status: 'ACTIVE', isHotDeal: 1, createdAt: '2023-10-28T09:00:00Z'
        },
        {
            id: 'p_almera', agentId: 'u1', companyId: 'c1', planName: 'Viriyah Almera Special',
            applicableCars: [ { id: 'v_al', carMakeId: 'm6', carModelId: 'mo7', yearMin: 2015, yearMax: 2024 } ],
            type: 'ชั้น 1', price: 14500, sumInsured: 400000, deductible: 0, repairType: 'GARAGE',
            emergencyService: true, floodCoverage: 50000,
            searchable_attributes: 'viriyah almera special nissan almera นิสสัน อัลเมร่า ซ่อมอู่ มีรถใช้ระหว่างซ่อม',
            details: JSON.stringify({ 
                sumInsured: 400000, deductible: 0, fireTheft: 400000, repairType: 'GARAGE', 
                thirdPartyProperty: 2500000, thirdPartyPerson: 1000000, thirdPartyTime: 10000000, 
                paDriver: 100000, paPassenger: 100000, medicalExp: 100000, bailBond: 200000, 
                emergencyService: true, floodCoverage: 50000, 
                otherServices: ['ช่วยเหลือฉุกเฉิน', 'มีรถใช้ระหว่างซ่อม'], 
                additionalCoverages: [{ name: 'Replacement Car', price: 0 }], 
                mainCustomCoverages: [] 
            }),
            status: 'ACTIVE', isHotDeal: 1, createdAt: '2023-11-05T09:00:00Z'
        }
    ]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { mode } = req.body; // 'SYNC' or 'RESET'
  const isHardReset = mode === 'RESET';
  const logs = [];
  
  try {
    logs.push(`Starting Database Operation: ${isHardReset ? 'FACTORY RESET' : 'SYNC'}`);

    if (isHardReset) {
        logs.push("!!! NUCLEAR OPTION ACTIVATED !!!");
        
        // 1. DROP ALL TABLES (one by one to handle errors gracefully)
        const tables = ['users', 'companies', 'car_makes', 'car_models', 'leads', 'knowledge_base', 'system_settings', 'chat_logs', 'plans', 'plan_kb'];
        for (const t of tables) {
            try {
                await db.execute(`DROP TABLE IF EXISTS ${t}`);
                logs.push(`Table '${t}' DROPPED.`);
            } catch(e) {
                logs.push(`Drop '${t}' warning: ` + e.message);
            }
        }
        
        // Small delay to ensure drops are complete
        await new Promise(r => setTimeout(r, 500));

        // 2. CREATE ALL TABLES
        logs.push("Creating Schemas...");
        
        await db.execute(`
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT,
                role TEXT,
                name TEXT,
                totalSales REAL DEFAULT 0,
                status TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE companies (
                id TEXT PRIMARY KEY,
                name TEXT,
                logoUrl TEXT,
                color TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE car_makes (
                id TEXT PRIMARY KEY,
                name TEXT,
                logoUrl TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE car_models (
                id TEXT PRIMARY KEY,
                makeId TEXT,
                name TEXT,
                subModels TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE leads (
                id TEXT PRIMARY KEY,
                agentId TEXT,
                customerName TEXT,
                contactInfo TEXT,
                query TEXT,
                carDetails TEXT,
                status TEXT,
                createdAt TEXT,
                updatedAt TEXT,
                notes TEXT,
                chatHistory TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE knowledge_base (
                id TEXT PRIMARY KEY,
                question TEXT,
                answer TEXT,
                category TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE system_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE chat_logs (
                id TEXT PRIMARY KEY,
                sessionId TEXT,
                role TEXT,
                message TEXT,
                timestamp TEXT,
                ip TEXT,
                userAgent TEXT,
                deviceInfo TEXT,
                lat REAL,
                lng REAL,
                city TEXT,
                region TEXT,
                isp TEXT,
                referrer TEXT
            )
        `);

        await db.execute(`
            CREATE TABLE plans (
                id TEXT PRIMARY KEY,
                agentId TEXT,
                companyId TEXT,
                planName TEXT,
                type TEXT,
                price REAL,
                status TEXT,
                isHotDeal INTEGER DEFAULT 0,
                createdAt TEXT,
                details TEXT,
                applicableCars TEXT,
                sumInsured REAL DEFAULT 0,
                deductible REAL DEFAULT 0,
                repairType TEXT,
                emergencyService INTEGER DEFAULT 0,
                floodCoverage REAL DEFAULT 0,
                searchable_attributes TEXT
            )
        `);

        // NEW: FULLY COMPREHENSIVE PLAN_KB
        await db.execute(`
            CREATE TABLE plan_kb (
                id TEXT PRIMARY KEY,
                planId TEXT,
                planName TEXT,
                companyName TEXT,
                makeName TEXT,
                modelName TEXT,
                sub_models TEXT,
                yearMin INTEGER,
                yearMax INTEGER,
                price REAL,
                planType TEXT,
                repairType TEXT,
                
                -- Financials / Coverages
                sumInsured REAL,        -- ทุนประกัน
                deductible REAL,        -- ค่าเสียหายส่วนแรก
                fireTheft REAL,         -- สูญหาย/ไฟไหม้
                floodCoverage REAL,     -- น้ำท่วม
                
                -- Liability
                tpProperty REAL,        -- ทรัพย์สินบุคคลภายนอก (ต่อครั้ง)
                tpPerson REAL,          -- บาดเจ็บ/เสียชีวิต (ต่อคน)
                tpTime REAL,            -- บาดเจ็บ/เสียชีวิต (ต่อครั้ง)
                
                -- PA
                paDriver REAL,          -- อุบัติเหตุผู้ขับขี่
                paPassenger REAL,       -- อุบัติเหตุผู้โดยสาร
                medicalExp REAL,        -- ค่ารักษาพยาบาล
                bailBond REAL,          -- ประกันตัวผู้ขับขี่
                
                -- Features
                emergencyService INTEGER, -- 1=Yes, 0=No
                coverage_features TEXT,   -- Text blob for "Replacement Car", "Free Wash", etc.
                
                FOREIGN KEY(planId) REFERENCES plans(id)
            )
        `);
        
        logs.push("All tables CREATED (including comprehensive plan_kb).");

        // 3. SEED DATA - Use batch for better performance
        logs.push("Seeding FRESH data...");

        // Prepare all insert statements
        const statements = [];

        // Users
        for(const u of SEED_DATA.users) {
            statements.push({
                sql: 'INSERT INTO users (id, username, role, name, status) VALUES (?,?,?,?,?)',
                args: [u.id, u.username, u.role, u.name, u.status]
            });
        }

        // Companies
        for(const c of SEED_DATA.companies) {
            statements.push({
                sql: 'INSERT INTO companies (id, name, logoUrl, color) VALUES (?,?,?,?)',
                args: [c.id, c.name, c.logoUrl, c.color]
            });
        }

        // Makes
        for(const m of SEED_DATA.makes) {
            statements.push({
                sql: 'INSERT INTO car_makes (id, name, logoUrl) VALUES (?,?,?)',
                args: [m.id, m.name, m.logoUrl]
            });
        }

        // Models
        for(const mo of SEED_DATA.models) {
            statements.push({
                sql: 'INSERT INTO car_models (id, makeId, name, subModels) VALUES (?,?,?,?)',
                args: [mo.id, mo.makeId, mo.name, JSON.stringify(mo.subModels)]
            });
        }

        // KB
        for(const k of SEED_DATA.kb) {
            statements.push({
                sql: 'INSERT INTO knowledge_base (id, question, answer, category) VALUES (?,?,?,?)',
                args: [k.id, k.question, k.answer, k.category]
            });
        }

        // Settings
        for(const s of SEED_DATA.settings) {
            statements.push({
                sql: 'INSERT INTO system_settings (key, value) VALUES (?,?)',
                args: [s.key, s.value]
            });
        }

        // Plans
        for (const r of SEED_DATA.plans) {
            const applicableCarsString = typeof r.applicableCars === 'string' ? r.applicableCars : JSON.stringify(r.applicableCars);
            
            statements.push({
                sql: `INSERT INTO plans (
                    id, agentId, companyId, planName, type, price, status, isHotDeal, createdAt, details, 
                    applicableCars, sumInsured, deductible, repairType, emergencyService, floodCoverage, searchable_attributes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    r.id, r.agentId, r.companyId, r.planName, r.type, r.price, r.status, r.isHotDeal, r.createdAt, r.details,
                    applicableCarsString, r.sumInsured, r.deductible, r.repairType, r.emergencyService, r.floodCoverage, r.searchable_attributes
                ]
            });

            // Populate Comprehensive KB
            if (r.applicableCars && Array.isArray(r.applicableCars)) {
                let details = {};
                try { details = JSON.parse(r.details); } catch(e) {}
                const companyName = SEED_DATA.companies.find(c => c.id === r.companyId)?.name || 'Unknown';
                
                const features = [
                    ...(details.otherServices || []),
                    ...(details.additionalCoverages?.map(c => c.name) || []),
                    ...(details.mainCustomCoverages?.map(c => c.name) || [])
                ].join(', ');

                for (const criteria of r.applicableCars) {
                    const makeObj = SEED_DATA.makes.find(m => m.id === criteria.carMakeId);
                    const modelObj = SEED_DATA.models.find(m => m.id === criteria.carModelId);
                    
                    const kbId = `${r.id}_${criteria.id || Date.now()}_${Math.random()}`;

                    statements.push({
                        sql: `INSERT INTO plan_kb (
                            id, planId, planName, companyName, makeName, modelName, sub_models, yearMin, yearMax, price, planType, repairType,
                            sumInsured, deductible, fireTheft, floodCoverage,
                            tpProperty, tpPerson, tpTime,
                            paDriver, paPassenger, medicalExp, bailBond,
                            emergencyService, coverage_features
                        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                        args: [
                            kbId, r.id, r.planName, companyName,
                            makeObj ? makeObj.name : '', 
                            modelObj ? modelObj.name : 'ALL', 
                            JSON.stringify(criteria.subModels || []),
                            criteria.yearMin, criteria.yearMax,
                            r.price, r.type, r.repairType,
                            
                            details.sumInsured || 0,
                            details.deductible || 0,
                            details.fireTheft || 0,
                            details.floodCoverage || 0,
                            
                            details.thirdPartyProperty || 0,
                            details.thirdPartyPerson || 0,
                            details.thirdPartyTime || 0,
                            
                            details.paDriver || 0,
                            details.paPassenger || 0,
                            details.medicalExp || 0,
                            details.bailBond || 0,
                            
                            details.emergencyService ? 1 : 0,
                            features
                        ]
                    });
                }
            }
        }

        // Execute all statements in batches (Turso has limits)
        const batchSize = 50;
        for (let i = 0; i < statements.length; i += batchSize) {
            const batch = statements.slice(i, i + batchSize);
            try {
                await db.batch(batch);
                logs.push(`Batch ${Math.floor(i / batchSize) + 1} inserted (${batch.length} statements)`);
            } catch (e) {
                logs.push(`Batch ${Math.floor(i / batchSize) + 1} error: ${e.message}`);
                throw e;
            }
        }

        logs.push(`Seeding Completed.`);

    } else {
        logs.push("Soft Sync: No changes performed to avoid data loss on partial sync request.");
    }

    res.status(200).json({ message: "Database Operation Complete", logs });

  } catch (error) {
    console.error("Setup Handler Error:", error);
    res.status(500).json({ error: error.message, logs });
  }
}
