<script lang="ts">
	import { Modal } from '$lib/components/ui/modal';
	import { Button } from '$lib/components/ui/button';
	import DownloadIcon from '~icons/lucide/download';
	import ExternalLinkIcon from '~icons/lucide/external-link';
	import XIcon from '~icons/lucide/x';
	import Tooltip from '../tooltip.svelte';

	type Props = {
		open?: boolean;
		imageUrl: string;
		fileName?: string;
	};

	let { open = $bindable(false), imageUrl, fileName = 'image' }: Props = $props();

	async function downloadImage() {
		try {
			const response = await fetch(imageUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Failed to download image:', error);
		}
	}

	function openInNewTab() {
		window.open(imageUrl, '_blank');
	}
</script>

<Modal bind:open>
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold">{fileName}</h2>
		<div class="flex items-center gap-2">
			<Tooltip>
				{#snippet trigger(tooltip)}
					<Button size="iconSm" variant="outline" onclick={downloadImage} {...tooltip.trigger}>
						<DownloadIcon class="size-4" />
					</Button>
				{/snippet}
				Download image
			</Tooltip>
			<Tooltip>
				{#snippet trigger(tooltip)}
					<Button size="iconSm" variant="outline" onclick={openInNewTab} {...tooltip.trigger}>
						<ExternalLinkIcon class="size-4" />
					</Button>
				{/snippet}
				Open in new tab
			</Tooltip>
			<Tooltip>
				{#snippet trigger(tooltip)}
					<Button
						size="iconSm"
						variant="outline"
						onclick={() => (open = false)}
						{...tooltip.trigger}
					>
						<XIcon class="size-4" />
					</Button>
				{/snippet}
				Close
			</Tooltip>
		</div>
	</div>

	<div class="mt-2 flex items-center justify-center">
		<img src={imageUrl} alt={fileName} class="max-h-[60vh] max-w-full rounded-lg object-contain" />
	</div>
</Modal>

