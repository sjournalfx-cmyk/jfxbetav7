import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Trash2, Maximize2, AlignLeft, AlignCenter, AlignRight, Square, Layout, Palette, Expand, X } from 'lucide-react';

const BORDER_COLORS = [
  { name: 'Auto', value: 'auto', color: 'gray' },
  { name: 'Indigo', value: '#6366f1', color: '#6366f1' },
  { name: 'Emerald', value: '#10b981', color: '#10b981' },
  { name: 'Rose', value: '#f43f5e', color: '#f43f5e' },
];

const ImageNode: React.FC<NodeViewProps> = (props) => {
  const { node, updateAttributes, deleteNode, editor, selected } = props;
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(node.attrs.width || '200px');
  
  const align = node.attrs.align || 'center';
  const hasBorder = node.attrs.hasBorder || false;
  const layout = node.attrs.layout || 'block'; // 'block' | 'inline'
  const caption = node.attrs.caption || '';
  const borderColor = node.attrs.borderColor || 'auto';

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (imageRef.current) {
      setAspectRatio(imageRef.current.naturalWidth / imageRef.current.naturalHeight);
    }
  }, [imageRef.current?.src]);

  // Handle Escape key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = imageRef.current ? imageRef.current.clientWidth : 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!imageRef.current) return;
        const currentX = moveEvent.clientX;
        const diffX = currentX - startX;
        const newWidth = Math.max(50, startWidth + diffX);
        
        setWidth(`${newWidth}px`);
        updateAttributes({ width: `${newWidth}px` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Determine wrapper classes based on layout mode and alignment
  const wrapperClass = `image-node-view relative leading-none transition-all ${
    layout === 'inline' 
      ? 'inline-block mx-1 my-1 align-top' 
      : `block my-8 ${align === 'left' ? 'mr-auto ml-0' : align === 'right' ? 'ml-auto mr-0' : 'mx-auto'}`
  }`;

  return (
    <NodeViewWrapper className={wrapperClass} style={{ width: layout === 'block' ? 'fit-content' : width, maxWidth: '100%' }}>
      <div 
        className={`relative transition-all group/image flex flex-col ${
          selected ? 'ring-2 ring-indigo-500 rounded-lg shadow-2xl' : 'shadow-lg'
        } ${hasBorder ? 'p-1 border-2 rounded-lg' : ''} ${
            hasBorder && borderColor === 'auto' ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800' : ''
        } ${hasBorder && borderColor !== 'auto' ? 'bg-white dark:bg-zinc-800' : ''}`}
        style={{ 
            width: width, 
            maxWidth: '100%',
            borderColor: hasBorder && borderColor !== 'auto' ? borderColor : undefined
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          className={`rounded-lg shadow-sm block w-full h-auto ${hasBorder ? 'rounded-md' : ''}`}
          onLoad={(e) => {
              setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight);
          }}
          onDoubleClick={() => setIsLightboxOpen(true)}
        />
        
        {/* Caption Input */}
        <input
          type="text"
          value={caption}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          placeholder="Write a caption..."
          className={`w-full text-center text-xs mt-2 bg-transparent border-none outline-none placeholder:opacity-50 transition-opacity ${
            selected || caption ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'
          } text-zinc-500 dark:text-zinc-400 font-medium`}
        />

        {/* Actions Overlay */}
        <div className={`absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity z-10 ${selected ? 'opacity-100' : ''}`}>
           {/* Alignment Controls (Only relevant in Block mode) */}
           {layout === 'block' && (
             <div className="flex bg-black/70 backdrop-blur-sm rounded-md overflow-hidden border border-white/10 shadow-lg">
               <button 
                 onClick={() => updateAttributes({ align: 'left' })}
                 className={`p-1.5 hover:bg-white/20 transition-colors ${align === 'left' ? 'text-indigo-400 bg-white/10' : 'text-white'}`}
                 title="Align Left"
               >
                 <AlignLeft size={14} />
               </button>
               <button 
                 onClick={() => updateAttributes({ align: 'center' })}
                 className={`p-1.5 hover:bg-white/20 transition-colors ${align === 'center' ? 'text-indigo-400 bg-white/10' : 'text-white'}`}
                 title="Align Center"
               >
                 <AlignCenter size={14} />
               </button>
               <button 
                 onClick={() => updateAttributes({ align: 'right' })}
                 className={`p-1.5 hover:bg-white/20 transition-colors ${align === 'right' ? 'text-indigo-400 bg-white/10' : 'text-white'}`}
                 title="Align Right"
               >
                 <AlignRight size={14} />
               </button>
             </div>
           )}

           {/* Style Controls */}
           <div className="flex bg-black/70 backdrop-blur-sm rounded-md overflow-hidden border border-white/10 shadow-lg">
             <button 
               onClick={() => setIsLightboxOpen(true)}
               className="p-1.5 hover:bg-white/20 transition-colors text-white"
               title="Fullscreen Preview"
             >
               <Expand size={14} />
             </button>
             <button 
               onClick={() => updateAttributes({ layout: layout === 'block' ? 'inline' : 'block' })}
               className={`p-1.5 hover:bg-white/20 transition-colors ${layout === 'inline' ? 'text-indigo-400 bg-white/10' : 'text-white'}`}
               title={layout === 'block' ? "Switch to Inline (Grid)" : "Switch to Block (Standalone)"}
             >
               <Layout size={14} />
             </button>
             <button 
               onClick={() => updateAttributes({ hasBorder: !hasBorder })}
               className={`p-1.5 hover:bg-white/20 transition-colors ${hasBorder ? 'text-indigo-400 bg-white/10' : 'text-white'}`}
               title="Toggle Border"
             >
               <Square size={14} />
             </button>
           </div>
           
           {/* Border Color Picker (Only if border is active) */}
           {hasBorder && (
               <div className="flex gap-1 bg-black/70 backdrop-blur-sm rounded-md overflow-hidden border border-white/10 shadow-lg p-1">
                   {BORDER_COLORS.map(c => (
                       <button
                           key={c.name}
                           onClick={() => updateAttributes({ borderColor: c.value })}
                           className={`w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform ${borderColor === c.value ? 'ring-2 ring-white' : ''}`}
                           style={{ backgroundColor: c.value === 'auto' ? '#a1a1aa' : c.value }}
                           title={`Border: ${c.name}`}
                       />
                   ))}
               </div>
           )}

           {/* Delete */}
           <button 
             onClick={deleteNode}
             className="p-1.5 bg-rose-500 text-white rounded-md shadow-lg hover:bg-rose-600 transition-colors self-end"
             title="Delete Image"
           >
             <Trash2 size={14} />
           </button>
        </div>

        {/* Resize Handle */}
        <div
          className={`absolute bottom-8 right-2 p-1.5 bg-black/50 text-white rounded-md cursor-ew-resize opacity-0 group-hover/image:opacity-100 transition-opacity ${selected ? 'opacity-100' : ''}`}
          onMouseDown={handleMouseDown}
          title="Resize"
        >
          <Maximize2 size={14} className="rotate-90" />
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={node.attrs.src} 
            alt={node.attrs.alt} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
          />
          {caption && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm backdrop-blur-md">
              {caption}
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default ImageNode;
