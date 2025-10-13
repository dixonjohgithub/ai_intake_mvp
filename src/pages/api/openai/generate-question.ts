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

/**
 * LLM-based function to determine if a topic has been sufficiently answered
 * This replaces brittle phrase-based detection with intelligent analysis
 */
async function hasTopicBeenAnswered(
  aiClient: OpenAI,
  modelName: string,
  topic: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userData: Record<string, any>
): Promise<boolean> {
  if (!conversationHistory || conversationHistory.length === 0) {
    return false;
  }

  const prompt = `Analyze this conversation and determine if the "${topic}" has been sufficiently answered.

Conversation History:
${conversationHistory.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

User Data Collected:
${JSON.stringify(userData, null, 2)}

Question: Has the "${topic}" been sufficiently answered with enough detail?

Criteria for "sufficiently answered":
1. The assistant must have asked about this topic (or a close variation)
2. The user must have provided a clear, specific response
3. The answer should be substantive (not just "yes" or a few words)
4. The response actually addresses the topic being asked about

IMPORTANT:
- Only return true if BOTH the question was asked AND a substantive answer was provided
- If the assistant asked about it but user hasn't answered yet, return false
- Be strict - the topic must be clearly covered in the conversation

Return a JSON object with:
{
  "answered": true or false,
  "reason": "brief explanation of your decision"
}`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing conversations and determining if questions have been answered. Be strict - only return true if the topic was clearly asked AND clearly answered with sufficient detail.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"answered": false, "reason": "No response"}');
    console.log(`📊 Topic Check - "${topic}": ${result.answered ? '✅ ANSWERED' : '❌ NOT ANSWERED'} - ${result.reason}`);
    return result.answered === true;
  } catch (error) {
    console.error(`Error checking if "${topic}" was answered:`, error);
    return false; // Fail safe - assume not answered
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { context, userData, conversationHistory } = req.body;

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

    // Determine which model to use for topic checking
    const modelName = mode === 'ollama'
      ? (process.env.OLLAMA_MODEL || 'gpt-oss:20b')
      : (process.env.OPENAI_MODEL || 'gpt-5');

    // Check for idea description (keep simple check for this)
    if (userData['idea_description'] || userData['idea'] || userData['core_idea']) {
      coveredTopics.push('basic idea description', 'core concept', 'solution overview', 'main idea', 'GenAI solution',
                         'project idea', 'GenAI project idea', 'brief overview', 'overview of your idea',
                         'describe your idea', 'what you want to build');
      // Suggest next logical questions - NEVER ask for idea again
      if (currentStep === 1) {
        questionsSuggestedNext.push('solution name', 'specific use case', 'industry or department');
      } else if (currentStep === 2) {
        questionsSuggestedNext.push('business problem', 'target users');
      }
    }

    // Use LLM to intelligently determine if topics have been answered
    // This replaces brittle phrase matching with semantic understanding
    console.log('🔍 Using LLM to check which topics have been answered...');

    const hasBusinessProblem = await hasTopicBeenAnswered(
      aiClient,
      modelName,
      'business problem or pain point this solution addresses',
      conversationHistory,
      userData
    );

    const hasTargetUsers = await hasTopicBeenAnswered(
      aiClient,
      modelName,
      'target users or intended users of the solution',
      conversationHistory,
      userData
    );

    const hasExpectedBenefits = await hasTopicBeenAnswered(
      aiClient,
      modelName,
      'expected benefits or outcomes of the solution',
      conversationHistory,
      userData
    );

    // Build covered topics based on LLM analysis
    if (hasBusinessProblem) {
      coveredTopics.push('business problem', 'pain points', 'challenges', 'problem to solve');
      questionsSuggestedNext.push('target users', 'expected benefits');
    }

    if (hasTargetUsers) {
      coveredTopics.push('target users', 'intended users', 'user groups');
      questionsSuggestedNext.push('expected benefits', 'success metrics');
    }

    if (hasExpectedBenefits) {
      coveredTopics.push('expected benefits', 'outcomes', 'value proposition');
      questionsSuggestedNext.push('success metrics', 'KPIs');
    }

    // Build conversation context for better awareness
    const conversationContext = conversationHistory && conversationHistory.length > 0
      ? `Recent conversation:
${conversationHistory.slice(-6).map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}`
      : '';

    // Analyze last response for quality and clarity needs
    const lastUserResponse = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.filter((m: any) => m.role === 'user').pop()?.content || ''
      : '';

    const needsClarification = lastUserResponse && (
      lastUserResponse.length < 30 ||
      lastUserResponse.toLowerCase().includes('not sure') ||
      lastUserResponse.toLowerCase().includes('maybe') ||
      lastUserResponse.toLowerCase().includes('i think')
    );

    // Build prompt for question generation using GPT-5 structured format
    const prompt = `<context>
User responses collected so far:
${JSON.stringify(userData, null, 2)}

${conversationContext}

Current Step: ${currentStep} of 5 - ${stepName}
Questions Asked: ${answeredQuestions.length}
Topics Already Covered: ${coveredTopics.length > 0 ? coveredTopics.join(', ') : 'None'}
Suggested Next Topics: ${questionsSuggestedNext.length > 0 ? questionsSuggestedNext.join(', ') : 'Continue with ' + stepName + ' questions'}

Last Response Quality: ${needsClarification ? 'May need clarification or more detail' : 'Clear and detailed'}
</context>

<task>
Generate exactly ONE focused question to advance this GenAI proposal.
Current focus area: ${stepName}

COLLABORATION MODE:
${needsClarification ?
`- The last response seems uncertain or brief
- Consider asking a clarifying question about the same topic
- Help the user refine and expand their idea
- Examples: "Could you elaborate on...", "What specific aspects of...", "Help me understand..."` :
`- The user has provided a clear response
- Move to the next logical topic
- Build on what they've shared`}

CONTEXT AWARENESS:
- Review the conversation history to understand the flow
- Reference previous answers when relevant ("You mentioned...")
- Avoid asking for information already provided
- Topics already covered: ${coveredTopics.join(', ')}

IMPORTANT:
- Ask about ONE specific aspect only
- Be conversational and supportive
- Help users who seem uncertain
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
10. CRITICAL: If 'idea_description' exists, NEVER ask for "overview", "brief overview", "project idea", or any variation
11. When idea_description exists, immediately move to next topic like solution name or use case
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
  - NEVER ask for "brief overview" or "project idea" if idea_description already exists
  - Valid Step 1 questions AFTER idea is provided: solution name, use case details, industry/department

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

<example_guidance>
ALWAYS include helpful examples in your questions to guide novice users:
- For "use case" questions: Provide 2-3 concrete examples
- For technical questions: Use simple analogies and examples
- For business questions: Give relatable scenarios
- Format examples as: "For example: [example1], [example2], or [example3]"

Example formats:
- "What specific use case...? For example: 'Automatically categorize customer emails by urgency', 'Route support tickets to the right team', or 'Classify documents by department'"
- "What business problem...? For instance: 'Currently takes 3 hours daily to manually sort emails', 'Missing important customer requests due to volume', or 'Staff spending too much time on repetitive tasks'"
- "Who are the target users...? Such as: 'Customer service team (15 people)', 'All analysts in the risk department', or 'External clients using our portal'"
</example_guidance>

<output_requirements>
Return a JSON object with these exact fields:
- id: unique identifier (use kebab-case based on the single topic)
- text: ONE clear question with helpful examples embedded (e.g., "Question text? For example: [examples]")
- type: one of ['text', 'select', 'multiselect', 'boolean', 'scale']
- category: one of ['business', 'technical', 'feasibility', 'risk', 'success']
- required: boolean indicating if response is mandatory
- helpText: brief guidance with additional context and examples
- exampleResponse: A complete sample answer to show users what a good response looks like
- options: array of choices (only if type is select/multiselect)
- stepInfo: "Step ${currentStep} of 5: ${stepName}"
</output_requirements>`;

    // Use the modelName already defined earlier for consistency
    const completion = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: `<role>
Expert AI consultant and collaborative partner for Wells Fargo GenAI idea intake
</role>

<expertise>
- Enterprise AI architecture and implementation
- Wells Fargo compliance and security requirements
- Risk assessment for financial services AI
- Technical feasibility analysis
- Collaborative refinement and idea development
- Context-aware conversational techniques
</expertise>

<collaboration_approach>
🤝 PARTNERSHIP: Work WITH the user to refine and develop their ideas
🤝 CONTEXT: Always consider the full conversation history
🤝 CLARITY: When responses are vague, help clarify before moving on
🤝 SUPPORT: Encourage users who seem uncertain
🤝 REFERENCE: Connect new questions to previous answers
🤝 EXAMPLES: Always provide concrete examples to guide novice users
</collaboration_approach>

<user_guidance_principles>
📚 EXAMPLES ALWAYS: Every question must include 2-3 relatable examples
📚 SIMPLE LANGUAGE: Avoid jargon; explain technical terms with analogies
📚 SAMPLE RESPONSES: Show what a good answer looks like
📚 CONTEXT CLUES: Help users understand why you're asking
📚 ENCOURAGE DETAIL: Use examples to prompt comprehensive responses
</user_guidance_principles>

<absolute_requirements>
🔴 Ask exactly ONE question about ONE topic at a time
🔴 NEVER repeat questions already answered in the conversation
🔴 Check conversation history to avoid duplicates
🔴 Reference previous answers when relevant
🔴 Help refine unclear or brief responses
</absolute_requirements>

<core_principles>
1. Be conversational and supportive, not interrogative
2. Build on previous answers to show you're listening
3. Help users expand on uncertain responses
4. Avoid redundancy by checking what's already been discussed
5. Guide step-by-step but adapt to user's clarity level
6. Ask clarifying questions when responses are vague
7. Celebrate progress and acknowledge good ideas
</core_principles>

<objective>
Collaboratively develop comprehensive GenAI proposals through context-aware, supportive dialogue that helps users refine their ideas while avoiding duplicate questions
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