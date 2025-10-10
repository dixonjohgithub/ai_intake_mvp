# LLM Decision Log Schema

## Overview
This document defines the schema for logging all LLM decisions, reasoning, and data sources throughout the AI Intake Assistant application. The decision log provides complete traceability of how the system arrives at its conclusions, enabling debugging, auditing, and fine-tuning.

## Decision Log Structure

### Primary Decision Log Table/CSV

| Column Name | Data Type | Description | Example |
|------------|-----------|-------------|---------|
| `log_id` | String/UUID | Unique identifier for each log entry | "LOG-2024-001" |
| `opportunity_id` | String | Links to the main opportunity submission | "OPP-2024-001" |
| `session_id` | String | Unique session identifier for grouping related decisions | "SESSION-2024-10-10-14-30" |
| `timestamp` | DateTime | Exact time of the decision | "2024-10-10T14:30:15.123Z" |
| `decision_type` | Enum | Category of decision made | See Decision Types below |
| `decision_phase` | Enum | Phase of the intake process | See Decision Phases below |
| `input_context` | JSON | The input data that triggered the decision | See Input Context Structure |
| `decision_made` | JSON | The actual decision/output generated | See Decision Output Structure |
| `reasoning` | Text | Natural language explanation of the reasoning | "Selected 'Build' because..." |
| `confidence_score` | Float | Confidence level of the decision (0-1) | 0.85 |
| `data_sources` | JSON | All data sources consulted | See Data Sources Structure |
| `prompts_used` | JSON | Actual prompts sent to the LLM | See Prompts Structure |
| `model_info` | JSON | LLM model details and parameters | See Model Info Structure |
| `alternatives_considered` | JSON | Other options that were evaluated | See Alternatives Structure |
| `rules_applied` | JSON | Business rules or constraints applied | ["Rule1", "Rule2"] |
| `execution_time_ms` | Integer | Time taken to make the decision | 1250 |
| `tokens_used` | JSON | Token usage for the decision | {"input": 500, "output": 150} |
| `error_info` | JSON | Any errors encountered | null or error details |
| `user_feedback` | JSON | User corrections or feedback if provided | See Feedback Structure |

## Decision Types Enum

```
QUESTION_GENERATION       - Generating next question in conversation
ANSWER_VALIDATION        - Validating user's answer completeness
CLASSIFICATION           - Classifying AI solution level
DUPLICATE_DETECTION      - Identifying potential duplicates
SIMILARITY_SCORING       - Calculating similarity scores
FIELD_EXTRACTION        - Extracting data for form fields
SUGGESTION_GENERATION    - Generating suggested approaches
KPI_RECOMMENDATION      - Recommending KPIs
BUILD_BUY_DECISION      - Recommending build vs buy
RISK_IDENTIFICATION     - Identifying potential risks
VALIDATION_CHECK        - Validating form completeness
EXPORT_FORMATTING       - Formatting for export
ERROR_RECOVERY         - Recovering from errors
```

## Decision Phases Enum

```
INITIALIZATION          - System startup and configuration
SERVICE_SELECTION      - User selecting service tile
CONVERSATION_START     - Beginning conversational flow
PROBLEM_DEFINITION     - Gathering problem information
SOLUTION_DESIGN        - Designing AI solution
FEASIBILITY_ASSESSMENT - Assessing feasibility
INVESTMENT_PLANNING    - Planning investment needs
RISK_ASSESSMENT       - Assessing risks
DUPLICATE_CHECK       - Checking for duplicates
FORM_GENERATION      - Generating intake form
REVIEW_EDIT         - Review and edit phase
SUBMISSION         - Final submission
POST_SUBMISSION    - After submission activities
```

## JSON Structure Definitions

### Input Context Structure
```json
{
  "user_input": "The current manual process takes 5 days",
  "previous_answers": ["answer1", "answer2"],
  "current_question": "What is the problem?",
  "session_state": {
    "step": 3,
    "total_steps": 10,
    "category": "problem_definition"
  },
  "metadata": {
    "timestamp": "2024-10-10T14:30:00Z",
    "user_id": "anonymous_session_123"
  }
}
```

### Decision Output Structure
```json
{
  "primary_output": "Generated next question about data availability",
  "output_type": "question",
  "structured_data": {
    "question_text": "Do you have the necessary data?",
    "question_category": "feasibility",
    "expected_answer_type": "yes_no_with_details"
  },
  "metadata": {
    "decision_path": ["check_problem", "assess_data_needs", "generate_question"]
  }
}
```

### Data Sources Structure
```json
{
  "knowledge_base": {
    "documents_consulted": ["best_practices.md", "ai_patterns.pdf"],
    "relevance_scores": [0.92, 0.87],
    "snippets_used": ["snippet1", "snippet2"]
  },
  "existing_submissions": {
    "similar_cases_reviewed": ["OPP-2024-002", "OPP-2024-003"],
    "similarity_scores": [0.65, 0.58]
  },
  "business_rules": {
    "rules_checked": ["investment_threshold", "data_requirements"],
    "rule_outcomes": ["passed", "passed"]
  },
  "external_apis": {
    "apis_called": ["openai_embeddings", "classification_service"],
    "response_times": [120, 85]
  }
}
```

