import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from './formatters';

const COMPANY = {
  name: 'PANDIYIN Nature In Pack',
  addressLine1: '802, VPM House, Mandhaikaliamman Kovil Street',
  addressLine2: 'Krishnapuram Road, M.Kallupatti',
  addressLine3: 'Madurai District – 625535',
  phone: '+91 63837 09933',
  email: 'pandiyinnatureinpack@gmail.com',
  website: 'https://pandiyin-natureinpack.vercel.app/',
  gstin: '33HADPM5916B1ZZ',
};

const STATE_GST_CODES: Record<string, string> = {
  'Jammu and Kashmir': '01', 'Himachal Pradesh': '02', 'Punjab': '03', 'Chandigarh': '04',
  'Uttarakhand': '05', 'Haryana': '06', 'Delhi': '07', 'Rajasthan': '08', 'Uttar Pradesh': '09',
  'Bihar': '10', 'Sikkim': '11', 'Arunachal Pradesh': '12', 'Nagaland': '13', 'Manipur': '14',
  'Mizoram': '15', 'Tripura': '16', 'Meghalaya': '17', 'Assam': '18', 'West Bengal': '19',
  'Jharkhand': '20', 'Odisha': '21', 'Chhattisgarh': '22', 'Madhya Pradesh': '23',
  'Gujarat': '24', 'Dadra and Nagar Haveli': '26', 'Daman and Diu': '25',
  'Maharashtra': '27', 'Andhra Pradesh': '37', 'Karnataka': '29', 'Goa': '30',
  'Lakshadweep': '31', 'Kerala': '32', 'Tamil Nadu': '33', 'Puducherry': '34', 'Pondicherry': '34',
  'Andaman and Nicobar Islands': '35', 'Telangana': '36', 'Ladakh': '38',
};

// Light green color for dividers/borders
const LIGHT_GREEN: [number, number, number] = [134, 197, 156];

export function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `PNP-${y}${m}${d}-${rand}`;
}

export interface InvoiceItem {
  name: string;
  hsn: string;
  quantity: number;
  price: number;
  total: number;
  gstPercentage: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderDate: string;
  orderTime: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerState: string;
  items: InvoiceItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: string;
  paymentGateway?: string;
  paymentStatus?: string;
  paymentId?: string;
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
  };

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  let result = '';
  if (rupees >= 10000000) {
    result += convertGroup(Math.floor(rupees / 10000000)) + ' Crore ';
    const r1 = rupees % 10000000;
    if (r1 >= 100000) result += convertGroup(Math.floor(r1 / 100000)) + ' Lakh ';
    const r2 = r1 % 100000;
    if (r2 >= 1000) result += convertGroup(Math.floor(r2 / 1000)) + ' Thousand ';
    const r3 = r2 % 1000;
    if (r3 > 0) result += convertGroup(r3);
  } else if (rupees >= 100000) {
    result += convertGroup(Math.floor(rupees / 100000)) + ' Lakh ';
    const r1 = rupees % 100000;
    if (r1 >= 1000) result += convertGroup(Math.floor(r1 / 1000)) + ' Thousand ';
    const r2 = r1 % 1000;
    if (r2 > 0) result += convertGroup(r2);
  } else if (rupees >= 1000) {
    result += convertGroup(Math.floor(rupees / 1000)) + ' Thousand ';
    const r = rupees % 1000;
    if (r > 0) result += convertGroup(r);
  } else {
    result += convertGroup(rupees);
  }

  result = result.trim() + ' Rupees';
  if (paise > 0) result += ' and ' + convertGroup(paise) + ' Paise';
  return result + ' Only';
}

function drawLightGreenLine(doc: jsPDF, y: number, margin: number, pw: number) {
  doc.setDrawColor(...LIGHT_GREEN);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pw - margin, y);
}

