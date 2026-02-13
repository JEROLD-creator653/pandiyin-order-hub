# GST-Inclusive Pricing System - Developer Reference

## System Architecture

```
Admin Input (Price + GST%)
        ↓
Database (Products with gst_percentage, tax_inclusive)
        ↓
Calculations (gstCalculations.ts)
        ↓
UI Components (Product, Cart, Checkout)
        ↓
Invoice Generation (invoiceGenerator.ts)
        ↓
Customer Experience (Final prices, No surprises)
```

---

## Calculation Functions Reference

### `calculateGST()`

Calculates GST breakdown for a single price.

```typescript
import { calculateGST } from '@/lib/gstCalculations';

const result = calculateGST(
  price: number,        // ₹120 (final price with GST)
  gstPercentage: number, // 5
  isTaxInclusive: boolean = true // Always true for this system
): GSTCalculation

// Returns:
{
  baseAmount: 114.29,   // Price without GST
  gstAmount: 5.71,      // GST amount
  totalAmount: 120      // Final price (same as input)
}
```

**Use Cases:**
- Calculate per-item GST for invoice
- Break down order items into base + GST
- Display tax breakdown in checkout

---

### `splitCGSTSGST()`

Splits GST into CGST and SGST for same-state delivery.

```typescript
import { splitCGSTSGST } from '@/lib/gstCalculations';

const result = splitCGSTSGST(
  gstAmount: number,     // ₹5.71 (total GST)
  gstPercentage: number  // 5 (rate)
): { cgst: number; sgst: number }

// Returns:
{
  cgst: 2.86,   // Central GST (50% of total)
  sgst: 2.85    // State GST (50% of total)
}
```

**Use Cases:**
- Show CGST/SGST breakdown on invoices
- Determine tax split for same-state orders
- Government compliance reporting

---

### `getGSTType()`

Determines if CGST+SGST (same-state) or IGST (inter-state) applies.

```typescript
import { getGSTType } from '@/lib/gstCalculations';

const result = getGSTType(
  deliveryState: string,  // 'Karnataka', 'Tamil Nadu', etc
  businessState?: string  // 'Tamil Nadu' (default)
): 'CGST+SGST' | 'IGST'

// Same state returns: 'CGST+SGST'
// Different state returns: 'IGST'
```

**Use Cases:**
- Determine tax type at checkout
- Show appropriate tax labels
- Generate compliant invoices

---

### `calculateShipping()`

Calculates shipping charge with GST (if applicable).

```typescript
import { calculateShipping } from '@/lib/gstCalculations';

const result = calculateShipping(
  cartValue: number,      // ₹370 (product subtotal)
  baseCharge: number,     // ₹50 (shipping before tax)
  freeAbove: number | null, // 500 (free above this)
  gstPercentage?: number, // 5 (usually for shipping)
  gstType?: 'CGST+SGST' | 'IGST'
): ShippingCalculation

// Returns:
{
  baseCharge: 50,        // Shipping charge
  applicableGST: 2.38,   // GST on shipping
  totalCharge: 52.38,    // Final shipping cost
  gstType: 'IGST'
}
```

**Use Cases:**
- Calculate delivery charges
- Add GST to shipping (if applicable)
- Display total shipping cost

---

### `calculateOrderTotals()`

Comprehensive order calculation with all taxes and shipping.

```typescript
import { calculateOrderTotals } from '@/lib/gstCalculations';

const result = calculateOrderTotals(
  cartItems: Array<{
    productPrice: number,      // ₹120
    quantity: number,          // 2
    gstPercentage: number,     // 5
    taxInclusive: boolean      // true
  }>,
  deliveryState: string,       // 'Karnataka'
  shippingConfig: {
    baseCharge: number,        // 50
    freeAbove?: number | null  // 500
  }
): OrderTaxSummary

// Returns:
{
  subtotal: 228.57,           // Amount before GST extraction
  itemGST: 11.43,             // Total GST from items
  shippingCharge: 50,         // Delivery cost
  shippingGST: 2.38,          // GST on shipping
  totalGST: 13.81,            // Total tax (informational)
  cgstAmount?: 0,             // Not applicable (inter-state)
  sgstAmount?: 0,             // Not applicable (inter-state)
  igstAmount: 13.81,          // IGST for inter-state
  total: 292.38,              // Final total (product+shipping)
  gstType: 'IGST',            // Tax type
  isTaxInclusive: true        // Always true for this system
}
```

**Use Cases:**
- Calculate final order total at checkout
- Generate comprehensive tax summary
- Place order with all tax details

---

### `formatPriceWithGST()`

Format price with GST notation for display.

```typescript
import { formatPriceWithGST } from '@/lib/gstCalculations';

const formatted = formatPriceWithGST(
  amount: number,          // 120
  gstInfo?: string         // 'Inclusive of 5% GST'
): string

// Returns: "₹120.00 (Inclusive of 5% GST)"
```

**Use Cases:**
- Display prices with GST notation
- Show formatted amounts in UI

