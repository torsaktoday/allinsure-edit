
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Log configuration for debugging
console.log('=== DATABASE CONFIGURATION ===');
console.log('TURSO_DATABASE_URL:', url ? '✓ SET' : '✗ NOT SET');
console.log('TURSO_AUTH_TOKEN:', authToken ? '✓ SET' : '✗ NOT SET');

// Use a local file 'safeguard.db' instead of memory for better persistence chance in environments allowing FS
const dbConfig = {
  url: url || 'file:safeguard.db',
  authToken: authToken,
};

console.log('Using database:', url ? 'Turso (Cloud)' : 'Local File (safeguard.db)');
console.log('==============================\n');

export const db = createClient(dbConfig);

// Test connection on startup (non-blocking)
db.execute('SELECT 1 as test')
  .then(() => console.log('✓ Database connection successful'))
  .catch(e => {
    console.error('✗ Database connection failed:', e.message);
    console.error('Please check your TURSO_DATABASE_URL and TURSO_AUTH_TOKEN');
  });

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