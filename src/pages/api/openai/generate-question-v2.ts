/**
 * STATIC QUESTION FLOW WITH CRITERIA VALIDATION (Version 2)
 *
 * Performance Optimization: Eliminates 17-28s topic checking overhead by using static Q2-Q10 sequence
 * Quality Assurance: Adds criteria validation with max 2 follow-ups per question
 *
 * Key Changes from V1:
 * - ❌ REMOVED: 3 sequential topic checking LLM calls (lines 439-465 in v1) = -17-28s overhead
 * - ✅ ADDED: Static question sequence Q1-Q10 from questionCriteria.ts
 * - ✅ ADDED: Criteria validation after each user response
 * - ✅ ADDED: Follow-up question logic (max 2 per question)
 * - ✅ ADDED: "I don't know" AI assistance
 *
 * Expected Performance Gain: 60-70% faster (10-15s vs 27-43s)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { VALIDATED_QUESTIONS, getCriteriaForQuestion, QuestionCriteria } from '@/config/questionCriteria';

// Debug logging function
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `\n${'='.repeat(80)}\n[${timestamp}] ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n${'='.repeat(80)}\n`;

  const logPath = path.join(process.cwd(), 'llm-debug-v2.log');
  fs.appendFileSync(logPath, logMessage);
  console.log(logMessage);
};

// Initialize AI client based on mode
const getAIClient = () => {
  const mode = process.env.NEXT_PUBLIC_AI_MODE || 'static';

  if (mode === 'ollama') {
    return new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      apiKey: process.env.OLLAMA_API_KEY || 'ollama',
    });
  } else if (mode === 'openai') {
    return new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return null;
};

/**
 * Validates user response against question criteria
 * Returns which criteria are met and which are missing
 */
async function validateResponseCriteria(
  aiClient: OpenAI,
  modelName: string,
  userResponse: string,
  criteria: QuestionCriteria
): Promise<{ allMet: boolean; metCriteria: string[]; missingCriteria: string[]; reason: string }> {

  // Check for "I don't know" escape hatch
  const uncertaintyPhrases = [
    "i don't know",
    "not sure",
    "don't know",
    "do not know",
    "unsure",
    "no idea",
    "not certain",
    "unclear"
  ];

  const isUncertain = uncertaintyPhrases.some(phrase =>
    userResponse.toLowerCase().includes(phrase)
  );

  if (isUncertain) {
    return {
      allMet: false,
      metCriteria: [],
      missingCriteria: criteria.criteria,
      reason: 'User expressed uncertainty - needs AI assistance'
    };
  }

  const prompt = `Evaluate if the user's response meets all the specified criteria for this question.

**QUESTION**: ${criteria.question}

**USER RESPONSE**: "${userResponse}"

**REQUIRED CRITERIA**:
${criteria.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**EXAMPLE OF GOOD RESPONSE**:
"${criteria.exampleResponse}"

**EVALUATION TASK**:
Check if the user's response addresses EACH criterion. Be strict but fair:
- ✅ Met: The response clearly addresses this criterion with sufficient detail
- ❌ Missing: The response does not address this criterion or is too vague

Return JSON format:
{
  "allMet": true or false,
  "metCriteria": ["criterion 1 text if met", "criterion 2 text if met"],
  "missingCriteria": ["criterion 1 text if missing", "criterion 3 text if missing"],
  "reason": "Brief explanation (1-2 sentences)"
}`;

  try {
    debugLog(`🔍 Criteria Validation for question: ${criteria.questionId}`, {
      userResponse,
      criteria: criteria.criteria
    });

    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at evaluating if responses meet specific criteria. Be thorough but fair in your evaluation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const rawResponse = response.choices[0]?.message?.content || '{"allMet": false, "metCriteria": [], "missingCriteria": [], "reason": "No response"}';
    debugLog(`✨ Criteria Validation Result`, rawResponse);

    const result = JSON.parse(rawResponse);
    return result;
  } catch (error) {
    console.error('Error in criteria validation:', error);
    debugLog(`❌ ERROR in validateResponseCriteria`, error);
    return {
      allMet: false,
      metCriteria: [],
      missingCriteria: criteria.criteria,
      reason: 'Error occurred during validation'
    };
  }
}

/**
 * Generates AI-assisted answer when user says "I don't know"
 */
