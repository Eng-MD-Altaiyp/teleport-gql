import { useEffect, useMemo, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { type Environment, type EnvVariable } from '../../types/models';
import { makeId } from '../../utils/storage';
import { getActiveEnvironment } from '../../utils/environment';

interface EnvironmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ensureRow = (row?: Partial<EnvVariable>): EnvVariable => ({
    id: row?.id ?? makeId(),
    key: row?.key ?? '',
    sharedValue: row?.sharedValue ?? '',
    localValue: row?.localValue ?? '',
    isSecret: row?.isSecret ?? false,
});

const normalizeRows = (vars?: EnvVariable[]): EnvVariable[] => (vars || []).map(ensureRow);
const emptyRow = (): EnvVariable => ensureRow({});

const splitVars = (env?: Environment) => ({
    variables: normalizeRows(env?.variables),
    params: normalizeRows(env?.params),
    secrets: normalizeRows(env?.secrets?.map(v => ({ ...v, isSecret: true }))),
});

const VarTable = ({ title, rows, onChange, isSecret }: { title: string; rows: EnvVariable[]; onChange: (rows: EnvVariable[]) => void; isSecret?: boolean; }) => {
    const handleRowChange = (id: string, field: keyof EnvVariable, value: string) => {
        onChange(rows.map(r => (r.id === id ? { ...r, [field]: value } : r)));
    };

    const handleRemove = (id: string) => {
        const next = rows.filter(r => r.id !== id);
        onChange(next.length ? next : [emptyRow()]);
    };

    return (
        <div className="rounded-xl border border-teleport-border bg-teleport-panel/80">
            <div className="flex items-center justify-between px-4 py-3 border-b border-teleport-border">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">{title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Inline editable rows</div>
                </div>
                <button
                    onClick={() => onChange([...rows, emptyRow()])}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500"
                >
                    <Plus size={14} />
                    Add
                </button>
            </div>

            <div className="hidden sm:grid grid-cols-[1.4fr_1.4fr_1.4fr_80px] text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 px-4 py-2 border-b border-teleport-border">
                <div>Key</div>
                <div>Shared Value</div>
                <div>Local Value</div>
                <div className="text-center">Action</div>
            </div>

            <div className="divide-y divide-teleport-border">
                {rows.map(row => (
                    <div key={row.id} className="flex flex-col gap-2 sm:grid sm:grid-cols-[1.4fr_1.4fr_1.4fr_80px] items-start sm:items-center sm:gap-3 px-4 py-3">
                        <input
                            value={row.key}
                            onChange={(e) => handleRowChange(row.id, 'key', e.target.value)}
                            placeholder="BASE_URL"
                            className="bg-transparent border-b border-transparent focus:border-emerald-400 focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-2 w-full"
                        />
                        <input
                            type={isSecret ? 'password' : 'text'}
                            value={row.sharedValue}
                            onChange={(e) => handleRowChange(row.id, 'sharedValue', e.target.value)}
                            placeholder={isSecret ? '•••••••' : 'Shared value'}
                            className="bg-transparent border-b border-transparent focus:border-emerald-400 focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-2 w-full"
                        />
                        <input
                            type={isSecret ? 'password' : 'text'}
                            value={row.localValue}
                            onChange={(e) => handleRowChange(row.id, 'localValue', e.target.value)}
                            placeholder={isSecret ? '••••••• (local)' : 'Local override'}
                            className="bg-transparent border-b border-transparent focus:border-emerald-400 focus:outline-none text-sm text-slate-900 dark:text-slate-100 py-2 w-full"
                        />
                        <button
                            onClick={() => handleRemove(row.id)}
                            className="flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg h-9 w-full sm:w-auto"
                            aria-label="Delete variable"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const EnvironmentModal = ({ isOpen, onClose }: EnvironmentModalProps) => {
    const {
        environments,
        activeEnvironmentId,
        setActiveEnvironment,
        addEnvironment,
        updateEnvironment,
        removeEnvironment,
        globalVariables,
        globalParams,
        globalSecrets,
        setGlobalVariables,
        setGlobalParams,
        setGlobalSecrets,
    } = useData();

    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [envName, setEnvName] = useState('');
    const [variables, setVariables] = useState<EnvVariable[]>([emptyRow()]);
    const [params, setParams] = useState<EnvVariable[]>([emptyRow()]);
    const [secrets, setSecrets] = useState<EnvVariable[]>([emptyRow()]);

    const activeEnvironment = useMemo(
        () => getActiveEnvironment(environments, activeEnvironmentId),
        [environments, activeEnvironmentId]
    );

    useEffect(() => {
        if (!isOpen) return;
        const initial = activeEnvironmentId || environments[0]?.id || null;
        setSelectedEnvId(initial);
    }, [isOpen, activeEnvironmentId, environments]);

    useEffect(() => {
        if (!isOpen) return;
        const selected = environments.find(e => e.id === selectedEnvId);
        if (selected) {
            setEnvName(selected.name);
            setBaseUrl(selected.baseUrl || '');
            const { variables, params, secrets } = splitVars(selected);
            setVariables(variables);
            setParams(params);
            setSecrets(secrets);
        } else {
            setEnvName('');
            setBaseUrl('');
            setVariables([emptyRow()]);
            setParams([emptyRow()]);
            setSecrets([emptyRow()]);
        }
    }, [selectedEnvId, environments, isOpen]);

    if (!isOpen) return null;

    const selectedEnv = environments.find(env => env.id === selectedEnvId) || null;

    const handleSave = () => {
        const updates: Partial<Environment> = {
            name: envName.trim() || 'New Environment',
            baseUrl,
            variables,
            params,
            secrets: secrets.map(s => ({ ...s, isSecret: true })),
        };
        if (selectedEnv) {
            updateEnvironment(selectedEnv.id, updates);
        } else {
            const created = addEnvironment(envName || 'New Environment', updates);
            setSelectedEnvId(created.id);
            setActiveEnvironment(created.id);
        }
    };

    const handleCreate = () => {
        const env = addEnvironment(`Environment ${environments.length + 1}`, { baseUrl: '', variables: [], params: [], secrets: [] });
        setSelectedEnvId(env.id);
    };

    const handleDelete = (envId: string) => {
        const nextId = environments.find(e => e.id !== envId)?.id || null;
        removeEnvironment(envId);
        setSelectedEnvId(nextId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3" onClick={onClose}>
            <div
                className="w-full max-w-6xl h-[90vh] md:h-3/4 bg-teleport-panel border border-teleport-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Sidebar */}
                <div className="hidden md:flex md:w-1/3 min-w-[260px] bg-white dark:bg-slate-950 border-l border-teleport-border flex-col h-auto order-1">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Environments</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Select the active workspace</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar px-2 space-y-2">
                        {environments.map(env => {
                            const isActive = env.id === activeEnvironmentId;
                            const isSelected = env.id === selectedEnvId;
                            return (
                                <button
                                    key={env.id}
                                    onClick={() => setSelectedEnvId(env.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors border border-transparent ${
                                        isSelected
                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-teleport-border'
                                            : 'text-slate-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold truncate text-slate-800 dark:text-slate-100">{env.name}</span>
                                        {isActive && <Check size={14} className="text-emerald-400 shrink-0" />}
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-500 truncate">{env.baseUrl || 'No base URL'}</div>
                                </button>
                            );
                        })}
                        {environments.length === 0 && (
                            <div className="px-4 py-3 rounded-xl border border-dashed border-teleport-border text-slate-600 dark:text-slate-500 text-sm">
                                No environments yet. Create one to start using variables.
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-teleport-border">
                        <button
                            onClick={handleCreate}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors font-medium"
                        >
                            <Plus size={16} />
                            New Environment
                        </button>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col bg-teleport-bg order-2 md:order-none h-full overflow-auto">
                    {/* Mobile env selector */}
                    <div className="md:hidden px-3 pt-3 space-y-2">
                        <label className="text-xs uppercase tracking-[0.18em] text-slate-500">Active Environment</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 bg-white dark:bg-slate-900 border border-teleport-border rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
                                value={selectedEnvId ?? ''}
                                onChange={(e) => setSelectedEnvId(e.target.value || null)}
                            >
                                {environments.map(env => (
                                    <option key={env.id} value={env.id}>{env.name}</option>
                                ))}
                                {environments.length === 0 && <option value="">No environments</option>}
                            </select>
                            <button
                                onClick={handleCreate}
                                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="px-3 md:px-6 py-4 border-b border-teleport-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex flex-col gap-2 w-full">
                            <input
                                type="text"
                                value={envName}
                                onChange={(e) => setEnvName(e.target.value)}
                                placeholder="Environment name"
                                className="bg-transparent text-lg font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-transparent focus:border-emerald-400 pb-1 w-full"
                            />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Base URL</label>
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="https://graphqlzero.almansi.me"
                                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 border-b border-transparent focus:border-emerald-400 focus:outline-none pb-1"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-center">
                            {selectedEnv && activeEnvironment?.id !== selectedEnv.id && (
                                <button
                                    onClick={() => selectedEnv && setActiveEnvironment(selectedEnv.id)}
                                    className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors text-sm"
                                >
                                    Set Active
                                </button>
                            )}
                            {selectedEnv && (
                                <button
                                    onClick={() => handleDelete(selectedEnv.id)}
                                    className="px-3 py-2 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition-colors text-sm"
                            >
                                Save
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                        <VarTable title="Variables" rows={variables} onChange={setVariables} />
                        <VarTable title="Query Params" rows={params} onChange={setParams} />
                        <VarTable title="Secrets Vault" rows={secrets} onChange={setSecrets} isSecret />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <VarTable title="Global Variables" rows={normalizeRows(globalVariables)} onChange={setGlobalVariables} />
                            <VarTable title="Global Params" rows={normalizeRows(globalParams)} onChange={setGlobalParams} />
                        </div>
                        <VarTable title="Global Secrets" rows={normalizeRows(globalSecrets)} onChange={setGlobalSecrets} isSecret />
                    </div>
                </div>
            </div>
        </div>
    );
};
