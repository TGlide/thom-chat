import type { Getter } from 'runed';
import { md } from './markdown-it';

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
