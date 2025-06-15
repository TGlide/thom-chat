<script lang="ts">
	import { session } from '$lib/state/session.svelte.js';
</script>

<div class="flex h-full items-center justify-center">
	<div class="text-center">
		<h1 class="text-2xl font-bold mb-2">Welcome to Thom Chat</h1>
		<p class="text-muted-foreground mb-4">
			{#if session.current}
				Hello {session.current.user.name}! Select a model and start chatting below.
			{:else}
				Please log in to start chatting.
			{/if}
		</p>
		{#if session.current}
			<p class="text-sm text-muted-foreground">
				Don't have any models enabled? <a href="/account/models" class="text-primary underline">Enable models</a> or <a href="/account/api-keys" class="text-primary underline">add API keys</a>.
			</p>
		{/if}
	</div>
</div>
