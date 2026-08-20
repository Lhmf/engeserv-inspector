import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const MANAGEMENT_CODE = process.env.MANAGEMENT_CODE;
  const providedCode = "LHMF1218ENGSERV2026";
  
  let bcryptResult = false;
  let directCompare = false;
  let error = null;
  let bcryptError = null;
  
  try {
    bcryptResult = await bcrypt.compare(providedCode, MANAGEMENT_CODE || "");
  } catch (e: any) {
    bcryptError = e.message;
  }
  
  directCompare = providedCode === MANAGEMENT_CODE;
  
  // Also test if the provided code matches a known bcrypt hash
  let testBcrypt = false;
  try {
    // Test with a known hash for "LHMF1218ENGSERV2026"
    const knownHash = "$2a$10$"; // placeholder
    testBcrypt = await bcrypt.compare("LHMF1218ENGSERV2026", "$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqaG3vv1BD7WC"); // example
  } catch (e: any) {
    // ignore
  }
  
  return NextResponse.json({
    hasManagementCode: !!MANAGEMENT_CODE,
    managementCodeLength: MANAGEMENT_CODE?.length,
    managementCodePreview: MANAGEMENT_CODE?.substring(0, 60),
    providedCode,
    providedCodeLength: providedCode.length,
    bcryptResult,
    directCompare,
    bcryptError,
    testBcrypt,
    managementCodeIsHash: MANAGEMENT_CODE?.startsWith("$2") || MANAGEMENT_CODE?.startsWith("$2a") || MANAGEMENT_CODE?.startsWith("$2b"),
  });
}