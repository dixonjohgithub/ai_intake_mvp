/**
 * CSV Mapper Service
 * Maps conversation data to complete CSV row format matching data_dictionary.md
 * Ensures all 39 required fields are populated for dummy_data.csv export
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Complete CSV row interface matching dummy_data.csv structure
 * All 39 fields from data_dictionary.md
 */
export interface CSVRowData {
  // Identity Fields (4)
  opportunity_id: string;
  opportunity_name: string;
  opportunity_type: string;
  owner_sponsor: string;

  // Problem & Solution Fields (8)
  problem_statement: string;
  current_process_issues: string;
  ai_solution_approach: string;
  improvement_description: string;
  ai_task: string;
  ai_method: string;
  ai_output: string;
  other_details: string;
  suggested_approach: string;

  // Business Impact Fields (3)
  core_kpis: string;
  efficiency_metrics: string;
  suggested_kpis_approach: string;

  // Feasibility Fields (6)
  can_we_execute: string;
  can_we_execute_rationale: string;
  data_availability: string;
  data_availability_rationale: string;
  integration_capability: string;
  integration_capability_rationale: string;

  // Build/Buy Fields (4)
  overall_approach: string;
  approach_rationale: string;
  hybrid_approach: string;
  suggested_build_buy_approach: string;

  // Investment Fields (4)
  investment_people: string;
  investment_cost: string;
  investment_timeline: string;
  suggested_investment_approach: string;

  // Risk Fields (2)
  risks_list: string;
  mitigation_strategies: string;

  // Metadata Fields (8)
  submission_date: string;
  submission_status: string;
  similarity_scores: string;
  conversation_history: string;
  decision_log_ids: string;
  form_version: string;
  last_modified: string;
}

/**
 * Maps conversation userData to complete CSV row
 * Handles user-provided, AI-generated, and system fields
 */
export function conversationToCSVRow(
  userData: Record<string, any>,
  analysis?: any,
  aiRecommendations?: any,
  conversationHistory?: Array<{ role: string; content: string }>,
  similarityScores?: Record<string, number>
): CSVRowData {
  const now = new Date().toISOString();

  return {
    // ==========================================
    // IDENTITY FIELDS
    // ==========================================
    opportunity_id: userData.opportunity_id || `OPP-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`,
    opportunity_name: userData.solution_name || userData.idea_name || userData.ideaName || 'Untitled GenAI Idea',
    opportunity_type: analysis?.classification || userData.opportunity_type || classifyOpportunityType(userData),
    owner_sponsor: userData.owner_sponsor || userData.owner || userData.submitter || 'TBD',

    // ==========================================
    // PROBLEM & SOLUTION FIELDS
    // ==========================================
    problem_statement: userData.problem_statement || userData.business_problem || userData.pain_point || 'TBD',
    current_process_issues: userData.current_process_issues || userData.problem_details || userData.current_issues || 'TBD',
    ai_solution_approach: userData.ai_solution_approach || userData.proposed_solution || userData.solution_description || 'TBD',
    improvement_description: userData.improvement_description || userData.how_ai_helps || userData.expected_benefits || 'TBD',

    // AI-extracted technical details
    ai_task: userData.ai_task || extractAITask(userData),
    ai_method: userData.ai_method || extractAIMethod(userData),
    ai_output: userData.ai_output || extractAIOutput(userData),
    other_details: userData.other_details || extractOtherDetails(userData),

    // AI-generated recommendation
    suggested_approach: aiRecommendations?.suggested_approach || 'Analysis pending',

    // ==========================================
    // BUSINESS IMPACT FIELDS
    // ==========================================
    core_kpis: userData.core_kpis || userData.success_metrics || 'TBD',
    efficiency_metrics: userData.efficiency_metrics || extractEfficiencyMetrics(userData),
    suggested_kpis_approach: aiRecommendations?.suggested_kpis_approach || 'Analysis pending',

    // ==========================================
    // FEASIBILITY FIELDS
    // ==========================================
    can_we_execute: userData.can_we_execute || extractCanWeExecute(userData.technical_feasibility),
    can_we_execute_rationale: userData.can_we_execute_rationale || userData.technical_feasibility || 'TBD',
    data_availability: userData.data_availability || extractDataAvailability(userData.data_sources),
    data_availability_rationale: userData.data_availability_rationale || userData.data_sources || 'TBD',
    integration_capability: userData.integration_capability || extractIntegrationCapability(userData.systems_integration),
    integration_capability_rationale: userData.integration_capability_rationale || userData.systems_integration || 'TBD',

    // ==========================================
    // BUILD/BUY FIELDS
    // ==========================================
    overall_approach: userData.overall_approach || userData.approach || 'TBD',
    approach_rationale: userData.approach_rationale || userData.approach_details || 'TBD',
    hybrid_approach: userData.hybrid_approach || (userData.approach?.toLowerCase().includes('hybrid') ? userData.approach : 'N/A'),
    suggested_build_buy_approach: aiRecommendations?.suggested_build_buy_approach || 'Analysis pending',

    // ==========================================
    // INVESTMENT FIELDS
    // ==========================================
    investment_people: userData.investment_people || userData.team_size || 'TBD',
    investment_cost: userData.investment_cost || userData.budget || 'TBD',
    investment_timeline: userData.investment_timeline || userData.estimated_timeline || 'TBD',
    suggested_investment_approach: aiRecommendations?.suggested_investment_approach || 'Analysis pending',

    // ==========================================
    // RISK FIELDS
    // ==========================================
    risks_list: userData.risks_list || (Array.isArray(userData.risks) ? userData.risks.join('; ') : userData.risks) || 'TBD',
    mitigation_strategies: userData.mitigation_strategies || (Array.isArray(userData.mitigation) ? userData.mitigation.join('; ') : userData.mitigation) || 'TBD',

    // ==========================================
    // METADATA FIELDS
    // ==========================================
    submission_date: userData.submission_date || now,
    submission_status: userData.submission_status || 'Submitted',
    similarity_scores: JSON.stringify(similarityScores || {}),
    conversation_history: JSON.stringify(conversationHistory || []),
    decision_log_ids: JSON.stringify(userData.decision_log_ids || []),
    form_version: '2.0',
    last_modified: now
  };
}

