import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Notes from './Notes';
import { Note, Goal, UserProfile } from '../types';

// Mock components
vi.mock('./RichTextEditor', () => ({
  default: ({ content, onChange }: any) => (
    <div data-testid="rich-text-editor">
      <textarea 
        data-testid="mock-editor" 
        value={content} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  ),
  ToolbarButton: ({ onClick, icon: Icon, title }: any) => (
    <button onClick={onClick} title={title}><Icon /></button>
  )
}));

describe('Notes Component - Deletion', () => {
  const mockNotes: Note[] = [
    {
      id: 'note-1',
      title: 'First Note',
      content: 'Content 1',
      tags: ['tag1'],
      color: 'gray',
      date: '2023-01-01T10:00:00',
      isPinned: false
    },
    {
      id: 'note-2',
      title: 'Second Note',
      content: 'Content 2',
      tags: ['tag2'],
      color: 'blue',
      date: '2023-01-02T10:00:00',
      isPinned: false
    }
  ];

  const mockUserProfile: UserProfile = {
    name: 'Test',
    country: 'US',
    accountName: 'Test',
    initialBalance: 1000,
    currency: 'USD',
    currencySymbol: '$',
    syncMethod: 'Manual',
    experienceLevel: 'Beginner',
    tradingStyle: 'Scalper',
    onboarded: true,
    plan: 'PRO TIER (ANALYSTS)',
    themePreference: 'default'
  };

  const mockOnDeleteNote = vi.fn().mockResolvedValue(undefined);
  const mockOnAddNote = vi.fn();
  const mockOnUpdateNote = vi.fn();
  const mockOnUpdateGoal = vi.fn();
  const mockOnViewChange = vi.fn();

  const NotesWrapper = () => {
    const [notes, setNotes] = useState<Note[]>(mockNotes);
    
    const handleDelete = async (id: string) => {
      await mockOnDeleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    };

    return (
      <Notes
        isDarkMode={false}
        notes={notes}
        goals={[]}
        onAddNote={mockOnAddNote}
        onUpdateNote={mockOnUpdateNote}
        onDeleteNote={handleDelete}
        onUpdateGoal={mockOnUpdateGoal}
        userProfile={mockUserProfile}
        onViewChange={mockOnViewChange}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should open confirmation modal when delete button is clicked', async () => {
    render(<NotesWrapper />);

    // Note 1 should be loaded by default
    expect(screen.getByDisplayValue('First Note')).toBeInTheDocument();

    // Click delete button in header
    const deleteBtn = screen.getByTitle('Delete Note');
    fireEvent.click(deleteBtn);

    // Check if modal is open
    expect(screen.getByText(/Are you sure you want to delete this note/i)).toBeInTheDocument();
  });

  it('should call onDeleteNote and show next note when confirmed', async () => {
    render(<NotesWrapper />);

    // Click delete button
    fireEvent.click(screen.getByTitle('Delete Note'));

    // Click confirm in modal
    const confirmBtn = screen.getByText('Delete', { selector: 'button' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnDeleteNote).toHaveBeenCalledWith('note-1');
    });

    // Should now show Second Note
    await waitFor(() => {
      expect(screen.getByDisplayValue('Second Note')).toBeInTheDocument();
    });
  });

  it('should show empty state when all notes are deleted', async () => {
    const SingleNoteWrapper = () => {
      const [notes, setNotes] = useState<Note[]>([mockNotes[0]]);
      
      const handleDelete = async (id: string) => {
        await mockOnDeleteNote(id);
        setNotes([]);
      };

      return (
        <Notes
          isDarkMode={false}
          notes={notes}
          goals={[]}
          onAddNote={mockOnAddNote}
          onUpdateNote={mockOnUpdateNote}
          onDeleteNote={handleDelete}
          onUpdateGoal={mockOnUpdateGoal}
          userProfile={mockUserProfile}
          onViewChange={mockOnViewChange}
        />
      );
    };

    render(<SingleNoteWrapper />);

    fireEvent.click(screen.getByTitle('Delete Note'));
    fireEvent.click(screen.getByText('Delete', { selector: 'button' }));

    await waitFor(() => {
      expect(screen.getByText(/No Note Selected/i)).toBeInTheDocument();
    });
  });

  it('should disable delete and save buttons when no note is active', async () => {
    render(
      <Notes
        isDarkMode={false}
        notes={[]}
        goals={[]}
        onAddNote={mockOnAddNote}
        onUpdateNote={mockOnUpdateNote}
        onDeleteNote={mockOnDeleteNote}
        onUpdateGoal={mockOnUpdateGoal}
        userProfile={mockUserProfile}
        onViewChange={mockOnViewChange}
      />
    );

    // Sidebar shows "No Note Selected" view
    expect(screen.getByText(/No Note Selected/i)).toBeInTheDocument();

    const deleteBtn = screen.getByTitle('Delete Note');
    expect(deleteBtn).toBeDisabled();

    const saveBtn = screen.getByText(/Save Changes/i).closest('button');
    expect(saveBtn).toBeDisabled();
  });
});
