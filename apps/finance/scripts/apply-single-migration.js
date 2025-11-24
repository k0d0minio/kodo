#!/usr/bin/env node

/**
 * Apply a single migration file to Supabase
 *
 * Usage: node scripts/apply-single-migration.js <migration-file>
 * Example: node scripts/apply-single-migration.js supabase/migrations/20250124000000_add_transaction_timestamps_to_expenses.sql
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL environment variables
 */

// Load environment variables from .env.local if it exists
try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // dotenv not available or .env.local doesn't exist, continue with process.env
}

const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error("❌ Please provide a migration file path");
  console.error("Usage: node scripts/apply-single-migration.js <migration-file>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  console.error("\nPlease set these in your .env.local file or export them");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = path.isAbsolute(migrationFile)
    ? migrationFile
    : path.join(process.cwd(), migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`📄 Reading migration file: ${migrationPath}`);
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  console.log("🔄 Executing migration...\n");

  // Split SQL into individual statements
  const statements = migrationSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (let i = 0; i < statements.length; i++) {
    const statement = `${statements[i]};`;
    console.log(`Executing statement ${i + 1}/${statements.length}...`);

    try {
      // Use the Supabase REST API to execute SQL
      // Note: This requires the exec_sql RPC function or we need to use the Management API
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: statement,
      });

      if (error) {
        // If exec_sql doesn't exist, we need to use the Management API or direct connection
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error("\n⚠️  Cannot execute SQL automatically.");
        console.error("\nPlease run this migration manually:");
        console.error("1. Go to your Supabase Dashboard");
        console.error("2. Navigate to SQL Editor");
        console.error("3. Copy and paste the following SQL:\n");
        console.error("─".repeat(60));
        console.error(migrationSQL);
        console.error("─".repeat(60));
        process.exit(1);
      }

      console.log(`   ✓ Statement ${i + 1} completed`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error("\n⚠️  Cannot execute SQL automatically.");
      console.error("\nPlease run this migration manually:");
      console.error("1. Go to your Supabase Dashboard");
      console.error("2. Navigate to SQL Editor");
      console.error("3. Copy and paste the following SQL:\n");
      console.error("─".repeat(60));
      console.error(migrationSQL);
      console.error("─".repeat(60));
      process.exit(1);
    }
  }

  console.log("\n✅ Migration completed successfully!");
}

applyMigration().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
