// Question configuration with proper step alignment
export interface QuestionConfig {
  id: string;
  step: number;
  stepName: string;
  question: string;
  required: boolean;
  validationMinLength?: number;
  followUp?: string;
}

export const QUESTION_FLOW: QuestionConfig[] = [
  // Step 1: Introduction (2 questions)
  {
    id: 'idea_description',
    step: 1,
    stepName: 'Introduction',
    question: 'Welcome to the GenAI Idea Assistant! Let\'s start by understanding your idea. Could you briefly describe your GenAI idea in 2-3 sentences?',
    required: true,
    validationMinLength: 20,
  },
  {
    id: 'idea_name',
    step: 1,
    stepName: 'Introduction',
    question: 'Great! What would you like to name this GenAI solution?',
    required: true,
    validationMinLength: 3,
  },

  // Step 2: Business Case (3 questions)
  {
    id: 'business_problem',
    step: 2,
    stepName: 'Business Case',
    question: 'Now let\'s understand the business value. What specific business problem or opportunity does this address?',
    required: true,
    validationMinLength: 20,
  },
  {
    id: 'target_users',
    step: 2,
    stepName: 'Business Case',
    question: 'Who would be the primary users or beneficiaries of this solution?',
    required: true,
    validationMinLength: 10,
  },
  {
    id: 'expected_benefits',
    step: 2,
    stepName: 'Business Case',
    question: 'What are the expected business benefits or ROI from implementing this solution?',
    required: true,
    validationMinLength: 20,
  },

  // Step 3: Technical Details (3 questions)
  {
    id: 'ai_capabilities',
    step: 3,
    stepName: 'Technical Details',
    question: 'Let\'s dive into the technical aspects. What specific AI/ML capabilities would this solution require (e.g., NLP, computer vision, predictive analytics)?\n\nIf you\'re unsure, type "suggest" and I\'ll recommend appropriate AI/ML approaches based on your problem description.',
    required: true,
    validationMinLength: 5,
  },
  {
    id: 'data_sources',
    step: 3,
    stepName: 'Technical Details',
    question: 'What data sources would this solution need to access? Please list the main data types and systems.\n\nIf you\'re unsure, type "suggest" for recommendations based on your use case.',
    required: true,
    validationMinLength: 5,
  },
  {
    id: 'integration_requirements',
    step: 3,
    stepName: 'Technical Details',
    question: 'What existing systems or platforms would this need to integrate with?\n\nIf you\'re unsure, type "suggest" for common integration points.',
    required: true,
    validationMinLength: 5,
  },

  // Step 4: Feasibility (3 questions)
  {
    id: 'data_availability',
    step: 4,
    stepName: 'Feasibility',
    question: 'Now let\'s assess feasibility. Is the required data currently available and accessible? Please describe the data readiness.',
    required: true,
    validationMinLength: 15,
  },
  {
    id: 'timeline',
    step: 4,
    stepName: 'Feasibility',
    question: 'What is your expected timeline for implementation? (e.g., POC in 3 months, production in 6 months)',
    required: true,
    validationMinLength: 10,
  },
  {
    id: 'resources_needed',
    step: 4,
    stepName: 'Feasibility',
    question: 'What resources (team size, skills, budget range) would be needed for this project?',
    required: true,
    validationMinLength: 15,
  },

  // Step 5: Risk Assessment (3 questions)
  {
    id: 'potential_risks',
    step: 5,
    stepName: 'Risk Assessment',
    question: 'Let\'s identify potential risks. What are the main technical, business, or regulatory risks you foresee?',
    required: true,
    validationMinLength: 20,
  },
  {
    id: 'compliance_considerations',
    step: 5,
    stepName: 'Risk Assessment',
    question: 'Are there any compliance, privacy, or ethical considerations we should be aware of?',
    required: true,
    validationMinLength: 15,
  },
  {
    id: 'success_metrics',
    step: 5,
    stepName: 'Risk Assessment',
    question: 'Finally, how would you measure the success of this project? What are the key metrics or KPIs?',
    required: true,
    validationMinLength: 15,
  },
];

export const getQuestionsForStep = (step: number): QuestionConfig[] => {
  return QUESTION_FLOW.filter(q => q.step === step);
};

export const getQuestionById = (id: string): QuestionConfig | undefined => {
  return QUESTION_FLOW.find(q => q.id === id);
};

export const getNextQuestion = (currentId: string | null): QuestionConfig | null => {
  if (!currentId) {
    return QUESTION_FLOW[0];
  }

  const currentIndex = QUESTION_FLOW.findIndex(q => q.id === currentId);
  if (currentIndex === -1 || currentIndex === QUESTION_FLOW.length - 1) {
    return null;
  }

  return QUESTION_FLOW[currentIndex + 1];
};

export const getCurrentStep = (completedQuestionIds: string[]): number => {
  if (completedQuestionIds.length === 0) return 1;

  // Find the highest step that has at least one completed question
  let currentStep = 1;
  for (const questionId of completedQuestionIds) {
    const question = getQuestionById(questionId);
    if (question && question.step > currentStep) {
      // Check if all previous step questions are completed
      const previousStepQuestions = getQuestionsForStep(question.step - 1);
      const previousStepCompleted = previousStepQuestions.every(q =>
        completedQuestionIds.includes(q.id)
      );

      if (previousStepCompleted) {
        currentStep = question.step;
      }
    }
  }

  // If all questions in current step are done, move to next step
  const currentStepQuestions = getQuestionsForStep(currentStep);
  const currentStepCompleted = currentStepQuestions.every(q =>
    completedQuestionIds.includes(q.id)
  );

  if (currentStepCompleted && currentStep < 6) {
    return currentStep + 1;
  }

  return currentStep;
};

export const validateResponse = (questionId: string, response: string): { valid: boolean; error?: string } => {
  const question = getQuestionById(questionId);
  if (!question) {
    return { valid: false, error: 'Invalid question' };
  }

  const trimmedResponse = response.trim();

  if (question.required && !trimmedResponse) {
    return { valid: false, error: 'This field is required' };
  }

  if (question.validationMinLength && trimmedResponse.length < question.validationMinLength) {
    return {
      valid: false,
      error: `Please provide more detail (minimum ${question.validationMinLength} characters)`
    };
  }

  return { valid: true };
};

export const calculateStepProgress = (step: number, completedQuestionIds: string[]): number => {
  const stepQuestions = getQuestionsForStep(step);
  if (stepQuestions.length === 0) return 0;

  const completedInStep = stepQuestions.filter(q =>
    completedQuestionIds.includes(q.id)
  ).length;

  return Math.round((completedInStep / stepQuestions.length) * 100);
};

export const calculateOverallProgress = (completedQuestionIds: string[]): number => {
  const totalQuestions = QUESTION_FLOW.length;
  if (totalQuestions === 0) return 0;

  return Math.round((completedQuestionIds.length / totalQuestions) * 100);
};