<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { Button } from '$lib/components/ui/button';
	import { session } from '$lib/state/session.svelte';
	import { Provider } from '$lib/types.js';
	import { cn } from '$lib/utils/utils';
	import ModelCard from './model-card.svelte';

	let { data } = $props();

	const enabledModels = useCachedQuery(api.user_enabled_models.get_enabled, {
		user_id: session.current?.user.id ?? '',
	});

	const openRouterKeyQuery = useCachedQuery(api.user_keys.get, {
		user_id: session.current?.user.id ?? '',
		provider: Provider.OpenRouter,
	});

	const hasOpenRouterKey = $derived(
		openRouterKeyQuery.data !== undefined && openRouterKeyQuery.data !== ''
	);
</script>

<svelte:head>
	<title>Models | Thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Available Models</h1>
<h2 class="text-muted-foreground mt-2 text-sm">
	Choose which models appear in your model selector. This won't affect existing conversations.
</h2>

<div class="mt-8 flex flex-col gap-4">
	<div>
		<h3 class="text-lg font-bold">OpenRouter</h3>
		<p class="text-muted-foreground text-sm">Easy access to over 400 models.</p>
	</div>
	<div class="relative">
		<div
			class={cn('flex flex-col gap-4 overflow-hidden', {
				'pointer-events-none max-h-96 mask-b-from-0% mask-b-to-80%': !hasOpenRouterKey,
			})}
		>
			{#each data.openRouterModels as model (model.id)}
				{@const enabled = enabledModels.data?.[`${Provider.OpenRouter}:${model.id}`] !== undefined}
				<ModelCard provider={Provider.OpenRouter} {model} {enabled} disabled={!hasOpenRouterKey} />
			{/each}
		</div>
		{#if !hasOpenRouterKey}
			<div
				class="absolute bottom-10 left-0 z-10 flex w-full place-items-center justify-center gap-2"
			>
				<Button href="/account/api-keys#openrouter" class="w-fit">Add API Key</Button>
			</div>
		{/if}
	</div>
</div>
