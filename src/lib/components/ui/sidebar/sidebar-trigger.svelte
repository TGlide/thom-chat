<script lang="ts">
	import { Button, type ButtonElementProps } from '$lib/components/ui/button';
	import { cn } from '$lib/utils/utils.js';
	import { useSidebarTrigger } from './sidebar.svelte.js';

	let {
		class: className,
		variant = 'ghost',
		size = 'icon',
		onclick,
		children,
		...rest
	}: ButtonElementProps = $props();

	const trigger = useSidebarTrigger();
</script>

<Button
	{...rest}
	{variant}
	{size}
	class={cn('', className)}
	onclick={(e: Parameters<NonNullable<ButtonElementProps['onclick']>>[0]) => {
		onclick?.(e);
		trigger.toggle();
	}}
>
	{@render children?.()}
</Button>
