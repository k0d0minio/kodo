"use client";

import { TimeEntryForm } from "@/components/dashboard/time-entry-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface TimeEntry {
  id: string;
  customer_id: string;
  date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  description: string | null;
  status: "in_progress" | "completed" | "billed";
  created_at: string;
  updated_at: string;
  customers: {
    id: string;
    name: string;
    hourly_rate: number | null;
  };
}

export function TimeEntriesList() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<TimeEntry | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadTimeEntries();
  }, []);

  async function loadTimeEntries() {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("time_entries")
        .select("*, customers(id, name, hourly_rate)")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("start_time", { ascending: false });

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      console.error("Error loading time entries:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entry: TimeEntry) {
    if (!confirm("Are you sure you want to delete this time entry?")) {
      return;
    }

    try {
      const { error } = await supabase.from("time_entries").delete().eq("id", entry.id);

      if (error) throw error;
      await loadTimeEntries();
      setDeletingEntry(null);
    } catch (error) {
      console.error("Error deleting time entry:", error);
      alert("Failed to delete time entry");
    }
  }

  function handleEdit(entry: TimeEntry) {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setEditingEntry(null);
    setIsDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingEntry(null);
    loadTimeEntries();
  }

  function formatTime(timeString: string) {
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function getStatusBadge(status: string) {
    const styles = {
      in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      billed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };

    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading time entries...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Time Entries</CardTitle>
              <CardDescription>View and manage all your tracked work hours</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Time Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No time entries yet</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Time Entry
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.customers.name}</TableCell>
                      <TableCell>
                        {formatTime(entry.start_time)}
                        {entry.end_time && ` - ${formatTime(entry.end_time)}`}
                      </TableCell>
                      <TableCell>{entry.hours ? `${entry.hours.toFixed(2)}h` : "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.description || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingEntry(entry)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
            <DialogDescription>
              {editingEntry ? "Update time entry information" : "Add a new time entry manually"}
            </DialogDescription>
          </DialogHeader>
          <TimeEntryForm
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingEntry(null);
            }}
            mode="manual"
            initialValues={
              editingEntry
                ? {
                    id: editingEntry.id,
                    customer_id: editingEntry.customer_id,
                    date: editingEntry.date,
                    description: editingEntry.description || "",
                    start_time: editingEntry.start_time,
                    end_time: editingEntry.end_time || undefined,
                    status: editingEntry.status,
                  }
                : undefined
            }
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingEntry(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingEntry && handleDelete(deletingEntry)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
