<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { KeyIcon } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Link } from '$lib/components/ui/link';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>
			<KeyIcon class="inline size-4" /> Open Router
		</Card.Title>
		<Card.Description>API Key for OpenRouter.</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-col gap-1">
			<Input type="password" placeholder="sk-or-..." />
			<span class="text-muted-foreground text-xs">
				Get your API key from
				<Link href="https://openrouter.ai/settings/keys" target="_blank" class="text-blue-500">
					OpenRouter
				</Link>
			</span>
		</div>
		<div class="flex justify-end">
			<Button type="submit">Save</Button>
		</div>
	</Card.Content>
</Card.Root>
