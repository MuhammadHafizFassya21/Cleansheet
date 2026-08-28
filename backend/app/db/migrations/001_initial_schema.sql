-- Migration 001: Initial Schema for CleanSheet AI Metadata & Workflow State
-- Target: Neon PostgreSQL

-- Table: datasets
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    object_key TEXT NOT NULL UNIQUE,
    parent_dataset_id TEXT NULL REFERENCES datasets(id),
    file_name TEXT NOT NULL,
    stage TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    acknowledged_issue_keys TEXT[] NOT NULL DEFAULT '{}',
    storage_status TEXT NOT NULL DEFAULT 'ready'
);

-- Table: downloads
CREATE TABLE IF NOT EXISTS downloads (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL REFERENCES datasets(id),
    object_key TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text/csv; charset=utf-8',
    size_bytes BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    storage_status TEXT NOT NULL DEFAULT 'ready'
);

-- Indexes for datasets
CREATE INDEX IF NOT EXISTS datasets_expires_at_idx ON datasets(expires_at);
CREATE INDEX IF NOT EXISTS datasets_parent_dataset_id_idx ON datasets(parent_dataset_id);
CREATE INDEX IF NOT EXISTS datasets_stage_idx ON datasets(stage);

-- Indexes for downloads
CREATE INDEX IF NOT EXISTS downloads_dataset_id_idx ON downloads(dataset_id);
CREATE INDEX IF NOT EXISTS downloads_expires_at_idx ON downloads(expires_at);
