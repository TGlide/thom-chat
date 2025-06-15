<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { Toggle, type ToggleProps } from 'melt/builders';
	import { type ComponentProps } from 'melt';

	let {
		class: className,
		value = $bindable(false),
		...rest
	}: ComponentProps<ToggleProps> & { class?: string } = $props();

	const toggle = new Toggle({
		value: () => value ?? false,
		onValueChange: (v) => (value = v),
		...rest,
	});
</script>

<button
	{...toggle.trigger}
	class={cn(
		'bg-muted-foreground/20 relative h-5 w-10 rounded-full transition-all',
		{ 'bg-primary': toggle.value },
		className
	)}
>
	<span
		class={cn('bg-background absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-all', {
			'bg-primary-foreground': toggle.value,
		})}
		style="transform: translateX({toggle.value ? '20px' : '0px'})"
	></span>
</button>
