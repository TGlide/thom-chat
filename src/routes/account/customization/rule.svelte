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
	import TrashIcon from '~icons/lucide/trash';
	import { callModal } from '$lib/components/ui/modal/global-modal.svelte';
	import { Input } from '$lib/components/ui/input';

	type Props = {
		rule: Doc<'user_rules'>;
		allRules: Doc<'user_rules'>[];
	};

	const id = $props.id();

	let { rule, allRules }: Props = $props();

	const client = useConvexClient();

	let updating = $state(false);
	let deleting = $state(false);

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
				session_token: session.current?.session.token ?? '',
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

	async function deleteRule() {
		const action = await callModal({
			title: 'Delete Rule',
			description: 'Are you sure you want to delete this rule?',
			actions: {
				delete: 'destructive',
			},
		});
		if (action !== 'delete') return;

		deleting = true;

		await client.mutation(api.user_rules.remove, {
			ruleId: rule._id,
			session_token: session.current?.session.token ?? '',
		});

		deleting = false;
	}

	let ruleName = $derived(rule.name);

	let renaming = $state(false);

	async function renameRule() {
		renaming = true;

		await ResultAsync.fromPromise(
			client.mutation(api.user_rules.rename, {
				ruleId: rule._id,
				name: ruleName,
				session_token: session.current?.session.token ?? '',
			}),
			(e) => e
		);

		renaming = false;
	}

	const ruleNameExists = $derived.by(() => {
		for (const r of allRules) {
			if (r._id === rule._id) continue;
			if (r.name === ruleName) return true;
		}

		return false;
	});
</script>

<Card.Root>
	<Card.Header>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Input bind:value={ruleName} aria-invalid={ruleNameExists} />
				<Button
					variant="outline"
					onClickPromise={renameRule}
					disabled={ruleNameExists || ruleName === rule.name}
				>
					Rename
				</Button>
			</div>
			<Button variant="destructive" size="icon" onclick={deleteRule} disabled={deleting}>
				<TrashIcon class="size-4" />
				<span class="sr-only">Delete Rule</span>
			</Button>
		</div>
	</Card.Header>
	<Card.Content tag="form" onsubmit={updateRule}>
		<div class="flex flex-col gap-2">
			<Label for="attach">Rule Type</Label>
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
