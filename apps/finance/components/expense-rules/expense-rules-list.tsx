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
import { Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ExpenseRuleForm } from "./expense-rule-form";

export interface ExpenseRule {
  id: string;
  name: string;
  pattern_type: "vendor" | "description" | "amount_range";
  pattern_value: string;
  category: string;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function ExpenseRulesList() {
  const [rules, setRules] = useState<ExpenseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ExpenseRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<ExpenseRule | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expense_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error("Error loading expense rules:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(rule: ExpenseRule) {
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("expense_rules").delete().eq("id", rule.id);

      if (error) throw error;
      await loadRules();
      setDeletingRule(null);
    } catch (error) {
      console.error("Error deleting expense rule:", error);
      alert("Failed to delete expense rule");
    }
  }

  function handleEdit(rule: ExpenseRule) {
    setEditingRule(rule);
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setEditingRule(null);
    setIsDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingRule(null);
    loadRules();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading expense rules...</p>
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
              <CardTitle>Expense Rules</CardTitle>
              <CardDescription>Create rules to automatically categorize expenses</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No expense rules yet</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Rule
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pattern Type</TableHead>
                    <TableHead>Pattern Value</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="capitalize">
                        {rule.pattern_type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{rule.pattern_value}</TableCell>
                      <TableCell>{rule.category}</TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            rule.active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {rule.active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingRule(rule)}>
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
            <DialogTitle>{editingRule ? "Edit Expense Rule" : "Create Expense Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? "Update the expense categorization rule"
                : "Create a new rule to automatically categorize expenses"}
            </DialogDescription>
          </DialogHeader>
          <ExpenseRuleForm
            rule={editingRule || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingRule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the rule "{deletingRule?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingRule(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingRule && handleDelete(deletingRule)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
