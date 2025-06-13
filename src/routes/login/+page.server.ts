import { redirectToAuthorized } from '$lib/backend/auth/redirect';

export async function load({ locals, url }) {
	const session = await locals.auth();

	if (session) redirectToAuthorized(url);

	return {};
}
