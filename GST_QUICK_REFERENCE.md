# GST & Shipping System - Quick Reference Card

## 🎯 Quick Links

| Component | File | Purpose |
|-----------|------|---------|
| Tax Calculations | `src/lib/gstCalculations.ts` | Core GST math |
| Invoices | `src/lib/invoiceGenerator.ts` | PDF generation |
| Admin Panel | `src/pages/admin/AdminGSTSettings.tsx` | Configuration |
| Database Schema | `supabase/migrations/20260212_add_gst_system.sql` | Tables + functions |
| Full Docs | `GST_SHIPPING_SYSTEM.md` | Detailed guide |

---

## 🧮 GST Calculation Formulas (Quick Ref)

### Tax Inclusive (Default for Indian Food)
```
Given: Price = ₹105 (includes 5% GST)
Find: Base price and GST amount

Base = Price × 100 / (100 + GST%)
Base = 105 × 100 / 105 = ₹100

GST = Price - Base
GST = 105 - 100 = ₹5

Result: Customers pay ₹105 total
```

### Tax Exclusive  
```
Given: Base price = ₹100, GST = 5%
Find: GST amount and total

GST = Base × (GST% / 100)
GST = 100 × 0.05 = ₹5

Total = Base + GST
Total = 100 + 5 = ₹105

Result: Customer pays ₹105 total (₹100 + ₹5 tax)
```

---

## 🗺️ State Detection & GST Type

| Delivery State | GST Type | Details |
|---|---|---|
| **Tamil Nadu** | CGST + SGST | Same state → split tax |
| **Puducherry** | CGST + SGST | Associated with TN |
| **Any Other State** | IGST | Inter-state → single tax |

### CGST + SGST Split (Same State)
```
Total GST% = 5%
├─ CGST (Central) = 2.5%
└─ SGST (State) = 2.5%

Example:
₹105 order with TN delivery
Base = ₹100
CGST = ₹2.50
SGST = ₹2.50
Total = ₹105 ✓
```

### IGST (Inter-State)
```
Total GST% = 5%
└─ IGST (Integrated) = 5%

Example:
₹105 order with Delhi delivery
Base = ₹100
IGST = ₹5.00
Total = ₹105 ✓
```

---

## 📦 Shipping Rates & GST

| Region | Charge | Free Above | Shipping GST |
|--------|--------|-----------|---|
| TN & Puducherry | ₹40 | ₹499 | 5% × Rate = ₹2 |
| Rest of India | ₹80 | None | 5% × Rate = ₹4 |

**Shipping GST Calculation:**
```
Shipping = ₹40 (TN)
Shipping GST (5%) = ₹40 × 5/105 = ₹1.90
Total Shipping = ₹41.90
```

---

## 💾 Product Setup

### When Creating Product
```tsx
{
  name: "Organic Turmeric",
  price: 210,              // Displayed price (inclusive of GST)
  gst_percentage: 5,       // 0, 5, 12, or 18
  hsn_code: "0713",        // Harmonized code (6-8 digits)
  tax_inclusive: true,     // Always true for food
  compare_price: 280       // Original price (optional)
}
```

### Common Food HSN Codes
| Product | HSN | GST |
|---------|-----|-----|
| Spices | 0713 | 5% |
| Flour/Cereals | 1008 | 0% |
| Health Powder | 2106 | 12% |
| Tea | 0902 | 5% |

---

## 📝 Order Calculation Example

### Scenario
- 2x Turmeric @ ₹210 each (5% GST)
- Shipping: ₹40 (TN delivery)
- Customer in Tamil Nadu

### Calculation
```
Item 1: ₹210 × 1 = ₹210
├─ Base = 210 × 100/105 = ₹200
└─ GST = ₹10

Item 2: ₹210 × 1 = ₹210
├─ Base = ₹200
└─ GST = ₹10

Subtotal Base = ₹400
Subtotal GST = ₹20

Shipping = ₹40
├─ Base = 40 × 100/105 = ₹38.10
└─ GST = ₹1.90

TOTAL:
├─ Base = ₹438.10
├─ GST (5% split) = ₹21.90
│   ├─ CGST = ₹10.95
│   └─ SGST = ₹10.95
└─ TOTAL = ₹460

Customer Display:
Subtotal:          ₹400
Shipping:          ₹40
CGST:              ₹10.95
SGST:              ₹10.95
────────────────
TOTAL:             ₹460
```

---

## 🛠️ Code Snippets

