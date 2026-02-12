# GST System - Installation & Verification Guide

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
bun add jspdf jspdf-autotable
```

### Step 2: Run Database Migration
```bash
supabase migrations deploy
```
**Verify:** Check Supabase dashboard → verify new tables created:
- ✅ gst_settings
- ✅ invoices
- ✅ Extended products, order_items, orders tables

### Step 3: Configure GST Settings
1. Login as admin
2. Navigate to `/admin/gst-settings` (**route needs to be added to navigation**)
3. Fill in:
   - Business Name: "Pandiyin Organic"
   - State: "Tamil Nadu"
   - Business Address: "Madurai, Tamil Nadu - 625xxx"
   - GSTIN: (leave empty if not registered yet)
   - Enable GST: Toggle ON
   - Invoice Prefix: "INV"
4. Click "Save Settings"

### Step 4: Test Calculation
Open browser console and test:

```javascript
// Import in a component or test file
import { calculateOrderTotals, getGSTType } from '@/lib/gstCalculations';

// Test 1: Tamil Nadu delivery (CGST+SGST)
const result1 = calculateOrderTotals(
  [{ productPrice: 105, quantity: 1, gstPercentage: 5, taxInclusive: true }],
  'Tamil Nadu',
  { baseCharge: 40, freeAbove: 499 }
);
console.log('TN Result:', result1);
// Expected: gstType: 'CGST+SGST', cgstAmount: ~2.5, sgstAmount: ~2.5

// Test 2: Delhi delivery (IGST)
const result2 = calculateOrderTotals(
  [{ productPrice: 105, quantity: 1, gstPercentage: 5, taxInclusive: true }],
  'Delhi',
  { baseCharge: 80, freeAbove: null }
);
console.log('Delhi Result:', result2);
// Expected: gstType: 'IGST', igstAmount: ~5
```

✅ **System is ready!**

---

## 📋 Detailed Installation

### 1. Install JavaScript Dependencies

```bash
# Using Bun (recommended)
bun add jspdf jspdf-autotable

# Or using npm
npm install jspdf jspdf-autotable

# Or using yarn
yarn add jspdf jspdf-autotable
```

**Verify installation:**
```bash
bun list | grep jspdf
# Output should show:
# jspdf@2.5.0
# jspdf-autotable@3.5.31
```

### 2. Deploy Database Schema

**Option A: Using Supabase CLI**
```bash
# First, ensure you're in project directory
cd c:\Users\jerol\SEC\projects\pandiyin_webapp\pandiyin-order-hub

# Deploy all pending migrations
supabase migrations deploy
```

**Option B: Using Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy content of `supabase/migrations/20260212_add_gst_system.sql`
3. Paste and run
4. Verify no errors

**Verify migration executed:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('gst_settings', 'invoices', 'products', 'order_items', 'orders');

-- Should return:
-- gst_settings
-- invoices
-- products (already exists, now extended)
-- order_items (already exists, now extended)
-- orders (already exists, now extended)
```

### 3. File Placement Verification

```
src/
├── lib/
│   ├── gstCalculations.ts ✅
│   └── invoiceGenerator.ts ✅
└── pages/admin/
    └── AdminGSTSettings.tsx ✅

supabase/migrations/
└── 20260212_add_gst_system.sql ✅

root/
├── GST_SHIPPING_SYSTEM.md ✅
├── GST_IMPLEMENTATION_CHECKLIST.md ✅
├── GST_QUICK_REFERENCE.md ✅
└── GST_SYSTEM_COMPLETE.md ✅
```

### 4. Initial GST Settings Entry

```sql
-- Verify initial settings were created
SELECT * FROM gst_settings LIMIT 1;

-- Should return:
-- business_name: Pandiyin Organic
-- gst_enabled: true
-- invoice_prefix: INV
```

---

## 🧪 Verification Checklist

### Phase 1: Database ✅

- [ ] Migration file exists: `supabase/migrations/20260212_add_gst_system.sql`
- [ ] Run: `supabase migrations deploy`
- [ ] Verify table `gst_settings` exists
- [ ] Verify table `invoices` exists
- [ ] Verify `products` has: `gst_percentage`, `hsn_code`, `tax_inclusive` columns
- [ ] Verify `order_items` has: `gst_amount`, `cgst_amount`, `sgst_amount`, `igst_amount` columns
- [ ] Verify `orders` has: `gst_amount`, `gst_type`, `delivery_state`, `invoice_number` columns
- [ ] Verify default GST settings inserted:
  ```sql
  SELECT * FROM gst_settings WHERE business_name = 'Pandiyin Organic';
  ```

