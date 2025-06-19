<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api.js';
	import { type Id } from '$lib/backend/convex/_generated/dataModel.js';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte.js';
	import { session } from '$lib/state/session.svelte.js';
	import { useConvexClient } from 'convex-svelte';
	import { Popover } from 'melt/builders';
	import { ResultAsync } from 'neverthrow';
	import { scale } from 'svelte/transition';
	import CheckIcon from '~icons/lucide/check';
	import CopyIcon from '~icons/lucide/copy';
	import ExternalLinkIcon from '~icons/lucide/external-link';
	import ShareIcon from '~icons/lucide/share';
	import XIcon from '~icons/lucide/x';

	const client = useConvexClient();
	const clipboard = new UseClipboard();

	let { conversationId } = $props<{
		conversationId: Id<'conversations'>;
	}>();

	const conversationQuery = useCachedQuery(api.conversations.getById, () => ({
		conversation_id: conversationId as Id<'conversations'>,
		session_token: session.current?.session.token ?? '',
	}));

	let isPublic = $derived(Boolean(conversationQuery.data?.public));
	let isToggling = $state(false);
	let open = $state(false);

	const popover = new Popover({
		open: () => open,
		onOpenChange: (v) => {
			open = v;
		},
		floatingConfig: {
			computePosition: { placement: 'bottom-end' },
		},
	});

	const shareUrl = $derived.by(() => {
		if (typeof window !== 'undefined') {
			return `${window.location.origin}/share/${conversationId}`;
		}
		return '';
	});

	async function toggleSharing(newValue: boolean) {
		if (!session.current?.session.token) return;

		const prev = isPublic;
		isPublic = newValue;

		isToggling = true;
		const result = await ResultAsync.fromPromise(
			client.mutation(api.conversations.setPublic, {
				conversation_id: conversationId,
				public: newValue,
				session_token: session.current.session.token,
			}),
			(e) => e
		);

		if (result.isErr()) {
			// Revert the change if API call failed
			isPublic = prev;
			console.error('Error toggling sharing:', result.error);
		}

		isToggling = false;
	}

	function copyShareUrl() {
		clipboard.copy(shareUrl);
	}
</script>

<Tooltip>
	{#snippet trigger(tooltip)}
		<div {...tooltip.trigger}>
			<Button {...popover.trigger} variant="ghost" size="icon" class="size-8">
				<ShareIcon class="size-4" />
			</Button>
		</div>
	{/snippet}
	Share
</Tooltip>

<div
	{...popover.content}
	class="bg-popover border-border z-50 w-80 rounded-lg border p-4 shadow-lg"
>
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-medium">Share conversation</h3>
			<Button onclick={() => (open = false)} variant="ghost" size="icon" class="size-6">
				<XIcon class="size-4" />
			</Button>
		</div>

		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<p class="text-sm font-medium">Public sharing</p>
				<p class="text-muted-foreground text-xs">Anyone with the link can view this conversation</p>
			</div>
			<Switch bind:value={() => isPublic, (v) => toggleSharing(v)} disabled={isToggling} />
		</div>

		{#if isPublic}
			<div class="space-y-2">
				<p class="text-sm font-medium">Share link</p>
				<div class="border-input bg-background flex items-center rounded-xl border px-3 py-2">
					<span class="text-muted-foreground flex-1 truncate text-sm">{shareUrl}</span>
					<Button onclick={copyShareUrl} variant="ghost" size="icon" class="ml-2 size-6 shrink-0">
						{#if clipboard.status === 'success'}
							<div in:scale={{ duration: 200, start: 0.8 }}>
								<CheckIcon class="size-4" />
							</div>
						{:else}
							<CopyIcon class="size-4" />
						{/if}
					</Button>
				</div>
				<a
					href={shareUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
				>
					Open in new tab <ExternalLinkIcon class="size-3" />
				</a>
			</div>
		{:else}
			<p class="text-muted-foreground text-xs">
				Enable public sharing to generate a shareable link
			</p>
		{/if}
	</div>
</div>

