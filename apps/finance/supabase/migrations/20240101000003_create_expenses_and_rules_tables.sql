-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  category TEXT,
  vendor TEXT,
  date DATE NOT NULL,
  receipt_url TEXT,
  project_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own expenses
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own expenses
CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own expenses
CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own expenses
CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Create trigger to update updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create expense_rules table
CREATE TABLE IF NOT EXISTS expense_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('vendor', 'description', 'amount_range')),
  pattern_value TEXT NOT NULL,
  category TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE expense_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own expense rules
CREATE POLICY "Users can view their own expense rules"
  ON expense_rules FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own expense rules
CREATE POLICY "Users can insert their own expense rules"
  ON expense_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own expense rules
CREATE POLICY "Users can update their own expense rules"
  ON expense_rules FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy for users to delete their own expense rules
CREATE POLICY "Users can delete their own expense rules"
  ON expense_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expense_rules_user_id ON expense_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_rules_active ON expense_rules(active);
CREATE INDEX IF NOT EXISTS idx_expense_rules_priority ON expense_rules(priority DESC);

-- Create trigger to update updated_at
CREATE TRIGGER update_expense_rules_updated_at
  BEFORE UPDATE ON expense_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

