"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface ProjectDetailProps {
  projectId: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  customer_id: string;
  budget: number | null;
  status: string;
  start_date: string;
  end_date: string | null;
  customers: {
    name: string;
  };
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number | null;
  description: string | null;
  status: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string | null;
  category: string | null;
  date: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  async function loadProjectData() {
    try {
      setLoading(true);

      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          customers:customer_id (
            name
          )
        `)
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load time entries
      const { data: timeData, error: timeError } = await supabase
        .from("time_entries")
        .select("id, date, hours, description, status")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (timeError) throw timeError;
      setTimeEntries(timeData || []);

      // Load expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("id, amount, description, category, date")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (expenseError) throw expenseError;
      setExpenses(expenseData || []);
    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading project...</p>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Project not found</p>
        </CardContent>
      </Card>
    );
  }

  const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>
            Customer: {project.customers.name} | Status: {project.status}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p>{project.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
            </div>
            {project.end_date && (
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
              </div>
            )}
            {project.budget && (
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">
                  €
                  {project.budget.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="font-medium">{totalHours.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>
              {timeEntries.length} entries, {totalHours.toFixed(2)} total hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No time entries yet</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>{entry.hours?.toFixed(2) || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.description || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>
              {expenses.length} expenses, €
              {totalExpenses.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">
                          €
                          {expense.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>{expense.category || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
