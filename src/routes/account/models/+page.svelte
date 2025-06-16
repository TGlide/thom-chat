<script lang="ts">
	import { models } from '$lib/state/models.svelte';
	import { Provider } from '$lib/types.js';
	import ModelCard from './model-card.svelte';
</script>

<svelte:head>
	<title>Models | Thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Available Models</h1>
<h2 class="text-muted-foreground mt-2 text-sm">
	Choose which models appear in your model selector. This won't affect existing conversations.
</h2>

<div class="mt-8 flex flex-col gap-4">
	{#each models.from(Provider.OpenRouter) as model (model.id)}
		<ModelCard provider={Provider.OpenRouter} {model} enabled={model.enabled} />
	{/each}
</div>
