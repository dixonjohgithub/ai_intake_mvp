#!/usr/bin/env node

/**
 * Test to verify the duplicate initial question is fixed
 */

const fetch = require('node-fetch');

async function testDuplicateFix() {
  console.log('Testing duplicate question fix...\n');
  console.log('Simulating the exact scenario from the screenshots:\n');

  // Simulate the exact flow from the screenshots
  const userData = {
    idea_description: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing'
  };

  const conversationHistory = [
    {
      role: 'assistant',
      content: "[Step 1 of 5: Introduction]\n\nLet's start by understanding your idea. Could you briefly describe your GenAI idea in 2-3 sentences?"
    },
    {
      role: 'user',
      content: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing'
    }
  ];

  console.log('User already provided their idea:');
  console.log(`"${userData.idea_description}"\n`);
  console.log('Now asking for the NEXT question...\n');
  console.log('─'.repeat(60));

  try {
    const response = await fetch('http://localhost:3073/api/openai/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userData,
        conversationHistory
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Error: ${error}`);
      return;
    }

    const data = await response.json();
    const question = data.question;

    if (question) {
      console.log(`\n✅ Generated Question:`);
      console.log(`ID: ${question.id}`);
      console.log(`Step: ${question.stepInfo}`);
      console.log(`\nQuestion Text:\n${question.text}\n`);

      // Check if it's asking for the idea again
      const questionLower = question.text.toLowerCase();
      const badPhrases = [
        'brief overview',
        'project idea',
        'genai project',
        'describe your',
        'give a brief',
        'could you give',
        'overview of your'
      ];

      const isDuplicate = badPhrases.some(phrase => questionLower.includes(phrase));

      if (isDuplicate) {
        console.log('❌ ERROR: The AI is asking for the idea AGAIN!');
        console.log('This is the duplicate question bug that needs to be fixed.');
      } else {
        console.log('✅ SUCCESS: The AI moved to the next logical question!');
        console.log('The duplicate question bug appears to be fixed.');
      }

      if (question.exampleResponse) {
        console.log(`\n💡 Example Response:\n"${question.exampleResponse}"`);
      }
    } else {
      console.log('❌ No question generated');
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n✅ Test completed!');
}

// Run the test
testDuplicateFix().catch(console.error);