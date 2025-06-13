import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = () => auth.api.getSession({ headers: event.request.headers });

	return svelteKitHandler({ event, resolve, auth });
};