---

## Validation Functions

### `validateGSTNumber()`

Validates GST number format (GSTIN).

```typescript
import { validateGSTNumber } from '@/lib/gstCalculations';

const isValid = validateGSTNumber(
  gstNumber: string  // '27AAAA0000A1Z5'
): boolean

// Returns: true if valid format
```

**Format**: 15 characters
- 2 digits: State code
- 5 letters: Business name
- 4 digits: Unique number
- 1 letter: Entity type
- Z: Fixed
- 1 alphanumeric: Check digit

---

### `validateHSNCode()`

Validates HSN code format.

```typescript
import { validateHSNCode } from '@/lib/gstCalculations';

const isValid = validateHSNCode(
  hsnCode: string  // '100590'
): boolean

// Returns: true if 6-8 digits
```

**Format**: 6-8 digits representing tax classification

---

## Component Reference

### TaxInclusiveInfo Component

Display tax information with different variants.

```tsx
import TaxInclusiveInfo from '@/components/TaxInclusiveInfo';

<TaxInclusiveInfo 
  variant="subtitle"      // 'subtitle', 'badge', 'note', 'checkout'
  className="..."        // Optional CSS classes
  showIcon={true}        // Show/hide icon
/>
```

**Variants:**

1. **subtitle** - Small text below price
   ```
   Inclusive of all taxes
   ```

2. **badge** - Inline badge style
   ```
   ✓ Inclusive of all taxes
   ```

3. **note** - Info box with explanation
   ```
   ℹ️ All prices are inclusive of all applicable taxes.
      No additional tax will be added during checkout.
   ```

4. **checkout** - Tax breakdown explanation
   ```
   Tax Breakdown
   All listed prices are inclusive of applicable GST...
   ```

---

## Database Queries

### Get Product with GST Details

```sql
SELECT 
  id, 
  name, 
  price, 
  gst_percentage, 
  hsn_code, 
  tax_inclusive
FROM products
WHERE id = $1;
```

### Add GST Fields to Order

```sql
INSERT INTO orders (
  user_id,
  subtotal,
  delivery_charge,
  gst_amount,
  gst_percentage,
  gst_type,
  cgst_amount,
  sgst_amount,
  igst_amount,
  delivery_state
) VALUES (...)
```

### Calculate Order GST

```sql
SELECT 
  SUM(gst_amount) as total_gst,
  AVG(gst_percentage) as avg_gst_rate
FROM order_items
WHERE order_id = $1;
```

---

## Invoice Generation

### Generate Invoice

```typescript
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

const blob = await generateInvoicePDF({
  invoiceNumber: 'INV20260213001',
  invoiceDate: new Date(),
  businessName: 'Pandiyin Organic',
  businessAddress: 'Madurai, Tamil Nadu',
  gstNumber: '27AAAA0000A1Z5',
  customerName: 'John Doe',
  customerAddress: 'Bangalore, Karnataka',
  items: [
    {
      description: 'Organic Rice',
      hsnCode: '100590',
      quantity: 2,
      unitPrice: 120,
      gstPercentage: 5,
      gstAmount: 5.71,
      totalAmount: 240
    }
  ],
  subtotal: 228.57,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 11.43,
  totalTax: 11.43,
  shippingCharge: 50,
  total: 290,
  gstType: 'IGST',
  paymentMethod: 'COD',
  orderNumber: 'ORD-2026-001'
});

// Save invoice to file
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'Invoice.pdf';
link.click();
```

---

## Integration Examples

### Example 1: Product Page Integration

```tsx
import { calculateGST } from '@/lib/gstCalculations';
import TaxInclusiveInfo from '@/components/TaxInclusiveInfo';

export function ProductDetail({ product }) {
  const gstBreakdown = calculateGST(
    product.price,
    product.gst_percentage,
    product.tax_inclusive
  );

  return (
    <div>
      <p className="text-4xl">{formatPrice(product.price)}</p>
      <TaxInclusiveInfo variant="subtitle" />
      {/* Additional product details */}
    </div>
  );
}
```

### Example 2: Checkout Integration

```tsx
import { calculateOrderTotals } from '@/lib/gstCalculations';

export function CheckoutSummary({ items, deliveryState, shipping }) {
  const totals = calculateOrderTotals(
    items.map(item => ({
      productPrice: item.product.price,
      quantity: item.quantity,
      gstPercentage: item.product.gst_percentage,
      taxInclusive: item.product.tax_inclusive
    })),
    deliveryState,
    shipping
  );

  return (
    <div>
      <p>Subtotal: {formatPrice(totals.subtotal)}</p>
      <p>Delivery: {formatPrice(totals.shippingCharge)}</p>
      <TaxInclusiveInfo variant="checkout" />
      <p className="font-bold">Total: {formatPrice(totals.total)}</p>
    </div>
  );
}
```

### Example 3: Invoice Generation

