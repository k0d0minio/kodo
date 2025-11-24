-- Create client_portal_access table
CREATE TABLE IF NOT EXISTS client_portal_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE client_portal_access ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view client portal access for their customers
CREATE POLICY "Users can view client portal access for their customers"
  ON client_portal_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = client_portal_access.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Create policy for users to insert client portal access for their customers
CREATE POLICY "Users can insert client portal access for their customers"
  ON client_portal_access FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = client_portal_access.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Create policy for users to update client portal access for their customers
CREATE POLICY "Users can update client portal access for their customers"
  ON client_portal_access FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = client_portal_access.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Create policy for users to delete client portal access for their customers
CREATE POLICY "Users can delete client portal access for their customers"
  ON client_portal_access FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM customers
      WHERE customers.id = client_portal_access.customer_id
      AND customers.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_portal_access_customer_id ON client_portal_access(customer_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_email ON client_portal_access(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_portal_access_token ON client_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_client_portal_access_token_expires_at ON client_portal_access(token_expires_at);

