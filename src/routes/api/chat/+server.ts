import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { api } from '$lib/backend/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { env } from '$env/dynamic/private';

const convex = new ConvexHttpClient(env.CONVEX_URL!);

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Authenticate the user
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = (session.user as { id: string }).id;

		const { conversationId, message, modelId } = await request.json();

		if (!conversationId || !message || !modelId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Add user message to the conversation
		await convex.mutation(api.messages.add, {
			conversation_id: conversationId,
			user_id: userId,
			role: 'user',
			content: message,
		});

		// Get the conversation to verify ownership
		const conversation = await convex.query(api.conversations.get, {
			conversation_id: conversationId,
			user_id: userId,
		});

		if (!conversation) {
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		// Get all messages in the conversation for context
		const messages = await convex.query(api.messages.list, {
			conversation_id: conversationId,
			user_id: userId,
		});

		// Get user's enabled models to find the provider
		const enabledModels = await convex.query(api.user_enabled_models.get_enabled, {
			user_id: userId,
		});

		const modelData = enabledModels[modelId];
		if (!modelData) {
			return json({ error: 'Model not enabled' }, { status: 400 });
		}

		// Get API key for the provider
		const userKeys = await convex.query(api.user_keys.all, {
			user_id: userId,
		});

		const provider = modelData.provider;
		const providerKey = userKeys[provider];
		if (!providerKey) {
			return json({ error: 'API key not found for provider' }, { status: 400 });
		}

		// Call the AI provider
		let response: string;
		try {
			response = await callAIProvider(
				provider,
				modelId,
				providerKey,
				messages.map((m) => ({ role: m.role, content: m.content }))
			);
		} catch (error) {
			console.error('AI Provider error:', error);
			response = 'Sorry, I encountered an error while processing your request. Please try again.';
		}

		// Add AI response to the conversation
		await convex.mutation(api.messages.add, {
			conversation_id: conversationId,
			user_id: userId,
			role: 'assistant',
			content: response,
		});

		return json({ response });
	} catch (error) {
		console.error('Chat API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

async function callAIProvider(
	provider: string,
	modelId: string,
	apiKey: string,
	messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
	switch (provider) {
		case 'openrouter':
			return await callOpenRouter(modelId, apiKey, messages);
		case 'openai':
			return await callOpenAI(modelId, apiKey, messages);
		case 'anthropic':
			return await callAnthropic(modelId, apiKey, messages);
		default:
			throw new Error(`Unsupported provider: ${provider}`);
	}
}

async function callOpenRouter(
	modelId: string,
	apiKey: string,
	messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://thom-chat.vercel.app',
			'X-Title': 'Thom Chat',
		},
		body: JSON.stringify({
			model: modelId,
			messages: messages,
			temperature: 0.7,
		}),
	});

	if (!response.ok) {
		throw new Error(`OpenRouter API error: ${response.statusText}`);
	}

	const data = await response.json();
	return data.choices[0]?.message?.content || 'No response generated';
}

async function callOpenAI(
	modelId: string,
	apiKey: string,
	messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: modelId,
			messages: messages,
			temperature: 0.7,
		}),
	});

	if (!response.ok) {
		throw new Error(`OpenAI API error: ${response.statusText}`);
	}

	const data = await response.json();
	return data.choices[0]?.message?.content || 'No response generated';
}

async function callAnthropic(
	modelId: string,
	apiKey: string,
	messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'Content-Type': 'application/json',
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: modelId,
			max_tokens: 1024,
			messages: messages,
		}),
	});

	if (!response.ok) {
		throw new Error(`Anthropic API error: ${response.statusText}`);
	}

	const data = await response.json();
	return data.content[0]?.text || 'No response generated';
}