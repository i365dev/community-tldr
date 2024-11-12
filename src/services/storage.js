const DEFAULT_SETTINGS = {
    aiProvider: 'openai',
    apiKey: '',
    endpoint: '',
    model: 'gpt-3.5-turbo',
    summaryLength: 'medium',
    autoSummarize: true
};

const CACHE_PREFIX = 'tldr_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

export class StorageService {
    static async getSettings() {
        try {
            const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
            return { ...DEFAULT_SETTINGS, ...settings };
        } catch (error) {
            console.error('Failed to load settings:', error);
            return DEFAULT_SETTINGS;
        }
    }

    static async saveSettings(settings) {
        try {
            await chrome.storage.sync.set(settings);
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    static async getCachedSummary(key) {
        const cacheKey = CACHE_PREFIX + key;
        try {
            const result = await chrome.storage.local.get(cacheKey);
            if (result[cacheKey]) {
                const { timestamp, data } = result[cacheKey];
                if (Date.now() - timestamp < CACHE_EXPIRY) {
                    return data;
                } else {
                    await chrome.storage.local.remove(cacheKey);
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to get cached summary:', error);
            return null;
        }
    }

    static async cacheSummary(key, data) {
        const cacheKey = CACHE_PREFIX + key;
        try {
            await chrome.storage.local.set({
                [cacheKey]: {
                    timestamp: Date.now(),
                    data
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to cache summary:', error);
            return false;
        }
    }

    static async clearCache(key) {
        const cacheKey = CACHE_PREFIX + key;
        try {
            await chrome.storage.local.remove(cacheKey);
            return true;
        } catch (error) {
            console.error('Failed to clear cache:', error);
            return false;
        }
    }

    static async clearAllCache() {
        try {
            const all = await chrome.storage.local.get(null);
            const cacheKeys = Object.keys(all).filter(key => 
                key.startsWith(CACHE_PREFIX)
            );
            
            if (cacheKeys.length > 0) {
                await chrome.storage.local.remove(cacheKeys);
            }
            return true;
        } catch (error) {
            console.error('Failed to clear all cache:', error);
            return false;
        }
    }

    static async getCacheStats() {
        try {
            const all = await chrome.storage.local.get(null);
            const cacheEntries = Object.entries(all).filter(([key]) => 
                key.startsWith(CACHE_PREFIX)
            );

            const stats = {
                totalEntries: cacheEntries.length,
                totalSize: 0,
                oldestEntry: Date.now(),
                newestEntry: 0
            };

            cacheEntries.forEach(([, value]) => {
                stats.totalSize += JSON.stringify(value).length;
                stats.oldestEntry = Math.min(stats.oldestEntry, value.timestamp);
                stats.newestEntry = Math.max(stats.newestEntry, value.timestamp);
            });

            return stats;
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return null;
        }
    }
}
