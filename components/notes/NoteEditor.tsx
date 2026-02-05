
import React, { useEffect, useState, useRef } from 'react';
import { Pin, Archive, Trash2, Sparkles, Loader2, X, CheckSquare, Plus, Minus, Square, CheckSquare as CheckSquareIcon, GripVertical, Bell, Image as ImageIcon, MoreVertical, Palette, RotateCcw, RotateCw, Copy, Tag, Check, Table as TableIcon, PlusSquare, MinusSquare } from 'lucide-react';
import { Note, NoteColor, ColorStyles, ListItem, TableData } from './types';
import { generateNoteContent } from '../../services/notesGeminiService';

interface NoteEditorProps {
  note: Note;
  onClose: () => void;
  onUpdate: (updatedNote: Note) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onDuplicate?: (note: Note) => void;
  canvasWidth?: number;
  setCanvasWidth?: React.Dispatch<React.SetStateAction<number>>;
}

const genId = () => Math.random().toString(36).slice(2, 9);
const COLUMN_WIDTH_INC = 120;

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onClose, onUpdate, onDelete, onRestore, onDuplicate, canvasWidth, setCanvasWidth }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isList, setIsList] = useState(note.isList || false);
  const [listItems, setListItems] = useState<ListItem[]>(note.listItems || []);
  const [image, setImage] = useState<string | undefined>(note.image);
  const [tableData, setTableData] = useState<TableData | undefined>(note.tableData);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [color, setColor] = useState(note.color);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showColorOptions, setShowColorOptions] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalUpdate = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsList(note.isList || false);
    setListItems(note.listItems || []);
    setImage(note.image);
    setTableData(note.tableData);
    setIsPinned(note.isPinned);
    setColor(note.color);
    
    const initialState = { title: note.title, content: note.content, listItems: note.listItems || [], image: note.image, color: note.color, tableData: note.tableData };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, [note.id]);

  useEffect(() => {
    if (textareaRef.current && !isList && !tableData) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isList, tableData]);

  const addToHistory = (newState: any) => {
    if (isInternalUpdate.current) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUpdate = (updates: Partial<Note>) => {
      onUpdate({ ...note, ...updates, updatedAt: Date.now() });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isInternalUpdate.current = true;
      const prevState = history[historyIndex - 1];
      setTitle(prevState.title);
      setContent(prevState.content);
      setListItems(prevState.listItems);
      setImage(prevState.image);
      setTableData(prevState.tableData);
      setColor(prevState.color || NoteColor.DEFAULT);
      handleUpdate(prevState);
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => isInternalUpdate.current = false, 0);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isInternalUpdate.current = true;
      const nextState = history[historyIndex + 1];
      setTitle(nextState.title);
      setContent(nextState.content);
      setListItems(nextState.listItems);
      setImage(nextState.image);
      setTableData(nextState.tableData);
      setColor(nextState.color || NoteColor.DEFAULT);
      handleUpdate(nextState);
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => isInternalUpdate.current = false, 0);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImage(result);
        handleUpdate({ image: result });
        addToHistory({ title, content, listItems, image: result, color, tableData });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagicCompose = async () => {
    setIsGenerating(true);
    try {
        let prompt = '';
        if (isList) {
             const listText = listItems.map(i => i.text).join(', ');
             prompt = `Rewrite and improve this checklist: ${title}. Items: ${listText}`;
        } else if (tableData) {
             prompt = `Suggest data for this table about ${title}. Columns are: ${tableData.rows[0].join(', ')}`;
        } else {
             prompt = title ? `Rewrite and improve this note: ${title}. ${content}` : `Improve this note: ${content}`;
        }
        const generated = await generateNoteContent(prompt);
        if (isList) {
            const lines = generated.split('\n').filter(l => l.trim());
            const newItems = lines.map(line => ({
                id: genId(), text: line.replace(/^[-*•]\s*/, '').trim(), checked: false, indentLevel: 0
            }));
            setListItems(newItems);
            handleUpdate({ listItems: newItems, isList: true });
            addToHistory({ title, content, listItems: newItems, image, color, tableData });
        } else {
            setContent(generated);
            handleUpdate({ content: generated });
            addToHistory({ title, content: generated, listItems, image, color, tableData });
        }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const toggleListMode = () => {
      let newState;
      setTableData(undefined);
      if (isList) {
          const text = listItems.map(i => i.text).join('\n');
          setContent(text);
          setIsList(false);
          newState = { isList: false, content: text, listItems: [], tableData: undefined };
      } else {
          const lines = content.split('\n');
          const items = lines.map(line => ({ id: genId(), text: line, checked: false, indentLevel: 0 }));
          const newList = items.length ? items : [{ id: genId(), text: '', checked: false, indentLevel: 0 }];
          setListItems(newList);
          setIsList(true);
          newState = { isList: true, listItems: newList, content: '', tableData: undefined };
      }
      handleUpdate(newState);
      addToHistory({ title, ...newState, image, color });
  };

  const addTable = () => {
    setIsList(false);
    setContent('');
    const newTable = { rows: [['', ''], ['', '']] };
    setTableData(newTable);
    handleUpdate({ tableData: newTable, isList: false, content: '' });
    addToHistory({ title, content: '', listItems: [], image, color, tableData: newTable });
  };

  const handleTableCellChange = (rIdx: number, cIdx: number, val: string) => {
    if (!tableData) return;
    const newRows = [...tableData.rows];
    newRows[rIdx][cIdx] = val;
    const nextTable = { rows: newRows };
    setTableData(nextTable);
    handleUpdate({ tableData: nextTable });
  };

  const addRow = () => {
    if (!tableData) return;
    const nextTable = { rows: [...tableData.rows, Array(tableData.rows[0].length).fill('')] };
    setTableData(nextTable);
    handleUpdate({ tableData: nextTable });
  };

  const addCol = () => {
    if (!tableData) return;
    const nextTable = { rows: tableData.rows.map(row => [...row, '']) };
    setTableData(nextTable);
    handleUpdate({ tableData: nextTable });
    // Adjust canvas width automatically
    if (setCanvasWidth) {
        setCanvasWidth(prev => prev + COLUMN_WIDTH_INC);
    }
  };

  const removeRow = (idx: number) => {
    if (!tableData || tableData.rows.length <= 1) return;
    const nextTable = { rows: tableData.rows.filter((_, i) => i !== idx) };
    setTableData(nextTable);
    handleUpdate({ tableData: nextTable });
  };

  const removeCol = (idx: number) => {
    if (!tableData || tableData.rows[0].length <= 1) return;
    const nextTable = { rows: tableData.rows.map(row => row.filter((_, i) => i !== idx)) };
    setTableData(nextTable);
    handleUpdate({ tableData: nextTable });
    // Adjust canvas width automatically
    if (setCanvasWidth) {
        setCanvasWidth(prev => Math.max(700, prev - COLUMN_WIDTH_INC));
    }
  };

  const adjustWidth = (inc: boolean) => {
      if (setCanvasWidth) {
          setCanvasWidth(prev => {
              const next = inc ? prev + COLUMN_WIDTH_INC : prev - COLUMN_WIDTH_INC;
              return Math.max(400, Math.min(2000, next));
          });
      }
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
      setShowColorOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={`w-full rounded-xl transition-all duration-300 ${ColorStyles[color]} ${color === NoteColor.DEFAULT ? 'border border-[var(--notebook-divider)]' : 'border-transparent'} shadow-2xl relative overflow-hidden`}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div className="flex flex-col">
        {image && (
            <div className="relative group w-full">
                <img src={image} alt="Note attachment" className="w-full h-auto max-h-[600px] object-contain bg-black/20" />
                <button 
                    onClick={(e) => { e.stopPropagation(); setImage(undefined); handleUpdate({ image: undefined }); addToHistory({ title, content, listItems, image: undefined, color, tableData }); }}
                    className="absolute bottom-4 right-4 p-3 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        )}
        <div className="flex justify-between items-center px-4 pt-4">
           <input
              id="edit-note-title"
              name="title"
              aria-label="Note title"
              type="text" value={title}
              readOnly={note.isTrashed}
              onChange={(e) => {
                  setTitle(e.target.value);
                  handleUpdate({ title: e.target.value });
                  addToHistory({ title: e.target.value, content, listItems, image, color, tableData });
              }}
              placeholder="Title"
              className="bg-transparent text-[var(--notebook-text)] placeholder-[var(--notebook-placeholder)] font-medium text-2xl outline-none w-full mr-4"
            />
            <div className="flex items-center gap-1">
                {!note.isTrashed && (
                  <button 
                    onClick={() => { const next = !isPinned; setIsPinned(next); handleUpdate({ isPinned: next }); }}
                    className={`p-2 rounded-full hover:bg-[var(--notebook-hover)] ${isPinned ? 'text-[var(--notebook-text)]' : 'text-[var(--notebook-muted)]'}`}
                    title={isPinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] hover:bg-[var(--notebook-hover)] rounded-full" title="Close editor">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
        <div className="px-4 py-6 min-h-[300px]">
            {tableData ? (
               <div className="overflow-x-auto custom-scrollbar pb-4">
                  <table className="w-full border-collapse border border-[var(--notebook-divider)] text-base">
                    <tbody>
                      {tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="border border-[var(--notebook-divider)] p-0 relative group/cell align-top">
                                <textarea 
                                  id={`edit-note-table-cell-${rIdx}-${cIdx}`}
                                  name={`table-cell-${rIdx}-${cIdx}`}
                                  aria-label={`Table cell row ${rIdx + 1} column ${cIdx + 1}`}
                                  value={cell}
                                  rows={1}
                                  readOnly={note.isTrashed}
                                  onChange={(e) => {
                                      handleTableCellChange(rIdx, cIdx, e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
                                    }
                                  }}
                                  className="w-full bg-transparent p-3 outline-none text-[var(--notebook-text)] placeholder-[var(--notebook-placeholder)] resize-none overflow-hidden block"
                                  placeholder="Cell..."
                                />
                                {rIdx === 0 && tableData.rows[0].length > 1 && !note.isTrashed && (
                                  <button onClick={() => removeCol(cIdx)} className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-cell/hover:opacity-100 text-[var(--notebook-muted)] hover:text-red-400 z-10 bg-[var(--note-default-bg)] rounded-full transition-opacity">
                                    <MinusSquare className="w-4 h-4" />
                                  </button>
                                )}
                                {cIdx === 0 && tableData.rows.length > 1 && !note.isTrashed && (
                                  <button onClick={() => removeRow(rIdx)} className="absolute top-1/2 -left-4 -translate-y-1/2 opacity-0 group-cell/hover:opacity-100 text-[var(--notebook-muted)] hover:text-red-400 z-10 bg-[var(--note-default-bg)] rounded-full transition-opacity">
                                    <MinusSquare className="w-4 h-4" />
                                  </button>
                                )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!note.isTrashed && (
                    <div className="flex gap-4 mt-4">
                       <button onClick={addRow} className="flex items-center gap-1.5 text-xs text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] bg-white/5 px-3 py-1.5 rounded transition-colors"><PlusSquare className="w-4 h-4" /> Add Row</button>
                       <button onClick={addCol} className="flex items-center gap-1.5 text-xs text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] bg-white/5 px-3 py-1.5 rounded transition-colors"><PlusSquare className="w-4 h-4" /> Add Column</button>
                       <button onClick={() => { setTableData(undefined); handleUpdate({ tableData: undefined }); }} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 ml-auto px-3 py-1.5 rounded bg-red-400/5 transition-colors"><Trash2 className="w-4 h-4" /> Remove Table</button>
                    </div>
                  )}
               </div>
            ) : isList ? (
                <div className="flex flex-col gap-1">
                    {listItems.map((item) => (
                        <div key={item.id} className="flex items-center group py-1" style={{ marginLeft: `${(item.indentLevel || 0) * 1.5}rem` }}>
                             {!note.isTrashed && <GripVertical className="w-4 h-4 text-[var(--notebook-placeholder)] opacity-0 group-hover:opacity-100 cursor-move mr-1" />}
                             <button 
                                disabled={note.isTrashed}
                                onClick={() => setListItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))} 
                                className="text-[var(--notebook-muted)] mr-2"
                             >
                                 {item.checked ? <CheckSquareIcon className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                             </button>
                             <input 
                                id={`edit-note-list-item-${item.id}`}
                                name={`list-item-${item.id}`}
                                aria-label="List item"
                                type="text" value={item.text}
                                readOnly={note.isTrashed}
                                onChange={(e) => {
                                    const newItems = listItems.map(i => i.id === item.id ? { ...i, text: e.target.value } : i);
                                    setListItems(newItems); handleUpdate({ listItems: newItems });
                                }}
                                onBlur={() => addToHistory({ title, content, listItems, image, color, tableData })}
                                className={`bg-transparent outline-none flex-1 text-base ${item.checked ? 'text-[var(--notebook-muted)] line-through' : 'text-[var(--notebook-text)]'}`}
                             />
                        </div>
                    ))}
                    {!note.isTrashed && (
                      <button className="flex items-center gap-3 px-8 py-2 text-[var(--notebook-muted)] hover:text-[var(--notebook-text)]" onClick={() => setListItems(prev => [...prev, { id: genId(), text: '', checked: false, indentLevel: 0 }])}>
                         <Plus className="w-4 h-4" /> <span>List item</span>
                      </button>
                    )}
                </div>
            ) : (
                <textarea
                    id="edit-note-content"
                    name="content"
                    aria-label="Note content"
                    ref={textareaRef} value={content}
                    readOnly={note.isTrashed}
                    onChange={(e) => { setContent(e.target.value); handleUpdate({ content: e.target.value }); }}
                    onBlur={() => addToHistory({ title, content, listItems, image, color, tableData })}
                    placeholder="Note"
                    className="w-full bg-transparent text-[var(--notebook-text)] placeholder-[var(--notebook-placeholder)] text-base outline-none resize-none min-h-[300px]"
                />
            )}
        </div>
        <div className="p-4 flex flex-col gap-4 border-t border-white/5">
            <div className="flex justify-between items-center">
                 <div className="flex gap-0.5 items-center">
                    {note.isTrashed ? (
                      <>
                        <ToolbarButton 
                          onClick={() => onRestore?.(note.id)} 
                          icon={<RotateCcw className="w-4 h-4" />} 
                          title="Restore" 
                        />
                        <div className="relative">
                            <ToolbarButton icon={<MoreVertical className="w-4 h-4" />} title="More" onClick={() => setShowMoreMenu(!showMoreMenu)} />
                            {showMoreMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--note-default-bg)] border border-[var(--notebook-divider)] rounded shadow-2xl z-40 py-1">
                                    <MenuOption icon={<Trash2 className="w-4 h-4" />} label="Delete forever" onClick={() => { onDelete(note.id); onClose(); }} />
                                </div>
                            )}
                        </div>
                      </>
                    ) : (
                      <>
                        <ToolbarButton icon={<BellIcon />} title="Remind me" />
                        
                        <div className="relative" ref={colorPickerRef}>
                            <ToolbarButton 
                                onClick={() => setShowColorOptions(!showColorOptions)} 
                                icon={<Palette className="w-4 h-4" />} 
                                title="Background options" 
                            />
                            {showColorOptions && (
                                <div className="absolute bottom-full left-0 mb-3 p-2 bg-[var(--note-default-bg)] border border-[var(--notebook-divider)] rounded-lg shadow-xl grid grid-cols-4 gap-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    {Object.values(NoteColor).map((c) => (
                                        <button 
                                            key={c} 
                                            title={c.charAt(0) + c.slice(1).toLowerCase()}
                                            className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                                              ${ColorStyles[c].split(' ')[0]} 
                                              ${color === c ? 'border-white ring-1 ring-white/50 scale-110' : 'border-transparent hover:border-white/30'}
                                            `}
                                            onClick={() => { 
                                                setColor(c); 
                                                handleUpdate({ color: c }); 
                                                addToHistory({ title, content, listItems, color: c, image, tableData }); 
                                                setShowColorOptions(false);
                                            }}
                                        >
                                          {color === c && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                                          {c === NoteColor.DEFAULT && color !== c && (
                                              <div className="w-4 h-4 rounded-full border border-white/20 relative overflow-hidden">
                                                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-400 -rotate-45" />
                                              </div>
                                          )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <ToolbarButton onClick={handleImageClick} icon={<ImageIcon className="w-4 h-4" />} title="Add Image" />
                        <ToolbarButton 
                            onClick={() => { const next = !note.isArchived; handleUpdate({ isArchived: next }); onClose(); }} 
                            icon={<Archive className="w-4 h-4" />} 
                            title={note.isArchived ? "Unarchive" : "Archive"} 
                        />
                        <div className="relative">
                            <ToolbarButton icon={<MoreVertical className="w-4 h-4" />} title="More" onClick={() => setShowMoreMenu(!showMoreMenu)} />
                            {showMoreMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[var(--note-default-bg)] border border-[var(--notebook-divider)] rounded shadow-2xl z-40 py-1">
                                    <MenuOption icon={<Trash2 className="w-4 h-4" />} label="Delete note" onClick={() => { onDelete(note.id); onClose(); }} />
                                    <MenuOption icon={<Tag className="w-4 h-4" />} label="Add label" onClick={() => setShowMoreMenu(false)} />
                                    <MenuOption icon={<Copy className="w-4 h-4" />} label="Make a copy" onClick={() => { onDuplicate?.(note); setShowMoreMenu(false); }} />
                                </div>
                            )}
                        </div>
                        <ToolbarButton icon={<CheckSquare className="w-4 h-4" />} title="Toggle checkboxes" onClick={toggleListMode} />
                        <ToolbarButton icon={<TableIcon className="w-4 h-4" />} title="Add table" onClick={addTable} />
                        
                        <div className="h-4 w-[1px] bg-[var(--notebook-divider)] mx-1" />
                        <ToolbarButton icon={<Minus className="w-4 h-4" />} title="Decrease canvas width" onClick={() => adjustWidth(false)} />
                        <ToolbarButton icon={<Plus className="w-4 h-4" />} title="Increase canvas width" onClick={() => adjustWidth(true)} />
                        <div className="h-4 w-[1px] bg-[var(--notebook-divider)] mx-1" />

                        <ToolbarButton 
                            onClick={handleMagicCompose}
                            icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-blue-300" /> : <Sparkles className="w-4 h-4 text-blue-300" />}
                            title="Magic Compose (Gemini)"
                        />
                        <ToolbarButton icon={<RotateCcw className={`w-4 h-4 ${historyIndex <= 0 ? 'opacity-30' : ''}`} />} title="Undo" onClick={handleUndo} />
                        <ToolbarButton icon={<RotateCw className={`w-4 h-4 ${historyIndex >= history.length - 1 ? 'opacity-30' : ''}`} />} title="Redo" onClick={handleRedo} />
                      </>
                    )}
                 </div>
                 <button onClick={onClose} className="px-6 py-2 text-[var(--notebook-text)] font-medium text-sm rounded hover:bg-[var(--notebook-hover)] transition-colors">Close</button>
            </div>
            <div className="text-[11px] text-[var(--notebook-muted)] text-right">
                {note.updatedAt ? `Edited ${new Date(note.updatedAt).toLocaleDateString()} ${new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </div>
        </div>
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick?: (e: React.MouseEvent) => void }) => (
    <button onClick={onClick} className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] hover:bg-[var(--notebook-hover)] transition-colors" title={title}>{icon}</button>
);

const MenuOption = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--notebook-text)] hover:bg-[var(--notebook-hover)] text-left">{icon}{label}</button>
);

const BellIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;

export default NoteEditor;
