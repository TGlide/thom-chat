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
	import { MetaTags } from 'svelte-meta-tags';
	import { page } from '$app/state';

	let { children } = $props();

	setupConvex(PUBLIC_CONVEX_URL);
	models.init();
</script>

<MetaTags
	title="thom.chat"
	description="The OpenSource T3Chat alternative."
	keywords={['svelte', 't3', 'chat', 'ai']}
	twitter={{
		cardType: 'summary_large_image',
		title: 'thom.chat',
		description: 'The OpenSource T3Chat alternative.',
		image: 'https://thom.chat/og.png',
		creator: '@thomasglopes',
	}}
	openGraph={{
		url: page.url.toString(),
		type: 'website',
		title: 'thom.chat',
		description: 'The OpenSource T3Chat alternative.',
		siteName: 'thom.chat',
		images: [
			{
				url: 'https://thom.chat/og.png',
				width: 2014,
				height: 1143,
				alt: 'thom.chat',
			},
		],
	}}
/>

<svelte:window
	use:shortcut={{ ctrl: true, shift: true, key: 'o', callback: () => goto('/chat') }}
/>

<ModeWatcher />
{#if browser}
	{@render children()}
{/if}

<GlobalModal />
