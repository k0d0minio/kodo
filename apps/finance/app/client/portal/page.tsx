"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ClientSession, clearClientSession, getClientSession } from "@/lib/client-auth";
import { FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientPortalPage() {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const clientSession = getClientSession();
    if (!clientSession) {
      router.push("/");
      return;
    }
    setSession(clientSession);
    setLoading(false);
  }, [router]);

  function handleLogout() {
    clearClientSession();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black flex items-center justify-center">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Client Portal</h1>
            <p className="text-sm text-muted-foreground">{session.customerName}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Client Portal</CardTitle>
            <CardDescription>View your invoices and payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/client/invoices">
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                View Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
