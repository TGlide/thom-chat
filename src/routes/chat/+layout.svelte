<script lang="ts">
	import * as Icons from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { session } from '$lib/state/session.svelte.js';
	import { settings } from '$lib/state/settings.svelte.js';
	import { isString } from '$lib/utils/is.js';
	import { Avatar } from 'melt/components';
	import PanelLeftIcon from '~icons/lucide/panel-left';
	import PinIcon from '~icons/lucide/pin';
	import PinOffIcon from '~icons/lucide/pin-off';
	import XIcon from '~icons/lucide/x';
	import SendIcon from '~icons/lucide/send';
	import { callGenerateMessage } from '../api/generate-message/call.js';
	import ModelPicker from './model-picker.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte.js';
	import { api } from '$lib/backend/convex/_generated/api.js';
	import { type Doc, type Id } from '$lib/backend/convex/_generated/dataModel.js';
	import { TextareaAutosize } from '$lib/spells/textarea-autosize.svelte.js';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { Popover } from 'melt/builders';
	import { useConvexClient } from 'convex-svelte';
	import { callModal } from '$lib/components/ui/modal/global-modal.svelte';
	import { ElementSize, ScrollState, Debounced } from 'runed';
	import LoaderCircleIcon from '~icons/lucide/loader-circle';
	import { cn } from '$lib/utils/utils.js';
	import { pick } from '$lib/utils/object.js';
	import ChevronDownIcon from '~icons/lucide/chevron-down';
	import { LightSwitch } from '$lib/components/ui/light-switch/index.js';
	import Settings2Icon from '~icons/lucide/settings-2';

	const client = useConvexClient();

	let { data, children } = $props();

	let form = $state<HTMLFormElement>();
	let textarea = $state<HTMLTextAreaElement>();
	async function handleSubmit() {
		const formData = new FormData(form);
		const message = formData.get('message');

		// TODO: Re-use zod here from server endpoint for better error messages?
		if (!isString(message) || !session.current?.user.id || !settings.modelId) return;

		if (textarea) textarea.value = '';
		const res = await callGenerateMessage({
			message,
			session_token: session.current?.session.token,
			conversation_id: page.params.id ?? undefined,
			model_id: settings.modelId,
		});
		if (res.isErr()) return; // TODO: Handle error

		const cid = res.value.conversation_id;

		if (page.params.id !== cid) {
			goto(`/chat/${cid}`);
		}
	}

	const conversationsQuery = useCachedQuery(api.conversations.get, {
		session_token: session.current?.session.token ?? '',
	});

	const rulesQuery = useCachedQuery(api.user_rules.all, {
		session_token: session.current?.session.token ?? '',
	});

	const autosize = new TextareaAutosize();

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
		goto(`/chat`);
	}

	const templateConversations = $derived([
		{ key: 'pinned', label: 'Pinned', conversations: groupedConversations.pinned, icon: PinIcon },
		{ key: 'today', label: 'Today', conversations: groupedConversations.today },
		{ key: 'yesterday', label: 'Yesterday', conversations: groupedConversations.yesterday },
		{ key: 'lastWeek', label: 'Last 7 days', conversations: groupedConversations.lastWeek },
		{ key: 'lastMonth', label: 'Last 30 days', conversations: groupedConversations.lastMonth },
		{ key: 'older', label: 'Older', conversations: groupedConversations.older },
	]);

	let message = $state('');

	const suggestedRules = $derived.by(() => {
		if (!rulesQuery.data || rulesQuery.data.length === 0) return;
		if (!textarea) return;

		const cursor = textarea.selectionStart;

		const index = message.lastIndexOf('@', cursor);
		if (index === -1) return;

		const ruleFromCursor = message.slice(index + 1, cursor);

		const suggestions: Doc<'user_rules'>[] = [];

		for (const rule of rulesQuery.data) {
			// on a match, don't show any suggestions
			if (rule.name === ruleFromCursor) return;

			if (rule.name.toLowerCase().startsWith(ruleFromCursor.toLowerCase())) {
				suggestions.push(rule);
			}
		}

		return suggestions.length > 0 ? suggestions : undefined;
	});

	const popover = new Popover({
		floatingConfig: {
			computePosition: { placement: 'top' },
		},
	});

	function completeRule(rule: Doc<'user_rules'>) {
		if (!textarea) return;

		const cursor = textarea.selectionStart;

		const index = message.lastIndexOf('@', cursor);
		if (index === -1) return;

		message = message.slice(0, index) + `@${rule.name}` + message.slice(cursor);
		textarea.selectionStart = index + rule.name.length + 1;
		textarea.selectionEnd = index + rule.name.length + 1;

		popover.open = false;
	}

	function completeSelectedRule() {
		if (!suggestedRules) return;

		const rules = Array.from(ruleList.querySelectorAll('[data-list-item]'));

		const activeIndex = rules.findIndex((r) => r.getAttribute('data-active') === 'true');
		if (activeIndex === -1) return;

		const rule = suggestedRules[activeIndex];

		if (!rule) return;

		completeRule(rule);
	}

	let ruleList = $state<HTMLDivElement>(null!);

	function handleKeyboardNavigation(direction: 'up' | 'down') {
		if (!suggestedRules) return;

		const rules = Array.from(ruleList.querySelectorAll('[data-list-item]'));

		let activeIndex = rules?.findIndex((r) => r.getAttribute('data-active') === 'true');
		if (activeIndex === -1) {
			if (!suggestedRules[0]) return;

			rules[0]?.setAttribute('data-active', 'true');
			return;
		}

		// don't loop
		if (direction === 'up' && activeIndex === 0) {
			return;
		}
		// don't loop
		if (direction === 'down' && activeIndex === suggestedRules.length - 1) {
			return;
		}

		rules[activeIndex]?.setAttribute('data-active', 'false');

		if (direction === 'up') {
			const newIndex = activeIndex - 1;
			if (!suggestedRules[newIndex]) return;

			rules[newIndex]?.setAttribute('data-active', 'true');
		} else {
			const newIndex = activeIndex + 1;
			if (!suggestedRules[newIndex]) return;

			rules[newIndex]?.setAttribute('data-active', 'true');
		}
	}

	const textareaSize = new ElementSize(() => textarea);

	let textareaWrapper = $state<HTMLDivElement>();
	const wrapperSize = new ElementSize(() => textareaWrapper);

	let conversationList = $state<HTMLDivElement>();
	const scrollState = new ScrollState({
		element: () => conversationList,
	});

	const notAtBottom = new Debounced(() => !scrollState.arrived.bottom, 500);
