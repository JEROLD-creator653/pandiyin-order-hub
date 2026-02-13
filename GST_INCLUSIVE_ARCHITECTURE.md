# GST-Inclusive Pricing System - Architecture & Flow Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN CONFIGURATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AdminGSTSettings          AdminProducts                         │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │ Business Info    │      │ Product Details  │                │
│  │ GST Enable/Off   │      │ Price (GST incl) │                │
│  │ GSTIN           │      │ GST %: 5/12/18   │                │
│  │ State            │      │ HSN Code         │                │
│  └──────────────────┘      │ Tax Inclusive: ON│                │
│                             └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE STORAGE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  gst_settings              products                              │
│  ┌──────────────┐          ┌──────────────────┐                │
│  │ business     │          │ price            │                │
│  │ gst_enabled  │          │ gst_percentage   │                │
│  │ gst_number   │          │ hsn_code         │                │
│  │ state        │          │ tax_inclusive    │                │
│  └──────────────┘          └──────────────────┘                │
│                                                                   │
│  orders              order_items                                 │
│  ┌──────────────┐    ┌──────────────────┐                      │
│  │ gst_amount   │    │ gst_percentage   │                      │
│  │ gst_type     │    │ gst_amount       │                      │
│  │ cgst_amount  │    │ hsn_code         │                      │
│  │ sgst_amount  │    │ tax_inclusive    │                      │
│  │ igst_amount  │    │ product_base     │                      │
│  │ delivery_st  │    │ _price           │                      │
│  └──────────────┘    └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                   CALCULATION ENGINE                             │
├─────────────────────────────────────────────────────────────────┤
│  gstCalculations.ts                                             │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ • calculateGST()          - Extract tax from price  │       │
│  │ • splitCGSTSGST()         - Split 50-50 for state   │       │
│  │ • getGSTType()            - CGST+SGST or IGST      │       │
│  │ • calculateOrderTotals()  - Complete order calc     │       │
│  │ • Validation functions    - GST & HSN validation    │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    UI COMPONENTS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ProductDetail          Cart            Checkout                │
│  ┌────────────┐       ┌────────┐      ┌──────────────┐        │
│  │ ₹120       │       │ ₹240   │      │ Subtotal     │        │
│  │ Inclusive  │       │ Incl.  │      │ Delivery     │        │
│  └────────────┘       └────────┘      │ Tax Info Box │        │
│                                        │ Total        │        │
│  OrderConfirmation                     └──────────────┘        │
│  ┌────────────┐                                                │
│  │ Tax Box    │    TaxInclusiveInfo Component                 │
│  │ Badge      │    (4 variants: subtitle, badge, note, etc)   │
│  └────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                  INVOICE GENERATION                              │
├─────────────────────────────────────────────────────────────────┤
│  invoiceGenerator.ts                                            │
│  ├─ Professional PDF format                                    │
│  ├─ Tax breakdown with HSN codes                              │
│  ├─ CGST/SGST or IGST display                                 │
│  ├─ Inclusive pricing note                                     │
│  └─ GST-compliant format                                       │
└─────────────────────────────────────────────────────────────────┘

```

---

## Customer Journey Flow

```
┌──────────────────┐
│  BROWSE PRODUCTS │
└────────┬─────────┘
         ↓
    ┌─────────────────────────────────┐
    │ Product Page                    │
    │ ┌─────────────────────────────┐ │
    │ │ Product Image               │ │
    │ │ ₹120                        │ │
    │ │ Inclusive of all taxes  ✓  │ │
    │ │ [Add to Cart]               │ │
    │ └─────────────────────────────┘ │
    └────────┬────────────────────────┘
             ↓
        ┌─────────────────────────────────┐
        │ Cart Page                       │
        │ ┌─────────────────────────────┐ │
        │ │ Product A  ₹120 × 2         │ │
        │ │ Product B  ₹250 × 1         │ │
        │ │ Subtotal:  ₹490             │ │
        │ │                             │ │
        │ │ Prices inclusive of taxes  │ │
        │ │ [Proceed to Checkout]       │ │
        │ └─────────────────────────────┘ │
        └────────┬────────────────────────┘
                 ↓
            ┌─────────────────────────────────┐
            │ Address Selection               │
            │ ┌─────────────────────────────┐ │
            │ │ Select Address              │ │
            │ │ Determine Delivery State    │ │
            │ │ Calculate GST Type          │ │
            │ └─────────────────────────────┘ │
            └────────┬────────────────────────┘
                     ↓
            ┌─────────────────────────────────────┐
            │ Checkout - Order Summary            │
            │ ┌─────────────────────────────────┐ │
            │ │ Items:     ₹490                │ │
            │ │ Delivery:  ₹50                 │ │
            │ │                                │ │
            │ │ Tax Breakdown (Informational) │ │
            │ │ Included GST: ₹51.43           │ │
            │ │ (Already in prices above)     │ │
            │ │                                │ │
            │ │ Total Payable: ₹540           │ │
            │ │ [Place Order]                  │ │
            │ └─────────────────────────────────┘ │
            └────────┬────────────────────────────┘
                     ↓
            ┌─────────────────────────────────────┐
            │ Order Confirmation                  │
            │ ┌─────────────────────────────────┐ │
            │ │ Items:     ₹490                │ │
            │ │ Delivery:  ₹50                 │ │
            │ │                                │ │
            │ │ Tax Breakdown (Info)           │ │
            │ │ CGST (2.5%): ₹25.71            │ │
            │ │ SGST (2.5%): ₹25.72            │ │
            │ │                                │ │
            │ │ ✓ Inclusive of all taxes       │ │
            │ │ Total: ₹540                    │ │
            │ │                                │ │
            │ │ [Download Invoice]             │ │
            │ └─────────────────────────────────┘ │
            └────────┬────────────────────────────┘
                     ↓
            ┌─────────────────────────────────────┐
            │ Invoice PDF                         │
            │ ┌─────────────────────────────────┐ │
            │ │ TAX INVOICE                     │ │
            │ │                                │ │
            │ │ ITEMS TABLE                    │ │
            │ │ Prod | HSN | Qty | Price | Tax│ │
            │ │      |     |     | (incl) |   │ │
            │ │                                │ │
            │ │ TOTAL SUMMARY                  │ │
            │ │ Subtotal (Base):   ₹438.57    │ │
            │ │ CGST (2.5%):       ₹25.71    │ │
            │ │ SGST (2.5%):       ₹25.72    │ │
            │ │ Shipping:          ₹50.00    │ │
            │ │ Total Amount Due:  ₹540.00   │ │
            │ │                                │ │
            │ │ Note: Prices include GST.     │ │
            │ │ Tax breakdown for compliance  │ │
            │ │ and informational purposes.   │ │
            │ └─────────────────────────────────┘ │
            └─────────────────────────────────────┘
