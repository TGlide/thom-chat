import type { OpenRouterModel } from '$lib/backend/models/open-router';

export function supportsImages(model: OpenRouterModel): boolean {
	return model.architecture.input_modalities.includes('image');
}

export function supportsReasoning(model: OpenRouterModel): boolean {
	return model.supported_parameters.includes('reasoning');
}

export function getImageSupportedModels(models: OpenRouterModel[]): OpenRouterModel[] {
	return models.filter(supportsImages);
}
