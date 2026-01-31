import { useState } from 'react';
import { X, ChevronDown, FolderOpen } from 'lucide-react';
import { type Collection } from '../../types/models';

interface SaveAsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, collectionId: string) => void;
    collections: Collection[];
    defaultName?: string;
}

export const SaveAsDialog = ({ isOpen, onClose, onSave, collections, defaultName = '' }: SaveAsDialogProps) => {
    const [name, setName] = useState(defaultName);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (!isOpen) return null;

    const selectedCollection = collections.find(c => c.id === selectedCollectionId);

    const handleSave = () => {
        if (name.trim() && selectedCollectionId) {
            onSave(name.trim(), selectedCollectionId);
            onClose();
            setName('');
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="relative w-[90%] max-w-[480px] bg-[#1a1a2e] rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="h-14 px-6 flex items-center justify-between">
                    <span className="text-base font-semibold text-white">Save Request</span>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 space-y-5">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">
                            Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter request name"
                            className="w-full px-4 py-3 text-sm rounded-lg border border-white/10 bg-slate-900/80 focus:outline-none focus:border-primary/50 text-white placeholder:text-slate-500"
                            autoFocus
                        />
                    </div>

                    {/* Folder Selection */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-300">
                            Requests Folder <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full px-4 py-3 text-sm rounded-lg border border-white/10 bg-slate-900/80 text-left text-white flex items-center justify-between hover:border-white/20 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <FolderOpen size={16} className="text-slate-400" />
                                    <span>{selectedCollection?.name || 'Select folder'}</span>
                                </div>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown */}
                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                        {collections.length > 0 ? (
                                            collections.map((col) => (
                                                <button
                                                    key={col.id}
                                                    onClick={() => {
                                                        setSelectedCollectionId(col.id);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-white/5 transition-colors ${selectedCollectionId === col.id ? 'bg-primary/20 text-primary' : 'text-white'
                                                        }`}
                                                >
                                                    <FolderOpen size={14} className="text-slate-400" />
                                                    {col.name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-slate-500 italic">
                                                No folders available
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-16 px-6 border-t border-white/5 flex items-center justify-end gap-3 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!name.trim() || !selectedCollectionId}
                        className="px-5 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
