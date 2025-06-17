/*
	Installed from @ieedan/std
*/

/** Maps the provided map into an array using the provided mapping function.
 *
 * @param map Map to be entered into an array
 * @param fn A mapping function to transform each pair into an item
 * @returns
 *
 * ## Usage
 * ```ts
 * console.log(map); // Map(5) { 0 => 5, 1 => 4, 2 => 3, 3 => 2, 4 => 1 }
 *
 * const arr = fromMap(map, (_, value) => value);
 *
 * console.log(arr); // [5, 4, 3, 2, 1]
 * ```
 */
export function fromMap<K, V, T>(map: Map<K, V>, fn: (key: K, value: V) => T): T[] {
	const items: T[] = [];

	for (const [key, value] of map) {
		items.push(fn(key, value));
	}

	return items;
}

/** Calculates the sum of all elements in the array based on the provided function.
 *
 * @param arr Array of items to be summed.
 * @param fn Summing function
 * @returns
 *
 * ## Usage
 *
 * ```ts
 * const total = sum([1, 2, 3, 4, 5], (num) => num);
 *
 * console.log(total); // 15
 * ```
 */
export function sum<T>(arr: T[], fn: (item: T) => number): number {
	let total = 0;

	for (const item of arr) {
		total = total + fn(item);
	}

	return total;
}

/** Maps the provided array into a map
 *
 * @param arr Array of items to be entered into a map
 * @param fn A mapping function to transform each item into a key value pair
 * @returns
 *
 * ## Usage
 * ```ts
 * const map = toMap([5, 4, 3, 2, 1], (item, i) => [i, item]);
 *
 * console.log(map); // Map(5) { 0 => 5, 1 => 4, 2 => 3, 3 => 2, 4 => 1 }
 * ```
 */
export function toMap<T, V>(
	arr: T[],
	fn: (item: T, index: number) => [key: string, value: V]
): Record<string, V> {
	const map: Record<string, V> = {};

	for (let i = 0; i < arr.length; i++) {
		const [key, value] = fn(arr[i]!, i);

		map[key] = value;
	}

	return map;
}

type IterateReturn<T> = [
	T,
	{
		isFirst: boolean;
		isLast: boolean;
		array: T[];
		index: number;
		length: number;
	},
];

/**
 * Returns an an iterator that iterates over the given array.
 * Each returned item contains helpful properties, such as
 * `isFirst`, `isLast`, `array`, `index`, and `length`
 *
 * @param array The array to iterate over.
 * @returns An iterator that iterates over the given array.
 */
export function* iterate<T>(array: T[]): Generator<IterateReturn<T>> {
	for (let i = 0; i < array.length; i++) {
		yield [
			array[i]!,
			{
				isFirst: i === 0,
				isLast: i === array.length - 1,
				array,
				index: i,
				length: array.length,
			},
		];
	}
}
