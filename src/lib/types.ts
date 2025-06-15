export const Provider = {
	OpenRouter: 'openrouter',
	HuggingFace: 'huggingface',
	OpenAI: 'openai',
	Anthropic: 'anthropic',
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];

export type ProviderMeta = {
	title: string;
	link: string;
	description: string;
	models?: string[];
	placeholder?: string;
};
