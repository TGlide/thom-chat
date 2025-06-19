<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { Button } from '$lib/components/ui/button/index.js';
	import Modal from '$lib/components/ui/modal/modal.svelte';
	import { session } from '$lib/state/session.svelte';
	import { useQuery } from 'convex-svelte';
	import { Debounced } from 'runed';
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { shortcut } from '$lib/actions/shortcut.svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let input = $state('');
	let searchMode = $state<'exact' | 'words' | 'fuzzy'>('words');
	let selectedIndex = $state(-1);

	const debouncedInput = new Debounced(() => input, 500);

	const search = useQuery(api.conversations.search, () => ({
		search_term: debouncedInput.current,
		search_mode: searchMode,
		session_token: session.current?.session.token ?? '',
	}));

	// Reset selected index when search results change
	$effect(() => {
		if (search.data) {
			selectedIndex = -1;
		}
	});

	// Reset selected index when input changes
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		input; // Track input changes
		selectedIndex = -1;
	});

	function handleKeydown(event: KeyboardEvent) {
		if (!search.data?.length) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, search.data.length - 1);
				scrollToSelected();
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				scrollToSelected();
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < search.data.length) {
					const result = search.data[selectedIndex];
					if (result) {
						goto(`/chat/${result.conversation._id}`);
						open = false;
					}
				}
				break;
			case 'Escape':
				event.preventDefault();
				open = false;
				break;
		}
	}

	async function scrollToSelected() {
		await tick();
		const selectedElement = document.querySelector(`[data-result-index="${selectedIndex}"]`);
		if (selectedElement) {
			selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
		}
	}
</script>

<svelte:window use:shortcut={[{ ctrl: true, key: 'k', callback: () => (open = true) }]} />

<Modal bind:open>
	<div class="space-y-4">
		<h2 class="text-lg font-semibold">Search Conversations</h2>

		<div class="space-y-3">
			<input
				bind:value={input}
				onkeydown={handleKeydown}
				class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
				placeholder="Search conversations and messages..."
				{@attach (node) => {
					if (!open) return;
					setTimeout(() => {
						if (open) node.focus();
					}, 50);
				}}
			/>

			<div class="flex items-center gap-2">
				<label for="search-mode" class="text-muted-foreground text-sm font-medium"
					>Search mode:</label
				>
				<select
					id="search-mode"
					bind:value={searchMode}
					class="border-input bg-background rounded border px-2 py-1 text-xs"
				>
					<option value="words">Word matching</option>
					<option value="exact">Exact match</option>
					<option value="fuzzy">Fuzzy search</option>
				</select>
			</div>
		</div>

		{#if search.isLoading}
			<div class="flex justify-center py-8">
				<div
					class="size-6 animate-spin rounded-full border-2 border-current border-t-transparent"
				></div>
			</div>
		{:else if search.data?.length}
			<div class="max-h-96 space-y-2 overflow-y-auto">
				{#each search.data as { conversation, messages, titleMatch }, index}
					<div
						data-result-index={index}
						class="border-border flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-colors {index ===
						selectedIndex
							? 'bg-accent'
							: 'hover:bg-muted/50'}"
						role="button"
						tabindex="0"
						onclick={() => {
							goto(`/chat/${conversation._id}`);
							open = false;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								goto(`/chat/${conversation._id}`);
								open = false;
							}
						}}
						onmouseenter={() => (selectedIndex = index)}
					>
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-2">
								<div class={['truncate font-medium', titleMatch && 'text-heading']}>
									{conversation.title}
								</div>
							</div>
							<div class="text-muted-foreground text-xs">
								{messages.length} matching message{messages.length !== 1 ? 's' : ''}
								{#if titleMatch}
									<span class="text-heading">• Title match</span>
								{/if}
							</div>
						</div>
						<Button
							variant="secondary"
							size="sm"
							class="shrink-0 text-xs"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								goto(`/chat/${conversation._id}`);
								open = false;
							}}
						>
							View
						</Button>
					</div>
				{/each}
			</div>
		{:else if debouncedInput.current.trim()}
			<div class="text-muted-foreground py-8 text-center">
				<p>No results found for "{debouncedInput.current}"</p>
				<p class="mt-1 text-xs">Try a different search term or mode</p>
			</div>
		{:else}
			<div class="text-muted-foreground py-8 text-center">
				<p>Start typing to search your conversations</p>
				<p class="mt-1 text-xs">Use ↑↓ to navigate, Enter to select, Esc to close</p>
			</div>
		{/if}
	</div>
</Modal>
