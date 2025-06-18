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

export function fromRecord<V, T>(map: Record<string, V>, fn: (key: string, value: V) => T): T[] {
	const items: T[] = [];

	for (const [key, value] of Object.entries(map)) {
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

export function last<T>(arr: T[]): T | undefined {
	return arr[arr.length - 1];
}

/**
 * Defines the possible directions for movement within the matrix.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Retrieves the next item in a matrix based on a current position and a direction.
 * This function is designed to work with "jagged" arrays (rows can have different lengths).
 *
 * @template T The type of items stored in the matrix.
 * @param matrix The matrix (an array of arrays) where rows can have varying lengths.
 * @param currentRow The 0-based index of the current row.
 * @param currentCol The 0-based index of the current column.
 * @param direction The direction to move ('up', 'down', 'left', 'right').
 * @returns The item at the next position, or `undefined` if the current position is invalid,
 *          the next position is out of bounds, or the matrix itself is invalid.
 */
export function getNextMatrixItem<T>(
	matrix: T[][],
	currentRow: number,
	currentCol: number,
	direction: Direction
): T | undefined {
	// --- 1. Input Validation: Matrix and Current Position ---

	// Ensure the matrix is a valid array and not empty
	if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
		return undefined;
	}

	// Validate the current row index
	if (currentRow < 0 || currentRow >= matrix.length) {
		return undefined;
	}

	// Get the current row array to validate the current column
	const currentRowArray = matrix[currentRow];

	// Ensure the current row is a valid array and validate current column index
	if (
		!currentRowArray ||
		!Array.isArray(currentRowArray) ||
		currentCol < 0 ||
		currentCol >= currentRowArray.length
	) {
		return undefined;
	}

	// --- 2. Calculate Tentative Next Coordinates ---

	let nextRow = currentRow;
	let nextCol = currentCol; // Start with the same column

	switch (direction) {
		case 'up':
			nextRow--;
			break;
		case 'down':
			nextRow++;
			break;
		case 'left':
			nextCol--; // Column changes for horizontal movement
			break;
		case 'right':
			nextCol++; // Column changes for horizontal movement
			break;
	}

	// --- 3. Validate and Adjust Next Coordinates Against Matrix Bounds ---

	// Check if the calculated next row is within the matrix's vertical bounds
	if (nextRow < 0 || nextRow >= matrix.length) {
		return undefined; // Out of vertical bounds
	}

	// Get the array for the target row. This is crucial for jagged arrays.
	const nextRowArray = matrix[nextRow];

	// Ensure the target row is a valid array before checking its length
	if (!nextRowArray || !Array.isArray(nextRowArray)) {
		return undefined; // The row itself is malformed or non-existent
	}

	// --- NEW LOGIC: Adjust nextCol for vertical movements if it's out of bounds ---
	if (direction === 'up' || direction === 'down') {
		// If the tentative nextCol is beyond the length of the target row,
		// clamp it to the last valid index of that row.
		// If nextRowArray.length is 0, then nextRowArray.length - 1 is -1.
		// Math.min(currentCol, -1) would result in -1, which will then correctly
		// be caught by the next `if (nextCol < 0)` check.
		nextCol = Math.min(nextCol, nextRowArray.length - 1);
	}

	// Check if the calculated next column is within the target row's horizontal bounds
	// This applies to ALL directions, including after potential clamping for up/down.
	if (nextCol < 0 || nextCol >= nextRowArray.length) {
		return undefined; // Out of horizontal bounds for the specific nextRow
	}

	// --- 4. Return the Item ---

	return nextRowArray[nextCol];
}
