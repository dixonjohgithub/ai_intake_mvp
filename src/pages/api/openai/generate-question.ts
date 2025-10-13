import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize AI client based on mode
const getAIClient = () => {
  const mode = process.env.NEXT_PUBLIC_AI_MODE || 'static';

  if (mode === 'ollama') {
    // Configure for local Ollama
    return new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: process.env.OLLAMA_API_KEY || 'ollama',
    });
  } else if (mode === 'openai') {
    // Configure for OpenAI
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return null; // For static mode
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { context, userData } = req.body;

    const mode = process.env.NEXT_PUBLIC_AI_MODE || 'static';
    const aiClient = getAIClient();

    // Check configuration based on mode
    if (mode === 'openai' && !process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Please configure OPENAI_API_KEY in your .env file'
      });
    }

    if (mode === 'static') {
      return res.status(400).json({
        error: 'Static mode enabled',
        message: 'AI generation is disabled in static mode'
      });
    }

    if (!aiClient) {
      return res.status(500).json({
        error: 'AI client initialization failed',
        message: `Failed to initialize AI client for mode: ${mode}`
      });
    }

    // Determine current step based on collected data
    const answeredQuestions = Object.keys(userData);
    let currentStep = 1;
    let stepName = 'Introduction';

    if (answeredQuestions.length >= 10) {
      currentStep = 5;
      stepName = 'Risk Assessment';
    } else if (answeredQuestions.length >= 7) {
      currentStep = 4;
      stepName = 'Feasibility';
    } else if (answeredQuestions.length >= 4) {
      currentStep = 3;
      stepName = 'Technical Details';
    } else if (answeredQuestions.length >= 2) {
      currentStep = 2;
      stepName = 'Business Case';
    }

    // Build list of topics already covered
    const coveredTopics: string[] = [];
    const questionsSuggestedNext: string[] = [];

    // Map userData keys to topics to avoid duplicates
    if (userData['idea_description'] || userData['idea'] || userData['core_idea']) {
      coveredTopics.push('basic idea description', 'core concept', 'solution overview', 'main idea', 'GenAI solution');
      // Suggest next logical questions
      if (currentStep === 1) {
        questionsSuggestedNext.push('solution name', 'specific use case');
      } else if (currentStep === 2) {
        questionsSuggestedNext.push('business problem', 'target users');
      }
    }
    if (userData['business_problem'] || userData['problem']) {
      coveredTopics.push('business problem', 'pain points', 'challenges');
      questionsSuggestedNext.push('target users', 'expected benefits');
    }
    if (userData['target_users'] || userData['users'] || userData['intended_users']) {
      coveredTopics.push('intended users', 'target audience', 'user groups');
      questionsSuggestedNext.push('expected benefits', 'success metrics');
    }
    if (userData['expected_benefits'] || userData['benefits']) {
      coveredTopics.push('expected benefits', 'value proposition', 'outcomes');
      questionsSuggestedNext.push('success metrics', 'KPIs');
    }

    // Build prompt for question generation using GPT-5 structured format
    const prompt = `<context>
User responses collected so far:
${JSON.stringify(userData, null, 2)}

Current Step: ${currentStep} of 5 - ${stepName}
Questions Asked: ${answeredQuestions.length}
Topics Already Covered: ${coveredTopics.length > 0 ? coveredTopics.join(', ') : 'None'}
Suggested Next Topics: ${questionsSuggestedNext.length > 0 ? questionsSuggestedNext.join(', ') : 'Continue with ' + stepName + ' questions'}
</context>

<task>
Generate exactly ONE focused question to advance this GenAI proposal.
Current focus area: ${stepName}
IMPORTANT:
- Ask about ONE specific aspect only. Do not combine multiple concepts.
- DO NOT ask about topics already covered: ${coveredTopics.join(', ')}
- Move to NEW information not yet collected
- Consider asking about: ${questionsSuggestedNext.length > 0 ? questionsSuggestedNext[0] : 'next logical topic in ' + stepName}
</task>

<critical_rules>
1. Ask ONLY ONE QUESTION - never combine multiple questions
2. NEVER use "and" to join two different concepts in a question
3. Keep questions focused on a SINGLE specific aspect
4. Questions should build on previous answers
5. Match question complexity to the current step
6. For Step ${currentStep}, focus ONLY on ${stepName} aspects
7. NEVER ask for information already provided in userData
8. If user described their idea, don't ask "what is the core idea" - move to next topic
9. Check userData keys to avoid duplicate questions
</critical_rules>

<examples_of_bad_questions>
❌ "Who are the intended users and what outcomes do you expect?"
❌ "What is the timeline and budget for this project?"
❌ "What data sources will you use and how will you ensure quality?"
❌ Asking "What is the core idea?" after user already described their idea
❌ Asking same information in different words (e.g., "main concept" after "idea description")
</examples_of_bad_questions>

<examples_of_good_questions>
✓ "Who are the primary intended users for this solution?"
✓ "What specific outcomes do you expect from this implementation?"
✓ "What is your expected timeline for this project?"
✓ "What budget range are you considering?"
✓ "What data sources will you need to access?"
</examples_of_good_questions>

<step_focus>
Step 1 (Introduction):
  - If 'idea_description' exists: Ask about solution name, specific use case, or industry
  - If no responses yet: This means initial question was ALREADY asked in welcome message, don't repeat
  - NEVER ask "what is the core idea" after user described their idea

Step 2 (Business Case):
  - Ask about: Business problem OR target users OR expected benefits (SEPARATELY)
  - Example progression: First ask problem, THEN users, THEN benefits

Step 3 (Technical Details):
  - Ask about: AI capabilities OR data requirements OR integrations (INDIVIDUALLY)
  - Never combine technical aspects in one question

Step 4 (Feasibility):
  - Ask about: Data availability OR timeline OR resources (ONE BY ONE)
  - Each aspect should be its own question

Step 5 (Risk Assessment):
  - Ask about: Risks OR compliance OR success metrics (SEPARATELY)
  - Never combine risk factors in a single question
</step_focus>

<output_requirements>
Return a JSON object with these exact fields:
- id: unique identifier (use kebab-case based on the single topic)
- text: ONE clear, focused question about a SINGLE topic (no "and" joining concepts)
- type: one of ['text', 'select', 'multiselect', 'boolean', 'scale']
- category: one of ['business', 'technical', 'feasibility', 'risk', 'success']
- required: boolean indicating if response is mandatory
- helpText: brief guidance starting with "(Step ${currentStep} of 5) ..."
- options: array of choices (only if type is select/multiselect)
- stepInfo: "Step ${currentStep} of 5: ${stepName}"
</output_requirements>`;

    // Determine which model to use
    const modelName = mode === 'ollama'
      ? (process.env.OLLAMA_MODEL || 'gpt-oss:20b')
      : (process.env.OPENAI_MODEL || 'gpt-5');

    const completion = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `<role>
Expert AI consultant for Wells Fargo GenAI idea intake - Single-question step-by-step interviewer
</role>

<expertise>
- Enterprise AI architecture and implementation
- Wells Fargo compliance and security requirements
- Risk assessment for financial services AI
- Technical feasibility analysis
- Conversational interview techniques with ONE question at a time
</expertise>

<absolute_requirements>
🔴 CRITICAL: You MUST ask exactly ONE question about ONE topic
🔴 NEVER combine multiple concepts with "and", "as well as", "also", or similar conjunctions
🔴 Each question must focus on a SINGLE aspect only
🔴 If tempted to ask about two things, choose ONE and save the other for the next question
</absolute_requirements>

<core_principles>
1. ALWAYS ask exactly ONE question at a time - no exceptions
2. Never combine multiple topics in a single question
3. Avoid using "and" to join different concepts
4. Keep questions conversational but focused on ONE thing
5. Guide users step-by-step through the process
6. Provide clear step indicators showing progression
7. Build questions based on previous answers
</core_principles>

<objective>
Guide users through comprehensive idea development with laser-focused, single-topic questions that build progressively through clearly defined steps
</objective>`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      const question = JSON.parse(response);
      return res.status(200).json({ question });
    } else {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }
  } catch (error: any) {
    console.error('OpenAI API error:', error);

    // Check for specific error types
    if (error?.code === 'invalid_api_key') {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The OpenAI API key is invalid. Please check your configuration.'
      });
    }

    if (error?.code === 'insufficient_quota') {
      return res.status(429).json({
        error: 'Quota exceeded',
        message: 'OpenAI API quota exceeded. Please check your billing.'
      });
    }

    return res.status(500).json({
      error: 'Failed to generate question',
      message: error?.message || 'Unknown error occurred'
    });
  }
}