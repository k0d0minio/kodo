import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createUser() {
  const email = "jamie.nisbet@outlook.be";
  const password = "ScotlandWho@2025";

  console.log(`Creating user with email: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email so user can login immediately
  });

  if (error) {
    console.error("Error creating user:", error.message);
    if (error.message.includes("already registered")) {
      console.log("User already exists. Skipping creation.");
    } else {
      process.exit(1);
    }
  } else {
    console.log("User created successfully:", data.user?.id);
  }
}

createUser();
