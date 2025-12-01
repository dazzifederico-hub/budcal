import { openDB } from 'idb';

const DB_NAME = 'budcal-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const store = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date');
        store.createIndex('type', 'type');
        store.createIndex('source', 'source');
      }
      
      // Color Mapping store
      if (!db.objectStoreNames.contains('color_mappings')) {
        db.createObjectStore('color_mappings', { keyPath: 'colorId' });
      }

      // Settings store (key-value)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
};

export const dbService = {
  async getTransactions() {
    const db = await initDB();
    return db.getAll('transactions');
  },

  async addTransaction(transaction) {
    const db = await initDB();
    // Ensure ID is generated if not provided or string
    const tx = {
       ...transaction,
       date: transaction.date || new Date().toISOString(),
       source: transaction.source || 'manual'
    };
    return db.put('transactions', tx);
  },

  async deleteTransaction(id) {
    const db = await initDB();
    return db.delete('transactions', id);
  },

  async getColorMappings() {
    const db = await initDB();
    return db.getAll('color_mappings');
  },

  async saveColorMapping(mapping) {
    const db = await initDB();
    return db.put('color_mappings', mapping);
  },

  async getSettings() {
    const db = await initDB();
    const settings = await db.getAll('settings');
    // Convert array of values to object if needed, or just use specific keys
    // For simplicity, we'll use put/get with keys
    return settings; 
  },

  async getSetting(key) {
    const db = await initDB();
    return db.get('settings', key);
  },

  async saveSetting(key, value) {
    const db = await initDB();
    return db.put('settings', value, key);
  },
  
  async clearAll() {
      const db = await initDB();
      await db.clear('transactions');
      await db.clear('color_mappings');
      await db.clear('settings');
  }
};