```

---

## GST Calculation Flow

```
ADMIN INPUT
┌─────────────────────┐
│ Price: ₹120         │
│ GST%: 5%            │
│ Tax Inclusive: ✓    │
└──────────┬──────────┘
           ↓
    CALCULATION PROCESS
    ┌─────────────────────────────────┐
    │ calculateGST()                  │
    │ ┌───────────────────────────── │
    │ │ Base = Price × 100/(100+GST)│ │
    │ │ Base = 120 × 100/105        │ │
    │ │ Base = ₹114.29              │ │
    │ │                              │ │
    │ │ GST = Price - Base           │ │
    │ │ GST = 120 - 114.29           │ │
    │ │ GST = ₹5.71                  │ │
    │ └───────────────────────────── │
    └──────────┬──────────────────────┘
               ↓
    ┌──────────────────────────────┐
    │ getGSTType()                │
    │ Delivery: Karnataka          │
    │ Business: Tamil Nadu         │
    │ Type: IGST (inter-state)    │
    └──────────┬───────────────────┘
               ↓
    IGST SCENARIO             CGST+SGST SCENARIO
    ┌─────────────────┐       ┌──────────────────┐
    │ GST: ₹5.71      │       │ splitCGSTSGST()  │
    │ IGST: ₹5.71     │       │ CGST: ₹2.86      │
    │ (full amount)   │       │ SGST: ₹2.85      │
    └─────────────────┘       │ (50-50 split)    │
                               └──────────────────┘
               ↓
         INVOICE DATA
         ┌────────────────────┐
         │ Base: ₹114.29      │
         │ GST:  ₹5.71        │
         │ Total: ₹120        │
         └────────────────────┘
```

---

## State-Based GST Determination

```
DELIVERY LOCATION CHECK
┌────────────────────────────┐
│ Business State: Tamil Nadu │
│ Delivery State: ?          │
└────────┬───────────────────┘
         ↓
    MATCH CHECK
    ┌────────────────────────┐
    │ Is Delivery = Business?│
    └────┬──────────────────┘
         │
    ┌────┴─────────────────┐
    │                      │
    ↓ YES                  ↓ NO
 SAME-STATE          INTER-STATE
 ┌──────────┐        ┌──────────┐
 │ CGST+SGST│        │ IGST     │
 │ 50-50    │        │ 100%     │
 │ split    │        │ full     │
 └──────────┘        └──────────┘
     ↓                   ↓
 Invoice shows:      Invoice shows:
 CGST: 2.5%          IGST: 5%
 SGST: 2.5%
```

---

## Data Flow: Order Processing

```
PRODUCT ADDED TO CART
┌────────────────────────────┐
│ Product ID, Quantity       │
│ Price: ₹120 (inclusive)    │
│ GST%: 5%                   │
└────────┬───────────────────┘
         ↓
CHECKOUT INITIATED
┌────────────────────────────────┐
│ Fetch Product Details          │
│ • gst_percentage               │
│ • tax_inclusive                │
│ • Compare with GST settings    │
└────────┬───────────────────────┘
         ↓
ADDRESS SELECTED
┌────────────────────────────────┐
│ Extract Delivery State         │
│ Fetch Business State from      │
│ GST Settings                   │
│ Determine GST Type             │
└────────┬───────────────────────┘
         ↓
