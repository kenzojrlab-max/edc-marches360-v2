
import { Marche as Market, User, PieceJointe as DocumentFile } from '../types';

const STORAGE_KEYS = {
  MARKETS: 'edc_markets',
  USERS: 'edc_users',
  SESSION: 'edc_session'
};

const DB_NAME = 'EDC_Marchés360_DB';
const STORE_NAME = 'documents';

// Helper pour IndexedDB
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storage = {
  // Métadonnées légères (localStorage ok)
  getMarkets: (): Market[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MARKETS);
    return data ? JSON.parse(data) : [];
  },
  saveMarkets: (markets: Market[]) => {
    localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(markets));
  },
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  getSession: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (user: User | null) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  },

  // Documents lourds (IndexedDB requis pour éviter QuotaExceededError)
  saveDoc: async (doc: DocumentFile): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  getDocById: async (id: string): Promise<DocumentFile | undefined> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  deleteDoc: async (id: string): Promise<void> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  getAllDocs: async (): Promise<DocumentFile[]> => {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};
