import { getOpenRouterModels, type OpenRouterModel } from '$lib/backend/models/open-router';
import { Provider } from '$lib/types';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [session, openRouterModels] = await Promise.all([locals.auth(), getOpenRouterModels()]);

	return {
		session,
		models: {
			[Provider.OpenRouter]: openRouterModels.unwrapOr([] as OpenRouterModel[]),
		},
	};
};

// Makes caching easier, and tbf, we don't need SSR anyways here
export const ssr = false;
