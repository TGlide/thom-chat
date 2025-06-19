<script lang="ts">
	import * as Icons from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { LightSwitch } from '$lib/components/ui/light-switch/index.js';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { type Doc } from '$lib/backend/convex/_generated/dataModel.js';
	import Message from '../../chat/[id]/message.svelte';

	let { data }: { 
		data: {
			conversation: Doc<'conversations'>;
			messages: Doc<'messages'>[];
		}
	} = $props();

	const formatDate = (timestamp: number | undefined) => {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};
</script>

<svelte:head>
	<title>{data.conversation.title} | Shared Chat</title>
	<meta name="description" content="A shared conversation from Thom.chat" />
</svelte:head>

<div class="min-h-screen">
	<!-- Header -->
	<header class="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<a href="/" class="text-foreground hover:text-foreground/80 flex items-center gap-2 transition-colors">
					<Icons.Svelte class="size-6" />
					<span class="font-semibold">Thom.chat</span>
				</a>
				<div class="text-muted-foreground text-sm">
					Shared conversation
				</div>
			</div>
			<div class="flex items-center gap-2">
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button 
							variant="ghost" 
							size="sm" 
							href="/chat" 
							{...tooltip.trigger}
						>
							Start your own chat
						</Button>
					{/snippet}
					Create your own conversation
				</Tooltip>
				<LightSwitch variant="ghost" class="size-8" />
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="mx-auto max-w-4xl px-4 py-8">
		<div class="space-y-6">
			<!-- Conversation header -->
			<div class="border-border rounded-lg border p-6">
				<h1 class="text-foreground mb-2 text-2xl font-bold">{data.conversation.title}</h1>
				<div class="text-muted-foreground flex items-center gap-4 text-sm">
					{#if data.conversation.updated_at}
						<span>Updated {formatDate(data.conversation.updated_at)}</span>
					{/if}
					<span>Public conversation</span>
				</div>
			</div>

			<!-- Messages -->
			{#if data.messages && data.messages.length > 0}
				<div class="space-y-4">
					{#each data.messages as message (message._id)}
						<div class="border-border rounded-lg border p-4">
							<Message {message} />
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
					<p class="mb-2 text-lg">No messages in this conversation yet.</p>
					<p class="text-sm">The conversation appears to be empty.</p>
				</div>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-border mt-16 border-t py-8">
		<div class="mx-auto max-w-4xl px-4">
			<div class="text-muted-foreground flex flex-col items-center gap-4 text-center text-sm sm:flex-row sm:justify-between">
				<div class="flex items-center gap-4">
					<a
						href="https://github.com/TGlide/thom-chat"
						class="hover:text-foreground flex items-center gap-1 transition-colors"
					>
						Source on <Icons.GitHub class="inline size-3" />
					</a>
					<span class="flex items-center gap-1">
						Crafted by <Icons.Svelte class="inline size-3" /> wizards.
					</span>
				</div>
				<div>
					<a href="/chat" class="hover:text-foreground transition-colors">
						Create your own conversation →
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>