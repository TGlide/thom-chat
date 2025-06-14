<script lang="ts">
	import { Provider } from '$lib/types.js';
	import { useQuery } from 'convex-svelte';
	import Model from './model.svelte';
	import { session } from '$lib/state/session.svelte';
	import { api } from '$lib/backend/convex/_generated/api';

	let { data } = $props();

	const enabledModels = useQuery(api.user_enabled_models.get_enabled, {
		user_id: session.current?.user.id ?? '',
	});
</script>

<svelte:head>
	<title>Models | Thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Available Models</h1>
<h2 class="text-muted-foreground mt-2 text-sm">
	Choose which models appear in your model selector. This won't affect existing conversations.
</h2>

<div class="mt-8 flex flex-col gap-4">
	{#each data.openRouterModels as model (model.id)}
		{@const enabled = enabledModels.data?.[`${Provider.OpenRouter}:${model.id}`] !== undefined}
		<Model provider={Provider.OpenRouter} {model} {enabled} />
	{/each}
</div>
