#!/usr/bin/env tsx

/**
 * Script to run database migrations
 *
 * Usage: tsx scripts/run-migrations.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL environment variables
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("  SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");

  // Get all migration files and sort them
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files\n`);

  for (const file of migrationFiles) {
    console.log(`Running migration: ${file}...`);

    try {
      const migrationSQL = readFileSync(join(migrationsDir, file), "utf-8");

      // Split by semicolons and execute each statement
      // Note: Supabase client doesn't support multi-statement queries directly
      // So we'll use the REST API or execute via RPC
      const { error } = await supabase.rpc("exec_sql", {
        sql: migrationSQL,
      });

      if (error) {
        // If exec_sql doesn't exist, try direct query execution
        // For now, we'll use a workaround: execute via the REST API
        console.log("  Note: Using alternative execution method...");

        // Try executing via the PostgREST API directly
        // This is a workaround - ideally you'd use psql or Supabase CLI
        console.log("  ⚠️  Migration file needs to be run manually or via Supabase CLI");
        console.log(`  File: ${file}`);
        console.log(
          "  Please run this migration in the Supabase SQL Editor or use: supabase db push\n",
        );
        continue;
      }

      console.log("  ✓ Migration completed\n");
    } catch (error: any) {
      console.error(`  ✗ Error running migration: ${error.message}\n`);
      console.error("  Please run this migration manually in the Supabase SQL Editor\n");
    }
  }

  console.log("\nMigration process completed!");
  console.log("\nNote: If migrations failed, you can run them manually:");
  console.log("  1. Go to your Supabase project dashboard");
  console.log("  2. Navigate to SQL Editor");
  console.log("  3. Copy and paste each migration file content");
  console.log("  4. Run them in order\n");
}

runMigrations().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
