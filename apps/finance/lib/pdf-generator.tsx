"use client";

import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { format } from "date-fns";
import type React from "react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  invoiceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#bfbfbf",
    borderBottomStyle: "solid",
  },
  tableColHeader: {
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#bfbfbf",
    padding: 8,
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCol: {
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#bfbfbf",
    padding: 8,
  },
  tableColSmall: {
    width: "20%",
    padding: 8,
  },
  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: "bold",
  },
  totalAmount: {
    fontWeight: "bold",
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  customer: {
    name: string;
    email?: string | null;
    business_address?: string | null;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string | null;
}

const InvoicePDF: React.FC<{ invoice: InvoiceData }> = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE</Text>
        <Text>Invoice #: {invoice.invoice_number}</Text>
      </View>

      <View style={styles.invoiceInfo}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text>{invoice.customer.name}</Text>
          {invoice.customer.email && <Text>{invoice.customer.email}</Text>}
          {invoice.customer.business_address && <Text>{invoice.customer.business_address}</Text>}
        </View>

        <View style={styles.section}>
          <Text>Issue Date: {format(new Date(invoice.issue_date), "MMM dd, yyyy")}</Text>
          <Text>Due Date: {format(new Date(invoice.due_date), "MMM dd, yyyy")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Description</Text>
            <Text style={[styles.tableColHeader, styles.tableColSmall]}>Qty</Text>
            <Text style={[styles.tableColHeader, styles.tableColSmall]}>Price</Text>
            <Text style={[styles.tableColHeader, styles.tableColSmall]}>Total</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol}>{item.description}</Text>
              <Text style={[styles.tableCol, styles.tableColSmall]}>{item.quantity}</Text>
              <Text style={[styles.tableCol, styles.tableColSmall]}>
                €{item.unit_price.toFixed(2)}
              </Text>
              <Text style={[styles.tableCol, styles.tableColSmall]}>€{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text>€{invoice.subtotal.toFixed(2)}</Text>
        </View>
        {invoice.tax_rate > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
            <Text>€{invoice.tax_amount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalAmount}>Total:</Text>
          <Text style={styles.totalAmount}>€{invoice.total.toFixed(2)}</Text>
        </View>
      </View>

      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes:</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Blob> {
  const doc = <InvoicePDF invoice={invoice} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  return blob;
}
