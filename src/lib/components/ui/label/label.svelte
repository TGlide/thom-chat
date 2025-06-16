<script lang="ts">
	import { cn } from '$lib/utils/utils.js';
	import type { HTMLLabelAttributes } from 'svelte/elements';

	let { class: className, children, ...rest }: HTMLLabelAttributes = $props();
</script>

<label
	class={cn(
		'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className
	)}
	{...rest}
>
	{@render children?.()}
</label>
