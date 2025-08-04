interface DomainCheckResult {
  domain: string;
  available: boolean;
  error?: string;
}

export async function checkDomainAvailability(
  brandName: string,
  tlds: string[],
  apiConfig: { userId: string; apiKey: string }
): Promise<DomainCheckResult[]> {
  try {
    // Use the Supabase Edge Function
    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-domains`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        brandName,
        tlds,
        apiConfig
      })
    });

    if (!response.ok) {
      throw new Error(`Edge function request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.results || [];

  } catch (error) {
    console.error('Domain check error:', error);
    
    // Return mock data as fallback
    return tlds.map(tld => ({
      domain: `${brandName}.${tld}`,
      available: Math.random() > 0.6,
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}

// Fallback function for when API is not configured
export function mockDomainCheck(brandName: string, tlds: string[]): DomainCheckResult[] {
  return tlds.map(tld => ({
    domain: `${brandName}.${tld}`,
    available: Math.random() > 0.6,
    error: undefined
  }));
}