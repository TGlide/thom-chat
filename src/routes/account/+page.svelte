<script lang="ts">
	import { api } from '$lib/backend/convex/_generated/api';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import { ResultAsync } from 'neverthrow';
	import { useConvexClient } from 'convex-svelte';
	import { Switch } from '$lib/components/ui/switch';

	const client = useConvexClient();

	const settings = useCachedQuery(api.user_settings.get, {
		session_token: session.current?.session.token ?? '',
	});

	let privacyMode = $derived(settings.data?.privacy_mode ?? false);

	async function toggleEnabled(v: boolean) {
		privacyMode = v; // Optimistic!
		if (!session.current?.user.id) return;

		const res = await ResultAsync.fromPromise(
			client.mutation(api.user_settings.set, {
				privacy_mode: v,
				session_token: session.current?.session.token,
			}),
			(e) => e
		);

		if (res.isErr()) privacyMode = !v; // Should have been a realist :(
	}
</script>

<svelte:head>
	<title>Account | Thom.chat</title>
</svelte:head>

<h1 class="text-2xl font-bold">Account Settings</h1>
<h2 class="text-muted-foreground mt-2 text-sm">Configure the settings for your account.</h2>

<div class="mt-4 flex flex-col gap-2">
	<div class="flex place-items-center justify-between">
		<span>Hide Personal Information</span>
		<Switch bind:value={() => privacyMode, toggleEnabled} />
	</div>
</div>
