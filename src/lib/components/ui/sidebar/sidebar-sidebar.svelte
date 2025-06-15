<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebarSidebar } from './sidebar.svelte.js';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	const sidebar = useSidebarSidebar();
</script>

{#if sidebar.root.showSidebar}
	<div {...rest} class={cn('bg-sidebar col-start-1 h-screen w-[--sidebar-width]', className)}>
		{@render children?.()}
	</div>
{/if}