async function generateAIAssistedAnswer(
  aiClient: OpenAI,
  modelName: string,
  criteria: QuestionCriteria,
  userData: Record<string, any>,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {

  const prompt = `The user said they don't know how to answer this question. Based on the conversation context, generate a suggested answer for them.

**QUESTION**: ${criteria.question}

**CRITERIA TO ADDRESS**:
${criteria.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**EXAMPLE RESPONSE**:
"${criteria.exampleResponse}"

**CONTEXT FROM CONVERSATION**:
Previous idea: ${userData.idea_description || userData.idea_name || 'N/A'}
${Object.entries(userData).map(([k, v]) => `${k}: ${v}`).join('\n')}

**TASK**:
Generate a suggested answer that:
1. Addresses all criteria based on the conversation context
2. Is specific and actionable (not generic)
3. Uses "you could" or "consider" language
4. Provides 2-3 concrete suggestions

Return JSON format:
{
  "suggestion": "Your suggested answer text here"
}`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that provides specific, actionable suggestions based on conversation context.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const rawResponse = response.choices[0]?.message?.content || '{"suggestion": "Based on your idea, consider starting with a proof of concept to validate the approach."}';
    const result = JSON.parse(rawResponse);
    return result.suggestion;
  } catch (error) {
    console.error('Error generating AI-assisted answer:', error);
    return 'Based on your idea, I recommend starting with a proof of concept to validate feasibility before full implementation.';
  }
}

/**
 * Generates a follow-up question to get missing criteria
 */
async function generateFollowUpQuestion(
  aiClient: OpenAI,
  modelName: string,
  criteria: QuestionCriteria,
  missingCriteria: string[],
  userResponse: string,
  followUpCount: number
): Promise<any> {

  const isLastFollowUp = followUpCount >= criteria.maxFollowUps;

  const prompt = `Generate a follow-up question to get more complete information.

**ORIGINAL QUESTION**: ${criteria.question}

**USER'S RESPONSE**: "${userResponse}"

**MISSING CRITERIA** (need to address):
${missingCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

**FOLLOW-UP COUNT**: ${followUpCount} of ${criteria.maxFollowUps} max

${isLastFollowUp ?
`⚠️ THIS IS THE FINAL FOLLOW-UP: Be more direct and explicit about what's needed.` :
`This is follow-up ${followUpCount}. Ask for the missing information in a friendly, conversational way.`}

**TASK**:
Generate ONE focused follow-up question that:
1. References what they already said ("You mentioned...")
2. Asks specifically for the missing criteria
3. Provides helpful examples
4. Is friendly and encouraging

