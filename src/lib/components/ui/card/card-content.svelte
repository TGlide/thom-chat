<script lang="ts" generics="Tag extends keyof HTMLElementTagNameMap">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	type ElementTag = HTMLElementTagNameMap[Tag];
	let {
		tag = 'div' as Tag,
		class: className,
		children,
		...restProps
	}: HTMLAttributes<ElementTag> & { tag?: Tag } = $props();
</script>

<!-- eslint-disable-next-line @typescript-eslint/no-explicit-any -->
<svelte:element this={tag} class={cn('flex flex-col gap-2', className)} {...restProps as any}>
	{@render children?.()}
</svelte:element>
