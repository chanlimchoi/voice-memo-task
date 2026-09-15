// Coarse platform detection for copy that must only apply on a specific
// platform (see micPermissionCopy.js) — not for feature-gating, just for
// picking the right words. Takes a userAgent string so it's testable without
// a real navigator; production usage defaults to the real one.
export function detectPlatform(userAgent = navigator.userAgent) {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  if (/Windows/i.test(userAgent)) return 'windows';
  return 'other';
}
