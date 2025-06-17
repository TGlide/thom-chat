<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { tv } from 'tailwind-variants';
	import type { Doc } from '$lib/backend/convex/_generated/dataModel';
	import { CopyButton } from '$lib/components/ui/copy-button';
	import '../../../markdown.css';
	import MarkdownRenderer from './markdown-renderer.svelte';

	const style = tv({
		base: 'prose rounded-lg p-2',
		variants: {
			role: {
				user: 'bg-primary !text-primary-foreground self-end',
				assistant: 'text-foreground',
			},
		},
	});

	type Props = {
		message: Doc<'messages'>;
	};

	let { message }: Props = $props();
</script>

{#if message.role !== 'system' && !(message.role === 'assistant' && message.content.length === 0)}
	<div class={cn('group flex max-w-[80%] flex-col gap-1', { 'self-end': message.role === 'user' })}>
		{#if message.images && message.images.length > 0}
			<div class="flex flex-wrap gap-2 mb-2">
				{#each message.images as image}
					<img src={image.url} alt="Uploaded" class="max-w-xs rounded-lg" />
				{/each}
			</div>
		{/if}
		<div class={style({ role: message.role })}>
			<svelte:boundary>
				<MarkdownRenderer content={message.content} />

				{#snippet failed(error)}
					<div class="text-destructive">
						<span>Error rendering markdown:</span>
						<pre class="!bg-sidebar"><code>{error instanceof Error ? error.message : String(error)}</code></pre>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
		<div
			class={cn('flex place-items-center opacity-0 transition-opacity group-hover:opacity-100', {
				'justify-end': message.role === 'user',
			})}
		>
			<CopyButton class="size-7" text={message.content} />
		</div>
	</div>
{/if}
