import test from 'node:test';
import assert from 'node:assert/strict';
import { getPreferredRecordingMimeType } from './recordingMimeType.js';

test('prefers webm/opus when the browser supports it (Chrome/Firefox, iOS 18.4+)', () => {
  const isTypeSupported = (type) => type === 'audio/webm;codecs=opus';
  assert.equal(getPreferredRecordingMimeType(isTypeSupported), 'audio/webm;codecs=opus');
});

test('falls back to mp4 when webm/opus is unsupported (older iOS Safari)', () => {
  const isTypeSupported = (type) => type === 'audio/mp4';
  assert.equal(getPreferredRecordingMimeType(isTypeSupported), 'audio/mp4');
});

test('falls back to the MediaRecorder default when neither is supported, instead of forcing a bad type', () => {
  const isTypeSupported = () => false;
  assert.equal(getPreferredRecordingMimeType(isTypeSupported), undefined);
});

test('never picks mp4 over webm when both are supported', () => {
  const isTypeSupported = () => true;
  assert.equal(getPreferredRecordingMimeType(isTypeSupported), 'audio/webm;codecs=opus');
});
