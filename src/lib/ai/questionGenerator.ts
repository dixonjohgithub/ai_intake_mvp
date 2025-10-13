import * as apiClient from './apiClient';

export interface Question {
  id: string;
  text: string;
  question?: string; // Alternative to text for compatibility
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'scale';
  category: 'business' | 'technical' | 'feasibility' | 'risk' | 'success';
  required: boolean;
  options?: string[];
  followUp?: Question[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  helpText?: string;
  stepInfo?: string; // Step indicator like "Step 1 of 5: Introduction"
  exampleResponse?: string; // Sample answer to guide users
  dependsOn?: {
    questionId: string;
    answer?: any;
  };
}

export interface QuestionTemplate {
  id: string;
  name: string;
  category: string;
  questions: Question[];
  applicableFor?: string[];
}

// Question Templates for different aspects
export const questionTemplates: QuestionTemplate[] = [
  {
    id: 'business-case',
    name: 'Business Case Assessment',
    category: 'business',
    questions: [
      {
        id: 'problem-statement',
        text: 'What specific business problem or opportunity are you addressing?',
        type: 'text',
        category: 'business',
        required: true,
        validation: {
          minLength: 50,
          maxLength: 500,
        },
        helpText: 'Describe the current pain point or opportunity in 2-3 sentences.',
      },
      {
        id: 'target-users',
        text: 'Who are the primary users or beneficiaries of this solution?',
        type: 'text',
        category: 'business',
        required: true,
        helpText: 'Include internal teams, external customers, or partners.',
      },
      {
        id: 'expected-benefits',
        text: 'What are the expected benefits?',
        type: 'multiselect',
        category: 'business',
        required: true,
        options: [
          'Cost reduction',
          'Revenue growth',
          'Efficiency improvement',
          'Customer satisfaction',
          'Risk mitigation',
          'Compliance enhancement',
          'Innovation enablement',
        ],
      },
      {
        id: 'success-metrics',
        text: 'How will you measure success?',
        type: 'text',
        category: 'success',
        required: true,
        helpText: 'List specific KPIs or metrics (e.g., 20% reduction in processing time)',
      },
      {
        id: 'estimated-impact',
        text: 'What is the estimated annual impact?',
        type: 'select',
        category: 'business',
        required: false,
        options: [
          'Under $100K',
          '$100K - $500K',
          '$500K - $1M',
          '$1M - $5M',
          'Over $5M',
        ],
      },
    ],
  },
  {
    id: 'technical-requirements',
    name: 'Technical Requirements',
    category: 'technical',
    questions: [
      {
        id: 'ai-task-type',
        text: 'What type of AI task best describes your use case?',
        type: 'select',
        category: 'technical',
        required: true,
        options: [
          'Text Generation (content creation, summaries)',
          'Text Analysis (classification, sentiment, extraction)',
          'Conversation (chatbot, Q&A, support)',
          'Code Generation/Analysis',
          'Data Processing (transformation, enrichment)',
          'Multi-modal (text + images/documents)',
        ],
      },
      {
        id: 'data-sources',
        text: 'What data sources will this solution need to access?',
        type: 'multiselect',
        category: 'technical',
        required: true,
        options: [
          'Customer data',
          'Transaction data',
          'Product information',
          'Market data',
          'Regulatory documents',
          'Internal knowledge base',
          'External APIs',
          'Unstructured documents',
        ],
      },
      {
        id: 'data-volume',
        text: 'What is the expected data volume?',
        type: 'select',
        category: 'technical',
        required: false,
        options: [
          'Low (< 1000 records/day)',
          'Medium (1000 - 10000 records/day)',
          'High (10000 - 100000 records/day)',
          'Very High (> 100000 records/day)',
        ],
      },
      {
        id: 'integration-requirements',
        text: 'Which systems will this need to integrate with?',
        type: 'text',
        category: 'technical',
        required: true,
        helpText: 'List specific systems, platforms, or APIs',
      },
      {
        id: 'performance-requirements',
        text: 'What are the performance requirements?',
        type: 'text',
        category: 'technical',
        required: false,
        helpText: 'Response time, throughput, availability requirements',
      },
    ],
  },
  {
    id: 'feasibility-risk',
    name: 'Feasibility and Risk Assessment',
    category: 'feasibility',
    questions: [
      {
        id: 'implementation-complexity',
        text: 'How would you rate the implementation complexity?',
        type: 'scale',
        category: 'feasibility',
        required: true,
        options: ['1', '2', '3', '4', '5'],
        helpText: '1 = Very Simple, 5 = Very Complex',
      },
      {
        id: 'data-availability',
        text: 'Is the required data currently available?',
        type: 'select',
        category: 'feasibility',
        required: true,
        options: [
          'Yes, readily available',
          'Partially available',
          'Available but needs processing',
          'Not yet available',
          'Unknown',
        ],
      },
      {
        id: 'regulatory-considerations',
        text: 'Are there regulatory or compliance considerations?',
        type: 'boolean',
        category: 'risk',
        required: true,
        followUp: [
          {
            id: 'regulatory-details',
            text: 'Please describe the regulatory requirements:',
            type: 'text',
            category: 'risk',
            required: true,
            dependsOn: {
              questionId: 'regulatory-considerations',
              answer: true,
            },
          },
        ],
      },
      {
        id: 'privacy-concerns',
        text: 'Will this handle sensitive or personal data?',
        type: 'boolean',
        category: 'risk',
        required: true,
      },
      {
        id: 'identified-risks',
        text: 'What are the main risks or challenges you foresee?',
        type: 'text',
        category: 'risk',
        required: true,
        validation: {
          minLength: 30,
        },
      },
      {
        id: 'mitigation-strategies',
        text: 'What mitigation strategies do you propose?',
        type: 'text',
        category: 'risk',
        required: false,
      },
    ],
  },
];

export class QuestionGenerator {
  private context: Map<string, any> = new Map();
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(private useAI: boolean = true) {}

