<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebarSidebar } from './sidebar.svelte.js';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	const sidebar = useSidebarSidebar();
</script>

{#if sidebar.root.showSidebar}
	<div
		{...rest}
		class={cn(
			'bg-sidebar border-sidebar-border col-start-1 fill-device-height w-[--sidebar-width] border-r',
			className
		)}
	>
		{@render children?.()}
	</div>
{/if}
