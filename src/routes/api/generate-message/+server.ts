import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { OPENROUTER_FREE_KEY } from '$env/static/private';
import { api } from '$lib/backend/convex/_generated/api';
import type { Doc, Id } from '$lib/backend/convex/_generated/dataModel';
import { Provider } from '$lib/types';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { waitUntil } from '@vercel/functions';
import { getSessionCookie } from 'better-auth/cookies';
import { ConvexHttpClient } from 'convex/browser';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import OpenAI from 'openai';
import { z } from 'zod/v4';
import { generationAbortControllers } from './cache.js';
import { md } from '$lib/utils/markdown-it.js';
import * as array from '$lib/utils/array';

// Set to true to enable debug logging
const ENABLE_LOGGING = true;

const reqBodySchema = z.object({
	message: z.string(),
	model_id: z.string(),

	session_token: z.string(),
	conversation_id: z.string().optional(),
	web_search_enabled: z.boolean().optional(),
	images: z
		.array(
			z.object({
				url: z.string(),
				storage_id: z.string(),
				fileName: z.string().optional(),
			})
		)
		.optional(),
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

	const userKey = keyResult.value;
	const actualKey = userKey || OPENROUTER_FREE_KEY;

	log(`Title generation: Using ${userKey ? 'user' : 'free tier'} API key`, startTime);

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
		apiKey: actualKey,
	});

	// Create a prompt for title generation using only the first user message
	const titlePrompt = `Based on this message:
"""${userMessage}"""

Generate a concise, specific title (max 4-5 words).
Generate only the title based on the message, nothing else. Don't name the title 'Generate Title' or anything stupid like that, otherwise its obvious we're generating a title with AI.

Also, do not interact with the message directly or answer it. Just generate the title based on the message.

If its a simple hi, just name it "Greeting" or something like that.
`;

	const titleResult = await ResultAsync.fromPromise(
		openai.chat.completions.create({
			model: 'mistralai/ministral-8b',
			messages: [{ role: 'user', content: titlePrompt }],
			max_tokens: 20,
			temperature: 0.5,
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
	t;

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
	userSettingsPromise,
	abortSignal,
}: {
	conversationId: string;
	sessionToken: string;
	startTime: number;
	keyResultPromise: ResultAsync<string | null, string>;
	modelResultPromise: ResultAsync<Doc<'user_enabled_models'> | null, string>;
	rulesResultPromise: ResultAsync<Doc<'user_rules'>[], string>;
	userSettingsPromise: ResultAsync<Doc<'user_settings'> | null, string>;
	abortSignal?: AbortSignal;
}) {
	log('Starting AI response generation in background', startTime);

	if (abortSignal?.aborted) {
		log('AI response generation aborted before starting', startTime);
		return;
	}

	const [modelResult, keyResult, messagesQueryResult, rulesResult, userSettingsResult] =
		await Promise.all([
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
			userSettingsPromise,
		]);

	if (modelResult.isErr()) {
		handleGenerationError({
			error: modelResult.error,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	const model = modelResult.value;
	if (!model) {
		handleGenerationError({
			error: 'Model not found or not enabled',
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	log('Background: Model found and enabled', startTime);

	if (messagesQueryResult.isErr()) {
		handleGenerationError({
			error: `messages query failed: ${messagesQueryResult.error}`,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	const messages = messagesQueryResult.value;
	log(`Background: Retrieved ${messages.length} messages from conversation`, startTime);

	// Check if web search is enabled for the last user message
	const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
	const webSearchEnabled = lastUserMessage?.web_search_enabled ?? false;

	const modelId = webSearchEnabled ? `${model.model_id}:online` : model.model_id;

	// Create assistant message
	const messageCreationResult = await ResultAsync.fromPromise(
		client.mutation(api.messages.create, {
			conversation_id: conversationId,
			model_id: model.model_id,
			provider: Provider.OpenRouter,
			content: '',
			role: 'assistant',
			session_token: sessionToken,
			web_search_enabled: webSearchEnabled,
		}),
		(e) => `Failed to create assistant message: ${e}`
	);

	if (messageCreationResult.isErr()) {
		handleGenerationError({
			error: `assistant message creation failed: ${messageCreationResult.error}`,
			conversationId,
			messageId: undefined,
			sessionToken,
			startTime,
		});
		return;
	}

	const mid = messageCreationResult.value;
	log('Background: Assistant message created', startTime);

	if (keyResult.isErr()) {
		handleGenerationError({
			error: `API key query failed: ${keyResult.error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	if (userSettingsResult.isErr()) {
		handleGenerationError({
			error: `User settings query failed: ${userSettingsResult.error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	const userKey = keyResult.value;
	const userSettings = userSettingsResult.value;
	let actualKey: string;

	if (userKey) {
		// User has their own API key
		actualKey = userKey;
		log('Background: Using user API key', startTime);
	} else {
		// User doesn't have API key, check if using a free model
		const isFreeModel = model.model_id.endsWith(':free');

		if (!isFreeModel) {
			// For non-free models, check the 10 message limit
			const freeMessagesUsed = userSettings?.free_messages_used || 0;

			if (freeMessagesUsed >= 10) {
				handleGenerationError({
					error:
						'Free message limit reached (10/10). Please add your own OpenRouter API key to continue chatting, or use a free model ending in ":free".',
					conversationId,
					messageId: mid,
					sessionToken,
					startTime,
				});
				return;
			}

			// Increment free message count before generating (only for non-free models)
			const incrementResult = await ResultAsync.fromPromise(
				client.mutation(api.user_settings.incrementFreeMessageCount, {
					session_token: sessionToken,
				}),
				(e) => `Failed to increment free message count: ${e}`
			);

			if (incrementResult.isErr()) {
				handleGenerationError({
					error: `Failed to track free message usage: ${incrementResult.error}`,
					conversationId,
					messageId: mid,
					sessionToken,
					startTime,
				});
				return;
			}

			log(`Background: Using free tier (${freeMessagesUsed + 1}/10 messages)`, startTime);
		} else {
			log(`Background: Using free model (${model.model_id}) - no message count`, startTime);
		}

		// Use environment OpenRouter key
		actualKey = OPENROUTER_FREE_KEY;
	}

	if (rulesResult.isErr()) {
		handleGenerationError({
			error: `rules query failed: ${rulesResult.error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	const userMessage = messages[messages.length - 1];

	if (!userMessage) {
		handleGenerationError({
			error: 'No user message found',
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	let attachedRules = rulesResult.value.filter((r) => r.attach === 'always');

	for (const message of messages) {
		const parsedRules = parseMessageForRules(
			message.content,
			rulesResult.value.filter((r) => r.attach === 'manual')
		);

		attachedRules.push(...parsedRules);
	}

	// remove duplicates
	attachedRules = array.fromMap(
		array.toMap(attachedRules, (r) => [r._id, r]),
		(_k, v) => v
	);

	log(`Background: ${attachedRules.length} rules attached`, startTime);

	const openai = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: actualKey,
	});

	const formattedMessages = messages.map((m) => {
		if (m.images && m.images.length > 0 && m.role === 'user') {
			return {
				role: 'user' as const,
				content: [
					{ type: 'text' as const, text: m.content },
					...m.images.map((img) => ({
						type: 'image_url' as const,
						image_url: { url: img.url },
					})),
				],
			};
		}
		return {
			role: m.role as 'user' | 'assistant' | 'system',
			content: m.content,
		};
	});

	// Only include system message if there are rules to follow
	const messagesToSend =
		attachedRules.length > 0
			? [
					...formattedMessages,
					{
						role: 'system' as const,
						content: `The user has mentioned one or more rules to follow with the @<rule_name> syntax. Please follow these rules as they apply.
Rules to follow:
${attachedRules.map((r) => `- ${r.name}: ${r.rule}`).join('\n')}`,
					},
				]
			: formattedMessages;

	if (abortSignal?.aborted) {
		handleGenerationError({
			error: 'Cancelled by user',
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	const streamResult = await ResultAsync.fromPromise(
		openai.chat.completions.create(
			{
				model: modelId,
				messages: messagesToSend,
				temperature: 0.7,
				stream: true,
			},
			{
				signal: abortSignal,
			}
		),
		(e) => `OpenAI API call failed: ${e}`
	);

	if (streamResult.isErr()) {
		handleGenerationError({
			error: `Failed to create stream: ${streamResult.error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
		return;
	}

	const stream = streamResult.value;
	log('Background: OpenAI stream created successfully', startTime);

	let content = '';
	let chunkCount = 0;
	let generationId: string | null = null;

	try {
		for await (const chunk of stream) {
			if (abortSignal?.aborted) {
				log('AI response generation aborted during streaming', startTime);
				break;
			}

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

		const contentHtmlResultPromise = ResultAsync.fromPromise(
			md.renderAsync(content),
			(e) => `Failed to render HTML: ${e}`
		);

		const generationStatsResult = await retryResult(
			() => getGenerationStats(generationId!, actualKey),
			{
				delay: 500,
				retries: 2,
				startTime,
				fnName: 'getGenerationStats',
			}
		);

		if (generationStatsResult.isErr()) {
			log(`Background: Failed to get generation stats: ${generationStatsResult.error}`, startTime);
		}

		// just default so we don't blow up
		const generationStats = generationStatsResult.unwrapOr({
			tokens_completion: undefined,
			total_cost: undefined,
		});

		log('Background: Got generation stats', startTime);

		const contentHtmlResult = await contentHtmlResultPromise;

		if (contentHtmlResult.isErr()) {
			log(`Background: Failed to render HTML: ${contentHtmlResult.error}`, startTime);
		}

		const [updateMessageResult, updateGeneratingResult, updateCostUsdResult] = await Promise.all([
			ResultAsync.fromPromise(
				client.mutation(api.messages.updateMessage, {
					message_id: mid,
					token_count: generationStats.tokens_completion,
					cost_usd: generationStats.total_cost,
					generation_id: generationId,
					session_token: sessionToken,
					content_html: contentHtmlResult.unwrapOr(undefined),
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
					cost_usd: generationStats.total_cost ?? 0,
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
		handleGenerationError({
			error: `Stream processing error: ${error}`,
			conversationId,
			messageId: mid,
			sessionToken,
			startTime,
		});
	} finally {
		// Clean up the cached AbortController
		generationAbortControllers.delete(conversationId);
		log('Background: Cleaned up abort controller', startTime);
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

	const userSettingsPromise = ResultAsync.fromPromise(
		client.query(api.user_settings.get, {
			session_token: sessionToken,
		}),
		(e) => `Failed to get user settings: ${e}`
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
				content_html: '',
				role: 'user',
				images: args.images,
				web_search_enabled: args.web_search_enabled,
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
				images: args.images,
				web_search_enabled: args.web_search_enabled,
			}),
			(e) => `Failed to create user message: ${e}`
		);

		if (userMessageResult.isErr()) {
			log(`User message creation failed: ${userMessageResult.error}`, startTime);
			return error(500, 'Failed to create user message');
		}

		log('User message created', startTime);
	}

	// Set generating status to true before starting background generation
	const setGeneratingResult = await ResultAsync.fromPromise(
		client.mutation(api.conversations.updateGenerating, {
			conversation_id: conversationId as Id<'conversations'>,
			generating: true,
			session_token: sessionToken,
		}),
		(e) => `Failed to set generating status: ${e}`
	);

	if (setGeneratingResult.isErr()) {
		log(`Failed to set generating status: ${setGeneratingResult.error}`, startTime);
		return error(500, 'Failed to set generating status');
	}

	// Create and cache AbortController for this generation
	const abortController = new AbortController();
	generationAbortControllers.set(conversationId, abortController);

	// Start AI response generation in background - don't await
	waitUntil(
		generateAIResponse({
			conversationId,
			sessionToken,
			startTime,
			modelResultPromise,
			keyResultPromise,
			rulesResultPromise,
			userSettingsPromise,
			abortSignal: abortController.signal,
		})
			.catch(async (error) => {
				log(`Background AI response generation error: ${error}`, startTime);
				// Reset generating status on error
				try {
					await client.mutation(api.conversations.updateGenerating, {
						conversation_id: conversationId as Id<'conversations'>,
						generating: false,
						session_token: sessionToken,
					});
				} catch (e) {
					log(`Failed to reset generating status after error: ${e}`, startTime);
				}
			})
			.finally(() => {
				// Clean up the cached AbortController
				generationAbortControllers.delete(conversationId);
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

async function getGenerationStats(
	generationId: string,
	token: string
): Promise<Result<Data, string>> {
	try {
		const generation = await fetch(`https://openrouter.ai/api/v1/generation?id=${generationId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		const { data } = await generation.json();

		if (!data) {
			return err('No data returned from OpenRouter');
		}

		return ok(data);
	} catch {
		return err('Failed to get generation stats');
	}
}

async function retryResult<T, E>(
	fn: () => Promise<Result<T, E>>,
	{
		retries,
		delay,
		startTime,
		fnName,
	}: { retries: number; delay: number; startTime: number; fnName: string }
): Promise<Result<T, E>> {
	let attempts = 0;
	let lastResult: Result<T, E> | null = null;

	while (attempts <= retries) {
		lastResult = await fn();

		if (lastResult.isOk()) return lastResult;

		log(`Retrying ${fnName} ${attempts} failed: ${lastResult.error}`, startTime);

		await new Promise((resolve) => setTimeout(resolve, delay));
		attempts++;
	}

	if (!lastResult) throw new Error('This should never happen');

	return lastResult;
}

async function handleGenerationError({
	error,
	conversationId,
	messageId,
	sessionToken,
	startTime,
}: {
	error: string;
	conversationId: string;
	messageId: string | undefined;
	sessionToken: string;
	startTime: number;
}) {
	log(`Background: ${error}`, startTime);

	const updateErrorResult = await ResultAsync.fromPromise(
		client.mutation(api.messages.updateError, {
			conversation_id: conversationId as Id<'conversations'>,
			message_id: messageId,
			error,
			session_token: sessionToken,
		}),
		(e) => `Error updating error: ${e}`
	);

	if (updateErrorResult.isErr()) {
		log(`Error updating error: ${updateErrorResult.error}`, startTime);
		return;
	}

	log('Error updated', startTime);
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
