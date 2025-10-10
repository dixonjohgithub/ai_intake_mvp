-- Initialize AI Intake Database Schema
-- This script sets up the PostgreSQL database for the AI Intake Assistant

-- Create main ideas table matching CSV schema
CREATE TABLE IF NOT EXISTS ai_intake_ideas (
    opportunity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_name VARCHAR(255) NOT NULL,
    opportunity_type VARCHAR(100),
    owner_sponsor VARCHAR(255),

    -- Problem & Solution
    problem_statement TEXT,
    current_process_issues TEXT,
    ai_solution_approach TEXT,
    improvement_description TEXT,

    -- How the Solution Will Work
    ai_task TEXT,
    ai_method TEXT,
    ai_output TEXT,
    other_details TEXT,
    suggested_approach TEXT,

    -- Target Outcomes
    core_kpis TEXT,
    efficiency_metrics TEXT,
    suggested_kpis_approach TEXT,

    -- Feasibility
    can_we_execute BOOLEAN,
    can_we_execute_rationale TEXT,
    data_availability BOOLEAN,
    data_availability_rationale TEXT,
    integration_capability BOOLEAN,
    integration_capability_rationale TEXT,

    -- Build vs Buy vs Partner
    overall_approach VARCHAR(50),
    approach_rationale TEXT,
    hybrid_approach TEXT,
    suggested_build_buy_approach TEXT,

    -- Investment
    investment_people VARCHAR(100),
    investment_cost VARCHAR(100),
    investment_timeline VARCHAR(100),
    suggested_investment_approach TEXT,

    -- Risks
    risks_list TEXT,
    mitigation_strategies TEXT,

    -- Metadata
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submission_status VARCHAR(50) DEFAULT 'Draft',
    similarity_scores JSONB,
    conversation_history JSONB,
    decision_log_ids JSONB,
    form_version VARCHAR(20) DEFAULT '1.0',
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create decision logs table
CREATE TABLE IF NOT EXISTS decision_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255),
    opportunity_id UUID REFERENCES ai_intake_ideas(opportunity_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decision_type VARCHAR(100),
    input_context JSONB,
    llm_prompt TEXT,
    llm_response TEXT,
    model_used VARCHAR(50),
    model_parameters JSONB,
    confidence_score DECIMAL(3,2),
    data_sources JSONB,
    alternatives_considered JSONB,
    reasoning TEXT,
    execution_time_ms INTEGER,
    token_usage JSONB,
    user_feedback JSONB,
    error_details JSONB,
    metadata JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_ideas_submission_date ON ai_intake_ideas(submission_date);
CREATE INDEX idx_ideas_status ON ai_intake_ideas(submission_status);
CREATE INDEX idx_ideas_owner ON ai_intake_ideas(owner_sponsor);
CREATE INDEX idx_ideas_type ON ai_intake_ideas(opportunity_type);

CREATE INDEX idx_logs_session ON decision_logs(session_id);
CREATE INDEX idx_logs_opportunity ON decision_logs(opportunity_id);
CREATE INDEX idx_logs_timestamp ON decision_logs(timestamp);
CREATE INDEX idx_logs_type ON decision_logs(decision_type);

-- Create full-text search indexes
CREATE INDEX idx_ideas_problem_search ON ai_intake_ideas USING gin(to_tsvector('english', problem_statement));
CREATE INDEX idx_ideas_solution_search ON ai_intake_ideas USING gin(to_tsvector('english', ai_solution_approach));

-- Create update trigger for last_modified
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ideas_last_modified
BEFORE UPDATE ON ai_intake_ideas
FOR EACH ROW
EXECUTE FUNCTION update_last_modified();

-- Create embeddings table for duplicate detection
CREATE TABLE IF NOT EXISTS idea_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES ai_intake_ideas(opportunity_id) ON DELETE CASCADE,
    embedding_text TEXT NOT NULL,
    embedding_vector REAL[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embeddings_opportunity ON idea_embeddings(opportunity_id);

-- Grant permissions (adjust based on your user setup)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_intake_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_intake_user;