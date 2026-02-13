# GST-Inclusive Pricing System - Implementation Checklist

## Quick Setup Guide (30 minutes)

### Step 1: Configure GST Settings (Admin)
- [ ] Go to Admin Panel → GST Settings
- [ ] Enter Business Name (e.g., "Pandiyin Organic")
- [ ] Select Business State (e.g., Tamil Nadu)
- [ ] Enter Business Address
- [ ] Enable GST toggle if not already enabled
- [ ] Enter GST Number (GSTIN) in format: 27AAAA0000A1Z5
- [ ] Verify all supported GST rates are: 0%, 5%, 12%, 18%
- [ ] Set Invoice Prefix (e.g., INV, PINV)
- [ ] Click Save

### Step 2: Update Existing Products
For each product in Admin → Products:
- [ ] Open Edit Product dialog
- [ ] **Price field**: Enter final price customer pays (with GST included)
  - Example: ₹120 (this already includes GST, no need to add extra)
- [ ] **GST Percentage**: Select the correct rate
  - Organic rice/food: Usually 0% or 5%
  - Packaged items: 12%
  - Premium items: 18%
- [ ] **HSN Code**: Enter 6-8 digit code (optional but good for compliance)
  - Example: 100590 (for cereals and grains)
- [ ] **Tax Inclusive checkbox**: Should be ✓ checked (always)
- [ ] Click Save

### Step 3: Create New Products
When adding new products:
- [ ] Price: Enter the final selling price (GST already included)
- [ ] GST Percentage: Select appropriate rate
- [ ] HSN Code: Fill in if available
- [ ] Tax Inclusive: Keep checked
- [ ] All other fields as usual
- [ ] Save product

### Step 4: Test the System

#### Test 1: View Product Page
- [ ] Go to product page
- [ ] Verify price displays (e.g., ₹120)
- [ ] Verify "Inclusive of all taxes" text appears below price
- [ ] No tax breakdown should show on product page (clean look)

#### Test 2: Add to Cart
- [ ] Add product to cart
- [ ] Go to Cart page
- [ ] Verify price shows as entered (no extra tax added)
- [ ] Check Cart shows text: "Prices are inclusive of all taxes"

#### Test 3: Test Checkout
- [ ] Go to Checkout
- [ ] Select delivery address
- [ ] Scroll to Order Summary
- [ ] Verify:
  - Subtotal = sum of product prices (as entered)
  - Delivery = calculated shipping
  - "Included GST" shows calculated tax amount
  - Note says "already included in prices"
  - Total Payable = Subtotal + Delivery (NO extra tax)
- [ ] Select payment method
- [ ] Place order

#### Test 4: Check Order Confirmation
- [ ] After order placed, verify confirmation page shows:
  - Product prices exactly as displayed
  - Order Summary with subtotal and delivery
  - Tax Breakdown in blue info box showing CGST/SGST or IGST
  - "Inclusive of all taxes" badge
  - Total Payable = Subtotal + Delivery
- [ ] Click "Download Invoice"
- [ ] Verify PDF shows:
  - Item prices and amounts
  - Tax breakdown table
  - Note about prices being inclusive
  - Total amount matches checkout

#### Test 5: Test Same-State vs Inter-State GST
- [ ] Create order with delivery in business state (e.g., Tamil Nadu)
  - Verify invoice shows CGST + SGST split (each 50% of total GST)
- [ ] Create order with delivery in different state (e.g., Karnataka)
  - Verify invoice shows IGST (full amount)

### Step 6: Verify Customer Experience

**What customer sees:**

1. **On Product Page**: Clean, premium look with just price and "inclusive of taxes"
2. **In Cart**: No confusing tax calculations, just product count and prices
3. **At Checkout**: Clear total with informational tax breakdown
4. **On Confirmation**: Professional receipt showing all details and tax breakdown

**What NEVER happens:**
- Extra tax added on top of price
- Surprise charges at checkout
- Multiple tax lines that confuse customer
- Any indication of GST-exclusive pricing

---

## Common Scenarios

### Scenario 1: Organic Rice (0% or 5% GST)

