'use strict';

// The LLM extracts *what was said*, never computes an actual calendar date.
// Weekday/relative-date arithmetic is deterministic and lives in
// dateResolver.js — see the "due Friday" bug this schema was changed to avoid.
const EXTRACTION_PROMPT = `You are extracting action items from a personal voice memo transcript.
The speaker was thinking out loud, not writing a formal list — extract
only things they clearly intend to DO, not things they merely mentioned.

Rules:
- Return up to 10 items. If there are more, keep the most concrete/actionable ones.
- Each item: { "task": string, "date_ref": string|null, "priority": "high"|null }
- date_ref is the RAW phrase the speaker used for timing ("tomorrow", "Friday",
  "the 20th", "tonight") — copy it verbatim, do not compute or normalize it
  yourself. Only extract a date_ref from a specific day reference. Vague
  timeframes ("this week," "soon," "eventually") are NOT a date_ref — leave null.
- Infer priority "high" only from explicit urgency language ("urgent," "ASAP,"
  "before I forget or it's a disaster") — default is null, not "normal."
- If nothing in the transcript is a clear action item, return an empty array.
  Do not force weak candidates into tasks.

Transcript:
"""
{transcript}
"""

Respond with only a JSON array, no prose.`;

module.exports = { EXTRACTION_PROMPT };
