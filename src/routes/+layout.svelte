<script lang="ts">
	import { setupConvex } from 'convex-svelte';
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { PUBLIC_CONVEX_URL } from '$env/static/public';
	import { models } from '$lib/state/models.svelte';

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	models.init();
</script>

<ModeWatcher />
{@render children()}
