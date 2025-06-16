import { Provider } from '$lib/types';
import { type OpenRouterModel } from './open-router';

export type ProviderModelMap = {
	[Provider.OpenRouter]: OpenRouterModel;
	[Provider.HuggingFace]: never;
	[Provider.OpenAI]: never;
	[Provider.Anthropic]: never;
};