### Calculate Order Totals
```tsx
import { calculateOrderTotals } from '@/lib/gstCalculations';

const totals = calculateOrderTotals(
  [
    {
      productPrice: 210,
      quantity: 2,
      gstPercentage: 5,
      taxInclusive: true
    }
  ],
  'Tamil Nadu',
  { baseCharge: 40, freeAbove: 499 }
);

console.log(totals);
// {
//   subtotal: 400,
//   itemGST: 20,
//   shippingCharge: 40,
//   shippingGST: 1.9,
//   totalGST: 21.9,
//   cgstAmount: 10.95,
//   sgstAmount: 10.95,
//   total: 460,
//   gstType: 'CGST+SGST'
// }
```

### Get GST Type by State
```tsx
import { getGSTType } from '@/lib/gstCalculations';

getGSTType('Tamil Nadu')      // → 'CGST+SGST'
getGSTType('Delhi')           // → 'IGST'
getGSTType('Puducherry')      // → 'CGST+SGST'
```

### Validate GST Number
```tsx
import { validateGSTNumber } from '@/lib/gstCalculations';

validateGSTNumber('27XXXXX0000X1Z5')  // → true
validateGSTNumber('INVALID')          // → false
```

### Generate Invoice
```tsx
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

const pdf = await generateInvoicePDF({
  invoiceNumber: 'INV20260212001',
  invoiceDate: new Date(),
  businessName: 'Pandiyin Organic',
  // ... more fields
});

// Download
const url = URL.createObjectURL(pdf);
const link = document.createElement('a');
link.href = url;
link.download = 'invoice.pdf';
link.click();
```

---

## ⚙️ Admin Configuration

### Enable GST
1. Go to `/admin/gst-settings`
2. Toggle "Enable GST Tax System" → ON
3. Enter GSTIN
4. Save

### Set Supported Rates
1. In Admin panel, find "Supported GST Rates"
2. Click badges to toggle: 0%, 5%, 12%, 18%
3. Save

### Invoice Prefix
- Default: `INV`
- Max 10 characters
- Example: `PINV` → `PINV000001`

---

## 🔍 Validation Rules

### GST Number (GSTIN)
- Format: 15 characters
- Pattern: `27XXXXX0000X1Z5`
- Example: `27AAAA0000A1Z5`

### HSN Code
- Length: 6-8 digits
- Numbers only
- Example: `0713`, `210690`

---

## 📊 Invoice Structure

```
TAX INVOICE
───────────────────
Business Details
(Name, Address, GSTIN)

Invoice #: INV20260212001
Date: 12/02/2026

Bill To:
Customer Name
Address
City, State, Pincode

Items Table:
Item | HSN | Qty | Rate | GST% | GST $ | Total

Subtotal:      ₹XXX
Shipping:      ₹XXX
CGST/SGST/IGST: ₹XXX
─────────────────
TOTAL:         ₹XXX

Computer-generated invoice
```

---

## 🔗 Database Queries

### Get All GST Settings
```sql
SELECT * FROM gst_settings LIMIT 1;
```

### Get Product GST Details
```sql
SELECT id, name, price, gst_percentage, hsn_code 
FROM products WHERE gst_percentage > 0;
```

### Get Order Tax Breakdown
```sql
SELECT 
  id, 
  subtotal, 
  gst_amount,
  cgst_amount,
  sgst_amount,
  igst_amount,
  gst_type,
  delivery_state
FROM orders WHERE id = 'order-id';
```

### Get Invoice
```sql
SELECT * FROM invoices WHERE order_id = 'order-id';
```

---

## 🚀 Deployment Checklist

- [ ] Run migration: `supabase migrations deploy`
- [ ] Create GST settings via admin panel
- [ ] Add GST rates to all products
- [ ] Test order with TN delivery
- [ ] Test order with non-TN delivery
- [ ] Verify invoice generation
- [ ] Download and check PDF
- [ ] Test free shipping threshold

---

## 📞 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Invoice not generating | Check if `gst_settings` table has data |
| GST showing 0% | Verify `gst_enabled = true` in settings |
| CGST+SGST not splitting | Confirm delivery state spelling matches |
| HSN code validation fails | Must be 6-8 digits, no letters |
| GSTIN validation fails | Must be exactly 15 characters |

---

## 📌 Important Notes

1. **Prices are TAX INCLUSIVE** by default (Indian food standard)
2. **GST splits 50-50** for CGST + SGST in same state
3. **IGST is FULL amount** for inter-state orders
4. **Shipping always has 5% GST** applied
5. **Invoices auto-generate** after order creation
6. **Current year**: 2026, Adjust dates as needed

---

**Keep this card handy for quick reference!**

Last Updated: 12-Feb-2026 | Version: 1.0
