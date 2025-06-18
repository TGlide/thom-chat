<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/backend/convex/_generated/api.js';
	import { type Doc, type Id } from '$lib/backend/convex/_generated/dataModel.js';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte.js';
	import * as Icons from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import { ImageModal } from '$lib/components/ui/image-modal';
	import { LightSwitch } from '$lib/components/ui/light-switch/index.js';
	import { callModal } from '$lib/components/ui/modal/global-modal.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte.js';
	import { TextareaAutosize } from '$lib/spells/textarea-autosize.svelte.js';
	import { models } from '$lib/state/models.svelte';
	import { usePrompt } from '$lib/state/prompt.svelte.js';
	import { session } from '$lib/state/session.svelte.js';
	import { settings } from '$lib/state/settings.svelte.js';
	import { Provider } from '$lib/types';
	import { compressImage } from '$lib/utils/image-compression';
	import { isString } from '$lib/utils/is.js';
	import { supportsImages } from '$lib/utils/model-capabilities';
	import { omit, pick } from '$lib/utils/object.js';
	import { cn } from '$lib/utils/utils.js';
	import { useConvexClient } from 'convex-svelte';
	import { FileUpload, Popover } from 'melt/builders';
	import { Avatar } from 'melt/components';
	import { Debounced, ElementSize, IsMounted, ScrollState } from 'runed';
	import SendIcon from '~icons/lucide/arrow-up';
	import StopIcon from '~icons/lucide/square';
	import ChevronDownIcon from '~icons/lucide/chevron-down';
	import ImageIcon from '~icons/lucide/image';
	import LoaderCircleIcon from '~icons/lucide/loader-circle';
	import PanelLeftIcon from '~icons/lucide/panel-left';
	import PinIcon from '~icons/lucide/pin';
	import PinOffIcon from '~icons/lucide/pin-off';
	import Settings2Icon from '~icons/lucide/settings-2';
	import UploadIcon from '~icons/lucide/upload';
	import XIcon from '~icons/lucide/x';
	import { callGenerateMessage } from '../api/generate-message/call.js';
	import { callCancelGeneration } from '../api/cancel-generation/call.js';
	import ModelPicker from './model-picker.svelte';

	const client = useConvexClient();

	let { data, children } = $props();

	let form = $state<HTMLFormElement>();
	let textarea = $state<HTMLTextAreaElement>();
	let abortController = $state<AbortController | null>(null);

	const currentConversationQuery = useCachedQuery(api.conversations.getById, () => ({
		conversation_id: page.params.id as Id<'conversations'>,
		session_token: session.current?.session.token ?? '',
	}));

	const isGenerating = $derived(Boolean(currentConversationQuery.data?.generating));

	async function stopGeneration() {
		if (!page.params.id || !session.current?.session.token) return;

		try {
			const result = await callCancelGeneration({
				conversation_id: page.params.id,
				session_token: session.current.session.token,
			});

			if (result.isErr()) {
				console.error('Failed to cancel generation:', result.error);
			} else {
				console.log('Generation cancelled:', result.value.cancelled);
			}
		} catch (error) {
			console.error('Error cancelling generation:', error);
		}

		// Clear local abort controller if it exists
		if (abortController) {
			abortController = null;
		}
	}

	async function handleSubmit() {
		if (isGenerating) return;

		const formData = new FormData(form);
		const message = formData.get('message');

		// TODO: Re-use zod here from server endpoint for better error messages?
		if (!isString(message) || !session.current?.user.id || !settings.modelId) return;

		if (textarea) textarea.value = '';
		const messageCopy = message;
		const imagesCopy = [...selectedImages];
		selectedImages = [];

		try {
			const res = await callGenerateMessage({
				message: messageCopy,
				session_token: session.current?.session.token,
				conversation_id: page.params.id ?? undefined,
				model_id: settings.modelId,
				images: imagesCopy.length > 0 ? imagesCopy : undefined,
			});

			if (res.isErr()) {
				return; // TODO: Handle error
			}

			const cid = res.value.conversation_id;

			if (page.params.id !== cid) {
				goto(`/chat/${cid}`);
			}
		} catch (error) {
			console.error('Error generating message:', error);
		}
	}

	const conversationsQuery = useCachedQuery(api.conversations.get, {
		session_token: session.current?.session.token ?? '',
	});

	const openRouterKeyQuery = useCachedQuery(api.user_keys.get, {
		provider: Provider.OpenRouter,
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
	let selectedImages = $state<{ url: string; storage_id: string; fileName?: string }[]>([]);
	let isUploading = $state(false);
	let fileInput = $state<HTMLInputElement>();
	let imageModal = $state<{ open: boolean; imageUrl: string; fileName: string }>({
		open: false,
		imageUrl: '',
		fileName: '',
	});

	usePrompt(
		() => message,
		(v) => (message = v)
	);

	models.init();

	const currentModelSupportsImages = $derived.by(() => {
		if (!settings.modelId) return false;
		const openRouterModels = models.from(Provider.OpenRouter);
		const currentModel = openRouterModels.find((m) => m.id === settings.modelId);
		return currentModel ? supportsImages(currentModel) : false;
	});

	const fileUpload = new FileUpload({
		multiple: true,
		accept: 'image/*',
		maxSize: 10 * 1024 * 1024, // 10MB
	});

	async function handleFileChange(files: File[]) {
		if (!files.length || !session.current?.session.token) return;

		isUploading = true;
		const uploadedFiles: { url: string; storage_id: string; fileName?: string }[] = [];

		try {
			for (const file of files) {
				// Skip non-image files
				if (!file.type.startsWith('image/')) {
					console.warn('Skipping non-image file:', file.name);
					continue;
				}

				// Compress image to max 1MB
				const compressedFile = await compressImage(file, 1024 * 1024);

				// Generate upload URL
				const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {
					session_token: session.current.session.token,
				});

				// Upload compressed file
				const result = await fetch(uploadUrl, {
					method: 'POST',
					body: compressedFile,
				});

				if (!result.ok) {
					throw new Error(`Upload failed: ${result.statusText}`);
				}

				const { storageId } = await result.json();

				// Get the URL for the uploaded file
				const url = await client.query(api.storage.getUrl, {
					storage_id: storageId,
					session_token: session.current.session.token,
				});

				if (url) {
					uploadedFiles.push({ url, storage_id: storageId, fileName: file.name });
				}
			}

			selectedImages = [...selectedImages, ...uploadedFiles];
		} catch (error) {
			console.error('Upload failed:', error);
		} finally {
			isUploading = false;
		}
	}

	function removeImage(index: number) {
		selectedImages = selectedImages.filter((_, i) => i !== index);
	}

	function openImageModal(imageUrl: string, fileName: string) {
		imageModal = {
			open: true,
			imageUrl,
			fileName,
		};
	}

	$effect(() => {
		if (fileUpload.selected.size > 0) {
			handleFileChange(Array.from(fileUpload.selected));
			fileUpload.clear();
		}
	});

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

	const mounted = new IsMounted();

	const notAtBottom = new Debounced(
		() => !scrollState.arrived.bottom,
		() => (mounted.current ? 250 : 0)
	);
</script>

<svelte:head>
	<title>Chat | Thom.chat</title>
</svelte:head>

<Sidebar.Root
	class="h-screen overflow-clip"
	{...currentModelSupportsImages ? omit(fileUpload.dropzone, ['onclick']) : {}}
>
	<Sidebar.Sidebar class="flex flex-col overflow-clip p-2">
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
		<Tooltip>
			{#snippet trigger(tooltip)}
				<Sidebar.Trigger class="fixed top-3 left-2 z-50" {...tooltip.trigger}>
					<PanelLeftIcon />
				</Sidebar.Trigger>
			{/snippet}
			{cmdOrCtrl} + B
		</Tooltip>

		<!-- header -->
		<div class="bg-sidebar fixed top-0 right-0 z-50 hidden rounded-bl-lg p-1 md:flex">
			<Tooltip>
				{#snippet trigger(tooltip)}
					<Button variant="ghost" size="icon" class="size-8" href="/account" {...tooltip.trigger}>
						<Settings2Icon />
					</Button>
				{/snippet}
				Settings
			</Tooltip>
			<LightSwitch variant="ghost" class="size-8" />
		</div>
		<div class="relative">
			<div bind:this={conversationList} class="h-screen overflow-y-auto">
				<div
					class="mx-auto flex max-w-3xl flex-col"
					style="padding-bottom: {page.url.pathname !== '/chat' ? wrapperSize.height : 0}px"
				>
					{@render children()}
				</div>
				<Button
					onclick={() => scrollState.scrollToBottom()}
					variant="secondary"
					size="sm"
					class={[
						'text-muted-foreground !border-border absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-full !border !pl-3 text-xs transition',
						notAtBottom.current ? 'opacity-100' : 'pointer-events-none scale-95 opacity-0',
					]}
					style="bottom: {wrapperSize.height + 5}px;"
				>
					Scroll to bottom
					<ChevronDownIcon class="inline" />
				</Button>
			</div>

			<div
				class="abs-x-center group absolute -bottom-px left-1/2 mt-auto flex w-full max-w-3xl flex-col gap-1"
				bind:this={textareaWrapper}
			>
				<div
					class={[
						'border-reflect bg-background/80 rounded-t-[20px] p-2 pb-0 backdrop-blur-lg',
						'[--opacity:50%] group-focus-within:[--opacity:100%]',
					]}
				>
					<form
						class={[
							'bg-background/50 text-foreground dark:bg-secondary/20 relative flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/70 pt-3 pb-3 outline-8 dark:border-white/10',
							'transition duration-200',
							'outline-primary/1 group-focus-within:outline-primary/10',
						]}
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
							{#if selectedImages.length > 0}
								<div class="mb-2 flex flex-wrap gap-2">
									{#each selectedImages as image, index (image.storage_id)}
										<div
											class="group border-secondary-foreground/[0.08] bg-secondary-foreground/[0.02] hover:bg-secondary-foreground/10 relative flex h-12 w-12 max-w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-solid p-0 transition-[width,height] duration-500"
										>
											<button
												type="button"
												onclick={() => openImageModal(image.url, image.fileName || 'image')}
												class="rounded-lg"
											>
												<img
													src={image.url}
													alt="Uploaded"
													class="size-10 rounded-lg object-cover opacity-100 transition-opacity"
												/>
											</button>
											<button
												type="button"
												onclick={() => removeImage(index)}
												class="bg-secondary hover:bg-muted absolute -top-1 -right-1 cursor-pointer rounded-full p-1 opacity-0 transition group-hover:opacity-100"
											>
												<XIcon class="h-3 w-3" />
											</button>
										</div>
									{/each}
								</div>
							{/if}
							<div class="relative flex flex-grow flex-row items-start">
								<input {...fileUpload.input} bind:this={fileInput} />
								<!-- TODO: Figure out better autofocus solution -->
								<!-- svelte-ignore a11y_autofocus -->
								<textarea
									{...pick(popover.trigger, ['id', 'style', 'onfocusout', 'onfocus'])}
									bind:this={textarea}
									disabled={!openRouterKeyQuery.data || isGenerating}
									class="text-foreground placeholder:text-muted-foreground/60 max-h-64 min-h-[80px] w-full resize-none !overflow-y-auto bg-transparent px-3 text-base leading-6 outline-none disabled:cursor-not-allowed disabled:opacity-50"
									placeholder={isGenerating
										? 'Generating response...'
										: 'Type your message here... Tag rules with @'}
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
							<div class="mt-2 -mb-px flex w-full flex-row-reverse justify-between px-2">
								<div class="-mt-0.5 -mr-0.5 flex items-center justify-center gap-2">
									<Tooltip placement="top">
										{#snippet trigger(tooltip)}
											<button
												type={isGenerating ? 'button' : 'submit'}
												onclick={isGenerating ? stopGeneration : undefined}
												disabled={isGenerating ? false : !message.trim()}
												class="border-reflect button-reflect hover:bg-primary/90 active:bg-primary text-primary-foreground relative h-9 w-9 rounded-lg p-2 font-semibold shadow transition disabled:cursor-not-allowed disabled:opacity-50"
												{...tooltip.trigger}
											>
												{#if isGenerating}
													<StopIcon class="!size-5" />
												{:else}
													<SendIcon class="!size-5" />
												{/if}
											</button>
										{/snippet}
										{isGenerating ? 'Stop generation' : 'Send message'}
									</Tooltip>
								</div>
								<div class="flex flex-col gap-2 pr-2 sm:flex-row sm:items-center">
									<ModelPicker />
									{#if currentModelSupportsImages}
										<button
											type="button"
											class="border-border hover:bg-accent/20 flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors disabled:opacity-50"
											onclick={() => fileInput?.click()}
											disabled={isUploading}
										>
											{#if isUploading}
												<div
													class="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
												></div>
											{:else}
												<ImageIcon class="!size-3" />
											{/if}
											<span class="whitespace-nowrap">Attach image</span>
										</button>
									{/if}
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

	{#if fileUpload.isDragging && currentModelSupportsImages}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
			<div class="text-center">
				<UploadIcon class="text-primary mx-auto mb-4 h-16 w-16" />
				<p class="text-xl font-semibold">Add image</p>
				<p class="mt-2 text-sm opacity-75">Drop an image here to attach it to your message.</p>
			</div>
		</div>
	{/if}

	<ImageModal
		bind:open={imageModal.open}
		imageUrl={imageModal.imageUrl}
		fileName={imageModal.fileName}
	/>
</Sidebar.Root>
