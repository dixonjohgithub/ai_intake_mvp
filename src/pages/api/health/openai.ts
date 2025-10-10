import { NextApiRequest, NextApiResponse } from 'next';
import { testConnection } from '@/lib/ai/openaiClient';

/**
 * OpenAI API health check endpoint
 * Tests connection and API key validity
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return res.status(200).json({
        status: 'healthy',
        service: 'OpenAI',
        model: process.env.OPENAI_MODEL || 'gpt-5',
        embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
        message: 'OpenAI API is accessible and responding'
      });
    } else {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'OpenAI',
        message: 'OpenAI API test failed - check API key and network connectivity'
      });
    }
  } catch (error) {
    return res.status(503).json({
      status: 'unhealthy',
      service: 'OpenAI',
      message: 'OpenAI API connection error',
      error: String(error)
    });
  }
}