<script lang="ts">
	import type { Props } from '.';
	import { cn } from '$lib/utils/utils';

	let { class: className, ...rest }: Props = $props();
</script>

<svg
	class={cn('size-4 fill-current', className)}
	viewBox="0 0 24 24"
	xmlns="http://www.w3.org/2000/svg"
	{...rest}
>
	<path
		d="M6.02 21.09V4.55M6.02 4.55V2.64M6.02 4.55V5.78C6.02 7.39 7.23 8.89 9.22 9.72L13.8 11.64C15.78 12.47 17 13.96 17 15.58V19.42"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<path
		d="M20.53 17.59L17.12 21.25L13.46 17.84"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