TAX CALCULATION
┌────────────────────────────────┐
│ For Each Item:                 │
│ • Extract GST from price       │
│ • Calculate Base Amount        │
│                                │
│ Determine:                     │
│ • CGST+SGST (same state)       │
│ • IGST (different state)       │
│                                │
│ Calculate Shipping GST         │
└────────┬───────────────────────┘
         ↓
ORDER CREATION
┌────────────────────────────────┐
│ Store in Database:             │
│ • gst_amount                   │
│ • gst_type                     │
│ • cgst_amount                  │
│ • sgst_amount                  │
│ • igst_amount                  │
│ • delivery_state               │
│                                │
│ Store Item Details:            │
│ • gst_percentage per item      │
│ • gst_amount per item          │
│ • hsn_code per item            │
└────────┬───────────────────────┘
         ↓
INVOICE GENERATION
┌────────────────────────────────┐
│ Build Invoice Data:            │
│ • Item prices (as-is)          │
│ • HSN codes                    │
│ • Tax breakdown                │
│ • Compliance note              │
│                                │
│ Generate PDF:                  │
│ • Professional format          │
│ • Full tax breakdown           │
│ • GST-compliant                │
└────────────────────────────────┘
```

---

## Tax Inclusion Guarantee

```
WHAT CUSTOMER SEES vs. WHAT IS ACTUALLY USED

Product Page
┌─────────────────────────┐
│ ₹120 - shown to cust    │ ← What customer sees
│ (includes all taxes)    │
└───────────┬─────────────┘
            ↓
In Database & Calculations
┌────────────────────────────┐
│ Price: ₹120 (stored)       │
│ Base: ₹114.29 (calculated) │
│ GST: ₹5.71 (calculated)    │
└───────────┬────────────────┘
            ├─ Invoice uses ₹5.71 for tax breakdown
            ├─ Customer pays ₹120 (no additional tax)
            └─ Invoice shows: Base ₹114.29 + GST ₹5.71 = ₹120

Guarantee:
✓ Customer never pays more than product price
✓ Tax is ALWAYS included in displayed price
✓ No surprise charges at checkout
✓ Invoice shows breakdown for compliance only
```

---

## Component Interaction Diagram

```
TaxInclusiveInfo Component
            │
            ├─ variant="subtitle"  → ProductDetail, Cart
            │  Shows: "Inclusive of all taxes"
            │
            ├─ variant="badge"     → OrderConfirmation
            │  Shows: "✓ Inclusive of all taxes"
            │
            ├─ variant="note"      → Educational displays
            │  Shows: Full explanation box
            │
            └─ variant="checkout"  → Checkout page
               Shows: Tax info box with explanation

gstCalculations.ts Functions
            │
            ├─ calculateGST()       → Extract tax from single price
            ├─ splitCGSTSGST()      → Determine state-based split
            ├─ getGSTType()         → Determine CGST+SGST or IGST
            ├─ calculateOrderTotals()→ Complete order calculation
            └─ validate functions   → Verify GST/HSN formats

invoiceGenerator.ts
            │
            ├─ generateInvoicePDF() → Create PDF
            ├─ generateInvoiceNumber()→ Create invoice #
            ├─ saveInvoiceToDB()    → Store invoice
            └─ downloadInvoicePDF() → Send to customer
```

---

## Error Prevention Flow

```
ADMIN ENTERS PRODUCT DATA
         ↓
  VALIDATION CHECKS
┌──────────────────────────┐
│ ✓ Price is number        │
│ ✓ GST % is valid (0/5/12/18)
│ ✓ HSN code format        │
│ ✓ tax_inclusive is TRUE  │
└──────────┬───────────────┘
           ↓
      CALCULATIONS
┌──────────────────────────┐
│ Can price be divided?    │
│ Does base = reasonable %?│
│ Is GST amount positive?  │
└──────────┬───────────────┘
           ↓
      STORAGE
┌──────────────────────────┐
│ Store validated data     │
│ Use in calculations      │
│ Display on UI            │
└──────────────────────────┘
           ↓
      GUARANTEE
    ✓ No calculation errors
    ✓ No negative taxes
    ✓ No invalid data
    ✓ Consistent pricing
```

---

## Performance Considerations

```
PERFORMANCE FLOW

Product Browse (N products)
├─ Query products: 50-100ms
├─ Extract price data: <1ms each
└─ Display: <500ms

Cart Page (N items)
├─ Calculate total: <5ms
├─ Render items: <200ms
└─ Display total: <500ms

Checkout (N items, M states)
├─ Fetch products: 50-100ms
├─ Calculate order totals: <10ms
├─ Determine tax type: <1ms
├─ Fetch shipping: 10-50ms
└─ Display summary: <200ms

Order Processing (N items)
├─ Calculate all taxes: <20ms
├─ Store in database: 100-500ms
└─ Create invoice: 500ms-1s

Invoice Generation
├─ Build data: <50ms
├─ Generate PDF: 100-500ms
└─ Download: <1s

OPTIMIZATION:
✓ Cache GST settings
✓ Memoize recurring calculations
✓ Lazy load invoices
✓ Parallel DB queries
```

---

