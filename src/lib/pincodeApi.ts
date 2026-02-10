/**
 * TypeScript types for postal API responses
 */
export interface PostOffice {
  Name: string;
  Block: string;
  District: string;
  State: string;
  Pincode: string;
  Division?: string;
}

export interface PostalApiResponse {
  Status: string;
  PostOffice: PostOffice[];
}

export interface PincodeResult {
  area: string;
  city: string;
  district: string;
  state: string;
}

/**
 * Select best PostOffice from array
 * Priority: Pick first entry where Block !== "NA"
 * Fallback: Use first entry if all have Block === "NA"
 */
function selectBestPostOffice(postOffices: PostOffice[]): PostOffice | null {
  if (!postOffices || postOffices.length === 0) return null;

  // Try to find first entry where Block is not "NA"
  const validPostOffice = postOffices.find(
    (po) => po.Block && po.Block !== 'NA' && po.Block.trim() !== ''
  );

  // Return valid entry or fallback to first
  return validPostOffice || postOffices[0];
}

/**
 * Fetch and parse pincode details
 * Returns area, city (Block), district, and state
 */
export async function fetchPincodeDetails(
  pincode: string
): Promise<PincodeResult | null> {
  if (!/^\d{6}$/.test(pincode)) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data: PostalApiResponse[] = await res.json();

    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const selectedPostOffice = selectBestPostOffice(data[0].PostOffice);

      if (!selectedPostOffice) {
        return null;
      }

      // Determine city: use Block if not "NA", fallback to District
      const city =
        selectedPostOffice.Block && selectedPostOffice.Block !== 'NA'
          ? selectedPostOffice.Block
          : selectedPostOffice.District || '';

      return {
        area: selectedPostOffice.Name || '',
        city: city,
        district: selectedPostOffice.District || '',
        state: selectedPostOffice.State || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Pincode lookup error:', error);
    return null;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use fetchPincodeDetails instead
 */
export async function lookupPincode(pincode: string): Promise<PincodeResult | null> {
  return fetchPincodeDetails(pincode);
}
