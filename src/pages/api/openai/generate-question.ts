import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Debug logging function
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `\n${'='.repeat(80)}\n[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n${'='.repeat(80)}\n`;

  const logPath = path.join(process.cwd(), 'llm-debug.log');
  fs.appendFileSync(logPath, logMessage);
  console.log(logMessage);
};

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
 * Semantic duplicate detection - checks if a new response is semantically similar to existing userData values
 * This prevents storing the same information twice even when worded differently
 */
async function isSemanticDuplicate(
  aiClient: OpenAI,
  modelName: string,
  newResponse: string,
  existingData: Record<string, any>
): Promise<{ isDuplicate: boolean; matchedKey: string | null; matchedValue: string | null; reason: string }> {
  if (!newResponse || !existingData || Object.keys(existingData).length === 0) {
    return { isDuplicate: false, matchedKey: null, matchedValue: null, reason: 'No existing data to compare' };
  }

  // Build a list of existing values to compare against
  const existingValues = Object.entries(existingData)
    .map(([key, value]) => ({ key, value: String(value) }))
    .filter(item => item.value && item.value.length > 0);

  if (existingValues.length === 0) {
    return { isDuplicate: false, matchedKey: null, matchedValue: null, reason: 'No existing values to compare' };
  }

  const prompt = `Analyze if the new user response is semantically similar (duplicate meaning) to any existing responses.

NEW RESPONSE:
"${newResponse}"

EXISTING RESPONSES:
${existingValues.map(({ key, value }) => `[${key}]: "${value}"`).join('\n')}

Question: Is the new response semantically equivalent to ANY of the existing responses?

Semantic equivalence means:
1. The core meaning or concept is the same
2. Even if worded differently, they describe the same thing
3. One could be a paraphrase or rephrasing of the other
4. They refer to the same idea, solution, problem, or concept

Examples of semantic duplicates:
- "I want to build a log classifier" ≈ "The idea is to create a system that classifies logs"
- "Reduce manual processing time" ≈ "Save time on repetitive manual tasks"
- "Customer service agents" ≈ "Support team members"

NOT semantic duplicates (different concepts):
- "Build a log classifier" ≠ "AI-Enabled Log Classifier" (one is description, other is name)
- "Classify logs" ≠ "Analysts spend 2 hours daily sorting logs" (one is solution, other is problem)
- "Customer service team" ≠ "Reduce processing time by 50%" (different topics entirely)

Return a JSON object:
{
  "isDuplicate": true or false,
  "matchedKey": "the key of the matching existing value" or null,
  "matchedValue": "the existing value that matches" or null,
  "reason": "brief explanation of why it's a duplicate or not"
}`;

  try {
    debugLog(`🔍 Semantic Duplicate Check - Analyzing new response`, {
      newResponse,
      existingDataKeys: Object.keys(existingData),
      existingValues: existingValues.map(({ key, value }) => `${key}: ${value.substring(0, 50)}...`)
    });

    debugLog(`📝 LLM PROMPT for Semantic Duplicate Analysis`, {
      systemPrompt: 'You are an expert at semantic analysis and determining if two pieces of text have the same meaning.',
      userPrompt: prompt
    });

    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at semantic analysis and determining if two pieces of text have the same meaning, even when worded differently.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for consistent semantic analysis
    });

    const rawResponse = response.choices[0]?.message?.content || '{"isDuplicate": false, "matchedKey": null, "matchedValue": null, "reason": "No response"}';
    debugLog(`✨ LLM RAW RESPONSE for Semantic Duplicate Check`, rawResponse);

    const result = JSON.parse(rawResponse);
    const statusEmoji = result.isDuplicate ? '⚠️ DUPLICATE DETECTED' : '✅ UNIQUE RESPONSE';

    debugLog(`📊 SEMANTIC DUPLICATE ANALYSIS RESULT`, {
      newResponse,
      isDuplicate: result.isDuplicate,
      matchedKey: result.matchedKey,
      matchedValue: result.matchedValue,
      reason: result.reason,
      status: statusEmoji
    });

    return result;
  } catch (error) {
    console.error('Error in semantic duplicate detection:', error);
    debugLog(`❌ ERROR in isSemanticDuplicate`, error);
    return { isDuplicate: false, matchedKey: null, matchedValue: null, reason: 'Error occurred during analysis' };
  }
}

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
): Promise<{ answered: boolean; needsFollowUp: boolean; reason: string }> {
  if (!conversationHistory || conversationHistory.length === 0) {
    return { answered: false, needsFollowUp: false, reason: 'No conversation history' };
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

Criteria for "needs follow-up":
1. The assistant asked about this topic
2. The user provided a response, but it's vague, too brief, or incomplete
3. More clarification or detail would be valuable

IMPORTANT:
- answered: true only if the topic is FULLY and clearly covered
- needsFollowUp: true if user tried to answer but needs clarification/more detail
- If neither asked nor answered, both should be false

Return a JSON object with:
{
  "answered": true or false,
  "needsFollowUp": true or false,
  "reason": "brief explanation of your decision"
}`;

  try {
    debugLog(`🔍 hasTopicBeenAnswered - Checking topic: "${topic}"`, {
      topic,
      conversationHistoryLength: conversationHistory?.length || 0,
      conversationHistory: conversationHistory,
      userData: userData
    });

    debugLog(`📝 LLM PROMPT for "${topic}" Analysis`, {
      systemPrompt: 'You are an expert at analyzing conversations and determining if questions have been answered sufficiently.',
      userPrompt: prompt
    });

    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing conversations and determining if questions have been answered sufficiently. You can also identify when follow-up questions would help get better answers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const rawResponse = response.choices[0]?.message?.content || '{"answered": false, "needsFollowUp": false, "reason": "No response"}';
    debugLog(`✨ LLM RAW RESPONSE for "${topic}"`, rawResponse);

    const result = JSON.parse(rawResponse);
    const statusEmoji = result.answered ? '✅ ANSWERED' : result.needsFollowUp ? '🔄 NEEDS FOLLOW-UP' : '❌ NOT ANSWERED';
    console.log(`📊 Topic Check - "${topic}": ${statusEmoji} - ${result.reason}`);

    debugLog(`📊 LLM DECISION for "${topic}"`, {
      topic,
      answered: result.answered,
      needsFollowUp: result.needsFollowUp,
      reason: result.reason,
      status: statusEmoji
    });

    return result;
  } catch (error) {
    console.error(`Error checking if "${topic}" was answered:`, error);
    debugLog(`❌ ERROR in hasTopicBeenAnswered for "${topic}"`, error);
    return { answered: false, needsFollowUp: false, reason: 'Error occurred' };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ⏱️ PERFORMANCE MONITORING - Track total request time
  const requestStartTime = Date.now();

  try {
    const { userData, conversationHistory } = req.body;

    // 🚀 PHASE 1 OPTIMIZATION: Limit conversation history for performance
    const historyLimit = parseInt(process.env.CONVERSATION_HISTORY_LIMIT || '6');
    const limitedHistory = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.slice(-historyLimit)
      : conversationHistory;

    debugLog('=== NEW REQUEST ===', {
      userData,
      conversationHistoryLength: conversationHistory?.length || 0,
      limitedHistoryLength: limitedHistory?.length || 0,
      fullConversationHistory: limitedHistory
    });

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
    let maxQuestionsForStep = 2; // Default max questions per step

    // Define step boundaries and max questions per step
    // NOVICE-FRIENDLY: 10 questions total for basic idea capture with risk assessment
    const STEP_BOUNDARIES = {
      1: { min: 0, max: 2, name: 'Introduction', maxQuestions: 2 },
      2: { min: 2, max: 5, name: 'Business Case', maxQuestions: 3 },
      3: { min: 5, max: 7, name: 'Technical Details', maxQuestions: 2 },
      4: { min: 7, max: 8, name: 'Feasibility', maxQuestions: 1 },
      5: { min: 8, max: 10, name: 'Risk Assessment', maxQuestions: 2 },
    };

    // Check if we've reached the absolute maximum (10 questions = 100% complete)
    // This is appropriate for basic idea generation - enough detail for human reviewers to work with
    const isComplete = answeredQuestions.length >= 10;

    if (isComplete) {
      // Return completion signal instead of generating more questions
      debugLog('✅ COMPLETE - 10 questions reached (basic idea capture with risk assessment)', {
        totalQuestions: answeredQuestions.length,
        message: 'Conversation is complete with sufficient information for idea review'
      });
      return res.status(200).json({
        complete: true,
        message: 'Great work! You\'ve provided enough information for us to review your idea. A human expert will work with you to refine the details. Please review and submit your proposal.'
      });
    }

    // Determine current step (Steps 1-5 for basic idea capture with risk assessment)
    if (answeredQuestions.length >= 8) {
      currentStep = 5;
      stepName = 'Risk Assessment';
      maxQuestionsForStep = 2;
    } else if (answeredQuestions.length >= 7) {
      currentStep = 4;
      stepName = 'Feasibility';
      maxQuestionsForStep = 1;
    } else if (answeredQuestions.length >= 5) {
      currentStep = 3;
      stepName = 'Technical Details';
      maxQuestionsForStep = 2;
    } else if (answeredQuestions.length >= 2) {
      currentStep = 2;
      stepName = 'Business Case';
      maxQuestionsForStep = 3;
    } else {
      currentStep = 1;
      stepName = 'Introduction';
      maxQuestionsForStep = 2;
    }

    debugLog('📊 Step Analysis', {
      currentStep,
      stepName,
      totalQuestions: answeredQuestions.length,
      maxQuestionsForStep,
      isComplete
    });

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
    // ONLY check topics relevant to the current step
    console.log('🔍 Using LLM to check which topics have been answered...');
    debugLog('🔍 Starting LLM topic checks', { currentStep, stepName });

    // Track which topics need follow-up questions
    const needsFollowUp: string[] = [];

    // 🆕 SEMANTIC DUPLICATE DETECTION (Phase 1: Make this conditional for performance)
    // Check if the most recent user response is a semantic duplicate of any existing userData
    const enableSemanticCheck = process.env.ENABLE_SEMANTIC_DUPLICATE_CHECK === 'true';
    const lastUserResponse = limitedHistory && limitedHistory.length > 0
      ? limitedHistory.filter((m: any) => m.role === 'user').pop()?.content || ''
      : '';

    if (enableSemanticCheck && lastUserResponse && lastUserResponse.length > 0) {
      console.log('🔍 Running semantic duplicate analysis on latest user response...');
      const semanticCheckStartTime = Date.now();
      const semanticCheck = await isSemanticDuplicate(
        aiClient,
        modelName,
        lastUserResponse,
        userData
      );
      console.log(`⏱️ Semantic check took: ${Date.now() - semanticCheckStartTime}ms`);

      if (semanticCheck.isDuplicate) {
        console.warn(`⚠️ SEMANTIC DUPLICATE DETECTED: User response matches existing data`);
        console.warn(`   New response: "${lastUserResponse}"`);
        console.warn(`   Matches existing [${semanticCheck.matchedKey}]: "${semanticCheck.matchedValue}"`);
        console.warn(`   Reason: ${semanticCheck.reason}`);

        debugLog('⚠️ SEMANTIC DUPLICATE DETECTED', {
          newResponse: lastUserResponse,
          matchedKey: semanticCheck.matchedKey,
          matchedValue: semanticCheck.matchedValue,
          reason: semanticCheck.reason,
          action: 'Will ask clarifying question to get new information instead of accepting duplicate'
        });

        // Add to needsFollowUp to trigger a clarifying/refining question
        if (semanticCheck.matchedKey) {
          needsFollowUp.push(`${semanticCheck.matchedKey} (duplicate detected - need unique information)`);
        }
      } else {
        console.log('✅ User response is unique (not a semantic duplicate)');
        debugLog('✅ Semantic duplicate check passed', {
          newResponse: lastUserResponse,
          reason: semanticCheck.reason
        });
      }
    }

    // ONLY check Step 2 topics (Business Case) if we're in Step 2 or beyond
    // 🚀 PHASE 1: Use limited history for performance
    if (currentStep >= 2) {
      const topicCheckStartTime = Date.now();
      const businessProblemCheck = await hasTopicBeenAnswered(
        aiClient,
        modelName,
        'business problem or pain point this solution addresses',
        limitedHistory,
        userData
      );
      debugLog('Business Problem Check Result', businessProblemCheck);

      const targetUsersCheck = await hasTopicBeenAnswered(
        aiClient,
        modelName,
        'target users or intended users of the solution',
        limitedHistory,
        userData
      );
      debugLog('Target Users Check Result', targetUsersCheck);

      const expectedBenefitsCheck = await hasTopicBeenAnswered(
        aiClient,
        modelName,
        'expected benefits or outcomes of the solution',
        limitedHistory,
        userData
      );
      debugLog('Expected Benefits Check Result', expectedBenefitsCheck);
      console.log(`⏱️ All 3 topic checks took: ${Date.now() - topicCheckStartTime}ms`);

      // Build covered topics based on LLM analysis
      if (businessProblemCheck.answered) {
        coveredTopics.push('business problem', 'pain points', 'challenges', 'problem to solve');
        questionsSuggestedNext.push('target users', 'expected benefits');
        debugLog('✅ Business problem marked as COVERED');
      } else if (businessProblemCheck.needsFollowUp) {
        needsFollowUp.push('business problem');
        debugLog('🔄 Business problem needs FOLLOW-UP');
      } else {
        debugLog('❌ Business problem NOT answered yet');
      }

      if (targetUsersCheck.answered) {
        coveredTopics.push('target users', 'intended users', 'user groups');
        questionsSuggestedNext.push('expected benefits', 'success metrics');
        debugLog('✅ Target users marked as COVERED');
      } else if (targetUsersCheck.needsFollowUp) {
        needsFollowUp.push('target users');
        debugLog('🔄 Target users needs FOLLOW-UP');
      } else {
        debugLog('❌ Target users NOT answered yet');
      }

      if (expectedBenefitsCheck.answered) {
        coveredTopics.push('expected benefits', 'outcomes', 'value proposition');
        questionsSuggestedNext.push('success metrics', 'KPIs');
        debugLog('✅ Expected benefits marked as COVERED');
      } else if (expectedBenefitsCheck.needsFollowUp) {
        needsFollowUp.push('expected benefits');
        debugLog('🔄 Expected benefits needs FOLLOW-UP');
      } else {
        debugLog('❌ Expected benefits NOT answered yet');
      }
    } else {
      debugLog('⏭️ Skipping Step 2 topic checks - currently in Step 1 (Introduction)');
    }

    // 🆕 ADD ALL ANSWERED QUESTIONS TO COVERED TOPICS
    // This prevents asking about ANY topic that already has a value in userData
    // Previously we only tracked Step 2 topics, causing duplicate questions in Steps 3-5
    const answeredTopicKeys = Object.keys(userData).filter(key => {
      const value = userData[key];
      return value && String(value).trim().length > 0; // Only include non-empty values
    });

    // Add all answered topic keys to coveredTopics (in a user-friendly format)
    answeredTopicKeys.forEach(key => {
      // Convert kebab-case to readable format (e.g., "data-sources" → "data sources")
      const readableKey = key.replace(/-/g, ' ').replace(/_/g, ' ');
      if (!coveredTopics.includes(readableKey)) {
        coveredTopics.push(readableKey);
      }
    });

    debugLog('Final covered topics', coveredTopics);
    debugLog('Final needsFollowUp', needsFollowUp);
    debugLog('Final questionsSuggestedNext', questionsSuggestedNext);

    // Build conversation context for better awareness
    // 🚀 PHASE 1: Use limited history already sliced
    const conversationContext = limitedHistory && limitedHistory.length > 0
      ? `Recent conversation:
${limitedHistory.map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}`
      : '';

    // Analyze last response for quality and clarity needs
    // Note: lastUserResponse already defined above for semantic duplicate check (line 338), reusing it here
    const uncertaintyPhrases = [
      'not sure',
      'don\'t know',
      'do not know',
      'unsure',
      'no idea',
      'not certain',
      'unclear',
      'maybe',
      'i think',
      'not familiar',
      'need help',
      'suggest',
      'recommendation',
      'what would you recommend',
      'what do you suggest'
    ];

    const expressedUncertainty = lastUserResponse && uncertaintyPhrases.some(phrase =>
      lastUserResponse.toLowerCase().includes(phrase)
    );

    const needsClarification = lastUserResponse && (
      lastUserResponse.length < 30 ||
      expressedUncertainty
    );

    // Track if we're in recommendation mode (Steps 3, 4, 5 only)
    const isInTechnicalOrFeasibilityStep = currentStep >= 3; // Steps 3, 4, 5
    const shouldProvideRecommendations = expressedUncertainty && isInTechnicalOrFeasibilityStep;

    debugLog('🔍 User Response Analysis', {
      lastUserResponse,
      expressedUncertainty,
      needsClarification,
      isInTechnicalOrFeasibilityStep,
      shouldProvideRecommendations,
      currentStep,
      stepName
    });

    // Build prompt for question generation using GPT-5 structured format
    const prompt = `🚫 ABSOLUTE EXCLUSIONS - DO NOT ASK ABOUT THESE TOPICS (THEY ARE ALREADY ANSWERED):
${coveredTopics.length > 0 ?
`The following topics have been FULLY ANSWERED and must NOT be asked about again in ANY form:
${coveredTopics.map(t => `❌ ${t}`).join('\n')}

DO NOT ask about:
- Business problems, pain points, challenges, or problems to solve (if listed above)
- Target users, intended users, or user groups (if listed above)
- Expected benefits, outcomes, or value propositions (if listed above)
- Any variation or rephrasing of the above topics

If ANY of these topics appear in the exclusion list above, you are FORBIDDEN from asking about them.` :
'No topics excluded yet - proceed with the first question for this step.'}

---

<context>
User responses collected so far:
${JSON.stringify(userData, null, 2)}

${conversationContext}

Current Step: ${currentStep} of 5 - ${stepName}
Questions Asked: ${answeredQuestions.length}
Topics Needing Follow-Up: ${needsFollowUp.length > 0 ? needsFollowUp.join(', ') : 'None'}
Suggested Next Topics: ${questionsSuggestedNext.length > 0 ? questionsSuggestedNext.join(', ') : 'Continue with ' + stepName + ' questions'}

Last Response Quality: ${needsClarification ? 'May need clarification or more detail' : 'Clear and detailed'}
</context>

<task>
Generate exactly ONE focused question to advance this GenAI proposal.
Current focus area: ${stepName}

FOLLOW-UP PRIORITY:
${needsFollowUp.length > 0 ?
`🔄 IMPORTANT: The following topics need follow-up clarification before moving on:
${needsFollowUp.map(topic => {
  if (topic.includes('(duplicate detected')) {
    return `- ${topic.split(' (')[0]}: ⚠️ SEMANTIC DUPLICATE - User's last response is semantically similar to previously provided information. Ask a DIFFERENT question to get NEW unique information, do NOT rephrase the same question.`;
  }
  return `- ${topic}: User provided some information but it needs more detail or clarity`;
}).join('\n')}

