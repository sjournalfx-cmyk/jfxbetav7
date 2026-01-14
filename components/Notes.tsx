import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Save, Plus, Search, Pin, ChevronLeft, Trash2, Clock, Hash, Tag,
  Flag, ListChecks, Target, Link, Lock, ArrowRight, Maximize, Minimize
} from 'lucide-react';
import { Note, Goal, UserProfile } from '../types';
import { uploadNoteImage } from '../services/dataService';
import ConfirmationModal from './ConfirmationModal';
import RichTextEditor, { ToolbarButton } from './RichTextEditor';
import { APP_CONSTANTS, PLAN_FEATURES } from '../lib/constants';

interface NotesProps {
  isDarkMode: boolean;
  notes: Note[];
  goals: Goal[];
  onAddNote: (note: Note) => Promise<Note>;
  onUpdateNote: (note: Note) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onUpdateGoal: (goal: Goal) => Promise<void>;
  userProfile?: UserProfile | null;
  onViewChange: (view: string) => void;
}

const COLORS = [
  { id: 'gray', bg: 'bg-zinc-100', darkBg: 'bg-zinc-800', border: 'border-zinc-300' },
  { id: 'blue', bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', border: 'border-blue-500/30' },
  { id: 'green', bg: 'bg-emerald-50', darkBg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  { id: 'purple', bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', border: 'border-purple-500/30' },
  { id: 'rose', bg: 'bg-rose-50', darkBg: 'bg-rose-900/20', border: 'border-rose-500/30' },
  { id: 'yellow', bg: 'bg-amber-50', darkBg: 'bg-amber-900/20', border: 'border-amber-500/30' },
];

const Notes: React.FC<NotesProps> = ({ isDarkMode, notes, goals, onAddNote, onUpdateNote, onDeleteNote, onUpdateGoal, userProfile, onViewChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('gray');
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Unsaved' | 'Saving'>('Saved');
  const [showGoalLinker, setShowGoalLinker] = useState(false);

  // Robust free tier check
  const isFreeTier = !userProfile || userProfile.plan === 'FREE TIER (JOURNALER)';

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    showCancel?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { }
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    if (isFullScreen) {
      setIsSidebarOpen(false);
    }
  }, [isFullScreen]);

  useEffect(() => {
    if (notes.length > 0 && !activeNoteId) {
      loadNote(notes[0]);
    } else if (notes.length === 0 && !activeNoteId) {
      createNewNote();
    }
  }, [notes.length]);

  const loadNote = useCallback((note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setTags(note.tags || []);
    setSelectedColor(note.color || 'gray');
    setContent(note.content || '');
    setSaveStatus('Saved');
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  const createNewNote = async () => {
    // Enforce Plan Limits
    const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
    const features = PLAN_FEATURES[currentPlan];

    if (features.maxNotes !== Infinity && notes.length >= features.maxNotes) {
      setConfirmModal({
        isOpen: true,
        title: 'Notebook Limit Reached',
        description: `Your current plan is limited to ${features.maxNotes} saved note(s). Please upgrade to create unlimited notes.`,
        confirmText: 'Upgrade Now',
        showCancel: true,
        onConfirm: () => {
          onViewChange('settings');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    const newNote: Note = {
      id: '',
      title: '',
      content: '',
      tags: [],
      color: 'gray',
      date: new Date().toISOString(),
      isPinned: false
    };
    try {
      const addedNote = await onAddNote(newNote);
      loadNote(addedNote);
      setTimeout(() => document.getElementById('note-title-input')?.focus(), 100);
    } catch (e) {
      console.error("Failed to create note");
    }
  };

  // --- SAVING LOGIC ---
  const handleSave = async () => {
    if (!activeNoteId) return;
    setSaveStatus('Saving');

    const noteToUpdate = notes.find(n => n.id === activeNoteId);
    if (!noteToUpdate) return;

    const updated: Note = {
      ...noteToUpdate,
      title,
      content,
      tags,
      color: selectedColor as any,
      date: new Date().toISOString()
    };

    await onUpdateNote(updated);
    setSaveStatus('Saved');
  };

  // Auto-save debouncer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNoteId && saveStatus === 'Unsaved') {
        handleSave();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [title, content, tags, selectedColor, saveStatus]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSaveStatus('Unsaved');
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    setSaveStatus('Unsaved');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setSaveStatus('Unsaved');
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    setSaveStatus('Unsaved');
  };

  const handleDelete = async () => {
    if (!activeNoteId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Note',
      description: 'Are you sure you want to delete this note? This action cannot be undone.',
      onConfirm: async () => {
        await onDeleteNote(activeNoteId);
        setActiveNoteId(null);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

    const handleNoteUpload = (file: File) => {
      const currentPlan = userProfile?.plan || APP_CONSTANTS.PLANS.FREE;
      const features = PLAN_FEATURES[currentPlan];

      if (!features.allowImageUploads) {
        setConfirmModal({
          isOpen: true,
          title: 'Image Uploads Locked',
          description: 'Image uploads are not available on your current plan. Please upgrade to unlock this feature.',
          confirmText: 'Upgrade Now',
          showCancel: true,
          onConfirm: () => {
            onViewChange('settings');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        });
        return Promise.resolve(null);
      }
      return uploadNoteImage(file);
    };

  

    const linkGoalMilestone = (goalId: string, milestoneId: string, mTitle: string) => {

      const goal = goals.find(g => g.id === goalId);

      const html = `

        <div class="goal-milestone-block" data-goal-id="${goalId}" data-milestone-id="${milestoneId}" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin: 16px 0; border-radius: 12px; border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}; background: ${isDarkMode ? 'rgba(99, 102, 241, 0.05)' : '#f5f7ff'}; cursor: pointer;">

          <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid currentColor; display: flex; align-items: center; justify-content: center;">

            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>

          </div>

          <div style="display: flex; flex-direction: column;">

            <span style="font-weight: 700;">${mTitle}</span>

            <span style="font-size: 10px; opacity: 0.6;">Linked to: ${goal?.title}</span>

          </div>

        </div>

      `;

      setContent(content + html);

      setShowGoalLinker(false);

    };

  

      const filteredNotes = notes.filter(n =>

  

        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||

  

        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||

  

        (n.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

  

      );

  

    

  

      return (

  

        <div className={`w-full h-full flex overflow-hidden ${isFullScreen ? 'fixed inset-0 z-[100]' : ''} ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>

  

    

  

          {/* Sidebar */}

  

          <div className={`

  

            ${isSidebarOpen && !isFullScreen ? 'w-80 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0 overflow-hidden'} 

  

            shrink-0 border-r flex flex-col transition-all duration-300 ease-spring relative z-20

  

            ${isDarkMode ? 'border-[#27272a] bg-[#0c0c0e]' : 'border-slate-200 bg-white'}

  

          `}>

  

            <div className="p-5 border-b shrink-0 space-y-4 border-dashed border-zinc-200 dark:border-zinc-800">

  

              <div className="flex items-center justify-between">

  

                <h2 className="font-bold text-base flex items-center gap-2"><Save size={18} className="text-indigo-500" /> My Notes</h2>

  

                <button 
                  onClick={createNewNote} 
                  className={`p-2 rounded-lg transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                    PLAN_FEATURES[userProfile?.plan || APP_CONSTANTS.PLANS.FREE].maxNotes !== Infinity && notes.length >= PLAN_FEATURES[userProfile?.plan || APP_CONSTANTS.PLANS.FREE].maxNotes
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none border border-zinc-200' 
                    : 'bg-indigo-600 hover:bg-indigo-50 text-white shadow-indigo-500/20'
                  }`}
                >
                  {PLAN_FEATURES[userProfile?.plan || APP_CONSTANTS.PLANS.FREE].maxNotes !== Infinity && notes.length >= PLAN_FEATURES[userProfile?.plan || APP_CONSTANTS.PLANS.FREE].maxNotes ? <Lock size={16} /> : <Plus size={18} />}
                </button>

  

              </div>

  

              <div className="relative">

  

                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />

  

                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 focus:border-indigo-500'}`} />

  

              </div>

  

            </div>

  

    

  

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">

  

              {filteredNotes.map(note => (

  

                <div key={note.id} onClick={() => loadNote(note)} className={`group relative p-4 rounded-xl cursor-pointer transition-all border ${activeNoteId === note.id ? (isDarkMode ? 'bg-zinc-800/80 border-zinc-700 shadow-lg' : 'bg-white border-indigo-200 shadow-md shadow-indigo-100') : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}>

  

                  <div className="flex justify-between items-start mb-1.5">

  

                    <h4 className={`font-bold text-sm truncate pr-4 ${!note.title ? 'opacity-40 italic' : ''}`}>{note.title || 'Untitled Note'}</h4>

  

                    {note.isPinned && <Pin size={12} className="text-indigo-500 shrink-0" fill="currentColor" />}

  

                  </div>

  

                  <p className="text-xs opacity-50 line-clamp-2 mb-3 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]*>/g, '') || 'No additional text' }} />

  

                  <div className="flex items-center justify-between">

  

                    <div className="flex items-center gap-2">

  

                      {(note.tags || []).slice(0, 2).map(t => (

  

                        <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>#{t}</span>

  

                      ))}

  

                      {note.content.includes('goal-milestone-block') && <Flag size={10} className="text-indigo-500" fill="currentColor" />}

  

                      {note.content.includes('ul data-type="taskList"') && <ListChecks size={10} className="text-emerald-500" />}

  

                    </div>

  

                    <span className="text-[10px] opacity-30 font-mono">{new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>

  

                  </div>

  

                </div>

  

              ))}

  

            </div>

  

    

  

            {/* Upgrade CTA if limit reached */}
            {PLAN_FEATURES[userProfile?.plan || APP_CONSTANTS.PLANS.FREE].maxNotes !== Infinity && notes.length >= PLAN_FEATURES[userProfile?.plan || APP_CONSTANTS.PLANS.FREE].maxNotes && (
              <div className="p-4 mt-auto">
                <button 
                  onClick={() => onViewChange('settings')}
                  className={`w-full p-4 rounded-2xl border border-dashed flex flex-col gap-2 text-left transition-all hover:border-indigo-500 group ${isDarkMode ? 'bg-indigo-500/5 border-zinc-800' : 'bg-indigo-50 border-indigo-200'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="p-1.5 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                      <Lock size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 opacity-60">Plan Limit</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">Unlock Unlimited Notes</h4>
                    <p className="text-[10px] opacity-50 mt-0.5">You've reached your plan's note limit. Upgrade to save more insights.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-indigo-500 mt-1 group-hover:gap-2 transition-all">
                    Upgrade Now <ArrowRight size={12} />
                  </div>
                </button>
              </div>
            )}

  

          </div>

  

    

  

          {/* Main Area */}

  

          <div className="flex-1 flex flex-col min-w-0 relative">

  

            <header className={`h-16 shrink-0 flex items-center justify-between px-6 border-b z-10 ${isDarkMode ? 'bg-[#09090b] border-[#27272a]' : 'bg-white border-slate-100'}`}>

  

              <div className="flex items-center gap-4">

  

                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-lg transition-colors ${isFullScreen ? 'hidden' : ''} ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'}`}><ChevronLeft size={20} className={`transition-transform duration-300 ${isSidebarOpen ? '' : 'rotate-180'}`} /></button>

  

                <div className="flex items-center gap-1 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">

  

                  <div className={`w-2 h-2 rounded-full ${saveStatus === 'Saved' ? 'bg-emerald-500' : saveStatus === 'Saving' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`} />

  

                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{saveStatus}</span>

  

                </div>

  

              </div>

  

    

  

              <div className="flex items-center gap-3">

  

                <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete Note"><Trash2 size={18} /></button>

  

                <button onClick={handleSave} disabled={saveStatus === 'Saved'} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${saveStatus === 'Unsaved' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 hover:bg-indigo-500' : isDarkMode ? 'bg-zinc-800/50 text-zinc-500 border-transparent cursor-default' : 'bg-slate-100 text-slate-400 border-transparent cursor-default'}`}>

  

                  {saveStatus === 'Saving' ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}

  

                  <span>Save Changes</span>

  

                </button>

  

                <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-dashed border-zinc-200 dark:border-zinc-800">

  

                  {COLORS.map(c => (

  

                    <button key={c.id} onClick={() => { setSelectedColor(c.id); setSaveStatus('Unsaved'); }} className={`w-3 h-3 rounded-full transition-transform hover:scale-125 ${selectedColor === c.id ? `scale-125 ring-2 ring-offset-2 ${isDarkMode ? 'ring-white ring-offset-[#09090b]' : 'ring-black ring-offset-white'}` : ''} ${c.id === 'gray' ? 'bg-zinc-500' : `bg-${c.id}-500`}`} style={{ backgroundColor: c.id === 'gray' ? '#71717a' : `var(--color-${c.id}-500)` }} />

  

                  ))}

  

                </div>

  

              </div>

  

            </header>

  

    

  

            <div className={`flex-1 overflow-y-auto custom-scrollbar relative`}>

  

              <div className={`mx-auto py-12 min-h-full flex flex-col ${isFullScreen ? 'w-full max-w-full px-12' : 'max-w-7xl px-8'}`}>

  

                <input id="note-title-input" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Note Title" className={`w-full text-4xl font-black bg-transparent outline-none mb-6 placeholder:opacity-20 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`} />

  

    

  

                <div className="flex flex-wrap items-center gap-2 mb-8">

  

                  {tags.map(tag => (

  

                    <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>

  

                      <Hash size={10} className="opacity-50" /> {tag}

  

                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-rose-500"><X size={10} /></button>

  

                    </span>

  

                  ))}

  

                  <div className="relative group">

  

                    <Tag size={14} className={`absolute left-2 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-600 group-focus-within:text-indigo-500' : 'text-slate-400 group-focus-within:text-indigo-500'}`} />

  

                    <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Add tag..." className={`pl-8 pr-3 py-1.5 rounded-full text-xs font-medium outline-none border border-transparent transition-all w-32 focus:w-48 ${isDarkMode ? 'bg-zinc-900 focus:bg-zinc-800 focus:border-zinc-700 placeholder-zinc-600' : 'bg-white focus:bg-slate-50 focus:border-slate-200 placeholder-slate-400'}`} />

  

                  </div>

  

                </div>

  

    

  

              <div className="flex-1 relative min-h-[400px] flex flex-col">

                <RichTextEditor

                  content={content}

                  onChange={handleContentChange}

                  isDarkMode={isDarkMode}

                  placeholder="Start writing your masterpiece..."

                  minHeight="500px"

                  showToolbar={true}

                  onImageUpload={handleNoteUpload}

                  customToolbarItems={

                    <>

                      <div className="relative">

                        <ToolbarButton

                          onClick={() => setShowGoalLinker(!showGoalLinker)}

                          isActive={showGoalLinker}

                          icon={Link}

                          title="Link to Goal"

                        />

                        {showGoalLinker && (

                          <div className={`absolute top-full left-0 mt-2 w-64 p-3 rounded-xl border shadow-2xl z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>

                            <h4 className="text-xs font-bold mb-3 opacity-50 uppercase tracking-wider">Link Goal Milestone</h4>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-3">

                              {goals.length === 0 && <p className="text-xs opacity-50 italic">No goals found...</p>}

                              {goals.map(goal => (

                                <div key={goal.id} className="space-y-1">

                                  <div className="flex items-center gap-2 text-[10px] font-black opacity-40 px-1"><Target size={10} /> {goal.title}</div>

                                  {goal.milestones.map(m => (

                                    <button key={m.id} onClick={() => linkGoalMilestone(goal.id, m.id, m.title)} className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-50 text-slate-700'}`}>

                                      {m.title}

                                    </button>

                                  ))}

                                </div>

                              ))}

                            </div>

                          </div>

                        )}

                      </div>

                      <ToolbarButton

                        onClick={() => setIsFullScreen(!isFullScreen)}

                        icon={isFullScreen ? Minimize : Maximize}

                        title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}

                      />

                    </>

                  }

                />

              </div>

            </div>

          </div>

        </div>

  

        {/* Confirmation Modal */}

        <ConfirmationModal

          isOpen={confirmModal.isOpen}

          title={confirmModal.title}

          description={confirmModal.description}

          onConfirm={confirmModal.onConfirm}

          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}

          isDarkMode={isDarkMode}

          confirmText={confirmModal.confirmText || "Delete"}

          variant="danger"

          showCancel={confirmModal.showCancel}

        />

      </div>

    );

  };

  

  export default Notes;

  