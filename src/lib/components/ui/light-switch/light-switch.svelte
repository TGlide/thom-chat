<!--
	Installed from @ieedan/shadcn-svelte-extras
-->

<script lang="ts">
	import SunIcon from '~icons/lucide/sun';
	import MoonIcon from '~icons/lucide/moon';
	import { toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { LightSwitchProps } from './types';
	import Tooltip from '../tooltip.svelte';

	let { variant = 'outline', class: className }: LightSwitchProps = $props();
</script>

<Tooltip>
	{#snippet trigger(tooltip)}
		<Button onclick={toggleMode} {variant} size="icon" class={className} {...tooltip.trigger}>
			<SunIcon class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
			<MoonIcon class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
			<span class="sr-only">Toggle theme</span>
		</Button>
	{/snippet}
	Toggle theme
</Tooltip>
