import { createContext, useContext, useMemo } from 'react';
import { type Collection, type DataState, type Endpoint, type Environment, type EnvVariable, type HistoryItem, type Tab } from '../types/models';
import { storageKeys, makeId } from '../utils/storage';
import { usePersistentState } from '../hooks/usePersistentState';

interface DataContextValue extends DataState {
    setCollections: (collections: Collection[]) => void;
    setStandalone: (endpoints: Endpoint[]) => void;
    setEnvironments: (envs: Environment[]) => void;
    addEnvironment: (name: string, initial?: Partial<Environment>) => Environment;
    updateEnvironment: (envId: string, updates: Partial<Omit<Environment, 'id'>>) => void;
    removeEnvironment: (envId: string) => void;
    setActiveEnvironment: (envId: string | null) => void;
    setHistory: (history: HistoryItem[]) => void;
    setGlobalVariables: (vars: EnvVariable[]) => void;
    setGlobalParams: (vars: EnvVariable[]) => void;
    setGlobalSecrets: (vars: EnvVariable[]) => void;
    addCollection: (name: string) => Collection;
    addEndpointToCollection: (collectionId: string, endpoint: Omit<Endpoint, 'id'>) => void;
    addStandaloneEndpoint: (endpoint: Omit<Endpoint, 'id'>) => Endpoint;
    removeCollection: (collectionId: string) => void;
    removeEndpointFromCollection: (collectionId: string, endpointId: string) => void;
    // Tab management
    addTab: (endpoint?: Endpoint, collectionId?: string) => Tab;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    updateTabContent: (tabId: string, endpoint: Partial<Endpoint>) => void;
    updateEndpoint: (endpointId: string, collectionId: string | undefined, endpoint: Partial<Endpoint>) => void;
    markTabDirty: (tabId: string, isDirty: boolean) => void;
}

const seedData: DataState = {
    collections: [],
    standalone: [],
    environments: [],
    globalVariables: [],
    globalParams: [],
    globalSecrets: [],
    history: [],
    tabs: [],
    activeTabId: null,
    activeEnvironmentId: null,
};

/* eslint-disable react-refresh/only-export-components */
const DataContext = createContext<DataContextValue | undefined>(undefined);

const ensureVarId = (v: Partial<EnvVariable>): EnvVariable => ({
    id: v.id ?? makeId(),
    key: v.key ?? '',
    sharedValue: v.sharedValue,
    localValue: v.localValue,
    isSecret: v.isSecret ?? false,
});

const normalizeEnvVariables = (vars: any): EnvVariable[] => {
    if (!vars) return [];
    if (Array.isArray(vars)) return vars.map(ensureVarId);
    // legacy Record<string,string>
    return Object.entries(vars as Record<string, string>).map(([key, value]) =>
        ensureVarId({ key, sharedValue: value })
    );
};