  /**
   * Generate the next question based on conversation context
   */
  async generateNextQuestion(
    userData: Record<string, any>,
    category?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<Question | null> {
    // Update context with user data
    Object.entries(userData).forEach(([key, value]) => {
      this.context.set(key, value);
    });

    // Update conversation history if provided
    if (conversationHistory) {
      this.conversationHistory = conversationHistory;
    }

    if (this.useAI) {
      return this.generateAIQuestion(userData, conversationHistory);
    } else {
      return this.generateTemplateQuestion(userData, category);
    }
  }

  /**
   * Generate question using OpenAI through API route
   */
  private async generateAIQuestion(
    userData: Record<string, any>,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<Question | null> {
    try {
      // Use the API client to call our Next.js API route with full conversation history
      const question = await apiClient.generateQuestion(userData, conversationHistory);
      return question;
    } catch (error) {
      console.error('Error generating AI question:', error);
      // Fall back to template-based questions
      return this.generateTemplateQuestion(userData);
    }
  }

  /**
   * Generate question from templates
   */
  private generateTemplateQuestion(
    userData: Record<string, any>,
    category?: string
  ): Question | null {
    // Determine which template to use
    const answeredQuestions = new Set(Object.keys(userData));

    // Find the next unanswered question
    for (const template of questionTemplates) {
      if (category && template.category !== category) continue;

      for (const question of template.questions) {
        // Check if question has dependencies
        if (question.dependsOn) {
          const depAnswer = userData[question.dependsOn.questionId];
          if (depAnswer !== question.dependsOn.answer) continue;
        }

        // Return first unanswered question
        if (!answeredQuestions.has(question.id)) {
          return question;
        }
      }
    }

    return null;
  }

  /**
   * Build prompt for AI question generation
   */
  private buildPrompt(userData: Record<string, any>): string {
    const context = Object.entries(userData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `Based on the following user responses about their GenAI idea:

${context}

Generate the next most relevant question to gather missing information.
Consider:
1. What critical information is still missing?
2. What would help assess feasibility and value?
3. What technical details are needed?

Return a JSON object with:
- id: unique identifier
- text: the question text
- type: 'text', 'select', 'multiselect', 'boolean', or 'scale'
- category: 'business', 'technical', 'feasibility', 'risk', or 'success'
- required: boolean
- helpText: optional helper text
- options: array if type is select/multiselect`;
  }

  /**
   * Validate user answer
   */
  validateAnswer(question: Question, answer: any): {
    valid: boolean;
    error?: string;
  } {
    if (question.required && !answer) {
      return { valid: false, error: 'This field is required' };
    }

    if (question.validation) {
      if (question.type === 'text' && typeof answer === 'string') {
        if (question.validation.minLength && answer.length < question.validation.minLength) {
          return {
            valid: false,
            error: `Response must be at least ${question.validation.minLength} characters`,
          };
        }
        if (question.validation.maxLength && answer.length > question.validation.maxLength) {
          return {
            valid: false,
            error: `Response must be no more than ${question.validation.maxLength} characters`,
          };
        }
        if (question.validation.pattern) {
          const regex = new RegExp(question.validation.pattern);
          if (!regex.test(answer)) {
            return {
              valid: false,
              error: 'Response format is invalid',
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get intelligent prompting for incomplete answers
   */
  getFollowUpPrompt(question: Question, answer: string): string | null {
    if (answer.length < 20) {
      return 'Could you provide more detail? This helps us better understand your needs.';
    }

    // Check for vague responses
    const vagueTerms = ['maybe', 'possibly', 'not sure', 'dont know', "don't know"];
    if (vagueTerms.some(term => answer.toLowerCase().includes(term))) {
      return 'It seems you might be uncertain. Could you share what you know so far, or what specific aspects you need help with?';
    }

    return null;
  }

  /**
   * Classify AI task complexity
   */
  classifyAITask(userData: Record<string, any>): string {
    const taskType = userData['ai-task-type'];
    const integrations = userData['integration-requirements'];
    const dataVolume = userData['data-volume'];

    // Simple classification logic
    if (!integrations || integrations.split(',').length <= 2) {
      return 'Simple GenAI';
    } else if (integrations.split(',').length <= 4) {
      return 'GenAI with Tools';
    } else if (dataVolume === 'High' || dataVolume === 'Very High') {
      return 'Multi-Agent System';
    } else {
      return 'Agentic AI';
    }
  }

  /**
   * Get question by ID
   */
  getQuestionById(questionId: string): Question | undefined {
    for (const template of questionTemplates) {
      const question = template.questions.find(q => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  }

  /**
   * Get all questions for a category
   */
  getQuestionsByCategory(category: string): Question[] {
    const questions: Question[] = [];
    for (const template of questionTemplates) {
      if (template.category === category) {
        questions.push(...template.questions);
      }
    }
    return questions;
  }

  /**
   * Calculate conversation progress
   */
  calculateProgress(userData: Record<string, any>): {
    percentage: number;
    completedCategories: string[];
    remainingCategories: string[];
  } {
    const requiredQuestions: string[] = [];
    const answeredQuestions = new Set(Object.keys(userData));

    // Collect all required questions
    for (const template of questionTemplates) {
      for (const question of template.questions) {
        if (question.required) {
          requiredQuestions.push(question.id);
        }
      }
    }

    const answeredRequired = requiredQuestions.filter(q => answeredQuestions.has(q));
    const percentage = (answeredRequired.length / requiredQuestions.length) * 100;

    // Check category completion
    const completedCategories: string[] = [];
    const remainingCategories: string[] = [];

    for (const template of questionTemplates) {
      const templateRequired = template.questions.filter(q => q.required);
      const templateAnswered = templateRequired.filter(q => answeredQuestions.has(q.id));

      if (templateAnswered.length === templateRequired.length) {
        completedCategories.push(template.category);
      } else {
        remainingCategories.push(template.category);
      }
    }

    return { percentage, completedCategories, remainingCategories };
  }
}

export default QuestionGenerator;