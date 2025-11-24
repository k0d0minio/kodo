-- Add hourly_rate field to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10, 2);

