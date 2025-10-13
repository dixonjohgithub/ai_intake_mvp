#!/usr/bin/env node

/**
 * Test to verify business problem duplicate question is fixed
 */

const fetch = require('node-fetch');

async function testBusinessProblemDuplicate() {
  console.log('Testing business problem duplicate fix...\n');
  console.log('Simulating the exact scenario from the screenshots:\n');

  // First question: AI asks about business problem
  console.log('SCENARIO 1: First time asking business problem');
  console.log('─'.repeat(60));

  const userData1 = {
    idea_description: 'Build a log classifier that classifies log items and routes each to the appropriate analyst',
    solution_name: 'AI-Enabled Log Classifier'
  };

  const conversationHistory1 = [
    {
      role: 'assistant',
      content: "What would you like to name this solution?"
    },
    {
      role: 'user',
      content: 'AI-Enabled Log Classifier'
    }
  ];

  try {
    const response1 = await fetch('http://localhost:3073/api/openai/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userData: userData1,
        conversationHistory: conversationHistory1
      }),
    });

    const data1 = await response1.json();
    const question1 = data1.question;

    if (question1) {
      console.log(`✅ First Question Generated:`);
      console.log(`ID: ${question1.id}`);
      console.log(`Question: ${question1.text.substring(0, 100)}...\n`);
    }

    // Second question: After user answered business problem
    console.log('\nSCENARIO 2: After user answered business problem');
    console.log('─'.repeat(60));

    const userData2 = {
      ...userData1,
      business_problem: 'Currently analysts spend 2 hours sorting log items manually, delaying incident response'
    };

    const conversationHistory2 = [
      ...conversationHistory1,
      {
        role: 'assistant',
        content: 'What business problem is this solution addressing? For example: "Reducing manual invoice processing time by 50%"'
      },
      {
        role: 'user',
        content: 'Currently analysts spend 2 hours sorting log items manually, delaying incident response'
      }
    ];

    const response2 = await fetch('http://localhost:3073/api/openai/generate-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userData: userData2,
        conversationHistory: conversationHistory2
      }),
    });

    const data2 = await response2.json();
    const question2 = data2.question;

    if (question2) {
      console.log(`\n✅ Second Question Generated:`);
      console.log(`ID: ${question2.id}`);
      console.log(`Question: ${question2.text.substring(0, 150)}...\n`);

      // Check if it's asking about business problem again
      const questionLower = question2.text.toLowerCase();
      const isDuplicate = questionLower.includes('business problem') ||
                          (questionLower.includes('problem') && questionLower.includes('solving')) ||
                          (questionLower.includes('problem') && questionLower.includes('address'));

      if (isDuplicate) {
        console.log('\n❌ ERROR: The AI is asking about business problem AGAIN!');
        console.log('This is the duplicate question bug.');
        console.log('\nFull question text:');
        console.log(question2.text);
      } else {
        console.log('\n✅ SUCCESS: The AI moved to a different topic!');
        console.log('The duplicate business problem bug appears to be fixed.');
      }
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n✅ Test completed!');
}

// Run the test
testBusinessProblemDuplicate().catch(console.error);