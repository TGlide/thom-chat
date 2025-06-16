<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { session } from '$lib/state/session.svelte';
	import IconAi from '~icons/lucide/sparkles';
</script>

<div class="flex h-full flex-1 flex-col items-center justify-center">
	<div class="w-full p-2">
		<h2 class="text-left font-serif text-3xl font-semibold">Hey there, Bozo!</h2>
		<p class="mt-2 text-left text-lg">
			{#if session.current?.user.name}
				Oops, I meant {session.current?.user.name}.
			{:else}
				Be sure to login first.
			{/if}
		</p>
		<div class="mt-4 flex items-center gap-1">
			{#each { length: 4 }}
				<Button variant="outline" class="rounded-full">
					<IconAi />
					Create
				</Button>
			{/each}
		</div>

		<ul class="mt-2 flex flex-col gap-2 p-2">
			{#each { length: 3 } as _, i (i)}
				<li class={['py-2', i !== 2 && 'border-b']}>Hey AI, write me a poem</li>
			{/each}
		</ul>
	</div>
</div>
