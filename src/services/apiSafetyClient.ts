/**
 * API Safety Client & Boundary Guard
 * 
 * STRICT CONSTRAINT ENFORCEMENT:
 * - Only GET (Read) requests are permitted to the backend.
 * - Under NO circumstances will POST, PUT, DELETE, PATCH be dispatched to backend.
 * - Any mutation attempt is immediately blocked with a hard error and logged in the audit trail.
 */

export interface SafetyAuditLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: "ALLOWED_GET" | "BLOCKED_MUTATION";
  reason: string;
}

const AUDIT_LOGS_KEY = "sirisoft_safety_audit_logs";
const AUTH_TOKEN_KEY = "sirisoft_real_bearer_token";
const EMPLOYEE_ID_KEY = "sirisoft_real_employee_id";
const USER_PROFILE_KEY = "sirisoft_real_user_profile";

export function getStoredApiCredentials() {
  if (typeof window === "undefined") return { token: "", employeeId: "" };
  try {
    return {
      token: localStorage.getItem(AUTH_TOKEN_KEY) || "",
      employeeId: localStorage.getItem(EMPLOYEE_ID_KEY) || "",
    };
  } catch {
    return { token: "", employeeId: "" };
  }
}

export function saveStoredApiCredentials(token: string, employeeId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(EMPLOYEE_ID_KEY, employeeId);
  } catch (err) {
    console.error("Failed to save credentials", err);
  }
}

export function getStoredUserProfile(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUserProfile(profile: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save user profile", err);
  }
}

export function getAuditLogs(): SafetyAuditLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendAuditLog(log: Omit<SafetyAuditLog, "id" | "timestamp">) {
  if (typeof window === "undefined") return;
  try {
    const logs = getAuditLogs();
    const newLog: SafetyAuditLog = {
      ...log,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}

/**
 * Proxy fetch client: uses internal /api/proxy to forward GET requests safely
 */
export async function safeFetchBackend<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string,
  employeeId?: number | string
): Promise<{ success: boolean; data?: T; error?: string; blocked?: boolean; status?: number }> {
  const method = (options.method || "GET").toUpperCase();

  // STRICT GUARANTEE: Block any mutation method
  if (method !== "GET" && method !== "HEAD") {
    const blockMessage = `[SAFETY INTERCEPT] Method '${method}' to '${endpoint}' is strictly blocked. Only HTTP GET (Read) operations are permitted to the backend.`;
    console.warn(blockMessage);

    appendAuditLog({
      method,
      url: endpoint,
      status: "BLOCKED_MUTATION",
      reason: "Blocked by read-only security constraint (CRUD disallowed, only R permitted)",
    });

    return {
      success: false,
      blocked: true,
      error: blockMessage,
    };
  }

  // Strip leading slash if any
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
  const proxyUrl = `/api/proxy/${cleanEndpoint}`;

  appendAuditLog({
    method: "GET",
    url: endpoint,
    status: "ALLOWED_GET",
    reason: "Safe read-only fetch forwarded through Next.js proxy",
  });

  try {
    const creds = getStoredApiCredentials();
    const activeToken = token || creds.token;
    const activeEmpId = employeeId || creds.employeeId;

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      ...(options.headers as Record<string, string> || {}),
    };

    if (activeToken) {
      const cleanToken = activeToken.trim().replace(/^"|"$/g, "").replace(/^Bearer\s+/i, "");
      headers["Authorization"] = `Bearer ${cleanToken}`;
    }
    if (activeEmpId) {
      headers["Employee-Id"] = String(activeEmpId);
    }

    const response = await fetch(proxyUrl, {
      method: "GET",
      headers,
    });

    const json = await response.json();

    if (!response.ok || !json.ok) {
      return {
        success: false,
        status: response.status,
        error: json.data?.message || json.error || `HTTP ${response.status}`,
        data: json.data,
      };
    }

    return {
      success: true,
      status: response.status,
      data: json.data?.data || json.data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return {
      success: false,
      error: msg,
    };
  }
}
