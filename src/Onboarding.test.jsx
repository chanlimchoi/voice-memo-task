import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { Onboarding } from './Onboarding.jsx';

describe('Onboarding', () => {
  test('shows the first beat, then advances through all three on Next', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<Onboarding onDone={onDone} />);

    expect(screen.getByText(/blurt it out/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/nothing saves until you say so/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/ready when you are/i)).toBeInTheDocument();

    expect(onDone).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Get started' }));
    expect(onDone).toHaveBeenCalledOnce();
  });

  test('Skip calls onDone immediately from any beat', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<Onboarding onDone={onDone} />);
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
