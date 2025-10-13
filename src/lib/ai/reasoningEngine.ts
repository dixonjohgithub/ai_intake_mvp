import * as apiClient from './apiClient';
import { Question } from './questionGenerator';

export interface ReasoningContext {
  userData: Record<string, any>;
  conversationHistory: Array<{
    question: string;
    answer: string;
  }>;
  category?: string;
  intent?: string;
}

export interface ReasoningResult {
  nextQuestion: Question;
  reasoning: string;
  confidence: number;
  alternativeQuestions?: Question[];
  insights?: string[];
}

export class ReasoningEngine {
  /**
   * Generate contextual question using reasoning engine
   */
  async generateContextualQuestion(
    context: ReasoningContext
  ): Promise<ReasoningResult | null> {
    try {
      // Use the apiClient to generate questions
      const question = await apiClient.generateQuestion(context.userData);

      if (question) {
        return {
          nextQuestion: question as Question,
          reasoning: 'Generated based on conversation context',
          confidence: 0.8,
        };
      }
    } catch (error) {
      console.error('Reasoning engine error:', error);
    }

    return null;
  }

  /**
   * Analyze conversation and provide insights
   */
  async analyzeConversation(
    context: ReasoningContext
  ): Promise<{
    summary: string;
    gaps: string[];
    recommendations: string[];
    classification: string;
    readiness: number;
  } | null> {
    try {
      // Use API client to call our Next.js API route
      const analysis = await apiClient.analyzeConversation(
        context.userData,
        context.conversationHistory
      );
      return analysis;
    } catch (error) {
      console.error('Analysis error:', error);
      // Return default analysis on error
      return {
        summary: 'GenAI idea for improving operational efficiency',
        gaps: ['Technical details needed'],
        recommendations: ['Define specific use cases'],
        classification: 'Simple GenAI',
        readiness: 50
      };
    }
  }

  /**
   * Validate and improve user response (simplified without OpenAI)
   */
  async improveResponse(
    question: string,
    userResponse: string,
    context: ReasoningContext
  ): Promise<{
    improved: string;
    suggestions: string[];
    quality: number;
  } | null> {
    // Simple response quality check without OpenAI
    const quality = userResponse.length > 50 ? 80 : 50;
    const suggestions = [];

    if (userResponse.length < 30) {
      suggestions.push('Provide more detail about your idea');
    }
    if (!userResponse.includes('business') && question.toLowerCase().includes('business')) {
      suggestions.push('Include business value or impact');
    }
    if (!userResponse.includes('data') && question.toLowerCase().includes('technical')) {
      suggestions.push('Specify data sources and requirements');
    }

    return {
      improved: userResponse,
      suggestions,
      quality,
    };
  }

  /**
   * Generate follow-up questions based on user response (simplified)
   */
  async generateFollowUpQuestions(
    originalQuestion: string,
    userResponse: string,
    count: number = 3
  ): Promise<Question[]> {
    // Return template-based follow-up questions
    const followUps: Question[] = [];

    if (originalQuestion.toLowerCase().includes('business')) {
      followUps.push({
        id: 'followup-roi',
        text: 'What is the expected ROI or cost savings?',
        type: 'text',
        category: 'business',
        required: false,
        helpText: 'Provide estimated financial impact'
      });
    }

    if (originalQuestion.toLowerCase().includes('technical')) {
      followUps.push({
        id: 'followup-integration',
        text: 'Which existing systems will this integrate with?',
        type: 'text',
        category: 'technical',
        required: false,
        helpText: 'List specific systems or platforms'
      });
    }

    return followUps.slice(0, count);
  }