${needsFollowUp.some(t => t.includes('(duplicate detected')) ?
`⚠️ SEMANTIC DUPLICATE DETECTED: The user's last answer is too similar to information already provided.
- DO NOT ask a follow-up on the same topic
- Instead, move to a COMPLETELY DIFFERENT topic
- Ask about something we haven't covered yet
- Example: If they repeated the idea description, ask about solution name or use case instead` :
`Your next question MUST be a follow-up on one of these topics to get a more complete answer.
Use phrases like:
- "Could you provide more detail about..."
- "To better understand the ${needsFollowUp[0]}, could you elaborate on..."
- "You mentioned [reference their answer], could you expand on..."
- "Help me understand more specifically about..."`}` :
`✓ No follow-ups needed - proceed to next logical topic from: ${questionsSuggestedNext.join(', ')}`}

🆘 UNCERTAINTY DETECTED / RECOMMENDATION MODE:
${shouldProvideRecommendations ?
`⚠️ USER EXPRESSED UNCERTAINTY: The user said they don't know, are not sure, or asked for suggestions.
RECOMMENDATION MODE ACTIVATED (Steps 3-5 only):
1. ANALYZE the conversation history to understand their project scope, use case, and complexity
2. PROVIDE 2-3 INTELLIGENT RECOMMENDATIONS tailored to their specific project
3. FORMAT as numbered options with clear descriptions
4. ALLOW user to either:
   - Select one option ("Option 2 sounds good")
   - Provide more context for better recommendations
   - Give their own answer if they have one
