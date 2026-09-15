'use strict';

const { resolveDateRef } = require('./dateResolver');

/**
 * Builds the Confirm screen's initial state from extraction output.
 * Nothing here mutates in place — every action returns a new state so the
 * screen can safely re-render off it.
 */
function buildConfirmState(extractedItems, { transcript, now } = {}) {
  const items = extractedItems.map((item, index) => ({
    id: `item-${index}`,
    task: item.task,
    dateRef: item.date_ref ?? null,
    dueDate: resolveDateRef(item.date_ref, { now }),
    priority: item.priority ?? null,
    pendingRemoval: false,
  }));

  return { items, transcript };
}

// Empty state reflects what's visible/recoverable, not raw item count — a
// fully-swiped-but-still-undoable list should still read as "has items".
// Deliberately a function, not a stored/derived field on state: state gets
// spread-copied on every action, and a getter wouldn't survive that spread.
function isConfirmStateEmpty(state) {
  return state.items.every((item) => item.pendingRemoval);
}

function editTask(state, id, newTask) {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, task: newTask } : item)),
  };
}

// "Not a task" (swipe-to-delete) — named per Honey's copy pass, not "delete",
// since it also signals over-extraction back to us, not just removal intent.
// Doesn't remove the item outright: flags it pendingRemoval so the UI can
// show an undo toast (per Pollen's catch — a fat-fingered swipe shouldn't be
// able to silently drop a real task, that's a worse trust break than the
// zero-item fallback we already handle carefully).
function markNotATask(state, id) {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, pendingRemoval: true } : item)),
  };
}

function undoNotATask(state, id) {
  return {
    ...state,
    items: state.items.map((item) => (item.id === id ? { ...item, pendingRemoval: false } : item)),
  };
}

// Actually drops pendingRemoval items — called right before confirm() so
// nothing half-removed saves.
function finalizeRemovals(state) {
  return { ...state, items: state.items.filter((item) => !item.pendingRemoval) };
}

// Drops a single pendingRemoval item once *its own* undo toast window
// elapses. Deliberately scoped to one id rather than reusing
// finalizeRemovals(): with multiple swipes in flight, one item's timer
// firing must not sweep away other items still inside their own undo window.
function finalizeRemoval(state, id) {
  return { ...state, items: state.items.filter((item) => item.id !== id || !item.pendingRemoval) };
}

// What actually gets saved once the user taps "Looks good".
function confirm(state) {
  return finalizeRemovals(state).items.map(({ id, pendingRemoval, ...rest }) => rest);
}

module.exports = {
  buildConfirmState,
  isConfirmStateEmpty,
  editTask,
  markNotATask,
  undoNotATask,
  finalizeRemovals,
  finalizeRemoval,
  confirm,
};
