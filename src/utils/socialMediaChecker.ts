interface SocialMediaResult {
  platform: string;
  username: string;
  available: boolean | null; // null means error/unknown
  error?: string;
}

interface SocialMediaResponse {
  username: string;
  availability: {
    instagram: boolean | null;
    facebook: boolean | null;
    twitter: boolean | null;
    pinterest: boolean | null;
  };
}

const PLATFORMS = {
  instagram: (u: string) => `https://www.instagram.com/${u}/`,
  facebook: (u: string) => `https://www.facebook.com/${u}`,
  twitter: (u: string) => `https://x.com/${u}`,
  pinterest: (u: string) => `https://www.pinterest.com/${u}/`,
};

// Simple helpers
async function getStatus(url: string): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        // Set a UA; some sites serve different content to bots
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
    });
    const text = await res.text();

    return { status: res.status, body: text.slice(0, 4000) }; // cap body for perf
  } catch (e) {
    return { status: 0, body: "" }; // network or blocked
  }
}

// Soft-404 detectors (lightweight heuristics; update as needed)
function soft404(platform: string, { status, body }: { status: number; body: string }): boolean {
  if (status === 404) return true;   // clear "not found"
  if (status >= 200 && status < 300) {
    const b = body.toLowerCase();
    if (platform === "instagram") {
      // IG often shows "Sorry, this page isn't available."
      return b.includes("sorry, this page isn't available.");
    }
    if (platform === "facebook") {
      // FB may show "this content isn't available right now."
      return b.includes("content isn't available") || b.includes("page isn't available");
    }
    if (platform === "twitter") {
      // X sometimes renders "This account doesn't exist".
      return b.includes("this account doesn't exist") || b.includes("account suspended");
    }
    if (platform === "pinterest") {
      // Pinterest soft-404 for users
      return b.includes("oops") && b.includes("we can't find that page");
    }
  }
  return false;
}

function isTaken(platform: string, probe: { status: number; body: string }): boolean | null {
  // If soft 404 => not taken; 200 without soft-404 => likely taken
  if (probe.status === 404) return false;
  if (probe.status >= 200 && probe.status < 300) {
    return !soft404(platform, probe);
  }
  // On unknown / blocked, return null so UI can show "error"
  return null;
}

export async function checkSocialMediaAvailability(username: string): Promise<SocialMediaResult[]> {
  if (!username) {
    throw new Error("Username is required");
  }

  const uname = username.trim();
  const results: SocialMediaResult[] = [];

  for (const [platform, urlFn] of Object.entries(PLATFORMS)) {
    try {
      const url = urlFn(uname);
      const probe = await getStatus(url);
      const taken = isTaken(platform, probe);

      // available = NOT taken (true/false/null)
      const available = taken === null ? null : !taken;
      
      results.push({
        platform,
        username: uname,
        available,
        error: available === null ? 'Unable to check' : undefined
      });
    } catch (error) {
      results.push({
        platform,
        username: uname,
        available: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

// Mock function for fallback
export function mockSocialMediaCheck(username: string): SocialMediaResult[] {
  const platforms = ['instagram', 'facebook', 'twitter', 'pinterest'];
  
  return platforms.map(platform => ({
    platform,
    username,
    available: Math.random() > 0.6,
    error: undefined
  }));
}