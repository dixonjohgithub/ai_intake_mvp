# V2 Static Question Flow - Implementation Guide

## Overview

This document describes how to integrate the new V2 API endpoint (`/api/openai/generate-question-v2`) into the frontend. The V2 API eliminates the 17-28s topic checking overhead while adding criteria validation for quality assurance.

## Performance Improvement

| Metric | V1 (Current) | V2 (New) | Improvement |
|--------|--------------|----------|-------------|
| Topic Checking | 17-28s (3 LLM calls) | 0s (removed) | **-100%** |
| Question Generation | 10-15s (LLM) | 0s (static) | **-100%** |
| Criteria Validation | N/A | 3-5s (1 LLM call) | New feature |
| **Total Request Time** | **27-43s** | **8-10s** | **60-70% faster** |

---

## API Changes

### V1 API (Current): `/api/openai/generate-question`

```typescript
// Request
POST /api/openai/generate-question
{
  userData: Record<string, any>,
  conversationHistory: Array<{ role: string, content: string }>
}

// Response (Streaming SSE)
data: {"chunk": "..."}
data: {"chunk": "..."}
data: {"done": true, "question": {...}}
```

**Problems:**
- 3 sequential topic checking calls = 17-28s
- Dynamic question generation = 10-15s
- Total: 27-43 seconds per question

### V2 API (New): `/api/openai/generate-question-v2`

```typescript
// Request
POST /api/openai/generate-question-v2
{
  userData: Record<string, any>,
  conversationHistory: Array<{ role: string, content: string }>,
  currentQuestionNumber: number,  // NEW: Tracks Q1-Q10
  followUpCount?: number           // NEW: Tracks follow-ups (0-2)
}

// Response (JSON)
{
  question: {
    id: string,
    text: string,
    type: string,
    category: string,
    required: boolean,
    helpText: string,
    exampleResponse: string,
    stepInfo: string,
    criteria: string[],        // NEW: Validation criteria
    maxFollowUps: number        // NEW: Max follow-ups allowed
  },
  currentQuestionNumber: number,
  followUpCount: number,
  isFollowUp?: boolean,          // NEW: Is this a follow-up question?
  missingCriteria?: string[],    // NEW: Which criteria weren't met
  validationPassed?: boolean,
  maxFollowUpsReached?: boolean,
  needsAIAssistance?: boolean,   // NEW: User said "I don't know"
  suggestion?: string,           // NEW: AI-generated suggestion
  complete?: boolean             // All 10 questions answered
}
```

**Benefits:**
- No topic checking (saves 17-28s)
- Static questions (saves 10-15s)
- Criteria validation (adds 3-5s but ensures quality)
- Total: 8-10 seconds per question

---

## Required Frontend Changes

### 1. Add New State Variables

In `ConversationalFlowDual.tsx`, add:

```typescript
// Add to component state (around line 55-70)
const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
const [followUpCount, setFollowUpCount] = useState(0);
const [isFollowUp, setIsFollowUp] = useState(false);
const [missingCriteria, setMissingCriteria] = useState<string[]>([]);
```

### 2. Create New API Client Function

Add to `/src/lib/ai/apiClient.ts`:

```typescript
/**
 * Generate next question using V2 static question flow (60-70% faster)
 */
export async function generateQuestionV2(
  userData: Record<string, any>,
  conversationHistory: Array<{ role: string; content: string }>,
  currentQuestionNumber: number,
  followUpCount: number = 0
): Promise<any> {
  try {
    const payload = {
      userData,
      conversationHistory,
      currentQuestionNumber,
      followUpCount
    };

    console.log('📤 CLIENT → API V2: Sending request to /api/openai/generate-question-v2');
    console.log('📊 Payload:', {
      userDataKeys: Object.keys(userData),
      currentQuestionNumber,
      followUpCount,
      historyLength: conversationHistory?.length || 0
    });

    const response = await fetch('/api/openai/generate-question-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('❌ API V2 error response');
      return null;
    }

    const data = await response.json();
    console.log('📥 API V2 → CLIENT: Received response', data);
    return data;
  } catch (error) {
    console.error('💥 Failed to generate question V2:', error);
    return null;
  }
}
```

### 3. Update `processUserResponse` Function

In `ConversationalFlowDual.tsx`, replace the V1 API call (lines 434-533) with:

```typescript
const processUserResponse = async () => {
  try {
    if (useAI && conversationManager) {
      // Build conversation history
      const conversationHistory = messagesRef.current
        .filter(msg => msg.type !== 'system')
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // Call V2 API with question number and follow-up count
      const { generateQuestionV2 } = await import('@/lib/ai/apiClient');
      const response = await generateQuestionV2(
        userData,
        conversationHistory,
        currentQuestionNumber,
        followUpCount
      );

      // Handle completion
      if (response?.complete) {
        console.log('✅ Conversation complete - 10 questions answered');
        addMessage('assistant', response.message || 'You have completed all questions!');
        handleCompletion();
        return;
      }

      // Handle "I don't know" - AI assistance
      if (response?.needsAIAssistance) {
        const suggestionMsg = `I understand you're not sure. Based on your idea, here's a suggestion:\n\n${response.suggestion}\n\nYou can:\n- Use this suggestion as-is\n- Modify it to fit your needs\n- Provide your own answer`;
        addMessage('assistant', suggestionMsg);
        return; // Wait for user to accept/modify
      }

      // Handle follow-up question
      if (response?.isFollowUp) {
        console.log('🔄 Follow-up question needed', {
          followUpCount: response.followUpCount,
          missingCriteria: response.missingCriteria
        });

        setFollowUpCount(response.followUpCount);
        setIsFollowUp(true);
        setMissingCriteria(response.missingCriteria || []);

        // Add follow-up message
        const followUpMsg = `${response.question.text}\n\n💡 **What I still need:**\n${response.missingCriteria?.map(c => `• ${c}`).join('\n')}`;
        addMessage('assistant', followUpMsg);
        setCurrentQuestionId(response.question.id);
        return;
      }

      // Move to next question (criteria met OR max follow-ups reached)
      if (response?.question) {
        setCurrentQuestionNumber(response.currentQuestionNumber);
        setFollowUpCount(0);
        setIsFollowUp(false);
        setMissingCriteria([]);

        // Update progress
        const overallProgress = Math.round((response.currentQuestionNumber / 10) * 100);
        const stepNum = response.currentQuestionNumber <= 2 ? 1 :
                        response.currentQuestionNumber <= 4 ? 2 :
                        response.currentQuestionNumber <= 6 ? 3 :
                        response.currentQuestionNumber <= 7 ? 4 : 5;

        if (onProgressUpdate) {
          onProgressUpdate(stepNum, overallProgress);
        }

        // Format question with criteria
        let questionText = `[${response.question.stepInfo}]\n\n${response.question.text}`;

        if (response.question.criteria && response.question.criteria.length > 0) {
          questionText += `\n\n📋 **Please include:**\n${response.question.criteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}`;
        }

        if (response.question.exampleResponse) {
          questionText += `\n\n💡 **Example Response:**\n"${response.question.exampleResponse}"`;
        }

        addMessage('assistant', questionText);
        setCurrentQuestionId(response.question.id);
      }
    } else {
      // Static mode fallback (existing logic)
      const nextQuestion = getNextQuestion(currentQuestionId);
      // ... keep existing static mode logic
    }
  } catch (error) {
    console.error('Error processing response:', error);
    // ... keep existing error handling
  }
};
```

### 4. Update Welcome Message

In `ConversationalFlowDual.tsx`, update the welcome message (around line 627) to reflect Q1-Q10:

```typescript
const welcomeMsg = `Welcome to the GenAI Idea Assistant! (${modeString} Mode)

I'll help you capture your generative AI idea through 10 focused questions:

• Q1-Q4: Business Case (Problem, Solution, Users, Impact)
• Q5-Q6: Technical Feasibility (Data, Capabilities)
• Q7: Investment (Timeline, Budget, Team)
• Q8-Q9: Risk Management (Challenges, Mitigation)
• Q10: Build/Buy/Partner Decision

Each question has specific criteria. I'll ask follow-ups (max 2) if needed to ensure complete answers.

[Question 1 of 10]

Let's start! What GenAI solution do you want to build? (Describe in 2-3 sentences)`;
```

### 5. Store Question Responses with Proper Keys

Update user data storage (around line 391) to map to data dictionary fields:

```typescript
// Map question IDs to data dictionary fields
const questionKeyMapping: Record<string, string> = {
  'business-problem': 'problem_statement',
  'ai-solution': 'ai_solution_approach',
  'target-users-impact': 'target_users',
  'data-sources': 'data_availability',
  'technical-feasibility': 'can_we_execute',
  'timeline-investment': 'investment_timeline',
  'risks': 'risks_list',
  'mitigation': 'mitigation_strategies',
  'build-buy-partner': 'overall_approach'
};

