import { useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage } from '../utils/storage';

/**
 * Small helper to mirror state into localStorage immediately after every change.
 */
export const usePersistentState = <T,>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => loadFromStorage(key, initial));

    useEffect(() => {
        saveToStorage(key, state);
    }, [key, state]);

    return [state, setState];
};
