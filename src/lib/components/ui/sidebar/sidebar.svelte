<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebar } from './sidebar.svelte.js';

	let { children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	const sidebar = useSidebar();
</script>

<div
	{...rest}
	class={cn('[--sidebar-width:0px] md:grid md:grid-cols-[var(--sidebar-width)_1fr]', {
		'[--sidebar-width:250px]': sidebar.showSidebar
	})}
>
	{@render children?.()}
</div>
