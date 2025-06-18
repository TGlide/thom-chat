import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
import { h } from 'hastscript';
import MarkdownItAsync from 'markdown-it-async';
import { codeToHtml } from 'shiki';
import DOMPurify from 'isomorphic-dompurify';

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
			transformers: [
				{
					name: 'shiki-transformer-copy-button',
					pre(node) {
						const button = h(
							'button',
							{
								class: 'copy',
								'data-code': this.source,
								onclick: `
          navigator.clipboard.writeText(this.dataset.code);
          this.classList.add('copied');
          setTimeout(() => this.classList.remove('copied'), ${3000})
        `,
							},
							[h('span', { class: 'ready' }), h('span', { class: 'success' })]
						);

						node.children.push(button);
					},
				},
			],
		}
	)
);

function sanitizeHtml(html: string) {
	return DOMPurify.sanitize(html);
}

export { md, sanitizeHtml };
