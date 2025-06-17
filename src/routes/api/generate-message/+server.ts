import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import type { Doc, Id } from '$lib/backend/convex/_generated/dataModel';
import { Provider } from '$lib/types';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { ResultAsync } from 'neverthrow';
import OpenAI from 'openai';
import { waitUntil } from '@vercel/functions';

import { z } from 'zod/v4';
import type { ChatCompletionSystemMessageParam } from 'openai/resources';
import { getSessionCookie } from 'better-auth/cookies';

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

async function generateConversationTitle({
	conversationId,
	sessionToken,
	startTime,
	keyResultPromise,
	userMessage,
}: {
	conversationId: string;
	sessionToken: string;
	startTime: number;
	keyResultPromise: ResultAsync<string | null, string>;
	userMessage: string;
}) {
	log('Starting conversation title generation', startTime);

	const keyResult = await keyResultPromise;

	if (keyResult.isErr()) {
		log(`Title generation: API key error: ${keyResult.error}`, startTime);
		return;
	}

	const key = keyResult.value;
	if (!key) {
		log('Title generation: No API key found', startTime);
		return;
	}

	// Only generate title if conversation currently has default title
	const conversationResult = await ResultAsync.fromPromise(
		client.query(api.conversations.get, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get conversations: ${e}`
	);

	if (conversationResult.isErr()) {
		log(`Title generation: Failed to get conversation: ${conversationResult.error}`, startTime);
		return;
	}

	const conversations = conversationResult.value;
	const conversation = conversations.find((c) => c._id === conversationId);

	if (!conversation) {
		log('Title generation: Conversation not found or already has custom title', startTime);
		return;
	}

	const openai = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: key,
	});

	// Create a prompt for title generation using only the first user message
	const titlePrompt = `Based on this user request, generate a concise, specific title (max 4-5 words):

${userMessage}

Generate only the title based on what the user is asking for, nothing else:`;

	const titleResult = await ResultAsync.fromPromise(
		openai.chat.completions.create({
			model: 'mistralai/ministral-8b',
			messages: [{ role: 'user', content: titlePrompt }],
			max_tokens: 20,
			temperature: 0.3,
		}),
		(e) => `Title generation API call failed: ${e}`
	);

	if (titleResult.isErr()) {
		log(`Title generation: OpenAI call failed: ${titleResult.error}`, startTime);
		return;
	}

	const titleResponse = titleResult.value;
	const rawTitle = titleResponse.choices[0]?.message?.content?.trim();

	if (!rawTitle) {
		log('Title generation: No title generated', startTime);
		return;
	}

	// Strip surrounding quotes if present
	const generatedTitle = rawTitle.replace(/^["']|["']$/g, '');

	// Update the conversation title
	const updateResult = await ResultAsync.fromPromise(
		client.mutation(api.conversations.updateTitle, {
			conversation_id: conversationId as Id<'conversations'>,
			title: generatedTitle,
			session_token: sessionToken,
		}),
		(e) => `Failed to update conversation title: ${e}`
	);

	if (updateResult.isErr()) {
		log(`Title generation: Failed to update title: ${updateResult.error}`, startTime);
		return;
	}

	log(`Title generation: Successfully updated title to "${generatedTitle}"`, startTime);
}

async function generateAIResponse({
	conversationId,
	sessionToken,
	startTime,
	modelResultPromise,
	keyResultPromise,
	rulesResultPromise,
}: {
	conversationId: string;
	sessionToken: string;
	startTime: number;
	keyResultPromise: ResultAsync<string | null, string>;
	modelResultPromise: ResultAsync<Doc<'user_enabled_models'> | null, string>;
	rulesResultPromise: ResultAsync<Doc<'user_rules'>[], string>;
}) {
	log('Starting AI response generation in background', startTime);

	const [modelResult, keyResult, messagesQueryResult, rulesResult] = await Promise.all([
		modelResultPromise,
		keyResultPromise,
		ResultAsync.fromPromise(
			client.query(api.messages.getAllFromConversation, {
				conversation_id: conversationId as Id<'conversations'>,
				session_token: sessionToken,
			}),
			(e) => `Failed to get messages: ${e}`
		),
		rulesResultPromise,
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

	if (rulesResult.isErr()) {
		log(`Background rules query failed: ${rulesResult.error}`, startTime);
		return;
	}

	const userMessage = messages[messages.length - 1];

	if (!userMessage) {
		log('Background: No user message found', startTime);
		return;
	}

	const attachedRules = [
		...rulesResult.value.filter((r) => r.attach === 'always'),
		...parseMessageForRules(
			userMessage.content,
			rulesResult.value.filter((r) => r.attach === 'manual')
		),
	];

	log(`Background: ${attachedRules.length} rules attached`, startTime);

	const systemMessage: ChatCompletionSystemMessageParam = {
		role: 'system',
		content: `Respond in markdown format. The user may have mentioned one or more rules to follow with the @<rule_name> syntax. Please follow these rules.
Rules to follow:
${attachedRules.map((r) => `- ${r.name}: ${r.rule}`).join('\n')}`,
	};

	const openai = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: key,
	});

	const streamResult = await ResultAsync.fromPromise(
		openai.chat.completions.create({
			model: model.model_id,
			messages: [...messages.map((m) => ({ role: m.role, content: m.content })), systemMessage],
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
			model_id: model.model_id,
			provider: Provider.OpenRouter,
			content: '',
			role: 'assistant',
			session_token: sessionToken,
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
	let generationId: string | null = null;

	try {
		for await (const chunk of stream) {
			chunkCount++;
			content += chunk.choices[0]?.delta?.content || '';
			if (!content) continue;

			generationId = chunk.id;

			const updateResult = await ResultAsync.fromPromise(
				client.mutation(api.messages.updateContent, {
					message_id: mid,
					content,
					session_token: sessionToken,
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

		if (!generationId) {
			log('Background: No generation id found', startTime);
			return;
		}

		const generationStats = await getGenerationStats(generationId, key);

		log('Background: Got generation stats', startTime);

		const [updateMessageResult, updateGeneratingResult, updateCostUsdResult] = await Promise.all([
			ResultAsync.fromPromise(
				client.mutation(api.messages.updateMessage, {
					message_id: mid,
					token_count: generationStats.tokens_completion,
					cost_usd: generationStats.total_cost,
					generation_id: generationId,
					session_token: sessionToken,
				}),
				(e) => `Failed to update message: ${e}`
			),
			ResultAsync.fromPromise(
				client.mutation(api.conversations.updateGenerating, {
					conversation_id: conversationId as Id<'conversations'>,
					generating: false,
					session_token: sessionToken,
				}),
				(e) => `Failed to update generating status: ${e}`
			),
			ResultAsync.fromPromise(
				client.mutation(api.conversations.updateCostUsd, {
					conversation_id: conversationId as Id<'conversations'>,
					cost_usd: generationStats.total_cost,
					session_token: sessionToken,
				}),
				(e) => `Failed to update cost usd: ${e}`
			),
		]);

		if (updateGeneratingResult.isErr()) {
			log(`Background generating status update failed: ${updateGeneratingResult.error}`, startTime);
			return;
		}

		log('Background: Generating status updated to false', startTime);

		if (updateMessageResult.isErr()) {
			log(`Background message update failed: ${updateMessageResult.error}`, startTime);
			return;
		}

		log('Background: Message updated', startTime);

		if (updateCostUsdResult.isErr()) {
			log(`Background cost usd update failed: ${updateCostUsdResult.error}`, startTime);
			return;
		}

		log('Background: Cost usd updated', startTime);
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

	const cookie = getSessionCookie(request.headers);

	const sessionToken = cookie?.split('.')[0] ?? null;

	if (!sessionToken) {
		log(`No session token found`, startTime);
		return error(401, 'Unauthorized');
	}

	const modelResultPromise = ResultAsync.fromPromise(
		client.query(api.user_enabled_models.get, {
			provider: Provider.OpenRouter,
			model_id: args.model_id,
			session_token: sessionToken,
		}),
		(e) => `Failed to get model: ${e}`
	);

	const keyResultPromise = ResultAsync.fromPromise(
		client.query(api.user_keys.get, {
			provider: Provider.OpenRouter,
			session_token: sessionToken,
		}),
		(e) => `Failed to get API key: ${e}`
	);

	const rulesResultPromise = ResultAsync.fromPromise(
		client.query(api.user_rules.all, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get rules: ${e}`
	);

	log('Session authenticated successfully', startTime);

	let conversationId = args.conversation_id;
	if (!conversationId) {
		const convMessageResult = await ResultAsync.fromPromise(
			client.mutation(api.conversations.createAndAddMessage, {
				content: args.message,
				role: 'user',
				session_token: sessionToken,
			}),
			(e) => `Failed to create conversation: ${e}`
		);

		if (convMessageResult.isErr()) {
			log(`Conversation creation failed: ${convMessageResult.error}`, startTime);
			return error(500, 'Failed to create conversation');
		}

		conversationId = convMessageResult.value.conversationId;
		log('New conversation and message created', startTime);

		// Generate title for new conversation in background
		waitUntil(
			generateConversationTitle({
				conversationId,
				sessionToken,
				startTime,
				keyResultPromise,
				userMessage: args.message,
			}).catch((error) => {
				log(`Background title generation error: ${error}`, startTime);
			})
		);
	} else {
		log('Using existing conversation', startTime);
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
			sessionToken,
			startTime,
			modelResultPromise,
			keyResultPromise,
			rulesResultPromise,
		}).catch((error) => {
			log(`Background AI response generation error: ${error}`, startTime);
		})
	);

	log('Response sent, AI generation started in background', startTime);
	return response({ ok: true, conversation_id: conversationId });
};

