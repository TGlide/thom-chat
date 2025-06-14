import { getOpenRouterModels, type OpenRouterModel } from '$lib/backend/models/open-router';

export async function load() {
	const [openRouterModels] = await Promise.all([getOpenRouterModels()]);

	return {
		openRouterModels: openRouterModels.unwrapOr([] as OpenRouterModel[]),
	};
}