</script>

<svelte:head>
	<title>Chat | Thom.chat</title>
</svelte:head>

<Sidebar.Root class="h-screen overflow-clip">
	<Sidebar.Sidebar class="flex flex-col overflow-clip p-2">
		<div class="flex place-items-center justify-center py-2">
			<span class="text-center font-serif text-lg">Thom.chat</span>
		</div>
		<div class="mt-1 flex w-full px-2">
			<a
				href="/chat"
				class="border-reflect button-reflect bg-primary/20 hover:bg-primary/50 font-fake-proxima w-full rounded-lg px-4 py-2 text-center text-sm tracking-[-0.005em] duration-200"
				style="font-variation-settings: 'wght' 750"
			>
				New Chat
			</a>
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
			{#if data.session !== null}
				<Button href="/account" variant="ghost" class="h-auto w-full justify-start">
					<Avatar src={data.session?.user.image ?? undefined}>
						{#snippet children(avatar)}
							<img {...avatar.image} alt="Your avatar" class="size-10 rounded-full" />
							<span {...avatar.fallback} class="size-10 rounded-full">
								{data.session?.user.name
									.split(' ')
									.map((name) => name[0]?.toUpperCase())
									.join('')}
							</span>
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

	<Sidebar.Inset class="w-full overflow-clip ">
		<Sidebar.Trigger class="fixed top-3 left-2 z-50">
			<PanelLeftIcon />
		</Sidebar.Trigger>
		<!-- header -->
		<div class="bg-sidebar fixed top-0 right-0 z-50 hidden rounded-bl-lg p-1 md:flex">
			<Button variant="ghost" size="icon" class="size-8" href="/account">
				<Settings2Icon/>
			</Button>
			<LightSwitch variant="ghost" class="size-8"/>
		</div>
		<div class="relative">
			<div bind:this={conversationList} class="h-screen overflow-y-auto">
				<div
					class="mx-auto flex max-w-3xl flex-col"
					style:padding-bottom={wrapperSize.height + 'px'}
				>
					{@render children()}
				</div>
				{#if notAtBottom.current}
					<Button
						onclick={() => scrollState.scrollToBottom()}
						variant="secondary"
						size="sm"
						class="text-muted-foreground absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-full text-xs"
						style="bottom: {wrapperSize.height + 5}px;"
					>
						Scroll to bottom
						<ChevronDownIcon class="inline" />
					</Button>
				{/if}
			</div>

			<div
				class="abs-x-center absolute bottom-0 left-1/2 mt-auto flex w-full max-w-3xl flex-col gap-1"
				bind:this={textareaWrapper}
			>
				<div class="border-reflect bg-background/80 rounded-t-[20px] p-2 pb-0 backdrop-blur-lg">
					<form
						class="bg-background/50 text-foreground outline-primary/10 dark:bg-secondary/20 relative flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/70 px-3 pt-3 pb-3 outline outline-8 dark:border-white/10"
						style="box-shadow: rgba(0, 0, 0, 0.1) 0px 80px 50px 0px, rgba(0, 0, 0, 0.07) 0px 50px 30px 0px, rgba(0, 0, 0, 0.06) 0px 30px 15px 0px, rgba(0, 0, 0, 0.04) 0px 15px 8px, rgba(0, 0, 0, 0.04) 0px 6px 4px, rgba(0, 0, 0, 0.02) 0px 2px 2px;"
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
						bind:this={form}
					>
						{#if suggestedRules}
							<div
								{...popover.content}
								class="bg-background border-border absolute rounded-lg border"
								style="width: {textareaSize.width}px"
							>
								<div class="flex flex-col p-2" bind:this={ruleList}>
									{#each suggestedRules as rule, i (rule._id)}
										<button
											type="button"
											data-list-item
											data-active={i === 0}
											onmouseover={(e) => {
												for (const rule of ruleList.querySelectorAll('[data-list-item]')) {
													rule.setAttribute('data-active', 'false');
												}

												e.currentTarget.setAttribute('data-active', 'true');
											}}
											onfocus={(e) => {
												for (const rule of ruleList.querySelectorAll('[data-list-item]')) {
													rule.setAttribute('data-active', 'false');
												}

												e.currentTarget.setAttribute('data-active', 'true');
											}}
											onclick={() => completeRule(rule)}
											class="data-[active=true]:bg-accent rounded-md px-2 py-1 text-start"
										>
											{rule.name}
										</button>
									{/each}
								</div>
							</div>
						{/if}
						<div class="flex flex-grow flex-col">
							<div class="flex flex-grow flex-row items-start">
								<!-- TODO: Figure out better autofocus solution -->
								<!-- svelte-ignore a11y_autofocus -->
								<textarea
									{...pick(popover.trigger, ['id', 'style', 'onfocusout', 'onfocus'])}
									bind:this={textarea}
									class="text-foreground placeholder:text-muted-foreground/60 max-h-64 min-h-[60px] w-full resize-none !overflow-y-auto bg-transparent text-base leading-6 outline-none disabled:opacity-0"
									placeholder="Type your message here..."
									name="message"
									onkeydown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey && !popover.open) {
											e.preventDefault();
											handleSubmit();
										}

										if (e.key === 'Enter' && popover.open) {
											e.preventDefault();
											completeSelectedRule();
										}

										if (e.key === 'Escape' && popover.open) {
											e.preventDefault();
											popover.open = false;
										}

										if (e.key === 'ArrowUp' && popover.open) {
											e.preventDefault();
											handleKeyboardNavigation('up');
										}

										if (e.key === 'ArrowDown' && popover.open) {
											e.preventDefault();
											handleKeyboardNavigation('down');
										}

										if (e.key === '@' && !popover.open) {
											popover.open = true;
										}
									}}
									bind:value={message}
									autofocus
									autocomplete="off"
									{@attach autosize.attachment}
								></textarea>
							</div>
							<div class="mt-2 -mb-px flex w-full flex-row-reverse justify-between">
								<div class="-mt-0.5 -mr-0.5 flex items-center justify-center gap-2">
									<button
										type="submit"
										class="border-reflect button-reflect hover:bg-primary/90 active:bg-primary text-primary-foreground relative h-9 w-9 rounded-lg p-2 font-semibold shadow transition"
									>
										<SendIcon class="!size-5" />
									</button>
								</div>
								<div class="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
									<ModelPicker />
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>

			<!-- Credits in bottom-right, only on large screens -->
			<div class="fixed right-4 bottom-4 hidden flex-col items-end gap-1 xl:flex">
				<a
					href="https://github.com/TGlide/thom-chat"
					class="text-muted-foreground flex place-items-center gap-1 text-xs"
				>
					Source on <Icons.GitHub class="inline size-3" />
				</a>
				<span class="text-muted-foreground flex place-items-center gap-1 text-xs">
					Crafted by <Icons.Svelte class="inline size-3" /> wizards.
				</span>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Root>
