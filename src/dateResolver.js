'use strict';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/**
 * Resolves a raw date reference phrase (as extracted by the LLM) into an ISO
 * date, anchored to `now`. The LLM never computes the date itself — it only
 * extracts the phrase — because model weekday arithmetic silently drifts
 * (see: "due Friday" on a Tuesday miscomputed as Saturday instead of Friday).
 *
 * Returns null for anything not confidently resolvable, rather than guessing.
 */
function resolveDateRef(dateRef, { now = new Date() } = {}) {
  if (!dateRef) return null;
  const phrase = dateRef.trim().toLowerCase();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (phrase === 'today' || phrase === 'tonight') {
    return toISODate(today);
  }
  if (phrase === 'tomorrow') {
    return toISODate(addDays(today, 1));
  }

  const weekdayIndex = WEEKDAYS.indexOf(phrase);
  if (weekdayIndex !== -1) {
    const currentIndex = today.getUTCDay();
    const diff = (weekdayIndex - currentIndex + 7) % 7;
    return toISODate(addDays(today, diff));
  }

  // Vague timeframes ("this week", "soon", "eventually") and anything else
  // unrecognized resolve to null on purpose — see prompt rule in
  // extractionPrompt.js. No silent invention of a date.
  return null;
}

module.exports = { resolveDateRef };
