<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { tv } from 'tailwind-variants';
	import type { Doc, Id } from '$lib/backend/convex/_generated/dataModel';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import '../../../markdown.css';
	import MarkdownRenderer from './markdown-renderer.svelte';
	import { ImageModal } from '$lib/components/ui/image-modal';
	import { sanitizeHtml } from '$lib/utils/markdown-it';
	import { on } from 'svelte/events';
	import { isHtmlElement } from '$lib/utils/is';
	import { Button } from '$lib/components/ui/button';
	import Tooltip from '$lib/components/ui/tooltip.svelte';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte';
	import { ResultAsync } from 'neverthrow';
	import { goto } from '$app/navigation';
	import { callGenerateMessage } from '../../api/generate-message/call';
	import * as Icons from '$lib/components/icons';
	import { settings } from '$lib/state/settings.svelte';
	import ShinyText from '$lib/components/animations/shiny-text.svelte';
	import ChevronRightIcon from '~icons/lucide/chevron-right';
	import { AnnotationSchema, type Annotation } from '$lib/types';
	import ExternalLinkIcon from '~icons/lucide/external-link';
	import GlobeIcon from '~icons/lucide/globe';

	const style = tv({
		base: 'prose rounded-xl p-2 max-w-full',
		variants: {
			role: {
				user: 'bg-secondary/50 border border-secondary/70 px-3 py-2 !text-black/80 dark:!text-primary-foreground self-end',
				assistant: 'text-foreground',
			},
		},
	});

	type Props = {
		message: Doc<'messages'>;
	};

	const client = useConvexClient();

	let { message }: Props = $props();

	let imageModal = $state<{ open: boolean; imageUrl: string; fileName: string }>({
		open: false,
		imageUrl: '',
		fileName: '',
	});

	function openImageModal(imageUrl: string, fileName: string) {
		imageModal = {
			open: true,
			imageUrl,
			fileName,
		};
	}

	async function createBranchedConversation() {
		const res = await ResultAsync.fromPromise(
			client.mutation(api.conversations.createBranched, {
				conversation_id: message.conversation_id as Id<'conversations'>,
				from_message_id: message._id,
				session_token: session.current?.session.token ?? '',
			}),
			(e) => e
		);

		if (res.isErr()) {
			console.error(res.error);
			return;
		}

		const cid = res.value;

		if (message.role === 'user' && settings.modelId) {
			const generateRes = await callGenerateMessage({
				session_token: session.current?.session.token ?? '',
				conversation_id: cid,
				model_id: settings.modelId,
				images: message.images,
				web_search_enabled: message.web_search_enabled,
			});

			if (generateRes.isErr()) {
				// TODO: add error toast
				return;
			}
		}

		await goto(`/chat/${cid}`);
	}

	const annotations = $derived.by(() => {
		if (!message.annotations || message.annotations.length === 0) return null;

		const annotations: Annotation[] = [];

		for (const annotation of message.annotations) {
			const parsed = AnnotationSchema.safeParse(annotation);

			if (!parsed.success) continue;

			annotations.push(parsed.data);
		}

		return annotations;
	});

	let showReasoning = $state(false);
</script>

