// typed object.keys
export function keys<T extends object>(obj: T): Array<keyof T> {
	return Object.keys(obj) as Array<keyof T>;
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