const normalizeEnvironment = (env: any): Environment => ({
    id: env.id ?? makeId(),
    name: env.name ?? 'Environment',
    baseUrl: env.baseUrl ?? '',
    variables: normalizeEnvVariables(env.variables),
    params: normalizeEnvVariables(env.params),
    secrets: normalizeEnvVariables(env.secrets ?? []).map(v => ({ ...v, isSecret: true })),
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [collections, setCollections] = usePersistentState<Collection[]>(storageKeys.collections, seedData.collections);
    const [standalone, setStandalone] = usePersistentState<Endpoint[]>(storageKeys.standalone, seedData.standalone);
    const [environmentsRaw, setEnvironments] = usePersistentState<Environment[]>(storageKeys.environments, seedData.environments);
    const [history, setHistory] = usePersistentState<HistoryItem[]>(storageKeys.history, seedData.history);
    const [tabs, setTabs] = usePersistentState<Tab[]>(storageKeys.tabs, seedData.tabs);
    const [activeTabId, setActiveTabId] = usePersistentState<string | null>(storageKeys.activeTabId, seedData.activeTabId);
    const [activeEnvironmentId, setActiveEnvironmentId] = usePersistentState<string | null>(storageKeys.activeEnvironmentId, seedData.activeEnvironmentId);
    const [globalVariables, setGlobalVariables] = usePersistentState<EnvVariable[]>(storageKeys.globalVariables, seedData.globalVariables);
    const [globalParams, setGlobalParams] = usePersistentState<EnvVariable[]>(storageKeys.globalParams, seedData.globalParams);
    const [globalSecrets, setGlobalSecrets] = usePersistentState<EnvVariable[]>(storageKeys.globalSecrets, seedData.globalSecrets);

    const environments = useMemo(() => environmentsRaw.map(normalizeEnvironment), [environmentsRaw]);

    const addCollection = (name: string): Collection => {
        // Prevent duplicate collection names
        const existingCollection = collections.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingCollection) {
            return existingCollection; // Return existing instead of creating duplicate
        }

        const collection: Collection = { id: makeId(), name, children: [] };
        setCollections(prev => [...prev, collection]);
        return collection;
    };

    const addEndpointToCollection = (collectionId: string, endpoint: Omit<Endpoint, 'id'>) => {
        setCollections(prev =>
            prev.map(col => {
                if (col.id === collectionId) {
                    // Prevent duplicate endpoint names in same collection
                    const exists = col.children.some(
                        ep => ep.name.toLowerCase() === endpoint.name.toLowerCase()
                    );
                    if (exists) {
                        return col; // Don't add duplicate
                    }
                    return { ...col, children: [...col.children, { ...endpoint, id: makeId() }] };
                }
                return col;
            })
        );
    };

    const addStandaloneEndpoint = (endpoint: Omit<Endpoint, 'id'>): Endpoint => {
        const ep: Endpoint = { ...endpoint, id: makeId() };
        setStandalone(prev => [...prev, ep]);
        return ep;
    };

    const removeCollection = (collectionId: string) => {
        setCollections(prev => prev.filter(c => c.id !== collectionId));
    };

    const removeEndpointFromCollection = (collectionId: string, endpointId: string) => {
        setCollections(prev =>
            prev.map(col =>
                col.id === collectionId
                    ? { ...col, children: col.children.filter(ep => ep.id !== endpointId) }
                    : col
            )
        );
    };

    // Tab Management Functions
    const addTab = (endpoint?: Endpoint, collectionId?: string): Tab => {
        // If endpoint provided, check if it's already open in a tab
        if (endpoint) {
            const existingTab = tabs.find(t => t.endpoint.id === endpoint.id);
            if (existingTab) {
                // Switch to existing tab instead of opening duplicate
                setActiveTabId(existingTab.id);
                return existingTab;
            }
        }

        const newEndpoint: Endpoint = endpoint || {
            id: makeId(),
            name: 'New Request',
            method: 'QUERY',
            url: '',
            body: '',
            headers: {},
        };

        const tab: Tab = {
            id: makeId(),
            title: newEndpoint.name,
            endpoint: newEndpoint,
            isDirty: false,
            isNew: !endpoint, // true if no endpoint provided (new tab)
            collectionId,
        };

        setTabs(prev => [...prev, tab]);
        setActiveTabId(tab.id);
        return tab;
    };

    const closeTab = (tabId: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== tabId);
            // If closing active tab, switch to another
            if (activeTabId === tabId && newTabs.length > 0) {
                setActiveTabId(newTabs[newTabs.length - 1].id);
            } else if (newTabs.length === 0) {
                setActiveTabId(null);
            }
            return newTabs;
        });
    };

    const updateTabContent = (tabId: string, endpoint: Partial<Endpoint>) => {
        setTabs(prev =>
            prev.map(tab =>
                tab.id === tabId
                    ? { ...tab, endpoint: { ...tab.endpoint, ...endpoint }, isDirty: true }
                    : tab
            )
        );
    };

    const updateEndpoint = (endpointId: string, collectionId: string | undefined, endpoint: Partial<Endpoint>) => {
        if (collectionId) {
            // Update in collection
            setCollections(prev =>
                prev.map(col =>
                    col.id === collectionId
                        ? {
                            ...col,
                            children: col.children.map(ep =>
                                ep.id === endpointId ? { ...ep, ...endpoint } : ep
                            ),
                        }
                        : col
                )
            );
        } else {
            // Update in standalone
            setStandalone(prev =>
                prev.map(ep => (ep.id === endpointId ? { ...ep, ...endpoint } : ep))
            );
        }
    };

    const markTabDirty = (tabId: string, isDirty: boolean) => {
        setTabs(prev =>
            prev.map(tab => (tab.id === tabId ? { ...tab, isDirty } : tab))
        );
    };

    const addEnvironment = (name: string, initial: Partial<Environment> = {}) => {
        const env: Environment = {
            id: makeId(),
            name: name.trim() || 'New Environment',
            baseUrl: initial.baseUrl ?? '',
            variables: normalizeEnvVariables(initial.variables),
            params: normalizeEnvVariables(initial.params),
            secrets: normalizeEnvVariables(initial.secrets ?? []).map(v => ({ ...v, isSecret: true })),
        };
        setEnvironments(prev => [...prev, env]);

        // Auto-select the environment if none is active
        setActiveEnvironmentId(prev => prev ?? env.id);
        return env;
    };

    const updateEnvironment = (envId: string, updates: Partial<Omit<Environment, 'id'>>) => {
        setEnvironments(prev =>
            prev.map(env => {
                if (env.id !== envId) return env;
                return {
                    ...env,
                    ...updates,
                    variables: updates.variables ? normalizeEnvVariables(updates.variables) : env.variables,
                    params: updates.params ? normalizeEnvVariables(updates.params) : env.params,
                    secrets: updates.secrets
                        ? normalizeEnvVariables(updates.secrets).map(v => ({ ...v, isSecret: true }))
                        : env.secrets,
                };
            })
        );
    };

    const removeEnvironment = (envId: string) => {
        setEnvironments(prev => {
            const next = prev.filter(env => env.id !== envId);
            if (activeEnvironmentId === envId) {
                setActiveEnvironmentId(next[0]?.id ?? null);
            }
            return next;
        });
    };

    const setActiveEnvironment = (envId: string | null) => {
        setActiveEnvironmentId(envId);
    };

    const setEnvironmentsSafe = (envs: Environment[]) => setEnvironments(envs.map(normalizeEnvironment));
    const normalizeList = (vars: EnvVariable[]) => vars.map(ensureVarId);

    const value = useMemo<DataContextValue>(
        () => ({
            collections,
            standalone,
            environments,
            globalVariables,
            globalParams,
            globalSecrets,
            history,
            tabs,
            activeTabId,
            activeEnvironmentId,
            setCollections,
            setStandalone,
            setEnvironments: setEnvironmentsSafe,
            addEnvironment,
            updateEnvironment,
            removeEnvironment,
            setActiveEnvironment,
            setHistory,
            setGlobalVariables: (v) => setGlobalVariables(normalizeList(v)),
            setGlobalParams: (v) => setGlobalParams(normalizeList(v)),
            setGlobalSecrets: (v) => setGlobalSecrets(normalizeList(v.map(x => ({ ...x, isSecret: true })))),
            addCollection,
            addEndpointToCollection,
            addStandaloneEndpoint,
            removeCollection,
            removeEndpointFromCollection,
            addTab,
            closeTab,
            setActiveTab: setActiveTabId,
            updateTabContent,
            updateEndpoint,
            markTabDirty,
        }),
        [collections, standalone, environments, globalVariables, globalParams, globalSecrets, history, tabs, activeTabId, activeEnvironmentId]
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
};
