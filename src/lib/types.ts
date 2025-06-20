import { z } from 'zod';

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

export const UrlCitationSchema = z.object({
	type: z.literal('url_citation'),
	url_citation: z.object({
		end_index: z.number(),
		start_index: z.number(),
		title: z.string(),
		url: z.string(),
		content: z.string(),
	}),
});

export type UrlCitation = z.infer<typeof UrlCitationSchema>;

// if there are more types do this
// export const AnnotationSchema = z.union([UrlCitationSchema, ...]);
export const AnnotationSchema = UrlCitationSchema;
export type Annotation = z.infer<typeof AnnotationSchema>;
