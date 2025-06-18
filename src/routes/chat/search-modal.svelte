<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { Button } from '$lib/components/ui/button/index.js';
	import Modal from '$lib/components/ui/modal/modal.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { session } from '$lib/state/session.svelte';
	import { useQuery } from 'convex-svelte';
	import { Debounced } from 'runed';
	import SearchIcon from '~icons/lucide/search';

	let open = $state(false);
	let input = $state('');
	let searchMode = $state<'exact' | 'words' | 'fuzzy'>('words');
	let inputEl = $state<HTMLInputElement>();

	const debouncedInput = new Debounced(() => input, 500);

	const search = useQuery(api.conversations.search, () => ({
		search_term: debouncedInput.current,
		search_mode: searchMode,
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
	<div class="space-y-4">
		<h2 class="text-lg font-semibold">Search Conversations</h2>
		
		<div class="space-y-3">
			<input 
				bind:this={inputEl} 
				bind:value={input} 
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
				placeholder="Search conversations and messages..."
			/>
			
			<div class="flex gap-2 items-center">
				<label for="search-mode" class="text-sm font-medium text-muted-foreground">Search mode:</label>
				<select 
					id="search-mode"
					bind:value={searchMode}
					class="rounded border border-input bg-background px-2 py-1 text-xs"
				>
					<option value="words">Word matching</option>
					<option value="exact">Exact match</option>
					<option value="fuzzy">Fuzzy search</option>
				</select>
			</div>
		</div>

		{#if search.isLoading}
			<div class="flex justify-center py-8">
				<div class="size-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
			</div>
		{:else if search.data?.length}
			<div class="space-y-2 max-h-96 overflow-y-auto">
				{#each search.data as { conversation, messages, score, titleMatch }}
					<div class="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<div class="font-medium truncate" class:text-blue-600={titleMatch}>
									{conversation.title}
								</div>
								<div class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
									{Math.round(score * 100)}%
								</div>
							</div>
							<div class="text-xs text-muted-foreground">
								{messages.length} matching message{messages.length !== 1 ? 's' : ''}
								{#if titleMatch}
									<span class="text-blue-600">• Title match</span>
								{/if}
							</div>
						</div>
						<Button variant="secondary" size="sm" class="text-xs shrink-0">View</Button>
					</div>
				{/each}
			</div>
		{:else if debouncedInput.current.trim()}
			<div class="text-center py-8 text-muted-foreground">
				<p>No results found for "{debouncedInput.current}"</p>
				<p class="text-xs mt-1">Try a different search term or mode</p>
			</div>
		{:else}
			<div class="text-center py-8 text-muted-foreground">
				<p>Start typing to search your conversations</p>
			</div>
		{/if}
	</div>
</Modal>
