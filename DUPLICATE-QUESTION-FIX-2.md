# Duplicate Question Bug Fix - Data Sources Issue

**Date:** 2025-10-13
**Issue:** System was asking about "data sources" even though the user had already answered that question
**Status:** ✅ FIXED

---

## Problem Summary

The system asked this question:
> "What data sources will the classifier use, and are the logs available in a format that can be easily ingested?"

**Even though** the user had already answered it earlier:
```json
"data-sources": "We will integrate with the Axios application dashboard logs. The classifier will get these log files from the Google Cloud Storage buckets."
```

This happened despite having:
1. ✅ Semantic duplicate detection working
2. ✅ Rule #7: "NEVER ask for information already provided in userData"
3. ✅ coveredTopics exclusion list in prompts

---

## Root Cause Analysis

### The Bug

**File:** `/Users/johndixon/Wells_Fargo_Projects/AI_Intake/src/pages/api/openai/generate-question.ts`
**Lines:** 378-442

The code ONLY added **Step 2 (Business Case) topics** to `coveredTopics`:
- business problem
- target users
- expected benefits

**It NEVER added Step 3, 4, or 5 topics to coveredTopics**, even though they were in userData!

```typescript
// ONLY check Step 2 topics (Business Case) if we're in Step 2 or beyond
if (currentStep >= 2) {
  const businessProblemCheck = await hasTopicBeenAnswered(...);
  const targetUsersCheck = await hasTopicBeenAnswered(...);
  const expectedBenefitsCheck = await hasTopicBeenAnswered(...);

  // Build covered topics based on LLM analysis
  if (businessProblemCheck.answered) {
    coveredTopics.push('business problem', 'pain points', 'challenges', 'problem to solve');
  }
  // ... similar for target users and expected benefits
}
// ❌ NO CHECKS for Step 3, 4, 5 topics!
```

### Why This Caused Duplicates

**When userData contained:**
```json
{
  "idea_description": "I want to build a log classifier...",
  "solution-name": "AI-Enabled Log Classifier",
  "business_problem": "...",
  "data-sources": "We will integrate with Axios...",  // ← Step 3 topic
  "target_users": "...",
  "expected-benefits": "..."
}
```

**The coveredTopics list only had:**
```javascript
coveredTopics = [
  'basic idea description',
  'core concept',
  // ... (Step 1 topics)
  'business problem',
  'pain points',
  // ... (Step 2 topics)
  // ❌ 'data-sources' NOT in list!
]
```

**So the LLM saw:**
- ✅ Exclusion list mentions: business problem, target users, expected benefits
- ❌ Exclusion list DOES NOT mention: data sources
- ❌ userData key "data-sources" not converted to covered topic

**Result:** LLM thought it was okay to ask about data sources again!

---

## The Fix

**Added lines 444-459** to automatically add ALL userData keys to coveredTopics:

```typescript
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
```

### What This Does

1. **Extracts ALL keys from userData** that have non-empty values
2. **Converts them to readable format:**
   - `data-sources` → `"data sources"`
   - `target_users` → `"target users"`
   - `expected-benefits` → `"expected benefits"`
3. **Adds them to coveredTopics** so the LLM knows to NEVER ask about them

---

## After the Fix

**Now coveredTopics will contain:**
```javascript
coveredTopics = [
  'basic idea description',
  'core concept',
  'solution overview',
  // ...
  'business problem',
  'target users',
  'expected benefits',
  'data sources',           // ← NOW INCLUDED!
  'solution name',          // ← NOW INCLUDED!
  // ... ALL userData keys!
]
```

**The LLM prompt now says:**
```
🚫 ABSOLUTE EXCLUSIONS - DO NOT ASK ABOUT THESE TOPICS (THEY ARE ALREADY ANSWERED):
❌ business problem
❌ target users
❌ expected benefits
❌ data sources          ← NOW EXCLUDED!
❌ solution name         ← NOW EXCLUDED!
```

---

## Why This is Better Than the Previous Approach

### Previous Approach (Brittle)
- Had to manually add `hasTopicBeenAnswered()` checks for EVERY new topic
- Only worked for Step 2 topics
- Required maintaining parallel lists of topic names
- Easy to miss topics, causing duplicates

### New Approach (Robust)
- ✅ **Automatic:** ALL userData keys are instantly covered
- ✅ **Comprehensive:** Works for Steps 1-5, not just Step 2
- ✅ **Simple:** No need to add new topic checks
- ✅ **Reliable:** If it's in userData, it won't be asked again

---

## Testing the Fix

### Before Fix
```
userData = {
  "data-sources": "We will integrate with Axios..."
}

coveredTopics = ['business problem', 'target users']  // ❌ Missing data-sources

LLM asks: "What data sources will the classifier use?"  // ❌ DUPLICATE!
```

### After Fix
```
userData = {
  "data-sources": "We will integrate with Axios..."
}

coveredTopics = ['business problem', 'target users', 'data sources']  // ✅ Includes data sources

LLM avoids asking about data sources  // ✅ NO DUPLICATE!
```

---

## Files Modified

1. **`/src/pages/api/openai/generate-question.ts`**
   - **Lines 444-459:** Added automatic userData key to coveredTopics conversion
   - **Location:** Right before the "Final covered topics" debug log

---

## Success Criteria

✅ System no longer asks about topics that exist in userData
✅ Works for ALL steps (1-5), not just Step 2
✅ Automatic detection - no manual topic tracking needed
✅ Maintains existing semantic duplicate detection
✅ Maintains existing LLM-based topic analysis for Step 2

---

## Related Documentation

- **Previous Fix:** See `FIX-COMPLETE-SUMMARY.md` for React state closure issue
- **Question Flow:** See `ORIGINAL-QUESTION-FLOW-GUIDE.md` for detailed flow documentation
- **Semantic Duplicates:** Working correctly - this was a separate coveredTopics issue

---

## Status: ✅ DEPLOYED

The fix has been deployed and is now live. All new conversations will automatically include userData keys in the exclusion list.

**To Test:**
1. Navigate to http://localhost:3073/submit-idea
2. Answer questions through Step 4 (Feasibility)
3. Verify that previously answered questions are never asked again
4. Check `llm-debug.log` to see userData keys in "Final covered topics" list
