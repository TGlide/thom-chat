import { redirectToLogin } from '$lib/backend/auth/redirect.js';

export async function load({ locals, url }) {
	const session = await locals.auth();

	if (!session) redirectToLogin(url);

	return {
		session,
	};
}