```tsx
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import { calculateOrderTotals } from '@/lib/gstCalculations';

async function downloadInvoice(order, items) {
  const totals = calculateOrderTotals(items, order.delivery_state, {
    baseCharge: order.delivery_charge
  });

  const invoiceData = {
    invoiceNumber: order.invoice_number,
    invoiceDate: new Date(order.created_at),
    businessName: 'Pandiyin Organic',
    businessAddress: 'Madurai, Tamil Nadu',
    gstNumber: settings.gst_number,
    customerName: order.delivery_address.full_name,
    customerAddress: formatAddress(order.delivery_address),
    items: items.map(item => ({
      description: item.product_name,
      hsnCode: item.hsn_code,
      quantity: item.quantity,
      unitPrice: calculateGST(item.product_price, item.gst_percentage).baseAmount,
      gstPercentage: item.gst_percentage,
      gstAmount: calculateGST(item.product_price, item.gst_percentage).gstAmount,
      totalAmount: item.total
    })),
    subtotal: totals.subtotal,
    cgstAmount: totals.cgstAmount,
    sgstAmount: totals.sgstAmount,
    igstAmount: totals.igstAmount,
    totalTax: totals.totalGST,
    shippingCharge: order.delivery_charge,
    total: order.total,
    gstType: order.gst_type,
    paymentMethod: order.payment_method,
    orderNumber: order.order_number
  };

  const blob = await generateInvoicePDF(invoiceData);
  // Download or display blob
}
```

---

## State Management Pattern

### In Components

```tsx
const [order, setOrder] = useState<Order | null>(null);
const [items, setItems] = useState<OrderItem[]>([]);
const [gstSettings, setGstSettings] = useState<GSTSettings | null>(null);

// Calculate totals when items change
useEffect(() => {
  if (items.length === 0) return;
  
  const totals = calculateOrderTotals(
    items.map(item => ({
      productPrice: item.product.price,
      quantity: item.quantity,
      gstPercentage: item.product.gst_percentage,
      taxInclusive: item.product.tax_inclusive
    })),
    selectedState,
    { baseCharge: shippingCharge }
  );

  // Use totals for display
}, [items, selectedState, shippingCharge]);
```

---

## Performance Considerations

- GST calculations are lightweight (pure functions)
- Cache GST settings to avoid repeated DB queries
- Memoize `calculateOrderTotals()` results if items don't change
- Lazy load invoice generation (on demand)
- Use parallel queries for fetching product and settings

---

## Testing Examples

### Unit Test - GST Calculation

```typescript
import { calculateGST } from '@/lib/gstCalculations';

describe('calculateGST', () => {
  it('should correctly calculate inclusive GST', () => {
    const result = calculateGST(120, 5, true);
    expect(result.baseAmount).toBeCloseTo(114.29, 2);
    expect(result.gstAmount).toBeCloseTo(5.71, 2);
    expect(result.totalAmount).toBe(120);
  });

  it('should handle 0% GST', () => {
    const result = calculateGST(100, 0, true);
    expect(result.baseAmount).toBe(100);
    expect(result.gstAmount).toBe(0);
  });

  it('should handle 18% GST', () => {
    const result = calculateGST(500, 18, true);
    expect(result.baseAmount).toBeCloseTo(423.73, 2);
    expect(result.gstAmount).toBeCloseTo(76.27, 2);
  });
});
```

### Integration Test - Order Totals

```typescript
import { calculateOrderTotals } from '@/lib/gstCalculations';

describe('calculateOrderTotals', () => {
  it('should calculate correct total with multiple items', () => {
    const totals = calculateOrderTotals(
      [
        { productPrice: 120, quantity: 2, gstPercentage: 5, taxInclusive: true },
        { productPrice: 250, quantity: 1, gstPercentage: 12, taxInclusive: true }
      ],
      'Karnataka',
      { baseCharge: 50 }
    );

    expect(totals.total).toBeCloseTo(521.38, 2);
    expect(totals.gstType).toBe('IGST');
  });
});
```

---

## Migration Guide (if upgrading)

The system uses database migrations:

1. `20260213_add_gst_fields_to_products.sql`
   - Adds: gst_percentage, hsn_code, tax_inclusive
   - Safe: Uses IF NOT EXISTS checks

2. `20260213_add_gst_fields_to_orders.sql`
   - Adds: gst_amount, gst_percentage, gst_type, cgst_amount, sgst_amount, igst_amount, delivery_state
   - Safe: Uses IF NOT EXISTS checks

No manual migration needed - automatically applied on deploy.

---

## Common Pitfalls & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Wrong GST amount | Using exclusive pricing | Ensure all prices are inclusive |
| Missing tax breakdown | GST disabled | Enable GST in settings |
| CGST/SGST not splitting | State mismatch | Check delivery_state matches business_state |
| Zero tax amount | 0% GST rate | This is correct for some items |
| Invoice not generating | Missing items data | Ensure order_items populated |

---

## Performance Metrics

- GST calculation: < 1ms
- Order totals calculation: < 5ms
- Invoice PDF generation: 100-500ms (depends on server)
- Database queries: Cached in most cases

