<script lang="ts">
	import type { Provider } from '$lib/types';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';
	import { ResultAsync } from 'neverthrow';
	import { getFirstSentence } from '$lib/utils/strings';

	type Model = {
		id: string;
		name: string;
		description: string;
	};

	type Props = {
		provider: Provider;
		model: Model;
		enabled?: boolean;
		disabled?: boolean;
	};

	let { provider, model, enabled = false, disabled = false }: Props = $props();

	const client = useConvexClient();

	const [shortDescription, fullDescription] = $derived(getFirstSentence(model.description));

	let showMore = $state(false);

	async function toggleEnabled(v: boolean) {
		enabled = v; // Optimistic!
		if (!session.current?.user.id) return;

		const res = await ResultAsync.fromPromise(
			client.mutation(api.user_enabled_models.set, {
				provider,
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
			<div class="flex place-items-center gap-2">
				<Card.Title>{model.name}</Card.Title>
				<span class="text-muted-foreground text-xs hidden xl:block">{model.id}</span>
			</div>
			<Switch bind:value={() => enabled, toggleEnabled} {disabled} />
		</div>
		<Card.Description
			>{showMore ? fullDescription : (shortDescription ?? fullDescription)}</Card.Description
		>
		{#if shortDescription !== null}
			<button
				type="button"
				class="text-muted-foreground w-fit text-start text-xs"
				onclick={() => (showMore = !showMore)}
				{disabled}
			>
				{showMore ? 'Show less' : 'Show more'}
			</button>
		{/if}
	</Card.Header>
</Card.Root>
