<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Search from '~icons/lucide/search';

	let { value = $bindable(''), ...rest }: HTMLInputAttributes = $props();
</script>

<div
	class="border-input focus-within:ring-ring ring-offset-background relative flex h-9 items-center rounded-md border p-2 text-base ring-offset-2 focus-within:ring-2 md:text-sm"
>
	<Search class="text-muted-foreground size-4" />
	<input {...rest} bind:value type="text" class="flex-1 bg-transparent px-2 outline-none" />
</div>
