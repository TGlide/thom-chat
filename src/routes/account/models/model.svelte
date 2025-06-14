<script lang="ts">
	import type { Provider } from '$lib/types';
	import * as Card from '$lib/components/ui/card';

	type Model = {
		id: string;
		name: string;
		description: string;
	};

	type Props = {
		provider: Provider;
		model: Model;
	};

	let { provider, model }: Props = $props();

	function getShortDescription(text: string) {
        // match any punctuation followed by a space or the end of the string
		const index = text.match(/[.!?](\s|$)/)?.index;

		if (index === undefined) return { shortDescription: null, fullDescription: text };

		return { shortDescription: text.slice(0, index + 1), fullDescription: text };
	}

	const { shortDescription, fullDescription } = $derived(getShortDescription(model.description));

	let showMore = $state(false);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{model.name}</Card.Title>
		<Card.Description>{showMore ? fullDescription : shortDescription ?? fullDescription}</Card.Description>
		{#if shortDescription !== null}
			<button
				type="button"
				class="text-muted-foreground text-start w-fit text-xs"
				onclick={() => (showMore = !showMore)}
			>
				{showMore ? 'Show less' : 'Show more'}
			</button>
		{/if}
	</Card.Header>
	<Card.Content>
        
    </Card.Content>
</Card.Root>
