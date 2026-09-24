import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';

test('production HTML permits the hosted payment form without allowing third-party scripts', async () => {
  const previousApi = process.env.VITE_API_URL;
  const previousBase = process.env.VITE_BASE_PATH;
  process.env.VITE_API_URL = 'https://api.example.test/api';
  process.env.VITE_BASE_PATH = '/';
  try {
    const result = await build({ logLevel: 'silent', build: { write: false } });
    const outputs = Array.isArray(result) ? result : [result];
    const html = outputs
      .flatMap((output) => output.output)
      .find((file) => file.fileName === 'index.html');
    assert.ok(html);
    const policy = String(html.source).match(
      /http-equiv="Content-Security-Policy" content="([^"]+)"/,
    )?.[1];
    assert.ok(policy);
    const directives = Object.fromEntries(
      policy.split(';').map((part) => {
        const [name, ...values] = part.trim().split(/\s+/);
        return [name, values];
      }),
    );
    assert.deepEqual(directives['form-action'], ["'self'", 'https://auth.robokassa.ru']);
    assert.deepEqual(directives['script-src'], ["'self'"]);
    assert.deepEqual(directives['connect-src'], ["'self'", 'https://api.example.test']);
  } finally {
    if (previousApi === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = previousApi;
    if (previousBase === undefined) delete process.env.VITE_BASE_PATH;
    else process.env.VITE_BASE_PATH = previousBase;
  }
});
