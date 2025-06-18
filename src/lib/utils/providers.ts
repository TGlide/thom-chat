import { Result, ResultAsync } from 'neverthrow';

export type OpenRouterApiKeyData = {
	label: string;
	usage: number;
	is_free_tier: boolean;
	is_provisioning_key: boolean;
	limit: number;
	limit_remaining: number;
};

export const OpenRouter = {
	getApiKey: async (key: string): Promise<Result<OpenRouterApiKeyData, string>> => {
		return await ResultAsync.fromPromise(
			(async () => {
				const res = await fetch('https://openrouter.ai/api/v1/key', {
					headers: {
						Authorization: `Bearer ${key}`,
						'Content-Type': 'application/json',
					},
				});

				if (!res.ok) throw new Error('Failed to get API key');

				const { data } = await res.json();

				if (!data) throw new Error('No info returned for api key');

				return data as OpenRouterApiKeyData;
			})(),
			(e) => `Failed to get API key ${e}`
		);
	},
};
