<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import PlusIcon from '~icons/lucide/plus';
	import { Collapsible } from 'melt/builders';
	import { slide } from 'svelte/transition';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import XIcon from '~icons/lucide/x';
	import { useConvexClient } from 'convex-svelte';
	import { session } from '$lib/state/session.svelte';
	import { useCachedQuery, type QueryResult } from '$lib/cache/cached-query.svelte';
	import type { Doc } from '$lib/backend/convex/_generated/dataModel';
	import { Input } from '$lib/components/ui/input';
	import { api } from '$lib/backend/convex/_generated/api';
	import Rule from './rule.svelte';

	const client = useConvexClient();

	const newRuleCollapsible = new Collapsible({
		open: false,
	});

	let creatingRule = $state(false);

	const userRulesQuery: QueryResult<Doc<'user_rules'>[]> = useCachedQuery(api.user_rules.all, {
		session_token: session.current?.session.token ?? '',
	});

	async function submitNewRule(e: SubmitEvent) {
		e.preventDefault();
		const formData = new FormData(e.target as HTMLFormElement);
		const attach = formData.get('attach') as 'always' | 'manual';
		const rule = formData.get('rule') as string;

		if (rule === '' || !rule || ruleNameExists) return;

		creatingRule = true;

		await client.mutation(api.user_rules.create, {
			name,
			attach,
			rule,
			session_token: session.current?.session.token ?? '',
		});

		newRuleCollapsible.open = false;
		name = '';

		creatingRule = false;
	}

	let name = $state('');

	const ruleNameExists = $derived(userRulesQuery.data?.findIndex((r) => r.name === name) !== -1);
</script>

<svelte:head>
	<title>Customization | Thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Customization</h1>
<h2 class="text-muted-foreground mt-2 text-sm">Customize your experience with thom.chat.</h2>

<div class="mt-8 flex flex-col gap-4">
	<div class="flex place-items-center justify-between">
		<h3 class="text-xl font-bold">Rules</h3>
		<Button
			{...newRuleCollapsible.trigger}
			variant={newRuleCollapsible.open ? 'outline' : 'default'}
		>
			{#if newRuleCollapsible.open}
				<XIcon class="size-4" />
			{:else}
				<PlusIcon class="size-4" />
			{/if}
			{newRuleCollapsible.open ? 'Cancel' : 'New Rule'}
		</Button>
	</div>
	{#if newRuleCollapsible.open}
		<div
			{...newRuleCollapsible.content}
			in:slide={{ duration: 150, axis: 'y' }}
			out:slide={{ duration: 150, axis: 'y' }}
			class="bg-card flex flex-col gap-4 rounded-lg border p-4"
		>
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold">New Rule</h3>
				<p class="text-muted-foreground text-sm">
					Create a new rule to customize the behavior of your AI.
				</p>
			</div>
			<form onsubmit={submitNewRule} class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="name">Name (Used when referencing the rule)</Label>
					<Input
						id="name"
						name="name"
						placeholder="My Rule"
						required
						bind:value={name}
						aria-invalid={ruleNameExists}
					/>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="attach">Rule Type</Label>
					<select
						id="attach"
						name="attach"
						class="border-input bg-background h-9 w-fit rounded-md border px-2 pr-6 text-sm"
						required
					>
						<option value="always">Always</option>
						<option value="manual">Manual</option>
					</select>
				</div>
				<div class="flex flex-col gap-2">
					<Label for="rule">Instructions</Label>
					<Textarea id="rule" name="rule" placeholder="How should the AI respond?" required />
				</div>
				<div class="flex justify-end">
					<Button loading={creatingRule} type="submit">Create Rule</Button>
				</div>
			</form>
		</div>
	{/if}
	{#each userRulesQuery.data ?? [] as rule (rule._id)}
		<Rule {rule} allRules={userRulesQuery.data ?? []} />
	{/each}
</div>
