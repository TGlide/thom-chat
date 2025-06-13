<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLInputAttributes = $props();
</script>

<input
	class={cn(
		'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...restProps}
/>
