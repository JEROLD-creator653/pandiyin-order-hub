export interface PincodeResult {
  city: string;
  state: string;
  district: string;
}

export async function lookupPincode(pincode: string): Promise<PincodeResult | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        city: po.District || po.Division || '',
        state: po.State || '',
        district: po.District || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}
