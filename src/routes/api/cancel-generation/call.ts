import { ResultAsync } from 'neverthrow';
import type { CancelGenerationRequestBody, CancelGenerationResponse } from './+server';

export async function callCancelGeneration(args: CancelGenerationRequestBody) {
	const res = ResultAsync.fromPromise(
		fetch('/api/cancel-generation', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(args),
		}),
		(e) => e
	).map((r) => r.json() as Promise<CancelGenerationResponse>);

	return res;
}