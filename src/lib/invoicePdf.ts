import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from './formatters';

// Company details
const COMPANY = {
  name: 'PANDIYIN Nature In Pack',
  addressLine1: '802, VPM House, Mandhaikaliamman Kovil Street',
  addressLine2: 'Krishnapuram Road, M.Kallupatti',
  addressLine3: 'Madurai District - 625535',
  phone: '+91 63837 09933',
  email: 'pandiyinnatureinpack@gmail.com',
  website: 'https://pandiyin-natureinpack.vercel.app/',
  gstin: '33HADPM5916B1ZZ',
};

// State GST codes
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

/**
 * Generate a unique invoice number: PNP-YYYYMMDD-{6 random alphanumeric}
 */
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
  price: number;     // unit price (GST-inclusive)
  total: number;     // price × qty
  gstPercentage: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderDate: string;
  orderTime: string;
  customerName: string;
  customerAddress: string;  // multi-line
  customerPhone: string;
  customerState: string;
  items: InvoiceItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: string;
}

/** Convert number to words (Indian currency) */
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
    const remainder = rupees % 10000000;
    if (remainder >= 100000) result += convertGroup(Math.floor(remainder / 100000)) + ' Lakh ';
    const rem2 = remainder % 100000;
    if (rem2 >= 1000) result += convertGroup(Math.floor(rem2 / 1000)) + ' Thousand ';
    const rem3 = rem2 % 1000;
    if (rem3 > 0) result += convertGroup(rem3);
  } else if (rupees >= 100000) {
    result += convertGroup(Math.floor(rupees / 100000)) + ' Lakh ';
    const remainder = rupees % 100000;
    if (remainder >= 1000) result += convertGroup(Math.floor(remainder / 1000)) + ' Thousand ';
    const rem2 = remainder % 1000;
    if (rem2 > 0) result += convertGroup(rem2);
  } else if (rupees >= 1000) {
    result += convertGroup(Math.floor(rupees / 1000)) + ' Thousand ';
    const rem = rupees % 1000;
    if (rem > 0) result += convertGroup(rem);
  } else {
    result += convertGroup(rupees);
  }

  result = result.trim() + ' Rupees';
  if (paise > 0) result += ' and ' + convertGroup(paise) + ' Paise';
  return result + ' Only';
}

// Colors
const DARK_GREEN: [number, number, number] = [21, 71, 52];
const LIGHT_GREEN: [number, number, number] = [240, 253, 244];
const GOLD: [number, number, number] = [202, 138, 4];
const WHITE: [number, number, number] = [255, 255, 255];

