import { useState } from 'react';
import {
    ChevronRight,
    Globe,
    Sun,
    Moon,
    ChevronDown, Folder, Layers,
    History
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type NodeType = 'folder' | 'request';

interface TreeNode {
    id: string;
    label: string;
    type: NodeType;
    method?: string;
    children?: TreeNode[];
    isOpen?: boolean;
}

const initialCollections: TreeNode[] = [
    {
        id: '1',
        label: 'User API',
        type: 'folder',
        isOpen: true,
        children: [
            { id: '1-1', label: 'Get User', type: 'request', method: 'QUERY' },
            { id: '1-2', label: 'Update Profile', type: 'request', method: 'MUTATION' },
        ]
    },
    {
        id: '2',
        label: 'Auth Service',
        type: 'folder',
        isOpen: false,
        children: [
            { id: '2-1', label: 'Login', type: 'request', method: 'MUTATION' }
        ]
    }
];

const TreeItem = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
    const [isOpen, setIsOpen] = useState(node.isOpen);
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 group ${level > 0 ? 'ml-4' : ''}`}
                onClick={hasChildren ? handleToggle : undefined}
            >
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                    {node.type === 'folder' ? (
                        isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    ) : (
                        <span className="w-3.5" />
                    )}
                </span>

                {node.type === 'folder' ? (
                    <Folder size={16} className="text-primary/80" />
                ) : (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${node.method === 'MUTATION' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                        {propertyToShort(node.method)}
                    </span>
                )}

                <span className="text-sm truncate opacity-90 group-hover:opacity-100 text-slate-700 dark:text-slate-200">{node.label}</span>
            </div>

            {isOpen && hasChildren && (
                <div>
                    {node.children!.map(child => (
                        <TreeItem key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const propertyToShort = (method?: string) => {
    if (!method) return 'Q';
    return method === 'MUTATION' ? 'M' : 'Q';
}

export const Sidebar = ({ hideHeader = false }: { hideHeader?: boolean }) => {
    const [activeTab, setActiveTab] = useState<'collections' | 'history' | 'env'>('collections');
    const { theme, toggleTheme } = useTheme();

    return (
        <div className={`${hideHeader ? 'w-full bg-transparent' : 'w-64 border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none rounded-3xl'} h-full flex flex-col overflow-hidden`}>
            {/* Header - Hidden on mobile drawer */}
            {!hideHeader && (
                <div className="h-14 border-b border-slate-200 dark:border-white/10 flex items-center px-4 gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                        <span className="text-white font-black text-lg leading-none select-none">T</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-white/60">
                        Teleport
                    </span>
                </div>
            )}

            {/* Navigation Tabs (Icons) */}
            <div className="flex border-b border-slate-200 dark:border-white/5">
                <NavButton icon={<Layers size={18} />} label="Collections" isActive={activeTab === 'collections'} onClick={() => setActiveTab('collections')} />
                <NavButton icon={<History size={18} />} label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                <NavButton icon={<Globe size={18} />} label="Env" isActive={activeTab === 'env'} onClick={() => setActiveTab('env')} />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                {activeTab === 'collections' && (
                    <div className="space-y-1">
                        <div className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Collections
                        </div>
                        {initialCollections.map(node => (
                            <TreeItem key={node.id} node={node} />
                        ))}
                    </div>
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
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-teal-400" />
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
)
