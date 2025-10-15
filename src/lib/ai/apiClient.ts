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
  complete?: boolean; // Indicates conversation is complete (15 questions reached)
  message?: string; // Completion message when complete is true
}

export interface AnalysisResult {
  summary: string;
  gaps: string[];
  recommendations: string[];
  classification: string;
  readiness: number;
}

/**
 * Generate next question using V2 static question flow (60-70% faster)
 * Uses predefined Q1-Q10 sequence with criteria validation
 */
export async function generateQuestionV2(
  userData: Record<string, any>,
  conversationHistory: Array<{ role: string; content: string }>,
  currentQuestionNumber: number,
  followUpCount: number = 0
): Promise<any> {
  try {
    const payload = {
      userData,
      conversationHistory,
      currentQuestionNumber,
      followUpCount
    };

    console.log('📤 CLIENT → API V2: Sending request to /api/openai/generate-question-v2');
    console.log('📊 Payload:', {
      userDataKeys: Object.keys(userData),
      currentQuestionNumber,
      followUpCount,
      historyLength: conversationHistory?.length || 0
    });

    const response = await fetch('/api/openai/generate-question-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ API V2 error response');
      return null;
    }

    const data = await response.json();
    console.log('📥 API V2 → CLIENT: Received response', data);
    return data;
  } catch (error) {
    console.error('💥 Failed to generate question V2:', error);
    return null;
  }
}

/**
 * Generate next question based on user data with streaming support (V1 - Legacy)
 */
export async function generateQuestion(
  userData: Record<string, any>,
  conversationHistory?: Array<{ role: string; content: string }>,
  onChunk?: (chunk: string) => void
): Promise<Question | null> {
  try {
    const payload = { userData, conversationHistory };

    // Log the complete payload being sent to the API
    console.log('📤 CLIENT → API: Sending request to /api/openai/generate-question');
    console.log('📊 Payload Stats:', {
      userDataKeys: Object.keys(userData),
      userDataCount: Object.keys(userData).length,
      conversationHistoryLength: conversationHistory?.length || 0,
    });

    const response = await fetch('/api/openai/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ API error response');
      return null;
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let question: Question | null = null;

    if (!reader) {
      console.error('❌ No reader available');
      return null;
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));

          if (data.chunk && onChunk) {
            // Stream chunk to callback
            onChunk(data.chunk);
          } else if (data.done && data.question) {
            // Final complete question
            question = data.question;
          } else if (data.error) {
            console.error('❌ Stream error:', data.error);
            return null;
          }
        }
      }
    }

    if (question) {
      console.log('📥 API → CLIENT: Received complete question');
      console.log('✨ Generated Question:', JSON.stringify(question, null, 2));
      return question;
    }

    return null;
  } catch (error) {
    console.error('💥 Failed to generate question:', error);
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