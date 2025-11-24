"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { Briefcase, Calendar, FileText, LogOut, Menu, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function NavigationMenu() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Menu className="mr-2 h-4 w-4" />
          Menu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Navigation</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/invoices" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/expenses" className="flex items-center">
            <Wallet className="mr-2 h-4 w-4" />
            Expenses
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/projects" className="flex items-center">
            <Briefcase className="mr-2 h-4 w-4" />
            Projects
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/time-entries" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Time
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/customers" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Customers
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive" className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
