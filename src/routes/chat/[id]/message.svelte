<script lang="ts">
	import { cn } from '$lib/utils/utils';
	import { tv } from 'tailwind-variants';
	import type { Doc } from '$lib/backend/convex/_generated/dataModel';
	import { CopyButton } from '$lib/components/ui/copy-button';

	const style = tv({
		base: 'rounded-lg p-2',
		variants: {
			role: {
				user: 'bg-primary text-primary-foreground self-end',
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
			{message.content}
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