export function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // ─── LOGO PLACEHOLDER + COMPANY NAME ───
  // Draw a placeholder box for logo (will be replaced with actual logo)
  doc.setDrawColor(...LIGHT_GREEN);
  doc.setLineWidth(0.3);
  doc.rect(margin, y - 6, 18, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(160, 160, 160);
  doc.text('LOGO', margin + 9, y + 3.5, { align: 'center' });

  // Company details next to logo
  const logoRight = margin + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(COMPANY.name, logoRight, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60);
  doc.text(COMPANY.addressLine1, logoRight, y); y += 3.2;
  doc.text(COMPANY.addressLine2, logoRight, y); y += 3.2;
  doc.text(COMPANY.addressLine3, logoRight, y); y += 3.2;
  doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}`, logoRight, y); y += 3.2;
  doc.text(`Website: ${COMPANY.website}`, logoRight, y); y += 3.2;
  doc.text(`GSTIN: ${COMPANY.gstin}`, logoRight, y);

  // ─── TAX INVOICE (top right, simple black text) ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('TAX INVOICE', pw - margin, 14, { align: 'right' });

  y += 6;
  drawLightGreenLine(doc, y, margin, pw);
  y += 6;

  // ─── INVOICE METADATA (right side, two-column) ───
  const labelX = pw - 95;
  const valueX = pw - margin;
  let my = y;

  const addMetaRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.text(label, labelX, my);
    doc.setFont('helvetica', 'normal');
    doc.text(value, valueX, my, { align: 'right' });
    my += 4.5;
  };

  addMetaRow('Invoice Number', data.invoiceNumber);
  addMetaRow('Invoice Date', data.orderDate);
  addMetaRow('Time', data.orderTime);
  addMetaRow('Payment Method', data.paymentMethod);
  if (data.paymentGateway) addMetaRow('Payment Gateway', data.paymentGateway);
  if (data.paymentStatus) addMetaRow('Payment Status', data.paymentStatus);
  if (data.paymentId) addMetaRow('Payment ID', data.paymentId);

  // ─── BILL TO (left side, same Y range) ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Bill To:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30);
  doc.text(data.customerName, margin, y); y += 3.8;
  const custLines = data.customerAddress.split('\n');
  custLines.forEach(line => {
    doc.text(line, margin, y); y += 3.8;
  });
  doc.text(`Phone: ${data.customerPhone}`, margin, y); y += 5;

  const stateCode = STATE_GST_CODES[data.customerState] || '33';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text(`Place of Supply: ${data.customerState} – ${stateCode}`, margin, y);

  // Use max of bill-to Y and meta Y
  y = Math.max(y, my) + 6;
  drawLightGreenLine(doc, y, margin, pw);
  y += 6;

  // ─── ITEMS TABLE ───
  const tableHead = [['Sl.', 'Description', 'HSN/SAC', 'Qty', 'Unit Price', 'GST %', 'Total']];
  const tableBody = data.items.map((item, i) => [
    (i + 1).toString(),
    item.name,
    item.hsn || '-',
    item.quantity.toString(),
    formatPrice(item.price),
    `${item.gstPercentage}%`,
    formatPrice(item.total),
  ]);

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: LIGHT_GREEN,
      lineWidth: 0.4,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 30, 30],
      lineColor: LIGHT_GREEN,
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    styles: {
      lineColor: LIGHT_GREEN,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // ─── TAX BREAKDOWN ───
  const gstGroups: Record<number, number> = {};
  data.items.forEach(item => {
    const rate = item.gstPercentage || 0;
    const taxAmount = item.total * rate / (100 + rate);
    gstGroups[rate] = (gstGroups[rate] || 0) + taxAmount;
  });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  Object.entries(gstGroups).forEach(([rate, amount]) => {
    if (Number(rate) > 0) {
      doc.text(`Including ${rate}% GST: ${formatPrice(amount)}`, margin, y);
      y += 4;
    }
  });
  doc.setTextColor(0);
  y += 2;

  // ─── TOTALS (right-aligned) ───
  const totalsX = pw - 90;
  const valX = pw - margin;

  const addTotalLine = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 9.5 : 8.5);
    doc.setTextColor(0);
    doc.text(label, totalsX, y);
    doc.text(value, valX, y, { align: 'right' });
    y += 5.5;
  };

  addTotalLine('Subtotal:', formatPrice(data.subtotal));
  addTotalLine('Delivery Charge:', data.deliveryCharge === 0 ? 'FREE' : formatPrice(data.deliveryCharge));

  const totalGST = Object.values(gstGroups).reduce((a, b) => a + b, 0);
  addTotalLine('GST Included:', formatPrice(totalGST));

  if (data.discount > 0) {
    const discLabel = data.couponCode ? `Discount (${data.couponCode}):` : 'Discount:';
    addTotalLine(discLabel, `- ${formatPrice(data.discount)}`);
  }

  // Light green line above grand total
  drawLightGreenLine(doc, y, totalsX - 2, pw);
  y += 5;
  addTotalLine('Grand Total:', formatPrice(data.grandTotal), true);
  y += 2;

  // ─── AMOUNT IN WORDS ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text('Amount in Words:', margin, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const words = numberToWords(data.grandTotal);
  const wordLines = doc.splitTextToSize(words, pw - margin * 2);
  wordLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 3.8;
  });

  // ─── FOOTER (bottom of page) ───
  const footerY = ph - 12;
  drawLightGreenLine(doc, footerY, margin, pw);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text(
    `Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  Website: ${COMPANY.website}`,
    pw / 2,
    footerY + 6,
    { align: 'center' }
  );

  return doc;
}
