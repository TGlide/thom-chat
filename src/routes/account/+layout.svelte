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
	import { useCachedQuery } from '$lib/cache/cached-query.svelte.js';
	import { session } from '$lib/state/session.svelte.js';
	import { api } from '$lib/backend/convex/_generated/api.js';
	import { cn } from '$lib/utils/utils.js';
	import { useLastChat } from '$lib/state/last-chat.svelte.js';

	let { data, children } = $props();

	const settings = useCachedQuery(api.user_settings.get, {
		session_token: session.current?.session.token ?? '',
	});

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

	type Shortcut = {
		name: string;
		keys: string[];
	};

	const shortcuts: Shortcut[] = [
		{
			name: 'Toggle Sidebar',
			keys: [cmdOrCtrl, 'B'],
		},
		{
			name: 'New Chat',
			keys: [cmdOrCtrl, 'Shift', 'O'],
		},
		{
			name: 'Search Messages',
			keys: [cmdOrCtrl, 'K'],
		},
		{
			name: 'Scroll to bottom',
			keys: [cmdOrCtrl, 'D'],
		},
		{
			name: 'Open Model Picker',
			keys: [cmdOrCtrl, 'Shift', 'M'],
		},
	];

	async function signOut() {
		await authClient.signOut();

		await goto('/login');
	}

	const lastChat = useLastChat();

	const backToChat = $derived(lastChat.current ? `/chat/${lastChat.current}` : '/chat');
</script>

<div class="container mx-auto max-w-[1200px] space-y-8 pt-6 pb-24">
	<header class="flex place-items-center justify-between px-4">
		<Button href={backToChat} variant="ghost" class="flex place-items-center gap-2 text-sm">
			<ArrowLeftIcon class="size-4" />
			Back to Chat
		</Button>
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
						<img
							{...avatar.image}
							alt="Your avatar"
							class={cn('size-40 rounded-full', {
								'blur-[20px]': settings.data?.privacy_mode,
							})}
						/>
						<span {...avatar.fallback}>
							{data.session.user.name
								.split(' ')
								.map((i) => i[0]?.toUpperCase())
								.join('')}
						</span>
					{/snippet}
				</Avatar>
				<div class="flex flex-col gap-1">
					<p
						class={cn('text-center text-2xl font-bold', {
							'blur-[6px]': settings.data?.privacy_mode,
						})}
					>
						{data.session.user.name}
					</p>
					<span
						class={cn('text-muted-foreground text-center text-sm', {
							'blur-[6px]': settings.data?.privacy_mode,
						})}
					>
						{data.session.user.email}
					</span>
				</div>
				<div class="mt-4 flex w-full flex-col gap-2">
					<span class="text-sm font-medium">Keyboard Shortcuts</span>
					<div class="flex flex-col gap-1">
						{#each shortcuts as { name, keys } (name)}
							<div class="flex place-items-center justify-between">
								<span class="text-muted-foreground text-sm">{name}</span>

								<div class="flex place-items-center gap-1">
									{#each keys as key (key)}
										<Kbd>{key}</Kbd>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
		<div class="md:col-start-2 md:pl-12">
			<div
				class="bg-accent scrollbar-hide text-muted-foreground flex w-fit max-w-full place-items-center gap-2 overflow-x-auto rounded-lg p-1 text-sm"
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
