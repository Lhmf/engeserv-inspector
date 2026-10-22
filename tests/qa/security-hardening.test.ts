import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..", "..");

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("security hardening", () => {
  it("seed endpoint no longer contains fixed known code or query-string auth", () => {
    const src = read("src/app/api/admin/seed/route.ts");
    assert.ok(!src.includes("KNOWN_PLAIN_CODE"), "known code constant must not exist");
    assert.ok(!src.includes('searchParams.get("code")'), "must not accept auth code via query string");
    assert.ok(!src.includes("LHMF1218ENGSERV2026"), "must not embed the default management code");
  });

  it("debug endpoints are disabled", () => {
    const a = read("src/app/api/debug/bcrypt-test/route.ts");
    const b = read("src/app/api/debug/bcrypt-test-v2/route.ts");
    assert.ok(a.includes('status: 404'), "bcrypt-test must return 404");
    assert.ok(b.includes('status: 404'), "bcrypt-test-v2 must return 404");
    assert.ok(!a.includes("managementCodePreview"), "bcrypt-test must not leak secrets");
    assert.ok(!b.includes("managementCodePreview"), "bcrypt-test-v2 must not leak secrets");
  });

  it("middleware does not expose debug endpoints publicly", () => {
    const src = read("src/middleware.ts");
    assert.ok(!src.includes("/api/debug/bcrypt-test-v2"), "debug endpoint must not be in PUBLIC_PATHS");
  });

  it("text templates writes are restricted for FUNCIONARIO", () => {
    const list = read("src/app/api/config/text-templates/route.ts");
    const item = read("src/app/api/config/text-templates/[id]/route.ts");
    for (const src of [list, item]) {
      assert.ok(src.includes('session.role === "FUNCIONARIO"'), "write routes must block FUNCIONARIO");
    }
  });
});
