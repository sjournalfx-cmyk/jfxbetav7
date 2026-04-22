
import React, { useState } from 'react';
import { ListChecks, Edit, X, Trash2, CheckCircle2, Plus } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  text: string;
}

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'trend', text: 'Is the setup aligned with HTF Trend?' },
  { id: 'levels', text: 'Are Support & Resistance levels clear?' },
  { id: 'news', text: 'Have you checked high-impact news?' },
  { id: 'risk', text: 'Is risk calculated (< 2% of equity)?' },
  { id: 'mental', text: 'Are you emotionally calm & focused?' },
];

export interface ChecklistModalProps {
  isDarkMode: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  items: ChecklistItem[];
  onUpdateItems: (items: ChecklistItem[]) => void;
  mode?: 'save' | 'view';
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({ isDarkMode, onClose, onConfirm, items, onUpdateItems, mode = 'save' }) => {
    const [checks, setChecks] = useState<Record<string, boolean>>({});
    const [isEditing, setIsEditing] = useState(false);
    
    // Check if all items are checked
    const allChecked = items.length > 0 && items.every(item => checks[item.id]);

    const toggleEdit = () => {
      setIsEditing(!isEditing);
    };

    const handleTextChange = (id: string, newText: string) => {
      onUpdateItems(items.map(item => item.id === id ? { ...item, text: newText } : item));
    };

    const handleDeleteItem = (id: string) => {
      onUpdateItems(items.filter(item => item.id !== id));
      // Cleanup check state
      const newChecks = { ...checks };
      delete newChecks[id];
      setChecks(newChecks);
    };

    const handleAddItem = () => {
      const newItem = { id: Date.now().toString(), text: '' };
      onUpdateItems([...items, newItem]);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] ${isDarkMode ? 'bg-[#0f111a] text-white border border-[#27272a]' : 'bg-white text-gray-900'}`}>
                 
                 {/* Header */}
                 <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
                            <ListChecks size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold">Pre-Flight Checklist</h2>
                          <p className="text-xs opacity-50">{isEditing ? 'Editing Checklist' : 'Verify before execution'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                          onClick={toggleEdit}
                          className={`p-2 rounded-lg transition-colors ${isEditing ? 'bg-violet-500 text-white' : isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                          title="Edit Checklist"
                        >
                          <Edit size={16} />
                        </button>
                        <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}>
                          <X size={20} />
                        </button>
                    </div>
                 </div>
                 
                 {/* List Area */}
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-6 px-1">
                     {items.length === 0 && (
                       <div className="text-center py-8 opacity-40 text-sm">
                         No items in checklist. Click edit to add.
                       </div>
                     )}

                     {items.map(item => (
                       <div key={item.id} className="animate-in fade-in slide-in-from-left-2 duration-200">
                         {isEditing ? (
                           <div className={`flex items-center gap-2 p-2 rounded-xl border ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-gray-50 border-gray-200'}`}>
                             <input 
                               autoFocus={!item.text}
                               value={item.text}
                               onChange={(e) => handleTextChange(item.id, e.target.value)}
                               placeholder="Enter checklist requirement..."
                               className={`flex-1 bg-transparent outline-none text-sm font-medium px-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                             />
                             <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                         ) : (
                           <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${checks[item.id] ? (isDarkMode ? 'bg-violet-500/10 border-violet-500/50' : 'bg-violet-50 border-violet-200') : (isDarkMode ? 'bg-[#18181b] border-[#27272a] hover:border-zinc-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300')}`}>
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${checks[item.id] ? 'bg-violet-500 border-violet-500 text-white' : 'border-gray-400'}`}>
                                   {checks[item.id] && <CheckCircle2 size={14} />}
                               </div>
                               <input 
                                  type="checkbox" 
                                  className="hidden" 
                                  checked={!!checks[item.id]}
                                  onChange={() => setChecks(p => ({...p, [item.id]: !p[item.id]}))}
                               />
                               <span className={`font-medium text-sm ${checks[item.id] ? '' : 'opacity-80'}`}>{item.text}</span>
                           </label>
                         )}
                       </div>
                     ))}
                     
                     {isEditing && (
                       <button 
                        onClick={handleAddItem}
                        className={`w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-colors ${isDarkMode ? 'border-zinc-700 hover:border-violet-500 hover:text-violet-500 text-zinc-500' : 'border-gray-300 hover:border-violet-500 hover:text-violet-500 text-gray-500'}`}
                       >
                         <Plus size={16} /> Add Requirement
                       </button>
                     )}
                 </div>

                 {/* Footer Actions */}
                 {!isEditing && (
                   <div className="flex gap-3 shrink-0">
                       <button onClick={onClose} className={`flex-1 py-3 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          {mode === 'view' ? 'Close' : 'Cancel'}
                       </button>
                       {mode === 'save' ? (
                          <button 
                              onClick={onConfirm} 
                              disabled={!allChecked}
                              className="flex-1 py-3 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                              Confirm & Save
                          </button>
                       ) : (
                          <button 
                              onClick={onClose} 
                              className="flex-1 py-3 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all"
                          >
                              Done
                          </button>
                       )}
                   </div>
                 )}
                 {isEditing && (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    >
                      Finish Editing
                    </button>
                 )}
             </div>
        </div>
    );
};
