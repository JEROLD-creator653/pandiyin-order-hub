# GST-Inclusive Pricing System Implementation Guide

## Overview

This ecommerce platform implements an **inclusive GST pricing model** where all product prices displayed to customers already include GST. This is the most customer-friendly approach as there are no hidden taxes added at checkout.

---

## Core Principles

### ✅ All Prices Are Inclusive

- **Product Price**: ₹120 already includes GST
- **Total at Checkout**: No additional GST added
- **Customer Sees**: Final payable amount (no surprises)
- **Invoice Shows**: Tax breakdown for compliance (informational only)

### Formula for GST Extraction

When the price includes GST, we calculate the base amount and GST separately:

```
BaseAmount = Price × 100 / (100 + GST%)
GSTAmount = Price - BaseAmount
```

Example:
- Price: ₹120 (inclusive)
- GST: 5%
- BaseAmount: ₹114.29
- GSTAmount: ₹5.71

---

## Database Structure

### Products Table

```sql
-- GST-related fields added to products table
- gst_percentage (NUMERIC 5,2) - GST rate: 0, 5, 12, or 18
- hsn_code (TEXT) - HSN/SAC code for tax classification (optional)
- tax_inclusive (BOOLEAN DEFAULT true) - Price includes GST
```

### Orders Table

```sql
-- Tax tracking fields
- gst_amount (NUMERIC 10,2) - Total GST included in order
- gst_percentage (NUMERIC 5,2) - Average GST for order
- gst_type (TEXT) - 'cgst_sgst' (same-state) or 'igst' (inter-state)
- cgst_amount (NUMERIC 10,2) - Central GST (state-level)
- sgst_amount (NUMERIC 10,2) - State GST (state-level)
- igst_amount (NUMERIC 10,2) - Integrated GST (inter-state)
- delivery_state (TEXT) - Delivery state for GST determination
```

### Order Items Table

```sql
-- Per-item tax tracking
- gst_percentage (NUMERIC 5,2) - Item's GST rate
- hsn_code (TEXT) - Item's HSN code
- gst_amount (NUMERIC 10,2) - Tax included in item
- tax_inclusive (BOOLEAN) - Whether item price is inclusive
- product_base_price (NUMERIC 10,2) - Price before tax extraction
```

---

## GST Rates Supported

| Rate | Category | Examples |
|------|----------|----------|
| 0% | Exempted | Basic food items, essential goods |
| 5% | Essential Items | Most organic/processed foods |
| 12% | General Items | Packaged foods, personal care |
| 18% | Premium Items | Luxury foods, specialty items |

---

## Admin Configuration

### 1. GST Settings (Admin Panel)

Navigate to **Admin > GST Settings** to configure:

- **Business Name**: Your business registration name
- **Business State**: Where business is registered (default: Tamil Nadu)
- **GST Number (GSTIN)**: 15-character GST identifier (optional)
- **Enable GST**: Toggle to enable/disable tax system
- **Invoice Prefix**: Prefix for invoice numbering (e.g., INV)
- **Supported GST Rates**: Which rates to allow (0%, 5%, 12%, 18%)

### 2. Product Configuration (Admin Products)

For each product, set:

- **Price**: GST-inclusive selling price (e.g., ₹120)
- **GST Percentage**: 0%, 5%, 12%, or 18%
- **HSN Code**: 6-8 digit tax classification (optional)
- **Tax Inclusive**: Checkbox (always TRUE for this system)

---

## UI Implementation

### Product Page Display

```
₹120
Inclusive of all taxes  ← Small subtitle
```

**Implementation**:
- Price shown in bold large text
- "Inclusive of all taxes" text in small, italicized grey
- No tax breakdown shown (clean premium look)

### Cart Page

```
Order Summary
Subtotal: ₹240
Delivery: Calculated at checkout

────────────────────────
Prices are inclusive of all taxes
```

**Implementation**:
- Standard subtotal calculation
- Small disclaimer above total
- Clean UI without tax details

### Checkout Page

```
Subtotal: ₹240
Delivery: ₹40

Tax Breakdown (Informational)
Included GST: ₹11.42
The GST amount above is already included
in the prices. No additional tax added.

────────────────────────
Total Payable: ₹280
```

**Implementation**:
- Separate informational box for tax details
- Clear note that GST is already included
- Non-threatening presentation

### Order Confirmation

