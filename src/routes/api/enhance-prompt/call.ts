import { ResultAsync } from 'neverthrow';
import type { EnhancePromptRequestBody, EnhancePromptResponse } from './+server';

export async function callEnhancePrompt(args: EnhancePromptRequestBody) {
	const res = ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('/api/enhance-prompt', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(args),
			});

			if (!res.ok) {
				const { message } = await res.json();

				throw new Error(message as string);
			}

			return res.json() as Promise<EnhancePromptResponse>;
		})(),
		(e) => `${e}`
	);

	return res;
}
