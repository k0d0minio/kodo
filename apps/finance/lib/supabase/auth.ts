import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return { user, supabase };
}
