import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from './formatters';

// Hard-coded company details per user request
const COMPANY = {
  name: 'PANDIYIN Nature In Pack',
  address: '802, VPM House, Mandhaikaliamman Kovil Street,\nKrishnapuram Road, M.Kallupatti,\nMadurai District - 625535',
  phone: '+91 63837 09933',
  email: 'pandiyinnatureinpack@gmail.com',
  gstin: '33HADPM5916B1ZZ',
};

/**
 * Generate a unique invoice number: PNP-YYYYMMDD-{6 hex chars}
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hex = Math.random().toString(16).substring(2, 8); // 6 hex chars
  return `PNP-${y}${m}${d}-${hex}`;
}

export interface InvoiceItem {
  name: string;
  hsn: string;
  quantity: number;
  price: number;     // unit price (GST-inclusive)
  total: number;     // price × qty
  gstPercentage: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderDate: string;        // formatted date string
  customerName: string;
  customerAddress: string;  // multi-line
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;         // sum of item totals
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;       // subtotal + delivery - discount
  paymentMethod: string;    // 'Online' or 'Cash on Delivery'
}

export function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 15;

  // ─── HEADER: Company Details ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(COMPANY.name, pw / 2, y, { align: 'center' });
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  const addrLines = COMPANY.address.split('\n');
  addrLines.forEach(line => {
    doc.text(line, pw / 2, y, { align: 'center' });
    y += 3.5;
  });
  doc.text(`Phone: ${COMPANY.phone}`, pw / 2, y, { align: 'center' }); y += 3.5;
  doc.text(`Email: ${COMPANY.email}`, pw / 2, y, { align: 'center' }); y += 3.5;
  doc.text(`GSTIN: ${COMPANY.gstin}`, pw / 2, y, { align: 'center' }); y += 5;

  doc.setTextColor(0);
  doc.setDrawColor(180);
  doc.line(14, y, pw - 14, y);
  y += 6;

  // ─── TAX INVOICE title ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TAX INVOICE', pw / 2, y, { align: 'center' });
  y += 8;

  // ─── Invoice Meta ───
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${data.invoiceNumber}`, 14, y);
  doc.text(`Date: ${data.orderDate}`, pw - 14, y, { align: 'right' });
  y += 8;

  // ─── Bill To ───
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, 14, y); y += 4;
  const custLines = data.customerAddress.split('\n');
  custLines.forEach(line => {
    doc.text(line, 14, y); y += 4;
  });
  doc.text(`Phone: ${data.customerPhone}`, 14, y);
  y += 8;

  // ─── Items Table ───
  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'HSN', 'Qty', 'Unit Price', 'Total', 'GST %']],
    body: data.items.map((item, i) => [
      (i + 1).toString(),
      item.name,
      item.hsn || '-',
      item.quantity.toString(),
      formatPrice(item.price),
      formatPrice(item.total),
      `${item.gstPercentage}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [45, 55, 72], fontSize: 8.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 16, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── Tax Summary (GST inclusive) ───
  // Group items by GST % and compute tax for each
  const gstGroups: Record<number, number> = {};
  data.items.forEach(item => {
    const rate = item.gstPercentage || 0;
    const taxAmount = item.total * rate / (100 + rate);
    gstGroups[rate] = (gstGroups[rate] || 0) + taxAmount;
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  Object.entries(gstGroups).forEach(([rate, amount]) => {
    if (Number(rate) > 0) {
      doc.text(`Including ${rate}% GST in taxes: ${formatPrice(amount)}`, 14, y);
      y += 4;
    }
  });
  doc.setTextColor(0);
  y += 3;

  // ─── Order Totals ───
  const summaryX = pw - 85;
  const addLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 10 : 9);
    doc.text(label, summaryX, y);
    doc.text(value, pw - 14, y, { align: 'right' });
    y += 5;
  };

  addLine('Subtotal', formatPrice(data.subtotal));
  addLine('Delivery', data.deliveryCharge === 0 ? 'Free' : formatPrice(data.deliveryCharge));
  if (data.discount > 0) {
    const discLabel = data.couponCode ? `Coupon (${data.couponCode})` : 'Discount';
    addLine(discLabel, `- ${formatPrice(data.discount)}`);
  }

  y += 2;
  doc.setDrawColor(180);
  doc.line(summaryX, y, pw - 14, y);
  y += 6;
  addLine('Grand Total', formatPrice(data.grandTotal), true);

  // ─── Payment & Footer ───
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Payment: ${data.paymentMethod}`, 14, y);
  y += 12;

  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('Thank you for your purchase!', pw / 2, y, { align: 'center' });

  return doc;
}
