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
	<div class="modal-body" {@attach clickOutside(() => (open = false))}>
		<h3 class="text-lg font-bold">Hello!</h3>
		<p class="py-4">Press ESC key or click the button below to close</p>
		{@render children()}
		<div class="modal-action">
			<form method="dialog">
				<!-- if there is a button in form, it will close the modal -->
				<button class="btn">Close</button>
			</form>
		</div>
	</div>
</dialog>
