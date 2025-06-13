<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { data, children } = $props();

	$inspect(data.session);
</script>

<ModeWatcher />
{@render children()}
