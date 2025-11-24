-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
  next_invoice_date DATE NOT NULL,
  last_invoice_date DATE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own recurring invoices
CREATE POLICY "Users can view their own recurring invoices"
  ON recurring_invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own recurring invoices
CREATE POLICY "Users can insert their own recurring invoices"
  ON recurring_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own recurring invoices
CREATE POLICY "Users can update their own recurring invoices"
  ON recurring_invoices FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own recurring invoices
CREATE POLICY "Users can delete their own recurring invoices"
  ON recurring_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_customer_id ON recurring_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_active ON recurring_invoices(active);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_invoice_date ON recurring_invoices(next_invoice_date);

-- Create trigger to update updated_at
CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

