-- CodeArena Database Schema
-- PostgreSQL 15+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS submission_results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================
-- Problems Table
-- ============================================
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    supported_languages TEXT[] NOT NULL DEFAULT ARRAY['python', 'javascript', 'java', 'cpp'],
    time_limit INTEGER NOT NULL DEFAULT 10, -- seconds
    memory_limit INTEGER NOT NULL DEFAULT 256, -- MB
    examples JSONB DEFAULT '[]'::jsonb,
    constraints TEXT[] DEFAULT ARRAY[]::TEXT[],
    hints TEXT[] DEFAULT ARRAY[]::TEXT[],
    solution_template JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching problems
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);
CREATE INDEX idx_problems_title_search ON problems USING GIN(title gin_trgm_ops);

-- ============================================
-- Test Cases Table
-- ============================================
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT false, -- Sample test cases shown to users
    is_hidden BOOLEAN DEFAULT false, -- Hidden test cases for final validation
    order_index INTEGER DEFAULT 0,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_cases_problem ON test_cases(problem_id);
CREATE INDEX idx_test_cases_order ON test_cases(problem_id, order_index);

-- ============================================
-- Sessions Table (for anonymous users)
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);

-- ============================================
-- Submissions Table
-- ============================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL CHECK (language IN ('python', 'javascript', 'java', 'cpp')),
    status VARCHAR(50) NOT NULL DEFAULT 'queued' 
        CHECK (status IN ('queued', 'processing', 'accepted', 'wrong_answer', 
                         'time_limit_exceeded', 'memory_limit_exceeded', 
                         'runtime_error', 'compilation_error', 'system_error')),
    execution_time INTEGER, -- milliseconds
    memory_usage INTEGER, -- bytes
    error_message TEXT,
    worker_id VARCHAR(255),
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_session ON submissions(session_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_created ON submissions(created_at DESC);
CREATE INDEX idx_submissions_language ON submissions(language);

-- ============================================
-- Submission Results Table (per test case)
-- ============================================
CREATE TABLE submission_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL DEFAULT false,
    actual_output TEXT,
    execution_time INTEGER, -- milliseconds
    memory_usage INTEGER, -- bytes
    error_message TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submission_results_submission ON submission_results(submission_id);
CREATE INDEX idx_submission_results_test_case ON submission_results(test_case_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_problems_updated_at 
    BEFORE UPDATE ON problems 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper Functions
-- ============================================

-- Get problem with test cases
CREATE OR REPLACE FUNCTION get_problem_with_tests(p_slug VARCHAR)
RETURNS TABLE (
    problem_id UUID,
    title VARCHAR,
    description TEXT,
    difficulty VARCHAR,
    supported_languages TEXT[],
    time_limit INTEGER,
    memory_limit INTEGER,
    examples JSONB,
    constraints TEXT[],
    test_case_id UUID,
    test_input TEXT,
    expected_output TEXT,
    is_sample BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.difficulty,
        p.supported_languages,
        p.time_limit,
        p.memory_limit,
        p.examples,
        p.constraints,
        t.id,
        t.input,
        t.expected_output,
        t.is_sample
    FROM problems p
    LEFT JOIN test_cases t ON t.problem_id = p.id
    WHERE p.slug = p_slug AND p.is_active = true
    ORDER BY t.order_index;
END;
$$ LANGUAGE plpgsql;

-- Get submission stats for a session
CREATE OR REPLACE FUNCTION get_session_stats(p_session_id UUID)
RETURNS TABLE (
    total_submissions BIGINT,
    accepted_count BIGINT,
    problems_attempted BIGINT,
    problems_solved BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_submissions,
        COUNT(*) FILTER (WHERE status = 'accepted')::BIGINT as accepted_count,
        COUNT(DISTINCT problem_id)::BIGINT as problems_attempted,
        COUNT(DISTINCT problem_id) FILTER (WHERE status = 'accepted')::BIGINT as problems_solved
    FROM submissions
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql;

-- Clean up old submissions (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_submissions(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM submissions 
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views
-- ============================================

-- Problem summary view
CREATE OR REPLACE VIEW problem_summary AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.difficulty,
    p.supported_languages,
    p.tags,
    COUNT(DISTINCT s.id) as submission_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'accepted') as accepted_count,
    CASE 
        WHEN COUNT(DISTINCT s.id) > 0 
        THEN ROUND(
            (COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'accepted')::DECIMAL / 
             COUNT(DISTINCT s.id)::DECIMAL) * 100, 2
        )
        ELSE 0 
    END as acceptance_rate
FROM problems p
LEFT JOIN submissions s ON s.problem_id = p.id
WHERE p.is_active = true
GROUP BY p.id
ORDER BY p.created_at DESC;

-- Recent submissions view
CREATE OR REPLACE VIEW recent_submissions AS
SELECT 
    s.id,
    s.problem_id,
    p.title as problem_title,
    p.difficulty as problem_difficulty,
    s.language,
    s.status,
    s.execution_time,
    s.memory_usage,
    s.created_at
FROM submissions s
JOIN problems p ON p.id = s.problem_id
ORDER BY s.created_at DESC
LIMIT 100;
