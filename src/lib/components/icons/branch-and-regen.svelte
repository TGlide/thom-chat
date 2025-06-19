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
		d="M2.96132 21.09V4.55M2.96132 4.55V2.64M2.96132 4.55V5.78C2.96132 7.39 4.17132 8.89 6.16132 9.72L10.7413 11.64C12.7213 12.47 13.9413 13.96 13.9413 15.58V19.42"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<path
		d="M17.4713 17.59L14.0613 21.25L10.4013 17.84"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<path
		d="M20.8382 6.76662C20.8382 5.5946 20.3727 4.47058 19.5439 3.64183C18.7152 2.81309 17.5911 2.3475 16.4191 2.3475C15.1837 2.35215 13.9979 2.83421 13.1097 3.69288L12 4.80257"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<path
		d="M12 2.3475V4.80257H14.4551"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<path
		d="M12 6.76662C12 7.93865 12.4656 9.06267 13.2943 9.89141C14.1231 10.7202 15.2471 11.1857 16.4191 11.1857C17.6545 11.1811 18.8403 10.699 19.7285 9.84037L20.8382 8.73068"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
	<path
		d="M18.3832 8.73067H20.8382V11.1857"
		stroke="currentColor"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
</svg>
