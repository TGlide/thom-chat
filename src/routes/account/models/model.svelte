<script lang="ts">
	import type { Provider } from '$lib/types';
	import * as Card from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte.js';

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

	async function toggleEnabled(enabled: boolean) {
		if (!session.current?.user.id) return;

		await client.mutation(api.user_enabled_models.set, {
			provider,
			user_id: session.current.user.id,
			model_id: model.id,
			enabled,
		});
	}
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			<Card.Title>{model.name}</Card.Title>
			<!-- TODO: make this actually work -->
			<Switch value={enabled} onValueChange={toggleEnabled} />
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
	<Card.Content></Card.Content>
</Card.Root>
