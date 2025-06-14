import { getOpenRouterModels, type OpenRouterModel } from '$lib/backend/models/open-router';

export async function load() {
	return {
		openRouterModels: (await getOpenRouterModels()).unwrapOr([] as OpenRouterModel[]),
	};
}
