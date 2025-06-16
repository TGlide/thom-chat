import { ResultAsync } from 'neverthrow';
import type { GenerateMessageRequestBody, GenerateMessageResponse } from './+server';

export async function callGenerateMessage(args: GenerateMessageRequestBody) {
	const res = ResultAsync.fromPromise(
		fetch('/api/generate-message', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(args),
		}),
		(e) => e
	).map((r) => r.json() as Promise<GenerateMessageResponse>);

	return res;
}
