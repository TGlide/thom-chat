<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { tv } from 'tailwind-variants';
	import type { Doc } from '$lib/backend/convex/_generated/dataModel';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import '../../../markdown.css';
	import MarkdownRenderer from './markdown-renderer.svelte';
	import { ImageModal } from '$lib/components/ui/image-modal';
	import { sanitizeHtml } from '$lib/utils/markdown-it';
	import { on } from 'svelte/events';
	import { isHtmlElement } from '$lib/utils/is';
	import { Button } from '$lib/components/ui/button';
	import RefreshCwIcon from '~icons/lucide/refresh-cw';
	import Tooltip from '$lib/components/ui/tooltip.svelte';

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
</script>

{#if message.role !== 'system' && !(message.role === 'assistant' && message.content.length === 0 && !message.error)}
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
		<div
			class={cn(
				'flex place-items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100',
				{
					'justify-end': message.role === 'user',
				}
			)}
		>
			{#if message.role === 'user'}
				<Tooltip>
					{#snippet trigger(tooltip)}
						<Button size="icon" class="size-7" variant="ghost" {...tooltip.trigger}>
							<RefreshCwIcon />
						</Button>
					{/snippet}
					Generate a new version
				</Tooltip>
			{/if}
			{#if message.content.length > 0}
				<CopyButton class="size-7" text={message.content} />
			{/if}
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