/**
 * Helper: Classify opportunity type based on complexity and scope
 */
function classifyOpportunityType(userData: Record<string, any>): string {
  const solution = (userData.ai_solution_approach || userData.proposed_solution || '').toLowerCase();
  const problem = (userData.problem_statement || userData.business_problem || '').toLowerCase();

  // Check for transformative indicators
  if (solution.includes('real-time') || solution.includes('ensemble') ||
      problem.includes('million') || problem.includes('company-wide')) {
    return 'Transformative Idea';
  }

  // Check for growth indicators
  if (solution.includes('scale') || solution.includes('expand') ||
      problem.includes('growth') || problem.includes('customer')) {
    return 'Growth Opportunity';
  }

  // Default to efficiency play
  return 'Efficiency Play';
}

/**
 * Helper: Extract AI task from solution description
 */
function extractAITask(userData: Record<string, any>): string {
  const solution = (userData.ai_solution_approach || userData.proposed_solution || '').toLowerCase();

  if (solution.includes('classif')) return 'Classification';
  if (solution.includes('detect')) return 'Detection';
  if (solution.includes('predict')) return 'Prediction';
  if (solution.includes('generat')) return 'Generation';
  if (solution.includes('convers') || solution.includes('chat')) return 'Conversational AI';
  if (solution.includes('summar')) return 'Summarization';
  if (solution.includes('extract')) return 'Information Extraction';
  if (solution.includes('translat')) return 'Translation';
  if (solution.includes('search') || solution.includes('retriev')) return 'Search/Retrieval';

  return 'TBD';
}

/**
 * Helper: Extract AI method from solution description
 */
function extractAIMethod(userData: Record<string, any>): string {
  const solution = (userData.ai_solution_approach || userData.proposed_solution || '').toLowerCase();
  const approach = (userData.technical_approach || '').toLowerCase();

  const combined = `${solution} ${approach}`;

  if (combined.includes('gpt') || combined.includes('llm') || combined.includes('language model')) {
    return 'Large Language Model (LLM)';
  }
  if (combined.includes('neural') || combined.includes('deep learning')) {
    return 'Deep Learning';
  }
  if (combined.includes('machine learning') || combined.includes('ml model')) {
    return 'Machine Learning';
  }
  if (combined.includes('nlp') || combined.includes('natural language')) {
    return 'Natural Language Processing';
  }
  if (combined.includes('computer vision') || combined.includes('image')) {
    return 'Computer Vision';
  }

  return 'TBD';
}

/**
 * Helper: Extract expected AI output
 */
function extractAIOutput(userData: Record<string, any>): string {
  const solution = (userData.ai_solution_approach || userData.proposed_solution || '').toLowerCase();
  const expectedOutput = userData.expected_output || '';

  if (expectedOutput) return expectedOutput;

  if (solution.includes('classif')) return 'Category labels with confidence scores';
  if (solution.includes('detect')) return 'Detection alerts with risk scores';
  if (solution.includes('predict')) return 'Predictions with probability scores';
  if (solution.includes('generat') || solution.includes('chat')) return 'Generated text responses';
  if (solution.includes('summar')) return 'Summary text';
  if (solution.includes('extract')) return 'Extracted structured data';

  return 'TBD';
}

