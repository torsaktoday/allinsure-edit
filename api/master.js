
import { db, parseRow } from './db.js';

// Auto-seed data (Embedded for robustness)
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
    ],
    kb: [
        { id: 'kb1', question: 'ติดต่อ', answer: 'Line ID: @sisinsure, เบอร์โทร: 090-109-8403', category: 'Contact' },
    ],
    settings: [
        { key: 'safeguard_ai_model', value: 'gemini-2.5-flash' },
        { key: 'theme_gradient', value: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)' },
        { key: 'card_style', value: 'vibrant' }
    ]
};

async function seedInitialData() {
    try {
        const userCount = await db.execute('SELECT count(*) as count FROM users');
        if (userCount.rows[0].count === 0) {
            console.log("Database empty. Seeding data...");
            for(const u of SEED_DATA.users) await db.execute({ sql: 'INSERT INTO users (id, username, role, name, status) VALUES (?,?,?,?,?)', args: [u.id, u.username, u.role, u.name, u.status]});
            for(const c of SEED_DATA.companies) await db.execute({ sql: 'INSERT INTO companies (id, name, logoUrl, color) VALUES (?,?,?,?)', args: [c.id, c.name, c.logoUrl, c.color]});
            for(const m of SEED_DATA.makes) await db.execute({ sql: 'INSERT INTO car_makes (id, name, logoUrl) VALUES (?,?,?)', args: [m.id, m.name, m.logoUrl]});
            for(const mo of SEED_DATA.models) await db.execute({ sql: 'INSERT INTO car_models (id, makeId, name, subModels) VALUES (?,?,?,?)', args: [mo.id, mo.makeId, mo.name, JSON.stringify(mo.subModels)]});
            for(const k of SEED_DATA.kb) await db.execute({ sql: 'INSERT INTO knowledge_base (id, question, answer, category) VALUES (?,?,?,?)', args: [k.id, k.question, k.answer, k.category]});
            for(const s of SEED_DATA.settings) await db.execute({ sql: 'INSERT INTO system_settings (key, value) VALUES (?,?)', args: [s.key, s.value]});
            console.log("Seeding complete.");
        }
    } catch (e) {
        // This might fail if another process is creating the schema. That's okay.
        console.warn("Seeding check failed, likely due to concurrent setup. Error:", e.message);
    }
}


export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
        const safeFetch = async (query) => {
            try {
                const result = await db.execute(query);
                return result.rows.map(parseRow);
            } catch (e) {
                 // If a table doesn't exist yet, return an empty array instead of crashing.
                 // The manual sync will create it.
                if(e.message && e.message.includes('no such table')) {
                    return [];
                }
                // Re-throw other errors
                throw e;
            }
        };

        const [users, companies, makes, models, kb, settings] = await Promise.all([
            safeFetch('SELECT * FROM users'),
            safeFetch('SELECT * FROM companies'),
            safeFetch('SELECT * FROM car_makes'),
            safeFetch('SELECT * FROM car_models'),
            safeFetch('SELECT * FROM knowledge_base'),
            safeFetch('SELECT * FROM system_settings')
        ]);
        
        // Attempt to seed data if users table is empty
        if(users.length === 0) {
            await seedInitialData();
        }

        res.status(200).json({
            users,
            companies,
            makes,
            models,
            kb,
            settings
        });

    } else if (req.method === 'POST') {
        const { type, action, data } = req.body;
        
        console.log(`Processing Master Data: ${type} - ${action}`, data);

        try {
            if (action === 'CREATE' || action === 'UPDATE') {
                if (type === 'USER') {
                    await db.execute({
                        sql: 'INSERT OR REPLACE INTO users (id, username, role, name, totalSales, status) VALUES (?, ?, ?, ?, ?, ?)',
                        args: [data.id, data.username, data.role, data.name, data.totalSales || 0, data.status]
                    });
                } else if (type === 'COMPANY') {
                    await db.execute({
                        sql: 'INSERT OR REPLACE INTO companies (id, name, logoUrl, color) VALUES (?, ?, ?, ?)',
                        args: [data.id, data.name, data.logoUrl, data.color || '#000000']
                    });
                } else if (type === 'MAKE') {
                    await db.execute({
                        sql: 'INSERT OR REPLACE INTO car_makes (id, name, logoUrl) VALUES (?, ?, ?)',
                        args: [data.id, data.name, data.logoUrl]
                    });
                } else if (type === 'MODEL') {
                     await db.execute({
                        sql: 'INSERT OR REPLACE INTO car_models (id, makeId, name, subModels) VALUES (?, ?, ?, ?)',
                        args: [data.id, data.makeId, data.name, JSON.stringify(data.subModels || [])]
                    });
                } else if (type === 'KB') {
                     await db.execute({
                        sql: 'INSERT OR REPLACE INTO knowledge_base (id, question, answer, category) VALUES (?, ?, ?, ?)',
                        args: [data.id, data.question, data.answer, data.category || 'General']
                    });
                } else if (type === 'SETTING') {
                     await db.execute({
                        sql: 'INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)',
                        args: [data.key, data.value]
                    });
                }
            } else if (action === 'DELETE') {
                 const tableMap = { 'USER': 'users', 'COMPANY': 'companies', 'MAKE': 'car_makes', 'MODEL': 'car_models', 'KB': 'knowledge_base', 'SETTING': 'system_settings' };
                 if (tableMap[type]) {
                    await db.execute({ sql: `DELETE FROM ${tableMap[type]} WHERE id = ?`, args: [data] });
                 }
            }
            res.status(200).json({ success: true });
        } catch (dbError) {
             console.error("DB Execution Error:", dbError);
             throw dbError; 
        }
    }
  } catch (error) {
    console.error("Master API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
