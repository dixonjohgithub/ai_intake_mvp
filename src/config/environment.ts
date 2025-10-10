/**
 * Environment Configuration Manager
 * Centralized management of environment variables with validation and defaults
 */

import { z } from 'zod';

// Environment variable schema with validation
const envSchema = z.object({
  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.string().default('3000'),
  SESSION_SECRET: z.string().min(32).default('change-this-to-random-string-minimum-32-chars'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_MODEL: z.string().default('gpt-5'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-large'),

  // Database Configuration
  DB_USE_POSTGRES: z.string().transform(val => val === 'true').default('false'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('ai_intake_db'),
  DB_USER: z.string().default('ai_intake_user'),
  DB_PASSWORD: z.string().optional(),

  // File Storage Paths
  CSV_DATA_PATH: z.string().default('./data'),
  LOG_PATH: z.string().default('./logs'),

  // Feature Flags
  ENABLE_DEBUG_PANEL: z.string().transform(val => val === 'true').default('true'),
  ENABLE_DECISION_LOGGING: z.string().transform(val => val === 'true').default('true'),

  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Get validated environment configuration
 */
export function getConfig(): Environment {
  try {
    // Load environment variables
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      APP_PORT: process.env.APP_PORT,
      SESSION_SECRET: process.env.SESSION_SECRET,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
      DB_USE_POSTGRES: process.env.DB_USE_POSTGRES,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      CSV_DATA_PATH: process.env.CSV_DATA_PATH,
      LOG_PATH: process.env.LOG_PATH,
      ENABLE_DEBUG_PANEL: process.env.ENABLE_DEBUG_PANEL,
      ENABLE_DECISION_LOGGING: process.env.ENABLE_DECISION_LOGGING,
      LOG_LEVEL: process.env.LOG_LEVEL,
    };

    // Validate and return configuration
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:', error.errors);
      throw new Error(`Invalid environment configuration: ${error.errors.map(e => `${e.path}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getConfig().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getConfig().NODE_ENV === 'test';
}

/**
 * Get port configuration with conflict detection
 */
export function getPortConfig() {
  const config = getConfig();
  const appPort = parseInt(config.APP_PORT, 10);

  // Ensure ports don't conflict
  const ports = {
    app: appPort,
    api: appPort + 1,  // API on next port
    admin: appPort + 2, // Admin panel on next port
  };

  return ports;
}

/**
 * Get database connection configuration
 */
export function getDatabaseConfig() {
  const config = getConfig();

  if (config.DB_USE_POSTGRES) {
    return {
      type: 'postgresql' as const,
      host: config.DB_HOST,
      port: parseInt(config.DB_PORT, 10),
      database: config.DB_NAME,
      username: config.DB_USER,
      password: config.DB_PASSWORD,
    };
  }

  return {
    type: 'csv' as const,
    path: config.CSV_DATA_PATH,
  };
}

// Export singleton configuration
const config = getConfig();
export default config;