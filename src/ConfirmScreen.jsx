import { useMemo, useRef, useState } from 'react';
import {
  buildConfirmState,
  editTask,
  markNotATask,
  undoNotATask,
  finalizeRemoval,
  confirm,
} from './confirmScreenState.js';
import { createUndoScheduler } from './undoScheduler.js';

// Copy per Honey's pass in the project thread — kept centralized so the
// tone stays consistent if it's reused elsewhere (e.g. a future settings
// screen preview).
const COPY = {
  header: "Here's what we heard",
  headerSubtext: "Tap anything to fix it before it's saved.",
  emptyFallback: "Didn't catch a clear to-do in this one — here's the transcript if you want to grab something yourself.",
  confirmButton: 'Looks good',
  removedToast: 'Removed',
  undoAction: 'Undo',
};

export function ConfirmScreen({ extraction, transcript, now, onConfirm }) {
  const [state, setState] = useState(() => buildConfirmState(extraction, { transcript, now }));
  const scheduler = useRef(
    createUndoScheduler({
      onFinalize: (id) => setState((current) => finalizeRemoval(current, id)),
    }),
  ).current;

  const pendingRemovalIds = useMemo(
    () => state.items.filter((item) => item.pendingRemoval).map((item) => item.id),
    [state.items],
  );

  // The raw-transcript fallback is for "extraction found nothing," not for
  // "the user swiped everything away" — those are different situations and
  // must not share a screen. extraction.length is fixed for the lifetime of
  // this memo, so it's the right thing to branch on, not the live item
  // count (which drops as the user swipes and would otherwise yank them
  // into the fallback screen mid-undo-window).
  if (extraction.length === 0) {
    return (
      <div className="confirm-screen confirm-screen--empty">
        <p>{COPY.emptyFallback}</p>
        <pre>{transcript}</pre>
      </div>
    );
  }

  function handleEdit(id, newTask) {
    setState((current) => editTask(current, id, newTask));
  }

  function handleNotATask(id) {
    setState((current) => markNotATask(current, id));
    scheduler.schedule(id);
  }

  function handleUndo(id) {
    scheduler.cancel(id);
    setState((current) => undoNotATask(current, id));
  }

  function handleConfirm() {
    onConfirm(confirm(state));
  }

  const visibleItems = state.items.filter((item) => !item.pendingRemoval);

  return (
    <div className="confirm-screen">
      <h1>{COPY.header}</h1>
      <p className="confirm-screen__subtext">{COPY.headerSubtext}</p>

      <ul className="confirm-screen__items">
        {visibleItems.map((item) => (
          <li key={item.id} className="confirm-item">
            <input
              className="confirm-item__task"
              value={item.task}
              onChange={(event) => handleEdit(item.id, event.target.value)}
              aria-label="Task"
            />
            {(item.dueDate || item.priority) && (
              <span className="confirm-item__tag">
                {item.dueDate ?? item.dateRef}
                {item.priority === 'high' && ' !'}
              </span>
            )}
            <button
              type="button"
              className="confirm-item__not-a-task"
              onClick={() => handleNotATask(item.id)}
              aria-label={`Not a task: ${item.task}`}
            >
              Not a task
            </button>
          </li>
        ))}
      </ul>

      {pendingRemovalIds.map((id) => (
        <div key={id} role="status" className="undo-toast">
          {COPY.removedToast} ·{' '}
          <button type="button" onClick={() => handleUndo(id)}>
            {COPY.undoAction}
          </button>
        </div>
      ))}

      <button type="button" className="confirm-screen__confirm" onClick={handleConfirm}>
        {COPY.confirmButton}
      </button>
    </div>
  );
}
