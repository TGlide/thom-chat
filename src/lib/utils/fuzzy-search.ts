export type SearchMode = 'exact' | 'words' | 'fuzzy';

export interface SearchResult<T> {
	item: T;
	score: number;
	matchType: 'exact' | 'word' | 'fuzzy';
}

/**
 * Enhanced search function with scoring and multiple search modes
 */
export default function enhancedSearch<T>(options: {
	needle: string;
	haystack: T[];
	property: keyof T | ((item: T) => string);
	mode?: SearchMode;
	minScore?: number;
}): SearchResult<T>[] {
	const { needle, haystack, property, mode = 'words', minScore = 0.3 } = options;

	if (!Array.isArray(haystack)) {
		throw new Error('Haystack must be an array');
	}

	if (!property) {
		throw new Error('Property selector is required');
	}

	const lowerNeedle = needle.toLowerCase().trim();
	if (!lowerNeedle) return [];

	const results: SearchResult<T>[] = [];

	for (const item of haystack) {
		const value = typeof property === 'function' ? property(item) : String(item[property]);
		const lowerValue = value.toLowerCase();

		const result = scoreMatch(lowerNeedle, lowerValue, mode);
		if (result && result.score >= minScore) {
			results.push({
				item,
				score: result.score,
				matchType: result.matchType,
			});
		}
	}

	// Sort by score (highest first), then by match type priority
	return results.sort((a, b) => {
		if (a.score !== b.score) return b.score - a.score;
		
		const typePriority = { exact: 3, word: 2, fuzzy: 1 };
		return typePriority[b.matchType] - typePriority[a.matchType];
	});
}

/**
 * Legacy fuzzy search function for backward compatibility
 */
export function fuzzysearch<T>(options: {
	needle: string;
	haystack: T[];
	property: keyof T | ((item: T) => string);
}): T[] {
	return enhancedSearch(options).map(result => result.item);
}

/**
 * Score a match between needle and haystack
 */
function scoreMatch(needle: string, haystack: string, mode: SearchMode): { score: number; matchType: 'exact' | 'word' | 'fuzzy' } | null {
	// Exact match gets highest score
	if (haystack === needle) {
		return { score: 1.0, matchType: 'exact' };
	}

	// Check for exact substring match
	if (haystack.includes(needle)) {
		const score = needle.length / haystack.length;
		return { score: Math.max(0.8, score), matchType: 'exact' };
	}

	// Word boundary matching - check if needle matches at word boundaries
	if (mode === 'words' || mode === 'fuzzy') {
		const wordScore = scoreWordMatch(needle, haystack);
		if (wordScore > 0) {
			return { score: wordScore, matchType: 'word' };
		}
	}

	// Fuzzy matching as fallback
	if (mode === 'fuzzy') {
		const fuzzyScore = scoreFuzzyMatch(needle, haystack);
		if (fuzzyScore > 0) {
			return { score: fuzzyScore, matchType: 'fuzzy' };
		}
	}

	return null;
}

/**
 * Score word boundary matches
 */
function scoreWordMatch(needle: string, haystack: string): number {
	const words = haystack.split(/\s+/);
	const needleWords = needle.split(/\s+/);
	
	// Check for exact word matches
	let exactWordMatches = 0;
	let partialWordMatches = 0;
	
	for (const needleWord of needleWords) {
		let found = false;
		for (const word of words) {
			if (word === needleWord) {
				exactWordMatches++;
				found = true;
				break;
			} else if (word.startsWith(needleWord)) {
				partialWordMatches++;
				found = true;
				break;
			}
		}
	}
	
	const totalNeedleWords = needleWords.length;
	if (exactWordMatches === totalNeedleWords) {
		return 0.9; // High score for all words matching exactly
	}
	
	if (exactWordMatches + partialWordMatches === totalNeedleWords) {
		return 0.7 * (exactWordMatches / totalNeedleWords) + 0.3 * (partialWordMatches / totalNeedleWords);
	}
	
	// Check if needle appears at the start of any word
	for (const word of words) {
		if (word.startsWith(needle)) {
			return 0.6;
		}
	}
	
	return 0;
}

/**
 * Score fuzzy matches with distance penalty
 */
function scoreFuzzyMatch(needle: string, haystack: string): number {
	if (!fuzzyMatchString(needle, haystack)) {
		return 0;
	}
	
	// Calculate a score based on how close the characters are
	let score = 0;
	let lastIndex = -1;
	let consecutiveMatches = 0;
	
	for (let i = 0; i < needle.length; i++) {
		const char = needle.charAt(i);
		const index = haystack.indexOf(char, lastIndex + 1);
		
		if (index === -1) {
			return 0; // This shouldn't happen if fuzzyMatchString returned true
		}
		
		if (index === lastIndex + 1) {
			consecutiveMatches++;
			score += 0.1; // Bonus for consecutive matches
		} else {
			consecutiveMatches = 0;
		}
		
		// Penalty based on distance
		const distance = index - lastIndex - 1;
		score += Math.max(0, 0.05 - distance * 0.01);
		
		lastIndex = index;
	}
	
	// Normalize score
	score = score / needle.length;
	
	// Length ratio bonus
	const lengthRatio = needle.length / haystack.length;
	score *= (0.5 + lengthRatio * 0.5);
	
	return Math.min(0.5, Math.max(0.1, score)); // Cap fuzzy scores at 0.5
}

/**
 * Legacy fuzzy match function for backward compatibility
 */
export function fuzzyMatchString(needle: string, haystack: string): boolean {
	const hlen = haystack.length;
	const nlen = needle.length;

	if (nlen > hlen) {
		return false;
	}

	if (nlen === hlen) {
		return needle === haystack;
	}

	outer: for (let i = 0, j = 0; i < nlen; i++) {
		const nch = needle.charCodeAt(i);
		while (j < hlen) {
			if (haystack.charCodeAt(j++) === nch) {
				continue outer;
			}
		}
		return false;
	}

	return true;
}
