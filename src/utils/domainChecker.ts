interface DomainCheckResult {
  domain: string;
  available: boolean;
  error?: string;
}

interface ResellerClubResponse {
  [key: string]: {
    status: string;
    classkey?: string;
  };
}

export async function checkDomainAvailability(
  brandName: string,
  tlds: string[],
  apiConfig: { userId: string; apiKey: string }
): Promise<DomainCheckResult[]> {
  const { userId, apiKey } = apiConfig;
  
  // If no API config, return mock data
  if (!userId || !apiKey) {
    return tlds.map(tld => ({
      domain: `${brandName}.${tld}`,
      available: Math.random() > 0.6, // Mock availability
      error: 'API credentials not configured'
    }));
  }

  try {
    // Build the API URL
    const baseUrl = 'https://httpapi.com/api/domains/available.json';
    const params = new URLSearchParams({
      'auth-userid': userId,
      'api-key': apiKey,
      'domain-name': brandName
    });
    
    // Add each TLD as a separate parameter
    tlds.forEach(tld => {
      params.append('tlds', tld);
    });

    const url = `${baseUrl}?${params.toString()}`;

    // Make the API call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ResellerClubResponse = await response.json();

    // Parse the response
    return tlds.map(tld => {
      const domainKey = `${brandName}.${tld}`;
      const domainData = data[domainKey];
      
      if (!domainData) {
        return {
          domain: domainKey,
          available: false,
          error: 'No data returned for domain'
        };
      }

      return {
        domain: domainKey,
        available: domainData.status === 'available',
        error: domainData.status === 'error' ? 'API error' : undefined
      };
    });

  } catch (error) {
    console.error('Domain check error:', error);
    
    // Return error results for all domains
    return tlds.map(tld => ({
      domain: `${brandName}.${tld}`,
      available: false,
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