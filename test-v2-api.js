/**
 * Test script for V2 API endpoint
 * Tests the new static question flow with criteria validation
 */

async function testV2API() {
  console.log('='.repeat(80));
  console.log('V2 API TEST - Static Question Flow with Criteria Validation');
  console.log('='.repeat(80));
  console.log('');

  const baseURL = 'http://localhost:3073';

  // Sample conversation data
  const testData = {
    userData: {
      idea_description: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing.',
      solution_name: 'AI-Enabled Log Classifier'
    },
    conversationHistory: [
      {
        role: 'assistant',
        content: '[Question 1 of 10] What GenAI solution do you want to build?'
      },
      {
        role: 'user',
        content: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing.'
      },
      {
        role: 'assistant',
        content: '[Question 2 of 10] What business problem does this solution address?'
      }
    ],
    currentQuestionNumber: 2,
    followUpCount: 0
  };

  console.log('📤 Sending request to V2 API...');
  console.log('Endpoint: POST /api/openai/generate-question-v2');
  console.log('Current Question: Q' + testData.currentQuestionNumber);
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch(`${baseURL}/api/openai/generate-question-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      const error = await response.json();
      console.error('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    const result = await response.json();

    console.log('✅ Response received in', elapsed, 'ms');
    console.log('');
    console.log('📊 V2 API Response:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    // Analyze response
    if (result.complete) {
      console.log('🎉 CONVERSATION COMPLETE - All 10 questions answered');
    } else if (result.needsAIAssistance) {
      console.log('🆘 AI ASSISTANCE NEEDED - User said "I don\'t know"');
      console.log('Suggestion:', result.suggestion);
    } else if (result.isFollowUp) {
      console.log('🔄 FOLLOW-UP QUESTION - Criteria not met');
      console.log('Follow-up count:', result.followUpCount);
      console.log('Missing criteria:', result.missingCriteria);
    } else if (result.question) {
      console.log('➡️  NEXT QUESTION - Moving forward');
      console.log('Question:', result.question.id);
      console.log('Question Number:', result.currentQuestionNumber);
    }

    console.log('');
    console.log('⏱️  PERFORMANCE ANALYSIS:');
    console.log('   Response time:', elapsed, 'ms');
    console.log('   Expected V1 time: 27000-43000 ms (with topic checking)');
    console.log('   Expected V2 time: 8000-10000 ms (static + validation)');

    if (elapsed < 15000) {
      console.log('   ✅ SIGNIFICANTLY FASTER than V1!');
      const improvement = Math.round(((27000 - elapsed) / 27000) * 100);
      console.log('   🚀 Performance improvement: ~' + improvement + '%');
    } else {
      console.log('   ⚠️  Similar to V1 speed - check if validation is working');
    }

  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }

  console.log('');
  console.log('='.repeat(80));
}

// Test different scenarios
async function runTests() {
  console.log('🧪 Running V2 API Tests...\n');

  // Test 1: Normal question progression
  console.log('TEST 1: Normal Question Progression (Q2 → Q3)\n');
  await testV2API();

  console.log('\n\n');

  // Test 2: Incomplete answer (should trigger follow-up)
  console.log('TEST 2: Incomplete Answer (Should trigger follow-up)\n');
  const incompleteData = {
    userData: {
      idea_description: 'Log classifier'
    },
    conversationHistory: [
      {
        role: 'assistant',
        content: '[Question 2 of 10] What business problem does this solution address?'
      },
      {
        role: 'user',
        content: 'Logs are messy'  // Too vague - should trigger follow-up
      }
    ],
    currentQuestionNumber: 2,
    followUpCount: 0
  };

  const startTime2 = Date.now();
  try {
    const response = await fetch('http://localhost:3073/api/openai/generate-question-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompleteData),
    });

    const elapsed = Date.now() - startTime2;
    const result = await response.json();

    console.log('Response time:', elapsed, 'ms');
    console.log('Is follow-up?', result.isFollowUp);
    console.log('Missing criteria:', result.missingCriteria);
  } catch (error) {
    console.error('Test 2 failed:', error.message);
  }

  console.log('\n\n');
  console.log('🎉 Tests complete! Check results above.');
}

// Run tests
runTests().catch(console.error);
