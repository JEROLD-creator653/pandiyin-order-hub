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
  items: { name: string; quantity: number; price: number; total: number; gst?: number; hsn?: string }[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
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

  // Items table
  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'HSN', 'Qty', 'Price', 'Total', 'GST']],
    body: data.items.map((item, i) => [
      (i + 1).toString(),
      item.name,
      item.hsn || '-',
      item.quantity.toString(),
      formatPrice(item.price),
      formatPrice(item.total),
      item.gst ? formatPrice(item.gst) : '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [45, 55, 72], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Summary
  const summaryX = pageWidth - 80;
  doc.setFontSize(9);
  const addLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, summaryX, y);
    doc.text(value, pageWidth - 14, y, { align: 'right' });
    y += 5;
  };

  addLine('Subtotal', formatPrice(data.subtotal));
  if (data.discount > 0) addLine('Discount', `-${formatPrice(data.discount)}`);
  addLine('Delivery', data.deliveryCharge === 0 ? 'Free' : formatPrice(data.deliveryCharge));
  
  // Display GST breakdown based on type
  if ((data.gstAmount && data.gstAmount > 0) || (data.cgstAmount && data.cgstAmount > 0) || (data.igstAmount && data.igstAmount > 0)) {
    if (data.gstType === 'cgst_sgst') {
      if (data.cgstAmount && data.cgstAmount > 0) {
        addLine(`CGST (${(data.gstPercentage || 0) / 2}%)`, formatPrice(data.cgstAmount));
      }
      if (data.sgstAmount && data.sgstAmount > 0) {
        addLine(`SGST (${(data.gstPercentage || 0) / 2}%)`, formatPrice(data.sgstAmount));
      }
    } else if (data.gstType === 'igst') {
      if (data.igstAmount && data.igstAmount > 0) {
        addLine(`IGST (${data.gstPercentage || 0}%)`, formatPrice(data.igstAmount));
      }
    } else if (data.gstAmount && data.gstAmount > 0) {
      addLine(`GST (${data.gstPercentage || 0}%)`, formatPrice(data.gstAmount));
    }
  }
  
  y += 2;
  doc.line(summaryX, y, pageWidth - 14, y);
  y += 6;
  addLine('Grand Total', formatPrice(data.total), true);

  y += 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Payment: ${data.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online'} | Status: ${data.paymentStatus}`, 14, y);
  y += 12;

  doc.setTextColor(150);
  doc.setFontSize(8);
  doc.text('Thank you for your purchase!', pageWidth / 2, y, { align: 'center' });

  return doc;
}
