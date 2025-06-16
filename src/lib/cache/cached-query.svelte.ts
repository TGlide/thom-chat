import { useQuery as convexUseQuery } from 'convex-svelte';
import { SessionStorageCache } from './session-cache.js';
import { getFunctionName, type FunctionReference, type OptionalRestArgs } from 'convex/server';
import { watch } from 'runed';

export interface CachedQueryOptions {
	cacheKey?: string;
	ttl?: number;
	staleWhileRevalidate?: boolean;
	enabled?: boolean;
}

export interface QueryResult<T> {
	data: T | undefined;
	error: Error | undefined;
	isLoading: boolean;
	isStale: boolean;
}

const globalCache = new SessionStorageCache('convex-query-cache');

export function useCachedQuery<
	Query extends FunctionReference<'query'>,
	Args extends OptionalRestArgs<Query>,
>(
	query: Query,
	...args: Args extends undefined ? [] : [Args[0], CachedQueryOptions?]
): QueryResult<Query['_returnType']> {
	const [queryArgs, options = {}] = args as [Args[0]?, CachedQueryOptions?];

	const {
		cacheKey,
		ttl = 7 * 24 * 60 * 60 * 1000, // 1 week default
		staleWhileRevalidate = true,
		enabled = true,
	} = options;

	// Generate cache key from query reference and args
	const key = cacheKey || `${getFunctionName(query)}:${JSON.stringify(queryArgs || {})}`;

	// Get cached data
	const cachedData = enabled ? globalCache.get(key) : undefined;

	// Convex query, used as soon as possible
	const convexResult = convexUseQuery(query, queryArgs, {
		// enabled: enabled && (!cachedData || !staleWhileRevalidate),
	});

	const shouldUseCached = $derived(
		cachedData !== undefined && (staleWhileRevalidate || convexResult.isLoading)
	);

	// Cache fresh data when available
	watch(
		() => $state.snapshot(convexResult.data),
		(data) => {
			if (data === undefined || !enabled) return;
			globalCache.set(key, data, ttl);
		}
	);

	return {
		get data() {
			return shouldUseCached ? cachedData : convexResult.data;
		},
		get error() {
			return convexResult.error;
		},
		get isLoading() {
			return shouldUseCached ? false : convexResult.isLoading;
		},
		get isStale() {
			return shouldUseCached && convexResult.isLoading;
		},
	};
}

export function invalidateQuery(query: FunctionReference<'query'>, queryArgs?: unknown): void {
	const key = `${getFunctionName(query)}:${JSON.stringify(queryArgs || {})}`;
	globalCache.delete(key);
}

export function invalidateQueriesMatching(_pattern: string | RegExp): void {
	// Note: This is a simplified implementation
	// In a real implementation, you'd need to track all cache keys
	console.warn(
		'invalidateQueriesMatching not fully implemented - consider using specific key invalidation'
	);
}

export function clearQueryCache(): void {
	globalCache.clear();
}

export { globalCache as queryCache };
