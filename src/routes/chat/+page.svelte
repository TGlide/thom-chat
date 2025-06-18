<script lang="ts">
	import { session } from '$lib/state/session.svelte';
	import IconAi from '~icons/lucide/sparkles';
	import CodeIcon from '~icons/lucide/code';
	import GraduationCapIcon from '~icons/lucide/graduation-cap';
	import NewspaperIcon from '~icons/lucide/newspaper';
	import { Button } from '$lib/components/ui/button';
	import { usePrompt } from '$lib/state/prompt.svelte';
	import { scale } from 'svelte/transition';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { api } from '$lib/backend/convex/_generated/api';
	import { Provider } from '$lib/types';

	const defaultSuggestions = [
		'Give me bad medical advice, doctor.',
		'Explain why Theo hates Svelte.',
		'Write a song about losing money.',
		'Why am I such a bozo?',
	];

	const suggestionCategories: Record<string, { icon: typeof IconAi; suggestions: string[] }> = {
		Create: {
			icon: IconAi,
			suggestions: [
				'Write a short story about discovering emotions',
				'Help me outline a sci-fi novel set in a post-post-apocalyptic world',
				'Create a character profile for a complex villain with sympathetic motives',
				'Give me 5 creative writing prompts for flash fiction',
			],
		},
		Explore: {
			icon: NewspaperIcon,
			suggestions: [
				'Good books for fans of Rick Rubin',
				'Countries ranked by number of corgis',
				'Most successful companies in the world',
				'How much does Claude cost?',
			],
		},
		Code: {
			icon: CodeIcon,
			suggestions: [
				'Write code to invert a binary search tree in Python',
				"What's the difference between Promise.all and Promise.allSettled?",
				"Explain React's useEffect cleanup function",
				'Best practices for error handling in async/await',
			],
		},
		Learn: {
			icon: GraduationCapIcon,
			suggestions: [
				"Beginner's guide to TypeScript",
				'Explain the CAP theorem in distributed systems',
				'Why is AI so expensive?',
				'Are black holes real?',
			],
		},
	};

	let selectedCategory = $state<string | null>(null);

	const openRouterKeyQuery = useCachedQuery(api.user_keys.get, {
		provider: Provider.OpenRouter,
		session_token: session.current?.session.token ?? '',
	});

	const prompt = usePrompt();
</script>

<div class="flex h-svh flex-col items-center justify-center">
	{#if prompt.current.length === 0 && openRouterKeyQuery.data}
		<div class="w-full p-2" in:scale={{ duration: 500, start: 0.9 }}>
			<h2 class="text-left font-serif text-3xl font-semibold">Hey there, Bozo!</h2>
			<p class="mt-2 text-left text-lg">
				{#if session.current?.user.name}
					Oops, I meant {session.current?.user.name}.
				{:else}
					Be sure to login first.
				{/if}
			</p>
			<div class="mt-4 flex flex-wrap items-center gap-1">
				{#each Object.entries(suggestionCategories) as [category, opts] (category)}
					<button
						type="button"
						class="data-[active=true]:bg-primary focus-visible:border-ring focus-visible:ring-ring/50 bg-muted relative inline-flex h-9 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap outline-hidden transition-all select-none hover:cursor-pointer focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 has-[>svg]:px-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
						data-active={selectedCategory === category}
						onclick={() => {
							if (selectedCategory === category) {
								selectedCategory = null;
							} else {
								selectedCategory = category;
							}
						}}
					>
						<opts.icon />
						{category}
					</button>
				{/each}
			</div>

			<div class="mt-2 flex flex-col gap-2 p-2">
				{#if selectedCategory && suggestionCategories[selectedCategory]}
					{#each suggestionCategories[selectedCategory]?.suggestions ?? [] as suggestion (suggestion)}
						<div class="border-border not-last:border-b not-last:pb-2">
							<Button
								onclick={() => (prompt.current = suggestion)}
								variant="ghost"
								class="w-full cursor-pointer justify-start px-2 py-2 text-start"
							>
								{suggestion}
							</Button>
						</div>
					{/each}
				{:else}
					{#each defaultSuggestions as suggestion}
						<div class="border-border group not-last:border-b not-last:pb-2">
							<Button
								onclick={() => (prompt.current = suggestion)}
								variant="ghost"
								class="w-full cursor-pointer justify-start px-2 py-2 text-start group-last:line-through"
							>
								{suggestion}
							</Button>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else if !openRouterKeyQuery.data}
		<div class="w-full p-2" in:scale={{ duration: 500, start: 0.9 }}>
			<h2 class="text-left font-serif text-3xl font-semibold">
				Hey there, {session.current?.user.name}!
			</h2>
			<p class="mt-2 text-left text-lg">
				You need to provide a key to start sending messages.
				<a href="/account/api-keys" class="text-primary"> Go to settings </a>
			</p>
		</div>
	{/if}
</div>
