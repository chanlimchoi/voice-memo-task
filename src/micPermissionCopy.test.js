import test from 'node:test';
import assert from 'node:assert/strict';
import { getMicPermissionCopy } from './micPermissionCopy.js';

test('genuine first-time ask gets the generic copy', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: false, promptShownAgain: true });
  assert.match(copy, /turn it on in settings/i);
});

test('re-prompted after a prior grant gets the iOS-specific copy, naming the platform not the user', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: true });
  assert.match(copy, /ios asks for mic access each time/i);
});

test('previously granted but not currently re-prompting (e.g. still mid-session) falls back to generic', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: false });
  assert.match(copy, /turn it on in settings/i);
});

test('undetectable state (Permissions API unavailable) falls back to generic, not a crash', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: undefined, promptShownAgain: undefined });
  assert.match(copy, /turn it on in settings/i);
});
