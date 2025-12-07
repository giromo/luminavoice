import { HistoryItem } from '../types';

const DB_NAME = 'LuminaVoiceDB';
const STORE_NAME = 'history';
const DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject("Database error: " + (event.target as any).errorCode);

        request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

export const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'isFavorite' | 'timestamp'>): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Limit to 10 items - Delete oldest
        store.count().onsuccess = (e) => {
             const count = (e.target as IDBRequest).result;
             if (count >= 10) {
                 store.openCursor(null, 'next').onsuccess = (cursorEvent) => {
                     const cursor = (cursorEvent.target as IDBRequest).result;
                     if (cursor) {
                         cursor.delete();
                     }
                 }
             }
        };

        const newItem = {
            ...item,
            timestamp: Date.now(),
            isFavorite: false
        };
        
        const request = store.add(newItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const items = request.result as HistoryItem[];
            resolve(items.sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error);
    });
};

export const toggleFavorite = async (id: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.get(id).onsuccess = (e) => {
            const item = (e.target as IDBRequest).result;
            if (item) {
                item.isFavorite = !item.isFavorite;
                store.put(item);
                resolve();
            } else {
                reject("Item not found");
            }
        };
    });
};

export const deleteHistoryItem = async (id: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id).onsuccess = () => resolve();
    });
};