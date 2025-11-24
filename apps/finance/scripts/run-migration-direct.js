#!/usr/bin/env node

/**
 * Run a migration directly using Supabase Management API
 * This script executes SQL via HTTP POST to Supabase
 *
 * Usage: node scripts/run-migration-direct.js <migration-file>
 */

// Load environment variables
try {
  require("dotenv").config({ path: ".env.local" });
} catch (e) {
  // dotenv not available, continue with process.env
}

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");

const migrationFile =
  process.argv[2] ||
  "supabase/migrations/20250124000000_add_transaction_timestamps_to_expenses.sql";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  console.error("\nPlease set these in your .env.local file");
  process.exit(1);
}

const migrationPath = path.isAbsolute(migrationFile)
  ? migrationFile
  : path.join(process.cwd(), migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

console.log("📄 Migration file:", migrationPath);
console.log("🔄 Attempting to execute migration...\n");

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error("❌ Could not extract project reference from Supabase URL");
  console.error("\n⚠️  Please run this migration manually:");
  console.error("1. Go to your Supabase Dashboard");
  console.error("2. Navigate to SQL Editor");
  console.error("3. Copy and paste the following SQL:\n");
  console.error("─".repeat(60));
  console.error(migrationSQL);
  console.error("─".repeat(60));
  process.exit(1);
}

// Use Supabase REST API to execute SQL via the query endpoint
// Note: This requires the exec_sql RPC function to exist
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeMigration() {
  try {
    // Try using RPC if exec_sql exists
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (error) {
      throw error;
    }

    console.log("✅ Migration executed successfully!");
    console.log("Result:", data);
  } catch (error) {
    console.error("❌ Error executing migration:", error.message);
    console.error("\n⚠️  The exec_sql RPC function is not available.");
    console.error("Please run this migration manually using one of these methods:\n");

    console.error("Method 1: Supabase Dashboard (Recommended)");
    console.error(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql`);
    console.error('2. Click "New Query"');
    console.error("3. Copy and paste the SQL below");
    console.error('4. Click "Run"\n');

    console.error("Method 2: Supabase CLI");
    console.error(`1. Link your project: supabase link --project-ref ${projectRef}`);
    console.error("2. Push migrations: supabase db push\n");

    console.error("─".repeat(60));
    console.error("SQL to execute:");
    console.error("─".repeat(60));
    console.error(migrationSQL);
    console.error("─".repeat(60));

    process.exit(1);
  }
}

executeMigration();
