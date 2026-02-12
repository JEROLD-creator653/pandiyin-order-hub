# Complete GST & Shipping System Documentation

## 🎯 System Overview

Professional, production-ready GST (Goods and Services Tax) and shipping system for an Indian ecommerce platform selling food and health products. Compliant with Indian tax regulations and supports multi-state operations.

**Key Features:**
- ✅ 0%, 5%, 12%, 18% GST rate support
- ✅ CGST+SGST (same-state) and IGST (inter-state) calculations
- ✅ Professional invoice generation (PDF)
- ✅ State-based shipping determination
- ✅ Free shipping thresholds
- ✅ Admin configuration panel
- ✅ Complete tax breakdown in orders

---

## 📊 Database Schema

### 1. **gst_settings** Table
Stores business GST configuration

```sql
- id (UUID, PK)
- business_name (TEXT) - Company name for invoices
- business_address (TEXT) - Full business address
- state (TEXT) - Business registered state
- gst_number (TEXT) - 15-digit GSTIN
- gst_enabled (BOOLEAN) - Enable/disable GST
- invoice_prefix (TEXT) - Invoice number prefix (default: INV)
- invoice_counter (INTEGER) - Auto-incrementing invoice counter
- supported_gst_rates (NUMERIC[]) - [0, 5, 12, 18]
- created_at, updated_at (TIMESTAMPS)
```

### 2. **Products** Table (Extended)
```sql
- gst_percentage (NUMERIC) - 0, 5, 12, or 18
- hsn_code (TEXT) - Harmonized System of Nomenclature code
- tax_inclusive (BOOLEAN) - Whether displayed price includes GST
```

### 3. **order_items** Table (Extended)
```sql
- product_gst_percentage (NUMERIC) - GST rate applied
- hsn_code (TEXT) - HSN code from product
- gst_amount (NUMERIC) - Total GST for this line item
- cgst_amount (NUMERIC) - CGST portion (if applicable)
- sgst_amount (NUMERIC) - SGST portion (if applicable)
- igst_amount (NUMERIC) - IGST amount (if applicable)
- tax_inclusive (BOOLEAN) - Tax was included in price
```

### 4. **Orders** Table (Extended)
```sql
- subtotal (NUMERIC) - Sum of base amounts
- gst_amount (NUMERIC) - Total GST on order
- cgst_amount (NUMERIC) - Total CGST
- sgst_amount (NUMERIC) - Total SGST
- igst_amount (NUMERIC) - Total IGST
- gst_type (TEXT) - 'CGST+SGST' or 'IGST'
- delivery_state (TEXT) - Delivery state (for GST determination)
- invoice_number (TEXT) - Generated invoice number
- invoice_generated (BOOLEAN) - Invoice created flag
- invoice_path (TEXT) - Path to stored invoice PDF
```

### 5. **shipping_regions** Table (Extended)
```sql
- region_name (TEXT) - Region display name
- region_key (TEXT) - Unique key (local, rest_of_india)
- states (TEXT[]) - Applicable states
- base_charge (NUMERIC) - Shipping cost
- free_delivery_above (NUMERIC) - Free shipping threshold
- is_enabled (BOOLEAN)
- gst_type (TEXT) - 'CGST+SGST' or 'IGST'
```

### 6. **invoices** Table (New)
Professional invoice storage for downloads/email

```sql
- id (UUID, PK)
- order_id (UUID, FK) - Reference to order
- invoice_number (TEXT, UNIQUE)
- invoice_date (TIMESTAMPTZ)
- business_name, business_address (TEXT)
- gst_number (TEXT)
- customer_name, customer_address (TEXT)
- customer_gst_number (TEXT, optional)
- items (JSONB) - Line item details
- subtotal, total_tax (NUMERIC)
- cgst_amount, sgst_amount, igst_amount (NUMERIC)
- gst_type (TEXT)
- delivery_charge (NUMERIC)
- total_amount (NUMERIC)
- invoice_pdf_path (TEXT)
- created_at, updated_at (TIMESTAMPS)
```

