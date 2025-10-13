#!/usr/bin/env node

/**
 * Test script to verify example responses are being generated
 */

const fetch = require('node-fetch');

async function testExampleGeneration() {
  console.log('Testing example response generation...\n');

  const testCases = [
    {
      name: 'Initial idea with no context',
      userData: {
        idea_description: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing'
      },
      conversationHistory: []
    },
    {
      name: 'After idea description',
      userData: {
        idea_description: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing',
        solution_name: 'Intelligent Log Router'
      },
      conversationHistory: [
        { role: 'assistant', content: "Let's start by understanding your idea. Could you briefly describe your GenAI idea?" },
        { role: 'user', content: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing' }
      ]
    },
    {
      name: 'Business case phase',
      userData: {
        idea_description: 'I want to build a log classifier',
        solution_name: 'Log Classifier',
        use_case: 'Automatically categorize security logs'
      },
      conversationHistory: [
        { role: 'assistant', content: "What specific use case do you envision?" },
        { role: 'user', content: 'Automatically categorize security logs' }
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('─'.repeat(50));

    try {
      const response = await fetch('http://localhost:3073/api/openai/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: 'Test',
          userData: testCase.userData,
          conversationHistory: testCase.conversationHistory
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error: ${error}`);
        continue;
      }

      const data = await response.json();
      const question = data.question;

      if (question) {
        console.log(`✅ Question ID: ${question.id}`);
        console.log(`📊 Category: ${question.category}`);
        console.log(`🎯 Step: ${question.stepInfo || 'Not specified'}`);
        console.log(`\n❓ Question:\n${question.text}`);

        if (question.exampleResponse) {
          console.log(`\n💡 Example Response:\n"${question.exampleResponse}"`);
        } else {
          console.log('\n⚠️  No example response provided');
        }

        if (question.helpText) {
          console.log(`\nℹ️  Help Text: ${question.helpText}`);
        }
      } else {
        console.log('❌ No question generated');
      }
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }
  }

  console.log('\n\n✅ Test completed!');
}

// Run the test
testExampleGeneration().catch(console.error);