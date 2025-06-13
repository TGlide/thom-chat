export const Provider = {
	OpenRouter: 'openrouter',
	HuggingFace: 'huggingface',
	OpenAI: 'openai',
	Anthropic: 'anthropic'
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];