```
Order Summary

Items: ₹240
Delivery: ₹40

Tax Breakdown (Informational)
CGST (2.5%): ₹5.71
SGST (2.5%): ₹5.71
These amounts are already included.

✓ Inclusive of all taxes
Total Payable: ₹280
```

**Implementation**:
- Tax shown in blue info box
- Clear statement about inclusion
- Badge confirming inclusive pricing

### Invoice (PDF)

```
ITEMS TABLE:
Product | HSN | Qty | Unit Price | GST% | GST Amount | Total
Organic Rice | 100590 | 2 | ₹120 | 5% | ₹5.71 | ₹240

TOTAL SUMMARY:
Subtotal: ₹228.57
GST (included): ₹11.43
Delivery: ₹40
Total Amount Due: ₹280

Note: Product prices and all amounts include
applicable GST. Tax breakdown is for
informational and compliance purposes only.
```

**Implementation**:
- Full tax breakdown with HSN codes
- Clear note about inclusive pricing
- Professional compliance-ready format

---

## State-Based GST Calculation

### Same-State Delivery (CGST + SGST)

When delivery is in the same state as business registration:

```
GST% = CGST% + SGST%
CGST = GST% ÷ 2
SGST = GST% ÷ 2

Example (5% GST in Tamil Nadu):
CGST = 2.5%
SGST = 2.5%
```

### Inter-State Delivery (IGST)

When delivery is in different state:

```
IGST = Full GST%

Example (5% GST to Karnataka):
IGST = 5%
```

---

## Calculation Examples

### Example 1: Single Product Order

```
Admin enters: Price ₹100, GST 5%, tax_inclusive = true

SYSTEM EXTRACTS:
BaseAmount = 100 × 100 / 105 = ₹95.24
GSTAmount = 100 - 95.24 = ₹4.76

CUSTOMER SEES:
Price: ₹100 ✓ (no change, no surprise)
Total: ₹100 (what they pay)

INVOICE SHOWS (for compliance):
Subtotal: ₹95.24
GST (5%): ₹4.76
Total: ₹100
```

### Example 2: Multiple Products with Different GST

```
Product A: ₹120 (5% GST)
Product B: ₹250 (12% GST)

SYSTEM CALCULATES:
Item A - Base: ₹114.29, GST: ₹5.71
Item B - Base: ₹223.21, GST: ₹26.79

CART SHOWS:
Product A: ₹120
Product B: ₹250
─────────────────
Subtotal: ₹370

CHECKOUT SHOWS:
Subtotal: ₹370
Delivery: ₹50
─────────────────
Included GST: ₹32.50
(already in prices above)
─────────────────
Total Payable: ₹420
```

### Example 3: Order to Different State

```
Customer in Tamil Nadu (business location)
Order delivery to Karnataka

SAME-STATE: CGST + SGST split
(if in TN) - Not applicable here

INTER-STATE: IGST applied
GST Type: IGST
GST 5% = 5% IGST
Total order GST is shown as IGST only
```

---

## API Endpoints & Functions

### GST Calculation Function

```typescript
import { calculateGST } from '@/lib/gstCalculations';

const result = calculateGST(
  price: 120,
  gstPercentage: 5,
  isTaxInclusive: true  // Always true for this system
);

// Returns:
{
  baseAmount: 114.29,
  gstAmount: 5.71,
  totalAmount: 120
}
```

### Order Total Calculation

```typescript
import { calculateOrderTotals } from '@/lib/gstCalculations';

const totals = calculateOrderTotals(
  cartItems: [
    { productPrice: 120, quantity: 2, gstPercentage: 5, taxInclusive: true },
    { productPrice: 250, quantity: 1, gstPercentage: 12, taxInclusive: true }
  ],
  deliveryState: 'Karnataka',
  shippingConfig: { baseCharge: 50, freeAbove: 500 }
);

// Returns:
{
  subtotal: 428.57,
  itemGST: 41.43,
  shippingCharge: 50,
  shippingGST: 2.38,
  totalGST: 43.81,
  cgstAmount: undefined,
  sgstAmount: undefined,
  igstAmount: 43.81,  // IGST for inter-state
  total: 521.38,
  gstType: 'IGST',
  isTaxInclusive: true
}
```

### GST Type Determination

```typescript
import { getGSTType } from '@/lib/gstCalculations';

// Same state
const gstType1 = getGSTType(
  deliveryState: 'Tamil Nadu',
  businessState: 'Tamil Nadu'
); // Returns: 'CGST+SGST'

// Different state
const gstType2 = getGSTType(
  deliveryState: 'Karnataka',
  businessState: 'Tamil Nadu'
); // Returns: 'IGST'
```

