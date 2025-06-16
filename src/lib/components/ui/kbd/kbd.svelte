<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	const style = tv({
		base: 'inline-flex place-items-center justify-center gap-1 rounded-md p-0.5',
		variants: {
			variant: {
				outline: 'border-border bg-background text-muted-foreground border',
				secondary: 'bg-secondary text-muted-foreground',
				primary: 'bg-primary text-primary-foreground',
			},
			size: {
				sm: 'min-w-6 gap-1.5 p-0.5 px-1 text-sm',
				default: 'min-w-8 gap-1.5 p-1 px-2',
				lg: 'min-w-9 gap-2 p-1 px-3 text-lg',
			},
		},
	});

	type Size = VariantProps<typeof style>['size'];
	type Variant = VariantProps<typeof style>['variant'];

	export type KbdPropsWithoutHTML = {
		ref?: HTMLElement | null;
		class?: string;
		size?: Size;
		variant?: Variant;
		children?: Snippet<[]>;
	};

	export type KbdProps = KbdPropsWithoutHTML;
</script>

<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		size = 'sm',
		variant = 'outline',
		children,
	}: KbdProps = $props();
</script>

<kbd bind:this={ref} class={cn(style({ size, variant }), className)}>
	{@render children?.()}
</kbd>
