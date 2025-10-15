/**
 * Question Criteria Configuration
 * Maps static questions to data dictionary fields with validation criteria
 */

export interface QuestionCriteria {
  questionId: string;
  dbField: string; // Maps to data_dictionary.md column
  question: string;
  criteria: string[];
  exampleResponse: string;
  maxFollowUps: number;
  helpText: string;
}

/**
 * Static questions with validation criteria
 * These are asked in order (Q2-Q4) to ensure complete business case capture
 */
export const VALIDATED_QUESTIONS: Record<string, QuestionCriteria> = {
  // ==========================================
  // QUESTION 2: SOLUTION/OPPORTUNITY NAME
  // Maps to: opportunity_name + solution_name
  // ==========================================
  'solution-name': {
    questionId: 'solution-name',
    dbField: 'opportunity_name, solution_name',
    question: 'What would you like to name this solution or opportunity?',
    criteria: [
      'Provides a clear, descriptive name for the solution',
      'Name should be professional and indicate what it does',
      'Can be a working title or project codename'
    ],
    exampleResponse: 'AI-Powered Log Classification System',
    maxFollowUps: 1,
    helpText: 'Choose a name that describes your solution - this can be updated later'
  },

  // ==========================================
  // QUESTION 3: BUSINESS PROBLEM
  // Maps to: problem_statement + current_process_issues
  // ==========================================
  'business-problem': {
    questionId: 'business-problem',
    dbField: 'problem_statement, current_process_issues',
    question: 'What business problem does this solution address?',
    criteria: [
      'Describes the customer or business pain point being addressed',
      'Explains why the current process is problematic (slow, costly, inconsistent, or risky)',
      'Indicates the scope or impact of the problem (who is affected, volume, frequency)'
    ],
    exampleResponse: 'Manual review of log entries takes analysts 4 hours daily, causing delayed incident response. The current process is error-prone with a 20% misclassification rate, affecting our 10-person security operations team and leading to increased overtime costs.',
    maxFollowUps: 2,
    helpText: 'Describe the specific pain point, why the current process doesn\'t work well, and who/what is impacted'
  },

  // ==========================================
  // QUESTION 3: AI SOLUTION APPROACH
  // Maps to: ai_solution_approach + improvement_description
  // ==========================================
  'ai-solution': {
    questionId: 'ai-solution',
    dbField: 'ai_solution_approach, improvement_description',
    question: 'How will AI address this problem?',
    criteria: [
      'Describes the AI-enabled approach or solution',
      'Explains how it improves the current process (speed, scale, accuracy, cost)',
      'Connects back to the problem mentioned earlier'
    ],
    exampleResponse: 'Use an AI classifier to automatically categorize log entries by severity and type, then route them to the appropriate analyst. This will reduce classification time from 4 hours to under 15 minutes with 95% accuracy, allowing faster response to critical incidents.',
    maxFollowUps: 2,
    helpText: 'Explain what AI capability you\'ll use and how it makes things better'
  },

  // ==========================================
  // QUESTION 4: TARGET USERS & IMPACT
  // Maps to: Multiple fields (target users + core_kpis + efficiency_metrics)
  // ==========================================
  'target-users-impact': {
    questionId: 'target-users-impact',
    dbField: 'target_users, core_kpis, efficiency_metrics',
    question: 'Who will use this solution and what benefits do you expect?',
    criteria: [
      'Identifies the specific user group, role, or team',
      'Provides approximate number of users or team size',
      'Describes at least one quantifiable benefit (time saved, cost reduction, accuracy improvement, revenue impact)'
    ],
    exampleResponse: 'The security operations analysts - a team of 10 people who currently manually triage logs. We expect to reduce their daily triage time from 4 hours to 15 minutes (saving ~90 hours per week), improve incident response time by 50%, and reduce classification errors from 20% to under 5%.',
    maxFollowUps: 2,
    helpText: 'Tell us who the users are, how many, and what measurable improvements you expect'
  },

  // ==========================================
  // QUESTION 5: DATA SOURCES
  // Maps to: data_availability + data_availability_rationale
  // ==========================================
  'data-sources': {
    questionId: 'data-sources',
    dbField: 'data_availability, data_availability_rationale',
    question: 'What data will this AI solution use?',
    criteria: [
      'Identifies the specific data sources or types of data needed',
      'Indicates where the data is stored or how it will be accessed',
      'Optional: Mentions data volume, format, or availability'
    ],
    exampleResponse: 'Application logs, system logs, and security event logs from our SIEM platform (SentinelOne). The logs are stored in Google Cloud Storage buckets with about 5 million historical entries available for training.',
    maxFollowUps: 2,
    helpText: 'Describe what data the AI needs and where it comes from'
  },

  // ==========================================
  // QUESTION 6: TECHNICAL FEASIBILITY
  // Maps to: can_we_execute + integration_capability
  // ==========================================
  'technical-feasibility': {
    questionId: 'technical-feasibility',
    dbField: 'can_we_execute, can_we_execute_rationale, integration_capability',
    question: 'Do you have the tools, platforms, and people to build and run this?',
    criteria: [
      'Addresses whether the team/organization has the technical capability',
      'Mentions available tools, platforms, or infrastructure (or lack thereof)',
      'Optional: Identifies skill gaps or resource needs'
    ],
    exampleResponse: 'Yes - We have an existing ML platform, 3 data scientists on the team, and GPU infrastructure. The solution will need to integrate with our SIEM system and ticketing platform, both of which have REST APIs available.',
    maxFollowUps: 2,
    helpText: 'Can you execute this technically? Do you have the right people, tools, and systems?'
  },

  // ==========================================
  // QUESTION 7: TIMELINE & INVESTMENT
  // Maps to: investment_timeline + investment_people + investment_cost
  // ==========================================
  'timeline-investment': {
    questionId: 'timeline-investment',
    dbField: 'investment_timeline, investment_people, investment_cost',
    question: 'What is your expected timeline and resource commitment?',
    criteria: [
      'Provides an estimated timeline (MVP, pilot, or full deployment)',
      'Indicates team size or FTE requirements (or says "not sure")',
      'Optional: Mentions budget range or cost estimate'
    ],
    exampleResponse: '3-4 months for an MVP with basic classification. We\'d need 2-3 FTEs (1 ML engineer, 1 backend engineer, 0.5 analyst SME). Budget estimated at $150-200K for the MVP phase.',
    maxFollowUps: 2,
    helpText: 'How long will it take? How many people? What\'s the rough budget? (Estimates are fine)'
  },

  // ==========================================
  // QUESTION 8: RISKS & CHALLENGES
  // Maps to: risks_list
  // ==========================================
  'risks': {
    questionId: 'risks',
    dbField: 'risks_list',
    question: 'What challenges or risks might come up with this project?',
    criteria: [
      'Identifies at least one potential risk, challenge, or concern',
      'Can be technical, organizational, or business-related',
      'Accepts "I don\'t know" or "None that I can think of"'
    ],
    exampleResponse: 'Model accuracy may be lower initially requiring iterative training. Integration with our legacy SIEM system could be complex. We\'ll also need to build trust with analysts who may be skeptical of AI recommendations.',
    maxFollowUps: 1,
    helpText: 'What could go wrong? What obstacles might you face? (Be honest - it\'s okay to say "not sure")'
  },

  // ==========================================
  // QUESTION 9: MITIGATION STRATEGIES
  // Maps to: mitigation_strategies
  // ==========================================
  'mitigation': {
    questionId: 'mitigation',
    dbField: 'mitigation_strategies',
    question: 'How could you address or reduce these risks?',
    criteria: [
      'Proposes at least one strategy to mitigate identified risks',
      'Can be general or specific',
      'Accepts "I don\'t know" for AI assistance'
    ],
    exampleResponse: 'Start with human-in-the-loop validation to improve the model. Phase integration with SIEM starting with read-only access. Conduct training sessions and gather analyst feedback early to build trust.',
    maxFollowUps: 1,
    helpText: 'What steps could reduce the risks you mentioned?'
  },

  // ==========================================
  // QUESTION 10: BUILD/BUY/PARTNER
  // Maps to: overall_approach + approach_rationale
  // ==========================================
  'build-buy-partner': {
    questionId: 'build-buy-partner',
    dbField: 'overall_approach, approach_rationale',
    question: 'Should this be built in-house, purchased, or done with a partner?',
    criteria: [
      'Selects an approach: Build, Buy, Partner, or Hybrid',
      'Provides a brief rationale for the choice',
      'Accepts "I don\'t know" for AI recommendations'
    ],
    exampleResponse: 'Build in-house using our existing ML platform. We have proprietary log data and specific security requirements that make a custom solution necessary.',
    maxFollowUps: 1,
    helpText: 'Which approach makes the most sense and why?'
  }
};

/**
 * Question order - maps question numbers to criteria IDs
 * This enforces the static question sequence
 */
export const QUESTION_ORDER = [
  null, // Question 0 (doesn't exist)
  'idea-description', // Question 1 (asked in welcome message)
  'solution-name', // Question 2 - NEW: Solution/Opportunity Name
  'business-problem', // Question 3
  'ai-solution', // Question 4
  'target-users-impact', // Question 5
  'data-sources', // Question 6
  'technical-feasibility', // Question 7
  'timeline-investment', // Question 8
  'risks', // Question 9
  'mitigation', // Question 10
  'build-buy-partner' // Question 11
];

/**
 * Helper to get criteria for a specific question number
 */
export function getCriteriaForQuestion(questionNumber: number): QuestionCriteria | null {
  const questionId = QUESTION_ORDER[questionNumber];
  if (!questionId || questionId === 'idea-description') return null;
  return VALIDATED_QUESTIONS[questionId] || null;
}
