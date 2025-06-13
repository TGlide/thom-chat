<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, children, ...restProps }: HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h3 class={cn('text-lg font-semibold', className)} {...restProps}>
	{@render children?.()}
</h3>
