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

  if (invoiceData.gstType === 'CGST+SGST') {
    if (invoiceData.cgstAmount) {
      summaryLines.push([
        'CGST (Central GST)',
        `₹${invoiceData.cgstAmount.toFixed(2)}`,
      ]);
    }
    if (invoiceData.sgstAmount) {
      summaryLines.push([
        'SGST (State GST)',
        `₹${invoiceData.sgstAmount.toFixed(2)}`,
      ]);
    }
  } else {
    if (invoiceData.igstAmount) {
      summaryLines.push([
        'IGST (Integrated GST)',
        `₹${invoiceData.igstAmount.toFixed(2)}`,
      ]);
    }
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

  // Tax Inclusion Note
  lineY += 8;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const taxNoteWidth = pageWidth - 30;
  const taxNoteText = 'Note: The product prices and amounts shown above include all applicable GST. The tax breakdown is provided for informational and compliance purposes only.';
  doc.text(taxNoteText, 15, lineY, { maxWidth: taxNoteWidth, align: 'left' });
  doc.setTextColor(0, 0, 0);

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

/**
 * Save invoice to database
 * @param orderID - Order ID
 * @param invoiceData - Invoice information
 * @returns Created invoice record
 */
export async function saveInvoiceToDB(orderID: string, invoiceData: InvoiceData) {
  const { data, error } = await supabase.from('invoices').insert({
    order_id: orderID,
    invoice_number: invoiceData.invoiceNumber,
    invoice_date: invoiceData.invoiceDate,
    business_name: invoiceData.businessName,
    business_address: invoiceData.businessAddress,
    gst_number: invoiceData.gstNumber,
    customer_name: invoiceData.customerName,
    customer_address: invoiceData.customerAddress,
    customer_gst_number: invoiceData.customerGSTNumber || '',
    items: invoiceData.items,
    subtotal: invoiceData.subtotal,
    cgst_amount: invoiceData.cgstAmount || 0,
    sgst_amount: invoiceData.sgstAmount || 0,
    igst_amount: invoiceData.igstAmount || 0,
    total_tax: invoiceData.totalTax,
    gst_type: invoiceData.gstType,
    delivery_charge: invoiceData.shippingCharge,
    total_amount: invoiceData.total,
  });

  if (error) {
    throw new Error(`Failed to save invoice: ${error.message}`);
  }

  return data;
}

/**
 * Fetch invoice for order
 * @param orderID - Order ID
 * @returns Invoice data or null
 */
export async function fetchInvoiceForOrder(orderID: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('order_id', orderID)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
}

/**
 * Download invoice PDF by order ID
 * @param orderID - Order ID
 */
export async function downloadInvoicePDF(orderID: string) {
  const invoice = await fetchInvoiceForOrder(orderID);

  if (!invoice) {
    throw new Error('Invoice not found for this order');
  }

  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoice_number,
    invoiceDate: new Date(invoice.invoice_date),
    businessName: invoice.business_name,
    businessAddress: invoice.business_address,
    gstNumber: invoice.gst_number,
    customerName: invoice.customer_name,
    customerAddress: invoice.customer_address,
    customerGSTNumber: invoice.customer_gst_number,
    items: invoice.items,
    subtotal: invoice.subtotal,
    cgstAmount: invoice.cgst_amount,
    sgstAmount: invoice.sgst_amount,
    igstAmount: invoice.igst_amount,
    totalTax: invoice.total_tax,
    shippingCharge: invoice.delivery_charge,
    total: invoice.total_amount,
    gstType: invoice.gst_type,
    paymentMethod: 'N/A',
    orderNumber: orderID,
  };

  const blob = await generateInvoicePDF(invoiceData);

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice-${invoice.invoice_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
