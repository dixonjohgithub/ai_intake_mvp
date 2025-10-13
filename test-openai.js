// Simple test script for OpenAI API connectivity
require('dotenv').config();

async function testOpenAI() {
  console.log('Testing OpenAI API connection...');
  console.log('API Key present:', !!process.env.OPENAI_API_KEY);
  console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 8) + '...');

  // Check if key looks valid
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ No OpenAI API key found in environment');
    return false;
  }

  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('❌ OpenAI API key does not start with "sk-"');
    return false;
  }

  console.log('✅ OpenAI API key format looks valid');
  console.log('Model:', process.env.OPENAI_MODEL || 'gpt-5');
  console.log('Embedding Model:', process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small');

  // Note: Actual API test would require the openai package to be installed
  console.log('\n⚠️  Note: To test actual API connection, run "npm install openai" first');
  console.log('Then the application health check endpoint will verify connectivity');

  return true;
}

testOpenAI();