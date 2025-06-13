<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	let { class: className, children, ...restProps }: HTMLAnchorAttributes = $props();
</script>

<a class={cn('text-primary', className)} {...restProps}>
	{@render children?.()}
</a>
