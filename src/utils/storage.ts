// Lightweight localStorage helpers with safe parsing.

export const storageKeys = {
    collections: 'teleport.collections',
    standalone: 'teleport.standalone',
    environments: 'teleport.envs',
    globalVariables: 'teleport.global.vars',
    globalParams: 'teleport.global.params',
    globalSecrets: 'teleport.global.secrets',
    activeEnvironmentId: 'teleport.activeEnvId',
    history: 'teleport.history',
    tabs: 'teleport.tabs',
    activeTabId: 'teleport.activeTabId',
};

export function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw) as T;
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
}

export function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Swallow errors to avoid breaking UX if storage quota fails.
    }
}

export function makeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 10);
}
