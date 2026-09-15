import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConfirmState,
  isConfirmStateEmpty,
  editTask,
  markNotATask,
  undoNotATask,
  finalizeRemovals,
  finalizeRemoval,
  confirm,
} from './confirmScreenState.js';

const TUESDAY = new Date('2026-09-15T12:00:00Z');
const extracted = [
  { task: 'Call the vet', date_ref: 'friday', priority: null },
  { task: 'Restock cat food', date_ref: null, priority: null },
];

test('buildConfirmState resolves due dates via the deterministic resolver', () => {
  const state = buildConfirmState(extracted, { transcript: 'raw', now: TUESDAY });
  assert.equal(state.items[0].dueDate, '2026-09-18');
  assert.equal(state.items[1].dueDate, null);
  assert.equal(isConfirmStateEmpty(state), false);
});

test('editTask updates only the targeted item', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const edited = editTask(state, 'item-0', 'Call the vet about the checkup');
  assert.equal(edited.items[0].task, 'Call the vet about the checkup');
  assert.equal(edited.items[1].task, 'Restock cat food');
});

test('markNotATask flags for removal without dropping the item (undo window)', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const swiped = markNotATask(state, 'item-0');
  assert.equal(swiped.items.length, 2, 'item must still exist so it can be undone');
  assert.equal(swiped.items[0].pendingRemoval, true);
});

test('undoNotATask reverses a pending removal', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const swiped = markNotATask(state, 'item-0');
  const restored = undoNotATask(swiped, 'item-0');
  assert.equal(restored.items[0].pendingRemoval, false);
});

test('isConfirmStateEmpty treats an all-swiped-but-undoable list as empty', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const allSwiped = markNotATask(markNotATask(state, 'item-0'), 'item-1');
  assert.equal(isConfirmStateEmpty(allSwiped), true);
});

test('finalizeRemovals actually drops pending items', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const swiped = markNotATask(state, 'item-0');
  const finalized = finalizeRemovals(swiped);
  assert.equal(finalized.items.length, 1);
  assert.equal(finalized.items[0].task, 'Restock cat food');
});

test('finalizeRemoval drops only its own id, not other pending items still in their undo window', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const bothSwiped = markNotATask(markNotATask(state, 'item-0'), 'item-1');
  const afterOneTimerFires = finalizeRemoval(bothSwiped, 'item-0');
  assert.equal(afterOneTimerFires.items.length, 1);
  assert.equal(afterOneTimerFires.items[0].task, 'Restock cat food');
  assert.equal(afterOneTimerFires.items[0].pendingRemoval, true, 'still awaiting its own timer');
});

test('confirm returns only surviving items, without internal id/pendingRemoval fields', () => {
  const state = buildConfirmState(extracted, { now: TUESDAY });
  const swiped = markNotATask(state, 'item-0');
  const saved = confirm(swiped);
  assert.deepEqual(saved, [
    { task: 'Restock cat food', dateRef: null, dueDate: null, priority: null },
  ]);
});
