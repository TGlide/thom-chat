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
						const copyIcon = h(
							'svg',
							{
								width: '24',
								height: '24',
								viewBox: '0 0 24 24',
								fill: 'none',
								stroke: 'currentColor',
								'stroke-width': '2',
								'stroke-linecap': 'round',
								'stroke-linejoin': 'round',
							},
							[
								h('rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }),
								h('path', {
									d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
								}),
							]
						);

						const checkIcon = h(
							'svg',
							{
								width: '24',
								height: '24',
								viewBox: '0 0 24 24',
								fill: 'none',
								stroke: 'currentColor',
								'stroke-width': '2',
								'stroke-linecap': 'round',
								'stroke-linejoin': 'round',
							},
							[h('path', { d: 'M20 6 9 17l-5-5' })]
						);

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
							[
								h('span', { class: 'ready', style: 'background-color: transparent !important;' }, [
									copyIcon,
								]),
								h(
									'span',
									{ class: 'success', style: 'background-color: transparent !important;' },
									[checkIcon]
								),
							]
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
