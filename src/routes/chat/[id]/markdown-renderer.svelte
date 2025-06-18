<script lang="ts">
	import { sanitizeHtml } from '$lib/utils/markdown-it';
	import { Markdown } from '$lib/utils/markdown.svelte';

	type Props = {
		content: string;
	};

	let { content }: Props = $props();

	const markdown = new Markdown(() => content);
</script>

{@html sanitizeHtml(markdown.current ?? '')}
