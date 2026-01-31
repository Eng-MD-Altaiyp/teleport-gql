import { X, Plus } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const Tabs = () => {
    const { tabs, activeTabId, setActiveTab, closeTab, addTab } = useData();

    return (
        <div className="flex items-center w-full h-10 border-b border-slate-200 dark:border-white/5 select-none overflow-x-auto custom-scrollbar">
            {tabs.map(tab => (
                <div
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        group flex items-center gap-2 px-4 h-full min-w-[140px] max-w-[200px] border-r border-slate-200/50 dark:border-white/5 cursor-pointer transition-all
                        ${tab.id === activeTabId ? 'bg-primary/5 text-primary border-b-2 border-b-primary' : 'text-slate-600 dark:text-foreground/60 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground'}
                    `}
                >
                    <span className={`text-[10px] font-bold ${tab.endpoint.method === 'MUTATION' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {tab.endpoint.method === 'MUTATION' ? 'MUT' : 'QRY'}
                    </span>
                    <span className="flex-1 truncate text-xs font-medium">{tab.title}</span>

                    {/* Close / Dirty Indicator */}
                    <div
                        className="w-5 h-5 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeTab(tab.id);
                        }}
                    >
                        {tab.isDirty ? (
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                        ) : (
                            <X size={12} />
                        )}
                    </div>
                </div>
            ))}

            {/* Add Tab Button */}
            <button
                onClick={() => addTab()}
                className="flex items-center justify-center w-10 h-full text-slate-400 dark:text-foreground/40 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
                <Plus size={16} />
            </button>
        </div>
    );
};