5. WAIT for user confirmation before moving to next question

Example pattern:
"Based on your [project details from conversation], I recommend:
1. **Option 1** - Description (best for X scenario)
2. **Option 2** - Description (good balance of Y and Z)
3. **Option 3** - Description (ideal for W situation)

Which option sounds best for your needs, or would you like suggestions based on different criteria?"

DO NOT move to the next question until user confirms a recommendation or provides their own answer.` :
needsClarification ?
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
- NEVER ask about topics in the ABSOLUTE EXCLUSIONS section at the top
- Ask about the next suggested topic: ${questionsSuggestedNext.length > 0 ? questionsSuggestedNext[0] : 'next logical topic in ' + stepName}
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
  - Ask ONE question about timeline or estimated effort
  - Keep it simple - novice users may not know technical details
  - Provide examples and accept "I'm not sure" as valid

Step 5 (Risk Assessment):
  - Ask SIMPLE questions about: potential challenges OR concerns (SEPARATELY)
  - Keep questions non-technical and easy to answer
  - Examples: "What challenges might come up?" or "Any concerns about this project?"
  - Accept "I don't know" or "None" as valid answers
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

    const systemPrompt = `You are helping someone quickly capture a basic AI idea. This is NOT a detailed requirements gathering - just enough info for an expert to review later.

