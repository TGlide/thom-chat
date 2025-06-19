import { api } from '$lib/backend/convex/_generated/api.js';
import { type Id } from '$lib/backend/convex/_generated/dataModel.js';
import { ConvexHttpClient } from 'convex/browser';
import { error } from '@sveltejs/kit';

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL);

export const load = async ({ params }: { params: { id: string } }) => {
	try {
		// Get the conversation without requiring authentication
		const conversation = await client.query(api.conversations.getPublicById, {
			conversation_id: params.id as Id<'conversations'>,
		});

		if (!conversation) {
			error(404, 'Conversation not found or not shared publicly');
		}

		// Get messages for this conversation
		const messages = await client.query(api.messages.getByConversationPublic, {
			conversation_id: params.id as Id<'conversations'>,
		});

		return {
			conversation,
			messages,
		};
	} catch (e) {
		console.error('Error loading shared conversation:', e);
		error(404, 'Conversation not found or not shared publicly');
	}
};