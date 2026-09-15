import { useState } from 'react';

// Copy per Honey's pass — 3 short beats, skippable, straight to the record
// button after, no tour beyond this.
const BEATS = [
  'Blurt it out. We’ll listen for the to-dos.',
  'Nothing saves until you say so — review first.',
  'Ready when you are.',
];

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);

  function next() {
    if (step + 1 >= BEATS.length) {
      onDone();
    } else {
      setStep(step + 1);
    }
  }

  return (
    <div className="onboarding">
      <p>{BEATS[step]}</p>
      <button type="button" onClick={next}>
        {step + 1 >= BEATS.length ? 'Get started' : 'Next'}
      </button>
      <button type="button" className="onboarding__skip" onClick={onDone}>
        Skip
      </button>
    </div>
  );
}
