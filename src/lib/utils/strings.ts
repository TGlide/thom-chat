export function getFirstSentence(text: string): [string | null, string] {
	// match any punctuation followed by a space or the end of the string
	const index = text.match(/[.!?](\s|$)/)?.index;

	if (index === undefined) return [null, text];

	return [text.slice(0, index + 1), text];
}
