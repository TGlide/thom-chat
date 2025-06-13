<script lang="ts">
	import { active } from '$lib/actions/active.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import { ArrowLeftIcon } from '@lucide/svelte';
	import { Avatar } from 'melt/components';

	let { data, children } = $props();

	const navigation: { title: string; href: string }[] = [
		{
			title: 'Account',
			href: '/account'
		},
		{
			title: 'Customization',
			href: '/account/customization'
		},
		{
			title: 'Models',
			href: '/account/models'
		},
		{
			title: 'API Keys',
			href: '/account/api-keys'
		}
	];
</script>

<div class="container mx-auto max-w-[1200px] space-y-8 pt-6 pb-24">
	<header class="flex place-items-center justify-between px-4">
		<a href="/chat" class="flex place-items-center gap-2 text-sm">
			<ArrowLeftIcon class="size-4" />
			Back to Chat
		</a>
		<div class="flex place-items-center gap-2">
			<LightSwitch variant="ghost" />
			<Button variant="ghost">Sign out</Button>
		</div>
	</header>
	<div class="px-4 md:grid md:grid-cols-[280px_1fr]">
		<div class="hidden md:col-start-1 md:block">
			<div class="flex flex-col place-items-center gap-2">
				<Avatar src={data.session.user.image}>
					{#snippet children(avatar)}
						<img {...avatar.image} alt="Your avatar" class="size-40 rounded-full" />
						<span {...avatar.fallback}>{data.session.user.name}</span>
					{/snippet}
				</Avatar>
				<div class="flex flex-col gap-1">
					<h1 class="text-center text-2xl font-bold">{data.session.user.name}</h1>
					<span class="text-muted-foreground text-center text-sm">{data.session.user.email}</span>
				</div>
			</div>
		</div>
		<div class="space-y-8 pl-12 md:col-start-2">
			<div
				class="bg-card text-muted-foreground flex w-fit place-items-center gap-2 rounded-lg p-1 text-sm"
			>
				{#each navigation as tab (tab)}
					<a
						href={tab.href}
						use:active={{ activeForSubdirectories: false }}
						class="data-[active=true]:bg-background data-[active=true]:text-foreground rounded-md px-2 py-1"
					>
						{tab.title}
					</a>
				{/each}
			</div>
			{@render children?.()}
		</div>
	</div>
</div>
