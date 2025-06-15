import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	return {
		session,
	};
};

// Makes caching easier, and tbf, we don't need SSR anyways here
export const ssr = false;
