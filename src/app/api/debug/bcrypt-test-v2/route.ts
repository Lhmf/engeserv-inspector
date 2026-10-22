import { NextResponse } from "next/server";

// Debug endpoint intentionally disabled in all environments.
// It previously leaked MANAGEMENT_CODE details and must not be exposed.
export async function GET() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}