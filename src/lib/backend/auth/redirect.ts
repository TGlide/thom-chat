import { redirect } from '@sveltejs/kit';

const PARAM_NAME = 'redirect_to';

/** Redirect back to login and add provided url to the redirect_to parameter
 *
 * @param url
 */
export function redirectToLogin(url: URL): never {
	const path = url.pathname;

	const location = `/login?${PARAM_NAME}=${path}`;

	redirect(303, location);
}

/** Redirect back to an authorized route either using the redirect_to parameter or the fallback if not provided
 *
 * @param url
 * @param fallback
 */
export function redirectToAuthorized(url: URL, fallback = '/account'): never {
	const to = getRedirectTo(url) ?? fallback;

	redirect(303, to);
}

export function getRedirectTo(url: URL): string | null {
	return url.searchParams.get(PARAM_NAME);
}
