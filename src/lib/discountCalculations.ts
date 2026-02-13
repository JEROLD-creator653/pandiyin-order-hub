/**
 * Discount & Savings Calculation Utilities
 * Handles professional Flipkart-style pricing calculations
 */

export interface PricingInfo {
  sellingPrice: number;
  comparePrice: number | null;
  discountPercent: number;
  savingsAmount: number;
  hasDiscount: boolean;
}

/**
 * Calculate discount percentage from compare price and selling price
 * @param comparePrice - MRP (compare price)
 * @param sellingPrice - Selling price
 * @returns Discount percentage (0-100)
 */
export function calculateDiscountPercent(
  comparePrice: number | null | undefined,
  sellingPrice: number
): number {
  if (!comparePrice || comparePrice <= sellingPrice) {
    return 0;
  }
  
  const discount = ((comparePrice - sellingPrice) / comparePrice) * 100;
  return Math.round(discount);
}

/**
 * Calculate savings amount (how much customer saves)
 * @param comparePrice - MRP (compare price)
 * @param sellingPrice - Selling price
 * @returns Savings amount in rupees
 */
export function calculateSavings(
  comparePrice: number | null | undefined,
  sellingPrice: number
): number {
  if (!comparePrice || comparePrice <= sellingPrice) {
    return 0;
  }
  
  return Math.round((comparePrice - sellingPrice) * 100) / 100;
}

/**
 * Get complete pricing information
 * @param sellingPrice - Product selling price
 * @param comparePrice - Product MRP/compare price
 * @returns PricingInfo object with all calculations
 */
export function getPricingInfo(
  sellingPrice: number,
  comparePrice: number | null | undefined
): PricingInfo {
  const discountPercent = calculateDiscountPercent(comparePrice, sellingPrice);
  const savingsAmount = calculateSavings(comparePrice, sellingPrice);
  
  return {
    sellingPrice,
    comparePrice: comparePrice || null,
    discountPercent,
    savingsAmount,
    hasDiscount: discountPercent > 0,
  };
}
