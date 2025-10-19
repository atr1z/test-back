-- Migration: Create auth tokens table
-- Created: 2025-10-19

-- Create auth_tokens table for JWT token tracking and refresh tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh')),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_auth_tokens_token_hash ON auth_tokens(token_hash);
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);
CREATE INDEX idx_auth_tokens_revoked ON auth_tokens(revoked) WHERE revoked = FALSE;

-- Add comments for documentation
COMMENT ON TABLE auth_tokens IS 'Authentication tokens for user sessions and refresh tokens';
COMMENT ON COLUMN auth_tokens.id IS 'Unique token identifier';
COMMENT ON COLUMN auth_tokens.user_id IS 'Reference to user who owns this token';
COMMENT ON COLUMN auth_tokens.token_type IS 'Type of token (access or refresh)';
COMMENT ON COLUMN auth_tokens.token_hash IS 'Hashed token value for security';
COMMENT ON COLUMN auth_tokens.expires_at IS 'When the token expires';
COMMENT ON COLUMN auth_tokens.revoked IS 'Whether token has been revoked';
COMMENT ON COLUMN auth_tokens.ip_address IS 'IP address where token was created';
COMMENT ON COLUMN auth_tokens.user_agent IS 'User agent string from token creation';

