<script lang="ts">
	import { setupConvex } from 'convex-svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { models } from '$lib/state/models.svelte';
	import GlobalModal from '$lib/components/ui/modal/global-modal.svelte';
	import { attachShortcut, shortcut } from '$lib/actions/shortcut.svelte';
	import { goto } from '$app/navigation';
	import { openSearchModal } from './chat/search-modal.svelte';

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	models.init();
</script>

<svelte:window
	use:shortcut={{ ctrl: true, shift: true, key: 'o', callback: () => goto('/chat') }}
/>

<ModeWatcher />
{@render children()}

<GlobalModal />
