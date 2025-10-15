/**
 * Test script for PDF generation functionality
 * Tests the PDFExporter with sample conversation data
 */

// Sample conversation data
const sampleUserData = {
  // Basic idea info
  business_problem: 'I want to build a log classifier that classifies log items and routes each to the appropriate analyst for processing.',
  solution_name: 'AI-Enabled Log Classifier',

  // Business Case
  pain_point: 'Analysts currently spend 2-3 hours daily manually sorting and categorizing log entries',
  problem_details: 'Manual log classification is slow, error-prone, and causes delays in incident response',
  current_issues: 'High volumes of logs make it difficult to prioritize critical issues',

  proposed_solution: 'Use AI to automatically classify log entries by severity and type, then route to specialized analysts',
  how_ai_helps: 'Machine learning can identify patterns and classify logs much faster than manual review',
  expected_benefits: 'Reduce classification time by 80%, improve response times, and free up analysts for complex issues',

  target_users: 'Security analysts, network operations team, and incident response specialists',

  // Technical Details
  ai_task: 'Text classification and routing',
  technical_approach: 'Use NLP models to analyze log text and classify by category and severity',
  expected_output: 'Categorized logs with confidence scores routed to appropriate analyst queues',

  data_sources: 'Application logs, system logs, security event logs from SIEM platform',

  // Feasibility
  technical_feasibility: 'We have the infrastructure and team with ML experience',
  data_availability: 'Historical logs available for training, estimated 5 million entries',
  systems_integration: 'Can integrate with existing ticketing system and SIEM platform',

  estimated_timeline: '3-4 months for MVP with basic classification',
  team_size: '2-3 FTEs (1 ML engineer, 1 backend engineer, 0.5 analyst SME)',
  budget: '$150-200K for MVP phase',

  // Investment
  approach: 'Build in-house using existing ML platform',
  approach_details: 'Leverage our existing ML infrastructure, train custom models on our log data',

  // Risks
  risks: [
    'Model accuracy may be lower initially, requiring iterative training',
    'Integration complexity with legacy SIEM system',
    'Analyst adoption - need to build trust in AI recommendations'
  ],

  mitigation: [
    'Start with human-in-the-loop validation to improve model',
    'Phase integration with SIEM, starting with read-only access',
    'Conduct training sessions and gather analyst feedback early'
  ],

  // Priority
  business_priority: 'Supports 2026 cybersecurity initiative focused on improving incident response times',

  // Success metrics
  success_metrics: 'Reduce log classification time from 2-3 hours to 15-20 minutes daily, 95% classification accuracy, 50% faster incident response'
};

const sampleAnalysis = {
  summary: 'AI-powered log classification system to automate the routing of security and operational logs to specialized analysts, reducing manual processing time and improving incident response.',
  classification: 'Simple GenAI - Text classification and routing',
  readiness: 75,
  gaps: [
    'Need to define specific log categories and routing rules',
    'Integration testing with legacy SIEM required',
    'Change management plan for analyst adoption'
  ],
  recommendations: [
    'Start with pilot on one log type (e.g., security logs only)',
    'Establish success metrics and monitoring dashboard',
    'Create feedback loop for continuous model improvement',
    'Document classification rules and routing logic for transparency'
  ]
};

console.log('='.repeat(80));
console.log('PDF GENERATION TEST');
console.log('='.repeat(80));
console.log('\n📋 Sample Data:');
console.log(JSON.stringify({ userData: sampleUserData, analysis: sampleAnalysis }, null, 2));
console.log('\n✅ Test data prepared');
console.log('\n📝 To test PDF generation:');
console.log('1. Navigate to http://localhost:3073/submit-idea');
console.log('2. Complete the conversational flow (or use the sample data above)');
console.log('3. On the review page, click "Download PDF"');
console.log('4. Verify the PDF contains:');
console.log('   - Page 1: Strategic Framing (Problem & Solution, How Solution Works, Target Outcomes, CL Priority)');
console.log('   - Page 2: Feasibility & Investment (Readiness, Build/Buy/Partner, Investment, Risks & Mitigation)');
console.log('\n💡 You can also manually store this data in sessionStorage:');
console.log('   sessionStorage.setItem("ideaData", JSON.stringify(sampleUserData))');
console.log('   sessionStorage.setItem("ideaAnalysis", JSON.stringify(sampleAnalysis))');
console.log('   Then navigate to http://localhost:3073/review-idea\n');
console.log('='.repeat(80));
