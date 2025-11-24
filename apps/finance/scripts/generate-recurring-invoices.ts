#!/usr/bin/env tsx

/**
 * Script to generate invoices from recurring invoice templates
 * This should be run as a cron job (e.g., daily)
 *
 * Usage: tsx scripts/generate-recurring-invoices.ts
 */

import { createClient } from "@supabase/supabase-js";
import { generateDueRecurringInvoices } from "../lib/recurring-invoices";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Starting recurring invoice generation...");

  try {
    // Note: This function needs to be updated to use the service role client
    // For now, this is a placeholder that shows the structure
    const count = await generateDueRecurringInvoices();
    console.log(`Generated ${count} invoices from recurring templates`);
  } catch (error) {
    console.error("Error generating recurring invoices:", error);
    process.exit(1);
  }
}

main();
