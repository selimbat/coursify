-- Migration 001: Create lists and settings tables

-- Settings/Auth table for passphrase
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  shared_passphrase_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('en_cours', 'en_attente', 'faite')),
  markdown TEXT NOT NULL DEFAULT '',
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_modified_by VARCHAR(50) NOT NULL CHECK (last_modified_by IN ('user_a', 'user_b')),
  CONSTRAINT unique_template UNIQUE (is_template) WHERE is_template = true
);

-- Create indexes for common queries
CREATE INDEX idx_lists_created_at ON lists(created_at DESC);
CREATE INDEX idx_lists_is_template ON lists(is_template);
CREATE INDEX idx_lists_status ON lists(status);

-- Initialize settings table with a single row (if empty)
INSERT INTO settings (shared_passphrase_hash)
  SELECT '' WHERE NOT EXISTS (SELECT 1 FROM settings);