### Phase 2: Libraries ✅

- [ ] Dependencies installed: `bun add jspdf jspdf-autotable`
- [ ] Verify in package.json:
  ```json
  {
    "dependencies": {
      "jspdf": "^2.5.0",
      "jspdf-autotable": "^3.5.31"
    }
  }
  ```

### Phase 3: Files ✅

- [ ] `src/lib/gstCalculations.ts` exists (450+ lines)
- [ ] `src/lib/invoiceGenerator.ts` exists (350+ lines)
- [ ] `src/pages/admin/AdminGSTSettings.tsx` exists (400+ lines)
- [ ] All 4 documentation files created

### Phase 4: Code Imports ✅

Test importing in any component:
```tsx
// This should work without errors
import { calculateOrderTotals, getGSTType } from '@/lib/gstCalculations';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
```

### Phase 5: Function Testing ✅

```tsx
// Test in browser console via a component
import { calculateOrderTotals, validateGSTNumber } from '@/lib/gstCalculations';

// Test 1: Calculate order totals
console.log('Test 1: Order Calculation');
const totals = calculateOrderTotals(
  [{ productPrice: 105, quantity: 2, gstPercentage: 5, taxInclusive: true }],
  'Tamil Nadu',
  { baseCharge: 40, freeAbove: 499 }
);
console.log('✅ Calculated:', { subtotal: totals.subtotal, total: totals.total });

// Test 2: Validate GSTIN
console.log('Test 2: GSTIN Validation');
console.log('Valid GSTIN:', validateGSTNumber('27AAAA0000A1Z5')); // true
console.log('Invalid GSTIN:', validateGSTNumber('INVALID')); // false

// Test 3: getGSTType
const type1 = getGSTType('Tamil Nadu');
const type2 = getGSTType('Delhi');
console.log('TN GST Type:', type1); // CGST+SGST
console.log('Delhi GST Type:', type2); // IGST
```

### Phase 6: Admin Panel ✅

- [ ] Add route to admin navigation (in your admin layout)
- [ ] Navigate to `/admin/gst-settings`
- [ ] Should see form with:
  - Business Name field
  - State dropdown
  - Business Address textarea
  - GST enable toggle
  - GSTIN input
  - Invoice prefix input
  - GST rates checkboxes
- [ ] Fill in sample data
- [ ] Click "Save Settings"
- [ ] Verify in Supabase: settings updated

---

## 🔍 Pre-Integration Tests

### Test 1: Tax Calculation Engine

```tsx
import { calculateGST, splitCGSTSGST } from '@/lib/gstCalculations';

describe('GST Calculations', () => {
  it('should extract GST from inclusive price', () => {
    const result = calculateGST(105, 5, true);
    expect(result.baseAmount).toBeCloseTo(100, 1);
    expect(result.gstAmount).toBeCloseTo(5, 1);
  });

  it('should split CGST+SGST equally', () => {
    const { cgst, sgst } = splitCGSTSGST(10, 5);
    expect(cgst).toBeCloseTo(5, 1);
    expect(sgst).toBeCloseTo(5, 1);
  });
});
```

### Test 2: State Detection

```tsx
import { getGSTType } from '@/lib/gstCalculations';

describe('State GST Type Detection', () => {
  it('should use CGST+SGST for Tamil Nadu', () => {
    expect(getGSTType('Tamil Nadu')).toBe('CGST+SGST');
  });

  it('should use CGST+SGST for Puducherry', () => {
    expect(getGSTType('Puducherry')).toBe('CGST+SGST');
  });

  it('should use IGST for other states', () => {
    expect(getGSTType('Delhi')).toBe('IGST');
    expect(getGSTType('Karnataka')).toBe('IGST');
  });
});
```

### Test 3: Validation

