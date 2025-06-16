<script lang="ts">
	import { clickOutside } from '$lib/attachments/click-outside.svelte.js';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		open: boolean;
	}

	let { children, open = $bindable(false) }: Props = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open) {
			dialog?.showModal();
		} else {
			dialog?.close();
		}
	});
</script>

<dialog class="modal" bind:this={dialog} onclose={() => (open = false)}>
	<div
		class="modal-box"
		{@attach clickOutside(() => {
			if (open) open = false;
		})}
	>
		{@render children()}
	</div>
</dialog>
