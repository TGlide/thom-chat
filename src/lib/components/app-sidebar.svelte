<script lang="ts">
	import { Sidebar, useSidebarControls } from '$lib/components/ui/sidebar';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { cn } from '$lib/utils/utils.js';
	import { Avatar } from 'melt/components';
	import LoaderCircleIcon from '~icons/lucide/loader-circle';
	import PinOffIcon from '~icons/lucide/pin-off';
	import { useConvexClient } from 'convex-svelte';
	import { session } from '$lib/state/session.svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { callModal } from './ui/modal/global-modal.svelte';
	import { goto } from '$app/navigation';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import type { Doc, Id } from '$lib/backend/convex/_generated/dataModel';
	import PinIcon from '~icons/lucide/pin';
	import XIcon from '~icons/lucide/x';
	import { page } from '$app/state';
	import { Button } from './ui/button';

	const client = useConvexClient();

	const controls = useSidebarControls();

	async function togglePin(conversationId: string) {
		if (!session.current?.session.token) return;

		await client.mutation(api.conversations.togglePin, {
			conversation_id: conversationId as Id<'conversations'>,
			session_token: session.current.session.token,
		});
	}

	async function deleteConversation(conversationId: string) {
		const res = await callModal({
			title: 'Delete conversation',
			description: 'Are you sure you want to delete this conversation?',
			actions: { cancel: 'outline', delete: 'destructive' },
		});

		if (res !== 'delete') return;

		if (!session.current?.session.token) return;

		await client.mutation(api.conversations.remove, {
			conversation_id: conversationId as Id<'conversations'>,
			session_token: session.current.session.token,
		});
		await goto(`/chat`);
	}

	const conversationsQuery = useCachedQuery(api.conversations.get, {
		session_token: session.current?.session.token ?? '',
	});

	function groupConversationsByTime(conversations: Doc<'conversations'>[]) {
		const now = Date.now();
		const oneDay = 24 * 60 * 60 * 1000;
		const sevenDays = 7 * oneDay;
		const thirtyDays = 30 * oneDay;

		const groups = {
			pinned: [] as Doc<'conversations'>[],
			today: [] as Doc<'conversations'>[],
			yesterday: [] as Doc<'conversations'>[],
			lastWeek: [] as Doc<'conversations'>[],
			lastMonth: [] as Doc<'conversations'>[],
			older: [] as Doc<'conversations'>[],
		};

		conversations.forEach((conversation) => {
			// Pinned conversations go to pinned group regardless of time
			if (conversation.pinned) {
				groups.pinned.push(conversation);
				return;
			}

			const updatedAt = conversation.updated_at ?? 0;
			const timeDiff = now - updatedAt;

			if (timeDiff < oneDay) {
				groups.today.push(conversation);
			} else if (timeDiff < 2 * oneDay) {
				groups.yesterday.push(conversation);
			} else if (timeDiff < sevenDays) {
				groups.lastWeek.push(conversation);
			} else if (timeDiff < thirtyDays) {
				groups.lastMonth.push(conversation);
			} else {
				groups.older.push(conversation);
			}
		});

		// Sort pinned conversations by updated_at (most recent first)
		groups.pinned.sort((a, b) => {
			const aTime = a.updated_at ?? 0;
			const bTime = b.updated_at ?? 0;
			return bTime - aTime;
		});

		return groups;
	}

	const groupedConversations = $derived(groupConversationsByTime(conversationsQuery.data ?? []));

	const templateConversations = $derived([
		{ key: 'pinned', label: 'Pinned', conversations: groupedConversations.pinned, icon: PinIcon },
		{ key: 'today', label: 'Today', conversations: groupedConversations.today },
		{ key: 'yesterday', label: 'Yesterday', conversations: groupedConversations.yesterday },
		{ key: 'lastWeek', label: 'Last 7 days', conversations: groupedConversations.lastWeek },
		{ key: 'lastMonth', label: 'Last 30 days', conversations: groupedConversations.lastMonth },
		{ key: 'older', label: 'Older', conversations: groupedConversations.older },
	]);
</script>

