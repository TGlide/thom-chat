import { ResultAsync } from 'neverthrow';
import type { UpdateApiKeyRequestBody, UpdateApiKeyResponse } from './+server';

export async function callApiKeys(args: UpdateApiKeyRequestBody) {
	const res = ResultAsync.fromPromise(
		fetch('/api/api-keys', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(args),
		}),
		(e) => e
	).map((r) => r.json() as Promise<UpdateApiKeyResponse>);

	return res;
}
