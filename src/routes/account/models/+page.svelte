<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Search } from '$lib/components/ui/search';
	import { models } from '$lib/state/models.svelte';
	import { session } from '$lib/state/session.svelte';
	import { Provider } from '$lib/types.js';
	import { fuzzysearch } from '$lib/utils/fuzzy-search';
	import { cn } from '$lib/utils/utils';
	import { Toggle } from 'melt/builders';
	import PlusIcon from '~icons/lucide/plus';
	import XIcon from '~icons/lucide/x';
	import ModelCard from './model-card.svelte';
	import { supportsImages, supportsReasoning } from '$lib/utils/model-capabilities';

	const openRouterKeyQuery = useCachedQuery(api.user_keys.get, {
		provider: Provider.OpenRouter,
		session_token: session.current?.session.token ?? '',
	});

	const hasOpenRouterKey = $derived(
		openRouterKeyQuery.data !== undefined && openRouterKeyQuery.data !== ''
	);

	let search = $state('');

	const openRouterToggle = new Toggle({
		value: true,
		// TODO: enable this if and when when we use multiple providers
		disabled: true,
	});

	const freeModelsToggle = new Toggle({
		value: false,
	});

	const reasoningModelsToggle = new Toggle({
		value: false,
	});

	const imageModelsToggle = new Toggle({
		value: false,
	});

	let initiallyEnabled = $state<string[]>([]);
	$effect(() => {
		if (Object.keys(models.enabled).length && initiallyEnabled.length === 0) {
			initiallyEnabled = models
				.from(Provider.OpenRouter)
				.filter((m) => m.enabled)
				.map((m) => m.id);
		}
	});

	const openRouterModels = $derived(
		fuzzysearch({
			haystack: models.from(Provider.OpenRouter).filter((m) => {
				if (freeModelsToggle.value) {
					if (m.pricing.prompt !== '0') return false;
				}

				if (reasoningModelsToggle.value) {
					if (!supportsReasoning(m)) return false;
				}

				if (imageModelsToggle.value) {
					if (!supportsImages(m)) return false;
				}

				return true;
			}),
			needle: search,
			property: 'name',
		}).sort((a, b) => {
			const aEnabled = initiallyEnabled.includes(a.id);
			const bEnabled = initiallyEnabled.includes(b.id);
			if (aEnabled && !bEnabled) return -1;
			if (!aEnabled && bEnabled) return 1;
			return 0;
		})
	);
</script>

<svelte:head>
	<title>Models | thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Available Models</h1>
<h2 class="text-muted-foreground mt-2 text-sm">
	Choose which models appear in your model selector. This won't affect existing conversations.
</h2>

<div class="mt-4 flex flex-col gap-2">
	<Search bind:value={search} placeholder="Search models" />
	<div class="flex place-items-center gap-2">
		<button
			{...openRouterToggle.trigger}
			aria-label="OpenRouter"
			class="group text-primary-foreground bg-primary aria-[pressed=false]:border-border border-primary aria-[pressed=false]:bg-background flex place-items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
		>
			OpenRouter
			<XIcon class="inline size-3 group-aria-[pressed=false]:hidden" />
			<PlusIcon class="inline size-3 group-aria-[pressed=true]:hidden" />
		</button>
		<button
			{...freeModelsToggle.trigger}
			aria-label="Free Models"
			class="group text-primary-foreground bg-primary aria-[pressed=false]:border-border border-primary aria-[pressed=false]:bg-background flex place-items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
		>
			Free
			<XIcon class="inline size-3 group-aria-[pressed=false]:hidden" />
			<PlusIcon class="inline size-3 group-aria-[pressed=true]:hidden" />
		</button>
		<button
			{...reasoningModelsToggle.trigger}
			aria-label="Reasoning Models"
			class="group text-primary-foreground bg-primary aria-[pressed=false]:border-border border-primary aria-[pressed=false]:bg-background flex place-items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
		>
			Reasoning
			<XIcon class="inline size-3 group-aria-[pressed=false]:hidden" />
			<PlusIcon class="inline size-3 group-aria-[pressed=true]:hidden" />
		</button>
		<button
			{...imageModelsToggle.trigger}
			aria-label="Image Models"
			class="group text-primary-foreground bg-primary aria-[pressed=false]:border-border border-primary aria-[pressed=false]:bg-background flex place-items-center gap-1 rounded-full border px-2 py-1 text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
		>
			Images
			<XIcon class="inline size-3 group-aria-[pressed=false]:hidden" />
			<PlusIcon class="inline size-3 group-aria-[pressed=true]:hidden" />
		</button>
	</div>
</div>

{#if openRouterModels.length > 0}
	<div class="mt-4 flex flex-col gap-4">
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
				{#each openRouterModels as model (model.id)}
					<ModelCard
						provider={Provider.OpenRouter}
						{model}
						enabled={model.enabled}
						disabled={!hasOpenRouterKey}
					/>
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
{/if}
