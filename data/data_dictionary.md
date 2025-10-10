# AI Intake Ideas - Data Dictionary

## Overview
This document describes the schema for the `ai_intake_ideas.csv` file, which stores all GenAI opportunity submissions through the AI Intake Assistant application. The schema maps directly to the Wells Fargo 2-page intake form structure.

## Column Definitions

### Identity & Ownership Fields

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `opportunity_id` | String | Unique identifier for each submission. Auto-generated UUID. | "OPP-2024-001" or UUID | Yes | Primary Key |
| `opportunity_name` | String (255) | The title/name of the AI opportunity being proposed | "Customer Sentiment Analysis Tool" | Yes | Yes - Exact/Fuzzy |
| `opportunity_type` | Enum | Classification of the opportunity type | "Operational Enabler", "Growth Opportunity", "Transformative Idea" | Yes | Yes - Semantic |
| `owner_sponsor` | String (100) | Name and title of the person submitting the idea | "John Smith, VP Technology" | Yes | No |

### Problem & Solution Fields (Page 1)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `problem_statement` | Text | Description of the customer or business pain point being addressed | "Manual review of loan applications takes 5-7 days causing customer frustration" | Yes | Yes - Semantic |
| `current_process_issues` | Text | Explanation of why the current process is problematic (slow/costly/inconsistent/risky) | "Process is manual, error-prone, and doesn't scale with volume" | Yes | Yes - Semantic |
| `ai_solution_approach` | Text | Description of the AI-enabled approach to address the problem | "Use NLP to automatically extract and validate loan application data" | Yes | Yes - Semantic |
| `improvement_description` | Text | How the solution improves the current process (speed/scale/accuracy) | "Reduces processing time to 1 hour with 95% accuracy" | Yes | Yes - Fuzzy |

### AI Technical Details (Page 1)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `ai_task` | String (255) | The specific AI task/capability needed | "Document extraction and classification" | Yes | Yes - Semantic |
| `ai_method` | Text | Technical method or approach details | "Transformer-based NLP model with fine-tuning" | No | Yes - Semantic |
| `ai_output` | Text | Expected outputs from the AI system | "Structured JSON with extracted loan data and confidence scores" | Yes | No |
| `other_details` | Text | Additional technical or implementation details | "Requires integration with existing loan management system" | No | No |
| `suggested_approach` | Text | AI-generated suggestion for technical approach based on best practices | "Consider using pre-trained FinBERT model with Wells Fargo specific fine-tuning" | No | No |

### Business Impact Fields (Page 1)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `core_kpis` | Text | Core KPIs that will be impacted | "Processing time, accuracy rate, customer satisfaction score" | Yes | Yes - Fuzzy |
| `efficiency_metrics` | Text | Quantified efficiency, revenue, customer impact, or risk reduction | "30% cost reduction, 80% faster processing, NPS increase of 15 points" | Yes | No |
| `suggested_kpis_approach` | Text | AI-generated KPI recommendations | "Track: automation rate, straight-through processing %, error reduction %" | No | No |

### Feasibility Assessment Fields (Page 2)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `can_we_execute` | Enum | Assessment of execution capability (tools/platforms/people) | "Yes", "No", "Partial", "TBD" | Yes | No |
| `can_we_execute_rationale` | Text | Detailed explanation of execution capability assessment | "Yes - We have ML platform, 3 data scientists available, and existing GPU infrastructure" | No | No |
| `data_availability` | Enum | Assessment of data availability for training/tuning | "Yes", "No", "Partial", "TBD" | Yes | No |
| `data_availability_rationale` | Text | Detailed explanation of data availability assessment | "Partial - Customer transaction data available but missing sentiment labels for training" | No | No |
| `integration_capability` | Enum | Ability to integrate with existing tools/workflows | "Yes", "No", "Partial", "TBD" | Yes | No |
| `integration_capability_rationale` | Text | Detailed explanation of integration assessment | "Yes - REST APIs available for all systems, existing middleware can handle data flow" | No | No |

### Build vs Buy Decision Fields (Page 2)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `overall_approach` | Enum | High-level implementation strategy | "Build", "Buy", "Partner", "Hybrid", "TBD" | Yes | No |
| `approach_rationale` | Text | Detailed explanation for chosen approach | "Build internally due to proprietary data requirements and existing ML platform" | No | No |
| `hybrid_approach` | Text | Details if hybrid approach selected (roles/delivery) | "Partner provides base model, we handle fine-tuning and deployment" | No | No |
| `suggested_build_buy_approach` | Text | AI-generated recommendation for build vs buy decision | "Recommend 'Buy' - several mature vendors exist with bank-specific solutions" | No | No |

