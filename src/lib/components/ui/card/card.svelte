<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, children, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={cn('bg-card border-border flex flex-col gap-4 rounded-lg border p-4', className)}
	{...restProps}
>
	{@render children?.()}
</div>
