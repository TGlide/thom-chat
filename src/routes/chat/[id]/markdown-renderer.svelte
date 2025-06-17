<script lang="ts">
	import { Markdown } from '$lib/utils/markdown.svelte';

	type Props = {
		content: string;
	};

	let { content }: Props = $props();

	const markdown = new Markdown(() => content);
</script>

{@html markdown.current}
