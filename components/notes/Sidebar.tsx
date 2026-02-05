import React from 'react';
import { Lightbulb, Bell, Pencil, Archive, Trash2 } from 'lucide-react';
import { SidebarSection } from './types';

interface SidebarProps {
  activeSection: SidebarSection;
  onSectionChange: (section: SidebarSection) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, isOpen }) => {
  const items = [
    { id: 'NOTES', icon: Lightbulb, label: 'Notes' },
    { id: 'REMINDERS', icon: Bell, label: 'Reminders' },
    { id: 'EDIT_LABELS', icon: Pencil, label: 'Edit labels' },
    { id: 'ARCHIVE', icon: Archive, label: 'Archive' },
    { id: 'TRASH', icon: Trash2, label: 'Trash' },
  ];

  return (
    <aside 
      className={`relative h-full transition-all duration-300 ease-in-out z-20 ${isOpen ? 'w-64' : 'w-20'} flex flex-col py-2 border-r border-[var(--notebook-divider)] bg-[var(--note-default-bg)]`}
      onMouseEnter={() => !isOpen && document.body.style.setProperty('cursor', 'pointer')} // Optional UX enhancement
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSectionChange(item.id as SidebarSection)}
          className={`group flex items-center pl-6 py-3 rounded-r-full transition-colors duration-150
            ${activeSection === item.id 
              ? 'bg-[var(--notebook-hover)] text-[var(--notebook-text)]' 
              : 'text-[var(--notebook-muted)] hover:bg-[var(--notebook-hover)] hover:text-[var(--notebook-text)]'
            }`}
          title={!isOpen ? item.label : ''}
        >
          <item.icon className={`w-6 h-6 shrink-0 transition-colors ${activeSection === item.id ? 'fill-current' : ''}`} />
          <span 
            className={`ml-5 text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden transition-all duration-200 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0'}`}
          >
            {item.label}
          </span>
        </button>
      ))}
      
      <div className="mt-auto px-6 text-[10px] text-[var(--notebook-muted)] mb-2">
           {isOpen && (
               <div>
                   <p className="hover:underline cursor-pointer">Open-source software</p>
                   <p className="hover:underline cursor-pointer">Licenses</p>
               </div>
           )}
      </div>
    </aside>
  );
};

export default Sidebar;
