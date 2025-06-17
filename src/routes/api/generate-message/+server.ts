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
import type { ChatCompletionSystemMessageParam } from 'openai/resources';

// Set to true to enable debug logging
const ENABLE_LOGGING = true;

const reqBodySchema = z.object({
	message: z.string(),
	model_id: z.string(),

	session_token: z.string(),
	conversation_id: z.string().optional(),
	images: z.array(z.object({
		url: z.string(),
		storage_id: z.string(),
		fileName: z.string().optional(),
	})).optional(),
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
	session,
	startTime,
	keyResultPromise,
	userMessage,
}: {
	conversationId: string;
	session: SessionObj;
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
			session_token: session.token,
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
			session_token: session.token,
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
	session,
	startTime,
	modelResultPromise,
	keyResultPromise,
	rulesResultPromise,
}: {
	conversationId: string;
	session: SessionObj;
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
				session_token: session.token,
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

	if (messagesQueryResult.isErr()) {
		log(`Background messages query failed: ${messagesQueryResult.error}`, startTime);
		return;
	}

	const messages = messagesQueryResult.value;
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

	const formattedMessages = messages.map((m) => {
		if (m.images && m.images.length > 0 && m.role === 'user') {
			return {
				role: 'user' as const,
				content: [
					{ type: 'text' as const, text: m.content },
					...m.images.map(img => ({
						type: 'image_url' as const,
						image_url: { url: img.url }
					}))
				]
			};
		}
		return { 
			role: m.role as 'user' | 'assistant' | 'system', 
			content: m.content 
		};
	});

	const streamResult = await ResultAsync.fromPromise(
		openai.chat.completions.create({
			model: model.model_id,
			messages: [...formattedMessages, systemMessage],
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

		const updateGeneratingResult = await ResultAsync.fromPromise(
			client.mutation(api.conversations.updateGenerating, {
				conversation_id: conversationId as Id<'conversations'>,
				generating: false,
				session_token: session.token,
			}),
			(e) => `Failed to update generating status: ${e}`
		);

		if (updateGeneratingResult.isErr()) {
			log(`Background generating status update failed: ${updateGeneratingResult.error}`, startTime);
			return;
		}

		log('Background: Generating status updated to false', startTime);
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

	const rulesResultPromise = ResultAsync.fromPromise(
		client.query(api.user_rules.all, {
			session_token: session.token,
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
				session_token: session.token,
				images: args.images,
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
				session,
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
