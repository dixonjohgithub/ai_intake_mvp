import { NextApiRequest, NextApiResponse } from 'next';
import { testConnection as testOpenAI } from '@/lib/ai/openaiClient';
import { getDatabaseConfig } from '@/config/environment';
import { Client } from 'pg';

/**
 * Health check endpoint for monitoring service availability
 * Returns status of all critical services
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    app: boolean;
    openai: boolean;
    database: boolean;
  };
  details: {
    app: {
      status: boolean;
      message: string;
      version: string;
      uptime: number;
    };
    openai: {
      status: boolean;
      message: string;
      model: string;
    };
    database: {
      status: boolean;
      message: string;
      type: 'postgresql' | 'csv';
    };
  };
}

async function checkDatabaseHealth(): Promise<{ status: boolean; message: string }> {
  const dbConfig = getDatabaseConfig();

  if (dbConfig.type === 'csv') {
    // For CSV, just check if the directory exists
    const fs = require('fs').promises;
    try {
      await fs.access(dbConfig.path);
      return { status: true, message: 'CSV storage accessible' };
    } catch (error) {
      return { status: false, message: 'CSV storage directory not accessible' };
    }
  }

  // For PostgreSQL
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.username,
    password: dbConfig.password,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT 1');
    await client.end();
    return { status: true, message: 'PostgreSQL connection successful' };
  } catch (error) {
    return { status: false, message: `PostgreSQL connection failed: ${error}` };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const startTime = process.hrtime();
  const uptime = process.uptime();

  // Check OpenAI connection
  const openaiStatus = await testOpenAI().catch(() => false);

  // Check database
  const dbCheck = await checkDatabaseHealth();

  // Calculate overall status
  const allHealthy = openaiStatus && dbCheck.status;
  const anyUnhealthy = !openaiStatus || !dbCheck.status;

  const healthStatus: HealthStatus = {
    status: allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      app: true,
      openai: openaiStatus,
      database: dbCheck.status,
    },
    details: {
      app: {
        status: true,
        message: 'Application is running',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(uptime),
      },
      openai: {
        status: openaiStatus,
        message: openaiStatus ? 'OpenAI API connected' : 'OpenAI API connection failed',
        model: process.env.OPENAI_MODEL || 'gpt-5',
      },
      database: {
        status: dbCheck.status,
        message: dbCheck.message,
        type: getDatabaseConfig().type,
      },
    },
  };

  // Set appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 :
                     healthStatus.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthStatus);
}