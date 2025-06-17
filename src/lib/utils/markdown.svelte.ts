import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import MarkdownItAsync from 'markdown-it-async';
import type { Getter } from 'runed';
import { codeToHtml } from 'shiki';

const md = MarkdownItAsync();

md.use(
	fromAsyncCodeToHtml(
		// Pass the codeToHtml function
		codeToHtml,
		{
			themes: {
				light: 'github-light-default',
				dark: 'github-dark-default',
			},
		}
	)
);

export class Markdown {
	highlighted = $state<string | null>(null);

	constructor(readonly code: Getter<string>) {
		$effect(() => {
			md.renderAsync(this.code()).then((html) => {
				this.highlighted = html;
			});
		});
	}

	get current() {
		return this.highlighted;
	}
}
