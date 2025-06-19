<script lang="ts">
	import type { Props } from '.';
	import { cn } from '$lib/utils/utils';

	let { class: className, ...rest }: Props = $props();
</script>

<svg
	class={cn('size-4', className)}
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	version="1.1"
	xmlns="http://www.w3.org/2000/svg"
	{...rest}
>
	<g transform="translate(-3.8357017)">
		<path
			d="m 6.02,5.78 m 0,15.31 V 4.55 m 0,0 V 2.64 m 0,3.14 V 4.55 m 0,1.23 c 0,1.61 1.21,3.11 3.2,3.94 l 4.58,1.92 c 1.98,0.83 3.2,2.32 3.2,3.94 v 3.84"
		/>
		<path d="m 20.53,17.59 -3.41,3.66 -3.66,-3.41" />
	</g>
	<g
		transform="matrix(0.50200343,0,0,0.50200343,8.639999,3.1460103)"
		style="stroke-width:2.99599547;stroke-dasharray:none"
	>
		<path
			d="M 28,7 A 9,9 0 0 0 19,-2 9.75,9.75 0 0 0 12.26,0.74 L 10,3"
			style="stroke-width:2.99599547;stroke-dasharray:none"
		/>
		<path d="m 10,-2 v 5 h 5" style="stroke-width:2.99599547;stroke-dasharray:none" />
		<path
			d="m 10,7 a 9,9 0 0 0 9,9 9.75,9.75 0 0 0 6.74,-2.74 L 28,11"
			style="stroke-width:2.99599547;stroke-dasharray:none"
		/>
		<path d="m 23,11 h 5 v 5" style="stroke-width:2.99599547;stroke-dasharray:none" />
	</g>
</svg>
