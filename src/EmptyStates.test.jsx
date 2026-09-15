import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { EmptyFirstRun } from './EmptyFirstRun.jsx';
import { EmptyCleared } from './EmptyCleared.jsx';

describe('EmptyFirstRun vs EmptyCleared', () => {
  test('first-run reads as an invitation, not a completion', () => {
    render(<EmptyFirstRun />);
    expect(screen.getByText(/record your first memo/i)).toBeInTheDocument();
  });

  test('cleared reads as a completion, not an invitation, and uses distinct copy', () => {
    render(<EmptyCleared />);
    expect(screen.getByText(/all clear/i)).toBeInTheDocument();
    expect(screen.queryByText(/record your first memo/i)).not.toBeInTheDocument();
  });
});
