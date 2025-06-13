<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { PanelLeftIcon } from '@lucide/svelte';
</script>

<Sidebar.Root>
	<Sidebar.Sidebar>
		<div class="py-2 flex place-items-center justify-center">
			<span class="text-lg text-center font-bold">Thom Chat</span>
		</div>
	</Sidebar.Sidebar>
	<Sidebar.Inset>
		<Sidebar.Trigger class="fixed top-1 left-2">
			<PanelLeftIcon />
		</Sidebar.Trigger>
	</Sidebar.Inset>
</Sidebar.Root>