```tsx
import { validateGSTNumber, validateHSNCode } from '@/lib/gstCalculations';

describe('Validation', () => {
  it('should validate GST number format', () => {
    expect(validateGSTNumber('27AAAA0000A1Z5')).toBe(true);
    expect(validateGSTNumber('INVALID')).toBe(false);
    expect(validateGSTNumber('123')).toBe(false);
  });

  it('should validate HSN code', () => {
    expect(validateHSNCode('0713')).toBe(true);
    expect(validateHSNCode('210690')).toBe(true);
    expect(validateHSNCode('12')).toBe(false);
    expect(validateHSNCode('ABCD')).toBe(false);
  });
});
```

---

## 🚀 Integration Checklist

After verification, proceed with integration:

### Step 1: Update Product Management
- [ ] Open `src/pages/admin/AdminProducts.tsx`
- [ ] Add to Product interface: `gst_percentage`, `hsn_code`, `tax_inclusive`
- [ ] Add form fields for GST rate and HSN code
- [ ] Update product insert/update query

### Step 2: Update Checkout
- [ ] Import calculation functions
- [ ] Call `calculateOrderTotals()` after items loaded
- [ ] Display tax breakdown in order summary
- [ ] Show CGST/SGST or IGST based on state

### Step 3: Setup Invoice Generation
- [ ] Create order success handler
- [ ] Call `generateAndSaveInvoice()` after order created
- [ ] Store invoice in database
- [ ] Make invoice downloadable

### Step 4: Add Admin Navigation Link
- [ ] Open admin layout/navigation file
- [ ] Add link to `/admin/gst-settings`
- [ ] Test navigation

### Step 5: End-to-End Testing
- [ ] Create test product with GST 5%
- [ ] Add to cart and checkout (TN address)
- [ ] Verify CGST+SGST calculation
- [ ] Generate and download invoice
- [ ] Verify PDF content
- [ ] Test with non-TN address (verify IGST)

---

## ⚠️ Common Issues & Solutions

### Issue 1: "jspdf not found"
**Solution:**
```bash
bun add jspdf jspdf-autotable
# Make sure package.json updated
# Restart dev server: npm run dev
```

### Issue 2: "Table gst_settings does not exist"
**Solution:**
```bash
# Verify migration ran
supabase migrations deploy

# Or manually run SQL in Supabase dashboard
# from supabase/migrations/20260212_add_gst_system.sql
```

### Issue 3: "Cannot find module gstCalculations"
**Solution:**
- Verify file exists: `src/lib/gstCalculations.ts`
- Check import path uses `@/lib/`
- Ensure TypeScript path alias configured in `tsconfig.json`

### Issue 4: Admin panel not found
**Solution:**
- Add route to admin navigation
- Verify path is `/admin/gst-settings`
- Check component is imported correctly

### Issue 5: Calculations showing 0% tax
**Solution:**
- Check `gst_enabled = true` in settings
- Verify products have `gst_percentage > 0`
- Ensure `tax_inclusive = true` for products

---

## 📊 Performance Verification

```sql
-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('gst_settings', 'invoices', 'product_items', 'orders');

-- Should show indexes on:
-- - products.gst_percentage
-- - products.hsn_code
-- - orders.invoice_number
-- - orders.delivery_state
-- - invoices.order_id
```

---

## 🔒 Security Verification

```sql
-- Verify RLS policies
SELECT * FROM information_schema.table_privileges 
WHERE table_name IN ('gst_settings', 'invoices');

-- Test access as non-admin (should fail to update)
-- This is handled by RLS policies automatically
```

---

## 📞 Verification Commands

**Run these to verify installation:**

```bash
# 1. Check files exist
ls src/lib/gst*
ls src/pages/admin/AdminGST*

# 2. Check dependencies
bun list | grep jspdf

# 3. Check migrations deployed
supabase migrations list

# 4. Check database tables
supabase db pull  # This should include all new tables

# 5. Verify code compiles
bun run build  # or npm run build

# 6. Start dev server
bun run dev  # or npm run dev
```

---

## ✅ Final Sign-Off

**System is ready when:**

- [ ] All dependencies installed
- [ ] All files in place
- [ ] Database migration ran successfully
- [ ] Admin panel opens without errors
- [ ] Tax calculations work correctly
- [ ] State detection working
- [ ] Validation functions validate properly
- [ ] No console errors

**Status:** Ready for Integration & Production Deployment

---

**Installation Guide Version:** 1.0
**Last Updated:** 12-Feb-2026
**Total Setup Time:** ~15-30 minutes
