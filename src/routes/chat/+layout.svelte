<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { PanelLeftIcon } from '@lucide/svelte';
	import { Avatar } from 'melt/components';
	import * as Icons from '$lib/components/icons';
	import { SendIcon } from '@lucide/svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<title>Chat | Thom.chat</title>
</svelte:head>

<Sidebar.Root>
	<Sidebar.Sidebar class="flex flex-col p-2">
		<div class="flex place-items-center justify-center py-2">
			<span class="text-center text-lg font-bold">Thom Chat</span>
		</div>
		<Button href="/chat" class="w-full">New Chat</Button>
		<div class="flex flex-1 flex-col overflow-y-auto">
			<!-- chats -->
		</div>
		<div class="py-2">
			{#if data.session !== null}
				<Button href="/account/api-keys" variant="ghost" class="h-auto w-full justify-start">
					<Avatar src={data.session.user.image ?? undefined}>
						{#snippet children(avatar)}
							<img {...avatar.image} alt="Your avatar" class="size-10 rounded-full" />
							<span {...avatar.fallback}
								>{data.session?.user.name
									.split(' ')
									.map((name) => name[0].toUpperCase())
									.join('')}</span
							>
						{/snippet}
					</Avatar>
					<div class="flex flex-col">
						<span class="text-sm">{data.session?.user.name}</span>
						<span class="text-muted-foreground text-xs">{data.session?.user.email}</span>
					</div>
				</Button>
			{:else}
				<Button href="/login" class="w-full">Login</Button>
			{/if}
		</div>
	</Sidebar.Sidebar>

	<Sidebar.Inset>
		<Sidebar.Trigger class="fixed top-3 left-2">
			<PanelLeftIcon />
		</Sidebar.Trigger>
		<div class="flex size-full place-items-center justify-center">
			<div class="flex w-full max-w-lg flex-col place-items-center gap-1">
				<form class="relative h-18 w-full">
					<textarea
						class="border-input bg-background ring-ring ring-offset-background h-full w-full resize-none rounded-lg border p-2 text-sm ring-offset-2 outline-none focus-visible:ring-2"
						placeholder="Ask me anything..."
					></textarea>
					<Button type="submit" size="icon" class="absolute right-1 bottom-1 size-8">
						<SendIcon />
					</Button>
				</form>
				<div class="flex w-full place-items-center justify-between gap-2">
					<span class="text-muted-foreground text-xs">
						Crafted by <Icons.Svelte class="inline size-3" /> wizards.
					</span>
					<a href="https://github.com/TGlide/thom-chat" class="text-muted-foreground text-xs">
						Source on <Icons.GitHub class="ml-0.5 inline size-3" />
					</a>
				</div>
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Root>
