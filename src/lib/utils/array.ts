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
 * Options for the getNextMatrixItem function.
 * @template T The type of items stored in the matrix.
 */
export interface GetNextMatrixItemOptions<T> {
	/** The matrix (an array of arrays) where rows can have varying lengths. */
	matrix: T[][];
	/** The 0-based index of the current row. */
	currentRow: number;
	/** The 0-based index of the current column. */
	currentCol: number;
	/** The direction to move ('up', 'down', 'left', 'right'). */
	direction: Direction;
	/**
	 * An optional predicate function that determines if an item is "available".
	 * If an item is not available, the function will attempt to find the next available candidate.
	 * Defaults to always returning true (all items are available).
	 * @param item The item to check.
	 * @returns True if the item is available, false otherwise.
	 */
	isAvailable?: (item: T) => boolean;
}

/**
 * Retrieves the next item in a matrix based on a current position and a direction.
 * This function is designed to work with "jagged" arrays (rows can have different lengths).
 *
 * Special behavior for 'up'/'down': If the target row is shorter than the current column,
 * the column index will snap to the rightmost valid column of the target row.
 *
 * If an `isAvailable` function is provided and the initially calculated next item is
 * not available, the function will attempt to find the next available candidate
 * within the target row:
 * - For 'up'/'down': It will scan left from the snapped column.
 * - For 'left': It will continue scanning left.
 * - For 'right': It will continue scanning right.
 *
 * @template T The type of items stored in the matrix.
 * @param options The options object containing matrix, current position, direction, and optional isAvailable predicate.
 * @returns The item at the next valid and available position, or `undefined` if no such item is found.
 */
export function getNextMatrixItem<T>(options: GetNextMatrixItemOptions<T>): T | undefined {
	const { matrix, currentRow, currentCol, direction, isAvailable = (_i) => true } = options;

	// --- 1. Input Validation: Matrix and Current Position ---

	if (!matrix || !Array.isArray(matrix) || matrix.length === 0) {
		return undefined;
	}

	if (currentRow < 0 || currentRow >= matrix.length) {
		return undefined;
	}

	const currentRowArray = matrix[currentRow];
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
	let nextCol = currentCol;

	switch (direction) {
		case 'up':
			nextRow--;
			break;
		case 'down':
			nextRow++;
			break;
		case 'left':
			nextCol--;
			break;
		case 'right':
			nextCol++;
			break;
	}

	// --- 3. Validate and Adjust Next Coordinates Against Matrix Bounds ---

	// For vertical movements, skip empty rows and rows where all items are unavailable
	if (direction === 'up' || direction === 'down') {
		while (nextRow >= 0 && nextRow < matrix.length) {
			const nextRowArray = matrix[nextRow];
			if (nextRowArray && Array.isArray(nextRowArray) && nextRowArray.length > 0) {
				// Check if there's at least one available item in this row
				const hasAvailableItem = nextRowArray.some(
					(item) => item !== undefined && item !== null && isAvailable(item)
				);
				if (hasAvailableItem) {
					break; // Found a row with at least one available item
				}
			}
			// Skip empty row or row with all unavailable items
			nextRow += direction === 'down' ? 1 : -1;
		}

		if (nextRow < 0 || nextRow >= matrix.length) {
			return undefined; // Out of vertical bounds after skipping empty/unavailable rows
		}
	}

	// For horizontal movements, validate row bounds and get the row array
	if (direction === 'left' || direction === 'right') {
		if (nextRow < 0 || nextRow >= matrix.length) {
			return undefined; // Out of vertical bounds
		}
	}

	const nextRowArray = matrix[nextRow];
	if (!nextRowArray || !Array.isArray(nextRowArray)) {
		return undefined; // The row itself is malformed or non-existent
	}

	// For horizontal movements, check if the row is empty
	if ((direction === 'left' || direction === 'right') && nextRowArray.length === 0) {
		return undefined; // Can't move horizontally in an empty row
	}

	// --- NEW LOGIC: Adjust nextCol for vertical movements if it's out of bounds ---
	if (direction === 'up' || direction === 'down') {
		// Clamp nextCol to the last valid index of the target row if it's too far right
		nextCol = Math.min(nextCol, nextRowArray.length - 1);
	}

	// --- 4. Find the Next Available Item ---

	// For horizontal movements, skip empty columns by finding next valid position
	if (direction === 'left' || direction === 'right') {
		let candidateCol = nextCol;
		const increment = direction === 'right' ? 1 : -1;

		while (candidateCol >= 0 && candidateCol < nextRowArray.length) {
			const candidateItem = nextRowArray[candidateCol];
			if (candidateItem !== undefined && candidateItem !== null && isAvailable(candidateItem)) {
				return candidateItem;
			}
			candidateCol += increment;
		}
		return undefined; // No available item found in the horizontal direction
	}

	// Initial check for bounds after clamping/calculation
	if (nextCol < 0 || nextCol >= nextRowArray.length) {
		return undefined; // No valid column to start searching from in the target row
	}

	// Loop to find the next available item for vertical movements
	let candidateCol = nextCol;

	if (direction === 'up' || direction === 'down') {
		// For vertical moves, try the calculated/clamped 'candidateCol', then scan left, then scan right
		while (candidateCol >= 0) {
			const candidateItem = nextRowArray[candidateCol];
			if (candidateItem !== undefined && candidateItem !== null && isAvailable(candidateItem)) {
				return candidateItem;
			}
			candidateCol--; // Move left to find an available item
		}

		// If not found scanning left, try scanning right from the original position
		candidateCol = nextCol + 1;
		while (candidateCol < nextRowArray.length) {
			const candidateItem = nextRowArray[candidateCol];
			if (candidateItem !== undefined && candidateItem !== null && isAvailable(candidateItem)) {
				return candidateItem;
			}
			candidateCol++; // Move right to find an available item
		}
	}

	// If no available item was found in the search path
	return undefined;
}
