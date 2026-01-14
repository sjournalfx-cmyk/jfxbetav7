import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Underline } from '@tiptap/extension-underline';
import { Link as TiptapLink } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import {
  Bold, Italic, Underline as UnderlineIcon, List,
  ListChecks, Table as TableIcon, Eraser, Type,
  Plus, Trash2, PlusCircle, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, Combine, Split, GripHorizontal,
  Palette, Image as ImageIcon
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import ImageNode from './RichTextEditorImage';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  isDarkMode: boolean;
  minHeight?: string;
  className?: string;
  customToolbarItems?: React.ReactNode;
  showTooltips?: boolean;
  showToolbar?: boolean;
  onImageUpload?: (file: File) => Promise<string | null>;
}

const TEXT_COLORS = [
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Emerald', color: '#10b981' },
  { name: 'Amber', color: '#f59e0b' },
];

const CELL_COLORS = [
  { name: 'None', color: 'transparent' },
  { name: 'Indigo', color: 'rgba(99, 102, 241, 0.15)' },
  { name: 'Emerald', color: 'rgba(16, 185, 129, 0.15)' },
  { name: 'Amber', color: 'rgba(245, 158, 11, 0.15)' },
  { name: 'Rose', color: 'rgba(244, 63, 94, 0.15)' },
  { name: 'Slate', color: 'rgba(71, 85, 105, 0.15)' },
];

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) {
            return {}
          }
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          }
        },
      },
    }
  },
});