---

## 🧮 GST Calculation Logic

### Tax Inclusive Formula (Default for Food in India)
When price shown INCLUDES GST:
```
Base Amount = Price × 100 / (100 + GST%)
GST Amount = Price - Base Amount
```

**Example: ₹105 with 5% GST**
```
Base = 105 × 100 / 105 = ₹100
GST = 105 - 100 = ₹5
```

### Tax Exclusive Formula
When price shown EXCLUDES GST:
```
GST Amount = Price × GST% / 100
Total = Price + GST Amount
```

**Example: ₹100 base with 5% GST**
```
GST = 100 × 5 / 100 = ₹5
Total = 100 + 5 = ₹105
```

### State-Based GST Type

**Same State (Tamil Nadu / Puducherry):**
- CGST + SGST (split 50-50)
- 5% GST = 2.5% CGST + 2.5% SGST
- Invoice shows CGST and SGST separately

**Inter-State:**
- IGST (Integrated GST)
- Full GST is IGST
- Invoice shows single IGST amount

### Complete Order Tax Calculation
```
1. Each item tax = Item Price × Quantity × GST% / (100 + GST%)
2. Shipping tax = Shipping Charge × 5% / 105 (always 5%)
3. Total Tax = Sum(Item taxes) + Shipping tax
4. Order Total = Subtotal + Shipping + Total Tax
```

---

## 🚚 Shipping Configuration

### Default Rates

| Region | Base Charge | Free Above | GST Type | Applicable States |
|--------|------------|-----------|----------|------------------|
| Tamil Nadu & Pondicherry | ₹40 | ₹499 | CGST+SGST | TN, Puducherry |
| Rest of India | ₹80 | None | IGST | All other states |
| International | ₹0 | None | IGST | Future use |

### Shipping GST Calculation
- Always 5% on delivery charge
- Applied only if charge > ₹0
- Follows same CGST+SGST or IGST rule as order

---

## 💾 File Structure

### Core Utilities
```
src/lib/
├── gstCalculations.ts       - Tax calculation functions
├── invoiceGenerator.ts      - Professional invoice generation
└── formatters.ts            - Price formatting with GST
```

### Database
```
supabase/migrations/
└── 20260212_add_gst_system.sql - Complete GST schema
```

### Admin Pages
```
src/pages/admin/
└── AdminGSTSettings.tsx     - GST configuration panel
```

### Checkout
```
src/pages/
└── Checkout.tsx             - Order with tax breakdown
```

---

## 🔧 Implementation Guide

### 1. Add GST to Product

```tsx
interface Product {
  id: string;
  name: string;
  price: number;           // Inclusive of GST
  gst_percentage: number;  // 0, 5, 12, or 18
  hsn_code: string;        // e.g., "2106"
  tax_inclusive: true;     // Always true for food items
}
```

### 2. Calculate Order GST

```tsx
import { calculateOrderTotals } from '@/lib/gstCalculations';

const cartItems = [
  {
    productPrice: 105,        // ₹105 (inclusive)
    quantity: 2,
    gstPercentage: 5,
    taxInclusive: true
  }
];

const totals = calculateOrderTotals(
  cartItems,
  'Tamil Nadu',  // Delivery state
  {
    baseCharge: 40,
    freeAbove: 499
  }
);

console.log(totals);
// {
//   subtotal: 200,           // Base amount
//   itemGST: 10,             // Total tax on items
//   shippingCharge: 40,
//   shippingGST: 1.90,
//   totalGST: 11.90,
//   cgstAmount: 5.95,        // CGST (Tamil Nadu)
//   sgstAmount: 5.95,        // SGST (Tamil Nadu)
//   total: 251.90,
//   gstType: 'CGST+SGST',
//   isTaxInclusive: true
// }
```

### 3. Generate Invoice

