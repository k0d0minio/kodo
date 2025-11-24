-- Add transaction timestamp fields to expenses table
-- These fields store the full timestamp from bank statements
-- Both fields are nullable for backward compatibility with existing expenses

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS transaction_started_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS transaction_completed_at TIMESTAMP WITH TIME ZONE NULL;

-- Add indexes for timestamp queries if needed
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_started_at ON expenses(transaction_started_at);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_completed_at ON expenses(transaction_completed_at);

