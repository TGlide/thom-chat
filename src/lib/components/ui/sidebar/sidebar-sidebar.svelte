<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	{...rest}
	class={cn('bg-sidebar col-start-1 h-screen w-[--sidebar-width] transition-all', className)}
>
	{@render children?.()}
</div>
