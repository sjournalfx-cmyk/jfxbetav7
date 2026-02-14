
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, CheckSquare, Paintbrush, Pin, RotateCcw, RotateCw, Sparkles, Loader2, X, Plus, Minus, Square, CheckSquare as CheckSquareIcon, GripVertical, Palette, Archive, MoreVertical, Trash2, Check, Table as TableIcon, PlusSquare, MinusSquare } from 'lucide-react';
import { Note, NoteColor, ColorStyles, ListItem, TableData } from './types';
import { generateNoteContent } from '../../services/notesGeminiService';

interface CreateAreaProps {
  onCreate: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'isTrashed' | 'labels'>) => void;
  canvasWidth?: number;
  setCanvasWidth?: React.Dispatch<React.SetStateAction<number>>;
}

const genId = () => Math.random().toString(36).slice(2, 9);
const COLUMN_WIDTH_INC = 120;

const CreateArea: React.FC<CreateAreaProps> = ({ onCreate, canvasWidth, setCanvasWidth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isList, setIsList] = useState(false);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [tableData, setTableData] = useState<TableData | undefined>(undefined);
  
  const [isPinned, setIsPinned] = useState(false);
  const [color, setColor] = useState<NoteColor>(NoteColor.DEFAULT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showColorOptions, setShowColorOptions] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = (e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      // Keep open until Save Note is pressed as per user request
    }
    if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
      setShowColorOptions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [title, content, listItems, isList, color, isPinned, isExpanded, image, tableData]);

  const hasContent = title.trim() || (isList ? listItems.some(item => item.text.trim().length > 0) : content.trim()) || image || (tableData && tableData.rows.some(row => row.some(cell => cell.trim().length > 0)));

  const discard = () => {
    setTitle('');
    setContent('');
    setIsList(false);
    setListItems([]);
    setImage(undefined);
    setTableData(undefined);
    setIsPinned(false);
    setColor(NoteColor.DEFAULT);
    setIsExpanded(false);
    setShowColorOptions(false);
  };

  const saveAndClose = () => {
    if (!isExpanded) return;

    const validItems = listItems.filter(item => item.text.trim().length > 0);
    const hasTableContent = tableData && tableData.rows.some(row => row.some(cell => cell.trim().length > 0));

    if (title.trim() || (isList ? validItems.length > 0 : content.trim()) || image || hasTableContent) {
      onCreate({
        title,
        content: isList ? '' : content,
        isList,
        listItems: isList ? validItems : [],
        isPinned,
        color,
        image,
        tableData: hasTableContent ? tableData : undefined,
      });
    }
    discard();
  };

  const handleExpand = (startAsList = false) => {
    setIsExpanded(true);
    if (startAsList) {
        setIsList(true);
        setListItems([{ id: genId(), text: '', checked: false, indentLevel: 0 }]);
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    setContent(e.target.value);
  };
  
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isExpanded) setIsExpanded(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagicCompose = async () => {
    if (!content.trim() && !title.trim() && listItems.length === 0 && !tableData) return;
    setIsGenerating(true);
    try {
        let prompt = '';
        if (isList) {
            const listText = listItems.map(i => i.text).join(', ');
            prompt = `Create a checklist based on: ${title}. Context: ${listText}`;
        } else if (tableData) {
            prompt = `Provide data for this table about: ${title}. Columns: ${tableData.rows[0].join(', ')}`;
        } else {
            prompt = title ? `Write a detailed note about: ${title}. ${content}` : `Elaborate on this note: ${content}`;
        }
        
        const generated = await generateNoteContent(prompt);
        
        if (isList) {
            const lines = generated.split('\n').filter(l => l.trim());
            const newItems = lines.map(line => ({
                id: genId(),
                text: line.replace(/^[-*•]\s*/, '').trim(), 
                checked: false,
                indentLevel: 0
            }));
            setListItems(prev => [...prev, ...newItems]);
        } else {
            setContent(prev => prev ? `${prev}\n\n${generated}` : generated);
            setTimeout(() => {
                if(textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                }
            }, 10);
        }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const toggleListMode = () => {
      setTableData(undefined); // Reset table if switching to list
      if (isList) {
          const text = listItems.map(i => i.text).join('\n');
          setContent(text);
          setIsList(false);
      } else {
          const lines = content.split('\n');
          const items = lines.map(line => ({ id: genId(), text: line, checked: false, indentLevel: 0 }));
          setListItems(items.length ? items : [{ id: genId(), text: '', checked: false, indentLevel: 0 }]);
          setIsList(true);
      }
  };

  const addTable = () => {
    setIsList(false);
    setContent('');
    setTableData({
      rows: [['', ''], ['', '']]
    });
    if (!isExpanded) setIsExpanded(true);
  };

  const handleTableCellChange = (rowIndex: number, colIndex: number, value: string) => {
    if (!tableData) return;
    const newRows = [...tableData.rows];
    newRows[rowIndex][colIndex] = value;
    setTableData({ rows: newRows });
  };

  const addRow = () => {
    if (!tableData) return;
    const colCount = tableData.rows[0].length;
    setTableData({ rows: [...tableData.rows, Array(colCount).fill('')] });
  };

  const addCol = () => {
    if (!tableData) return;
    setTableData({ rows: tableData.rows.map(row => [...row, '']) });
    // Adjust canvas width automatically
    if (setCanvasWidth) {
        setCanvasWidth(prev => prev + COLUMN_WIDTH_INC);
    }
  };

  const removeRow = (idx: number) => {
    if (!tableData || tableData.rows.length <= 1) return;
    setTableData({ rows: tableData.rows.filter((_, i) => i !== idx) });
  };

  const removeCol = (idx: number) => {
    if (!tableData || tableData.rows[0].length <= 1) return;
    setTableData({ rows: tableData.rows.map(row => row.filter((_, i) => i !== idx)) });
    // Adjust canvas width automatically
    if (setCanvasWidth) {
        setCanvasWidth(prev => Math.max(600, prev - COLUMN_WIDTH_INC));
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

  return (
    <div className="w-full relative z-10">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div 
        ref={containerRef}
        className={`relative w-full rounded-xl transition-all duration-300 bg-[var(--note-default-bg)] overflow-hidden
            ${isExpanded ? 'shadow-[0_1px_2px_0_rgba(0,0,0,0.6),0_2px_6px_2px_rgba(0,0,0,0.3)]' : 'shadow-[0_1px_2px_0_rgba(0,0,0,0.6),0_1px_3px_1px_rgba(0,0,0,0.3)]'}
            ${ColorStyles[color]}
            ${color === NoteColor.DEFAULT ? 'border border-[var(--notebook-divider)]' : 'border-transparent'}
        `}
      >
        {!isExpanded ? (
          <div onClick={() => handleExpand(false)} className="flex items-center justify-between px-4 py-3 cursor-text h-[46px]">
            <span className="text-[var(--notebook-text)] font-medium text-[1rem] tracking-wide placeholder-text opacity-70">Take a note...</span>
            <div className="flex gap-2 text-[var(--notebook-muted)] items-center">
              <button onClick={(e) => { e.stopPropagation(); handleExpand(true); }} className="p-2 hover:bg-[var(--notebook-hover)] rounded-full transition-colors" title="New list">
                  <CheckSquare className="w-5 h-5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); addTable(); }} className="p-2 hover:bg-[var(--notebook-hover)] rounded-full transition-colors" title="New table">
                  <TableIcon className="w-5 h-5" />
              </button>
              <button onClick={handleImageClick} className="p-2 hover:bg-[var(--notebook-hover)] rounded-full transition-colors" title="New note with image">
                  <ImageIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {image && (
                <div className="relative w-full group">
                    <img src={image} alt="Preview" className="w-full max-h-[400px] object-cover" />
                    <button 
                        onClick={(e) => { e.stopPropagation(); setImage(undefined); }}
                        className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="flex justify-between items-start px-4 pt-4 pb-0">
              <input
                id="create-note-title"
                name="title"
                aria-label="Note title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-transparent text-[var(--notebook-text)] placeholder-[var(--notebook-placeholder)] font-medium text-[1.1rem] outline-none"
              />
              <button onClick={() => setIsPinned(!isPinned)} className={`p-2 rounded-full hover:bg-neutral-600/30 transition-colors ${isPinned ? 'text-[var(--notebook-text)]' : 'text-[var(--notebook-muted)]'}`}>
                <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
              </button>
            </div>
            
            <div className="py-3 px-0 min-h-[46px]">
                {tableData ? (
                  <div className="px-4 overflow-x-auto pb-4 custom-scrollbar">
                    <table className="w-full border-collapse border border-[var(--notebook-divider)] text-sm">
                      <tbody>
                        {tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border border-[var(--notebook-divider)] p-0 relative group/cell align-top">
                                <textarea 
                                  id={`create-note-table-cell-${rIdx}-${cIdx}`}
                                  name={`table-cell-${rIdx}-${cIdx}`}
                                  aria-label={`Table cell row ${rIdx + 1} column ${cIdx + 1}`}
                                  value={cell}
                                  rows={1}
                                  onChange={(e) => {
                                      handleTableCellChange(rIdx, cIdx, e.target.value);
                                      e.target.style.height = 'auto';
                                      e.target.style.height = e.target.scrollHeight + 'px';
                                  }}
                                  className="w-full bg-transparent p-2 outline-none text-[var(--notebook-text)] placeholder-[var(--notebook-placeholder)] resize-none overflow-hidden block"
                                  placeholder="Cell..."
                                />
                                {rIdx === 0 && tableData.rows[0].length > 1 && (
                                  <button onClick={() => removeCol(cIdx)} className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-cell/hover:opacity-100 text-[var(--notebook-muted)] hover:text-red-400 z-10 bg-[var(--note-default-bg)] rounded-full transition-opacity">
                                    <MinusSquare className="w-3 h-3" />
                                  </button>
                                )}
                                {cIdx === 0 && tableData.rows.length > 1 && (
                                  <button onClick={() => removeRow(rIdx)} className="absolute top-1/2 -left-3 -translate-y-1/2 opacity-0 group-cell/hover:opacity-100 text-[var(--notebook-muted)] hover:text-red-400 z-10 bg-[var(--note-default-bg)] rounded-full transition-opacity">
                                    <MinusSquare className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="flex gap-2 mt-2">
                       <button onClick={addRow} className="flex items-center gap-1 text-[11px] text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] transition-colors"><PlusSquare className="w-3.5 h-3.5" /> Row</button>
                       <button onClick={addCol} className="flex items-center gap-1 text-[11px] text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] transition-colors"><PlusSquare className="w-3.5 h-3.5" /> Col</button>
                       <button onClick={() => setTableData(undefined)} className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete Table</button>
                    </div>
                  </div>
                ) : isList ? (
                    <div className="flex flex-col">
                        {listItems.map((item, index) => (
                            <div key={item.id} className="flex items-center group px-4 py-1" style={{ marginLeft: item.indentLevel ? `${item.indentLevel * 1.5}rem` : '0px' }}>
                                <div className="cursor-move text-[var(--notebook-muted)] p-1 mr-1 opacity-0 group-hover:opacity-100">
                                    <GripVertical className="w-4 h-4" />
                                </div>
                                <button onClick={() => setListItems(prev => prev.map(i => i.id === item.id ? { ...i, checked: !i.checked } : i))} className="p-1 mr-2 text-[var(--notebook-muted)]">
                                    {item.checked ? <CheckSquareIcon className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                                <input 
                                    id={`create-note-list-item-${item.id}`}
                                    name={`list-item-${item.id}`}
                                    aria-label={`List item ${index + 1}`}
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => setListItems(prev => prev.map(i => i.id === item.id ? { ...i, text: e.target.value } : i))}
                                    className={`w-full bg-transparent outline-none text-[0.875rem] ${item.checked ? 'text-[var(--notebook-muted)] line-through' : 'text-[var(--notebook-text)]'}`}
                                    placeholder={listItems.length === 1 ? "List item" : ""}
                                />
                                <button onClick={() => setListItems(prev => prev.filter(i => i.id !== item.id))} className="p-2 text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] opacity-0 group-hover:opacity-100">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                         <div className="flex items-center px-4 py-1 text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] cursor-pointer" onClick={() => setListItems(prev => [...prev, { id: genId(), text: '', checked: false, indentLevel: 0 }])}>
                            <Plus className="w-4 h-4 mr-3 ml-7" />
                            <span className="text-[0.875rem]">List item</span>
                        </div>
                    </div>
                ) : (
                    <textarea
                        id="create-note-content"
                        name="content"
                        aria-label="Note content"
                        ref={textareaRef}
                        value={content}
                        onChange={autoResize}
                        placeholder="Take a note..."
                        className="w-full bg-transparent text-[var(--notebook-text)] placeholder-[var(--notebook-placeholder)] text-[0.875rem] px-4 outline-none resize-none min-h-[46px]"
                        rows={1} autoFocus
                    />
                )}
            </div>
            
            <div className="flex justify-between items-center px-2 pb-2">
              <div className="flex gap-0 items-center">
                 <ToolbarButton icon={<BellIcon />} title="Remind me" />
                 
                 <div className="relative" ref={colorPickerRef}>
                    <ToolbarButton 
                      onClick={() => setShowColorOptions(!showColorOptions)} 
                      icon={<Palette className="w-4 h-4" />} 
                      title="Background options" 
                    />
                    {showColorOptions && (
                      <div className="absolute bottom-full left-0 mb-3 p-2 bg-[#2d2e30] border border-[var(--notebook-divider)] rounded-lg shadow-xl grid grid-cols-4 gap-2 z-40 animate-in fade-in zoom-in-95 duration-150">
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
                 <ToolbarButton icon={<Archive className="w-4 h-4" />} title="Archive" />
                 <ToolbarButton icon={<MoreVertical className="w-4 h-4" />} title="More" />
                 <ToolbarButton icon={<CheckSquare className="w-4 h-4" />} title="Toggle checkboxes" onClick={toggleListMode} />
                 <ToolbarButton icon={<TableIcon className="w-4 h-4" />} title="Add table" onClick={addTable} />
                 
                 <div className="h-4 w-[1px] bg-[var(--notebook-divider)] mx-1" />
                 <ToolbarButton icon={<Minus className="w-4 h-4" />} title="Decrease canvas width" onClick={() => adjustWidth(false)} />
                 <ToolbarButton icon={<Plus className="w-4 h-4" />} title="Increase canvas width" onClick={() => adjustWidth(true)} />
                 <div className="h-4 w-[1px] bg-[var(--notebook-divider)] mx-1" />

                 <ToolbarButton onClick={handleMagicCompose} icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-blue-300" /> : <Sparkles className="w-4 h-4 text-blue-300" />} title="Help me write (Gemini)" />
                 <ToolbarButton icon={<RotateCcw className="w-4 h-4" />} title="Undo" />
                 <ToolbarButton icon={<RotateCw className="w-4 h-4" />} title="Redo" />
              </div>
              <div className="flex gap-2 items-center sticky bottom-0">
                {hasContent && (
                  <button 
                    onClick={discard} 
                    className="px-4 py-2 text-red-400 font-medium text-sm rounded-md hover:bg-red-400/10 transition-colors"
                  >
                    Discard
                  </button>
                )}
                <button 
                  onClick={saveAndClose} 
                  className="px-6 py-2 text-[var(--notebook-text)] font-medium text-sm rounded-md hover:bg-[var(--notebook-hover)] transition-colors"
                >
                  {hasContent ? 'Save note' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick?: (e: React.MouseEvent) => void }) => (
    <button onClick={onClick} className="w-8 h-8 flex items-center justify-center rounded-full text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-neutral-600/30 transition-colors mx-0.5" title={title}>{icon}</button>
)

const BellIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;

export default CreateArea;
