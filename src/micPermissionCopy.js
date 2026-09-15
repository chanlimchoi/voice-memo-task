// Decides which mic-permission copy to show. Kept as a pure function,
// separate from the actual getUserMedia()/localStorage wiring (that lives in
// the recording component, #4) so the decision itself is unit-testable
// without a real browser/device.
//
// Cheap enough to bother with (Honey's question): the only extra state
// needed is one boolean — "has this device successfully granted mic access
// before" — persisted locally. No new permissions, no privacy surface
// beyond what recording already requires.
// platform-gated per Honey's catch: the re-prompt line names iOS
// specifically, so it must only show on iOS — it'd be false and
// confusing on Android/Windows, which don't share this quirk (unverified
// either way as of writing; treat as "no" until Pollen confirms otherwise,
// since a wrong platform-specific claim is worse than the generic fallback).
const PLATFORMS_WITH_REPROMPT_QUIRK = new Set(['ios']);

export function getMicPermissionCopy({ hasGrantedBefore, promptShownAgain, platform }) {
  // Re-prompted after a prior successful grant — the iOS PWA quirk Pollen
  // flagged, not a genuine first-time ask. Naming *why* (iOS's behavior)
  // keeps blame off the user and off us. Gated to platforms actually known
  // to have this quirk so it doesn't misfire elsewhere.
  if (hasGrantedBefore && promptShownAgain && PLATFORMS_WITH_REPROMPT_QUIRK.has(platform)) {
    return 'iOS asks for mic access each time you reopen this — one more tap and you’re set.';
  }

  // First-time ask, or we can't reliably tell the difference (e.g. the
  // Permissions API isn't available) — the safe, slightly less
  // reassuring generic fallback Honey specified for that case.
  return 'Need mic access to record — you can turn it on in Settings.';
}
