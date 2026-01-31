import { useState, useEffect } from 'react';
import {
    Globe,
    Sun,
    Moon,
    Layers,
    History,
    Plus,
    X,
    MoreHorizontal,
    ChevronRight,
    ChevronDown,
    FolderOpen,
    Zap,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const propertyToShort = (method?: string) => {
    if (!method) return 'Q';
    return method === 'MUTATION' ? 'M' : 'Q';
}

export const Sidebar = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const [activeTab, setActiveTab] = useState<'collections' | 'history' | 'env'>('collections');
    const [newCollection, setNewCollection] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'collection' | 'endpoint'; collectionId: string; endpointId?: string; name: string } | null>(null);

    const { theme, toggleTheme } = useTheme();
    const { collections, standalone, addCollection, removeCollection, removeEndpointFromCollection, addTab } = useData();

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setActiveContextMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleAddCollection = () => {
        const name = newCollection.trim();
        if (name) {
            const newCol = addCollection(name);
            setNewCollection('');
            setExpandedFolders(prev => new Set([...prev, newCol.id]));
        }
    };

    return (
        <div className={`${hideHeader ? 'w-full bg-transparent' : 'w-64 border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0d0d1a] backdrop-blur-xl shadow-sm dark:shadow-none rounded-3xl'} h-full flex flex-col overflow-hidden`}>
            {/* Header */}
            {!hideHeader && (
                <div className="h-14 border-b border-slate-200 dark:border-white/10 flex items-center px-4 gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <span className="text-white font-black text-lg leading-none select-none">T</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-linear-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/60">
                        Teleport
                    </span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-white/5">
                <NavButton icon={<Layers size={18} />} label="Collections" isActive={activeTab === 'collections'} onClick={() => setActiveTab('collections')} />
                <NavButton icon={<History size={18} />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <NavButton icon={<Globe size={18} />} label="Env" isActive={activeTab === 'env'} onClick={() => setActiveTab('env')} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
                {activeTab === 'collections' && (
                    <>
                        {/* Add Collection Input */}
                        <div className="flex items-center gap-2 px-2 py-2 mb-2">
                            <input
                                value={newCollection}
                                onChange={(e) => setNewCollection(e.target.value)}
                                placeholder="New collection name"
                                className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 focus:outline-none focus:border-primary text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCollection()}
                            />
                            <button
                                onClick={handleAddCollection}
                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
                            >
                                Add
                            </button>
                        </div>

                        {/* Collections Tree */}
                        {collections.length === 0 && standalone.length === 0 ? (
                            <div className="px-3 py-8 text-xs text-slate-500 dark:text-slate-400 italic text-center">
                                No collections yet
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {collections.map(collection => {
                                    const isExpanded = expandedFolders.has(collection.id);
                                    return (
                                        <div key={collection.id}>
                                            {/* Collection Header */}
                                            <div
                                                className="group flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => toggleFolder(collection.id)}
                                            >
                                                {/* Expand Icon */}
                                                <span className="text-slate-400 dark:text-slate-500">
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </span>

                                                {/* Folder Icon */}
                                                <FolderOpen size={16} className="text-amber-500" />

                                                {/* Name */}
                                                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                                    {collection.name}
                                                </span>

                                                {/* Actions (visible on hover) */}
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirm({ type: 'collection', collectionId: collection.id, name: collection.name });
                                                        }}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveContextMenu(activeContextMenu === collection.id ? null : collection.id);
                                                        }}
                                                        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                                        title="More"
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>
                                                </div>

                                                {/* Context Menu */}
                                                {activeContextMenu === collection.id && (
                                                    <div className="absolute right-2 mt-32 w-44 bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                addTab(undefined, collection.id);
                                                                setActiveContextMenu(null);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2"
                                                        >
                                                            <Zap size={14} className="text-primary" />
                                                            New Endpoint
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Endpoints */}
                                            {isExpanded && (
                                                <div className="ml-4 border-l border-slate-200 dark:border-white/10">
                                                    {collection.children.length === 0 ? (
                                                        <>
                                                            {/* + New Button */}
                                                            <div
                                                                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 dark:text-slate-500 hover:text-primary cursor-pointer transition-colors"
                                                                onClick={() => addTab(undefined, collection.id)}
                                                            >
                                                                <Plus size={14} />
                                                                <span className="text-xs">New</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {collection.children.map(endpoint => (
                                                                <div
                                                                    key={endpoint.id}
                                                                    className="group flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                                    onClick={() => addTab(endpoint, collection.id)}
                                                                >
                                                                    {/* Method Badge */}
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${endpoint.method === 'MUTATION'
                                                                        ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                                                        : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                                        }`}>
                                                                        {propertyToShort(endpoint.method)}
                                                                    </span>

                                                                    {/* Name */}
                                                                    <span className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
                                                                        {endpoint.name}
                                                                    </span>

                                                                    {/* Delete button */}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setDeleteConfirm({ type: 'endpoint', collectionId: collection.id, endpointId: endpoint.id, name: endpoint.name });
                                                                        }}
                                                                        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {/* + New at bottom */}
                                                            <div
                                                                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 dark:text-slate-500 hover:text-primary cursor-pointer transition-colors"
                                                                onClick={() => addTab(undefined, collection.id)}
                                                            >
                                                                <Plus size={14} />
                                                                <span className="text-xs">New</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Standalone Endpoints (Quick Requests) */}
                                {standalone.length > 0 && (
                                    <div className="mt-4 pt-2 border-t border-slate-200 dark:border-white/10">
                                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Quick Requests
                                        </div>
                                        {standalone.map(endpoint => (
                                            <div
                                                key={endpoint.id}
                                                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                onClick={() => addTab(endpoint)}
                                            >
                                                <Zap size={14} className="text-amber-500" />
                                                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300 truncate">
                                                    {endpoint.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="p-4 text-center text-sm opacity-50 dark:text-slate-400 text-slate-600">No history yet</div>
                )}
                {activeTab === 'env' && (
                    <div className="p-4 text-center text-sm opacity-50 dark:text-slate-400 text-slate-600">No environments</div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex-1 cursor-pointer transition-colors">
                    <div className="w-6 h-6 rounded-full bg-linear-to-r from-blue-500 to-teal-400" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">Mohammed A.</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Pro Plan</span>
                    </div>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => {
                    if (deleteConfirm) {
                        if (deleteConfirm.type === 'collection') {
                            removeCollection(deleteConfirm.collectionId);
                        } else if (deleteConfirm.endpointId) {
                            removeEndpointFromCollection(deleteConfirm.collectionId, deleteConfirm.endpointId);
                        }
                    }
                }}
                title={deleteConfirm?.type === 'collection'
                    ? `Delete the folder "${deleteConfirm?.name}"?`
                    : `Delete "${deleteConfirm?.name}"?`}
                message={deleteConfirm?.type === 'collection'
                    ? "This folder and the endpoints within this folder will be deleted permanently."
                    : "This endpoint will be deleted permanently."}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

const NavButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`relative flex-1 flex flex-col items-center justify-center py-3 gap-1.5 transition-all duration-200 group ${isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
        title={label}
    >
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary transition-all duration-300 ease-out ${isActive ? 'w-8 opacity-100' : 'w-0 opacity-0'}`} />
        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
            {icon}
        </div>
        <span className={`text-[10px] font-medium tracking-wide transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-80'}`}>
            {label}
        </span>
    </button>
);
