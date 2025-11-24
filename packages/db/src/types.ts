/**
 * Database types for the kodominio Supabase database.
 *
 * To generate types from your Supabase database, run:
 * npx supabase gen types typescript --project-id <your-project-id> > src/types.ts
 *
 * For now, this is a placeholder that exports an empty object.
 * Update this file with your actual database schema types.
 */
export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
