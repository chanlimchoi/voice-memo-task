'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveDateRef } = require('./dateResolver');

// Tuesday, 2026-09-15 — the exact date that exposed the "due Friday" bug
// in the hand-verified example (Claude said 2026-09-19, a Saturday).
const TUESDAY = new Date('2026-09-15T12:00:00Z');

test('weekday reference resolves to the correct upcoming date, not off-by-one', () => {
  assert.equal(resolveDateRef('friday', { now: TUESDAY }), '2026-09-18');
});

test('tomorrow resolves relative to the anchor date', () => {
  assert.equal(resolveDateRef('tomorrow', { now: TUESDAY }), '2026-09-16');
});

test('today and tonight both resolve to the anchor date', () => {
  assert.equal(resolveDateRef('today', { now: TUESDAY }), '2026-09-15');
  assert.equal(resolveDateRef('tonight', { now: TUESDAY }), '2026-09-15');
});

test('a weekday matching today resolves to today, not seven days out', () => {
  assert.equal(resolveDateRef('tuesday', { now: TUESDAY }), '2026-09-15');
});

test('vague timeframes resolve to null rather than a guessed date', () => {
  assert.equal(resolveDateRef('this week', { now: TUESDAY }), null);
  assert.equal(resolveDateRef('soon', { now: TUESDAY }), null);
});

test('no reference at all resolves to null', () => {
  assert.equal(resolveDateRef(null, { now: TUESDAY }), null);
  assert.equal(resolveDateRef(undefined, { now: TUESDAY }), null);
});
