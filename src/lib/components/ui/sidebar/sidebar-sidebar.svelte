<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { box } from 'svelte-toolbelt';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebarSidebar } from './sidebar.svelte.js';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	let dialogRef = $state<HTMLDialogElement | null>(null);

	const sidebar = useSidebarSidebar({ dialogRef: box.with(() => dialogRef) });
</script>

{#if sidebar.root.isMobile.current}
	{#if sidebar.root.showSidebar}
		<dialog
			bind:this={dialogRef}
			class={cn('bg-sidebar top-0 left-0 h-svh w-[--sidebar-width]', className)}
		>
			{@render children?.()}
		</dialog>
	{/if}
{:else}
	<div
		{...rest}
		class={cn('bg-sidebar col-start-1 h-screen w-[--sidebar-width]', className)}
	>
		{@render children?.()}
	</div>
{/if}
