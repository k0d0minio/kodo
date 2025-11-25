import { createClient } from "@/lib/supabase/client";

export interface ClientSession {
  customerId: string;
  email: string;
  customerName: string;
  expiresAt: Date;
}

/**
 * Validate client portal access token
 */
export async function validateClientToken(token: string): Promise<ClientSession | null> {
  const supabase = createClient();

  const { data: access, error } = await supabase
    .from("client_portal_access")
    .select(`
      *,
      customers:customer_id (
        name
      )
    `)
    .eq("access_token", token)
    .single();

  if (error || !access) {
    return null;
  }

  const typedAccess = access as {
    id: string;
    customer_id: string;
    email: string;
    token_expires_at: string;
    customers: {
      name: string;
    } | null;
  };

  // Check if token is expired
  const expiresAt = new Date(typedAccess.token_expires_at);
  if (expiresAt < new Date()) {
    return null;
  }

  // Update last login
  await supabase
    .from("client_portal_access")
    .update({ last_login_at: new Date().toISOString() } as never)
    .eq("id", typedAccess.id);

  return {
    customerId: typedAccess.customer_id,
    email: typedAccess.email,
    customerName: typedAccess.customers?.name || "Customer",
    expiresAt,
  };
}

/**
 * Store client session in localStorage
 */
export function storeClientSession(session: ClientSession): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("client_session", JSON.stringify(session));
  }
}

/**
 * Get client session from localStorage
 */
export function getClientSession(): ClientSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = localStorage.getItem("client_session");
  if (!stored) {
    return null;
  }

  try {
    const session = JSON.parse(stored) as ClientSession;
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem("client_session");
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Clear client session
 */
export function clearClientSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("client_session");
  }
}
