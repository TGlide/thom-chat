<script lang="ts">
	import { Provider, type ProviderMeta } from '$lib/types';
	import { useQuery } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';
	import ProviderCard from './provider-card.svelte';

	const allProviders = Object.values(Provider);

	const providersMeta: Record<Provider, ProviderMeta> = {
		[Provider.OpenRouter]: {
			title: 'OpenRouter',
			link: 'https://openrouter.ai/settings/keys',
			description: 'API Key for OpenRouter.',
			models: ['a shit ton'],
			placeholder: 'sk-or-...',
		},
		[Provider.HuggingFace]: {
			title: 'HuggingFace',
			link: 'https://huggingface.co/settings/tokens',
			description: 'API Key for HuggingFace, for open-source models.',
			placeholder: 'hf_...',
		},
		[Provider.OpenAI]: {
			title: 'OpenAI',
			link: 'https://platform.openai.com/account/api-keys',
			description: 'API Key for OpenAI.',
			models: ['gpt-3.5-turbo', 'gpt-4'],
			placeholder: 'sk-...',
		},
		[Provider.Anthropic]: {
			title: 'Anthropic',
			link: 'https://console.anthropic.com/account/api-keys',
			description: 'API Key for Anthropic.',
			models: [
				'Claude 3.5 Sonnet',
				'Claude 3.7 Sonnet',
				'Claude 3.7 Sonnet (Reasoning)',
				'Claude 4 Opus',
				'Claude 4 Sonnet',
				'Claude 4 Sonnet (Reasoning)',
			],
			placeholder: 'sk-ant-...',
		},
	};
</script>

<svelte:head>
	<title>API Keys | Thom.chat</title>
</svelte:head>

<div>
	<h1 class="text-2xl font-bold">API Keys</h1>
	<h2 class="text-muted-foreground mt-2 text-sm">
		Bring your own API keys for select models. Messages sent using your API keys will not count
		towards your monthly limits.
	</h2>
</div>

<div class="mt-8 flex flex-col gap-4">
	{#each allProviders as provider (provider)}
		{@const meta = providersMeta[provider]}
		<ProviderCard {provider} {meta} />
	{/each}
</div>
