/**
 * Bank Statement CSV Parser
 * Parses CSV files from bank statements and maps them to expense format
 */

export interface BankStatementRow {
  Type: string;
  Product: string;
  "Started Date": string;
  "Completed Date": string;
  Description: string;
  Amount: string;
  Fee: string;
  Currency: string;
  State: string;
  Balance: string;
}

export interface ParsedExpense {
  vendor: string | null;
  description: string | null;
  amount: number;
  date: string; // YYYY-MM-DD format for backward compatibility
  transaction_started_at: string | null; // ISO timestamp
  transaction_completed_at: string | null; // ISO timestamp
  category: string | null; // Will be set during import via auto-categorization
  project_id: string | null;
}

/**
 * Parse CSV content into array of rows
 * Handles quoted fields and escaped quotes
 */
function parseCSV(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // End of line (handle both \n and \r\n)
      if (char === "\n" || (char === "\r" && nextChar !== "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      }
      // If \r\n, skip the \r and let \n handle it
    } else {
      currentField += char;
    }
  }

  // Add last field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Convert CSV row array to object using headers
 */
function rowToObject(headers: string[], row: string[]): Partial<BankStatementRow> {
  const obj: Partial<BankStatementRow> = {};
  headers.forEach((header, index) => {
    obj[header as keyof BankStatementRow] = row[index] || "";
  });
  return obj;
}

/**
 * Parse timestamp string to ISO format
 */
function parseTimestamp(timestampStr: string): string | null {
  if (!timestampStr || timestampStr.trim() === "") {
    return null;
  }

  try {
    const date = new Date(timestampStr);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch (error) {
    console.error("Error parsing timestamp:", timestampStr, error);
    return null;
  }
}

/**
 * Extract date from timestamp (YYYY-MM-DD format)
 */
function extractDate(timestampStr: string): string {
  if (!timestampStr || timestampStr.trim() === "") {
    return new Date().toISOString().split("T")[0];
  }

  try {
    const date = new Date(timestampStr);
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error extracting date:", timestampStr, error);
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Parse bank statement CSV file and convert to expense format
 */
export function parseBankStatementCSV(csvContent: string): ParsedExpense[] {
  const rows = parseCSV(csvContent);

  if (rows.length < 2) {
    throw new Error("CSV file must have at least a header row and one data row");
  }

  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1);

  // Validate required columns
  const requiredColumns = ["Type", "Description", "Amount", "Completed Date"];
  const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  const expenses: ParsedExpense[] = [];

  for (const row of dataRows) {
    if (row.length === 0 || row.every((cell) => cell.trim() === "")) {
      continue; // Skip empty rows
    }

    const rowObj = rowToObject(headers, row) as BankStatementRow;

    // Parse amount - convert negative to positive (all transactions are expenses)
    const amountStr = rowObj.Amount?.trim() || "0";
    const amount = Math.abs(Number.parseFloat(amountStr));

    if (Number.isNaN(amount)) {
      console.warn(`Invalid amount: ${amountStr}, skipping row`);
      continue;
    }

    // Parse timestamps
    const startedDate = rowObj["Started Date"]?.trim() || "";
    const completedDate = rowObj["Completed Date"]?.trim() || "";

    const transaction_started_at = parseTimestamp(startedDate);
    const transaction_completed_at = parseTimestamp(completedDate);

    // Extract date from completed date for backward compatibility
    const date = extractDate(completedDate || startedDate);

    // Use description for both vendor and description
    const description = rowObj.Description?.trim() || null;
    const vendor = description; // For bank statements, description often contains vendor name

    expenses.push({
      vendor,
      description,
      amount,
      date,
      transaction_started_at,
      transaction_completed_at,
      category: null, // Will be auto-categorized during import
      project_id: null,
    });
  }

  return expenses;
}
