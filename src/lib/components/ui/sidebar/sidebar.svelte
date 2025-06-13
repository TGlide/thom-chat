<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebar } from './sidebar.svelte.js';

	let { children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	const sidebar = useSidebar();
</script>

<div
	{...rest}
	class={cn('grid grid-cols-[var(--sidebar-width)_1fr] transition-all [--sidebar-width:0px]', {
		'[--sidebar-width:250px]': sidebar.open,
	})}
>
	{@render children?.()}
</div>
