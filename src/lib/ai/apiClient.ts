/**
 * Client-side API wrapper for OpenAI functionality
 * Routes all OpenAI calls through Next.js API routes
 */

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'scale';
  category: 'business' | 'technical' | 'feasibility' | 'risk' | 'success';
  required: boolean;
  helpText?: string;
  stepInfo?: string; // Step indicator like "Step 1 of 5: Introduction"
  exampleResponse?: string; // Sample answer to guide users
  options?: string[];
}

export interface AnalysisResult {
  summary: string;
  gaps: string[];
  recommendations: string[];
  classification: string;
  readiness: number;
}

/**
 * Generate next question based on user data
 */
export async function generateQuestion(
  userData: Record<string, any>,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<Question | null> {
  try {
    const response = await fetch('/api/openai/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userData, conversationHistory }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      return null;
    }

    const data = await response.json();
    return data.question;
  } catch (error) {
    console.error('Failed to generate question:', error);
    return null;
  }
}

/**
 * Analyze conversation and provide insights
 */
export async function analyzeConversation(
  userData: Record<string, any>,
  conversationHistory: Array<{ question: string; answer: string }>
): Promise<AnalysisResult | null> {
  try {
    const response = await fetch('/api/openai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userData, conversationHistory }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      return null;
    }

    const data = await response.json();
    return data.analysis;
  } catch (error) {
    console.error('Failed to analyze conversation:', error);
    return null;
  }
}

/**
 * Test OpenAI connection through API
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/health/openai', {
      method: 'GET',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('/api/openai/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      return null;
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

/**
 * Classify AI task complexity
 */
export async function classifyTask(userData: Record<string, any>): Promise<string> {
  try {
    const response = await fetch('/api/openai/classify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userData }),
    });

    if (!response.ok) {
      return 'Unknown';
    }

    const data = await response.json();
    return data.classification;
  } catch (error) {
    console.error('Failed to classify task:', error);
    return 'Unknown';
  }
}

/**
 * Check if OpenAI is configured and available
 */
export function isOpenAIEnabled(): boolean {
  // Check if we're in development or production with API key configured
  // This is set in the build process or through environment variables
  return process.env.NEXT_PUBLIC_OPENAI_ENABLED === 'true';
}