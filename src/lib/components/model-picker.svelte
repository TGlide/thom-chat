<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte.js';
	import { Popover } from 'melt/components';
	import { PersistedState } from 'runed';
	import ChevronDownIcon from '~icons/lucide/chevron-down';
	import CheckIcon from '~icons/lucide/check';

	type Props = {
		onModelSelect?: (modelId: string) => void;
	};

	let { onModelSelect }: Props = $props();

	const selectedModel = new PersistedState<string | null>('selected-model', null);

	const enabledModelsQuery = useCachedQuery(api.models.get_enabled_with_details, {
		user_id: session.current?.user.id ?? '',
	});

	$effect(() => {
		if (enabledModelsQuery.data && !selectedModel.current) {
			const firstModel = Object.keys(enabledModelsQuery.data)[0];
			if (firstModel) {
				selectedModel.current = firstModel;
				onModelSelect?.(firstModel);
			}
		}
	});

	function selectModel(modelId: string) {
		selectedModel.current = modelId;
		onModelSelect?.(modelId);
	}

	function getModelDisplayName(modelId: string): string {
		if (!enabledModelsQuery.data) return modelId;
		const model = enabledModelsQuery.data[modelId];
		return model?.name || modelId;
	}

	function getSelectedModelName(): string {
		if (!selectedModel.current) return 'Select a model';
		return getModelDisplayName(selectedModel.current);
	}
</script>

<Popover>
	{#snippet children(popover)}
		<button
			{...popover.trigger}
			class="inline-flex items-center justify-between gap-2 min-w-32 h-8 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Select model"
		>
			<span class="truncate">{getSelectedModelName()}</span>
			<ChevronDownIcon class="size-4" />
		</button>

		<div
			{...popover.content}
			class="bg-popover text-popover-foreground z-50 w-56 rounded-md border p-1 shadow-md outline-none"
		>
			{#if enabledModelsQuery.isLoading}
				<div class="p-2 text-sm text-muted-foreground">Loading models...</div>
			{:else if enabledModelsQuery.data && Object.keys(enabledModelsQuery.data).length > 0}
				{#each Object.entries(enabledModelsQuery.data) as [modelId, model] (modelId)}
					<button
						class="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
						onclick={() => selectModel(modelId)}
					>
						<CheckIcon
							class="mr-2 size-4 {selectedModel.current === modelId ? 'opacity-100' : 'opacity-0'}"
						/>
						<div class="flex flex-col items-start">
							<span class="font-medium truncate">{model.name}</span>
							{#if model.description}
								<span class="text-xs text-muted-foreground truncate">{model.description}</span>
							{/if}
						</div>
					</button>
				{/each}
			{:else}
				<div class="p-2 text-sm text-muted-foreground">
					No models enabled. <a href="/account/models" class="text-primary underline">Enable models</a>
				</div>
			{/if}
		</div>
	{/snippet}
</Popover>