const storageKey = questionKeyMapping[currentQuestionId] || currentQuestionId;
setUserData(prev => ({
  ...prev,
  [storageKey]: userMessage
}));
```

---

## Testing Checklist

### Performance Testing

1. **Measure V1 Performance (Baseline)**
   ```bash
   # Start with V1 endpoint (current)
   # Complete 10 questions, note average time per question
   # Expected: 27-43 seconds per question
   ```

2. **Measure V2 Performance**
   ```bash
   # Switch to V2 endpoint
   # Complete 10 questions, note average time per question
   # Expected: 8-10 seconds per question
   # Improvement: 60-70% faster
   ```

### Functional Testing

1. **Happy Path - All Criteria Met**
   - Answer each question completely
   - Verify no follow-ups needed
   - Complete all 10 questions
   - Verify CSV export has all 39 fields

2. **Follow-Up Flow - Incomplete Answers**
   - Give vague answer (e.g., "classify logs")
   - Verify follow-up question generated
   - Answer follow-up with more detail
   - Verify moves to next question

3. **Max Follow-Ups Reached**
   - Give vague answer
   - Give vague follow-up answer
   - Give vague second follow-up answer
   - Verify system accepts and moves forward

4. **"I Don't Know" Flow**
   - Answer with "I'm not sure"
   - Verify AI suggestion is generated
   - Accept suggestion
   - Verify stored and moves forward

### Data Integrity Testing

1. **CSV Export Validation**
   - Complete full conversation
   - Export to CSV
   - Verify all 39 columns populated
   - Check for "TBD" or empty fields (should be minimal)

2. **Data Dictionary Mapping**
   - Verify Q2 → problem_statement
   - Verify Q3 → ai_solution_approach
   - Verify Q4 → target_users, core_kpis
   - Verify Q5 → data_availability
   - Verify Q6 → can_we_execute
   - Verify Q7 → investment_timeline, investment_people, investment_cost
   - Verify Q8 → risks_list
   - Verify Q9 → mitigation_strategies
   - Verify Q10 → overall_approach

---

## Environment Configuration

To enable V2 API, ensure your `.env` file has:

```bash
# AI Mode (ollama | openai | static)
NEXT_PUBLIC_AI_MODE=ollama

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=gpt-oss:20b
OLLAMA_API_KEY=ollama

# OpenAI Configuration (if using openai mode)
# OPENAI_API_KEY=your_key_here
# OPENAI_MODEL=gpt-4
```

---

## Rollback Plan

If issues arise with V2, you can instantly rollback:

1. **Keep V1 Endpoint Active** - Don't delete `/api/openai/generate-question.ts`
2. **Toggle in Frontend** - Change import from `generateQuestionV2` back to `generateQuestion`
3. **Zero Downtime** - Both endpoints coexist, switch with 1-line code change

---

## Next Steps After Frontend Integration

1. **Create CSV Append API** (`/api/data/submit-idea.ts`)
   - Calls `generateAllRecommendations()` at conversation end
   - Uses `conversationToCSVRow()` to map all 39 fields
   - Appends to `dummy_data.csv`

2. **Update Review Page** to call recommendation generator before PDF export

3. **End-to-End Testing** with real conversation data

4. **Performance Benchmarking** to confirm 60-70% improvement

---

## Files Created

- ✅ `/src/pages/api/openai/generate-question-v2.ts` (416 lines) - New V2 API endpoint
- ✅ `/src/config/questionCriteria.ts` (210 lines) - Question criteria configuration
- ✅ `/src/lib/data/csvMapper.ts` (442 lines) - Complete CSV mapping (39 fields)
- ✅ `/src/lib/ai/recommendationGenerator.ts` (231 lines) - AI recommendations generator
- ✅ `/IMPLEMENTATION_V2_GUIDE.md` - This integration guide

## Files to Modify

- ⏳ `/src/lib/ai/apiClient.ts` - Add `generateQuestionV2()` function
- ⏳ `/src/components/ConversationalFlowDual.tsx` - Update state and API calls
- ⏳ `/src/pages/api/data/submit-idea.ts` - Create CSV append endpoint

---

## Questions?

Refer to the implementation files for detailed code examples and comments.
