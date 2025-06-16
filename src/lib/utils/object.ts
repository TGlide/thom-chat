// typed object.keys
export function keys<T extends object>(obj: T): Array<keyof T> {
	return Object.keys(obj) as Array<keyof T>;
}

// typed object.entries
export function entries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
	return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
	return Object.fromEntries(
		Object.entries(obj).filter(([key]) => !keys.includes(key as K))
	) as Omit<T, K>;
}

export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
	return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key as K))) as Pick<
		T,
		K
	>;
}

/**
 * Transforms an object into a new object by applying a mapping function
 * to each of its key-value pairs.
 *
 * @template KIn The type of the keys in the input object.
 * @template VIn The type of the values in the input object.
 * @template KOut The type of the keys in the output object.
 * @template VOut The type of the values in the output object.
 *
 * @param obj The input object to transform.
 * @param mapper A function that takes a key and its value from the input object
 *               and returns a tuple `[KOut, VOut]` representing the new key
 *               and new value for the output object.
 * @returns A new object with the transformed keys and values.
 */
export function objectMap<
	KIn extends string | number | symbol,
	VIn,
	KOut extends string | number | symbol,
	VOut,
>(obj: Record<KIn, VIn>, mapper: (key: KIn, value: VIn) => [KOut, VOut]): Record<KOut, VOut> {
	const result: Record<KOut, VOut> = {} as Record<KOut, VOut>;

	for (const rawKey in obj) {
		// Ensure we only process own properties (not inherited ones)
		if (Object.prototype.hasOwnProperty.call(obj, rawKey)) {
			const key = rawKey as KIn; // Cast to KIn as rawKey is initially string
			const value = obj[key];
			const [newKey, newValue] = mapper(key, value);
			result[newKey] = newValue;
		}
	}

	return result;
}
