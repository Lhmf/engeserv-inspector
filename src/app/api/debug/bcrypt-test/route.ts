import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE;
  const providedCode = "LHMF1218ENGSERV2026";
  
  let bcryptResult = false;
  let directCompare = false;
  let error = null;
  
  try {
    bcryptResult = await bcrypt.compare(providedCode, MANAGEMENT_CODE || "");
  } catch (e: any) {
    error = e.message;
  }
  
  directCompare = providedCode === MANAGEMENT_CODE;
  
  return NextResponse.json({
    hasManagementCode: !!MANAGEMENT_CODE,
    managementCodeLength: MANAGEMENT_CODE?.length,
    managementCodePreview: MANAGEMENT_CODE?.substring(0, 30),
    providedCode,
    bcryptResult,
    directCompare,
    error
  });
}