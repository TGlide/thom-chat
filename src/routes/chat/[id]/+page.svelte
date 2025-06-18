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

	const messages = useCachedQuery(api.messages.getAllFromConversation, () => ({
		conversation_id: page.params.id ?? '',
		session_token: session.current?.session.token ?? '',
	}));

	const conversation = useCachedQuery(api.conversations.getById, () => ({
		conversation_id: page.params.id as Id<'conversations'>,
		session_token: session.current?.session.token ?? '',
	}));

	const lastMessageHasContent = $derived.by(() => {
		if (!messages.data) return false;
		const lastMessage = messages.data[messages.data.length - 1];

		if (!lastMessage) return false;

		if (lastMessage.role !== 'assistant') return false;

		return lastMessage.content.length > 0;
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

<div class="flex h-full flex-1 flex-col py-4">
	{#each messages.data ?? [] as message (message._id)}
		<Message {message} />
	{/each}
	{#if conversation.data?.generating && !lastMessageHasContent}
		<LoadingDots />
	{/if}
</div>
