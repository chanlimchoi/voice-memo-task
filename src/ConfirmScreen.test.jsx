import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { ConfirmScreen } from './ConfirmScreen.jsx';

const TUESDAY = new Date('2026-09-15T12:00:00Z');
const extraction = [
  { task: 'Call the vet', date_ref: 'friday', priority: null },
  { task: 'Restock cat food', date_ref: null, priority: null },
];

describe('ConfirmScreen', () => {
  test('renders each extracted item, editable, with a resolved due-date tag', () => {
    render(<ConfirmScreen extraction={extraction} transcript="raw" now={TUESDAY} onConfirm={() => {}} />);
    expect(screen.getByDisplayValue('Call the vet')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Restock cat food')).toBeInTheDocument();
    expect(screen.getByText('2026-09-18')).toBeInTheDocument(); // resolved from date_ref, not LLM math
  });

  test('shows the raw-transcript fallback when extraction found nothing', () => {
    render(<ConfirmScreen extraction={[]} transcript="hello world, just rambling" now={TUESDAY} onConfirm={() => {}} />);
    expect(screen.getByText(/didn't catch a clear to-do/i)).toBeInTheDocument();
    expect(screen.getByText('hello world, just rambling')).toBeInTheDocument();
  });

  test('editing a task field updates only that item', async () => {
    const user = userEvent.setup();
    render(<ConfirmScreen extraction={extraction} transcript="raw" now={TUESDAY} onConfirm={() => {}} />);
    const input = screen.getByDisplayValue('Call the vet');
    await user.clear(input);
    await user.type(input, 'Call the vet about the checkup');
    expect(screen.getByDisplayValue('Call the vet about the checkup')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Restock cat food')).toBeInTheDocument();
  });

  test('"Not a task" hides the item and shows an undo toast, without switching to the empty-extraction fallback', async () => {
    const user = userEvent.setup();
    render(<ConfirmScreen extraction={extraction} transcript="raw" now={TUESDAY} onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /not a task: call the vet/i }));

    expect(screen.queryByDisplayValue('Call the vet')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Restock cat food')).toBeInTheDocument();
    expect(screen.queryByText(/didn't catch a clear to-do/i)).not.toBeInTheDocument();

    const toast = screen.getByRole('status');
    expect(within(toast).getByText(/removed/i)).toBeInTheDocument();
  });

  test('swiping every item away still does not show the extraction-empty fallback (regression)', async () => {
    const user = userEvent.setup();
    render(<ConfirmScreen extraction={extraction} transcript="raw" now={TUESDAY} onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /not a task: call the vet/i }));
    await user.click(screen.getByRole('button', { name: /not a task: restock cat food/i }));

    expect(screen.queryByText(/didn't catch a clear to-do/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  test('undo restores a swiped item and cancels its removal', async () => {
    const user = userEvent.setup();
    render(<ConfirmScreen extraction={extraction} transcript="raw" now={TUESDAY} onConfirm={() => {}} />);
    await user.click(screen.getByRole('button', { name: /not a task: call the vet/i }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));

    expect(screen.getByDisplayValue('Call the vet')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('confirm calls onConfirm with only the surviving items', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmScreen extraction={extraction} transcript="raw" now={TUESDAY} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /not a task: call the vet/i }));
    await user.click(screen.getByRole('button', { name: COPY_CONFIRM }));

    expect(onConfirm).toHaveBeenCalledWith([
      { task: 'Restock cat food', dateRef: null, dueDate: null, priority: null },
    ]);
  });
});

const COPY_CONFIRM = 'Looks good';
