-- Fix Database Schema Directly
-- This script adds missing columns and creates new tables

-- 1. Add missing columns to jmr_records table
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS officer_id INTEGER REFERENCES users(id);
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS land_type VARCHAR(50);
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS tribal_classification BOOLEAN DEFAULT FALSE;
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS village VARCHAR(100);
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS taluka VARCHAR(100);
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- 2. Create notices table
CREATE TABLE IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    notice_id VARCHAR(100) UNIQUE NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    landowner_name VARCHAR(255),
    amount DECIMAL(15,2),
    notice_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    officer_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    village VARCHAR(100),
    taluka VARCHAR(100),
    district VARCHAR(100),
    land_type VARCHAR(50),
    tribal_classification BOOLEAN DEFAULT FALSE,
    jmr_reference VARCHAR(100),
    objection_deadline TIMESTAMP,
    notice_type VARCHAR(100),
    description TEXT,
    attachments JSONB,
    document_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    notice_id VARCHAR(100) REFERENCES notices(notice_id),
    amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'Pending',
    reason_if_pending TEXT,
    officer_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    payment_date TIMESTAMP,
    payment_method VARCHAR(100),
    bank_details JSONB,
    utr_number VARCHAR(100),
    receipt_path VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create blockchain_ledger table
CREATE TABLE IF NOT EXISTS blockchain_ledger (
    id SERIAL PRIMARY KEY,
    block_id VARCHAR(100) UNIQUE NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    officer_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    previous_hash VARCHAR(255),
    current_hash VARCHAR(255),
    nonce INTEGER,
    project_id INTEGER REFERENCES projects(id),
    remarks TEXT,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create awards table
CREATE TABLE IF NOT EXISTS awards (
    id SERIAL PRIMARY KEY,
    award_id VARCHAR(100) UNIQUE NOT NULL,
    survey_number VARCHAR(100) NOT NULL,
    landowner_id VARCHAR(100),
    landowner_name VARCHAR(255),
    award_number VARCHAR(100),
    award_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Draft',
    officer_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    village VARCHAR(100),
    taluka VARCHAR(100),
    district VARCHAR(100),
    land_type VARCHAR(50),
    tribal_classification BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    measured_area DECIMAL(10,2),
    unit VARCHAR(50),
    jmr_reference VARCHAR(100),
    base_amount DECIMAL(15,2),
    solatium DECIMAL(15,2),
    additional_amounts JSONB,
    total_amount DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jmr_records_survey_number ON jmr_records(survey_number);
CREATE INDEX IF NOT EXISTS idx_jmr_records_officer_id ON jmr_records(officer_id);
CREATE INDEX IF NOT EXISTS idx_notices_survey_number ON notices(survey_number);
CREATE INDEX IF NOT EXISTS idx_payments_survey_number ON payments(survey_number);
CREATE INDEX IF NOT EXISTS idx_awards_survey_number ON awards(survey_number);
CREATE INDEX IF NOT EXISTS idx_blockchain_ledger_survey_number ON blockchain_ledger(survey_number);

-- 7. Update existing jmr_records with default values for new columns
UPDATE jmr_records SET 
    land_type = 'Agricultural' WHERE land_type IS NULL;
UPDATE jmr_records SET 
    tribal_classification = FALSE WHERE tribal_classification IS NULL;
UPDATE jmr_records SET 
    status = 'pending' WHERE status IS NULL;

-- 8. Verify the changes
SELECT 'Database schema fixed successfully!' as status;
