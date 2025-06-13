<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { authClient } from '$lib/backend/auth/client';

	async function signInGithub() {
		try {
			console.log('signInGithub');
			const data = await authClient.signIn.social({
				provider: 'github'
			});
			console.log('signInGithub data', data);
		} catch (e) {
			console.log('signInGithub error', e);
		}
	}
</script>

<Button onClickPromise={signInGithub}>Sign In Github</Button>
