import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabaseConfig } from '@/config/environment';
import { Client } from 'pg';
import fs from 'fs/promises';

/**
 * Database-specific health check endpoint
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const dbConfig = getDatabaseConfig();

  if (dbConfig.type === 'csv') {
    try {
      await fs.access(dbConfig.path);
      return res.status(200).json({
        status: 'healthy',
        type: 'csv',
        path: dbConfig.path,
        message: 'CSV storage is accessible'
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        type: 'csv',
        path: dbConfig.path,
        message: 'CSV storage directory not accessible',
        error: String(error)
      });
    }
  }

  // PostgreSQL health check
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password,
  });

  try {
    await client.connect();

    // Check database connectivity and get some stats
    const [connectionResult, tableCountResult, sizeResult] = await Promise.all([
      client.query('SELECT version()'),
      client.query(`
        SELECT COUNT(*) as table_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `),
      client.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
      `)
    ]);

    await client.end();

    return res.status(200).json({
      status: 'healthy',
      type: 'postgresql',
      version: connectionResult.rows[0].version,
      tableCount: parseInt(tableCountResult.rows[0].table_count),
      databaseSize: sizeResult.rows[0].db_size,
      message: 'PostgreSQL is healthy'
    });
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      type: 'postgresql',
      message: 'PostgreSQL connection failed',
      error: String(error)
    });
  }
}