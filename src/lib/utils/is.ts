export function isString(value: unknown): value is string {
	return typeof value === 'string';
}

export function isHtmlElement(value: unknown): value is HTMLElement {
	return value instanceof HTMLElement;
}
