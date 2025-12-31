-- Add Stripe ID columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add index for Stripe customer ID lookups
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id 
ON customers(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add Stripe ID column to invoices table
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;

-- Add index for Stripe invoice ID lookups
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id 
ON invoices(stripe_invoice_id) 
WHERE stripe_invoice_id IS NOT NULL;

-- Add Stripe subscription ID column to recurring_invoices table
ALTER TABLE recurring_invoices
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add index for Stripe subscription ID lookups
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_stripe_subscription_id 
ON recurring_invoices(stripe_subscription_id) 
WHERE stripe_subscription_id IS NOT NULL;

-- Make invoice fields nullable to minimize local data (Stripe is source of truth)
-- Note: Existing data remains intact, only new records can have NULL values
ALTER TABLE invoices
ALTER COLUMN issue_date DROP NOT NULL,
ALTER COLUMN due_date DROP NOT NULL,
ALTER COLUMN subtotal DROP NOT NULL,
ALTER COLUMN tax_rate DROP NOT NULL,
ALTER COLUMN tax_amount DROP NOT NULL,
ALTER COLUMN total DROP NOT NULL;

-- Make invoice_items fields nullable (Stripe line items are authoritative)
ALTER TABLE invoice_items
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN quantity DROP NOT NULL,
ALTER COLUMN unit_price DROP NOT NULL,
ALTER COLUMN total DROP NOT NULL;

-- Make customer fields nullable (Stripe is source of truth for contact info)
-- Note: name is kept as NOT NULL for local reference
ALTER TABLE customers
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN phone_number DROP NOT NULL,
ALTER COLUMN business_address DROP NOT NULL,
ALTER COLUMN tva_number DROP NOT NULL,
ALTER COLUMN notes DROP NOT NULL;

-- Make recurring_invoice fields nullable (Stripe subscription is authoritative)
-- Note: name is kept as NOT NULL for local reference
ALTER TABLE recurring_invoices
ALTER COLUMN frequency DROP NOT NULL,
ALTER COLUMN next_invoice_date DROP NOT NULL,
ALTER COLUMN amount DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL;

