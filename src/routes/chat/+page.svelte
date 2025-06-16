<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Icons from '$lib/components/icons';
	import SendIcon from '~icons/lucide/send';
</script>

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
