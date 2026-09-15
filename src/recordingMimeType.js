// iOS Safari's MediaRecorder only produces audio/mp4 (AAC) pre-18.4, which
// has documented Whisper mis-transcription/cutoff issues; Chrome/Firefox's
// audio/webm;codecs=opus doesn't have that problem and iOS 18.4+ supports it
// too. So: prefer webm/opus whenever the browser actually supports it, and
// only fall back to mp4 when it doesn't — never hardcode one format.
//
// Pure/injectable so this is testable without a real MediaRecorder; the
// actual recording component (#4) just calls this with
// MediaRecorder.isTypeSupported.
const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4'];

export function getPreferredRecordingMimeType(isTypeSupported) {
  for (const mimeType of PREFERRED_MIME_TYPES) {
    if (isTypeSupported(mimeType)) return mimeType;
  }
  // Neither preferred type is supported — let MediaRecorder use its own
  // default rather than forcing an unsupported type and failing outright.
  return undefined;
}
