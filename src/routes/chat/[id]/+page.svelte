<script lang="ts">
	import { page } from '$app/state';
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';

	const messages = useCachedQuery(api.messages.getAllFromConversation, () => ({
		conversation_id: page.params.id ?? '',
		session_token: session.current?.session.token ?? '',
	}));
</script>

<div class="flex h-full flex-1 flex-col overflow-x-clip overflow-y-auto py-4">
	{#each messages.data ?? [] as message (message._id)}
		{#if message.role === 'user'}
			<div class="max-w-[80%] self-end bg-blue-900 p-2 text-white">
				{message.content}
			</div>
		{:else if message.role === 'assistant'}
			<div class="max-w-[80%] p-2 text-white">
				{message.content}
			</div>
		{/if}
	{/each}
</div>
