<script lang="ts" module>
	import { iterate } from '$lib/utils/array';
	import type { ButtonVariant } from '../button';

	// We can extend the generics to include form fields if needed
	type CallModalArgs<Action extends string> = {
		title: string;
		description: string;
		actions?: Record<Action, ButtonVariant>;
	};

	let modalArgs = $state(null) as null | CallModalArgs<string>;
	let resolve: (v: string | null) => void;

	export function callModal<Action extends string>(
		args: CallModalArgs<Action>
	): Promise<Action | null> {
		modalArgs = args;

		return new Promise<Action | null>((res) => {
			resolve = res as (v: string | null) => void;
		});
	}
</script>

<script lang="ts">
	import Button from '../button/button.svelte';
	import Modal from './modal.svelte';

	let open = $derived(!!modalArgs);
</script>

<Modal
	bind:open={
		() => open,
		(v) => {
			if (v) return;
			open = false;
			setTimeout(() => (modalArgs = null), 200);
			resolve?.(null);
		}
	}
>
	<h3 class="text-lg font-bold">{modalArgs?.title}</h3>
	<p class="py-4">{modalArgs?.description}</p>
	{#if modalArgs?.actions}
		<div class="modal-action">
			{#each iterate(Object.entries(modalArgs.actions)) as [[action, variant], { isFirst }] (action)}
				<form method="dialog" onsubmit={() => resolve(action)}>
					<Button
						{variant}
						type="submit"
						class="capitalize"
						{@attach (node) => {
							setTimeout(() => {
								if (isFirst) node.focus();
							}, 100);
						}}
					>
						{action}
					</Button>
				</form>
			{/each}
		</div>
	{/if}
</Modal>
