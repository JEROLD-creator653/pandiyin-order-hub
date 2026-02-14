/**
 * Professional Invoice Generation System
 * Generates GST-compliant invoices for Indian ecommerce
 */

import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  businessName: string;
  businessAddress: string;
  gstNumber: string;
  customerName: string;
  customerAddress: string;
  customerGSTNumber?: string;
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    gstPercentage: number;
    gstAmount: number;
    totalAmount: number;
  }>;
  subtotal: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalTax: number;
  shippingCharge: number;
  total: number;
  gstType: 'CGST+SGST' | 'IGST';
  paymentMethod: string;
  orderNumber: string;
  notes?: string;
}

/**
 * Generate professional GST invoice as PDF
 * @param invoiceData - Complete invoice information
 * @returns PDF blob for download
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 10;

  // Set fonts
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);

  // Header with logo area
  doc.text('TAX INVOICE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Business Information
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoiceData.businessName, 15, yPosition);
  yPosition += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invoiceData.businessAddress, 15, yPosition);
  yPosition += 4;
  doc.text(`GSTIN: ${invoiceData.gstNumber}`, 15, yPosition);
  yPosition += 8;

  // Invoice Details Box
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.rect(15, yPosition, 170, 25);
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 20, yPosition + 5);
  doc.text(`Order #: ${invoiceData.orderNumber}`, 100, yPosition + 5);
  doc.text(`Date: ${invoiceData.invoiceDate.toLocaleDateString('en-IN')}`, 20, yPosition + 10);
  doc.text(
    `Payment: ${invoiceData.paymentMethod}`,
    100,
    yPosition + 10
  );
  yPosition += 30;

  // Bill To / Ship To
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill To:', 15, yPosition);
  yPosition += 5;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invoiceData.customerName, 15, yPosition);
  yPosition += 4;
  
  const addressLines = invoiceData.customerAddress.split('\n');
  for (const line of addressLines) {
    doc.text(line, 15, yPosition);
    yPosition += 4;
  }

  if (invoiceData.customerGSTNumber) {
    yPosition += 1;
    doc.text(`GSTIN: ${invoiceData.customerGSTNumber}`, 15, yPosition);
    yPosition += 4;
  }

  yPosition += 3;

  // Items Table
  const columns = ['Item', 'HSN', 'Qty', 'Unit Price', 'GST%', 'GST Amount', 'Total'];
  const rows = invoiceData.items.map((item) => [
    item.description,
    item.hsnCode,
    item.quantity.toString(),
    `₹${item.unitPrice.toFixed(2)}`,
    `${item.gstPercentage}%`,
    `₹${item.gstAmount.toFixed(2)}`,
    `₹${item.totalAmount.toFixed(2)}`,
  ]);

  (doc as any).autoTable({
    head: [columns],
    body: rows,
    startY: yPosition,
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      2: { halign: 'center' }, // Qty
      3: { halign: 'right' }, // Unit Price
      4: { halign: 'center' }, // GST%
      5: { halign: 'right' }, // GST Amount
      6: { halign: 'right' }, // Total
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 8;

  // Tax Summary Box
  const boxWidth = 80;
  const boxX = pageWidth - 15 - boxWidth;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);

  const summaryLines = [
    ['Subtotal', `₹${invoiceData.subtotal.toFixed(2)}`],
    ['Shipping', `₹${invoiceData.shippingCharge.toFixed(2)}`],
  ];

  if (invoiceData.totalTax > 0) {
    summaryLines.push([
      'Including 5% in taxes',
      `₹${invoiceData.totalTax.toFixed(2)}`,
    ]);
  }

  let lineY = yPosition;
  for (const [label, value] of summaryLines) {
    doc.setFont('Helvetica', 'normal');
    doc.text(label, boxX, lineY);
    doc.text(value, pageWidth - 18, lineY, { align: 'right' });
    lineY += 5;
  }

  // Total Amount
  lineY += 2;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total Amount Due', boxX, lineY);
  doc.text(`₹${invoiceData.total.toFixed(2)}`, pageWidth - 18, lineY, { align: 'right' });


  // Footer
  yPosition = pageHeight - 20;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.text(
    'This is a computer-generated invoice. No signature required.',
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  if (invoiceData.notes) {
    yPosition += 5;
    doc.setFont('Helvetica', 'normal');
    doc.text(`Notes: ${invoiceData.notes}`, 15, yPosition);
  }

  yPosition += 8;
  doc.text(
    `Generated on ${new Date().toLocaleString('en-IN')}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );

  return doc.output('blob');
}

/**
 * Generate invoice number
 * Format: INV-YYYYMMDD-XXXXX
 * @returns Generated invoice number
 */
export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, '0');

  return `INV${year}${month}${day}${random}`;
}

// Note: Invoice storage to database removed as 'invoices' table does not exist in schema
// Use invoicePdf.ts (generateInvoicePdf) for direct PDF generation from order data