{#if message.role !== 'system' && !(message.role === 'assistant' && message.content.length === 0 && message.reasoning?.length === 0 && !message.error)}
	<div
		class={cn('group flex flex-col gap-1', { 'max-w-[80%] self-end ': message.role === 'user' })}
		{@attach (node) => {
			return on(node, 'click', (e) => {
				const el = e.target as HTMLElement;
				const closestCopyButton = el.closest('.copy[data-code]');
				if (!isHtmlElement(closestCopyButton)) return;

				const code = closestCopyButton.dataset.code;
				if (!code) return;

				navigator.clipboard.writeText(code);
				closestCopyButton.classList.add('copied');
				setTimeout(() => closestCopyButton.classList.remove('copied'), 3000);
			});
		}}
	>
		{#if message.images && message.images.length > 0}
			<div class="mb-2 flex flex-wrap gap-2">
				{#each message.images as image (image.storage_id)}
					<button
						type="button"
						onclick={() => openImageModal(image.url, image.fileName || 'image')}
						class="rounded-lg"
					>
						<img
							src={image.url}
							alt={image.fileName || 'Uploaded'}
							class="max-w-xs rounded-lg transition-opacity hover:opacity-80"
						/>
					</button>
				{/each}
			</div>
		{/if}
		{#if message.reasoning}
			<div class="my-8">
				<button
					type="button"
					class="text-muted-foreground flex items-center gap-1 pb-2 text-sm"
					aria-label="Toggle reasoning"
					onclick={() => (showReasoning = !showReasoning)}
				>
					<ChevronRightIcon class={cn('inline size-4', { 'rotate-90': showReasoning })} />
					{#if message.content.length === 0}
						<ShinyText>Reasoning...</ShinyText>
					{:else}
						<span>Reasoning</span>
					{/if}
				</button>
				{#if showReasoning}
					<div class="text-muted-foreground/50 bg-popover relative rounded-lg p-2 text-xs">
						{message.reasoning}
					</div>
				{/if}
			</div>
		{/if}
		<div class={style({ role: message.role })}>
			{#if message.error}
				<div class="text-destructive">
					<pre class="!bg-sidebar"><code>{message.error}</code></pre>
				</div>
			{:else if message.content_html}
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html sanitizeHtml(message.content_html)}
			{:else}
				<svelte:boundary>
					<MarkdownRenderer content={message.content} />

					{#snippet failed(error)}
						<div class="text-destructive">
							<span>Error rendering markdown:</span>
							<pre class="!bg-sidebar"><code
									>{error instanceof Error ? error.message : String(error)}</code
								></pre>
						</div>
					{/snippet}
				</svelte:boundary>
			{/if}
		</div>
		{#if annotations}
			<span class="text-muted-foreground pl-2 text-xs">
				{annotations.length}
				{annotations.length === 1 ? 'Citation' : 'Citations'}
			</span>
			<div class="scrollbar-hide flex place-items-center gap-2 overflow-x-auto p-2">
				{#each annotations as annotation}
					{#if annotation.type === 'url_citation'}
						<div
							class="border-border hover:border-primary/50 text-muted-foreground group relative flex h-32 min-w-60 flex-col justify-between rounded-lg border p-4 transition-colors"
						>
							<div>
								<a
									href={annotation.url_citation.url}
									target="_blank"
									class="group-hover:text-foreground block max-w-full truncate font-medium transition-colors"
								>
									<span class="absolute inset-0"></span>
									{annotation.url_citation.title}
								</a>
								<p class="truncate text-sm">
									{annotation.url_citation.content}
								</p>
							</div>
							<span class="flex items-center gap-2 text-xs">
								<GlobeIcon class="inline-block size-4 shrink-0" />
								{new URL(annotation.url_citation.url).hostname}
							</span>

							<ExternalLinkIcon class="text-primary absolute top-2 right-2 size-3" />
						</div>
					{/if}
				{/each}
			</div>
		{/if}
		<div
			class={cn(
				'flex place-items-center gap-2 transition-opacity group-hover:opacity-100 md:opacity-0',
				{
					'justify-end': message.role === 'user',
				}
			)}
		>
			<Tooltip>
				{#snippet trigger(tooltip)}
					<Button
						size="icon"
						variant="ghost"
						class={cn('group order-2 size-7', { 'order-1': message.role === 'user' })}
						onClickPromise={createBranchedConversation}
						{...tooltip.trigger}
					>
						{#if message.role === 'user'}
							<Icons.BranchAndRegen class="group-data-[loading=true]:opacity-0" />
						{:else}
							<Icons.Branch class="group-data-[loading=true]:opacity-0" />
						{/if}
					</Button>
				{/snippet}
				{message.role === 'user' ? 'Branch and regenerate message' : 'Branch off this message'}
			</Tooltip>
			{#if message.content.length > 0}
				<Tooltip>
					{#snippet trigger(tooltip)}
						<CopyButton
							class={cn('order-1 size-7', { 'order-2': message.role === 'user' })}
							text={message.content}
							{...tooltip.trigger}
						/>
					{/snippet}
					Copy
				</Tooltip>
			{/if}
			{#if message.role === 'assistant'}
				{#if message.model_id !== undefined}
					<span class="text-muted-foreground text-xs">{message.model_id}</span>
				{/if}
				{#if message.web_search_enabled}
					<span class="text-muted-foreground text-xs"> Web search enabled </span>
				{/if}

				{#if message.cost_usd !== undefined}
					<span class="text-muted-foreground text-xs">
						${message.cost_usd.toFixed(6)}
					</span>
				{/if}
			{/if}
		</div>
	</div>

	{#if message.images && message.images.length > 0}
		<ImageModal
			bind:open={imageModal.open}
			imageUrl={imageModal.imageUrl}
			fileName={imageModal.fileName}
		/>
	{/if}
{/if}
