
import { db, parseRow } from './db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
        try {
            const rs = await db.execute('SELECT * FROM leads ORDER BY createdAt DESC');
            res.status(200).json(rs.rows.map(parseRow));
        } catch (dbError) {
             if (dbError.message && (dbError.message.includes('no such table') || dbError.message.includes('SQLITE_ERROR'))) {
                return res.status(200).json([]);
            }
            throw dbError;
        }
    } else if (req.method === 'POST') {
        const { action, lead, id } = req.body;
        
        if (action === 'SAVE') {
             await db.execute({
                sql: `INSERT OR REPLACE INTO leads 
                      (id, agentId, customerName, contactInfo, query, carDetails, status, createdAt, updatedAt, notes, chatHistory) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    lead.id, lead.agentId || null, lead.customerName, lead.contactInfo, lead.query, lead.carDetails, lead.status,
                    lead.createdAt, lead.updatedAt || new Date().toISOString(), lead.notes || '',
                    JSON.stringify(lead.chatHistory || [])
                ]
            });
        } else if (action === 'DELETE') {
            await db.execute({ sql: 'DELETE FROM leads WHERE id = ?', args: [id] });
        }
        res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
