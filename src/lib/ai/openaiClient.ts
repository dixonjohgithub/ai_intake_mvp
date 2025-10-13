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
          content: `<role>
AI assistant for Wells Fargo GenAI idea intake process
</role>

<goal>
Generate one highly relevant follow-up question to gather missing information for a comprehensive GenAI proposal
</goal>

<constraints>
- Questions must be specific and actionable
- Focus on uncovering business value, technical requirements, or risk factors
- Avoid redundant questions already answered in the context
- Ensure questions align with Wells Fargo's enterprise standards
</constraints>

<output_requirements>
Generate a single, targeted question that advances the conversation toward a complete proposal
</output_requirements>`
        },
        {
          role: 'user',
          content: JSON.stringify(context)
        }
      ],
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
          content: `<role>
AI architecture classifier for GenAI proposals
</role>

<goal>
Classify the GenAI idea into the most appropriate architectural category
</goal>

<classification_categories>
1. Simple GenAI - Basic prompt-response interactions without external tools
2. GenAI with Tools - LLM with function/tool calling capabilities for specific actions
3. Agentic AI - Single autonomous agent with planning and decision-making capabilities
4. Multi-Agent System - Multiple cooperating agents working together
</classification_categories>

<analysis_criteria>
- Complexity of required interactions
- Need for external tool integration
- Level of autonomy required
- Multi-step reasoning requirements
- Collaboration between components
</analysis_criteria>

<output_format>
Return JSON with:
- classification: selected category name
- confidence: score between 0 and 1
- reasoning: detailed explanation of classification choice
</output_format>`
        },
        {
          role: 'user',
          content: JSON.stringify(ideaDetails)
        }
      ],
      response_format: { type: "json_object" },
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
          content: `<role>
Intake form generator for Wells Fargo GenAI proposals
</role>

<goal>
Transform conversation data into a structured intake form with completeness assessment
</goal>

<tasks>
1. Extract all relevant information from conversation data
2. Map responses to appropriate intake form fields
3. Identify missing required information
4. Calculate completeness percentage based on required fields
</tasks>

<form_structure>
- Business case section (problem, users, benefits, metrics)
- Technical requirements (AI task type, data sources, integrations)
- Risk and compliance (regulatory, privacy, security)
- Resource requirements (team, budget, timeline)
</form_structure>

<output_format>
Return JSON with:
- formData: structured object with all extracted fields
- completeness: percentage (0-100) of required fields filled
- missingFields: array of specific missing information
</output_format>`
        },
        {
          role: 'user',
          content: JSON.stringify(conversationData)
        }
      ],
      response_format: { type: "json_object" },
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
    });

    return response.choices[0].message.content?.includes('OK') || false;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}

export default openai;