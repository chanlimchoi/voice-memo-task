// 6s: between Pollen's WhatsApp-delete precedent (5s) and Honey's note that
// an actionable task warrants a touch more room than a plain message delete.
export const DEFAULT_DELAY_MS = 6000;

/**
 * Tracks one undo-window timer per swiped item, independent of React so it
 * can be unit tested without a DOM. `onFinalize(id)` fires once per id, only
 * if that id's timer isn't cancelled first via cancel(id).
 */
export function createUndoScheduler({ onFinalize, delayMs = DEFAULT_DELAY_MS, setTimeoutFn = setTimeout, clearTimeoutFn = clearTimeout }) {
  const timers = new Map();

  function schedule(id) {
    cancel(id); // re-swiping the same item resets its own window, doesn't stack
    const handle = setTimeoutFn(() => {
      timers.delete(id);
      onFinalize(id);
    }, delayMs);
    timers.set(id, handle);
  }

  function cancel(id) {
    const handle = timers.get(id);
    if (handle !== undefined) {
      clearTimeoutFn(handle);
      timers.delete(id);
    }
  }

  function cancelAll() {
    for (const id of timers.keys()) cancel(id);
  }

  return { schedule, cancel, cancelAll };
}
