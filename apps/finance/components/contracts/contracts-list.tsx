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
import { Edit, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ContractForm } from "./contract-form";

export interface Contract {
  id: string;
  title: string;
  customer_id: string;
  project_id: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  renewal_date: string | null;
  contract_url: string | null;
  status: "active" | "expired" | "terminated";
  created_at: string;
  updated_at: string;
  customers: {
    name: string;
  };
}

export function ContractsList() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadContracts();
  }, []);

  async function loadContracts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          customers:customer_id (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Error loading contracts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(contract: Contract) {
    if (!confirm(`Are you sure you want to delete "${contract.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("contracts").delete().eq("id", contract.id);

      if (error) throw error;
      await loadContracts();
      setDeletingContract(null);
    } catch (error) {
      console.error("Error deleting contract:", error);
      alert("Failed to delete contract");
    }
  }

  function handleEdit(contract: Contract) {
    setEditingContract(contract);
    setIsDialogOpen(true);
  }

  function handleAdd() {
    setEditingContract(null);
    setIsDialogOpen(true);
  }

  function handleFormSuccess() {
    setIsDialogOpen(false);
    setEditingContract(null);
    loadContracts();
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading contracts...</p>
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
              <CardTitle>Contracts</CardTitle>
              <CardDescription>Manage your client contracts and agreements</CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No contracts yet</p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Contract
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.title}
                        {contract.contract_url && (
                          <a
                            href={contract.contract_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 inline-block"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{contract.customers.name}</TableCell>
                      <TableCell>{new Date(contract.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        {contract.renewal_date
                          ? new Date(contract.renewal_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            contract.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : contract.status === "expired"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(contract)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingContract(contract)}
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
            <DialogTitle>{editingContract ? "Edit Contract" : "Create New Contract"}</DialogTitle>
            <DialogDescription>
              {editingContract
                ? "Update contract information"
                : "Create a new contract linked to a customer or project"}
            </DialogDescription>
          </DialogHeader>
          <ContractForm
            contract={editingContract || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingContract(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingContract} onOpenChange={(open) => !open && setDeletingContract(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingContract?.title}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingContract(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingContract && handleDelete(deletingContract)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
