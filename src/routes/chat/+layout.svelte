<script lang="ts">
	import * as Icons from '$lib/components/icons';
	import { Button } from '$lib/components/ui/button';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { session } from '$lib/state/session.svelte.js';
	import { settings } from '$lib/state/settings.svelte.js';
	import { isString } from '$lib/utils/is.js';
	import { Avatar } from 'melt/components';
	import PanelLeftIcon from '~icons/lucide/panel-left';
	import PinIcon from '~icons/lucide/pin';
	import XIcon from '~icons/lucide/x';
	import SendIcon from '~icons/lucide/send';
	import { callGenerateMessage } from '../api/generate-message/call.js';
	import ModelPicker from './model-picker.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte.js';
	import { api } from '$lib/backend/convex/_generated/api.js';
	import { TextareaAutosize } from '$lib/spells/textarea-autosize.svelte.js';
	import Tooltip from '$lib/components/ui/tooltip.svelte';

	let { data, children } = $props();

	let form = $state<HTMLFormElement>();
	let textarea = $state<HTMLTextAreaElement>();
	async function handleSubmit() {
		const formData = new FormData(form);
		const message = formData.get('message');

		// TODO: Re-use zod here from server endpoint for better error messages?
		if (!isString(message) || !session.current?.user.id || !settings.modelId) return;

		if (textarea) textarea.value = '';
		const res = await callGenerateMessage({
			message,
			session_token: session.current?.session.token,
			conversation_id: page.params.id ?? undefined,
			model_id: settings.modelId,
		});
		if (res.isErr()) return; // TODO: Handle error

		const cid = res.value.conversation_id;

		if (page.params.id !== cid) {
			goto(`/chat/${cid}`);
		}
	}

	const conversationsQuery = useCachedQuery(api.conversations.get, {
		session_token: session.current?.session.token ?? '',
	});

	const _autosize = new TextareaAutosize();
</script>

<svelte:head>
	<title>Chat | Thom.chat</title>
</svelte:head>

<Sidebar.Root>
	<Sidebar.Sidebar class="flex flex-col p-2">
		<div class="flex place-items-center justify-center py-2">
			<span class="text-center font-serif text-lg">Thom.chat</span>
		</div>
		<div class="mt-1 flex w-full px-2">
			<a
				href="/chat"
				class="border-reflect button-reflect bg-primary/20 hover:bg-primary/50 font-fake-proxima w-full rounded-lg px-4 py-2 text-center text-sm tracking-[-0.005em] duration-200"
				style="font-variation-settings: 'wght' 750"
			>
				New Chat
			</a>
		</div>
		<div class="flex flex-1 flex-col overflow-y-auto py-2">
			{#each conversationsQuery.data ?? [] as conversation (conversation._id)}
				<a
					href={`/chat/${conversation._id}`}
					class="group relative overflow-clip py-0.5 pr-2.5 text-left text-sm"
				>
					<p class="group-hover:bg-sidebar-accent rounded-md py-1.5 pl-3">
						{conversation.title}
					</p>
					<div
						class=" to-sidebar-accent pointer-events-none absolute inset-y-0 right-0 flex translate-x-full items-center gap-2 rounded-r-lg bg-gradient-to-r from-transparent pr-2 transition group-hover:pointer-events-auto group-hover:translate-0"
					>
						<Tooltip>
							{#snippet trigger(tooltip)}
								<button {...tooltip.trigger} class="hover:bg-muted rounded-md p-1">
									<PinIcon class="size-4" />
								</button>
							{/snippet}
							Pin thread
						</Tooltip>
						<Tooltip>
							{#snippet trigger(tooltip)}
								<button {...tooltip.trigger} class="hover:bg-muted rounded-md p-1">
									<XIcon class="size-4" />
								</button>
							{/snippet}
							Delete thread
						</Tooltip>
					</div>
				</a>
			{/each}
		</div>
		<div class="py-2">
			{#if data.session !== null}
				<Button href="/account/api-keys" variant="ghost" class="h-auto w-full justify-start">
					<Avatar src={data.session?.user.image ?? undefined}>
						{#snippet children(avatar)}
							<img {...avatar.image} alt="Your avatar" class="size-10 rounded-full" />
							<span {...avatar.fallback} class="size-10 rounded-full">
								{data.session?.user.name
									.split(' ')
									.map((name) => name[0]?.toUpperCase())
									.join('')}
							</span>
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
		<div class="mx-auto flex size-full min-h-svh max-w-3xl flex-col">
			{@render children()}
			<div class="mt-auto flex w-full flex-col gap-1">
				<ModelPicker class=" w-min " />
				<div class="h-2" aria-hidden="true"></div>
				<form
					class="relative h-18 w-full"
					onsubmit={(e) => {
						e.preventDefault();
						handleSubmit();
					}}
					bind:this={form}
				>
					<!-- TODO: Figure out better autofocus solution -->
					<!-- svelte-ignore a11y_autofocus -->
					<textarea
						bind:this={textarea}
						class="border-input bg-background ring-ring ring-offset-background h-full w-full resize-none rounded-lg border p-2 text-sm ring-offset-2 outline-none focus-visible:ring-2"
						placeholder="Ask me anything..."
						name="message"
						onkeydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								handleSubmit();
							}
						}}
						autofocus
						autocomplete="off"
					></textarea>
					<Button type="submit" size="icon" class="absolute right-1 bottom-1 size-8">
						<SendIcon />
					</Button>
				</form>
				<div class="flex w-full place-items-center justify-between gap-2 pb-1">
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
