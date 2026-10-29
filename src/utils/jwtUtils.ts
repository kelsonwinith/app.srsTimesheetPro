export interface JwtInspectionResult {
  isValidJwt: boolean;
  aud?: string;
  scp?: string;
  roles?: string[];
  iss?: string;
  name?: string;
  preferred_username?: string;
  exp?: number;
  isExpired?: boolean;
  expiresAtFormatted?: string;
  tokenType: "KONG_BACKEND" | "MS_GRAPH" | "AZURE_ID_TOKEN" | "UNKNOWN";
  warning?: string;
}

export function inspectJwt(rawToken: string): JwtInspectionResult {
  const clean = rawToken.trim().replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "");
  const parts = clean.split(".");
  if (parts.length !== 3) {
    return {
      isValidJwt: false,
      tokenType: "UNKNOWN",
      warning: "Token must be a valid 3-part JWT (header.payload.signature)",
    };
  }

  try {
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));

    const aud = String(payload.aud || "").toLowerCase();
    const scp = String(payload.scp || "").toLowerCase();
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    const exp = Number(payload.exp || 0);
    const now = Math.floor(Date.now() / 1000);
    const isExpired = exp > 0 && exp < now;
    const expiresAtFormatted = exp > 0 ? new Date(exp * 1000).toLocaleTimeString() : undefined;

    let tokenType: JwtInspectionResult["tokenType"] = "UNKNOWN";
    let warning: string | undefined;

    if (aud.includes("00000003-0000-0000-c000") || (scp.includes("user.read") && !scp.includes("kong"))) {
      tokenType = "MS_GRAPH";
      warning = "This is a Microsoft Graph token ('user.read'). Kong Gateway requires the backend Kong token and will reject this with 'Invalid signature'.";
    } else if (scp.includes("kong") || aud.includes("d6a5eecc-b482-4539-a823-15867c6e8b3f")) {
      tokenType = "KONG_BACKEND";
      if (isExpired) {
        warning = `This Kong token expired at ${expiresAtFormatted}. Please refresh timesheet.sirisoft.co.th to renew it.`;
      }
    } else if (!scp && roles.length === 0 && payload.nonce) {
      tokenType = "AZURE_ID_TOKEN";
      warning = "This is an Azure AD ID token, not an API Access token. Kong Gateway requires the Access Token.";
    }

    return {
      isValidJwt: true,
      aud: payload.aud,
      scp: payload.scp,
      roles,
      iss: payload.iss,
      name: payload.name || payload.preferred_username,
      preferred_username: payload.preferred_username || payload.email || payload.upn,
      exp,
      isExpired,
      expiresAtFormatted,
      tokenType,
      warning,
    };
  } catch (err: any) {
    return {
      isValidJwt: false,
      tokenType: "UNKNOWN",
      warning: "Could not decode JWT: " + (err?.message || "Invalid structure"),
    };
  }
}
