<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import PanelLeftIcon from '~icons/lucide/panel-left';
	import { Avatar } from 'melt/components';
	import * as Icons from '$lib/components/icons';
	import SendIcon from '~icons/lucide/send';
	import ModelPicker from '$lib/components/model-picker.svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';
	import { session } from '$lib/state/session.svelte.js';
	import { goto } from '$app/navigation';
	import { PersistedState } from 'runed';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';

	let { data, children } = $props();

	const conversationsQuery = useCachedQuery(api.conversations.list, {
		user_id: session.current?.user.id ?? '',
	});

	function formatDate(timestamp: number): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 1) return 'Today';
		if (diffDays === 2) return 'Yesterday';
		if (diffDays <= 7) return `${diffDays - 1} days ago`;
		return date.toLocaleDateString();
	}

	const selectedModel = new PersistedState<string | null>('selected-model', null);
	const client = useConvexClient();
	let messageInput = $state('');
	let isLoading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		
		if (!messageInput.trim() || !selectedModel.current || !session.current?.user.id || isLoading) {
			return;
		}

		const message = messageInput.trim();
		messageInput = '';
		isLoading = true;

		try {
			const response = await fetch('/api/chat/new', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message,
					modelId: selectedModel.current,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create conversation');
			}

			const { conversationId } = await response.json();
			await goto(`/chat/${conversationId}`);
		} catch (error) {
			console.error('Error sending message:', error);
			messageInput = message; // Restore the message
		} finally {
			isLoading = false;
		}
	}

	function handleModelSelect(modelId: string) {
		selectedModel.current = modelId;
	}
</script>

<svelte:head>
	<title>Chat | Thom.chat</title>
</svelte:head>

<Sidebar.Root>
	<Sidebar.Sidebar class="flex flex-col p-2">
		<div class="flex place-items-center justify-center py-2">
			<span class="text-center text-lg font-bold">Thom Chat</span>
		</div>
		<Button href="/chat" class="w-full">New Chat</Button>
		<div class="flex flex-1 flex-col overflow-y-auto">
			{#if conversationsQuery.isLoading}
				<div class="p-2 text-center text-sm text-muted-foreground">Loading chats...</div>
			{:else if conversationsQuery.data && conversationsQuery.data.length > 0}
				<div class="space-y-1 p-2">
					{#each conversationsQuery.data as conversation (conversation._id)}
						<a
							href="/chat/{conversation._id}"
							class="block rounded-md p-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							<div class="font-medium truncate">{conversation.title}</div>
							<div class="text-xs text-muted-foreground">
								{formatDate(conversation.updated_at)}
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="p-2 text-center text-sm text-muted-foreground">No chats yet</div>
			{/if}
		</div>
		<div class="py-2">
			{#if data.session !== null}
				<Button href="/account/api-keys" variant="ghost" class="h-auto w-full justify-start">
					<Avatar src={data.session.user.image ?? undefined}>
						{#snippet children(avatar)}
							<img {...avatar.image} alt="Your avatar" class="size-10 rounded-full" />
							<span {...avatar.fallback}
								>{data.session?.user.name
									.split(' ')
									.map((name) => name[0].toUpperCase())
									.join('')}</span
							>
						{/snippet}
					</Avatar>
					<div class="flex flex-col">
						<span class="text-sm">{data.session?.user.name}</span>
						<span class="text-muted-foreground text-xs">{data.session?.user.email}</span>
					</div>
				</Button>
			{:else}
				<Button href="/login" class="w-full">Login</Button>
			{/if}
		</div>
	</Sidebar.Sidebar>

	<Sidebar.Inset class="flex flex-col">
		<Sidebar.Trigger class="fixed top-3 left-2">
			<PanelLeftIcon />
		</Sidebar.Trigger>
		<div class="flex flex-1 flex-col">
			<div class="flex-1">
				{@render children?.()}
			</div>
			<div class="flex w-full justify-center p-4">
				<div class="flex w-full max-w-lg flex-col place-items-center gap-2">
					<div class="flex w-full items-center justify-between">
						<ModelPicker onModelSelect={handleModelSelect} />
						<div class="flex items-center gap-2">
							<span class="text-muted-foreground text-xs">
								Crafted by <Icons.Svelte class="inline size-3" /> wizards.
							</span>
							<a href="https://github.com/TGlide/thom-chat" class="text-muted-foreground text-xs">
								Source on <Icons.GitHub class="ml-0.5 inline size-3" />
							</a>
						</div>
					</div>
					<form class="relative h-18 w-full" onsubmit={handleSubmit}>
						<textarea
							bind:value={messageInput}
							disabled={isLoading}
							class="border-input bg-background ring-ring ring-offset-background h-full w-full resize-none rounded-lg border p-2 text-sm ring-offset-2 outline-none focus-visible:ring-2 disabled:opacity-50"
							placeholder="Ask me anything..."
						></textarea>
						<Button 
							type="submit" 
							size="icon" 
							class="absolute right-1 bottom-1 size-8"
							disabled={isLoading || !messageInput.trim() || !selectedModel.current}
						>
							<SendIcon />
						</Button>
					</form>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Root>