### Prompts Structure
```json
{
  "system_prompt": "You are an AI assistant helping with GenAI idea intake...",
  "user_prompt": "Based on the problem: [problem], generate appropriate questions...",
  "examples_provided": [
    {
      "input": "example_input",
      "output": "example_output"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "prompt_template": "question_generation_v2"
}
```

### Model Info Structure
```json
{
  "model_name": "gpt-4",
  "model_version": "2024-01-01",
  "provider": "OpenAI",
  "endpoint": "https://api.openai.com/v1/chat/completions",
  "parameters": {
    "temperature": 0.7,
    "top_p": 0.9,
    "frequency_penalty": 0.0,
    "presence_penalty": 0.0
  },
  "response_format": "json"
}
```

### Alternatives Structure
```json
{
  "alternatives": [
    {
      "option": "Build internally",
      "score": 0.75,
      "pros": ["Full control", "Custom features"],
      "cons": ["Higher cost", "Longer timeline"],
      "reasoning": "Scored lower due to resource constraints"
    },
    {
      "option": "Buy solution",
      "score": 0.85,
      "pros": ["Faster deployment", "Proven solution"],
      "cons": ["Less customization"],
      "reasoning": "Selected due to faster time-to-value"
    }
  ],
  "selection_criteria": ["cost", "timeline", "customization", "risk"]
}
```

### Feedback Structure
```json
{
  "feedback_type": "correction",
  "original_value": "Build",
  "corrected_value": "Buy",
  "reason": "User indicated existing vendor relationship",
  "timestamp": "2024-10-10T14:45:00Z",
  "applied": true
}
```

## Logging Implementation Guidelines

### 1. Logging Granularity Levels

**VERBOSE**: Log every LLM interaction
- Every prompt and response
- All intermediate calculations
- Token usage for each call

**STANDARD**: Log key decisions
- Major decision points
- Final outputs
- Errors and corrections

**SUMMARY**: Log high-level flow
- Phase transitions
- Final results
- Critical errors only

### 2. Storage Options

**Development Environment**:
- CSV files in `/logs/decisions/` directory
- One file per session
- Daily rotation

**Production Environment**:
- PostgreSQL database with indexes
- Partitioned by date
- Archived after 90 days

### 3. Privacy Considerations

- Anonymize user data in logs
- Exclude sensitive business information
- Implement log retention policies
- Provide log export for compliance

### 4. Performance Optimization

- Asynchronous logging to avoid blocking
- Batch writes for efficiency
- Compress archived logs
- Index frequently queried fields

## Usage Examples

### Debugging Scenario
```sql
-- Find all decisions for a specific opportunity
SELECT * FROM decision_logs
WHERE opportunity_id = 'OPP-2024-001'
ORDER BY timestamp;

-- Find all duplicate detection decisions with low confidence
SELECT * FROM decision_logs
WHERE decision_type = 'DUPLICATE_DETECTION'
AND confidence_score < 0.5;
```

### Fine-tuning Analysis
```sql
-- Analyze prompt effectiveness
SELECT prompts_used->>'prompt_template' as template,
       AVG(confidence_score) as avg_confidence,
       AVG(execution_time_ms) as avg_time
FROM decision_logs
GROUP BY prompts_used->>'prompt_template';

-- Find decisions that required user correction
SELECT * FROM decision_logs
WHERE user_feedback IS NOT NULL
AND user_feedback->>'feedback_type' = 'correction';
```

### Audit Trail
```sql
-- Complete audit trail for an opportunity
SELECT
  timestamp,
  decision_phase,
  decision_type,
  decision_made->>'primary_output' as decision,
  reasoning,
  confidence_score
FROM decision_logs
WHERE opportunity_id = 'OPP-2024-001'
ORDER BY timestamp;
```

## Integration with Main Application

1. **Logging Service**: Create a centralized logging service that all components use
2. **Correlation IDs**: Use session_id and opportunity_id to correlate related logs
3. **Structured Logging**: Use JSON format for complex data structures
4. **Error Handling**: Log all errors with full context for debugging
5. **Performance Monitoring**: Track execution times and token usage

## Benefits

1. **Debugging**: Complete visibility into decision-making process
2. **Compliance**: Audit trail for regulatory requirements
3. **Optimization**: Identify bottlenecks and improve prompts
4. **Fine-tuning**: Data for improving model performance
5. **User Trust**: Ability to explain decisions to users
6. **Quality Assurance**: Track and improve decision accuracy

## Change Log

- **Version 1.0** (October 2024): Initial schema definition
- Comprehensive logging for all LLM decisions
- Support for debugging, auditing, and fine-tuning use cases