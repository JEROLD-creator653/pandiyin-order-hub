import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from './formatters';

interface InvoiceData {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  gstNumber?: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: { name: string; quantity: number; price: number; total: number; gst?: number; hsn?: string; gstPercentage?: number }[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  gstAmount?: number;
  gstPercentage?: number;
  gstType?: 'cgst_sgst' | 'igst';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

export function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.storeName, pageWidth / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  if (data.storeAddress) { doc.text(data.storeAddress, pageWidth / 2, y, { align: 'center' }); y += 5; }
  if (data.storePhone) { doc.text(`Phone: ${data.storePhone}`, pageWidth / 2, y, { align: 'center' }); y += 5; }
  if (data.storeEmail) { doc.text(`Email: ${data.storeEmail}`, pageWidth / 2, y, { align: 'center' }); y += 5; }
  if (data.gstNumber) { doc.text(`GSTIN: ${data.gstNumber}`, pageWidth / 2, y, { align: 'center' }); y += 5; }

  doc.setTextColor(0);
  y += 3;
  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Invoice title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Order & Customer info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${data.orderNumber}`, 14, y);
  doc.text(`Date: ${data.orderDate}`, pageWidth - 14, y, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(data.customerName, 14, y); y += 4;
  doc.text(data.customerAddress, 14, y); y += 4;
  doc.text(`Phone: ${data.customerPhone}`, 14, y);
  y += 10;

  // Items table with GST percentage per item
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
      item.gstPercentage ? `${item.gstPercentage}%` : '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [45, 55, 72], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // GST Line - Single (already included in total)
  if (data.gstAmount && data.gstAmount > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Including 5% in taxes: ${formatPrice(data.gstAmount)}`, 14, y);
    y += 5;
  }

  // Summary
  const summaryX = pageWidth - 80;
  y += 2;
  doc.setFontSize(9);
  doc.setTextColor(0);
  const addLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, summaryX, y);
    doc.text(value, pageWidth - 14, y, { align: 'right' });
    y += 5;
  };

  addLine('Subtotal', formatPrice(data.subtotal));
  addLine('Delivery', data.deliveryCharge === 0 ? 'Free' : formatPrice(data.deliveryCharge));
  if (data.discount > 0) {
    const discountLabel = data.couponCode ? `Coupon Discount (${data.couponCode})` : 'Discount';
    addLine(discountLabel, `-${formatPrice(data.discount)}`);
  }
  
  y += 2;
  doc.line(summaryX, y, pageWidth - 14, y);
  y += 6;
  addLine('Grand Total', formatPrice(data.total), true);

  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Payment: ${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'}`, 14, y);
  y += 12;

  doc.setTextColor(150);
  doc.setFontSize(8);
  doc.text('Thank you for your purchase!', pageWidth / 2, y, { align: 'center' });

  return doc;
}
