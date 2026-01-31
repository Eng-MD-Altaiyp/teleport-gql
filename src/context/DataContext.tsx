import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { type Collection, type DataState, type Endpoint, type Environment, type HistoryItem, type Tab } from '../types/models';
import { loadFromStorage, saveToStorage, storageKeys, makeId } from '../utils/storage';

interface DataContextValue extends DataState {
    setCollections: (collections: Collection[]) => void;
    setStandalone: (endpoints: Endpoint[]) => void;
    setEnvironments: (envs: Environment[]) => void;
    setHistory: (history: HistoryItem[]) => void;
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
    history: [],
    tabs: [],
    activeTabId: null,
};

/* eslint-disable react-refresh/only-export-components */
const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [collections, setCollections] = useState<Collection[]>(() =>
        loadFromStorage(storageKeys.collections, seedData.collections)
    );
    const [standalone, setStandalone] = useState<Endpoint[]>(() =>
        loadFromStorage(storageKeys.standalone, seedData.standalone)
    );
    const [environments, setEnvironments] = useState<Environment[]>(() =>
        loadFromStorage(storageKeys.environments, seedData.environments)
    );
    const [history, setHistory] = useState<HistoryItem[]>(() =>
        loadFromStorage(storageKeys.history, seedData.history)
    );
    const [tabs, setTabs] = useState<Tab[]>(() =>
        loadFromStorage(storageKeys.tabs, seedData.tabs)
    );
    const [activeTabId, setActiveTabId] = useState<string | null>(() =>
        loadFromStorage(storageKeys.activeTabId, seedData.activeTabId)
    );

    // Persist on change
    useEffect(() => saveToStorage(storageKeys.collections, collections), [collections]);
    useEffect(() => saveToStorage(storageKeys.standalone, standalone), [standalone]);
    useEffect(() => saveToStorage(storageKeys.environments, environments), [environments]);
    useEffect(() => saveToStorage(storageKeys.history, history), [history]);
    useEffect(() => saveToStorage(storageKeys.tabs, tabs), [tabs]);
    useEffect(() => saveToStorage(storageKeys.activeTabId, activeTabId), [activeTabId]);

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

    const value = useMemo<DataContextValue>(
        () => ({
            collections,
            standalone,
            environments,
            history,
            tabs,
            activeTabId,
            setCollections,
            setStandalone,
            setEnvironments,
            setHistory,
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
        [collections, standalone, environments, history, tabs, activeTabId]
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
};
