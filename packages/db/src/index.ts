/**
 * @kodo/db - Shared Supabase database connection utilities
 *
 * This package provides unified Supabase client utilities for connecting
 * to the kodominio database across all apps in the monorepo.
 *
 * Usage:
 * - Client components: import { createClient } from "@kodo/db/client"
 * - Server components: import { createClient } from "@kodo/db/server"
 */

export { createClient } from "./client.js";
export { createClient as createServerClient } from "./server.js";
export type { Database } from "./types.js";
