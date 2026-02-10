/**
 * Address Form Helper Functions
 * Handles phone normalization and pincode operations
 */

/**
 * Normalize phone number by removing country code prefix and extra spaces
 * Stores only digits
 */
export function normalizePhoneNumber(
  rawPhone: string,
  countryCode: string
): string {
  // Remove all spaces
  let cleaned = rawPhone.replace(/\s+/g, '');

  // Remove "+" if present
  cleaned = cleaned.replace(/^\+/, '');

  // Remove country code prefix if it matches
  const codeWithoutPlus = countryCode.replace(/^\+/, '');
  if (cleaned.startsWith(codeWithoutPlus)) {
    cleaned = cleaned.substring(codeWithoutPlus.length);
  }

  // Keep only digits
  cleaned = cleaned.replace(/\D/g, '');

  return cleaned;
}

/**
 * Detect if phone number contains country code and split it
 * Useful for backward compatibility with stored values
 */
export function splitPhoneIfContainsCountryCode(rawPhone: string): {
  countryCode: string;
  phoneNumber: string;
} {
  // Common country code patterns with their lengths
  const countryCodePatterns = [
    { code: '+91', length: 2 },
    { code: '+971', length: 3 },
    { code: '+65', length: 2 },
    { code: '+1', length: 1 },
    { code: '+44', length: 2 },
    { code: '+61', length: 2 },
    { code: '+81', length: 2 },
    { code: '+49', length: 2 },
    { code: '+33', length: 2 },
    { code: '+86', length: 2 },
    { code: '+82', length: 2 },
    { code: '+966', length: 3 },
    { code: '+60', length: 2 },
    { code: '+977', length: 3 },
    { code: '+94', length: 2 },
    { code: '+880', length: 3 },
  ];

  // Clean input: remove spaces and get leading digits
  const cleaned = rawPhone.replace(/\s+/g, '');

  // Check for each country code
  for (const { code, length } of countryCodePatterns) {
    const codeWithoutPlus = code.replace(/^\+/, '');
    if (cleaned.startsWith(codeWithoutPlus) || cleaned.startsWith(code)) {
      // Extract phone number (digits only after country code)
      const phoneWithoutCode = cleaned
        .substring(cleaned.startsWith('+') ? code.length : codeWithoutPlus.length)
        .replace(/\D/g, '');

      return {
        countryCode: code,
        phoneNumber: phoneWithoutCode,
      };
    }
  }

  // Default: assume +91 if no match
  const digitsOnly = cleaned.replace(/\D/g, '');
  return {
    countryCode: '+91',
    phoneNumber: digitsOnly,
  };
}

/**
 * Debounce helper for async operations
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<any> {
  let timeout: NodeJS.Timeout | null = null;

  return async (...args: Parameters<T>) => {
    return new Promise((resolve) => {
      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(async () => {
        const result = await func(...args);
        resolve(result);
      }, wait);
    });
  };
}
