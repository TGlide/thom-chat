import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$lib/backend/convex/_generated/api';
import type { Id } from '$lib/backend/convex/_generated/dataModel';
import { Provider } from '$lib/types';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { ResultAsync } from 'neverthrow';
import OpenAI from 'openai';

import { z } from 'zod/v4';

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

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);

export const POST: RequestHandler = async ({ request }) => {
	const bodyResult = await ResultAsync.fromPromise(
		request.json(),
		() => 'Failed to parse request body'
	);

	if (bodyResult.isErr()) {
		return error(400, 'Failed to parse request body');
	}

	const parsed = reqBodySchema.safeParse(bodyResult.value);
	if (!parsed.success) {
		return error(400, parsed.error);
	}
	const args = parsed.data;

	const session = await client.query(api.betterAuth.publicGetSession, {
		session_token: args.session_token,
	});

	if (!session) {
		throw new Error('Unauthorized');
	}

	const model = await client.query(api.user_enabled_models.get, {
		provider: Provider.OpenRouter,
		model_id: args.model_id,
		user_id: session.userId,
	});

	if (!model) {
		throw new Error('Model not found or not enabled');
	}

	let conversationId = args.conversation_id;
	if (!conversationId) {
		conversationId = await client.mutation(api.conversations.create, {
			session_token: args.session_token,
		});
	}

	if (args.message) {
		await client.mutation(api.messages.create, {
			conversation_id: conversationId as Id<'conversations'>,
			content: args.message,
			session_token: args.session_token,
			model_id: args.model_id,
			role: 'user',
		});
	}

	const messagesQuery = await ResultAsync.fromPromise(
		client.query(api.messages.getAllFromConversation, {
			conversation_id: conversationId as Id<'conversations'>,
			session_token: args.session_token,
		}),
		(e) => e
	);

	if (messagesQuery.isErr()) {
		throw new Error('Failed to get messages');
	}

	const messages = messagesQuery.value;

	console.log(messages);

	const key = await client.query(api.user_keys.get, {
		provider: Provider.OpenRouter,
		session_token: session.token,
	});

	if (!key) {
		throw new Error('No key found');
	}

	const openai = new OpenAI({
		baseURL: 'https://openrouter.ai/api/v1',
		apiKey: key,
	});

	const stream = await openai.chat.completions.create({
		model: model.model_id,
		messages: messages.map((m) => ({ role: m.role, content: m.content })),
		max_tokens: 1000,
		temperature: 0.7,
		stream: true,
	});

	// Create first message
	const mid = await client.mutation(api.messages.create, {
		conversation_id: conversationId,
		content: '',
		role: 'assistant',
		session_token: session.token,
	});

	async function handleStream() {
		if (!session) return;

		let content = '';
		for await (const chunk of stream) {
			content += chunk.choices[0]?.delta?.content || '';
			if (!content) continue;

			await client.mutation(api.messages.updateContent, {
				message_id: mid,
				content,
				session_token: session.token,
			});
		}
	}

	handleStream();

	return response({ ok: true, conversation_id: conversationId });

	// const completionResult = await ResultAsync.fromPromise(
	// 	openai.chat.completions.create({
	// 		model,
	// 		messages: [{ role: 'user', content: message }],
	// 		max_tokens: 1000,
	// 		temperature: 0.7,
	// 		stream: true,
	// 	}),
	// 	() => 'OpenRouter API failed'
	// );
	//
	// if (completionResult.isErr()) {
	// 	return new Response(JSON.stringify({ error: completionResult.error }), {
	// 		status: 500,
	// 		headers: { 'Content-Type': 'application/json' },
	// 	});
	// }
	//
	// const stream = completionResult.value;
	//
	//
	// const readable = new ReadableStream({
	// 	async start(controller) {
	// 		for await (const chunk of stream) {
	// 			const content = chunk.choices[0]?.delta?.content || '';
	// 			if (content) {
	// 				controller.enqueue(new TextEncoder().encode(content));
	// 			}
	// 		}
	// 		controller.close();
	// 	},
	// });
	//
	// return new Response(readable, {
	// 	headers: {
	// 		'Content-Type': 'text/plain',
	// 		'Cache-Control': 'no-cache',
	// 	},
	// });
};
