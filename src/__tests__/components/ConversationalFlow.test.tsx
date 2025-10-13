import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConversationalFlow, { Message } from '@/components/ConversationalFlow';

describe('ConversationalFlow Component', () => {
  const mockOnComplete = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ConversationalFlow />);
    expect(screen.getByPlaceholderText('Type your response here...')).toBeInTheDocument();
  });

  it('displays initial welcome message', () => {
    render(<ConversationalFlow />);
    expect(screen.getByText(/Welcome to the GenAI Idea Assistant/i)).toBeInTheDocument();
  });

  it('shows typing indicator when processing', async () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    // Should show typing indicator briefly
    await waitFor(() => {
      const typingIndicator = document.querySelector('.typingIndicator');
      expect(typingIndicator).toBeInTheDocument();
    });
  });

  it('accepts user input and adds to message list', async () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Test user message' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Test user message')).toBeInTheDocument();
    });
  });

  it('clears input after submission', async () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...') as HTMLInputElement;
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('displays timestamp for messages', async () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(form);

    await waitFor(() => {
      const timestamps = document.querySelectorAll('.messageTime');
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  it('follows conversation flow with multiple questions', async () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...');
    const form = input.closest('form')!;

    // First response
    fireEvent.change(input, { target: { value: 'I want to automate customer service' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/business problem/i)).toBeInTheDocument();
    });

    // Second response
    fireEvent.change(input, { target: { value: 'Reduce response time and improve accuracy' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/primary users/i)).toBeInTheDocument();
    });
  });

  it('handles Enter key for submission', () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('restores initial state if provided', () => {
    const initialMessages: Message[] = [
      {
        id: 'msg-1',
        type: 'user',
        content: 'Previous message',
        timestamp: new Date(),
      },
    ];

    const initialState = {
      messages: initialMessages,
      userData: { test: 'data' },
    };

    render(<ConversationalFlow initialState={initialState} />);

    expect(screen.getByText('Previous message')).toBeInTheDocument();
  });

  it('calls onComplete when conversation finishes', async () => {
    render(<ConversationalFlow onComplete={mockOnComplete} />);

    const input = screen.getByPlaceholderText('Type your response here...');
    const form = input.closest('form')!;

    // Simulate completing all questions (simplified)
    const responses = [
      'Idea description',
      'Business case',
      'Target users',
      'Data sources',
      'Risks identified',
      'Success metrics'
    ];

    for (const response of responses) {
      fireEvent.change(input, { target: { value: response } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(response)).toBeInTheDocument();
      }, { timeout: 3000 });
    }

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('disables input when conversation is complete', async () => {
    render(<ConversationalFlow />);

    const input = screen.getByPlaceholderText('Type your response here...') as HTMLInputElement;
    const form = input.closest('form')!;

    // Simulate completing conversation (simplified)
    const responses = [
      'Idea', 'Business', 'Users', 'Data', 'Risks', 'Metrics'
    ];

    for (const response of responses) {
      fireEvent.change(input, { target: { value: response } });
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(response)).toBeInTheDocument();
      }, { timeout: 3000 });
    }

    await waitFor(() => {
      expect(input).toBeDisabled();
    }, { timeout: 5000 });
  });
});