const CustomImage = Image.extend({
  draggable: true,
  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '200px',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      align: {
        default: 'center',
        renderHTML: attributes => ({
          'data-align': attributes.align,
        }),
      },
      hasBorder: {
        default: false,
        renderHTML: attributes => ({
          'data-border': attributes.hasBorder,
        }),
      },
      layout: {
        default: 'block',
        renderHTML: attributes => ({
          'data-layout': attributes.layout,
        }),
      },
      caption: {
        default: '',
        renderHTML: attributes => ({
          'data-caption': attributes.caption,
        }),
      },
      borderColor: {
        default: 'auto',
        renderHTML: attributes => ({
          'data-border-color': attributes.borderColor,
        }),
      },
    };
  },
});

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  isDarkMode,
  minHeight = '150px',
  className = '',
  customToolbarItems,
  showTooltips = true,
  showToolbar = false,
  onImageUpload
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        underline: false,
        // Link is included in StarterKit
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-indigo-500 underline cursor-pointer',
          },
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      CustomTableCell,
      TextStyle,
      Color,
      Underline,
      Placeholder.configure({ placeholder }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const editorRef = React.useRef<HTMLDivElement>(null);
  const [tableInfo, setTableInfo] = React.useState<{ rect: DOMRect, element: HTMLElement } | null>(null);
  const [menuOffset, setMenuOffset] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartPos = React.useRef({ x: 0, y: 0 });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

  const openConfirm = (title: string, description: string, onConfirm: () => void, variant: 'danger' | 'warning' | 'info' = 'danger') => {
    setConfirmModal({ isOpen: true, title, description, onConfirm, variant });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && editor) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (onImageUpload) {
          // Use provided upload handler
          const url = await onImageUpload(file);
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        } else {
          // Fallback to Base64
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            editor.chain().focus().setImage({ src: result }).run();
          };
          reader.readAsDataURL(file);
        }
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sync content if it changes externally

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Track active table for UI buttons
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { selection } = editor.state;
      let dom = editor.view.domAtPos(selection.from).node;

      // Handle the case where dom is a text node
      if (dom.nodeType === Node.TEXT_NODE) {
        dom = dom.parentNode!;
      }

      let foundTable = false;
      let current = dom as HTMLElement;
      while (current && current !== editor.view.dom) {
        if (current.tagName === 'TABLE') {
          const rect = current.getBoundingClientRect();
          const containerRect = editorRef.current?.getBoundingClientRect();
          setTableInfo({
            rect,
            element: current
          });

          // Set initial menu position if not set
          if (menuOffset.x === 0 && menuOffset.y === 0 && containerRect) {
            setMenuOffset({
              x: Math.max(20, rect.left - containerRect.left),
              y: Math.max(20, rect.top - containerRect.top - 80)
            });
          }

          foundTable = true;
          break;
        }
        current = current.parentElement!;
      }
      if (!foundTable) {
        setTableInfo(null);
        // Reset menu offset when table is lost so it re-centers next time
        setMenuOffset({ x: 0, y: 0 });
      }
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    const container = editorRef.current;
    if (container) {
      container.addEventListener('scroll', update, true);
    }
    window.addEventListener('resize', update);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
      if (container) {
        container.removeEventListener('scroll', update, true);
      }
      window.removeEventListener('resize', update);
    };
  }, [editor]);

  // Drag logic for Bubble Menu
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setMenuOffset({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y,
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!editor) return null;

  return (
    <div
      ref={editorRef}
      className={`flex flex-col rounded-xl border transition-all relative ${isDarkMode ? 'bg-[#18181b] border-[#27272a] focus-within:border-indigo-500/50' : 'bg-white border-slate-200 focus-within:border-indigo-500'} ${className}`}
    >
      {showToolbar && (
        <div className={`flex flex-wrap items-center gap-0.5 p-1 border-b transition-colors rounded-t-xl ${isDarkMode ? 'border-[#27272a] bg-zinc-900/50' : 'border-slate-200 bg-slate-50/50'}`}>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            title="Bold"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            title="Italic"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            icon={UnderlineIcon}
            title="Underline"
            showTooltip={showTooltips}
          />

          <ToolbarDivider />

          <div className="flex items-center gap-1 mx-1 px-1 border-x border-zinc-500/20">
            {TEXT_COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => editor.chain().focus().setColor(c.color).run()}
                className={`w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125 ${editor.isActive('textStyle', { color: c.color }) ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                title={c.name}
                style={{ backgroundColor: c.color }}
              />
            ))}
            <ToolbarButton
              onClick={() => editor.chain().focus().unsetColor().run()}
              icon={Type}
              title="Reset Color"
              className="opacity-60"
              showTooltip={showTooltips}
            />
          </div>

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={List}
            title="Bullet List"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            isActive={editor.isActive('taskList')}
            icon={ListChecks}
            title="Checklist"
            showTooltip={showTooltips}
          />

          <ToolbarDivider />

          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 5, withHeaderRow: false }).run()}
            icon={TableIcon}
            title="Insert Table"
            showTooltip={showTooltips}
          />
          
          <ToolbarButton
            onClick={handleImageClick}
            icon={ImageIcon}
            title="Insert Image"
            showTooltip={showTooltips}
          />

          {customToolbarItems && (
            <>
              <ToolbarDivider />
              {customToolbarItems}
            </>
          )}

          <div className="flex-1" />

          <ToolbarButton
            onClick={() => {
              openConfirm(
                'Clear Content',
                'Are you sure you want to clear all content? This action cannot be undone.',
                () => editor.commands.clearContent(),
                'danger'
              );
            }}
            icon={Eraser}
            title="Clear All Content"
            className="text-rose-500 hover:bg-rose-500/10"
            showTooltip={showTooltips}
          />
        </div>
      )}

      {/* Bubble Menu for Text Formatting */}
      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor, state }) => {
            return !editor.isActive('table') && !state.selection.empty;
          }}
          className={`flex items-center gap-0.5 p-1 rounded-xl shadow-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
        >
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            title="Bold"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            title="Italic"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            icon={UnderlineIcon}
            title="Underline"
            showTooltip={showTooltips}
          />
          <div className="w-px h-4 bg-zinc-500/20 mx-1" />
          <div className="flex items-center gap-1 mx-1">
            {TEXT_COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => editor.chain().focus().setColor(c.color).run()}
                className={`w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-125 ${editor.isActive('textStyle', { color: c.color }) ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                title={c.name}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </BubbleMenu>
      )}

      {/* Custom Draggable Table Menu */}
      {editor && tableInfo && (
        <div
          className={`absolute z-[100] flex flex-wrap items-center gap-0.5 p-1 rounded-xl shadow-2xl border select-none transition-shadow ${isDarkMode ? 'bg-[#18181b] border-[#27272a] shadow-black/50' : 'bg-white border-slate-200 shadow-slate-200/50'}`}
          style={{
            left: menuOffset.x,
            top: menuOffset.y,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          <div
            className="p-1.5 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-indigo-500 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
              dragStartPos.current = { x: e.clientX - menuOffset.x, y: e.clientY - menuOffset.y };
            }}
          >
            <GripHorizontal size={16} />
          </div>

          <div className="w-px h-4 bg-zinc-500/20 mx-1" />

          {/* Cell Color Picker */}
          <div className="flex items-center gap-1 px-1">
            <Palette size={14} className="text-zinc-500 mr-1" />
            {CELL_COLORS.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => editor.chain().focus().setCellAttribute('backgroundColor', c.color).run()}
                className={`w-5 h-5 rounded border border-black/10 transition-transform hover:scale-125 ${editor.isActive('tableCell', { backgroundColor: c.color }) ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                title={`Cell Color: ${c.name}`}
                style={{ backgroundColor: c.color === 'transparent' ? (isDarkMode ? '#27272a' : '#f1f5f9') : c.color }}
              />
            ))}
          </div>

          <div className="w-px h-4 bg-zinc-500/20 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            icon={Plus}
            title="Add Col After"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            icon={Plus}
            title="Add Row After"
            showTooltip={showTooltips}
          />

          <div className="w-px h-4 bg-zinc-500/20 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            icon={Trash2}
            className="text-rose-500 hover:bg-rose-500/10"
            title="Delete Col"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            icon={Trash2}
            className="text-rose-500 hover:bg-rose-500/10"
            title="Delete Row"
            showTooltip={showTooltips}
          />

          <div className="w-px h-4 bg-zinc-500/20 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().mergeCells().run()}
            icon={Combine}
            title="Merge Cells"
            showTooltip={showTooltips}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().splitCell().run()}
            icon={Split}
            title="Split Cell"
            showTooltip={showTooltips}
          />

          <div className="w-px h-4 bg-zinc-500/20 mx-1" />

          <ToolbarButton
            onClick={() => {
              openConfirm(
                'Delete Table',
                'Are you sure you want to delete the entire table?',
                () => editor.chain().focus().deleteTable().run(),
                'danger'
              );
            }}
            icon={Trash2}
            className="text-white bg-rose-500 hover:bg-rose-600 shadow-sm"
            title="Delete Table"
            showTooltip={showTooltips}
          />
        </div>
      )}

      {/* Editor Content */}
      <div
        className={`p-4 overflow-auto custom-scrollbar prose prose-sm max-w-none relative ${isDarkMode ? 'prose-invert' : ''}`}
        style={{ minHeight }}
        onScroll={() => {
          // No-op: Table info is updated on selection/transaction, 
          // and we use offsetTop/Left for stable positioning during scroll.
        }}
      >
        <EditorContent editor={editor} />

        {/* Table UI Buttons (Add Row/Col) */}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        style={{ display: 'none' }}
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />

      <style>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #64748b;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 1rem 0;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none !important;
          padding: 0 !important;
        }
        .ProseMirror ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
          cursor: pointer;
          width: 16px;
          height: 16px;
          margin-top: 4px;
          accent-color: #6366f1;
        }
        .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: auto;
          margin: 40px;
          margin-left: 48px;
          margin-top: 48px;
          overflow: visible;
          counter-reset: row;
        }
        .ProseMirror table tr {
          counter-increment: row;
          position: relative;
        }
        /* Row Headers */
        .ProseMirror table tr::before {
          content: counter(row);
          position: absolute;
          left: -32px;
          top: 0;
          bottom: 0;
          width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isDarkMode ? '#18181b' : '#f1f5f9'};
          border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'};
          border-right: 2px solid ${isDarkMode ? '#52525b' : '#cbd5e1'};
          font-size: 12px;
          color: ${isDarkMode ? '#a1a1aa' : '#64748b'};
          font-weight: 600;
          z-index: 1;
        }
        /* Column Headers */
        .ProseMirror table tr:first-child {
          counter-reset: col;
        }
        .ProseMirror table tr:first-child td, 
        .ProseMirror table tr:first-child th {
          counter-increment: col;
          position: relative;
        }
        .ProseMirror table tr:first-child td::after,
        .ProseMirror table tr:first-child th::after {
          content: counter(col, upper-alpha);
          position: absolute;
          top: -32px;
          left: 0;
          right: 0;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isDarkMode ? '#18181b' : '#f1f5f9'};
          border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'};
          border-bottom: 2px solid ${isDarkMode ? '#52525b' : '#cbd5e1'};
          font-size: 12px;
          color: ${isDarkMode ? '#a1a1aa' : '#64748b'};
          font-weight: 600;
          z-index: 1;
        }
        /* Top-left corner */
        .ProseMirror table tr:first-child::after {
          content: "";
          position: absolute;
          top: -32px;
          left: -32px;
          width: 32px;
          height: 32px;
          background: ${isDarkMode ? '#18181b' : '#f1f5f9'};
          border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'};
          z-index: 2;
        }
        .ProseMirror table td, .ProseMirror table th {
          min-width: 80px;
          width: 120px;
          border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'};
          padding: 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          background: ${isDarkMode ? '#18181b' : '#fff'};
        }
        .ProseMirror table th {
          font-weight: bold;
          text-align: left;
          background-color: ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)'};
        }
        .ProseMirror table .selectedCell:after {
          z-index: 2;
          background: rgba(99, 102, 241, 0.08);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          border: 2px solid #6366f1;
        }
        .ProseMirror table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #6366f1;
          pointer-events: none;
          z-index: 10;
        }
        /* Canvas container */
        .ProseMirror {
          min-width: 100%;
          width: max-content;
          padding-right: 60px;
          padding-bottom: 60px;
        }
      `}</style>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDarkMode={isDarkMode}
        variant={confirmModal.variant}
      />
    </div>
  );
};

const ToolbarButton = ({ onClick, isActive = false, icon: Icon, title, className = "", showTooltip = true }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-1.5 rounded-md transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800'} ${className}`}
    title={showTooltip ? title : undefined}
  >
    <Icon size={14} />
  </button>
);

const ToolbarDivider = () => (
  <div className="w-px h-4 bg-zinc-500/20 mx-1" />
);

export default RichTextEditor;
export { ToolbarButton, ToolbarDivider };
