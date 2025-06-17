<script lang="ts">
	import { page } from '$app/state';
	import { api } from '$lib/backend/convex/_generated/api';
	import type { Id } from '$lib/backend/convex/_generated/dataModel';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';

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

<div class="flex h-full flex-1 flex-col overflow-x-clip overflow-y-auto py-4">
	{#each messages.data ?? [] as message (message._id)}
		{#if message.role === 'user'}
			<div class="max-w-[80%] self-end bg-blue-900 p-2 text-white">
				{message.content}
			</div>
		{:else if message.role === 'assistant' && message.content.length > 0}
			<div class="max-w-[80%] p-2 text-foreground">
				{message.content}
			</div>
		{/if}
	{/each}
	{#if conversation.data?.generating && !lastMessageHasContent}
		<!-- loading animation -->
		<div class="flex place-items-center gap-2 p-2">
			<div
				class="bg-accent animation-delay-0 size-2.5 animate-[bounce_0.75s_ease-in-out_infinite] rounded-full"
			></div>
			<div
				class="bg-accent animation-delay-100 size-2.5 animate-[bounce_0.75s_ease-in-out_infinite] rounded-full"
			></div>
			<div
				class="bg-accent animation-delay-200 size-2.5 animate-[bounce_0.75s_ease-in-out_infinite] rounded-full"
			></div>
		</div>
	{/if}
</div>
