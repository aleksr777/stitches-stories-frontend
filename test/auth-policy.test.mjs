import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isSessionInvalidStatus,
  shouldRefreshAfterResponse,
} from '../src/shared/api/auth-policy.mjs';

test('revoked and forbidden sessions invalidate local auth', () => {
  assert.equal(isSessionInvalidStatus(401), true);
  assert.equal(isSessionInvalidStatus(403), true);
  assert.equal(isSessionInvalidStatus(408), false);
  assert.equal(isSessionInvalidStatus(500), false);
});

test('an access request retries refresh only once after 401', () => {
  assert.equal(shouldRefreshAfterResponse({ status: 401, auth: 'access', retry: true }), true);
  assert.equal(shouldRefreshAfterResponse({ status: 401, auth: 'access', retry: false }), false);
});

test('public requests and non-401 responses do not trigger refresh', () => {
  assert.equal(shouldRefreshAfterResponse({ status: 401, auth: 'none', retry: true }), false);
  assert.equal(shouldRefreshAfterResponse({ status: 403, auth: 'access', retry: true }), false);
  assert.equal(shouldRefreshAfterResponse({ status: 500, auth: 'access', retry: true }), false);
});
