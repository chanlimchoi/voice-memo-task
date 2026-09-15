'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createUndoScheduler } = require('./undoScheduler');

test('fires onFinalize for an id once its delay elapses', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const finalized = [];
  const scheduler = createUndoScheduler({ onFinalize: (id) => finalized.push(id), delayMs: 6000 });

  scheduler.schedule('item-0');
  t.mock.timers.tick(5999);
  assert.deepEqual(finalized, [], 'must not finalize before the window elapses');

  t.mock.timers.tick(1);
  assert.deepEqual(finalized, ['item-0']);
});

test('cancel prevents onFinalize from firing (the undo action)', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const finalized = [];
  const scheduler = createUndoScheduler({ onFinalize: (id) => finalized.push(id), delayMs: 6000 });

  scheduler.schedule('item-0');
  scheduler.cancel('item-0');
  t.mock.timers.tick(10000);
  assert.deepEqual(finalized, [], 'cancelled timer must never finalize');
});

test('each id has its own independent window — one finalizing does not affect another', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const finalized = [];
  const scheduler = createUndoScheduler({ onFinalize: (id) => finalized.push(id), delayMs: 6000 });

  scheduler.schedule('item-0');
  t.mock.timers.tick(3000);
  scheduler.schedule('item-1'); // swiped 3s later
  t.mock.timers.tick(3000); // item-0 hits 6s, item-1 only hits 3s
  assert.deepEqual(finalized, ['item-0']);

  t.mock.timers.tick(3000); // item-1 now hits its own 6s
  assert.deepEqual(finalized, ['item-0', 'item-1']);
});

test('re-swiping the same item resets its window instead of stacking timers', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const finalized = [];
  const scheduler = createUndoScheduler({ onFinalize: (id) => finalized.push(id), delayMs: 6000 });

  scheduler.schedule('item-0');
  t.mock.timers.tick(5000);
  scheduler.schedule('item-0'); // undone and re-swiped before the first timer fired
  t.mock.timers.tick(5000); // 10s total, but only 5s since the reset
  assert.deepEqual(finalized, [], 'the reset window should not have elapsed yet');

  t.mock.timers.tick(1000);
  assert.deepEqual(finalized, ['item-0'], 'and it should fire exactly once, not twice');
});
