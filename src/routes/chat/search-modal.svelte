<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { Button } from '$lib/components/ui/button/index.js';
	import Modal from '$lib/components/ui/modal/modal.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { session } from '$lib/state/session.svelte';
	import { useQuery } from 'convex-svelte';
	import { Debounced } from 'runed';
	import SearchIcon from '~icons/lucide/search';

	let open = $state(true);

	let input = $state('');
	let inputEl = $state<HTMLInputElement>();

	const debouncedInput = new Debounced(() => input, 500);

	const search = useQuery(api.conversations.search, () => ({
		search_term: debouncedInput.current,
		session_token: session.current?.session.token ?? '',
	}));
</script>

<Tooltip>
	{#snippet trigger(tooltip)}
		<Button
			onclick={() => (open = true)}
			variant="ghost"
			size="icon"
			class="size-8"
			{...tooltip.trigger}
		>
			<SearchIcon class="!size-4" />
			<span class="sr-only">Search</span>
		</Button>
	{/snippet}
	Search
</Tooltip>

<Modal bind:open>
	<h2>Search</h2>
	<input bind:this={inputEl} bind:value={input} class="w-full border" placeholder="Search" />

	{#if search.isLoading}
		<div class="text-center">
			<div class="animate-spin rounded-full border-2 border-current border-t-transparent" />
		</div>
	{:else if search.data?.length}
		<div class="space-y-2">
			{#each search.data as { conversation, messages }}
				<div
					class="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
				>
					<div class="flex items-center gap-2">
						<div class="text-muted-foreground text-xs">
							{conversation.title}
						</div>
						<div class="text-muted-foreground text-xs">
							{messages.length} message{messages.length > 1 ? 's' : ''}
						</div>
					</div>

					<!-- TODO: Add message count to conversation -->
					<Button variant="secondary" size="sm" class="text-xs">View</Button>
				</div>
			{/each}
		</div>
	{/if}
</Modal>
