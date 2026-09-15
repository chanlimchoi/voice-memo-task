// Distinct component from EmptyFirstRun on purpose (see that file's comment)
// — a "success empty" after finishing tasks reads differently than a
// first-run invitation, even though both show an empty list.
export function EmptyCleared() {
  return (
    <div className="empty-state empty-state--cleared">
      <p>All clear. Nice work — ready for the next ramble whenever you are.</p>
    </div>
  );
}
