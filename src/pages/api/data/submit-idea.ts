/**
 * API endpoint to submit idea and append to CSV
 *
 * This endpoint:
 * 1. Uses LLM to intelligently map all user responses to correct CSV fields
 * 2. Generates AI recommendations (4 "suggested_*" fields)
 * 3. Validates data completeness
 * 4. Appends to dummy_data.csv
 */

import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { conversationToCSVRow, csvRowToString, validateCSVRow, CSVRowData } from '@/lib/data/csvMapper';
import { generateAllRecommendations } from '@/lib/ai/recommendationGenerator';

// Initialize AI client
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
 * Uses LLM to intelligently map conversation data to CSV fields
 * This ensures all user responses are captured in the right columns
 */
async function intelligentFieldMapping(
  aiClient: OpenAI,
  modelName: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userData: Record<string, any>
): Promise<Partial<CSVRowData>> {

  // Read data dictionary for reference
  const dataDictPath = path.join(process.cwd(), 'data', 'data_dictionary.md');
  const dataDictionary = fs.readFileSync(dataDictPath, 'utf-8');

  // Extract only the column definitions section (more concise)
  const columnDefsMatch = dataDictionary.match(/## Column Definitions([\s\S]*?)## Data Types/);
  const columnDefinitions = columnDefsMatch ? columnDefsMatch[1] : dataDictionary.substring(0, 3000);

  const prompt = `You are a data mapping expert. Your task is to analyze a conversation about a GenAI idea and extract specific information to populate CSV fields.

**DATA DICTIONARY (Target Schema)**:
${columnDefinitions}

**CONVERSATION HISTORY**:
${conversationHistory.map((msg, i) => `${i + 1}. ${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

**EXISTING USER DATA** (may have some fields already):
${JSON.stringify(userData, null, 2)}

**TASK**:
Analyze the entire conversation and extract information to populate these CSV fields. Use the conversation content to fill in the correct fields based on the data dictionary definitions.

For each field, extract the EXACT relevant information from the user's responses. Be thorough and capture all details.

Return a JSON object with these fields (only include fields you can extract from the conversation):

{
  "opportunity_name": "Extract the solution/idea name from Q1",
  "problem_statement": "Extract the main business problem from Q2",
  "current_process_issues": "Extract why current process is problematic from Q2",
  "ai_solution_approach": "Extract how AI will solve it from Q3",
  "improvement_description": "Extract expected improvements from Q3",
  "ai_task": "Identify the AI task type (Classification/Detection/etc)",
  "ai_method": "Identify the AI method (LLM/ML/NLP/etc)",
  "ai_output": "Extract expected AI outputs",
  "core_kpis": "Extract KPIs mentioned by user",
  "efficiency_metrics": "Extract quantifiable metrics (time saved, cost reduction, etc)",
  "target_users": "Extract who will use this solution",
  "data_availability": "Extract what data is available",
  "data_availability_rationale": "Extract data source details",
  "can_we_execute": "Extract Yes/No/Partial for technical capability",
  "can_we_execute_rationale": "Extract technical feasibility explanation",
  "integration_capability": "Extract Yes/No/Partial for integration",
  "integration_capability_rationale": "Extract integration details",
  "investment_timeline": "Extract timeline estimates",
  "investment_people": "Extract team size/FTE requirements",
  "investment_cost": "Extract budget/cost estimates",
  "overall_approach": "Extract Build/Buy/Partner decision",
  "approach_rationale": "Extract reasoning for approach",
  "risks_list": "Extract identified risks and challenges",
  "mitigation_strategies": "Extract mitigation approaches"
}

**IMPORTANT**:
- Extract information EXACTLY as the user provided it
- Don't make up information that wasn't discussed
- If a field wasn't discussed, omit it from the response
- Combine related information from multiple responses when needed
- Use the data dictionary to understand what each field should contain`;

  try {
    console.log('🧠 Using LLM for intelligent field mapping...');

    const response = await aiClient.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting and mapping information from conversations to structured data fields. Be thorough and accurate.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2, // Low temperature for consistency
    });

    const rawResponse = response.choices[0]?.message?.content || '{}';
    const mappedFields = JSON.parse(rawResponse);

    console.log('✅ LLM field mapping complete:', Object.keys(mappedFields).length, 'fields extracted');
    console.log('📋 Extracted fields:', JSON.stringify(mappedFields, null, 2));

    return mappedFields;
  } catch (error) {
    console.error('❌ Error in intelligent field mapping:', error);
    return {};
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userData, analysis, conversationHistory, similarityScores } = req.body;

    console.log('📥 Received idea submission:', {
      userDataKeys: Object.keys(userData || {}),
      hasAnalysis: !!analysis,
      conversationHistoryLength: conversationHistory?.length || 0
    });

    // Validate required data
    if (!conversationHistory || conversationHistory.length === 0) {
      return res.status(400).json({
        error: 'Missing conversation history',
        message: 'Conversation history is required to map data properly'
      });
    }

    const mode = process.env.NEXT_PUBLIC_AI_MODE || 'static';
    const aiClient = getAIClient();

    if (mode === 'static' || !aiClient) {
      return res.status(400).json({
        error: 'AI mode required',
        message: 'LLM-based field mapping requires AI mode to be enabled'
      });
    }

    const modelName = mode === 'ollama'
      ? (process.env.OLLAMA_MODEL || 'gpt-oss:20b')
      : (process.env.OPENAI_MODEL || 'gpt-4');

    // STEP 1: Use LLM to intelligently map conversation to CSV fields
    console.log('🧠 Step 1: Intelligent field mapping from conversation...');
    const llmMappedFields = await intelligentFieldMapping(
      aiClient,
      modelName,
      conversationHistory,
      userData || {}
    );

    // Merge LLM-mapped fields with existing userData (LLM takes precedence)
    const enrichedUserData = {
      ...userData,
      ...llmMappedFields
    };

    console.log('✅ Field mapping complete. Extracted', Object.keys(llmMappedFields).length, 'fields from conversation');

    // STEP 2: Generate AI recommendations (4 "suggested_*" fields)
    console.log('🤖 Step 2: Generating AI recommendations...');
    let aiRecommendations = null;
    try {
      aiRecommendations = await generateAllRecommendations(
        aiClient,
        modelName,
        enrichedUserData
      );
      console.log('✅ AI recommendations generated');
    } catch (error) {
      console.error('⚠️ Failed to generate recommendations:', error);
      // Continue without recommendations - they'll use defaults
    }

    // STEP 3: Map to complete CSV row (39 fields)
    console.log('🗺️ Step 3: Finalizing CSV row structure...');
    const csvRow = conversationToCSVRow(
      enrichedUserData,
      analysis,
      aiRecommendations,
      conversationHistory,
      similarityScores
    );

    // Validate CSV row
    const missingFields = validateCSVRow(csvRow);
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing critical fields:', missingFields);
      return res.status(400).json({
        error: 'Incomplete data',
        message: 'Some required fields are missing',
        missingFields
      });
    }

    // Convert to CSV string
    const csvLine = csvRowToString(csvRow);

    // Append to dummy_data.csv
    const csvPath = path.join(process.cwd(), 'data', 'dummy_data.csv');
    console.log('📝 Appending to CSV:', csvPath);

    // Check if file exists and has content
    let fileExists = false;
    try {
      const stats = fs.statSync(csvPath);
      fileExists = stats.size > 0;
    } catch (error) {
      console.log('📄 CSV file does not exist, will create with header');
    }

    // Append to file (add newline if file already has content)
    const lineToAppend = fileExists ? `\n${csvLine}` : csvLine;
    fs.appendFileSync(csvPath, lineToAppend);

    console.log('✅ Successfully appended to CSV');
    console.log('📊 Opportunity ID:', csvRow.opportunity_id);

    // Return success with opportunity ID
    return res.status(200).json({
      success: true,
      message: 'Idea submitted successfully',
      opportunityId: csvRow.opportunity_id,
      opportunityName: csvRow.opportunity_name,
      csvPath: csvPath,
      recommendations: aiRecommendations
    });

  } catch (error: any) {
    console.error('❌ Error submitting idea:', error);
    return res.status(500).json({
      error: 'Failed to submit idea',
      message: error?.message || 'Unknown error occurred'
    });
  }
}
