import { auth } from '$lib/auth';
import type { Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	event.locals.auth = () => auth.api.getSession({ headers: event.request.headers }) as any;

	return svelteKitHandler({ event, resolve, auth });
};