```
Admin enters: ₹100, GST 5%
Customer sees: ₹100 (final price, no surprises)
Invoice shows:
  Subtotal: ₹95.24
  GST: ₹4.76
  Total: ₹100
```

### Scenario 2: Premium Chocolate (18% GST)

```
Admin enters: ₹500, GST 18%
Customer sees: ₹500 (final price)
Invoice shows:
  Subtotal: ₹423.73
  GST: ₹76.27
  Total: ₹500
```

### Scenario 3: Mixed Cart

```
Product A: ₹120 (5% GST)
Product B: ₹250 (12% GST)

Customer pays: ₹370 (no calculation needed)
Invoice shows individual GST for each
Both included in ₹370
```

---

## Admin Panel Fields Reference

### GST Settings

| Field | Type | Example | Required |
|-------|------|---------|----------|
| Business Name | Text | Pandiyin Organic | Yes |
| Business State | Dropdown | Tamil Nadu | Yes |
| Business Address | Text Area | Madurai, TN | Yes |
| GST Number (GSTIN) | Text | 27AAAA0000A1Z5 | No* |
| Enable GST | Toggle | ON | No |
| Invoice Prefix | Text | INV | Yes |
| Supported Rates | Multi-select | 0, 5, 12, 18 | Yes |

*Required if GST enabled

### Product Fields

| Field | Type | Example | Required |
|-------|------|---------|----------|
| Price | Number | 120.00 | Yes |
| Compare Price | Number | 150.00 | No |
| GST Percentage | Dropdown | 5 | Yes |
| HSN Code | Text | 100590 | No |
| Tax Inclusive | Checkbox | ✓ | Yes (always) |

---

## FAQ for Admin

**Q: Should I add GST on top of the price I enter?**
A: No! The price you enter (e.g., ₹120) should be the final price the customer pays, GST already included.

**Q: What if I don't know the GST percentage for a product?**
A: Use 5% as default for most food products. The system supports 0%, 5%, 12%, 18%.

**Q: What's an HSN code?**
A: It's a 6-8 digit tax classification code for products. Good for compliance but optional. Ask your accountant for your products.

**Q: Why does the invoice show GST if it's already included in price?**
A: For GST compliance and B2B customers. It shows HOW MUCH tax is included for transparency.

**Q: Can I change prices after someone orders?**
A: Yes, but it only affects new orders. Old orders keep their prices.

**Q: What if I set wrong GST percentage?**
A: Edit the product and fix it. It will use the new rate for future orders.

---

## System Flow Diagram

```
ADMIN INPUT:
Product Price: ₹120 (final price)
GST: 5%
Tax Inclusive: ✓
       ↓
SYSTEM EXTRACTION:
Base: ₹114.29
GST: ₹5.71
       ↓
CUSTOMER EXPERIENCE:
See Price: ₹120
Pay: ₹120
       ↓
CHECKOUT DISPLAY:
Product: ₹120
+ Delivery: ₹50
= Total: ₹170
(GST of ₹5.71 shown as informational)
       ↓
INVOICE:
Shows full breakdown for compliance
But total still = ₹170
```

---

## Key Points to Remember

✅ **PRICES ARE FINAL**
- What admin enters is what customer pays
- No extra tax added at checkout
- Clean, transparent pricing

✅ **GST IS INFORMATIONAL**
- Shown on checkout and invoice
- Already included in prices
- For compliance and transparency

✅ **SAME-STATE vs INTER-STATE**
- Tamil Nadu delivery = CGST + SGST (split equally)
- Other state = IGST (full amount)
- System handles automatically

✅ **PROFESSIONAL INVOICES**
- Shows tax breakdown with HSN codes
- Complies with GST requirements
- Professional PDF format

---

## Support Resources

- Full Documentation: See [GST_INCLUSIVE_PRICING_GUIDE.md](GST_INCLUSIVE_PRICING_GUIDE.md)
- GST Rates: Refer to [GST_QUICK_REFERENCE.md](GST_QUICK_REFERENCE.md)
- Admin Settings: Check [AdminGSTSettings.tsx](src/pages/admin/AdminGSTSettings.tsx)
- Calculations: See [gstCalculations.ts](src/lib/gstCalculations.ts)

