import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import { Provider } from '$lib/types';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { ResultAsync } from 'neverthrow';
import { z } from 'zod/v4';
import { CryptoService } from '$lib/utils/encrypt.js';
import { API_KEY_ENCRYPTION_SECRET } from '$env/static/private';

// Set to true to enable debug logging
const ENABLE_LOGGING = true;

const reqBodySchema = z.object({
	key: z.string(),
	provider: z.union(Object.values(Provider).map((p) => z.literal(p))),
});

export type UpdateApiKeyRequestBody = z.infer<typeof reqBodySchema>;

export type UpdateApiKeyResponse = {
	ok: true;
	key: string;
};

function response(res: UpdateApiKeyResponse) {
	return json(res);
}

function log(message: string, startTime: number): void {
	if (!ENABLE_LOGGING) return;
	const elapsed = Date.now() - startTime;
	console.log(`[ApiKeys] ${message} (${elapsed}ms)`);
}

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

export const POST: RequestHandler = async ({ request, locals }) => {
	const startTime = Date.now();
	log('Starting message generation request', startTime);

	const bodyResult = await ResultAsync.fromPromise(
		request.json(),
		() => 'Failed to parse request body'
	);

	if (bodyResult.isErr()) {
		log(`Request body parsing failed: ${bodyResult.error}`, startTime);
		return error(400, 'Failed to parse request body');
	}

	log('Request body parsed successfully', startTime);

	const parsed = reqBodySchema.safeParse(bodyResult.value);
	if (!parsed.success) {
		log(`Schema validation failed: ${parsed.error}`, startTime);
		return error(400, parsed.error);
	}
	const args = parsed.data;

	log('Schema validation passed', startTime);

	const session = await locals.auth();

	if (!session) {
		log('Unauthorized', startTime);
		return error(401, 'Unauthorized');
	}

	const crypto = new CryptoService(API_KEY_ENCRYPTION_SECRET);

	const encryptedKey = crypto.encrypt(args.key);

	const res = await ResultAsync.fromPromise(
		client.action(api.user_keys_actions.set, {
			key: encryptedKey,
			provider: args.provider,
			session_token: session.session.token,
		}),
		(e) => `Failed to update API key: ${e}`
	);

	if (res.isErr()) {
		log(`Failed to update API key: ${res.error}`, startTime);
		return error(500, 'Failed to update API key');
	}

	log('API key updated successfully', startTime);

	return response({ ok: true, key: args.key });
};
