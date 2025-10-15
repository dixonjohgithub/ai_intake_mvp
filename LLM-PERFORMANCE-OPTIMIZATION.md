# LLM Performance Optimization Plan

**Date:** 2025-10-14
**Issue:** Local Ollama LLM responses taking 40-70 seconds per question
**Goal:** Reduce response time to under 10 seconds

---

## Current Performance Issues

### 1. Multiple Sequential LLM Calls (BIGGEST ISSUE)
**Problem:** Every API request makes 4-5 separate LLM calls:
- 1× `isSemanticDuplicate()` - Checks if user response is duplicate
- 3× `hasTopicBeenAnswered()` - Checks if business problem, target users, and expected benefits are answered
- 1× Main question generation

**Impact:**
- If each call takes 10-15 seconds, total = 40-75 seconds
- Calls are sequential (not parallel), so they compound

**Current Flow:**
```
Request → isSemanticDuplicate (10s) → hasTopicBeenAnswered #1 (10s)
        → hasTopicBeenAnswered #2 (10s) → hasTopicBeenAnswered #3 (10s)
        → Generate Question (15s) = 55 seconds total
```

### 2. Massive Prompts
**Problem:** System prompt is 1,000+ lines with:
- Detailed examples for every step
- Comprehensive instructions for recommendation mode
- Multiple redundant rule sections

**Impact:**
- Local LLM must process huge context window
- Increases token count and processing time

### 3. Full Conversation History
**Problem:** Passing entire conversation history to every LLM call

**Impact:**
- As conversation grows (15+ messages), context window grows exponentially
- More tokens to process = slower responses

---

## Optimization Solutions

### Solution 1: **DISABLE Semantic Duplicate Detection (Quick Win)**

**Impact:** Eliminates 1 LLM call = **Save 10-15 seconds**

**Trade-off:** May occasionally accept duplicate responses (acceptable for MVP)

**Implementation:**
```typescript
// Add to .env
ENABLE_SEMANTIC_DUPLICATE_CHECK=false  # Disable for performance

// Modify generate-question.ts
const enableSemanticCheck = process.env.ENABLE_SEMANTIC_DUPLICATE_CHECK === 'true';

if (enableSemanticCheck && lastUserResponse && lastUserResponse.length > 0) {
  // ... existing semantic check code
}
```

---

### Solution 2: **DISABLE Topic Checking for Step 1 (Quick Win)**

**Impact:** Eliminates 3 LLM calls in Step 1 = **Save 30-40 seconds in Step 1**

**Rationale:** Step 1 (Introduction) doesn't need business case topic checks

**Implementation:**
```typescript
// Already exists but can be optimized
if (currentStep >= 2) {
  // ONLY run topic checks for Step 2+
  // Keep these checks for Steps 2-5
}
```

---

### Solution 3: **Reduce Prompt Size by 70% (Medium Win)**

**Current:** 1,000+ lines of system prompt
**Target:** 300-400 lines

**Changes:**
1. **Remove redundant examples** - Keep only 1-2 examples per concept
2. **Consolidate rules** - Merge duplicate rule sections
3. **Simplify novice support** - Move detailed recommendations to client-side
4. **Remove verbose explanations** - Trust LLM to understand concise instructions

**Impact:** **Save 3-5 seconds** per call

---

### Solution 4: **Limit Conversation History (Medium Win)**

**Current:** Sends all messages
**Target:** Last 6-8 messages only (already done in context, but not in topic checks)

**Implementation:**
```typescript
// In hasTopicBeenAnswered and isSemanticDuplicate
const recentHistory = conversationHistory.slice(-6); // Last 6 messages only
```

**Impact:** **Save 2-4 seconds** per call

---

### Solution 5: **Cache Topic Check Results (Advanced)**

**Idea:** Once a topic is marked as answered, don't re-check it

**Implementation:**
```typescript
// Add caching layer
const topicCache = new Map<string, { answered: boolean; timestamp: number }>();

// Check cache before making LLM call
if (topicCache.has(topic)) {
  const cached = topicCache.get(topic);
  if (Date.now() - cached.timestamp < 300000) { // 5 min cache
    return cached;
  }
}
```

