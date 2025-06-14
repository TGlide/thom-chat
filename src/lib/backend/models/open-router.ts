import { ResultAsync } from 'neverthrow';

export interface OpenRouterModel {
	id: string;
	name: string;
	created: number;
	description: string;
	architecture: OpenRouterArchitecture;
	top_provider: OpenRouterTopProvider;
	pricing: OpenRouterPricing;
	context_length: number;
	hugging_face_id: string;
	per_request_limits: Record<string, string>;
	supported_parameters: string[];
}

interface OpenRouterArchitecture {
	input_modalities: string[];
	output_modalities: string[];
	tokenizer: string;
}

interface OpenRouterTopProvider {
	is_moderated: boolean;
}

interface OpenRouterPricing {
	prompt: string;
	completion: string;
	image: string;
	request: string;
	input_cache_read: string;
	input_cache_write: string;
	web_search: string;
	internal_reasoning: string;
}

export function getOpenRouterModels() {
	return ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('https://openrouter.ai/api/v1/models');

            const { data } = await res.json()

			return data as OpenRouterModel[];
		})(),
		() => '[open-router] Failed to fetch models'
	);
}
