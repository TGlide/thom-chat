<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Icons from '$lib/components/icons';
	import SendIcon from '~icons/lucide/send';
	import { useConvexClient } from 'convex-svelte';
	import { useCachedQuery } from '$lib/cache/cached-query.svelte';
	import { session } from '$lib/state/session.svelte';
	import { api } from '$lib/backend/convex/_generated/api';

	const client = useConvexClient();

	const enabledModels = useCachedQuery(api.user_enabled_models.get_enabled, {
		user_id: session.current?.user.id ?? '',
	});
</script>

<div class="flex size-full place-items-center justify-center">
	<div class="flex w-full max-w-lg flex-col place-items-center gap-1">
		<form class="relative w-full">
			<div
				class="border border-input bg-background focus-within:ring-ring ring-offset-background flex flex-col rounded-lg ring-offset-2 focus-within:ring-2 md:text-sm"
			>
				<textarea class="flex-1 resize-none p-2 outline-none" placeholder="Ask me anything..."
				></textarea>
				<div class="flex place-items-center justify-between p-1">
					<div>
						<!-- place holder for model selector -->
					</div>
					<Button type="submit" size="icon" class="size-8">
						<SendIcon />
					</Button>
				</div>
			</div>
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
