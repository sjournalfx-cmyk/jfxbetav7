
import React, { useState } from 'react';
import { Pin, Image as ImageIcon, Archive, MoreVertical, CheckCircle2, Square, CheckSquare, Trash2, RotateCcw } from 'lucide-react';
import { Note, ColorStyles } from './types';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
  onPin: (e: React.MouseEvent, note: Note) => void;
  onArchive: (e: React.MouseEvent, note: Note) => void;
  onDelete?: (e: React.MouseEvent, note: Note) => void;
  onRestore?: (e: React.MouseEvent, note: Note) => void;
  onUpdate?: (note: Note) => void;
  onDragStart?: (note: Note) => void;
  onDragEnd?: () => void;
  onDrop?: (targetNote: Note) => void;
  isDragging?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onClick, 
  onPin, 
  onArchive, 
  onDelete,
  onRestore,
  onUpdate,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const renderContent = () => {
    if (note.isList && note.listItems && note.listItems.length > 0) {
      const maxItems = 4;
      const visibleItems = note.listItems.slice(0, maxItems);
      const remaining = note.listItems.length - maxItems;

      return (
        <div className="flex flex-col gap-0.5 mt-1 pointer-events-none">
          {visibleItems.map(item => (
            <div 
                key={item.id} 
                className="flex items-start gap-1.5 py-0.5"
                style={{ marginLeft: item.indentLevel ? `${item.indentLevel * 1}rem` : '0px' }}
            >
              <div className="mt-0.5 text-[var(--notebook-muted)] shrink-0">
                {item.checked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[0.8rem] leading-tight break-words line-clamp-2 ${item.checked ? 'line-through text-[var(--notebook-muted)] opacity-60' : 'text-[var(--notebook-text)]'}`}>
                {item.text}
              </span>
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-[var(--notebook-muted)] text-[0.7rem] mt-0.5 pl-5">
              + {remaining} more items
            </div>
          )}
        </div>
      );
    }

    if (note.tableData && note.tableData.rows.length > 0) {
      const maxRows = 3;
      const visibleRows = note.tableData.rows.slice(0, maxRows);
      
      return (
        <div className="mt-2 overflow-hidden border border-[var(--notebook-divider)] rounded text-[0.7rem] pointer-events-none">
          <table className="w-full border-collapse">
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--notebook-divider)] last:border-0">
                  {row.slice(0, 3).map((cell, j) => (
                    <td key={j} className="p-1 border-r border-[var(--notebook-divider)] last:border-0 truncate max-w-[60px] text-[var(--notebook-text)] opacity-80">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {note.tableData.rows.length > maxRows && (
            <div className="text-[0.6rem] text-[var(--notebook-muted)] p-1 text-center bg-black/5">... more rows</div>
          )}
        </div>
      );
    }

    return (
      <div className="text-[var(--notebook-text)] text-[0.8rem] leading-normal whitespace-pre-wrap break-words opacity-85 line-clamp-5 pointer-events-none">
          {note.content}
      </div>
    );
  };

  return (
    <div
      draggable={!note.isTrashed}
      onDragStart={() => !note.isTrashed && onDragStart?.(note)}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={handleDragOver}
      onDrop={() => !note.isTrashed && onDrop?.(note)}
      className={`relative rounded-xl border transition-all duration-200 ease-out cursor-grab active:cursor-grabbing group overflow-hidden
        ${ColorStyles[note.color]} 
        ${note.color === 'DEFAULT' ? 'border-[var(--notebook-divider)]' : 'border-transparent'}
        ${isDragging ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
        hover:border-[var(--notebook-text)]/30 hover:shadow-lg
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(note)}
    >
      {note.image && (
          <div className="w-full h-auto max-h-48 overflow-hidden border-b border-white/5 pointer-events-none">
              <img src={note.image} alt="Note attachment" className="w-full object-cover" />
          </div>
      )}
      <div className="p-3 pb-2">
        <div className="flex justify-between items-start mb-1.5 pointer-events-none">
          {note.title ? (
            <h3 className="text-[var(--notebook-text)] font-medium text-[0.95rem] leading-snug break-words w-[85%]">
              {note.title}
            </h3>
          ) : (
             <div className="h-4 w-full"></div> 
          )}
          {!note.isTrashed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(e, note);
              }}
              className={`text-[var(--notebook-text)] p-1.5 -mr-1 -mt-1 rounded-full hover:bg-[var(--notebook-hover)] transition-all duration-150 pointer-events-auto ${isHovered || note.isPinned ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
              title={note.isPinned ? "Unpin note" : "Pin note"}
            >
              <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {renderContent()}

        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pointer-events-none">
            {note.labels.map((label) => (
              <span key={label} className="bg-black/20 text-[var(--notebook-text)] text-[0.6rem] px-1.5 py-0.5 rounded-full font-medium">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`h-[32px] flex items-center justify-between px-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex items-center gap-1">
             {note.isTrashed ? (
               <>
                 <ToolbarButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(e, note);
                    }}
                    icon={<Trash2 className="w-3 h-3" />} 
                    title="Delete forever" 
                 />
                 <ToolbarButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore?.(e, note);
                    }}
                    icon={<RotateCcw className="w-3 h-3" />} 
                    title="Restore" 
                 />
               </>
             ) : (
               <>
                 <ToolbarButton icon={<BellIcon />} title="Remind me" />
                 <ToolbarButton icon={<ImageIcon className="w-3 h-3" />} title="Add image" />
                 <ToolbarButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(e, note);
                    }}
                    icon={<Archive className="w-3 h-3" />} 
                    title={note.isArchived ? "Unarchive" : "Archive"} 
                 />
                 <ToolbarButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(e, note);
                    }}
                    icon={<Trash2 className="w-3 h-3" />} 
                    title="Delete" 
                 />
                 <ToolbarButton icon={<MoreVertical className="w-3 h-3" />} title="More" />
               </>
             )}
         </div>
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon, title, onClick }: { icon: React.ReactNode, title: string, onClick?: (e: React.MouseEvent) => void }) => (
    <button 
        onClick={(e) => {
            e.stopPropagation();
            if(onClick) onClick(e);
        }}
        className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--notebook-muted)] hover:text-[var(--notebook-text)] hover:bg-[var(--notebook-hover)] transition-colors" 
        title={title}
    >
        {icon}
    </button>
)

const BellIcon = () => <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;

export default NoteCard;
