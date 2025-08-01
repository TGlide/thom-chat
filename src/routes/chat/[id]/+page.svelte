<script lang="ts">
	import { page } from '$app/state';
	import { api } from '$lib/backend/convex/_generated/api';
	import type { Id } from '$lib/backend/convex/_generated/dataModel';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import { watch } from 'runed';
	import LoadingDots from './loading-dots.svelte';
	import Message from './message.svelte';
	import { last } from '$lib/utils/array';
	import { settings } from '$lib/state/settings.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ShinyText from '$lib/components/animations/shiny-text.svelte';
	import GlobeIcon from '~icons/lucide/globe';
	import LoaderCircleIcon from '~icons/lucide/loader-circle';

	const messages = useCachedQuery(api.messages.getAllFromConversation, () => ({
		conversation_id: page.params.id ?? '',
		session_token: session.current?.session.token ?? '',
	}));

	const conversation = useCachedQuery(api.conversations.getById, () => ({
		conversation_id: page.params.id as Id<'conversations'>,
		session_token: session.current?.session.token ?? '',
	}));

	const lastMessage = $derived(messages?.data?.[messages.data?.length - 1] ?? null);

	const lastMessageHasContent = $derived.by(() => {
		if (!messages.data) return false;
		const lastMessage = messages.data[messages.data.length - 1];

		if (!lastMessage) return false;

		if (lastMessage.role !== 'assistant') return false;

		return lastMessage.content.length > 0;
	});

	const lastMessageHasReasoning = $derived.by(() => {
		if (!messages.data) return false;
		const lastMessage = messages.data[messages.data.length - 1];

		if (!lastMessage) return false;

		return lastMessage.reasoning?.length ?? 0 > 0;
	});

	let changedRoute = $state(false);
	watch(
		() => page.params.id,
		() => {
			changedRoute = true;
		}
	);

	$effect(() => {
		if (!changedRoute || !messages.data) return;
		const lastMessage = last(messages.data)!;
		if (lastMessage.model_id && lastMessage.model_id !== settings.modelId) {
			settings.modelId = lastMessage.model_id;
		}

		// Auto-enable/disable web search based on last user message
		const lastUserMessage = messages.data.filter((m) => m.role === 'user').pop();
		if (lastUserMessage) {
			settings.webSearchEnabled = Boolean(lastUserMessage.web_search_enabled);
		}

		changedRoute = false;
	});
</script>

<svelte:head>
	<title>{conversation.data?.title} | thom.chat</title>
</svelte:head>

<div class="flex h-full flex-1 flex-col py-4 pt-6">
	{#if !conversation.data && !conversation.isLoading}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 pt-[25svh]">
			<div>
				<h1 class="text-center font-mono text-8xl font-semibold">404</h1>
				<p class="text-muted-foreground text-center text-2xl">Conversation not found</p>
			</div>
			<Button size="sm" variant="outline" href="/chat">Create a new conversation</Button>
		</div>
	{:else}
		{#each messages.data ?? [] as message (message._id)}
			<Message {message} />
		{/each}
		{#if conversation.data?.generating}
			{#if lastMessage?.web_search_enabled}
				{#if lastMessage?.annotations === undefined || lastMessage?.annotations?.length === 0}
					<div class="flex place-items-center gap-2">
						<GlobeIcon class="inline size-4 shrink-0" />
						<ShinyText class="text-muted-foreground text-sm">Searching the web...</ShinyText>
					</div>
				{/if}
			{:else if !lastMessageHasReasoning && !lastMessageHasContent}
				<LoadingDots />
			{:else}
				<div class="flex place-items-center gap-2">
					<div class="flex animate-[spin_0.65s_linear_infinite] place-items-center justify-center">
						<LoaderCircleIcon class="size-4" />
					</div>
				</div>
			{/if}
		{/if}
	{/if}
</div>
