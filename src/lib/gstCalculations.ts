/**
 * GST and Tax Calculation System
 * Production-ready tax calculations for Indian ecommerce
 * Supports: 0%, 5%, 12%, 18% GST rates
 */

export interface GSTCalculation {
  baseAmount: number;
  gstAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface ShippingCalculation {
  baseCharge: number;
  applicableGST: number;
  totalCharge: number;
  gstType: 'CGST+SGST' | 'IGST';
}

export interface OrderTaxSummary {
  subtotal: number;
  itemGST: number;
  shippingCharge: number;
  shippingGST: number;
  totalGST: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  total: number;
  gstType: 'CGST+SGST' | 'IGST';
  isTaxInclusive: boolean;
}

/**
 * Calculate GST amount based on price and GST percentage
 * @param price - Product price (can be inclusive or exclusive of GST)
 * @param gstPercentage - GST rate (0, 5, 12, 18)
 * @param isTaxInclusive - Whether price includes GST
 * @returns Breakdown of base amount, GST, and total
 */
export function calculateGST(
  price: number,
  gstPercentage: number,
  isTaxInclusive: boolean = true
): GSTCalculation {
  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (isTaxInclusive) {
    // Price is inclusive of GST - we need to extract base amount
    // Formula: BaseAmount = Price × 100 / (100 + GST%)
    baseAmount = Math.round((price * 100) / (100 + gstPercentage) * 100) / 100;
    gstAmount = Math.round((price - baseAmount) * 100) / 100;
    totalAmount = price;
  } else {
    // Price is exclusive of GST - add GST to base
    baseAmount = price;
    gstAmount = Math.round((price * gstPercentage) / 100 * 100) / 100;
    totalAmount = Math.round((price + gstAmount) * 100) / 100;
  }

  return {
    baseAmount,
    gstAmount,
    totalAmount,
  };
}

/**
 * Split GST into CGST and SGST (for same state delivery)
 * @param gstAmount - Total GST amount
 * @param gstPercentage - GST rate
 * @returns Split CGST and SGST amounts
 */
export function splitCGSTSGST(
  gstAmount: number,
  gstPercentage: number
): { cgst: number; sgst: number } {
  // CGST = SGST = GST% / 2
  const halfRate = gstPercentage / 2;
  const cgst = Math.round((gstAmount / 2) * 100) / 100;
  const sgst = Math.round((gstAmount - cgst) * 100) / 100;

  return { cgst, sgst };
}

/**
 * Determine GST type (CGST+SGST or IGST) based on delivery state
 * @param deliveryState - State where product is being delivered
 * @param businessState - State where business is registered (default: Tamil Nadu)
 * @returns GST type to apply
 */
export function getGSTType(
  deliveryState: string,
  businessState: string = 'Tamil Nadu'
): 'CGST+SGST' | 'IGST' {
  // Normalize state names
  const normalizeState = (state: string) => state.trim().toLowerCase();
  const delivery = normalizeState(deliveryState);
  const business = normalizeState(businessState);

  // Same state delivery or UT associated with state
  const sameStateDelivery =
    delivery === business ||
    (business === 'tamil nadu' && (delivery === 'puducherry' || delivery === 'pondicherry'));

  return sameStateDelivery ? 'CGST+SGST' : 'IGST';
}

/**
 * Calculate shipping charge with GST
 * @param cartValue - Total cart value (before shipping)
 * @param baseCharge - Base shipping charge
 * @param freeAbove - Free delivery threshold (null = no free delivery)
 * @param gstPercentage - GST percentage for shipping (usually 5%)
 * @param gstType - Type of GST to apply
 * @returns Shipping charge breakdown
 */
export function calculateShipping(
  cartValue: number,
  baseCharge: number,
  freeAbove: number | null,
  gstPercentage: number = 5,
  gstType: 'CGST+SGST' | 'IGST' = 'IGST'
): ShippingCalculation {
  // Check if free delivery applies
  let charge = baseCharge;
  if (freeAbove !== null && cartValue >= freeAbove) {
    charge = 0;
  }

  // Calculate GST on shipping charge
  const shippingGST = Math.round((charge * gstPercentage) / 100 * 100) / 100;
  const totalCharge = Math.round((charge + shippingGST) * 100) / 100;

  return {
    baseCharge: charge,
    applicableGST: shippingGST,
    totalCharge,
    gstType,
  };
}

/**
 * Complete order tax and shipping calculation
 * @param cartItems - Order line items with price and GST details
 * @param deliveryState - Delivery state for GST determination
 * @param shippingConfig - Shipping configuration (base charge, free above)
 * @returns Complete order tax summary
 */
export function calculateOrderTotals(
  cartItems: Array<{
    productPrice: number;
    quantity: number;
    gstPercentage: number;
    taxInclusive: boolean;
  }>,
  deliveryState: string,
  shippingConfig: {
    baseCharge: number;
    freeAbove?: number | null;
  }
): OrderTaxSummary {
  let subtotal = 0;
  let totalItemGST = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  const gstType = getGSTType(deliveryState);

  // Calculate item totals and GST
  for (const item of cartItems) {
    const itemTotal = item.productPrice * item.quantity;
    const gstCalc = calculateGST(itemTotal, item.gstPercentage, item.taxInclusive);

    subtotal += gstCalc.baseAmount;
    totalItemGST += gstCalc.gstAmount;

    if (gstType === 'CGST+SGST') {
      const { cgst, sgst } = splitCGSTSGST(gstCalc.gstAmount, item.gstPercentage);
      totalCGST += cgst;
      totalSGST += sgst;
    } else {
      totalIGST += gstCalc.gstAmount;
    }
  }

  // Calculate shipping
  const shippingCalc = calculateShipping(
    subtotal + totalItemGST,
    shippingConfig.baseCharge,
    shippingConfig.freeAbove || null,
    5, // Shipping GST is usually 5%
    gstType
  );

  // If shipping charge applies, add its GST
  let shippingGSTAmount = 0;
  if (shippingCalc.baseCharge > 0) {
    shippingGSTAmount = shippingCalc.applicableGST;

    if (gstType === 'CGST+SGST') {
      const { cgst, sgst } = splitCGSTSGST(shippingGSTAmount, 5);
      totalCGST += cgst;
      totalSGST += sgst;
    } else {
      totalIGST += shippingGSTAmount;
    }
  }

  const totalGST = totalItemGST + shippingGSTAmount;
  const total = Math.round((subtotal + totalGST + shippingCalc.baseCharge) * 100) / 100;

  return {
    subtotal,
    itemGST: totalItemGST,
    shippingCharge: shippingCalc.baseCharge,
    shippingGST: shippingGSTAmount,
    totalGST,
    cgstAmount: totalCGST > 0 ? totalCGST : undefined,
    sgstAmount: totalSGST > 0 ? totalSGST : undefined,
    igstAmount: totalIGST > 0 ? totalIGST : undefined,
    total,
    gstType,
    isTaxInclusive: true,
  };
}

/**
 * Format price for display with GST notation
 * @param amount - Amount to format
 * @param gstInfo - Optional GST information to append
 * @returns Formatted string
 */
export function formatPriceWithGST(
  amount: number,
  gstInfo?: string
): string {
  const formatted = `₹${amount.toFixed(2)}`;
  if (gstInfo) {
    return `${formatted} (${gstInfo})`;
  }
  return formatted;
}

/**
 * Validate GST number format (12-digit GSTIN)
 * @param gstNumber - GST number to validate
 * @returns True if valid format
 */
export function validateGSTNumber(gstNumber: string): boolean {
  // India GST format: 2 digits state code + 10 digit unique number
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
}

/**
 * Validate HSN Code (6-8 digit harmonized system of nomenclature)
 * @param hsnCode - HSN code to validate
 * @returns True if valid format
 */
export function validateHSNCode(hsnCode: string): boolean {
  const hsnRegex = /^[0-9]{6,8}$/;
  return hsnRegex.test(hsnCode);
}

/**
 * Get supported GST rates
 * @returns Array of valid GST percentages
 */
export function getSupportedGSTRates(): number[] {
  return [0, 5, 12, 18];
}

/**
 * Get GST rate description for display
 * @param rate - GST percentage
 * @returns Human-readable description
 */
export function getGSTRateDescription(rate: number): string {
  const descriptions: Record<number, string> = {
    0: 'GST 0% (Exempted)',
    5: 'GST 5% (Essential Items)',
    12: 'GST 12% (General Items)',
    18: 'GST 18% (Premium Items)',
  };
  return descriptions[rate] || `GST ${rate}%`;
}
