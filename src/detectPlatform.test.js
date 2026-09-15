import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform } from './detectPlatform.js';

const UA = {
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/128.0',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edg/128.0',
  linuxDesktop: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
};

test('detects iOS from iPhone and iPad user agents', () => {
  assert.equal(detectPlatform(UA.iosSafari), 'ios');
  assert.equal(detectPlatform(UA.ipad), 'ios');
});

test('detects Android', () => {
  assert.equal(detectPlatform(UA.androidChrome), 'android');
});

test('detects Windows', () => {
  assert.equal(detectPlatform(UA.windowsEdge), 'windows');
});

test('falls back to "other" for anything unrecognized', () => {
  assert.equal(detectPlatform(UA.linuxDesktop), 'other');
});
