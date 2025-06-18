import { fromAsyncCodeToHtml } from '@shikijs/markdown-it/async';
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
		}
	)
);

function sanitizeHtml(html: string) {
	return DOMPurify.sanitize(html);
}

export { md, sanitizeHtml };
