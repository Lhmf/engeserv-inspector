import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Rota removida" }, { status: 410 });
}