export function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth(); // 210
  const ph = doc.internal.pageSize.getHeight(); // 297
  const margin = 14;
  let y = 0;

  // ─── DARK GREEN HEADER BAR ───
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, 0, pw, 22, 'F');

  // Company name on left
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text(COMPANY.name, margin, 14);

  // Gold "TAX INVOICE" label on right
  doc.setFillColor(...GOLD);
  doc.roundedRect(pw - 72, 3.5, 58, 15, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text('TAX INVOICE', pw - 43, 9.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('Original for Recipient', pw - 43, 14.5, { align: 'center' });

  y = 28;

  // ─── COMPANY DETAILS ───
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(COMPANY.addressLine1, margin, y); y += 3.5;
  doc.text(COMPANY.addressLine2, margin, y); y += 3.5;
  doc.text(COMPANY.addressLine3, margin, y); y += 3.5;
  doc.text(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email}`, margin, y); y += 3.5;
  doc.text(`Website: ${COMPANY.website}`, margin, y); y += 3.5;
  doc.text(`GSTIN: ${COMPANY.gstin}`, margin, y);

  // ─── INVOICE DETAILS (right side) ───
  const rightCol = pw - margin;
  let ry = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text('Invoice Number:', rightCol - 50, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(data.invoiceNumber, rightCol, ry, { align: 'right' });
  ry += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', rightCol - 50, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(data.orderDate, rightCol, ry, { align: 'right' });
  ry += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Time:', rightCol - 50, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(data.orderTime, rightCol, ry, { align: 'right' });
  ry += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.text('Payment:', rightCol - 50, ry);
  doc.setFont('helvetica', 'normal');
  doc.text(data.paymentMethod, rightCol, ry, { align: 'right' });

  y += 6;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, pw - margin, y);
  y += 6;

  // ─── BILLING TO ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK_GREEN);
  doc.text('Bill To:', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(0);
  doc.text(data.customerName, margin, y); y += 4;
  const custLines = data.customerAddress.split('\n');
  custLines.forEach(line => {
    doc.text(line, margin, y); y += 4;
  });
  doc.text(`Phone: ${data.customerPhone}`, margin, y); y += 5;

  // Place of Supply
  const stateCode = STATE_GST_CODES[data.customerState] || '33';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Place of Supply: ${data.customerState} – ${stateCode}`, margin, y);
  y += 8;

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
      fillColor: DARK_GREEN,
      textColor: WHITE,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: LIGHT_GREEN },
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

  // ─── TAX CALCULATION ───
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
  doc.setFontSize(7);
  doc.text('Whether tax payable under reverse charge: No', margin, y);
  y += 6;
  doc.setTextColor(0);

  // ─── TOTALS SECTION (right-aligned) ───
  const totalsX = pw - 90;
  const valX = pw - margin;

  const addTotalLine = (label: string, value: string, bold = false, highlight = false) => {
    if (highlight) {
      doc.setFillColor(...DARK_GREEN);
      doc.rect(totalsX - 4, y - 4, pw - margin - totalsX + 8, 7, 'F');
      doc.setTextColor(...WHITE);
    }
    doc.setFont('helvetica', bold || highlight ? 'bold' : 'normal');
    doc.setFontSize(bold || highlight ? 9.5 : 8.5);
    doc.text(label, totalsX, y);
    doc.text(value, valX, y, { align: 'right' });
    if (highlight) doc.setTextColor(0);
    y += 6;
  };

  addTotalLine('Subtotal:', formatPrice(data.subtotal));
  addTotalLine('Delivery Charge:', data.deliveryCharge === 0 ? 'FREE' : formatPrice(data.deliveryCharge));

  // GST included line
  const totalGST = Object.values(gstGroups).reduce((a, b) => a + b, 0);
  addTotalLine('GST Included:', formatPrice(totalGST));

  if (data.discount > 0) {
    const discLabel = data.couponCode ? `Discount (${data.couponCode}):` : 'Discount:';
    addTotalLine(discLabel, `- ${formatPrice(data.discount)}`);
  }

  y += 2;
  addTotalLine('Grand Total:', formatPrice(data.grandTotal), true, true);
  y += 2;

  // ─── AMOUNT IN WORDS ───
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...DARK_GREEN);
  doc.text('Amount in Words:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(8);
  
  const words = numberToWords(data.grandTotal);
  const wordLines = doc.splitTextToSize(words, pw - margin * 2);
  y += 4.5;
  wordLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 4;
  });
  y += 4;

  // ─── DIVIDER ───
  doc.setDrawColor(200);
  doc.line(margin, y, pw - margin, y);
  y += 8;

  // ─── FOOTER SECTION ───
  // Left: computer-generated note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text('This is a computer-generated invoice and does not', margin, y);
  doc.text('require a physical signature.', margin, y + 3.5);

  // Right: Authorized signatory
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text('For PANDIYIN Nature In Pack', pw - margin, y, { align: 'right' });
  y += 14;
  doc.setDrawColor(100);
  doc.line(pw - 65, y, pw - margin, y); // signature line
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text('Authorised Signatory', pw - margin, y, { align: 'right' });

  // ─── BOTTOM FOOTER BAR ───
  const footerBarY = ph - 12;
  doc.setFillColor(...DARK_GREEN);
  doc.rect(0, footerBarY, pw, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(`Phone: ${COMPANY.phone}  |  Email: ${COMPANY.email}  |  Website: ${COMPANY.website}`, pw / 2, footerBarY + 7, { align: 'center' });

  return doc;
}
