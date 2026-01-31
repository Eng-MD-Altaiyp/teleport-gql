// Core app data models used across UI and storage.

export type HttpMethod = 'QUERY' | 'MUTATION' | 'SUBSCRIPTION' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Endpoint {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
    body?: string;
    headers?: Record<string, string>;
}

export interface Collection {
    id: string;
    name: string;
    children: Endpoint[];
}

export interface Environment {
    id: string;
    name: string;
    variables: Record<string, string>;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    url: string;
    status: number;
    durationMs?: number;
    sizeBytes?: number;
    method?: HttpMethod;
    error?: string;
}

export interface Tab {
    id: string;
    title: string;
    endpoint: Endpoint;
    isDirty: boolean;
    isNew: boolean; // true if created via "New Tab", false if opened from Collection
    collectionId?: string; // Set only if opened from a collection
}

export interface DataState {
    collections: Collection[];
    standalone: Endpoint[]; // Endpoints not attached to any collection
    environments: Environment[];
    history: HistoryItem[];
    tabs: Tab[];
    activeTabId: string | null;
}
