import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { fromHighlighter } from '@shikijs/markdown-it/core';
import MarkdownIt from 'markdown-it';
import { createHighlighterCore } from 'shiki/core';
import type { Getter } from 'runed';

const bundledLanguages = {
	bash: () => import('@shikijs/langs/bash'),
	diff: () => import('@shikijs/langs/diff'),
	javascript: () => import('@shikijs/langs/javascript'),
	json: () => import('@shikijs/langs/json'),
	svelte: () => import('@shikijs/langs/svelte'),
	typescript: () => import('@shikijs/langs/typescript'),
};

/** A preloaded highlighter instance. */
export const highlighter = createHighlighterCore({
	themes: [
		import('@shikijs/themes/github-light-default'),
		import('@shikijs/themes/github-dark-default'),
	],
	langs: Object.entries(bundledLanguages).map(([_, lang]) => lang),
	engine: createJavaScriptRegexEngine(),
});

const md = MarkdownIt();

highlighter.then((h) => {
	md.use(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		fromHighlighter(h as any, {
			themes: {
				light: 'github-light-default',
				dark: 'github-dark-default',
			},
		})
	);
});

export class Markdown {
	constructor(readonly code: Getter<string>) {}

	get current() {
		return md.render(this.code());
	}
}
