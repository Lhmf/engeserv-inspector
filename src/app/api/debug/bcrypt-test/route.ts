import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Endpoint removido" }, { status: 410 });
}
