import test from 'node:test';
import assert from 'node:assert/strict';
import { clearRateLimit, getRequestIp, isRateLimited, registerFailure } from '@/lib/rate-limit';

test('rate limit bloqueia após cinco falhas e pode ser limpo após autenticação', () => {
  const key = `qa-${Date.now()}-${Math.random()}`;
  try {
    for (let attempt = 1; attempt < 5; attempt += 1) assert.equal(registerFailure(key), false);
    assert.equal(registerFailure(key), true);
    assert.equal(isRateLimited(key), true);
  } finally {
    clearRateLimit(key);
  }
  assert.equal(isRateLimited(key), false);
});

test('IP usa o primeiro valor de x-forwarded-for e tem fallback seguro', () => {
  assert.equal(getRequestIp(new Request('http://localhost', { headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' } })), '203.0.113.10');
  assert.equal(getRequestIp(new Request('http://localhost')), 'unknown');
});
