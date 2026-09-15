import { useRef, useState } from 'react';
import { getPreferredRecordingMimeType } from './recordingMimeType.js';
import { getMicPermissionCopy } from './micPermissionCopy.js';
import { detectPlatform } from './detectPlatform.js';

const GRANTED_BEFORE_KEY = 'blurt:mic-granted-before';

/**
 * Tap-and-hold record button. Dependencies (mediaDevices, MediaRecorderImpl,
 * storage) are injectable so this is testable in jsdom without a real mic —
 * production usage lets them default to the real browser APIs.
 */
export function RecordButton({
  onRecorded,
  mediaDevices = navigator.mediaDevices,
  MediaRecorderImpl = MediaRecorder,
  storage = window.localStorage,
  platform = detectPlatform(),
}) {
  const [state, setState] = useState('idle'); // idle | recording | permission-denied | silence
  const [permissionCopy, setPermissionCopy] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  async function start() {
    const hasGrantedBefore = storage.getItem(GRANTED_BEFORE_KEY) === 'true';
    try {
      const stream = await mediaDevices.getUserMedia({ audio: true });
      storage.setItem(GRANTED_BEFORE_KEY, 'true');
      streamRef.current = stream;

      const mimeType = getPreferredRecordingMimeType((type) => MediaRecorderImpl.isTypeSupported(type));
      const recorder = new MediaRecorderImpl(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        // Distinct from a Whisper/network failure (that's "we couldn't send
        // it"); this is "the mic worked but nothing came through" —
        // they shouldn't share copy even though both are short dead-ends.
        if (blob.size === 0) {
          setState('silence');
          return;
        }
        onRecorded(blob);
        setState('idle');
      };

      recorder.start();
      recorderRef.current = recorder;
      setState('recording');
    } catch {
      // getUserMedia rejecting is the only signal available here — can't
      // distinguish "denied" from "no mic present" from the error alone,
      // so this is necessarily the generic permission path.
      setPermissionCopy(getMicPermissionCopy({ hasGrantedBefore, promptShownAgain: true, platform }));
      setState('permission-denied');
    }
  }

  function stop() {
    // Don't setState('idle') here — recorder.onstop (fired by the line
    // below) decides the real final state ('idle' via onRecorded, or
    // 'silence'). Setting it here too would race onstop and, on a
    // synchronous stop() implementation, overwrite 'silence' right back to
    // 'idle' before it ever rendered.
    recorderRef.current?.stop();
  }

  if (state === 'permission-denied') {
    return (
      <div className="record-button record-button--permission-denied">
        <p>{permissionCopy}</p>
        <button type="button" onClick={start}>
          Try again
        </button>
      </div>
    );
  }

  if (state === 'silence') {
    return (
      <div className="record-button record-button--silence">
        <p>Didn’t catch anything that time — try again?</p>
        <button type="button" onClick={start}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="record-button"
      aria-pressed={state === 'recording'}
      onPointerDown={start}
      onPointerUp={stop}
    >
      {state === 'recording' ? 'Listening…' : 'Hold to blurt'}
    </button>
  );
}