<Sidebar class="flex flex-col overflow-clip p-2">
	<div class="flex place-items-center justify-center py-2">
		<span class="text-center font-serif text-lg">Thom.chat</span>
	</div>
	<div class="mt-1 flex w-full px-2">
		<Tooltip>
			{#snippet trigger(tooltip)}
				<a
					href="/chat"
					class="border-reflect button-reflect bg-primary/20 hover:bg-primary/50 font-fake-proxima w-full rounded-lg px-4 py-2 text-center text-sm tracking-[-0.005em] duration-200"
					{...tooltip.trigger}
					onclick={controls.closeMobile}
					style="font-variation-settings: 'wght' 750"
				>
					New Chat
				</a>
			{/snippet}
			{cmdOrCtrl} + Shift + O
		</Tooltip>
	</div>
	<div class="relative flex min-h-0 flex-1 shrink-0 flex-col overflow-clip">
		<div
			class="from-sidebar pointer-events-none absolute top-0 right-0 left-0 z-10 h-4 bg-gradient-to-b to-transparent"
		></div>
		<div class="flex flex-1 flex-col overflow-y-auto py-2">
			{#each templateConversations as group, index (group.key)}
				{@const IconComponent = group.icon}
				{#if group.conversations.length > 0}
					<div class="px-2 py-1" class:mt-2={index > 0}>
						<h3 class="text-heading text-xs font-medium">
							{#if IconComponent}
								<IconComponent class="inline size-3" />
							{/if}
							{group.label}
						</h3>
					</div>
					{#each group.conversations as conversation (conversation._id)}
						{@const isActive = page.params.id === conversation._id}
						<a
							href={`/chat/${conversation._id}`}
							onclick={controls.closeMobile}
							class="group w-full py-0.5 pr-2.5 text-left text-sm"
						>
							<div
								class={cn(
									'relative flex w-full items-center justify-between overflow-clip rounded-lg',
									{ 'bg-sidebar-accent': isActive, 'group-hover:bg-sidebar-accent': !isActive }
								)}
							>
								<p class="truncate rounded-lg py-2 pr-4 pl-3 whitespace-nowrap">
									<span>{conversation.title}</span>
								</p>
								<div class="pr-2">
									{#if conversation.generating}
										<div
											class="flex animate-[spin_0.75s_linear_infinite] place-items-center justify-center"
										>
											<LoaderCircleIcon class="size-4" />
										</div>
									{/if}
								</div>
								<div
									class={[
										'pointer-events-none absolute inset-y-0.5 right-0 flex translate-x-full items-center gap-2 rounded-r-lg pr-2 pl-6 transition group-hover:pointer-events-auto group-hover:translate-0',
										'to-sidebar-accent via-sidebar-accent bg-gradient-to-r from-transparent from-10% via-21% ',
									]}
								>
									<Tooltip>
										{#snippet trigger(tooltip)}
											<button
												{...tooltip.trigger}
												class="hover:bg-muted rounded-md p-1"
												onclick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													togglePin(conversation._id);
												}}
											>
												{#if conversation.pinned}
													<PinOffIcon class="size-4" />
												{:else}
													<PinIcon class="size-4" />
												{/if}
											</button>
										{/snippet}
										{conversation.pinned ? 'Unpin thread' : 'Pin thread'}
									</Tooltip>
									<Tooltip>
										{#snippet trigger(tooltip)}
											<button
												{...tooltip.trigger}
												class="hover:bg-muted rounded-md p-1"
												onclick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													deleteConversation(conversation._id);
												}}
											>
												<XIcon class="size-4" />
											</button>
										{/snippet}
										Delete thread
									</Tooltip>
								</div>
							</div>
						</a>
					{/each}
				{/if}
			{/each}
		</div>
		<div
			class="from-sidebar pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-4 bg-gradient-to-t to-transparent"
		></div>
	</div>
	<div class="py-2">
		{#if page.data.session !== null}
			<Button href="/account" variant="ghost" class="h-auto w-full justify-start">
				<Avatar src={page.data.session?.user.image ?? undefined}>
					{#snippet children(avatar)}
						<img {...avatar.image} alt="Your avatar" class="size-10 rounded-full" />
						<span {...avatar.fallback} class="size-10 rounded-full">
							{page.data.session?.user.name
								.split(' ')
								.map((name: string) => name[0]?.toUpperCase())
								.join('')}
						</span>
					{/snippet}
				</Avatar>
				<div class="flex flex-col">
					<span class="text-sm">{page.data.session?.user.name}</span>
					<span class="text-muted-foreground text-xs">{page.data.session?.user.email}</span>
				</div>
			</Button>
		{:else}
			<Button href="/login" class="w-full">Login</Button>
		{/if}
	</div>
</Sidebar>
