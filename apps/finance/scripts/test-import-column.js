#!/usr/bin/env node

/**
 * Test that the import endpoint can handle transaction_completed_at column
 * This script verifies the database schema matches what the code expects
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

async function testImportColumn() {
  console.log("🧪 Testing that import can handle transaction_completed_at column...\n");

  try {
    // Create a test expense object that matches what the import route creates
    const testExpense = {
      user_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID for testing
      amount: 0.01,
      description: "Test expense",
      category: null,
      vendor: "Test Vendor",
      date: "2025-01-24",
      transaction_started_at: "2025-01-24T10:00:00Z",
      transaction_completed_at: "2025-01-24T10:05:00Z",
      receipt_url: null,
      project_id: null,
    };

    // Try to insert (this will fail due to invalid user_id, but will validate the schema)
    const { error } = await supabase.from("expenses").insert(testExpense);

    if (error) {
      // Check if the error is about the column (which would be bad) or about the user_id (which is expected)
      if (
        error.message.includes("transaction_completed_at") ||
        error.message.includes("transaction_started_at") ||
        (error.message.includes("column") && error.message.includes("expenses"))
      ) {
        console.error("❌ Schema error detected:");
        console.error("Error:", error.message);
        console.error(
          "\nThe transaction_completed_at or transaction_started_at column may not exist or be accessible.",
        );
        process.exit(1);
      } else if (
        error.message.includes("user_id") ||
        error.message.includes("foreign key") ||
        error.message.includes("violates")
      ) {
        // This is expected - the dummy user_id doesn't exist
        console.log("✅ Schema validation passed!");
        console.log(
          "   (Insert failed with expected error about user_id, which confirms the columns exist)",
        );
        console.log("   Error:", error.message);
        console.log(
          "\n✅ The transaction_completed_at and transaction_started_at columns are properly configured.",
        );
        console.log("✅ The import endpoint should now work without column errors.");
        return;
      } else {
        console.log("⚠️  Unexpected error:", error.message);
        console.log("   This might indicate a schema issue. Please verify manually.");
        process.exit(1);
      }
    } else {
      // Insert succeeded (unlikely with dummy user_id, but possible if RLS is disabled)
      console.log("✅ Test insert succeeded!");
      console.log(
        "✅ The transaction_completed_at and transaction_started_at columns are working correctly.",
      );

      // Clean up the test record
      await supabase.from("expenses").delete().eq("amount", 0.01).eq("description", "Test expense");

      return;
    }
  } catch (error) {
    console.error("❌ Error during test:", error.message);
    process.exit(1);
  }
}

testImportColumn();
