<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte';
	import { cn } from '$lib/utils/utils';
	import CheckIcon from '~icons/lucide/check';
	import CopyIcon from '~icons/lucide/copy';
	import { scale } from 'svelte/transition';

	interface Props {
		code: string;
		language?: string;
		class?: string;
	}

	let { code, language, class: className }: Props = $props();

	const clipboard = new UseClipboard();

	function copyCode() {
		clipboard.copy(code);
	}
</script>

<div class={cn('group relative', className)}>
	<div class="absolute right-2 top-2 z-10">
		<Button
			variant="ghost"
			size="sm"
			class="size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
			onclick={copyCode}
		>
			{#if clipboard.status === 'success'}
				<div in:scale={{ duration: 200, start: 0.8 }}>
					<CheckIcon class="size-3.5" />
				</div>
			{:else}
				<CopyIcon class="size-3.5" />
			{/if}
			<span class="sr-only">Copy code</span>
		</Button>
	</div>
	<slot />
</div>
</script>