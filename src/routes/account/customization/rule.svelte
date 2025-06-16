<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import type { Doc } from '$lib/backend/convex/_generated/dataModel';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { session } from '$lib/state/session.svelte';
	import { LocalToasts } from '$lib/builders/local-toasts.svelte';
	import { ResultAsync } from 'neverthrow';

	type Props = {
		rule: Doc<'user_rules'>;
	};

	const id = $props.id();

	let { rule }: Props = $props();

	const client = useConvexClient();

	let updating = $state(false);

	const toasts = new LocalToasts({ id });

	async function updateRule(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const attach = formData.get('attach') as 'always' | 'manual';
		const ruleText = formData.get('rule') as string;

		if (ruleText === '' || !ruleText) return;

		updating = true;

		const res = await ResultAsync.fromPromise(
			client.mutation(api.user_rules.update, {
				ruleId: rule._id,
				attach,
				rule: ruleText,
				sessionToken: session.current?.session.token ?? '',
			}),
			(e) => e
		);

		toasts.addToast({
			data: {
				content: res.isOk() ? 'Saved' : 'Failed to save',
				variant: res.isOk() ? 'info' : 'danger',
			},
		});

		updating = false;
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{rule.name}</Card.Title>
	</Card.Header>
	<Card.Content tag="form" onsubmit={updateRule}>
		<div class="flex flex-col gap-2">
			<Label for="attach">Attach</Label>
			<select
				id="attach"
				name="attach"
				value={rule.attach}
				class="border-input bg-background h-9 w-fit rounded-md border px-2 pr-6 text-sm"
				required
			>
				<option value="always">Always</option>
				<option value="manual">Manual</option>
			</select>
		</div>
		<div class="flex flex-col gap-2">
			<Label for="rule">Instructions</Label>
			<Textarea
				id="rule"
				value={rule.rule}
				name="rule"
				placeholder="How should the AI respond?"
				required
			/>
		</div>
		<div class="flex justify-end">
			<Button loading={updating} {...toasts.trigger} type="submit">Save</Button>
		</div>
	</Card.Content>
</Card.Root>

{#each toasts.toasts as toast (toast)}
	<div {...toast.attrs} class={toast.class}>
		{toast.data.content}
	</div>
{/each}
