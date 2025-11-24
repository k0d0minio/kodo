#!/usr/bin/env node

/**
 * Apply migrations to Supabase using the Management API
 * This script reads all migration files and applies them via the Supabase REST API
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("node:fs");
const path = require("node:path");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  console.error("\nPlease set these in your .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

  // Get all migration files sorted
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`📦 Found ${files.length} migration files\n`);

  for (const file of files) {
    console.log(`🔄 Running: ${file}`);

    try {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      // Execute SQL using the Supabase REST API
      // Note: This requires the SQL to be executed via RPC or we need to use the Management API
      // For now, we'll provide instructions to run manually

      // Try to execute via RPC if exec_sql function exists
      const { error } = await supabase.rpc("exec_sql", { sql });

      if (error) {
        // RPC doesn't exist, so we need to run manually
        console.log("   ⚠️  Cannot execute automatically");
        console.log("   📝 Please run this migration in Supabase SQL Editor\n");
        continue;
      }

      console.log("   ✅ Success\n");
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log("\n✨ Migration process completed!");
  console.log("\n📋 Next steps:");
  console.log("   1. Go to your Supabase Dashboard");
  console.log("   2. Navigate to SQL Editor");
  console.log("   3. Run each migration file in order\n");
}

applyMigrations().catch(console.error);
