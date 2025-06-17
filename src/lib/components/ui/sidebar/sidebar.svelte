<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';
	import { useSidebar } from './sidebar.svelte.js';
	import { shortcut } from '$lib/actions/shortcut.svelte.js';

	let { children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	const sidebar = useSidebar();
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
