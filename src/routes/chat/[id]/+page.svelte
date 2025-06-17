<script lang="ts">
	import { page } from '$app/state';
	import { api } from '$lib/backend/convex/_generated/api';
	import type { Id } from '$lib/backend/convex/_generated/dataModel';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import LoadingDots from './loading-dots.svelte';
	import Message from './message.svelte';

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
</script>

<div class="flex h-full flex-1 flex-col py-4">
	{#each messages.data ?? [] as message (message._id)}
		<Message {message} />
	{/each}
	{#if conversation.data?.generating && !lastMessageHasContent}
		<LoadingDots />
	{/if}
</div>
