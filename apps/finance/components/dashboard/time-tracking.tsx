"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Clock, Play, Plus, Square } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TimeEntryForm } from "./time-entry-form";

interface TimeEntry {
  id: string;
  customer_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  description: string | null;
  status: "in_progress" | "completed" | "billed";
  customers: {
    name: string;
    hourly_rate: number | null;
  };
}

export function TimeTrackingSection() {
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [estimatedEarnings, setEstimatedEarnings] = useState(0);
  const [currentSession, setCurrentSession] = useState<TimeEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadTimeData();
    checkActiveTimer();
    // Refresh every minute to update timer display
    const interval = setInterval(() => {
      if (currentSession) {
        loadTimeData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentSession]);

  async function loadTimeData() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get weekly hours
      const { data: weeklyData } = await supabase
        .from("time_entries")
        .select("hours, customers(hourly_rate)")
        .eq("user_id", user.id)
        .gte("date", startOfWeek.toISOString().split("T")[0])
        .eq("status", "completed");

      // Get monthly hours
      const { data: monthlyData } = await supabase
        .from("time_entries")
        .select("hours, customers(hourly_rate)")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .eq("status", "completed");

      const weeklyTotal = weeklyData?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;
      const monthlyTotal = monthlyData?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0;

      setWeeklyHours(Number(weeklyTotal.toFixed(2)));
      setMonthlyHours(Number(monthlyTotal.toFixed(2)));

      // Calculate estimated earnings (using average hourly rate or default)
      const allRates = [
        ...(weeklyData?.map((e) => e.customers?.hourly_rate).filter(Boolean) || []),
        ...(monthlyData?.map((e) => e.customers?.hourly_rate).filter(Boolean) || []),
      ];
      const avgRate =
        allRates.length > 0
          ? allRates.reduce((sum, rate) => sum + (rate || 0), 0) / allRates.length
          : 75; // Default rate
      setEstimatedEarnings(Number((monthlyTotal * avgRate).toFixed(2)));
    } catch (error) {
      console.error("Error loading time data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function checkActiveTimer() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("time_entries")
        .select("*, customers(name, hourly_rate)")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error checking active timer:", error);
        return;
      }

      if (data) {
        setCurrentSession(data);
      }
    } catch (error) {
      console.error("Error checking active timer:", error);
    }
  }

  async function handleStopTimer() {
    if (!currentSession) return;

    try {
      const endTime = new Date().toISOString();

      const { error } = await supabase
        .from("time_entries")
        .update({
          end_time: endTime,
          status: "completed",
        })
        .eq("id", currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      await loadTimeData();
    } catch (error) {
      console.error("Error stopping timer:", error);
      alert("Failed to stop timer. Please try again.");
    }
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    loadTimeData();
    checkActiveTimer();
  }

  const [elapsedTime, setElapsedTime] = useState("0:00:00");

  useEffect(() => {
    if (currentSession) {
      const updateElapsedTime = () => {
        const start = new Date(currentSession.start_time);
        const now = new Date();
        const diff = now.getTime() - start.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setElapsedTime(
          `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      };

      updateElapsedTime();
      const interval = setInterval(updateElapsedTime, 1000);
      return () => clearInterval(interval);
    }
    setElapsedTime("0:00:00");
  }, [currentSession]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Tracking
              </CardTitle>
              <CardDescription>Track your work hours and generate invoices</CardDescription>
            </div>
            <Link href="/time-entries">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-3xl font-bold">{loading ? "..." : `${weeklyHours}h`}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-3xl font-bold">{loading ? "..." : `${monthlyHours}h`}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estimated Earnings</p>
              <p className="text-3xl font-bold">
                {loading ? "..." : `€${estimatedEarnings.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            {currentSession ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleStopTimer}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Timer
                </Button>
                <div className="flex-1 rounded-md border p-3">
                  <p className="text-sm text-muted-foreground">Current Session</p>
                  <p className="font-medium">{currentSession.customers.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(currentSession.start_time).toLocaleTimeString()}
                  </p>
                  <p className="text-lg font-bold mt-1">{elapsedTime}</p>
                  {currentSession.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentSession.description}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <Button className="flex-1" onClick={() => setIsDialogOpen(true)}>
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Timer</DialogTitle>
            <DialogDescription>Select a customer and start tracking your time</DialogDescription>
          </DialogHeader>
          <TimeEntryForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsDialogOpen(false)}
            mode="start"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
