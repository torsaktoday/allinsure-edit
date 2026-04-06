
import { db } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send();
  
  const { users, companies, makes, models, plans, leads, kb, settings } = req.body;
  
  try {
    const tx = await db.transaction('write');
    
    // Users
    for(const u of users) {
         await tx.execute({
            sql: 'INSERT OR REPLACE INTO users (id, username, role, name, totalSales, status) VALUES (?, ?, ?, ?, ?, ?)',
            args: [u.id, u.username, u.role, u.name, u.totalSales || 0, u.status]
         });
    }
    // Companies
    for(const c of companies) {
         await tx.execute({
            sql: 'INSERT OR REPLACE INTO companies (id, name, logoUrl, color) VALUES (?, ?, ?, ?)',
            args: [c.id, c.name, c.logoUrl, c.color]
         });
    }
    // Makes
    for(const m of makes) {
         await tx.execute({
            sql: 'INSERT OR REPLACE INTO car_makes (id, name, logoUrl) VALUES (?, ?, ?)',
            args: [m.id, m.name, m.logoUrl]
         });
    }
    // Models
    for(const m of models) {
         await tx.execute({
            sql: 'INSERT OR REPLACE INTO car_models (id, makeId, name, subModels) VALUES (?, ?, ?, ?)',
            args: [m.id, m.makeId, m.name, JSON.stringify(m.subModels)]
         });
    }
    // Plans
    for(const p of plans) {
         await tx.execute({
            sql: `INSERT OR REPLACE INTO plans 
                  (id, agentId, companyId, planName, type, price, status, isHotDeal, createdAt, details, applicableCars) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                p.id, p.agentId, p.companyId, p.planName, p.type, p.price, p.status, 
                p.isHotDeal ? 1 : 0, p.createdAt, 
                JSON.stringify(p.details), JSON.stringify(p.applicableCars)
            ]
        });
    }
    // Leads
    for(const l of leads) {
         await tx.execute({
            sql: `INSERT OR REPLACE INTO leads 
                  (id, agentId, customerName, contactInfo, query, carDetails, status, createdAt, updatedAt, notes, chatHistory) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                l.id, l.agentId || null, l.customerName, l.contactInfo, l.query, l.carDetails, l.status,
                l.createdAt, l.updatedAt || new Date().toISOString(), l.notes || '',
                JSON.stringify(l.chatHistory || [])
            ]
        });
    }
    // KB
    if (kb && Array.isArray(kb)) {
        for(const k of kb) {
             await tx.execute({
                sql: 'INSERT OR REPLACE INTO knowledge_base (id, question, answer, category) VALUES (?, ?, ?, ?)',
                args: [k.id, k.question, k.answer, k.category || 'General']
            });
        }
    }

    // Settings
    if (settings && Array.isArray(settings)) {
        for(const s of settings) {
             await tx.execute({
                sql: 'INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)',
                args: [s.key, s.value]
            });
        }
    }

    await tx.commit();
    res.status(200).json({ success: true });
  } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
  }
}
