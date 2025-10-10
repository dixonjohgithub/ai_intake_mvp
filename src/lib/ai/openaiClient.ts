import OpenAI from 'openai';

/**
 * OpenAI Client for GPT-5 integration
 * Handles all interactions with OpenAI API including:
 * - Question generation
 * - Idea classification
 * - Content generation
 * - Embeddings for duplicate detection
 */

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration constants
const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-5';
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large';

/**
 * Generate contextual questions based on user responses
 */
export async function generateQuestion(context: {
  previousAnswers: Record<string, string>;
  currentStep: string;
  ideaCategory?: string;
}): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant helping collect information for a GenAI idea submission at Wells Fargo.
                   Generate thoughtful, contextual follow-up questions that help clarify and expand on the idea.
                   Focus on business value, technical feasibility, and implementation details.`
        },
        {
          role: 'user',
          content: JSON.stringify(context)
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating question:', error);
    throw new Error('Failed to generate question');
  }
}

/**
 * Classify an idea into AI solution levels
 */
export async function classifyIdea(ideaDetails: {
  title: string;
  description: string;
  technicalRequirements?: string;
  businessCase?: string;
}): Promise<{
  classification: 'Simple GenAI' | 'GenAI with Tools' | 'Agentic AI' | 'Multi-Agent System';
  confidence: number;
  reasoning: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Classify this GenAI idea into one of four categories:
                   1. Simple GenAI - Basic prompt-response interactions
                   2. GenAI with Tools - LLM with function/tool calling capabilities
                   3. Agentic AI - Single autonomous agent with planning capabilities
                   4. Multi-Agent System - Multiple cooperating agents

                   Provide your classification with confidence score (0-1) and reasoning.`
        },
        {
          role: 'user',
          content: JSON.stringify(ideaDetails)
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      classification: result.classification || 'Simple GenAI',
      confidence: result.confidence || 0.5,
      reasoning: result.reasoning || 'Classification based on provided details'
    };
  } catch (error) {
    console.error('Error classifying idea:', error);
    throw new Error('Failed to classify idea');
  }
}

/**
 * Generate embeddings for semantic similarity comparison
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

/**
 * Generate a complete intake form from conversation data
 */
export async function generateIntakeForm(conversationData: Record<string, any>): Promise<{
  formData: Record<string, any>;
  completeness: number;
  missingFields: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Generate a complete Wells Fargo GenAI intake form from the provided conversation data.
                   Map all conversation responses to the appropriate form fields.
                   Identify any missing required information.
                   Return structured JSON with form data, completeness percentage, and missing fields.`
        },
        {
          role: 'user',
          content: JSON.stringify(conversationData)
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error generating intake form:', error);
    throw new Error('Failed to generate intake form');
  }
}

/**
 * Test OpenAI connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Test connection. Reply with "OK"'
        }
      ],
      max_tokens: 10,
    });

    return response.choices[0].message.content?.includes('OK') || false;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

export default openai;