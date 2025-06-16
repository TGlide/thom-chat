<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { TextareaAutosize } from '$lib/spells/textarea-autosize.svelte.js';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = HTMLTextareaAttributes & {
		autosize?: boolean;
	};
	let { value = $bindable(''), class: className, autosize = false, ...rest }: Props = $props();

	const autosizeTextarea = new TextareaAutosize();
</script>

<textarea
	{...rest}
	bind:value
	class={cn(
		'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{@attach (node) => {
		if (!autosize) return;
		autosizeTextarea.attachment(node);
	}}
></textarea>
