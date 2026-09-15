// Named distinctly from EmptyCleared per Honey's note: these read similarly
// (both "no visible tasks") but are different UX moments — this one is an
// invitation, not a win.
export function EmptyFirstRun() {
  return (
    <div className="empty-state empty-state--first-run">
      <p>Nothing here yet — record your first memo and we’ll turn the ramble into a list.</p>
    </div>
  );
}
