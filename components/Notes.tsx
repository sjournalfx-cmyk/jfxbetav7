import React, { useState, useRef, useEffect } from 'react';
import CreateArea from './notes/CreateArea';
import NoteCard from './notes/NoteCard';
import NoteEditor from './notes/NoteEditor';
import { Note as KeepNote, NoteColor, SidebarSection } from './notes/types';
import { Note as AppNote, Goal, UserProfile } from '../types';
import { Search, Menu, RefreshCw, Grid, Settings, Trash2, Archive, Lightbulb, ChevronLeft, Bell, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NotesProps {
  isDarkMode: boolean;
  notes: AppNote[];
  goals: Goal[];
  onAddNote: (note: any) => Promise<any>;
  onUpdateNote: (note: any) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onRestoreNote: (id: string) => Promise<void>;
  onUpdateGoal: (goal: Goal) => Promise<void>;
  userProfile?: UserProfile | null;
  onViewChange: (view: string) => void;
}

const Notes: React.FC<NotesProps> = ({ 
  isDarkMode, 
  notes: appNotes, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  onRestoreNote,
  userProfile, 
  onViewChange 
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSection, setCurrentSection] = useState<SidebarSection>('NOTES');
  
  // Canvas Size State
  const [canvasWidth, setCanvasWidth] = useState(700);
  const [canvasHeight, setCanvasHeight] = useState(0); 
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  // Map AppNote to KeepNote
  const notes: KeepNote[] = appNotes.map(n => ({
    id: n.id,
    title: n.title,
    content: n.content,
    isPinned: !!n.isPinned,
    isArchived: (n as any).isArchived || false,
    isTrashed: (n as any).isTrashed || false,
    color: (n.color?.toUpperCase() as NoteColor) || NoteColor.DEFAULT,
    labels: n.tags || [],
    createdAt: new Date(n.date).getTime(),
    updatedAt: new Date(n.date).getTime(),
    isList: (n as any).isList || false,
    listItems: (n as any).listItems || [],
    image: (n as any).image,
    tableData: (n as any).tableData,
    position: n.position,
  }));

  const selectedNote = notes.find(n => n.id === selectedNoteId) || null;

  const handleCreateNote = async (newNoteData: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isTrashed' | 'labels'>) => {
    const newNote: Partial<AppNote> = {
      title: newNoteData.title,
      content: newNoteData.content,
      isPinned: newNoteData.isPinned,
      color: newNoteData.color.toLowerCase() as any,
      tags: [],
      date: new Date().toISOString(),
      position: 0 // New notes start at the top
    };
    
    // Add extra fields for the new notebook
    (newNote as any).isList = newNoteData.isList;
    (newNote as any).listItems = newNoteData.listItems;
    (newNote as any).image = newNoteData.image;
    (newNote as any).tableData = newNoteData.tableData;

    try {
      const added = await onAddNote(newNote);
      if (added) {
        setSelectedNoteId(added.id);
      }
    } catch (e) {
      console.error("Failed to create note", e);
    }
  };

  const handleUpdateKeepNote = (updatedNote: KeepNote) => {
    const update: Partial<AppNote> & { id: string } = {
      id: updatedNote.id,
      title: updatedNote.title,
      content: updatedNote.content,
      isPinned: updatedNote.isPinned,
      color: updatedNote.color.toLowerCase() as any,
      tags: updatedNote.labels,
      date: new Date(updatedNote.updatedAt).toISOString(),
      position: updatedNote.position,
    };
    
    // Add extra fields
    (update as any).isArchived = updatedNote.isArchived;
    (update as any).isTrashed = updatedNote.isTrashed;
    (update as any).isList = updatedNote.isList;
    (update as any).listItems = updatedNote.listItems;
    (update as any).image = updatedNote.image;
    (update as any).tableData = updatedNote.tableData;

    onUpdateNote(update);
  };

  const handlePinNote = (e: React.MouseEvent, note: KeepNote) => {
    e.stopPropagation();
    handleUpdateKeepNote({ ...note, isPinned: !note.isPinned });
  };

  const handleArchiveNote = (e: React.MouseEvent, note: KeepNote) => {
    e.stopPropagation();
    const nextArchived = !note.isArchived;
    handleUpdateKeepNote({ ...note, isArchived: nextArchived });
    if (selectedNoteId === note.id) setSelectedNoteId(null);
  };
  
  const handleDeleteNote = (id: string) => {
      onDeleteNote(id);
      if (selectedNoteId === id) setSelectedNoteId(null);
  };

  const handleRestoreNote = (e: React.MouseEvent, note: KeepNote) => {
      e.stopPropagation();
      onRestoreNote(note.id);
  };

  const handleDuplicateNote = (note: KeepNote) => {
      const duplicate = {
          ...note,
          id: '', // Will be generated by DB
          title: note.title + " (Copy)",
          updatedAt: Date.now(),
      };
      handleCreateNote(duplicate);
  };

  // Resize Handlers
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: canvasWidth,
      startHeight: canvasHeight || 0,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return;
      const deltaX = e.clientX - resizeRef.current.startX;
      const deltaY = e.clientY - resizeRef.current.startY;
      const newWidth = Math.max(400, Math.min(2000, resizeRef.current.startWidth + deltaX));
      const newHeight = Math.max(0, resizeRef.current.startHeight + deltaY);
      setCanvasWidth(newWidth);
      setCanvasHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          note.listItems?.some(item => item.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (currentSection === 'ARCHIVE') return note.isArchived && !note.isTrashed && matchesSearch;
    if (currentSection === 'TRASH') return note.isTrashed && matchesSearch;
    return !note.isArchived && !note.isTrashed && matchesSearch;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned).sort((a, b) => (a.position || 0) - (b.position || 0));
  const otherNotes = filteredNotes.filter(n => !n.isPinned).sort((a, b) => (a.position || 0) - (b.position || 0));

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndNotes = async (event: DragEndEvent, list: KeepNote[]) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = list.findIndex(n => n.id === active.id);
      const newIndex = list.findIndex(n => n.id === over.id);
      
      const newList = arrayMove(list, oldIndex, newIndex);
      
      // Update local state immediately
      const updatedNotes = newList.map((n, i) => ({ ...n, position: i }));
      
      // Update the main notes list by merging
      onUpdateNote({ id: active.id as string, position: newIndex } as any);
      // In a real scenario, we'd batch update all positions
      updatedNotes.forEach(n => onUpdateNote({ id: n.id, position: n.position } as any));
    }
  };

  return (
    <div className={`flex flex-col h-full w-full font-sans overflow-hidden ${isResizing ? 'cursor-nwse-resize select-none' : ''}`} style={{ backgroundColor: 'var(--note-default-bg)', color: 'var(--notebook-text)' }}>
      {/* Header */}
      <header 
        className="sticky top-0 grid grid-cols-[300px_1fr_300px] items-center px-8 py-1.5 border-b shrink-0 z-30 backdrop-blur-md" 
        style={{ 
          backgroundColor: isDarkMode ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)', 
          borderColor: 'var(--notebook-divider)' 
        }}
      >
        <div className="flex items-center gap-5 overflow-hidden">
          {[
            { id: 'NOTES', icon: Lightbulb, title: 'Notes' },
            { id: 'REMINDERS', icon: Bell, title: 'Reminders' },
            { id: 'EDIT_LABELS', icon: Pencil, title: 'Edit labels' },
            { id: 'ARCHIVE', icon: Archive, title: 'Archive' },
            { id: 'TRASH', icon: Trash2, title: 'Trash' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentSection(item.id as SidebarSection)}
              className={`flex items-center gap-2 py-2.5 transition-all relative group shrink-0`}
              title={item.title}
            >
              <item.icon className={`w-[17px] h-[17px] transition-colors ${
                currentSection === item.id 
                  ? 'text-indigo-500' 
                  : 'text-[var(--notebook-muted)] group-hover:text-[var(--notebook-text)]'
              }`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${
                currentSection === item.id 
                  ? 'text-indigo-500' 
                  : 'text-[var(--notebook-muted)] group-hover:text-[var(--notebook-text)]'
              }`}>
                {item.title}
              </span>
              {currentSection === item.id && (
                <div className="absolute -bottom-[7.5px] left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <div className={`w-full max-w-[400px] relative flex items-center rounded-lg transition-all group bg-[var(--notebook-hover)] focus-within:bg-[var(--note-default-bg)] focus-within:ring-1 focus-within:ring-indigo-500/20`}>
            <div className={`pl-2.5 pr-1.5 text-[var(--notebook-muted)] group-focus-within:text-indigo-500`}>
              <Search className="w-4 h-4" />
            </div>
            <input 
              id="notes-search-input"
              name="search"
              aria-label="Search your notes"
              type="text" 
              placeholder="Search your notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none py-1.5 text-xs placeholder:opacity-50"
              style={{ color: 'var(--notebook-text)' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <HeaderIcon icon={<RefreshCw className="w-[17px] h-[17px]" />} title="Refresh" isDarkMode={isDarkMode} />
          <HeaderIcon icon={<Settings className="w-[17px] h-[17px]" />} title="Settings" isDarkMode={isDarkMode} onClick={() => onViewChange('settings')} />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`flex flex-1 overflow-hidden transition-all duration-300`}>
            {/* Left Side: Scrollable Notes List */}
            <aside className="w-[340px] xl:w-[380px] flex flex-col border-r shrink-0 overflow-y-auto custom-scrollbar transition-all duration-300" style={{ backgroundColor: 'var(--note-default-bg)', borderColor: 'var(--notebook-divider)' }}>
                <div className="p-4 space-y-4">
                    <AnimatePresence initial={false} mode="popLayout">
                        {pinnedNotes.length > 0 && (
                            <motion.div 
                                key="pinned-section"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-8"
                            >
                                <h2 className="text-[0.65rem] font-black tracking-widest mb-4 uppercase pl-2 opacity-50">Pinned</h2>
                                <div className="flex flex-col gap-3">
                                    <DndContext 
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(e) => handleDragEndNotes(e, pinnedNotes)}
                                    >
                                        <SortableContext items={pinnedNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                                            <AnimatePresence mode="popLayout">
                                                {pinnedNotes.map(note => (
                                                    <SortableWrapper key={note.id} id={note.id}>
                                                        <NoteCard 
                                                            note={note} 
                                                            onClick={(n) => setSelectedNoteId(n.id)}
                                                            onPin={handlePinNote}
                                                            onArchive={handleArchiveNote}
                                                            onDelete={(e, n) => { e.stopPropagation(); handleDeleteNote(n.id); }}
                                                            onRestore={handleRestoreNote}
                                                            onUpdate={handleUpdateKeepNote}
                                                        />
                                                    </SortableWrapper>
                                                ))}
                                            </AnimatePresence>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </motion.div>
                        )}

                        {(pinnedNotes.length > 0 || otherNotes.length > 0) ? (
                            <motion.div key="others-section" layout>
                                {pinnedNotes.length > 0 && otherNotes.length > 0 && (
                                    <h2 className="text-[0.65rem] font-black tracking-widest mb-4 uppercase pl-2 opacity-50">Others</h2>
                                )}
                                <div className="flex flex-col gap-3">
                                    <DndContext 
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={(e) => handleDragEndNotes(e, otherNotes)}
                                    >
                                        <SortableContext items={otherNotes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                                            <AnimatePresence mode="popLayout">
                                                {otherNotes.map(note => (
                                                    <SortableWrapper key={note.id} id={note.id}>
                                                        <NoteCard 
                                                            key={note.id} 
                                                            note={note} 
                                                            onClick={(n) => setSelectedNoteId(n.id)}
                                                            onPin={handlePinNote}
                                                            onArchive={handleArchiveNote}
                                                            onDelete={(e, n) => { e.stopPropagation(); handleDeleteNote(n.id); }}
                                                            onRestore={handleRestoreNote}
                                                            onUpdate={handleUpdateKeepNote}
                                                        />
                                                    </SortableWrapper>
                                                ))}
                                            </AnimatePresence>
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20 opacity-20"
                            >
                                <Lightbulb className="w-16 h-16 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-wider">No notes found</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* Right Side: Workspace Canvas */}
            <main className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center py-12 px-8 relative bg-[var(--note-default-bg)]`}>
              
              <div 
                className={`relative transition-all duration-300 ${isResizing ? 'ring-2 ring-indigo-500/50' : ''}`}
                style={{ 
                  width: `${canvasWidth}px`, 
                  height: canvasHeight > 0 ? `${canvasHeight}px` : 'auto',
                  minWidth: '400px'
                }}
              >
                {selectedNote ? (
                  <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-spring">
                                        <NoteEditor 
                                            note={selectedNote} 
                                            onClose={() => setSelectedNoteId(null)}
                                            onUpdate={handleUpdateKeepNote}
                                            onDelete={handleDeleteNote}
                                            onRestore={onRestoreNote}
                                            onDuplicate={handleDuplicateNote}
                                            canvasWidth={canvasWidth}
                                            setCanvasWidth={setCanvasWidth}
                                        />                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full mb-20">
                      <CreateArea 
                        onCreate={handleCreateNote} 
                        canvasWidth={canvasWidth}
                        setCanvasWidth={setCanvasWidth}
                      />
                    </div>

                    <div className={`w-full flex flex-col items-center text-center opacity-10 select-none pointer-events-none mt-12 text-[var(--notebook-text)]`}>
                            <div className="mb-6">
                               <Lightbulb className="w-32 h-32 mx-auto stroke-1" />
                            </div>
                            <h3 className="text-3xl font-black uppercase tracking-tight">Your Ideas Await</h3>
                            <p className="mt-2 text-lg font-medium">Select a note from the list to refine your thoughts</p>
                    </div>
                  </div>
                )}

                {/* Canvas Resize Handle */}
                <div 
                  onMouseDown={startResizing}
                  className={`absolute bottom-0 right-0 w-10 h-10 flex items-center justify-center cursor-nwse-resize z-50 group pointer-events-auto
                    ${isResizing ? 'text-indigo-500' : 'text-zinc-500 opacity-0 group-hover:opacity-100'} 
                    hover:opacity-100 transition-all`}
                  title="Resize canvas"
                >
                  <svg 
                    className="w-6 h-6 rotate-45 transform" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="16" y1="21" x2="21" y2="16" />
                    <line x1="11" y1="21" x2="21" y2="11" />
                  </svg>
                </div>
              </div>
            </main>
        </div>
      </div>
    </div>
  );
};

const SortableWrapper = ({ id, children }: { id: string, children: React.ReactElement }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      {...attributes}
      {...listeners}
    >
      {React.cloneElement(children, { isDragging })}
    </motion.div>
  );
};

const HeaderIcon = ({ icon, title, isDarkMode, onClick }: { icon: React.ReactNode, title: string, isDarkMode: boolean, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all active:scale-95 hover:bg-[var(--notebook-hover)] text-[var(--notebook-muted)] hover:text-[var(--notebook-text)]`} 
      title={title}
    >
        {icon}
    </button>
);

export default Notes;