  /**
   * Detect user intent from response (simplified)
   */
  async detectIntent(
    userResponse: string,
    context: ReasoningContext
  ): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
  } | null> {
    // Simple intent detection without OpenAI
    const response = userResponse.toLowerCase();
    let intent = 'general';
    let confidence = 0.7;

    if (response.includes('problem') || response.includes('issue')) {
      intent = 'describe_problem';
      confidence = 0.8;
    } else if (response.includes('solution') || response.includes('solve')) {
      intent = 'explain_solution';
      confidence = 0.8;
    } else if (response.includes('risk') || response.includes('concern')) {
      intent = 'discuss_risks';
      confidence = 0.8;
    } else if (response.includes('help') || response.includes('?')) {
      intent = 'request_help';
      confidence = 0.7;
    }

    return {
      intent,
      confidence,
      entities: {}
    };
  }

  /**
   * Build system prompt for question generation
   */
  private buildSystemPrompt(): string {
    return `You are an expert AI consultant helping users develop GenAI ideas for Wells Fargo.
Your role is to:
1. Ask targeted questions to understand their use case
2. Identify gaps in their proposal
3. Guide them toward a comprehensive solution
4. Ensure regulatory and security considerations are addressed

Generate questions that are:
- Clear and specific
- Relevant to banking/financial services
- Focused on practical implementation
- Compliant with regulatory requirements`;
  }

  /**
   * Build user prompt from context
   */
  private buildUserPrompt(context: ReasoningContext): string {
    const conversationSummary = context.conversationHistory
      .slice(-5) // Last 5 Q&A pairs
      .map(item => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n\n');

    return `Based on this GenAI idea submission:

Current Information:
${JSON.stringify(context.userData, null, 2)}

Recent Conversation:
${conversationSummary}

Category Focus: ${context.category || 'general'}
User Intent: ${context.intent || 'unknown'}

Generate the next most valuable question to gather missing information.
Consider:
- What critical details are missing?
- What risks need to be addressed?
- What would strengthen the business case?

Return a JSON object with:
{
  "nextQuestion": {
    "id": "unique_id",
    "text": "question text",
    "type": "text|select|multiselect|boolean|scale",
    "category": "business|technical|feasibility|risk|success",
    "required": true/false,
    "helpText": "optional helper text",
    "options": ["option1", "option2"] // if select/multiselect
  },
  "reasoning": "explanation of why this question is important",
  "confidence": 0.0-1.0,
  "alternativeQuestions": [...], // optional alternatives
  "insights": ["insight1", "insight2"] // optional insights about the idea
}`;
  }

  /**
   * Format reasoning result
   */
  private formatResult(raw: any): ReasoningResult {
    return {
      nextQuestion: raw.nextQuestion,
      reasoning: raw.reasoning || '',
      confidence: raw.confidence || 0.7,
      alternativeQuestions: raw.alternativeQuestions,
      insights: raw.insights,
    };
  }

  /**
   * Check if reasoning model is available
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      // Check if OpenAI is configured through our API
      return await apiClient.testOpenAIConnection();
    } catch (error) {
      console.error('Model availability check failed:', error);
      return false;
    }
  }

  /**
   * Generate idea title from conversation (simplified)
   */
  async generateTitle(context: ReasoningContext): Promise<string> {
    // Generate a simple title from user data
    const userData = context.userData;

    if (userData['problem-statement']) {
      // Extract first few words from problem statement
      const words = userData['problem-statement'].split(' ').slice(0, 8);
      return words.join(' ');
    } else if (userData['idea_description']) {
      const words = userData['idea_description'].split(' ').slice(0, 8);
      return words.join(' ');
    }

    return 'GenAI Idea Proposal';
  }

  /**
   * Score idea completeness
   */
  scoreCompleteness(context: ReasoningContext): {
    overall: number;
    business: number;
    technical: number;
    feasibility: number;
    risk: number;
  } {
    const data = context.userData;
    let scores = {
      overall: 0,
      business: 0,
      technical: 0,
      feasibility: 0,
      risk: 0,
    };

    // Business score
    if (data['problem-statement']) scores.business += 25;
    if (data['target-users']) scores.business += 25;
    if (data['expected-benefits']) scores.business += 25;
    if (data['success-metrics']) scores.business += 25;

    // Technical score
    if (data['ai-task-type']) scores.technical += 25;
    if (data['data-sources']) scores.technical += 25;
    if (data['integration-requirements']) scores.technical += 25;
    if (data['performance-requirements']) scores.technical += 25;

    // Feasibility score
    if (data['implementation-complexity']) scores.feasibility += 33;
    if (data['data-availability']) scores.feasibility += 33;
    if (data['estimated-impact']) scores.feasibility += 34;

    // Risk score
    if (data['regulatory-considerations']) scores.risk += 25;
    if (data['privacy-concerns']) scores.risk += 25;
    if (data['identified-risks']) scores.risk += 25;
    if (data['mitigation-strategies']) scores.risk += 25;

    // Calculate overall score
    scores.overall = (
      scores.business * 0.3 +
      scores.technical * 0.3 +
      scores.feasibility * 0.2 +
      scores.risk * 0.2
    );

    return scores;
  }
}

export default ReasoningEngine;