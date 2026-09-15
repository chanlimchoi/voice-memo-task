import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { RecordButton } from './RecordButton.jsx';

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
  };
}

class FakeMediaRecorder {
  static isTypeSupported(type) {
    return type === 'audio/webm;codecs=opus';
  }

  constructor(stream, options) {
    this.stream = stream;
    this.options = options;
  }

  start() {}

  stop() {
    this.ondataavailable?.({ data: new Blob(['chunk']) });
    this.onstop?.();
  }
}

// Recorder that produces zero data — mic worked, nothing came through.
class SilentFakeMediaRecorder extends FakeMediaRecorder {
  stop() {
    this.ondataavailable?.({ data: new Blob([]) });
    this.onstop?.();
  }
}

function fakeMediaDevices({ shouldGrant = true } = {}) {
  return {
    getUserMedia: vi.fn(() =>
      shouldGrant
        ? Promise.resolve({ getTracks: () => [{ stop: vi.fn() }] })
        : Promise.reject(new Error('Permission denied')),
    ),
  };
}

describe('RecordButton', () => {
  test('press-and-hold records and calls onRecorded with the resulting blob', async () => {
    const user = userEvent.setup();
    const onRecorded = vi.fn();
    const mediaDevices = fakeMediaDevices();
    render(
      <RecordButton
        onRecorded={onRecorded}
        mediaDevices={mediaDevices}
        MediaRecorderImpl={FakeMediaRecorder}
        storage={fakeStorage()}
      />,
    );

    const button = screen.getByRole('button', { name: /hold to blurt/i });
    await user.pointer([{ target: button, keys: '[MouseLeft>]' }]);
    expect(await screen.findByText(/listening/i)).toBeInTheDocument();

    await user.pointer([{ target: button, keys: '[/MouseLeft]' }]);
    expect(onRecorded).toHaveBeenCalledWith(expect.any(Blob));
  });

  test('marks the mic as granted-before in storage on a successful recording', async () => {
    const user = userEvent.setup();
    const storage = fakeStorage();
    render(
      <RecordButton
        onRecorded={() => {}}
        mediaDevices={fakeMediaDevices()}
        MediaRecorderImpl={FakeMediaRecorder}
        storage={storage}
      />,
    );
    await user.pointer([{ target: screen.getByRole('button'), keys: '[MouseLeft>]' }]);
    expect(storage.getItem('blurt:mic-granted-before')).toBe('true');
  });

  test('shows permission-denied copy and a retry when getUserMedia rejects', async () => {
    const user = userEvent.setup();
    render(
      <RecordButton
        onRecorded={() => {}}
        mediaDevices={fakeMediaDevices({ shouldGrant: false })}
        MediaRecorderImpl={FakeMediaRecorder}
        storage={fakeStorage()}
      />,
    );
    await user.click(screen.getByRole('button'));
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  test('a prior successful grant surfaces the iOS re-prompt copy on a later denial', async () => {
    const user = userEvent.setup();
    const storage = fakeStorage();
    storage.setItem('blurt:mic-granted-before', 'true');
    render(
      <RecordButton
        onRecorded={() => {}}
        mediaDevices={fakeMediaDevices({ shouldGrant: false })}
        MediaRecorderImpl={FakeMediaRecorder}
        storage={storage}
      />,
    );
    await user.click(screen.getByRole('button'));
    expect(await screen.findByText(/ios asks for mic access each time/i)).toBeInTheDocument();
  });

  test('a zero-length recording shows the silence copy, distinct from permission-denied, and does not call onRecorded', async () => {
    const user = userEvent.setup();
    const onRecorded = vi.fn();
    render(
      <RecordButton
        onRecorded={onRecorded}
        mediaDevices={fakeMediaDevices()}
        MediaRecorderImpl={SilentFakeMediaRecorder}
        storage={fakeStorage()}
      />,
    );
    const button = screen.getByRole('button', { name: /hold to blurt/i });
    await user.pointer([{ target: button, keys: '[MouseLeft>]' }]);
    await user.pointer([{ target: button, keys: '[/MouseLeft]' }]);

    expect(await screen.findByText(/didn.t catch anything that time/i)).toBeInTheDocument();
    expect(onRecorded).not.toHaveBeenCalled();
  });

  test('"Try again" from the silence state lets the user record again', async () => {
    const user = userEvent.setup();
    const onRecorded = vi.fn();
    render(
      <RecordButton
        onRecorded={onRecorded}
        mediaDevices={fakeMediaDevices()}
        MediaRecorderImpl={SilentFakeMediaRecorder}
        storage={fakeStorage()}
      />,
    );
    const button = screen.getByRole('button', { name: /hold to blurt/i });
    await user.pointer([{ target: button, keys: '[MouseLeft>]' }]);
    await user.pointer([{ target: button, keys: '[/MouseLeft]' }]);
    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/listening/i)).toBeInTheDocument();
  });
});