/**
 * Helper: Extract other technical details
 */
function extractOtherDetails(userData: Record<string, any>): string {
  const details: string[] = [];

  if (userData.systems_integration) {
    details.push(`Integration: ${userData.systems_integration}`);
  }
  if (userData.data_sources) {
    details.push(`Data: ${userData.data_sources}`);
  }
  if (userData.business_priority) {
    details.push(`Priority: ${userData.business_priority}`);
  }

  return details.join('; ') || 'N/A';
}

/**
 * Helper: Extract efficiency metrics from benefits
 */
function extractEfficiencyMetrics(userData: Record<string, any>): string {
  const benefits = userData.expected_benefits || userData.success_metrics || '';

  // Look for percentage improvements
  const percentMatch = benefits.match(/(\d+)%/g);
  if (percentMatch) {
    return benefits;
  }

  // Look for time savings
  if (benefits.toLowerCase().includes('hour') || benefits.toLowerCase().includes('minute')) {
    return benefits;
  }

  return 'TBD';
}

/**
 * Helper: Determine if we can execute (Yes/No/Partial)
 */
function extractCanWeExecute(feasibility: string = ''): string {
  const lower = feasibility.toLowerCase();

  if (lower.includes('yes') && !lower.includes('but') && !lower.includes('however')) {
    return 'Yes';
  }
  if (lower.includes('no') || lower.includes('cannot') || lower.includes("can't")) {
    return 'No';
  }
  if (lower.includes('partial') || lower.includes('some') || lower.includes('but')) {
    return 'Partial';
  }

  return 'TBD';
}

/**
 * Helper: Determine data availability (Yes/No/Partial)
 */
function extractDataAvailability(dataSources: string = ''): string {
  const lower = dataSources.toLowerCase();

  if (lower.includes('available') || lower.includes('have') || lower.includes('exist')) {
    if (lower.includes('partial') || lower.includes('some') || lower.includes('limited')) {
      return 'Partial';
    }
    return 'Yes';
  }
  if (lower.includes('no data') || lower.includes('unavailable') || lower.includes('need to collect')) {
    return 'No';
  }

  return 'TBD';
}

/**
 * Helper: Determine integration capability (Yes/No/Partial)
 */
function extractIntegrationCapability(integration: string = ''): string {
  const lower = integration.toLowerCase();

  if (lower.includes('api') || lower.includes('integrate') || lower.includes('connect')) {
    if (lower.includes('partial') || lower.includes('some') || lower.includes('limited')) {
      return 'Partial';
    }
    return 'Yes';
  }
  if (lower.includes('no integration') || lower.includes('cannot integrate')) {
    return 'No';
  }

  return 'TBD';
}

/**
 * Converts CSVRowData object to CSV row string with proper escaping
 */
export function csvRowToString(row: CSVRowData): string {
  const escapeCSV = (value: string): string => {
    // Handle null/undefined
    if (value === null || value === undefined) return '""';

    // Convert to string
    const str = String(value);

    // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return `"${str}"`;
  };

  const fields = [
    row.opportunity_id,
    row.opportunity_name,
    row.opportunity_type,
    row.owner_sponsor,
    row.problem_statement,
    row.current_process_issues,
    row.ai_solution_approach,
    row.improvement_description,
    row.ai_task,
    row.ai_method,
    row.ai_output,
    row.other_details,
    row.suggested_approach,
    row.core_kpis,
    row.efficiency_metrics,
    row.suggested_kpis_approach,
    row.can_we_execute,
    row.can_we_execute_rationale,
    row.data_availability,
    row.data_availability_rationale,
    row.integration_capability,
    row.integration_capability_rationale,
    row.overall_approach,
    row.approach_rationale,
    row.hybrid_approach,
    row.suggested_build_buy_approach,
    row.investment_people,
    row.investment_cost,
    row.investment_timeline,
    row.suggested_investment_approach,
    row.risks_list,
    row.mitigation_strategies,
    row.submission_date,
    row.submission_status,
    row.similarity_scores,
    row.conversation_history,
    row.decision_log_ids,
    row.form_version,
    row.last_modified
  ];

  return fields.map(escapeCSV).join(',');
}

/**
 * Validates that all required fields are populated
 * Returns array of missing field names, empty array if valid
 */
export function validateCSVRow(row: CSVRowData): string[] {
  const missingFields: string[] = [];

  // Check critical fields that should never be TBD
  const criticalFields: Array<keyof CSVRowData> = [
    'opportunity_id',
    'opportunity_name',
    'opportunity_type',
    'submission_date',
    'submission_status',
    'form_version'
  ];

  for (const field of criticalFields) {
    const value = row[field];
    if (!value || value === 'TBD' || value === '') {
      missingFields.push(field);
    }
  }

  return missingFields;
}