CRITICAL - NOVICE-FRIENDLY APPROACH:
1. Ask SIMPLE, HIGH-LEVEL questions only - avoid technical details
2. NEVER ask for: schedules, shift times, tool names, specific software, technical specs
3. Accept "I don't know" as a valid answer - experts will figure out details later
4. Keep questions SHORT - one sentence max
5. Always provide 2-3 simple examples

EXAMPLES OF GOOD SIMPLE QUESTIONS:
✓ "Who will use this solution?" (NOT: "How many analysts, their shifts, tools, skill levels")
✓ "What problem does this solve?" (NOT: "Describe current process flows, pain points, error rates")
✓ "What data will it use?" (NOT: "Describe data schemas, storage systems, access patterns")

EXAMPLES OF BAD TECHNICAL QUESTIONS:
❌ "Could you provide details about shift schedules, tools they use, and skill levels?"
❌ "What specific data formats, schemas, and integration protocols?"
❌ "Describe the current technical architecture and dependencies?"

Remember: This is basic idea capture, not technical design. Keep it simple!

QUESTION FORMAT:
Return JSON with: id, text (with examples), type, category, required, helpText, exampleResponse, stepInfo`;

    debugLog('📝 COMPLETE SYSTEM PROMPT', systemPrompt);
    debugLog('📝 COMPLETE USER PROMPT', prompt);

    // ⏱️ PHASE 2: Enable streaming for faster perceived performance
    const questionGenStartTime = Date.now();

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Use the modelName already defined earlier for consistency
    const stream = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      stream: true, // Enable streaming
    });

    let fullResponse = '';
    let firstChunkTime = 0;

    for await (const chunk of stream) {
      if (!firstChunkTime) {
        firstChunkTime = Date.now() - questionGenStartTime;
        console.log(`⏱️ First token received in: ${firstChunkTime}ms`);
      }

      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    const questionGenTime = Date.now() - questionGenStartTime;
    console.log(`⏱️ Full response completed in: ${questionGenTime}ms`);

    debugLog('✨ RAW LLM RESPONSE', fullResponse);

    if (fullResponse) {
      const question = JSON.parse(fullResponse);
      debugLog('✨ PARSED LLM RESPONSE (Generated Question)', question);
      debugLog('📊 QUESTION TEXT BEING SENT TO USER', question.text);

      // ⏱️ PHASE 2: Log total request time
      const totalTime = Date.now() - requestStartTime;
      console.log(`⏱️ ===== TOTAL REQUEST TIME: ${totalTime}ms =====`);
      console.log(`⏱️ Performance breakdown:`, {
        firstTokenTime: `${firstChunkTime}ms`,
        fullResponseTime: `${questionGenTime}ms`,
        semanticCheckEnabled: enableSemanticCheck,
        topicChecksRan: currentStep >= 2,
        conversationHistoryLimited: limitedHistory?.length || 0,
        totalTime: `${totalTime}ms`
      });

      debugLog('⏱️ PERFORMANCE METRICS', {
        totalRequestTime: totalTime,
        firstTokenTime: firstChunkTime,
        questionGenerationTime: questionGenTime,
        semanticCheckEnabled: enableSemanticCheck,
        topicChecksRan: currentStep >= 2,
        historyLimit: historyLimit,
        actualHistoryLength: limitedHistory?.length || 0
      });

      // Send final complete question
      res.write(`data: ${JSON.stringify({ done: true, question })}\n\n`);
      res.end();
    } else {
      debugLog('❌ No response from LLM');
      res.write(`data: ${JSON.stringify({ error: 'No response from LLM' })}\n\n`);
      res.end();
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