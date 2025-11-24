import { getPaymentLinkUrl } from "./invoices";

/**
 * Generate invoice email HTML template
 */
export function generateInvoiceEmailTemplate(data: {
  invoiceNumber: string;
  customerName: string;
  total: number;
  dueDate: string;
  paymentLink?: string;
}): string {
  const paymentButton = data.paymentLink
    ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.paymentLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Pay Invoice
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">New Invoice</h1>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>We have issued a new invoice for your records:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> €${data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
        </div>
        
        ${paymentButton}
        
        <p>Please review the invoice and let us know if you have any questions.</p>
        
        <p>Best regards,<br>Kodo Budget</p>
      </body>
    </html>
  `;
}

/**
 * Generate client portal access email HTML template
 */
export function generateClientPortalAccessEmailTemplate(data: {
  customerName: string;
  accessLink: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">Client Portal Access</h1>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>You have been granted access to your client portal. Click the link below to access your invoices and account information:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.accessLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Client Portal
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">This link will expire in 7 days. If you need a new link, please contact us.</p>
        
        <p>Best regards,<br>Kodo Budget</p>
      </body>
    </html>
  `;
}

/**
 * Generate payment reminder email HTML template
 */
export function generatePaymentReminderEmailTemplate(data: {
  invoiceNumber: string;
  customerName: string;
  total: number;
  dueDate: string;
  paymentLink?: string;
  daysOverdue?: number;
}): string {
  const overdueMessage = data.daysOverdue
    ? `<p style="color: #dc3545; font-weight: bold;">This invoice is ${data.daysOverdue} day${data.daysOverdue > 1 ? "s" : ""} overdue.</p>`
    : "";

  const paymentButton = data.paymentLink
    ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.paymentLink}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Pay Invoice Now
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h1 style="color: #856404; margin: 0;">Payment Reminder</h1>
        </div>
        
        <p>Dear ${data.customerName},</p>
        
        <p>This is a friendly reminder that the following invoice is due for payment:</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> €${data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
        </div>
        
        ${overdueMessage}
        
        ${paymentButton}
        
        <p>If you have already made payment, please disregard this email.</p>
        
        <p>Best regards,<br>Kodo Budget</p>
      </body>
    </html>
  `;
}
