<script lang="ts">
	import { page } from '$app/stores';
	import { api } from '$lib/backend/convex/_generated/api';
	import type { Id } from '$lib/backend/convex/_generated/dataModel';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { Button } from '$lib/components/ui/button';
	import { session } from '$lib/state/session.svelte.js';
	import { useConvexClient } from 'convex-svelte';
	import { PersistedState } from 'runed';
	import SendIcon from '~icons/lucide/send';
	import { onMount } from 'svelte';

	const conversationId = $derived($page.params.id as Id<'conversations'>);
	const selectedModel = new PersistedState<string | null>('selected-model', null);
	const client = useConvexClient();
	
	let messageInput = $state('');
	let isLoading = $state(false);
	let messagesContainer = $state<HTMLDivElement>();

	const conversationQuery = $derived(useCachedQuery(api.conversations.get, {
		conversation_id: conversationId,
		user_id: session.current?.user.id ?? '',
	}));

	const messagesQuery = $derived(useCachedQuery(api.messages.list, {
		conversation_id: conversationId,
		user_id: session.current?.user.id ?? '',
	}));

	onMount(() => {
		scrollToBottom();
	});

	$effect(() => {
		if (messagesQuery.data) {
			scrollToBottom();
		}
	});

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!messageInput.trim() || !session.current?.user.id || isLoading || !conversationQuery.data) {
			return;
		}

		const message = messageInput.trim();
		messageInput = '';
		isLoading = true;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					conversationId,
					message,
					modelId: conversationQuery.data.model_id,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to send message');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			messageInput = message; // Restore the message
		} finally {
			isLoading = false;
		}
	}

	function formatTime(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head>
	<title>{conversationQuery.data?.title ?? 'Chat'} | Thom.chat</title>
</svelte:head>

<div class="flex h-full flex-col">
	{#if conversationQuery.isLoading}
		<div class="flex h-full items-center justify-center">
			<div class="text-muted-foreground">Loading conversation...</div>
		</div>
	{:else if !conversationQuery.data}
		<div class="flex h-full items-center justify-center">
			<div class="text-muted-foreground">Conversation not found</div>
		</div>
	{:else}
		<div class="flex-1 overflow-hidden">
			<div 
				class="h-full overflow-y-auto p-4 space-y-4" 
				bind:this={messagesContainer}
			>
				{#if messagesQuery.isLoading}
					<div class="flex justify-center">
						<div class="text-muted-foreground text-sm">Loading messages...</div>
					</div>
				{:else if messagesQuery.data}
					{#each messagesQuery.data as message (message._id)}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div class="max-w-[80%] {message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3">
								<div class="text-sm whitespace-pre-wrap">{message.content}</div>
								<div class="text-xs opacity-70 mt-1">
									{formatTime(message.created_at)}
								</div>
							</div>
						</div>
					{/each}
				{/if}
				
				{#if isLoading}
					<div class="flex justify-start">
						<div class="bg-muted rounded-lg p-3">
							<div class="text-sm text-muted-foreground">Thinking...</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="p-4 border-t">
			<form class="flex gap-2" onsubmit={handleSubmit}>
				<textarea
					bind:value={messageInput}
					disabled={isLoading}
					class="flex-1 min-h-[40px] max-h-32 border-input bg-background ring-ring ring-offset-background resize-none rounded-lg border p-2 text-sm ring-offset-2 outline-none focus-visible:ring-2 disabled:opacity-50"
					placeholder="Type your message..."
					rows="1"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							const form = e.currentTarget.closest('form');
							if (form) {
								handleSubmit(new SubmitEvent('submit', { submitter: null }));
							}
						}
					}}
				></textarea>
				<Button 
					type="submit" 
					size="icon"
					disabled={isLoading || !messageInput.trim()}
				>
					<SendIcon />
				</Button>
			</form>
		</div>
	{/if}
</div>