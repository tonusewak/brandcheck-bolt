interface DomainCheckRequest {
  brandName: string;
  tlds: string[];
  apiConfig: {
    userId: string;
    apiKey: string;
  };
}

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Function to get the current IP address of this Edge Function
async function getCurrentIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get current IP:', error);
    return 'Unable to determine IP';
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Special endpoint to get the current IP for whitelisting
    if (req.method === "GET" && new URL(req.url).pathname.endsWith('/ip')) {
      const currentIP = await getCurrentIP();
      return new Response(
        JSON.stringify({ 
          ip: currentIP,
          message: "Add this IP to your ResellerClub API whitelist",
          instructions: "Go to ResellerClub → Settings → API Settings → IP Whitelist and add this IP"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { brandName, tlds, apiConfig }: DomainCheckRequest = await req.json();

    // Validate input
    if (!brandName || !tlds || !Array.isArray(tlds) || tlds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: brandName and tlds array required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId, apiKey } = apiConfig;

    // If no API config, return mock data
    if (!userId || !apiKey) {
      const mockResults: DomainCheckResult[] = tlds.map(tld => ({
        domain: `${brandName}.${tld}`,
        available: Math.random() > 0.6,
        error: 'API credentials not configured'
      }));

      return new Response(
        JSON.stringify({ results: mockResults }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Build the ResellerClub API URL
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

    const apiUrl = `${baseUrl}?${params.toString()}`;

    // Make the API call to ResellerClub
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BrandCheck-Domain-Checker/1.0'
      },
    });

    if (!response.ok) {
      throw new Error(`ResellerClub API request failed: ${response.status} ${response.statusText}`);
    }

    const data: ResellerClubResponse = await response.json();

    // Parse the response
    const results: DomainCheckResult[] = tlds.map(tld => {
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

    return new Response(
      JSON.stringify({ results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Domain check error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});