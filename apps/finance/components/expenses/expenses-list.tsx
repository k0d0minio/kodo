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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import { Edit, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { ExpenseForm } from "./expense-form";
import { ExpenseImport } from "./expense-import";

export interface Expense {
  id: string;
  amount: number;
  description: string | null;
  category: string | null;
  vendor: string | null;
  date: string;
  receipt_url: string | null;
  project_id: string | null;
  transaction_started_at: string | null;
  transaction_completed_at: string | null;
  created_at: string;
  updated_at: string;
  projects: {
    name: string;
  } | null;
}

export function ExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select(`
          *,
          projects:project_id (
            name
          )
        `)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(expense: Expense) {
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", expense.id);

      if (error) throw error;
      await loadExpenses();
      setDeletingExpense(null);
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setEditingExpense(null);
    setIsDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingExpense(null);
    loadExpenses();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading expenses...</p>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track and manage your business expenses</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Expenses
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">
              €
              {totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No expenses yet</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Expense
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell>{expense.vendor || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {expense.description || "-"}
                      </TableCell>
                      <TableCell>{expense.category || "-"}</TableCell>
                      <TableCell>{expense.projects?.name || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        €
                        {expense.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingExpense(expense)}
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
            <DialogTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update expense information" : "Add a new business expense"}
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingExpense(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingExpense(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingExpense && handleDelete(deletingExpense)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isImportDialogOpen && (
        <ExpenseImport
          onSuccess={() => {
            setIsImportDialogOpen(false);
            loadExpenses();
          }}
          onCancel={() => setIsImportDialogOpen(false)}
        />
      )}
    </>
  );
}
