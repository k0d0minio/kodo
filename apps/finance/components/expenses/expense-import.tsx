"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ParsedExpense, parseBankStatementCSV } from "@/lib/bank-statement-parser";
import { FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

interface ExpenseImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExpenseImport({ onSuccess, onCancel }: ExpenseImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedExpense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    total: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    try {
      const text = await selectedFile.text();
      const parsed = parseBankStatementCSV(text);
      setTotalCount(parsed.length);
      // Show preview of first 20 rows
      setPreview(parsed.slice(0, 20));
    } catch (error: any) {
      alert(`Error parsing CSV: ${error.message}`);
      setFile(null);
      setPreview([]);
      setTotalCount(0);
    }
  }

  async function handleImportFromPublic() {
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("filePath", "sep-nov.csv");

      const response = await fetch("/api/import-expenses", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import expenses");
      }

      setImportResult(result);
      if (result.imported > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      alert(`Error importing expenses: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import-expenses", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import expenses");
      }

      setImportResult(result);
      if (result.imported > 0) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      alert(`Error importing expenses: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  function formatTimestamp(timestamp: string | null) {
    if (!timestamp) return "-";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Expenses from Bank Statement</DialogTitle>
          <DialogDescription>
            Upload a CSV file with bank statement transactions to import expenses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Upload CSV File</Label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Browse
              </Button>
            </div>
          </div>

          {/* Quick Import from Public Folder */}
          <div className="border-t pt-4">
            <Label>Quick Import</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Import from the sep-nov.csv file in the public folder
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleImportFromPublic}
              disabled={importing}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Import sep-nov.csv
                </>
              )}
            </Button>
          </div>

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>
                Preview (showing first {preview.length} of {totalCount} transactions)
              </Label>
              <div className="rounded-md border overflow-x-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Started At</TableHead>
                      <TableHead>Completed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((expense, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell className="max-w-xs truncate">{expense.vendor || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {expense.description || "-"}
                        </TableCell>
                        <TableCell className="font-medium">€{expense.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(expense.transaction_started_at)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(expense.transaction_completed_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold">Import Results</h4>
              <p className="text-sm">
                Successfully imported {importResult.imported} of {importResult.total} expenses
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-destructive">
                    Errors ({importResult.errors.length}):
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index}>
                        Row {error.row}: {error.error}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>... and {importResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={!file || importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import{" "}
                  {totalCount > 0 ? `${totalCount} Expense${totalCount !== 1 ? "s" : ""}` : "File"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
