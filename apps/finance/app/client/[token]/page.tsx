"use client";

import { Card, CardContent } from "@/components/ui/card";
import { storeClientSession, validateClientToken } from "@/lib/client-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientAccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    params.then(async (p) => {
      setToken(p.token);
      await validateAndRedirect(p.token);
    });
  }, [params]);

  async function validateAndRedirect(accessToken: string) {
    try {
      setLoading(true);
      const session = await validateClientToken(accessToken);

      if (!session) {
        setError("Invalid or expired access link. Please request a new link.");
        return;
      }

      // Store session
      storeClientSession(session);

      // Redirect to portal
      router.push("/client/portal");
    } catch (err) {
      console.error("Error validating token:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Validating access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact support if you need assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
