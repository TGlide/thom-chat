<script lang="ts">
	import type { Provider } from '$lib/types';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';
	import { ResultAsync } from 'neverthrow';

	type Model = {
		id: string;
		name: string;
		description: string;
	};

	type Props = {
		provider: Provider;
		model: Model;
		enabled?: boolean;
	};

	let { provider, model, enabled = false }: Props = $props();

	const client = useConvexClient();

	function getShortDescription(text: string) {
		// match any punctuation followed by a space or the end of the string
		const index = text.match(/[.!?](\s|$)/)?.index;

		if (index === undefined) return { shortDescription: null, fullDescription: text };

		return { shortDescription: text.slice(0, index + 1), fullDescription: text };
	}

	const { shortDescription, fullDescription } = $derived(getShortDescription(model.description));

	let showMore = $state(false);

	async function toggleEnabled(v: boolean) {
		enabled = v; // Optimistic!
		if (!session.current?.user.id) return;

		const res = await ResultAsync.fromPromise(
			client.mutation(api.user_enabled_models.set, {
				provider,
				user_id: session.current.user.id,
				model_id: model.id,
				enabled: v,
				session_token: session.current?.session.token,
			}),
			(e) => e
		);

		if (res.isErr()) enabled = !v; // Should have been a realist :(
	}
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			<Card.Title>{model.name}</Card.Title>
			<!-- TODO: make this actually work -->
			<Switch bind:value={() => enabled, toggleEnabled} />
		</div>
		<Card.Description
			>{showMore ? fullDescription : (shortDescription ?? fullDescription)}</Card.Description
		>
		{#if shortDescription !== null}
			<button
				type="button"
				class="text-muted-foreground w-fit text-start text-xs"
				onclick={() => (showMore = !showMore)}
			>
				{showMore ? 'Show less' : 'Show more'}
			</button>
		{/if}
	</Card.Header>
</Card.Root>
