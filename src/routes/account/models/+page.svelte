<script lang="ts">
	import { Provider } from '$lib/types.js';
	import { useConvexClient } from 'convex-svelte';
	import Model from './model.svelte';

	let { data } = $props();

	const client = useConvexClient();
</script>

<div>
	<h1 class="text-2xl font-bold">Available Models</h1>
	<h2 class="text-muted-foreground mt-2 text-sm">
		Choose which models appear in your model selector. This won't affect existing conversations.
	</h2>
</div>

{#each data.openRouterModels as model}
	<Model provider={Provider.OpenRouter} model={model} />
{/each}
