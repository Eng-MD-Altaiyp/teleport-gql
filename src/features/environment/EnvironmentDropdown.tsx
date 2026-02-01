import { useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, Settings } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getActiveEnvironment } from '../../utils/environment';
import { EnvironmentModal } from './EnvironmentModal';

export const EnvironmentDropdown = () => {
    const { environments, activeEnvironmentId, setActiveEnvironment, addEnvironment } = useData();
    const [open, setOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const activeEnv = useMemo(
        () => getActiveEnvironment(environments, activeEnvironmentId),
        [environments, activeEnvironmentId]
    );

    const handleSelect = (id: string) => {
        setActiveEnvironment(id);
        setOpen(false);
    };

    const handleCreate = () => {
        const env = addEnvironment(`Environment ${environments.length + 1}`);
        setActiveEnvironment(env.id);
    };

    const label = activeEnv ? activeEnv.name : 'No Environment';
    const labelClasses = activeEnv ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400';

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm hover:border-emerald-500/40 transition-colors"
            >
                <span className={`font-medium ${labelClasses}`}>{label}</span>
                <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {environments.map(env => {
                                const isActive = env.id === activeEnvironmentId;
                                return (
                                    <button
                                        key={env.id}
                                        onClick={() => handleSelect(env.id)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <span className="truncate">{env.name}</span>
                                        {isActive && <Check size={14} className="text-emerald-400" />}
                                    </button>
                                );
                            })}
                            {environments.length === 0 && (
                                <div className="px-4 py-3 text-sm text-slate-500">No environments</div>
                            )}
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => { handleCreate(); setOpen(false); }}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Plus size={14} />
                                New Environment
                            </button>
                            <div className="border-t border-slate-200 dark:border-slate-800" />
                            <button
                                onClick={() => { setShowModal(true); setOpen(false); }}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Settings size={14} />
                                Manage Environments...
                            </button>
                        </div>
                    </div>
                </>
            )}

            <EnvironmentModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </div>
    );
};