Return JSON format:
{
  "id": "${criteria.questionId}-followup-${followUpCount}",
  "text": "Your follow-up question with examples",
  "type": "text",
  "category": "${VALIDATED_QUESTIONS[criteria.questionId]?.category || 'business'}",
  "required": true,
  "helpText": "Brief guidance about what we still need",
  "exampleResponse": "Example of a complete answer",
  "stepInfo": "Follow-up question ${followUpCount} of ${criteria.maxFollowUps}"
}`;

  try {
    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that asks clarifying follow-up questions in a friendly, conversational way.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const rawResponse = response.choices[0]?.message?.content || '{}';
    return JSON.parse(rawResponse);
  } catch (error) {
    console.error('Error generating follow-up question:', error);
    return {
      id: `${criteria.questionId}-followup-${followUpCount}`,
      text: `Could you provide more detail about ${missingCriteria[0].toLowerCase()}?`,
      type: 'text',
      category: 'business',
      required: true,
      helpText: criteria.helpText,
      exampleResponse: criteria.exampleResponse,
      stepInfo: `Follow-up question ${followUpCount} of ${criteria.maxFollowUps}`
    };
  }
}

/**
 * Gets the next static question from the sequence
 */
function getNextStaticQuestion(currentQuestionNumber: number): any {
  const nextQuestionNumber = currentQuestionNumber + 1;

  if (nextQuestionNumber > 11) {
    return null; // Conversation complete
  }

  const criteria = getCriteriaForQuestion(nextQuestionNumber);

  if (!criteria) {
    // Q1 is the welcome message, handled separately
    return null;
  }

  return {
    id: criteria.questionId,
    text: criteria.question,
    type: 'text',
    category: nextQuestionNumber <= 5 ? 'business' : nextQuestionNumber <= 7 ? 'technical' : nextQuestionNumber <= 8 ? 'feasibility' : 'risk',
    required: true,
    helpText: criteria.helpText,
    exampleResponse: criteria.exampleResponse,
    stepInfo: `Question ${nextQuestionNumber} of 11`,
    criteria: criteria.criteria,
    maxFollowUps: criteria.maxFollowUps
  };
}

/**
 * Helper: Save user answer to the correct userData field based on question mapping
 */
function saveAnswerToUserData(
  userData: Record<string, any>,
  questionCriteria: QuestionCriteria | null,
  userAnswer: string,
  questionNumber: number
): Record<string, any> {
  if (!questionCriteria) return userData;

  const updatedData = { ...userData };

  // Map question ID to data fields
  // dbField format: "field1, field2" or "field1"
  const dbFields = questionCriteria.dbField.split(',').map(f => f.trim());

  // Special handling for each question
  switch (questionCriteria.questionId) {
    case 'solution-name':
      // Maps to opportunity_name + solution_name
      updatedData.opportunity_name = userAnswer;
      updatedData.solution_name = userAnswer;
      updatedData['solution-name'] = userAnswer;
      break;

    case 'business-problem':
      // Maps to problem_statement + current_process_issues
      // Accumulate all responses (main + follow-ups) for this question
      const existingBusinessProblem = updatedData.business_problem || '';
      const combinedBusinessProblem = existingBusinessProblem
        ? `${existingBusinessProblem} ${userAnswer}`
        : userAnswer;

      updatedData.problem_statement = combinedBusinessProblem;
      updatedData.current_process_issues = combinedBusinessProblem;
      updatedData.business_problem = combinedBusinessProblem;  // Legacy compatibility
      updatedData.problem = combinedBusinessProblem;  // Legacy compatibility
      break;

    case 'ai-solution':
      // Maps to ai_solution_approach + improvement_description
      // Accumulate responses
      const existingAISolution = updatedData['ai-solution'] || '';
      const combinedAISolution = existingAISolution ? `${existingAISolution} ${userAnswer}` : userAnswer;

      updatedData.ai_solution_approach = combinedAISolution;
      updatedData.improvement_description = combinedAISolution;
      updatedData['ai-solution'] = combinedAISolution;
      break;

    case 'target-users-impact':
      // Maps to target_users + core_kpis + efficiency_metrics
      // Accumulate responses
      const existingTargetUsers = updatedData['target-users-impact'] || '';
      const combinedTargetUsers = existingTargetUsers ? `${existingTargetUsers} ${userAnswer}` : userAnswer;

      updatedData.target_users = combinedTargetUsers;
      updatedData.core_kpis = combinedTargetUsers;
      updatedData.efficiency_metrics = combinedTargetUsers;
      updatedData['target-users-impact'] = combinedTargetUsers;
      break;

    case 'data-sources':
      // Maps to data_availability + data_availability_rationale
      // Accumulate responses
      const existingDataSources = updatedData['data-sources'] || '';
      const combinedDataSources = existingDataSources ? `${existingDataSources} ${userAnswer}` : userAnswer;

      updatedData.data_availability = combinedDataSources;
      updatedData.data_availability_rationale = combinedDataSources;
      updatedData['data-sources'] = combinedDataSources;
      break;

    case 'technical-feasibility':
      // Maps to can_we_execute + can_we_execute_rationale + integration_capability
      // Accumulate responses
      const existingFeasibility = updatedData['technical-feasibility'] || '';
      const combinedFeasibility = existingFeasibility ? `${existingFeasibility} ${userAnswer}` : userAnswer;

      updatedData.can_we_execute = combinedFeasibility;
      updatedData.can_we_execute_rationale = combinedFeasibility;
      updatedData.integration_capability = combinedFeasibility;
      updatedData.technical_feasibility = combinedFeasibility;
      updatedData['technical-feasibility'] = combinedFeasibility;
      break;

    case 'timeline-investment':
      // Maps to investment_timeline + investment_people + investment_cost
      // Accumulate responses
      const existingInvestment = updatedData['timeline-investment'] || '';
      const combinedInvestment = existingInvestment ? `${existingInvestment} ${userAnswer}` : userAnswer;

      updatedData.investment_timeline = combinedInvestment;
      updatedData.investment_people = combinedInvestment;
      updatedData.investment_cost = combinedInvestment;
      updatedData['timeline-investment'] = combinedInvestment;
      break;

    case 'risks':
      // Maps to risks_list
      // Accumulate responses
      const existingRisks = updatedData.risks || '';
      const combinedRisks = existingRisks ? `${existingRisks} ${userAnswer}` : userAnswer;

      updatedData.risks_list = combinedRisks;
      updatedData.risks = combinedRisks;
      break;

    case 'mitigation':
      // Maps to mitigation_strategies
      // Accumulate responses
      const existingMitigation = updatedData.mitigation || '';
      const combinedMitigation = existingMitigation ? `${existingMitigation} ${userAnswer}` : userAnswer;

      updatedData.mitigation_strategies = combinedMitigation;
      updatedData.mitigation = combinedMitigation;
      break;

    case 'build-buy-partner':
      // Maps to overall_approach + approach_rationale
      // Accumulate responses
      const existingApproach = updatedData['build-buy-partner'] || '';
      const combinedApproach = existingApproach ? `${existingApproach} ${userAnswer}` : userAnswer;

      updatedData.overall_approach = combinedApproach;
      updatedData.approach_rationale = combinedApproach;
      updatedData['build-buy-partner'] = combinedApproach;
      break;

    default:
      // Fallback: save to question ID
      updatedData[questionCriteria.questionId] = userAnswer;
  }

  return updatedData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestStartTime = Date.now();

  try {
    let { userData, conversationHistory, currentQuestionNumber, followUpCount } = req.body;

    debugLog('=== NEW REQUEST (V2 - STATIC QUESTIONS) ===', {
      userData,
      currentQuestionNumber,
      followUpCount,
      conversationHistoryLength: conversationHistory?.length || 0
    });

    const mode = process.env.NEXT_PUBLIC_AI_MODE || 'static';
    const aiClient = getAIClient();
    const modelName = mode === 'ollama'
      ? (process.env.OLLAMA_MODEL || 'gpt-oss:20b')
      : (process.env.OPENAI_MODEL || 'gpt-5');

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

    // Check if we're complete (all 11 questions answered and validated)
    if (currentQuestionNumber >= 11) {
      debugLog('✅ COMPLETE - All 11 questions answered', {
        totalQuestions: currentQuestionNumber
      });
      return res.status(200).json({
        complete: true,
        message: 'Great work! You\'ve provided all the information we need. Please review and submit your proposal.'
      });
    }

    // Get the most recent user response
    const lastUserResponse = conversationHistory && conversationHistory.length > 0
      ? conversationHistory.filter((m: any) => m.role === 'user').pop()?.content || ''
      : '';

    // Determine current question criteria
    const currentCriteria = getCriteriaForQuestion(currentQuestionNumber);

    // ⚠️ CRITICAL: Save the user's answer to the correct userData fields BEFORE validation
    if (lastUserResponse) {
      if (currentCriteria) {
        // Questions 2-10 with criteria
        userData = saveAnswerToUserData(userData, currentCriteria, lastUserResponse, currentQuestionNumber);
        debugLog('💾 Saved answer to userData', {
          questionId: currentCriteria.questionId,
          dbFields: currentCriteria.dbField,
          updatedUserData: userData
        });
      } else if (currentQuestionNumber === 1) {
        // Question 1: idea_description (no criteria, handled in welcome message)
        userData.idea_description = lastUserResponse;
        userData.solution_name = lastUserResponse.split('.')[0].trim();  // Extract name from first sentence
        userData.idea_name = lastUserResponse.split('.')[0].trim();
        debugLog('💾 Saved Q1 (idea_description) to userData', {
          idea_description: lastUserResponse,
          solution_name: userData.solution_name
        });
      }
    }

    // If we have a user response, validate it against criteria
    if (lastUserResponse && currentCriteria && followUpCount !== undefined) {
      // Check if we've already reached max follow-ups BEFORE validating
      const currentFollowUpCount = followUpCount || 0;

      if (currentFollowUpCount >= currentCriteria.maxFollowUps) {
        // Max follow-ups reached - accept answer and move to next question WITHOUT validation
        debugLog('✅ Max follow-ups reached - accepting answer and moving forward WITHOUT further validation', {
          questionId: currentCriteria.questionId,
          followUpCount: currentFollowUpCount
        });

        // Return next question
        const nextQuestion = getNextStaticQuestion(currentQuestionNumber);

        if (!nextQuestion) {
          return res.status(200).json({
            complete: true,
            message: 'Great work! You\'ve provided all the information we need. Please review and submit your proposal.',
            userData  // Return updated userData
          });
        }

        const totalTime = Date.now() - requestStartTime;
        console.log(`⏱️ ===== TOTAL REQUEST TIME: ${totalTime}ms =====`);

        return res.status(200).json({
          question: nextQuestion,
          validationPassed: false,
          maxFollowUpsReached: true,
          currentQuestionNumber: currentQuestionNumber + 1,
          followUpCount: 0,
          userData  // Return updated userData
        });
      }

      // Only validate if we haven't reached max follow-ups yet
      debugLog('🔍 Validating user response against criteria', {
        questionId: currentCriteria.questionId,
        followUpCount,
        maxFollowUps: currentCriteria.maxFollowUps
      });

      // Get the accumulated answer for this question (not just the last response)
      const accumulatedAnswer = userData[currentCriteria.questionId] ||
                                userData[currentCriteria.dbField.split(',')[0].trim()] ||
                                lastUserResponse;

      const validationStartTime = Date.now();
      const validation = await validateResponseCriteria(
        aiClient,
        modelName,
        accumulatedAnswer, // Validate the FULL accumulated answer, not just the latest response
        currentCriteria
      );
      console.log(`⏱️ Criteria validation took: ${Date.now() - validationStartTime}ms`);

      debugLog('📊 Validation Result', validation);

      // Check if user said "I don't know" and needs AI assistance
      if (!validation.allMet && validation.reason.includes('uncertainty')) {
        debugLog('🆘 User needs AI assistance');

        const aiSuggestion = await generateAIAssistedAnswer(
          aiClient,
          modelName,
          currentCriteria,
          userData,
          conversationHistory
        );

        return res.status(200).json({
          needsAIAssistance: true,
          suggestion: aiSuggestion,
          criteria: currentCriteria.criteria,
          exampleResponse: currentCriteria.exampleResponse,
          helpText: "I generated a suggestion based on your idea. You can use this as-is, modify it, or provide your own answer.",
          userData  // Return updated userData to keep frontend in sync
        });
      }

      // Check if criteria are met
      if (!validation.allMet) {
        // Generate follow-up question (we know we haven't reached max yet because of earlier check)
        debugLog('🔄 Generating follow-up question', {
          missingCriteria: validation.missingCriteria,
          followUpCount: currentFollowUpCount + 1
        });

        const followUpQuestion = await generateFollowUpQuestion(
          aiClient,
          modelName,
          currentCriteria,
          validation.missingCriteria,
          lastUserResponse,
          currentFollowUpCount + 1
        );

        const totalTime = Date.now() - requestStartTime;
        console.log(`⏱️ ===== TOTAL REQUEST TIME: ${totalTime}ms =====`);

        return res.status(200).json({
          question: followUpQuestion,
          isFollowUp: true,
          currentQuestionNumber,
          followUpCount: currentFollowUpCount + 1,
          missingCriteria: validation.missingCriteria,
          userData  // Return updated userData
        });
      }

      // Criteria met - move to next question
      debugLog('✅ All criteria met - moving to next question');
    }

    // Get next static question
    const nextQuestion = getNextStaticQuestion(currentQuestionNumber);

    if (!nextQuestion) {
      return res.status(200).json({
        complete: true,
        message: 'Great work! Please review and submit your proposal.',
        userData  // Return updated userData
      });
    }

    const totalTime = Date.now() - requestStartTime;
    console.log(`⏱️ ===== TOTAL REQUEST TIME: ${totalTime}ms =====`);
    debugLog('⏱️ PERFORMANCE METRICS (V2)', {
      totalRequestTime: totalTime,
      topicCheckingRemoved: true,
      expectedSpeedup: '60-70% faster than V1'
    });

    return res.status(200).json({
      question: nextQuestion,
      currentQuestionNumber: nextQuestion.id === 'idea-description' ? 1 : currentQuestionNumber + 1,
      followUpCount: 0,
      userData  // Return updated userData
    });

  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Failed to generate question',
      message: error?.message || 'Unknown error occurred'
    });
  }
}
