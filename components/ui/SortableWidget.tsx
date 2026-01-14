import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableWidgetProps {
    id: string;
    children: React.ReactNode;
    className?: string;
}

export const SortableWidget: React.FC<SortableWidgetProps> = ({ id, children, className = "" }) => {
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
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative group h-full ${className}`}>
            {/* Drag Handle - Only visible on hover */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-4 right-4 p-1.5 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-black/10 dark:bg-white/10 text-zinc-500 hover:text-white"
                role="button"
                tabIndex={0}
            >
                <GripVertical size={14} />
            </div>
            {children}
        </div>
    );
};
