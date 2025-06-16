import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import type { Doc, Id } from '$lib/backend/convex/_generated/dataModel';
import type { SessionObj } from '$lib/backend/convex/betterAuth';
import { Provider } from '$lib/types';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { ResultAsync } from 'neverthrow';
import OpenAI from 'openai';
import { waitUntil } from '@vercel/functions';

import { z } from 'zod/v4';

// Set to true to enable debug logging
const ENABLE_LOGGING = true;

const reqBodySchema = z.object({
	message: z.string(),
	model_id: z.string(),

	session_token: z.string(),
	conversation_id: z.string().optional(),
});

export type GenerateMessageRequestBody = z.infer<typeof reqBodySchema>;

export type GenerateMessageResponse = {
	ok: true;
	conversation_id: string;
};

function response(res: GenerateMessageResponse) {
	return json(res);
}

function log(message: string, startTime: number): void {
	if (!ENABLE_LOGGING) return;
	const elapsed = Date.now() - startTime;
	console.log(`[GenerateMessage] ${message} (${elapsed}ms)`);
}

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

async function generateAIResponse({
	conversationId,
	session,
	startTime,
	modelResultPromise,
	keyResultPromise,
}: {
	conversationId: string;
	session: SessionObj;
	startTime: number;
	keyResultPromise: ResultAsync<string | null, string>;
	modelResultPromise: ResultAsync<Doc<'user_enabled_models'> | null, string>;
}) {
	log('Starting AI response generation in background', startTime);

	const [modelResult, keyResult, messagesQueryResult] = await Promise.all([
		modelResultPromise,
		keyResultPromise,
		ResultAsync.fromPromise(
			client.query(api.messages.getAllFromConversation, {
				conversation_id: conversationId as Id<'conversations'>,
				session_token: session.token,
			}),
			(e) => `Failed to get messages: ${e}`
		),
	]);

	if (modelResult.isErr()) {
		log(`Background model query failed: ${modelResult.error}`, startTime);
		return;
	}

	const model = modelResult.value;
	if (!model) {
		log('Background: Model not found or not enabled', startTime);
		return;
	}

	log('Background: Model found and enabled', startTime);

	const messagesQuery = await messagesQueryResult;

	if (messagesQuery.isErr()) {
		log(`Background messages query failed: ${messagesQuery.error}`, startTime);
		return;
	}

	const messages = messagesQuery.value;
	log(`Background: Retrieved ${messages.length} messages from conversation`, startTime);

	if (keyResult.isErr()) {
		log(`Background API key query failed: ${keyResult.error}`, startTime);
		return;
	}

	const key = keyResult.value;
	if (!key) {
		log('Background: No API key found', startTime);
		return;
	}

	log('Background: API key retrieved successfully', startTime);

	const openai = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: key,
	});

	const streamResult = await ResultAsync.fromPromise(
		openai.chat.completions.create({
			model: model.model_id,
			messages: messages.map((m) => ({ role: m.role, content: m.content })),
			max_tokens: 1000,
			temperature: 0.7,
			stream: true,
		}),
		(e) => `OpenAI API call failed: ${e}`
	);

	if (streamResult.isErr()) {
		log(`Background OpenAI stream creation failed: ${streamResult.error}`, startTime);
		return;
	}

	const stream = streamResult.value;
	log('Background: OpenAI stream created successfully', startTime);

	// Create assistant message
	const messageCreationResult = await ResultAsync.fromPromise(
		client.mutation(api.messages.create, {
			conversation_id: conversationId,
			content: '',
			role: 'assistant',
			session_token: session.token,
		}),
		(e) => `Failed to create assistant message: ${e}`
	);

	if (messageCreationResult.isErr()) {
		log(`Background assistant message creation failed: ${messageCreationResult.error}`, startTime);
		return;
	}

	const mid = messageCreationResult.value;
	log('Background: Assistant message created', startTime);

	let content = '';
	let chunkCount = 0;

	try {
		for await (const chunk of stream) {
			chunkCount++;
			content += chunk.choices[0]?.delta?.content || '';
			if (!content) continue;

			const updateResult = await ResultAsync.fromPromise(
				client.mutation(api.messages.updateContent, {
					message_id: mid,
					content,
					session_token: session.token,
				}),
				(e) => `Failed to update message content: ${e}`
			);

			if (updateResult.isErr()) {
				log(
					`Background message update failed on chunk ${chunkCount}: ${updateResult.error}`,
					startTime
				);
			}
		}

		log(
			`Background stream processing completed. Processed ${chunkCount} chunks, final content length: ${content.length}`,
			startTime
		);
	} catch (error) {
		log(`Background stream processing error: ${error}`, startTime);
	}
}

export const POST: RequestHandler = async ({ request }) => {
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

	const sessionResult = await ResultAsync.fromPromise(
		client.query(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		}),
		(e) => `Failed to get session: ${e}`
	);

	if (sessionResult.isErr()) {
		log(`Session query failed: ${sessionResult.error}`, startTime);
		return error(401, 'Failed to authenticate');
	}

	const session = sessionResult.value;
	if (!session) {
		log('No session found - unauthorized', startTime);
		return error(401, 'Unauthorized');
	}

	const modelResultPromise = ResultAsync.fromPromise(
		client.query(api.user_enabled_models.get, {
			provider: Provider.OpenRouter,
			model_id: args.model_id,
			session_token: session.token,
		}),
		(e) => `Failed to get model: ${e}`
	);

	const keyResultPromise = ResultAsync.fromPromise(
		client.query(api.user_keys.get, {
			provider: Provider.OpenRouter,
			session_token: session.token,
		}),
		(e) => `Failed to get API key: ${e}`
	);

	log('Session authenticated successfully', startTime);

	let conversationId = args.conversation_id;
	if (!conversationId) {
		const conversationResult = await ResultAsync.fromPromise(
			client.mutation(api.conversations.create, {
				session_token: args.session_token,
			}),
			(e) => `Failed to create conversation: ${e}`
		);

		if (conversationResult.isErr()) {
			log(`Conversation creation failed: ${conversationResult.error}`, startTime);
			return error(500, 'Failed to create conversation');
		}

		conversationId = conversationResult.value;
		log('New conversation created', startTime);
	} else {
		log('Using existing conversation', startTime);
	}

	if (args.message) {
		const userMessageResult = await ResultAsync.fromPromise(
			client.mutation(api.messages.create, {
				conversation_id: conversationId as Id<'conversations'>,
				content: args.message,
				session_token: args.session_token,
				model_id: args.model_id,
				role: 'user',
			}),
			(e) => `Failed to create user message: ${e}`
		);

		if (userMessageResult.isErr()) {
			log(`User message creation failed: ${userMessageResult.error}`, startTime);
			return error(500, 'Failed to create user message');
		}

		log('User message created', startTime);
	}

	// Start AI response generation in background - don't await
	waitUntil(
		generateAIResponse({
			conversationId,
			session,
			startTime,
			modelResultPromise,
			keyResultPromise,
		}).catch((error) => {
			log(`Background AI response generation error: ${error}`, startTime);
		})
	);

	log('Response sent, AI generation started in background', startTime);
	return response({ ok: true, conversation_id: conversationId });
};

// function parseMessageForRules(message: string, rules: Doc<'user_rules'>[]): Doc<'user_rules'>[] {
// 	const matchedRules: Doc<'user_rules'>[] = [];

// 	for (const rule of rules) {
// 		const match = message.indexOf(`@${rule.name}`);
// 		if (match === -1) continue;

// 		matchedRules.push(rule);
// 	}

// 	return matchedRules;
// }
