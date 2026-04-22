import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from './Toast';

const Harness = () => {
  const {
    addToast,
    notifications,
    unreadCount,
    markNotificationsRead,
    clearNotifications
  } = useToast();

  return (
    <div>
      <button
        type="button"
        onClick={() => addToast({
          type: 'info',
          title: 'Saved',
          message: 'Trade saved',
          duration: 200
        })}
      >
        Add Toast
      </button>
      <button type="button" onClick={markNotificationsRead}>Mark Read</button>
      <button type="button" onClick={clearNotifications}>Clear</button>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="history-count">{notifications.length}</div>
      <div data-testid="history-status">
        {notifications.map((notification) => (
          <span key={notification.id}>
            {notification.title}:{notification.read ? 'read' : 'unread'}
          </span>
        ))}
      </div>
    </div>
  );
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('tracks unread notifications until they are marked read', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));

    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    expect(screen.getByTestId('history-status')).toHaveTextContent('Saved:unread');

    fireEvent.click(screen.getByText('Mark Read'));

    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('history-status')).toHaveTextContent('Saved:read');
  });

  it('suppresses duplicate notifications with the same content', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    fireEvent.click(screen.getByText('Add Toast'));

    expect(screen.getByTestId('history-count')).toHaveTextContent('1');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('clears the notification center and active toasts', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));
    fireEvent.click(screen.getByText('Clear'));

    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('history-count')).toHaveTextContent('0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('pauses toast dismissal while hovered', () => {
    render(
      <ToastProvider>
        <Harness />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Add Toast'));

    const alert = screen.getByRole('alert');
    fireEvent.mouseEnter(alert);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.mouseLeave(alert);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
