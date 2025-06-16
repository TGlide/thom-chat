<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import { settings } from '$lib/state/settings.svelte';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();

	const enabledModelsQuery = useCachedQuery(api.user_enabled_models.get_enabled, {
		session_token: session.current?.session.token ?? '',
	});

	const enabledArr = $derived(Object.values(enabledModelsQuery.data ?? {}));

	$effect(() => {
		if (!enabledArr.find((m) => m.model_id === settings.modelId) && enabledArr.length > 0) {
			settings.modelId = enabledArr[0]!.model_id;
		}
	});
</script>

<select bind:value={settings.modelId} class="border {className}">
	{#each enabledArr as model (model._id)}
		<option value={model.model_id}>{model.model_id}</option>
	{/each}
</select>
