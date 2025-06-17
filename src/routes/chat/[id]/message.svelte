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
		<div class={style({ role: message.role })}>
			<svelte:boundary>
				<MarkdownRenderer content={message.content} />

				{#snippet failed(error)}
					<div class="text-destructive">
						<span>Error rendering markdown:</span>
						<pre class="!bg-sidebar"><code>{error.message}</code></pre>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
		<div
			class={cn(
				'flex place-items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100',
				{
					'justify-end': message.role === 'user',
				}
			)}
		>
			<CopyButton class="size-7" text={message.content} />
			{#if message.model_id !== undefined}
				<span class="text-muted-foreground text-xs">{message.model_id}</span>
			{/if}
			{#if message.cost_usd !== undefined}
				<span class="text-muted-foreground text-xs">
					${message.cost_usd.toFixed(6)}
				</span>
			{/if}
		</div>
	</div>
{/if}