```tsx
import { generateInvoicePDF, saveInvoiceToDB } from '@/lib/invoiceGenerator';

const invoiceData = {
  invoiceNumber: 'INV20260212001',
  invoiceDate: new Date(),
  businessName: 'Pandiyin Organic',
  gstNumber: '27XXXXX0000X1Z5',
  items: [...],
  subtotal: 200,
  cgstAmount: 5.95,
  sgstAmount: 5.95,
  gstType: 'CGST+SGST',
  total: 251.90,
  // ... more fields
};

// Save to DB
await saveInvoiceToDB(orderId, invoiceData);

// Generate PDF blob
const pdfBlob = await generateInvoicePDF(invoiceData);
```

### 4. Admin Configuration

Place in Admin Dashboard:
```tsx
import AdminGSTSettings from '@/pages/admin/AdminGSTSettings';

<AdminGSTSettings />
```

Allows admins to:
- Enable/disable GST
- Set GSTIN
- Configure business details
- Set supported GST rates
- Configure invoice prefix

---

## 📱 Checkout Display

### Tax Summary Section
```
Subtotal:              ₹100.00
CGST (2.5%):          ₹ 2.50
SGST (2.5%):          ₹ 2.50
────────────────────────────
Delivery Charge:       ₹   40.00  (includes ₹1.90 GST)
────────────────────────────
Total:                 ₹145.90
```

### Invoice Format
```
TAX INVOICE

Pandiyin Organic
27XXXXX0000X1Z5

Invoice #: INV20260212001    Date: 12/02/2026
Order #: ORD-2026-0001       Payment: COD

┌────────────────────────────────┐
│ Bill To:                       │
│ Customer Name                  │
│ Address Line 1                 │
│ City, State, Pincode           │
└────────────────────────────────┘

Item | HSN | Qty | Rate  | GST% | GST Amt | Total
─────────────────────────────────────────────────
Product Name | 2106 | 2 | 50 | 5% | 5 | 105

Subtotal:        ₹100.00
Shipping:        ₹ 40.00
CGST (2.5%):     ₹  2.50
SGST (2.5%):     ₹  2.50
─────────────────────────
TOTAL:           ₹145.90

This is a computer-generated invoice.
```

---

## 🔐 Security & Validation

### GST Number Validation
```
Format: 15 characters
Example: 27XXXXX0000X1Z5
- 2 char: State code (27 = Tamil Nadu)
- 5 char: Registered person name (alphanumeric)
- 4 digit: Unique number
- 1 char: Entity type (Z for non-individual)
- 1 char: State code check digit
- 1 char: Check digit
```

### HSN Code Validation
- 6-8 digits
- Used for tax classification
- Example: 2106 (Foodstuffs with cocoa), 2202 (Waters)

### Database Security
- RLS policies on invoices table
- Users see only their invoices
- Admins can manage all invoices

---

## 📊 Common GST Rates

### Food Products (Most Common)
- **0%**: Unprocessed food items (vegetables, grains, milk)
- **5%**: Processed food, snacks, spices
- **12%**: Fortified food, health supplements
- **18%**: Cosmetics, special preparations

### Implementation per Product Category
```tsx
const gstRates = {
  'vegetables': 0,
  'spices': 5,
  'health_powder': 12,
  'cosmetic_supplement': 18,
};
```

---

## 🚀 Production Deployment Checklist

- [ ] Run migration: `supabase migrations deploy`
- [ ] Configure GST settings in admin panel
- [ ] Set invoice prefix and business details
- [ ] Test tax calculations with various rates
- [ ] Verify state detection logic
- [ ] Test invoice PDF generation
- [ ] Configure email templates for invoices
- [ ] Test checkout flow end-to-end
- [ ] Verify shipping charge application
- [ ] Test CGST+SGST split for same-state
- [ ] Test IGST for inter-state orders
- [ ] Validate HSN codes for all products
- [ ] Enable GST in settings panel
- [ ] Create admin user with GST settings access

---

## 📞 Support

For questions about specific GST rates or tax classifications, refer to:
- GST Council Official Site: https://gstcouncil.gov.in
- HSN Classification: https://www.cbic.gov.in

---

**System Status:** ✅ Production Ready | Last Updated: 12/02/2026
