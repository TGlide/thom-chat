<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { KeyIcon } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Link } from '$lib/components/ui/link';
	import { Provider } from '$lib/types';
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';

	const allProviders = Object.values(Provider);

	type ProviderMeta = {
		title: string;
		link: string;
		description: string;
		models?: string[];
		placeholder?: string;
	};

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

	const client = useConvexClient();

	function createSubmit(provider: Provider) {
		return (e: SubmitEvent) => {
			e.preventDefault();
			const form = e.target as HTMLFormElement;
			const formData = new FormData(form);
			const key = formData.get('key');
			if (!key || !session.current?.user.id) return;

			client.mutation(api.user_keys.set, {
				provider,
				user_id: session.current?.user.id ?? '',
				key: `${key}`,
			});
		};
	}

	const keys = useQuery(api.user_keys.get, { user_id: session.current?.user.id ?? '' });
</script>

<h1 class="text-2xl font-bold">API Keys</h1>
<h2 class="text-muted-foreground mt-2 text-sm">
	Bring your own API keys for select models. Messages sent using your API keys will not count
	towards your monthly limits.
</h2>

<div class="mt-8 flex flex-col gap-8">
	{#each allProviders as provider (provider)}
		{@const meta = providersMeta[provider]}
		<Card.Root>
			<Card.Header>
				<Card.Title>
					<KeyIcon class="inline size-4" />
					{meta.title}
				</Card.Title>
				<Card.Description>{meta.description}</Card.Description>
			</Card.Header>
			<Card.Content tag="form" onsubmit={createSubmit(provider)}>
				<div class="flex flex-col gap-1">
					{#if !keys.isLoading}
						<Input
							type="password"
							placeholder={meta.placeholder ?? ''}
							autocomplete="off"
							name="key"
							value={keys.data?.[provider]}
						/>
					{:else}
						<div class="flex place-items-center gap-2">
							<span>Add a skeleton here bruh</span>
						</div>
					{/if}
					<span class="text-muted-foreground text-xs">
						Get your API key from
						<Link href={meta.link} target="_blank" class="text-blue-500">
							{meta.title}
						</Link>
					</span>
				</div>
				<div class="flex justify-end">
					<Button type="submit">Save</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
