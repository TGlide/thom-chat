import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const list = query({
	args: {
		conversation_id: v.id('conversations'),
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		// Verify user owns the conversation
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== args.user_id) {
			return [];
		}

		return await ctx.db
			.query('messages')
			.withIndex('by_conversation_created', (q) => q.eq('conversation_id', args.conversation_id))
			.order('asc')
			.collect();
	},
});

export const add = mutation({
	args: {
		conversation_id: v.id('conversations'),
		user_id: v.string(),
		role: v.union(v.literal('user'), v.literal('assistant')),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		// Verify user owns the conversation
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== args.user_id) {
			throw new Error('Conversation not found');
		}

		const messageId = await ctx.db.insert('messages', {
			conversation_id: args.conversation_id,
			role: args.role,
			content: args.content,
			created_at: Date.now(),
		});

		// Update conversation's updated_at timestamp
		await ctx.db.patch(args.conversation_id, {
			updated_at: Date.now(),
		});

		return messageId;
	},
});