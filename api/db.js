
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Use a local file 'safeguard.db' instead of memory for better persistence chance in environments allowing FS
const dbConfig = {
  url: url || 'file:safeguard.db',
  authToken: authToken,
};

export const db = createClient(dbConfig);

// Utility to parse JSON fields safely
export const parseRow = (row) => {
    if (!row) return null;
    const newRow = { ...row };
    // Parse known JSON columns
    ['details', 'applicableCars', 'subModels', 'chatHistory'].forEach(field => {
        if (newRow[field] && typeof newRow[field] === 'string') {
            try {
                newRow[field] = JSON.parse(newRow[field]);
            } catch (e) {
                // keep as string if fail
            }
        }
    });
    // Convert boolean fields (SQLite stores as 0/1)
    ['isHotDeal', 'emergencyService'].forEach(field => {
         if (newRow[field] !== undefined && newRow[field] !== null) newRow[field] = Boolean(newRow[field]);
    });
    return newRow;
};