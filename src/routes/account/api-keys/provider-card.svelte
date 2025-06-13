<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { KeyIcon } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Link } from '$lib/components/ui/link';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';
	import type { Provider } from '$lib/types';

	type ProviderMeta = {
		title: string;
		link: string;
		description: string;
		models?: string[];
		placeholder?: string;
	};

	type Props = {
		provider: Provider;
		meta: ProviderMeta;
		key: Promise<string>;
	};

	let { provider, meta, key: keyPromise }: Props = $props();

	const client = useConvexClient();

	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		loading = true;

		e.preventDefault();
		try {
			const form = e.target as HTMLFormElement;
			const formData = new FormData(form);
			const key = formData.get('key');
			if (key === null || !session.current?.user.id) return;

			const res = await client.mutation(api.user_keys.set, {
				provider,
				user_id: session.current?.user.id ?? '',
				key: `${key}`,
			});

			// TODO: Setup toast notifications
		} catch {
		} finally {
			loading = false;
		}
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>
			<KeyIcon class="inline size-4" />
			{meta.title}
		</Card.Title>
		<Card.Description>{meta.description}</Card.Description>
	</Card.Header>
	<Card.Content tag="form" onsubmit={submit}>
		<div class="flex flex-col gap-1">
			{#await keyPromise}
				<div class="bg-input h-9 animate-pulse rounded-md"></div>
			{:then key}
				<Input
					type="password"
					placeholder={meta.placeholder ?? ''}
					autocomplete="off"
					name="key"
					value={key}
				/>
			{/await}
			<span class="text-muted-foreground text-xs">
				Get your API key from
				<Link href={meta.link} target="_blank" class="text-blue-500">
					{meta.title}
				</Link>
			</span>
		</div>
		<div class="flex justify-end">
			<Button {loading} type="submit">Save</Button>
		</div>
	</Card.Content>
</Card.Root>
