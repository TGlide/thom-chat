import { ResultAsync } from 'neverthrow';
import type { GenerateMessageRequestBody, GenerateMessageResponse } from './+server';

export async function callGenerateMessage(args: GenerateMessageRequestBody) {
	const res = ResultAsync.fromPromise(
		(async () => {
			const res = await fetch('/api/generate-message', {
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

			return res.json() as Promise<GenerateMessageResponse>;
		})(),
		(e) => `${e}`
	);

	return res;
}
