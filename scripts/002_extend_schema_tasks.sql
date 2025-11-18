-- Extended schema for comprehensive task categories and revenue tracking

-- Task categories with metadata
CREATE TABLE task_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  reward_min BIGINT NOT NULL,
  reward_max BIGINT NOT NULL,
  estimated_time VARCHAR(50),
  verification_method VARCHAR(50),
  multiplier_boost DECIMAL(3, 2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert task category configurations
INSERT INTO task_categories (id, name, description, reward_min, reward_max, estimated_time, verification_method, multiplier_boost)
VALUES
  ('ad_based', 'Watch & Earn', 'Watch sponsored videos and advertisements', 5, 20, '30s-2min', 'oracle', 1.0),
  ('micro_jobs', 'Work & Mine', 'Perform data labeling and micro-tasks', 10, 50, '5-15min', 'ai', 1.1),
  ('surveys', 'Opinion Mining', 'Complete surveys and provide feedback', 15, 60, '10-20min', 'oracle', 1.05),
  ('learning_quests', 'Learn to Earn', 'Complete educational quizzes', 5, 25, '5-10min', 'auto', 1.15),
  ('referral', 'Invite & Mine', 'Refer friends and earn commissions', 20, 100, '1min', 'oracle', 1.2),
  ('staking_validation', 'Stake & Validate', 'Stake tokens or validate tasks', 0, 1000000, 'Passive', 'auto', 1.25);

-- Advanced tasks with category tracking
CREATE TABLE advanced_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL REFERENCES task_categories(id),
  reward_min BIGINT NOT NULL,
  reward_max BIGINT NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  trust_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  staking_boost DECIMAL(3, 2) DEFAULT 1.0,
  verification_method VARCHAR(50),
  proof_required JSONB,
  completion_limit INT,
  expires_at TIMESTAMP,
  metadata JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue streams for mining algorithm
CREATE TABLE revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KES',
  tokens_generated BIGINT NOT NULL,
  exchange_rate DECIMAL(18, 6),
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily mining records
CREATE TABLE daily_mining_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_revenue DECIMAL(18, 2),
  total_tokens_minted BIGINT,
  user_reward_pool BIGINT,
  treasury_allocation BIGINT,
  staking_allocation BIGINT,
  referral_allocation BIGINT,
  reserve_allocation BIGINT,
  active_users INT,
  total_tasks_completed INT,
  average_task_value DECIMAL(18, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User trust scores and levels
CREATE TABLE user_trust_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trust_score INT DEFAULT 50,
  level VARCHAR(20) DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
  completed_tasks INT DEFAULT 0,
  verified_tasks INT DEFAULT 0,
  failed_tasks INT DEFAULT 0,
  accuracy_rate DECIMAL(5, 2) DEFAULT 0,
  last_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ad tracking for monitoring ad engagement
CREATE TABLE ad_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id VARCHAR(255) NOT NULL,
  duration_seconds INT,
  engagement_score INT,
  device_fingerprint VARCHAR(255),
  view_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Micro-job submissions with accuracy tracking
CREATE TABLE micro_job_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  submission_data JSONB,
  accuracy_score DECIMAL(5, 2),
  ai_verified_score DECIMAL(5, 2),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);

-- Survey responses tracking
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id VARCHAR(255) NOT NULL,
  responses JSONB,
  completion_time INT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning quest scores
CREATE TABLE learning_quest_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id VARCHAR(255) NOT NULL,
  score INT,
  max_score INT,
  time_taken INT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staking validation activity
CREATE TABLE staking_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  validator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_submission_id UUID NOT NULL REFERENCES task_submissions(id),
  is_valid BOOLEAN,
  reason TEXT,
  validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_advanced_tasks_category ON advanced_tasks(category);
CREATE INDEX idx_advanced_tasks_status ON advanced_tasks(status);
CREATE INDEX idx_revenue_streams_source ON revenue_streams(source);
CREATE INDEX idx_revenue_streams_date ON revenue_streams(DATE(timestamp));
CREATE INDEX idx_daily_mining_date ON daily_mining_records(date);
CREATE INDEX idx_user_trust_user ON user_trust_levels(user_id);
CREATE INDEX idx_ad_tracking_user ON ad_tracking(user_id);
CREATE INDEX idx_micro_job_user ON micro_job_submissions(user_id);
CREATE INDEX idx_survey_user ON survey_responses(user_id);
CREATE INDEX idx_learning_user ON learning_quest_scores(user_id);
CREATE INDEX idx_validations_validator ON staking_validations(validator_id);
