<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { LocalToasts } from '$lib/builders/local-toasts.svelte';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Link } from '$lib/components/ui/link';
	import { session } from '$lib/state/session.svelte.js';
	import { Provider, type ProviderMeta } from '$lib/types';
	import KeyIcon from '~icons/lucide/key';
	import { useConvexClient } from 'convex-svelte';
	import { ResultAsync } from 'neverthrow';
	import { resource } from 'runed';
	import * as providers from '$lib/utils/providers';

	type Props = {
		provider: Provider;
		meta: ProviderMeta;
	};

	let { provider, meta }: Props = $props();
	const id = $props.id();

	const keyQuery = useCachedQuery(api.user_keys.get, {
		provider,
		session_token: session.current?.session.token ?? '',
	});

	const client = useConvexClient();

	let loading = $state(false);
	const toasts = new LocalToasts({ id });

	async function submit(e: SubmitEvent) {
		loading = true;

		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const key = formData.get('key');
		if (key === null || !session.current?.user.id) return;

		const res = await ResultAsync.fromPromise(
			client.mutation(api.user_keys.set, {
				provider,
				key: `${key}`,
				session_token: session.current?.session.token,
			}),
			(e) => e
		);

		toasts.addToast({
			data: {
				content: res.isOk() ? 'Saved' : 'Failed to save',
				variant: res.isOk() ? 'info' : 'danger',
			},
		});

		loading = false;
	}

	const apiKeyInfoResource = resource(
		() => keyQuery.data,
		async (key) => {
			if (!key) return null;

			if (provider === Provider.OpenRouter) {
				return (await providers.OpenRouter.getApiKey(key)).unwrapOr(null);
			}

			return null;
		}
	);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title id={provider}>
			<KeyIcon class="inline size-4" />
			{meta.title}
		</Card.Title>
		<Card.Description>{meta.description}</Card.Description>
	</Card.Header>
	<Card.Content tag="form" onsubmit={submit}>
		<div class="flex flex-col gap-1">
			{#if keyQuery.isLoading}
				<div class="bg-input h-9 animate-pulse rounded-md"></div>
			{:else}
				<Input
					type="password"
					placeholder={meta.placeholder ?? ''}
					autocomplete="off"
					name="key"
					value={keyQuery.data!}
				/>
			{/if}
			{#if keyQuery.data}
				{#if apiKeyInfoResource.loading}
					<div class="bg-input h-6 w-[200px] animate-pulse rounded-md"></div>
				{:else if apiKeyInfoResource.current}
					<span class="text-muted-foreground flex h-6 place-items-center text-xs">
						${apiKeyInfoResource.current?.usage.toFixed(3)} used ・ ${apiKeyInfoResource.current?.limit_remaining.toFixed(
							3
						)} remaining
					</span>
				{:else}
					<span
						class="flex h-6 w-fit place-items-center rounded-lg bg-red-500/50 px-2 text-xs text-red-500"
					>
						We encountered an error while trying to check your usage. Please try again later.
					</span>
				{/if}
			{:else}
				<span class="text-muted-foreground text-xs">
					Get your API key from
					<Link href={meta.link} target="_blank" class="text-blue-500">
						{meta.title}
					</Link>
				</span>
			{/if}
		</div>
		<div class="flex justify-end">
			<Button {loading} type="submit" {...toasts.trigger}>Save</Button>
		</div>
	</Card.Content>
</Card.Root>

{#each toasts.toasts as toast (toast)}
	<div {...toast.attrs} class={toast.class}>
		{toast.data.content}
	</div>
{/each}
