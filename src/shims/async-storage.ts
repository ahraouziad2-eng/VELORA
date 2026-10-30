const memoryStore: Record<string, string> = {};

export default {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key) ?? memoryStore[key] ?? null;
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch {}
    delete memoryStore[key];
  },
  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch {
      return Object.keys(memoryStore);
    }
  },
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const results: [string, string | null][] = [];
    for (const key of keys) {
      const val = await this.getItem(key);
      results.push([key, val]);
    }
    return results;
  },
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    for (const [key, value] of keyValuePairs) {
      await this.setItem(key, value);
    }
  },
  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  },
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch {}
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  },
};