---

## Components Used

### TaxInclusiveInfo Component

Display tax information with different styles:

```tsx
// Product page - simple subtitle
<TaxInclusiveInfo variant="subtitle" />
// Output: "Inclusive of all taxes"

// Cart page - small badge
<TaxInclusiveInfo variant="badge" />
// Output: ✓ Inclusive of all taxes

// Informational note
<TaxInclusiveInfo variant="note" />
// Output: Colored info box with full explanation

// Checkout - detailed info
<TaxInclusiveInfo variant="checkout" />
// Output: Box explaining tax breakdown is informational
```

---

## Updated Components

1. **ProductDetail.tsx**
   - Shows price with "Inclusive of all taxes" subtitle
   - Clean premium presentation

2. **Cart.tsx**
   - Added tax disclaimer in order summary
   - Shows prices exactly as entered by admin

3. **Checkout.tsx**
   - Enhanced tax breakdown section
   - Clear note that GST is already included
   - Informational presentation only

4. **OrderConfirmation.tsx**
   - Tax breakdown in blue info box
   - Confirms inclusive pricing with badge

5. **AdminProducts.tsx**
   - GST percentage selector (0%, 5%, 12%, 18%)
   - HSN code field
   - Tax inclusive checkbox (always checked)

6. **AdminGSTSettings.tsx**
   - Business information configuration
   - GST enable/disable toggle
   - GSTIN entry
   - Invoice prefix and supported rates

---

## Invoice Generation

The invoice system (`invoiceGenerator.ts`):

- Shows item prices as entered (inclusive)
- Calculates GST breakdown for compliance
- Adds clear note: "Prices and amounts include applicable GST"
- Displays tax as informational only
- Professional GST-compliant format

---

## Best Practices for Admins

### ✅ DO:
- Enter final prices customers will pay (GST included)
- Set correct GST percentage for product category
- Set HSN codes for products (enables better compliance)
- Use same product for same state as business (for CGST+SGST)
- Monitor GST settings for accuracy
- Update GST rates if government changes them

### ❌ DON'T:
- Don't add extra tax manually to prices
- Don't change tax_inclusive to false (system expects true)
- Don't create two versions of same product with different taxes
- Don't forget to fill HSN codes for invoicing
- Don't enable GST without configuring business details

---

## Testing Checklist

- [ ] Product shows price + "Inclusive of all taxes"
- [ ] Cart shows subtotal without extra tax
- [ ] Checkout displays GST breakdown as informational
- [ ] Order confirmation shows tax in info box
- [ ] Invoice PDF shows complete tax breakdown
- [ ] Same-state delivery shows CGST+SGST split
- [ ] Different-state delivery shows IGST only
- [ ] Admin can set GST per product
- [ ] Admin GST settings save correctly
- [ ] Store settings toggle enables/disables GST system

---

## Troubleshooting

### Issue: Product price seems wrong in checkout

**Solution**: Check if `tax_inclusive` column is true in products table. The system assumes all prices are inclusive.

### Issue: Tax amounts not showing on invoice

**Solution**: Verify GST is enabled in store settings and products have `gst_percentage` set to non-zero value.

### Issue: CGST/SGST not splitting for same-state

**Solution**: Check that business state matches delivery state exactly (case-insensitive but must be complete state name).

---

## Future Enhancements

- B2B GST-exempted customer support
- Dynamic GST rate updates from government API
- HSN code validation
- Advanced tax exemption rules
- Reverse charge mechanism for B2B
- E-Way Bill integration

---

## Related Files

- `/supabase/migrations/20260213_add_gst_fields_to_products.sql`
- `/supabase/migrations/20260213_add_gst_fields_to_orders.sql`
- `/src/lib/gstCalculations.ts` - Core GST calculations
- `/src/lib/invoiceGenerator.ts` - Invoice generation
- `/src/components/TaxInclusiveInfo.tsx` - Tax display component
- `/src/pages/ProductDetail.tsx` - Product page updates
- `/src/pages/Cart.tsx` - Cart page updates
- `/src/pages/Checkout.tsx` - Checkout page updates
- `/src/pages/OrderConfirmation.tsx` - Order confirmation updates
- `/src/pages/admin/AdminProducts.tsx` - Product admin form
- `/src/pages/admin/AdminGSTSettings.tsx` - GST settings admin