### Investment Fields (Page 2)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `investment_people` | String | FTE requirements (number and roles) | "2 FTE Data Scientists, 1 FTE ML Engineer, 0.5 FTE PM" | No | No |
| `investment_cost` | String | Estimated dollar investment | "$250,000 - $500,000" | No | No |
| `investment_timeline` | String | Expected timeline for implementation | "3-month MVP, 6-month production" | No | No |
| `suggested_investment_approach` | Text | AI-generated investment recommendations | "Consider phased approach: POC (1 month), Pilot (2 months), Scale (3 months)" | No | No |

### Risk Management Fields (Page 2)

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `risks_list` | Text | List of identified risks and roadblocks | "Data quality issues; Regulatory compliance; Change management resistance" | No | No |
| `mitigation_strategies` | Text | Strategies to reduce identified risks | "Data quality audit; Legal review; Stakeholder engagement plan" | No | No |

### Metadata Fields

| Column Name | Data Type | Description | Example | Required | Used for Duplicates |
|------------|-----------|-------------|---------|----------|-------------------|
| `submission_date` | DateTime | Date and time of initial submission | "2024-10-10T14:30:00Z" | Yes | No |
| `submission_status` | Enum | Current status of the submission | "Draft", "Submitted", "Under Review", "Approved", "Rejected" | Yes | No |
| `similarity_scores` | JSON | JSON object containing similarity scores with other ideas | `{"OPP-2024-002": 0.85, "OPP-2024-003": 0.62}` | No | No |
| `conversation_history` | JSON | Complete Q&A interaction from the conversational flow | `{"questions": [...], "answers": [...], "timestamps": [...]}` | No | No |
| `decision_log_ids` | JSON | Array of decision log IDs associated with this submission | `["LOG-2024-001", "LOG-2024-002"]` | No | No |
| `form_version` | String | Version of the intake form used | "1.0", "2.0" | Yes | No |
| `last_modified` | DateTime | Timestamp of last update to the record | "2024-10-11T09:15:00Z" | Yes | No |

## Data Types

- **String**: Text with maximum length specified
- **Text**: Long-form text without length restriction
- **Enum**: Predefined set of values
- **DateTime**: ISO 8601 format timestamp
- **JSON**: JSON-encoded object or array
- **UUID**: Universally Unique Identifier

## Duplicate Detection Usage

The "Used for Duplicates" column indicates how each field is used in duplicate detection:

- **Primary Key**: Unique identifier, not used for similarity
- **Yes - Exact**: Used for exact string matching
- **Yes - Fuzzy**: Used for fuzzy string matching (Levenshtein distance)
- **Yes - Semantic**: Used for semantic similarity (embeddings/NLP)
- **No**: Not used in duplicate detection algorithms

## Validation Rules

1. **Required Fields**: Must be populated before submission can be marked as "Submitted"
2. **Enum Fields**: Must contain one of the predefined values
3. **DateTime Fields**: Must be in ISO 8601 format
4. **JSON Fields**: Must be valid JSON syntax
5. **Investment Fields**: Should use consistent format (ranges or specific values)

## Notes for Developers

1. **CSV Encoding**: Use UTF-8 encoding to support special characters
2. **Field Delimiters**: Use commas, with quotes for fields containing commas
3. **Line Endings**: Use Unix-style line endings (LF)
4. **Null Values**: Represent as empty string in CSV
5. **JSON Fields**: Escape quotes properly when storing in CSV
6. **Boolean Fields**: Store as "Yes"/"No" for better readability

## Related Schemas

### Decision Log Schema
The `decision_log_ids` field links to detailed decision logs stored separately in `decision_logs.csv` or the decision_logs table. See `/data/decision_log_schema.md` for the complete schema of decision logging, which tracks:
- All LLM decisions and reasoning
- Data sources consulted
- Confidence scores
- Alternative options considered
- Prompts and model parameters
- Execution metrics

This separation allows for detailed debugging and auditing without bloating the main submission records.

## Change Log

- **Version 1.0** (October 2024): Initial schema definition based on Wells Fargo intake form
- **Version 1.1** (October 2024): Added decision_log_ids field for linking to decision audit trail
- **Version 1.2** (October 2024): Added rationale fields for feasibility assessments (can_we_execute_rationale, data_availability_rationale, integration_capability_rationale)
- Fields support both manual entry and AI-assisted generation
- Designed for MVP with CSV storage, extensible to PostgreSQL