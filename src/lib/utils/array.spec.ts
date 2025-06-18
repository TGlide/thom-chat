import { describe, it, expect } from 'vitest';
import { getNextMatrixItem } from './array';

// --- Test Data ---

// Simple matrix for basic tests
const simpleMatrix = [
	[1, 2, 3],
	[4, 5, 6],
	[7, 8, 9],
];

// Jagged matrix to test snapping behavior
const jaggedMatrix = [
	[10, 11, 12], // Row 0 (length 3)
	[13, 14], // Row 1 (length 2)
	[15, 16, 17, 18], // Row 2 (length 4)
	[19], // Row 3 (length 1)
	[], // Row 4 (length 0)
];

// Item interface for availability tests
interface TestItem {
	id: number;
	available: boolean;
}

// Matrix with availability for testing isAvailable predicate
const matrixWithAvailability: TestItem[][] = [
	[
		{ id: 1, available: true },
		{ id: 2, available: false },
		{ id: 3, available: true },
	], // Row 0
	[
		{ id: 4, available: true },
		{ id: 5, available: false },
	], // Row 1
	[
		{ id: 6, available: true },
		{ id: 7, available: true },
		{ id: 8, available: false },
		{ id: 9, available: true },
	], // Row 2
	[{ id: 10, available: false }], // Row 3
	[
		{ id: 11, available: false },
		{ id: 12, available: false },
	], // Row 4 (all unavailable)
	[{ id: 13, available: true }], // Row 5
];

// isAvailable predicate for TestItem
const isTestItemAvailable = (item: TestItem) => item.available;

// --- Test Suite ---

