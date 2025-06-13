<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { authClient } from '$lib/backend/auth/client';

	async function signInGithub() {
		await authClient.signIn.social({
			provider: 'github',
			callbackURL: '/chat'
		});
	}
</script>

<Button onClickPromise={signInGithub}>Sign In Github</Button>