function parseMessageForRules(message: string, rules: Doc<'user_rules'>[]): Doc<'user_rules'>[] {
	const matchedRules: Doc<'user_rules'>[] = [];

	for (const rule of rules) {
		const match = message.match(new RegExp(`@${rule.name}(\\s|$)`));
		if (!match) continue;

		matchedRules.push(rule);
	}

	return matchedRules;
}

async function getGenerationStats(generationId: string, token: string): Promise<Data> {
	const generation = await fetch(`https://openrouter.ai/api/v1/generation?id=${generationId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const { data } = await generation.json();

	return data;
}

export interface ApiResponse {
	data: Data;
}

export interface Data {
	created_at: string;
	model: string;
	app_id: string | null;
	external_user: string | null;
	streamed: boolean;
	cancelled: boolean;
	latency: number;
	moderation_latency: number | null;
	generation_time: number;
	tokens_prompt: number;
	tokens_completion: number;
	native_tokens_prompt: number;
	native_tokens_completion: number;
	native_tokens_reasoning: number;
	native_tokens_cached: number;
	num_media_prompt: number | null;
	num_media_completion: number | null;
	num_search_results: number | null;
	origin: string;
	is_byok: boolean;
	finish_reason: string;
	native_finish_reason: string;
	usage: number;
	id: string;
	upstream_id: string;
	total_cost: number;
	cache_discount: number | null;
	provider_name: string;
}
