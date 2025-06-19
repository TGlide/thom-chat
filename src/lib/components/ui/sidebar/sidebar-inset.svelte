<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...rest} class={cn('bg-background bg-noise col-start-2 fill-device-height', className)}>
	{@render children?.()}
</div>
