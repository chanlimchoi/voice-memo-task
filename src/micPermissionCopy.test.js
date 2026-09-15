import test from 'node:test';
import assert from 'node:assert/strict';
import { getMicPermissionCopy } from './micPermissionCopy.js';

test('genuine first-time ask gets the generic copy', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: false, promptShownAgain: true, platform: 'ios' });
  assert.match(copy, /turn it on in settings/i);
});

test('re-prompted after a prior grant on iOS gets the iOS-specific copy, naming the platform not the user', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: true, platform: 'ios' });
  assert.match(copy, /ios asks for mic access each time/i);
});

test('previously granted but not currently re-prompting (e.g. still mid-session) falls back to generic', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: false, platform: 'ios' });
  assert.match(copy, /turn it on in settings/i);
});

test('undetectable state (Permissions API unavailable) falls back to generic, not a crash', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: undefined, promptShownAgain: undefined, platform: undefined });
  assert.match(copy, /turn it on in settings/i);
});

// Honey's catch: the iOS-specific line must not misfire on platforms that
// don't share that quirk (unconfirmed for Android/Windows as of writing).
test('the same re-prompt scenario on Android or Windows falls back to generic, not the iOS-specific line', () => {
  assert.match(
    getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: true, platform: 'android' }),
    /turn it on in settings/i,
  );
  assert.match(
    getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: true, platform: 'windows' }),
    /turn it on in settings/i,
  );
});

test('an unspecified platform never gets the iOS-specific line, even with matching grant/re-prompt flags', () => {
  const copy = getMicPermissionCopy({ hasGrantedBefore: true, promptShownAgain: true, platform: undefined });
  assert.match(copy, /turn it on in settings/i);
});