**Impact:** **Save 10 seconds** on subsequent questions in same step

---

### Solution 6: **Parallel LLM Calls (Advanced)**

**Current:** Sequential calls
**Target:** Parallel execution using `Promise.all()`

**Implementation:**
```typescript
// Run all 3 topic checks in parallel
const [businessCheck, usersCheck, benefitsCheck] = await Promise.all([
  hasTopicBeenAnswered(aiClient, modelName, 'business problem', ...),
  hasTopicBeenAnswered(aiClient, modelName, 'target users', ...),
  hasTopicBeenAnswered(aiClient, modelName, 'expected benefits', ...)
]);
```

**Impact:** Reduces 3 sequential calls (30s) to 1 parallel batch (10s) = **Save 20 seconds**

---

### Solution 7: **Use Smaller/Faster Model for Topic Checks**

**Idea:** Use a smaller, faster model for simple yes/no checks

**Implementation:**
```typescript
// Use different models for different tasks
const topicCheckModel = 'gpt-oss:8b';  // Smaller, faster model
const questionGenModel = 'gpt-oss:20b'; // Larger model for quality

// In hasTopicBeenAnswered
const response = await aiClient.chat.completions.create({
  model: topicCheckModel,  // Use smaller model
  ...
});
```

**Impact:** **Save 5-7 seconds** per topic check

---

## Recommended Implementation Order (Fastest Wins First)

### Phase 1: Quick Wins (Immediate - **Save 40-50 seconds**)
1. ✅ Disable semantic duplicate detection (add env flag)
2. ✅ Skip topic checks in Step 1 (Introduction)
3. ✅ Limit conversation history to last 6 messages in all functions

**Expected Result:** Step 1 responses in 8-12 seconds (down from 50-70 seconds)

### Phase 2: Medium Wins (1-2 hours - **Save additional 15-20 seconds**)
4. ✅ Reduce system prompt size by 70%
5. ✅ Run topic checks in parallel using Promise.all()
6. ✅ Cache topic check results

**Expected Result:** All responses in 5-10 seconds

### Phase 3: Advanced Optimization (Optional)
7. Use smaller model for topic checks
8. Implement streaming responses for perceived speed
9. Pre-compute next question candidates

---

## Performance Targets

| Scenario | Current | Phase 1 | Phase 2 | Target |
|----------|---------|---------|---------|--------|
| Step 1 (Introduction) | 50-70s | 8-12s | 5-8s | <8s |
| Step 2 (Business Case) | 40-60s | 25-35s | 8-12s | <10s |
| Step 3-5 (Later steps) | 45-65s | 25-35s | 8-12s | <10s |

---

## Configuration Flags (Add to .env)

```bash
# Performance Optimization Flags
ENABLE_SEMANTIC_DUPLICATE_CHECK=false  # Disable for 10-15s speedup
ENABLE_TOPIC_CACHING=true              # Enable caching for 10s speedup
CONVERSATION_HISTORY_LIMIT=6           # Limit to last N messages (2-4s speedup)
USE_SMALLER_MODEL_FOR_CHECKS=false     # Use faster model for yes/no checks (5-7s speedup)
```

---

## Monitoring

Add timing logs to track improvements:

```typescript
const startTime = Date.now();

// ... LLM calls ...

const duration = Date.now() - startTime;
console.log(`⏱️ Total request time: ${duration}ms`);
debugLog('Performance Metrics', {
  totalTime: duration,
  semanticCheckEnabled,
  topicChecksCount,
  conversationHistoryLength
});
```

---

## Expected Results After Phase 1

**Before:**
```
POST /api/openai/generate-question 200 in 56082ms  ❌ Too slow
```

**After Phase 1:**
```
POST /api/openai/generate-question 200 in 8500ms   ✅ Much better
```

---

## Status

- [x] Analysis complete
- [ ] Phase 1 implementation (quick wins)
- [ ] Phase 2 implementation (medium wins)
- [ ] Phase 3 evaluation (advanced optimization)
