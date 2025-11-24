#!/usr/bin/env node

/**
 * Verify that the transaction_completed_at column exists in the expenses table
 */

// Load environment variables
try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // dotenv not available, continue with process.env
}

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyColumn() {
  try {
    // Try to query the column - if it doesn't exist, this will fail
    const { data, error } = await supabase
      .from("expenses")
      .select("transaction_completed_at, transaction_started_at")
      .limit(1);

    if (error) {
      if (error.message.includes("transaction_completed_at") || error.message.includes("column")) {
        console.error("❌ Column transaction_completed_at does not exist in expenses table");
        console.error("Error:", error.message);
        process.exit(1);
      } else {
        // Other error, but column might exist
        console.log("⚠️  Could not verify column (query error):", error.message);
        console.log("This might be due to RLS or other issues, but the column may still exist");
      }
    } else {
      console.log("✅ Column transaction_completed_at exists in expenses table");
      console.log("✅ Column transaction_started_at exists in expenses table");
      console.log("\nSample query result:", data);
    }

    // Also check the schema directly using information_schema
    const { data: schemaData, error: schemaError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'expenses' 
        AND column_name IN ('transaction_completed_at', 'transaction_started_at')
        ORDER BY column_name;
      `,
    });

    if (!schemaError && schemaData) {
      console.log("\n📋 Column details from schema:");
      console.log(schemaData);
    }
  } catch (error) {
    console.error("❌ Error verifying column:", error.message);
    process.exit(1);
  }
}

verifyColumn();
