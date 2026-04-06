

import { db, parseRow } from './db.js';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            try {
                // AUTO-MIGRATION CHECK: Ensure new columns exist
                // We check if 'lat' column exists, if not we alter table
                try {
                     await db.execute('SELECT lat FROM chat_logs LIMIT 1');
                } catch (e) {
                     // Column likely missing, add them
                     console.log("Migrating chat_logs table (geo)...");
                     const cols = ['lat REAL', 'lng REAL', 'city TEXT', 'region TEXT', 'isp TEXT', 'referrer TEXT'];
                     for (const col of cols) {
                         try {
                             await db.execute(`ALTER TABLE chat_logs ADD COLUMN ${col}`);
                         } catch(alterErr) {
                             // Ignore if exists
                         }
                     }
                }
                
                // NEW MIGRATION: metaData
                try {
                     await db.execute('SELECT metaData FROM chat_logs LIMIT 1');
                } catch (e) {
                     console.log("Migrating chat_logs table (metaData)...");
                     try {
                         await db.execute(`ALTER TABLE chat_logs ADD COLUMN metaData TEXT`);
                     } catch(alterErr) {}
                }

                // Fetch logs, limiting to last 200 for performance
                const rs = await db.execute('SELECT * FROM chat_logs ORDER BY timestamp DESC LIMIT 200');
                
                // Parse the metaData JSON string back to object if it exists
                const logs = rs.rows.map(row => {
                    const r = parseRow(row);
                    if (r.metaData && typeof r.metaData === 'string') {
                        try { r.metaData = JSON.parse(r.metaData); } catch(e) {}
                    }
                    return r;
                });
                
                res.status(200).json(logs);
            } catch (dbError) {
                // If table doesn't exist at all, create it
                if (dbError.message && (dbError.message.includes('no such table'))) {
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
                            referrer TEXT,
                            metaData TEXT
                        )
                    `);
                    return res.status(200).json([]);
                }
                throw dbError;
            }
        } else if (req.method === 'POST') {
            const { action, id, log } = req.body;

            if (action === 'DELETE') {
                if (id === 'ALL') {
                    await db.execute('DELETE FROM chat_logs');
                } else {
                    await db.execute({ sql: 'DELETE FROM chat_logs WHERE id = ?', args: [id] });
                }
                return res.status(200).json({ success: true });
            }

            // Default to Insert/Log if no specific action
            if (!log) return res.status(400).json({ error: "No log data" });

            // Detect IP and UA
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
            const userAgent = req.headers['user-agent'] || 'Unknown UA';
            
            // Simple OS/Device detection logic
            let deviceInfo = 'Desktop';
            if (/Mobi|Android|iPhone/i.test(userAgent)) {
                deviceInfo = 'Mobile';
                if (/iPhone|iPad/i.test(userAgent)) deviceInfo += ' (iOS)';
                else if (/Android/i.test(userAgent)) deviceInfo += ' (Android)';
            } else {
                if (/Windows/i.test(userAgent)) deviceInfo = 'PC (Windows)';
                else if (/Mac/i.test(userAgent)) deviceInfo = 'Mac';
            }

            const metaDataStr = log.metaData ? JSON.stringify(log.metaData) : null;

            // Ensure table exists (Robustness)
            try {
                 await db.execute({
                    sql: `INSERT INTO chat_logs (
                        id, sessionId, role, message, timestamp, ip, userAgent, deviceInfo, 
                        lat, lng, city, region, isp, referrer, metaData
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    args: [
                        log.id, 
                        log.sessionId || 'anonymous', 
                        log.role, 
                        log.message, 
                        log.timestamp || new Date().toISOString(),
                        ip, // Use server detected IP
                        userAgent,
                        deviceInfo,
                        log.lat || null,
                        log.lng || null,
                        log.city || null,
                        log.region || null,
                        log.isp || null,
                        log.referrer || 'Direct',
                        metaDataStr
                    ]
                });
            } catch (insertError) {
                // If insert fails due to missing column (race condition), try basic insert
                console.warn("Enhanced log failed, trying basic log", insertError);
                 await db.execute({
                    sql: `INSERT INTO chat_logs (id, sessionId, role, message, timestamp) VALUES (?, ?, ?, ?, ?)`,
                    args: [log.id, log.sessionId, log.role, log.message, log.timestamp]
                });
            }
            
            res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error("Chat Logs API Error:", error);
        res.status(500).json({ error: error.message });
    }
}