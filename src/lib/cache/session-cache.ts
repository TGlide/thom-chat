import { LRUCache } from './lru-cache.js';

interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl?: number;
}

export class SessionStorageCache<T = unknown> {
	private memoryCache: LRUCache<string, CacheEntry<T>>;
	private storageKey: string;
	private writeTimeout: ReturnType<typeof setTimeout> | null = null;
	private debounceMs: number;
	private pendingWrites = new Set<string>();

	constructor(storageKey = 'query-cache', maxSizeBytes = 1024 * 1024, debounceMs = 300) {
		this.storageKey = storageKey;
		this.debounceMs = debounceMs;
		this.memoryCache = new LRUCache<string, CacheEntry<T>>(maxSizeBytes);
		this.loadFromSessionStorage();
	}

	private loadFromSessionStorage(): void {
		try {
			const stored = sessionStorage.getItem(this.storageKey);
			if (!stored) return;

			const data = JSON.parse(stored) as Record<string, CacheEntry<T>>;
			const now = Date.now();

			for (const [key, entry] of Object.entries(data)) {
				if (entry.ttl && now - entry.timestamp > entry.ttl) {
					continue;
				}
				this.memoryCache.set(key, entry);
			}
		} catch (error) {
			console.warn('Failed to load cache from sessionStorage:', error);
		}
	}

	private debouncedWrite(): void {
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout);
		}

		this.writeTimeout = setTimeout(() => {
			this.writeToSessionStorage();
			this.writeTimeout = null;
		}, this.debounceMs);
	}

	private writeToSessionStorage(): void {
		try {
			const cacheData: Record<string, CacheEntry<T>> = {};
			const now = Date.now();

			for (const key of this.pendingWrites) {
				const entry = this.memoryCache.get(key);
				if (entry && (!entry.ttl || now - entry.timestamp < entry.ttl)) {
					cacheData[key] = entry;
				}
			}

			const existingData = sessionStorage.getItem(this.storageKey);
			if (existingData) {
				const existing = JSON.parse(existingData) as Record<string, CacheEntry<T>>;
				for (const [key, entry] of Object.entries(existing)) {
					if (!this.pendingWrites.has(key) && (!entry.ttl || now - entry.timestamp < entry.ttl)) {
						cacheData[key] = entry;
					}
				}
			}

			sessionStorage.setItem(this.storageKey, JSON.stringify(cacheData));
			this.pendingWrites.clear();
		} catch (error) {
			console.warn('Failed to write cache to sessionStorage:', error);
		}
	}

	get(key: string): T | undefined {
		const entry = this.memoryCache.get(key);
		if (!entry) return undefined;

		if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
			this.delete(key);
			return undefined;
		}

		return entry.data;
	}

	set(key: string, data: T, ttlMs?: number): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttlMs,
		};

		this.memoryCache.set(key, entry);
		this.pendingWrites.add(key);
		this.debouncedWrite();
	}

	delete(key: string): boolean {
		const deleted = this.memoryCache.delete(key);
		if (deleted) {
			this.pendingWrites.add(key);
			this.debouncedWrite();
		}
		return deleted;
	}

	clear(): void {
		this.memoryCache.clear();
		try {
			sessionStorage.removeItem(this.storageKey);
		} catch (error) {
			console.warn('Failed to clear sessionStorage:', error);
		}
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout);
			this.writeTimeout = null;
		}
		this.pendingWrites.clear();
	}

	has(key: string): boolean {
		const entry = this.memoryCache.get(key);
		if (!entry) return false;

		if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
			this.delete(key);
			return false;
		}

		return true;
	}

	get size(): number {
		return this.memoryCache.size;
	}

	get bytes(): number {
		return this.memoryCache.bytes;
	}

	forceWrite(): void {
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout);
			this.writeTimeout = null;
		}
		this.writeToSessionStorage();
	}
}
