import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { api } from '$lib/backend/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { env } from '$env/dynamic/private';

const convex = new ConvexHttpClient(env.CONVEX_URL!);

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Authenticate the user
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = (session.user as { id: string }).id;
		const { message, modelId } = await request.json();

		if (!message || !modelId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Create a new conversation
		const conversationId = await convex.mutation(api.conversations.create, {
			user_id: userId,
			title: generateTitle(message),
			model_id: modelId,
		});

		// Call the chat API to send the first message
		const chatResponse = await fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...request.headers,
			},
			body: JSON.stringify({
				conversationId,
				message,
				modelId,
			}),
		});

		if (!chatResponse.ok) {
			return json({ error: 'Failed to send message' }, { status: 500 });
		}

		return json({ conversationId });
	} catch (error) {
		console.error('New chat API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

function generateTitle(message: string): string {
	const words = message.split(' ').slice(0, 6);
	return words.join(' ') + (message.split(' ').length > 6 ? '...' : '');
}