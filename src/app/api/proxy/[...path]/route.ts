import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = "https://backend.timesheet.sirisoft.co.th/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_BASE}/${pathString}${searchParams ? `?${searchParams}` : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json; charset=utf-8",
      "Origin": "https://timesheet.sirisoft.co.th",
      "Referer": "https://timesheet.sirisoft.co.th/",
    };

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const employeeIdHeader = request.headers.get("employee-id");
    if (employeeIdHeader) {
      headers["Employee-Id"] = employeeIdHeader;
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      headers,
    });

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return NextResponse.json(
      {
        status: response.status,
        ok: response.ok,
        data,
      },
      { status: response.status }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Proxy fetch error";
    return NextResponse.json(
      { status: 500, ok: false, error: msg },
      { status: 500 }
    );
  }
}

/**
 * STRICT SAFETY ENFORCEMENT:
 * Block any mutating HTTP method to the backend proxy!
 */
export async function POST() {
  return NextResponse.json(
    {
      status: 403,
      ok: false,
      error: "SAFETY BLOCK: Only HTTP GET (Read) operations are permitted to the backend. POST is strictly blocked by safety policy.",
    },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      status: 403,
      ok: false,
      error: "SAFETY BLOCK: Only HTTP GET (Read) operations are permitted to the backend. PUT is strictly blocked by safety policy.",
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      status: 403,
      ok: false,
      error: "SAFETY BLOCK: Only HTTP GET (Read) operations are permitted to the backend. DELETE is strictly blocked by safety policy.",
    },
    { status: 403 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      status: 403,
      ok: false,
      error: "SAFETY BLOCK: Only HTTP GET (Read) operations are permitted to the backend. PATCH is strictly blocked by safety policy.",
    },
    { status: 403 }
  );
}
