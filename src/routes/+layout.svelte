<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { shortcut } from '$lib/actions/shortcut.svelte';
	import GlobalModal from '$lib/components/ui/modal/global-modal.svelte';
	import { models } from '$lib/state/models.svelte';
	import { setupConvex } from 'convex-svelte';
	import { ModeWatcher } from 'mode-watcher';
	import '../app.css';
	import { browser } from '$app/environment';

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	models.init();
</script>

<svelte:window
	use:shortcut={{ ctrl: true, shift: true, key: 'o', callback: () => goto('/chat') }}
/>

<ModeWatcher />
{#if browser}
	{@render children()}
{/if}

<GlobalModal />
