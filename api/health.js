// Health check endpoint to verify database connection
import { db } from './db.js';

export default async function handler(req, res) {
  try {
    // Test database connection
    const result = await db.execute('SELECT 1 as test');
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      environment: {
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? '✓ SET' : '✗ NOT SET',
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '✓ SET' : '✗ NOT SET',
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: {
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? '✓ SET' : '✗ NOT SET',
        TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '✓ SET' : '✗ NOT SET',
      }
    });
  }
}