describe('getNextMatrixItem', () => {
	// --- Input Validation Tests ---

	describe('Input Validation', () => {
		it('should return undefined for empty matrix', () => {
			expect(
				getNextMatrixItem({ matrix: [], currentRow: 0, currentCol: 0, direction: 'down' })
			).toBeUndefined();
		});

		it('should return undefined for invalid currentRow (negative)', () => {
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: -1,
					currentCol: 0,
					direction: 'down',
				})
			).toBeUndefined();
		});

		it('should return undefined for invalid currentRow (out of bounds)', () => {
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: 99,
					currentCol: 0,
					direction: 'down',
				})
			).toBeUndefined();
		});

		it('should return undefined for invalid currentCol (negative)', () => {
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: 0,
					currentCol: -1,
					direction: 'right',
				})
			).toBeUndefined();
		});

		it('should return undefined for invalid currentCol (out of bounds for current row)', () => {
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: 0,
					currentCol: 99,
					direction: 'right',
				})
			).toBeUndefined();
		});
	});

	// --- Basic Movement Tests (without isAvailable, no jagged snapping scenarios) ---

	describe('Basic Movement (standard grid)', () => {
		it('should move right correctly', () => {
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'right',
				})
			).toBe(2);
		});

		it('should move left correctly', () => {
			expect(
				getNextMatrixItem({ matrix: simpleMatrix, currentRow: 0, currentCol: 2, direction: 'left' })
			).toBe(2);
		});

		it('should move down correctly', () => {
			expect(
				getNextMatrixItem({ matrix: simpleMatrix, currentRow: 0, currentCol: 0, direction: 'down' })
			).toBe(4);
		});

		it('should move up correctly', () => {
			expect(
				getNextMatrixItem({ matrix: simpleMatrix, currentRow: 2, currentCol: 0, direction: 'up' })
			).toBe(4);
		});

		it('should return undefined when moving right off edge', () => {
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: 0,
					currentCol: 2,
					direction: 'right',
				})
			).toBeUndefined();
		});

		it('should return undefined when moving left off edge', () => {
			expect(
				getNextMatrixItem({ matrix: simpleMatrix, currentRow: 0, currentCol: 0, direction: 'left' })
			).toBeUndefined();
		});

		it('should return undefined when moving down off edge', () => {
			expect(
				getNextMatrixItem({ matrix: simpleMatrix, currentRow: 2, currentCol: 0, direction: 'down' })
			).toBeUndefined();
		});

		it('should return undefined when moving up off edge', () => {
			expect(
				getNextMatrixItem({ matrix: simpleMatrix, currentRow: 0, currentCol: 0, direction: 'up' })
			).toBeUndefined();
		});
	});

	// --- Jagged Array & Snapping Tests ---

	describe('Jagged Array & Snapping', () => {
		it('should snap right when moving down to a shorter row', () => {
			// From (0,2) [12] -> down. Row 1 is [13, 14]. Column 2 is out of bounds for row 1.
			// Should snap to (1,1) [14]
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 0, currentCol: 2, direction: 'down' })
			).toBe(14);
		});

		it('should snap right when moving up to a shorter row', () => {
			// From (2,3) [18] -> up. Row 1 is [13, 14]. Column 3 is out of bounds for row 1.
			// Should snap to (1,1) [14]
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 2, currentCol: 3, direction: 'up' })
			).toBe(14);
		});

		it('should return undefined when snapping results in an invalid column (row is too short/empty)', () => {
			// From (0,0) [10] -> down. Row 4 is []. Column 0 is out of bounds.
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 0, currentCol: 0, direction: 'down' })
			).toBe(13); // First down
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 1, currentCol: 0, direction: 'down' })
			).toBe(15); // Second down
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 2, currentCol: 0, direction: 'down' })
			).toBe(19); // Third down
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 3, currentCol: 0, direction: 'down' })
			).toBeUndefined(); // Fourth down to empty row 4
		});

		it('should not snap if target row is longer or same length', () => {
			// From (1,0) [13] -> down. Row 2 is [15,16,17,18]. Column 0 is valid.
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 1, currentCol: 0, direction: 'down' })
			).toBe(15);
			// From (1,1) [14] -> down. Row 2 is [15,16,17,18]. Column 1 is valid.
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 1, currentCol: 1, direction: 'down' })
			).toBe(16);
		});

		it('should handle moving to a row with only one element when current column is greater', () => {
			// From (0,2) [12] -> down. Row 3 is [19]. Column 2 is out of bounds.
			// Should snap to (3,0) [19]
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 0, currentCol: 2, direction: 'down' })
			).toBe(14); // Down to row 1
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 1, currentCol: 1, direction: 'down' })
			).toBe(16); // Down to row 2
			expect(
				getNextMatrixItem({ matrix: jaggedMatrix, currentRow: 2, currentCol: 3, direction: 'down' })
			).toBe(19); // Down to row 3 (snaps from col 3 to col 0)
		});
	});

	// --- Availability Tests ---

	describe('Availability (isAvailable predicate)', () => {
		it('should return the item if it is available and no isAvailable is provided', () => {
			// Default behavior, all items are available
			expect(
				getNextMatrixItem({
					matrix: simpleMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'right',
				})
			).toBe(2);
		});

		it('should return the item if it is available and isAvailable returns true', () => {
			// (0,0) is {id:1, available:true}. Move right to (0,1) {id:2, available:false}
			// This test is for the *first* item, not skipping.
			expect(
				getNextMatrixItem({
					matrix: matrixWithAvailability,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 4, available: true });
		});

		// --- Horizontal Scan (right) ---
		it('should scan right to find the next available item', () => {
			// From (0,0) {id:1, true} -> right. Next is (0,1) {id:2, false}. Scan right to (0,2) {id:3, true}.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 0,
				currentCol: 0,
				direction: 'right',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 3, available: true });
		});

		it('should scan right multiple times if needed', () => {
			// From (2,1) {id:7, true} -> right. Next is (2,2) {id:8, false}. Scan right to (2,3) {id:9, true}.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 2,
				currentCol: 1,
				direction: 'right',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 9, available: true });
		});

		it('should return undefined if scanning right hits end of row and no available item is found', () => {
			// From (0,1) {id:2, false} -> right. Next is (0,2) {id:3, true}.
			// If we start from (0,1) and item 3 becomes unavailable, we should get undefined.
			const modifiedMatrix = JSON.parse(JSON.stringify(matrixWithAvailability)); // Deep copy
			modifiedMatrix[0][2].available = false; // Make id:3 unavailable
			const result = getNextMatrixItem({
				matrix: modifiedMatrix,
				currentRow: 0,
				currentCol: 1,
				direction: 'right',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toBeUndefined();
		});

		// --- Horizontal Scan (left) ---
		it('should scan left to find the next available item', () => {
			// From (0,2) {id:3, true} -> left. Next is (0,1) {id:2, false}. Scan left to (0,0) {id:1, true}.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 0,
				currentCol: 2,
				direction: 'left',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 1, available: true });
		});

		it('should scan left multiple times if needed', () => {
			// From (2,3) {id:9, true} -> left. Next is (2,2) {id:8, false}. Scan left to (2,1) {id:7, true}.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 2,
				currentCol: 3,
				direction: 'left',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 7, available: true });
		});

		it('should return undefined if scanning left hits start of row and no available item is found', () => {
			// From (0,1) {id:2, false} -> left. Next is (0,0) {id:1, true}.
			// If we start from (0,1) and item 1 becomes unavailable, we should get undefined.
			const modifiedMatrix = JSON.parse(JSON.stringify(matrixWithAvailability)); // Deep copy
			modifiedMatrix[0][0].available = false; // Make id:1 unavailable
			const result = getNextMatrixItem({
				matrix: modifiedMatrix,
				currentRow: 0,
				currentCol: 1,
				direction: 'left',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toBeUndefined();
		});

		// --- Vertical Scan (up/down - scans left) ---
		it('should scan left for available item after snapping down', () => {
			// From (0,2) {id:3, true} -> down. Target row 1. Snaps to (1,1) {id:5, false}.
			// Scan left: (1,0) {id:4, true}.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 0,
				currentCol: 2,
				direction: 'down',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 4, available: true });
		});

		it('should scan left for available item after snapping up', () => {
			// From (2,3) {id:9, true} -> up. Target row 1. Snaps to (1,1) {id:5, false}.
			// Scan left: (1,0) {id:4, true}.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 2,
				currentCol: 3,
				direction: 'up',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 4, available: true });
		});

		it('should skip rows with all unavailable items when moving vertically (up)', () => {
			// From (5,0) {id:13, true} -> up. Target row 4 has all unavailable items {id:11, false}, {id:12, false}.
			// Should skip row 4 and row 3 (also unavailable), then find available item in row 2.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 5,
				currentCol: 0,
				direction: 'up',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 6, available: true }); // Found in row 2
		});

		it('should skip empty rows when moving vertically (down)', () => {
			// From (3,0) {id:10, false} -> down. Target row 4 is empty [].
			// Should skip empty row 4 and find available item in row 5.
			const result = getNextMatrixItem({
				matrix: matrixWithAvailability,
				currentRow: 3,
				currentCol: 0,
				direction: 'down',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 13, available: true }); // Found in row 5
		});

		it('should skip empty rows and move to the next non-empty row for vertical movement (down)', () => {
			// From (0,0) which is {id:1, true}
			// Consider a matrix like:
			// [ [A] ]
			// [ [] ]  <- row 1 is empty, should be skipped
			// [ [B] ]
			// From A down, it should skip the empty row 1 and go to row 2, returning B.
			const customMatrix = [
				[{ id: 1, available: true }],
				[], // Empty row
				[{ id: 2, available: true }],
			];
			// Move from (0,0) down. Should skip empty row 1 and return item from row 2.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 2, available: true });
		});

		it('should skip empty rows and move to the next non-empty row for vertical movement (up)', () => {
			// From (2,0) which is {id:2, true}
			// Consider a matrix like:
			// [ [A] ]
			// [ [] ]  <- row 1 is empty, should be skipped
			// [ [B] ]
			// From B up, it should skip the empty row 1 and go to row 0, returning A.
			const customMatrix = [
				[{ id: 1, available: true }],
				[], // Empty row
				[{ id: 2, available: true }],
			];
			// Move from (2,0) up. Should skip empty row 1 and return item from row 0.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 2,
					currentCol: 0,
					direction: 'up',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 1, available: true });
		});

		it('should skip rows where its all unavailable (down)', () => {
			// From (0,0) which is {id:1, true}
			// Consider a matrix like:
			// [ [A] ]
			// [ [unavailable] ]
			// [ [B] ]
			// From A down, it should skip the unavailable row 1 and go to row 2, returning B.
			const customMatrix = [
				[{ id: 1, available: true }],
				[{ id: 3, available: false }], // Row with unavailable item
				[{ id: 2, available: true }],
			];

			// Move from (0,0) down. Should skip unavailable row 1 and return item from row 2.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 2, available: true });
		});

		it('should skip rows where its all unavailable (up)', () => {
			// From (2,0) which is {id:2, true}
			// Consider a matrix like:
			// [ [A] ]
			// [ [unavailable] ]
			// [ [B] ]
			// From B up, it should skip the unavailable row 1 and go to row 0, returning A.
			const customMatrix = [
				[{ id: 1, available: true }],
				[{ id: 3, available: false }], // Row with unavailable item
				[{ id: 2, available: true }],
			];

			// Move from (2,0) up. Should skip unavailable row 1 and return item from row 0.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 2,
					currentCol: 0,
					direction: 'up',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 1, available: true });
		});

		it('should skip multiple consecutive unavailable rows (down)', () => {
			// Test skipping multiple rows with all unavailable items
			const customMatrix = [
				[{ id: 1, available: true }],
				[{ id: 2, available: false }], // Unavailable row 1
				[{ id: 3, available: false }], // Unavailable row 2
				[{ id: 4, available: false }], // Unavailable row 3
				[{ id: 5, available: true }], // Available row 4
			];

			// Move from (0,0) down. Should skip rows 1, 2, 3 and return item from row 4.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 5, available: true });
		});

		it('should skip multiple consecutive unavailable rows (up)', () => {
			// Test skipping multiple rows with all unavailable items
			const customMatrix = [
				[{ id: 1, available: true }], // Available row 0
				[{ id: 2, available: false }], // Unavailable row 1
				[{ id: 3, available: false }], // Unavailable row 2
				[{ id: 4, available: false }], // Unavailable row 3
				[{ id: 5, available: true }], // Available row 4
			];

			// Move from (4,0) up. Should skip rows 3, 2, 1 and return item from row 0.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 4,
					currentCol: 0,
					direction: 'up',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 1, available: true });
		});

		it('should skip unavailable items when moving horizontally (right)', () => {
			// Test skipping unavailable items in horizontal movement
			const customMatrix = [
				[
					{ id: 1, available: true }, // col 0 - current
					{ id: 2, available: false }, // col 1 - unavailable, should skip
					{ id: 3, available: false }, // col 2 - unavailable, should skip
					{ id: 4, available: true }, // col 3 - available, should find
				],
			];

			// Move from (0,0) right. Should skip unavailable cols 1,2 and return item from col 3.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'right',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 4, available: true });
		});

		it('should skip unavailable items when moving horizontally (left)', () => {
			// Test skipping unavailable items in horizontal movement
			const customMatrix = [
				[
					{ id: 1, available: true }, // col 0 - available, should find
					{ id: 2, available: false }, // col 1 - unavailable, should skip
					{ id: 3, available: false }, // col 2 - unavailable, should skip
					{ id: 4, available: true }, // col 3 - current
				],
			];

			// Move from (0,3) left. Should skip unavailable cols 2,1 and return item from col 0.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 3,
					direction: 'left',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 1, available: true });
		});

		it('advanced test case #1', () => {
			// Test skipping unavailable items and finding available item to the right in target row
			const customMatrix = [
				[{ id: 1, available: true }],
				[{ id: 2, available: false }],
				[{ id: 3, available: false }],
				[
					{ id: 4, available: false },
					{ id: 5, available: true },
				],
			];

			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 5, available: true });
		});

		it('should scan both left and right in target row for vertical movement', () => {
			// Test scanning both directions in target row
			const customMatrix = [
				[{ id: 1, available: true }], // Start at (0,0)
				[{ id: 2, available: false }],
				[
					{ id: 3, available: true },   // col 0 - available (left of start)
					{ id: 4, available: false },  // col 1 - unavailable (would be start col after clamp)
					{ id: 5, available: true },   // col 2 - available (right of start)
				],
			];

			// Move from (0,0) down to row 2. Should find id: 3 (scan left first)
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 3, available: true });
		});

		it('should find item to the right when left scan fails for vertical movement', () => {
			// Test finding item to the right when left scan fails
			const customMatrix = [
				[{ id: 1, available: true }], // Start at (0,0) 
				[{ id: 2, available: false }],
				[
					{ id: 3, available: false },  // col 0 - unavailable (start col after clamp)
					{ id: 4, available: true },   // col 1 - available (right of start)
				],
			];

			// Move from (0,0) down to row 2. Should find id: 4 (scan right after left fails)
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'down',
					isAvailable: isTestItemAvailable,
				})
			).toEqual({ id: 4, available: true });
		});

		it('should return undefined when no available items found horizontally', () => {
			// Test when all items in horizontal direction are unavailable
			const customMatrix = [
				[
					{ id: 1, available: true }, // col 0 - current
					{ id: 2, available: false }, // col 1 - unavailable
					{ id: 3, available: false }, // col 2 - unavailable
				],
			];

			// Move from (0,0) right. Should skip all unavailable items and return undefined.
			expect(
				getNextMatrixItem({
					matrix: customMatrix,
					currentRow: 0,
					currentCol: 0,
					direction: 'right',
					isAvailable: isTestItemAvailable,
				})
			).toBeUndefined();
		});
	});

	// --- Combined Scenarios ---

	describe('Combined Scenarios', () => {
		it('should handle snapping and then scanning for availability correctly (down)', () => {
			// Matrix:
			// [ T, F, F ]
			// [ F, F ]  <- all unavailable, should be skipped
			// [ T, F, T, T ]
			// From (0,0) (T) down. Row 1 has all unavailable items, so skip to row 2.
			// Should find available item at (2,0).
			const matrix = [
				[
					{ id: 1, available: true },
					{ id: 2, available: false },
					{ id: 3, available: false },
				],
				[
					{ id: 4, available: false },
					{ id: 5, available: false },
				],
				[
					{ id: 6, available: true },
					{ id: 7, available: false },
					{ id: 8, available: true },
					{ id: 9, available: true },
				],
			];
			const result = getNextMatrixItem({
				matrix,
				currentRow: 0,
				currentCol: 0,
				direction: 'down',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toEqual({ id: 6, available: true }); // Found in row 2
		});

		it('should handle snapping and then scanning for availability correctly (up)', () => {
			// Matrix:
			// [ F, F ]
			// [ T, F, F ]
			// From (1,0) (T) up. Target row 0. Initial nextCol is 0. Item (0,0) is F.
			// Snaps to (0,0) (F). Scan left. No more left. Should return undefined.
			const matrix = [
				[
					{ id: 1, available: false },
					{ id: 2, available: false },
				],
				[
					{ id: 3, available: true },
					{ id: 4, available: false },
					{ id: 5, available: false },
				],
			];
			const result = getNextMatrixItem({
				matrix,
				currentRow: 1,
				currentCol: 0,
				direction: 'up',
				isAvailable: isTestItemAvailable,
			});
			expect(result).toBeUndefined();
		});
	});
});
