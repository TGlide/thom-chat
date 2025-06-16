<script lang="ts">
	import { goto } from '$app/navigation';
	import { active } from '$lib/actions/active.svelte';
	import { authClient } from '$lib/backend/auth/client.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import ArrowLeftIcon from '~icons/lucide/arrow-left';
	import { Avatar } from 'melt/components';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { cmdOrCtrl } from '$lib/hooks/is-mac.svelte.js';

	let { data, children } = $props();

	const navigation: { title: string; href: string }[] = [
		{
			title: 'Account',
			href: '/account',
		},
		{
			title: 'Customization',
			href: '/account/customization',
		},
		{
			title: 'Models',
			href: '/account/models',
		},
		{
			title: 'API Keys',
			href: '/account/api-keys',
		},
	];

	async function signOut() {
		await authClient.signOut();

		await goto('/login');
	}
</script>

<div class="container mx-auto max-w-[1200px] space-y-8 pt-6 pb-24">
	<header class="flex place-items-center justify-between px-4">
		<a href="/chat" class="flex place-items-center gap-2 text-sm">
			<ArrowLeftIcon class="size-4" />
			Back to Chat
		</a>
		<div class="flex place-items-center gap-2">
			<LightSwitch variant="ghost" />
			<Button variant="ghost" onClickPromise={signOut}>Sign out</Button>
		</div>
	</header>
	<div class="px-4 md:grid md:grid-cols-[255px_1fr]">
		<div class="hidden md:col-start-1 md:block">
			<div class="flex flex-col place-items-center gap-2">
				<Avatar src={data.session.user.image ?? undefined}>
					{#snippet children(avatar)}
						<img {...avatar.image} alt="Your avatar" class="size-40 rounded-full" />
						<span {...avatar.fallback}>
							{data.session.user.name
								.split(' ')
								.map((i) => i[0]?.toUpperCase())
								.join('')}
						</span>
					{/snippet}
				</Avatar>
				<div class="flex flex-col gap-1">
					<p class="text-center text-2xl font-bold">{data.session.user.name}</p>
					<span class="text-muted-foreground text-center text-sm">{data.session.user.email}</span>
				</div>
				<div class="mt-4 flex w-full flex-col gap-2">
					<span class="text-sm font-medium">Keyboard Shortcuts</span>
					<div class="flex flex-col gap-1">
						<div class="flex place-items-center justify-between">
							<span class="text-muted-foreground text-sm">Toggle Sidebar </span>

							<div>
								<Kbd>{cmdOrCtrl}</Kbd>
								<Kbd>B</Kbd>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="md:col-start-2 md:pl-12">
			<div
				class="bg-card scrollbar-hide text-muted-foreground flex w-fit max-w-full place-items-center gap-2 overflow-x-auto rounded-lg p-1 text-sm"
			>
				{#each navigation as tab (tab)}
					<a
						href={tab.href}
						use:active={{ activeForSubdirectories: false }}
						class="data-[active=true]:bg-background data-[active=true]:text-foreground rounded-md px-2 py-1 text-nowrap"
					>
						{tab.title}
					</a>
				{/each}
			</div>
			<div class="pt-8">
				{@render children?.()}
			</div>
		</div>
	</div>
</div>
