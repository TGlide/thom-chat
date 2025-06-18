<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebar } from './sidebar.svelte.js';
	import { shortcut } from '$lib/actions/shortcut.svelte.js';

	let {
		open = $bindable(false),
		children,
		...rest
	}: HTMLAttributes<HTMLDivElement> & { open?: boolean } = $props();

	const sidebar = useSidebar();

	$effect(() => {
		open = sidebar.showSidebar;
	});
</script>

<svelte:window use:shortcut={{ key: 'b', ctrl: true, callback: sidebar.toggle }} />

<div
	{...rest}
	class={cn(
		'[--sidebar-width:0px] md:grid md:grid-cols-[var(--sidebar-width)_1fr]',
		{
			'[--sidebar-width:250px]': sidebar.showSidebar,
		},
		rest.class
	)}
>
	{@render children?.()}
</div>
