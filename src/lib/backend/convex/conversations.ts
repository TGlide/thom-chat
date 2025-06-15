import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const create = mutation({
	args: {
		user_id: v.string(),
		title: v.string(),
		model_id: v.string(),
	},
	handler: async (ctx, args) => {
		const now = Date.now();
		const conversationId = await ctx.db.insert('conversations', {
			user_id: args.user_id,
			title: args.title,
			model_id: args.model_id,
			created_at: now,
			updated_at: now,
		});
		return conversationId;
	},
});

export const list = query({
	args: {
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query('conversations')
			.withIndex('by_user_updated', (q) => q.eq('user_id', args.user_id))
			.order('desc')
			.collect();
	},
});

export const get = query({
	args: {
		conversation_id: v.id('conversations'),
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== args.user_id) {
			return null;
		}
		return conversation;
	},
});

export const update_title = mutation({
	args: {
		conversation_id: v.id('conversations'),
		user_id: v.string(),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== args.user_id) {
			throw new Error('Conversation not found');
		}
		
		await ctx.db.patch(args.conversation_id, {
			title: args.title,
			updated_at: Date.now(),
		});
	},
});

export const delete_conversation = mutation({
	args: {
		conversation_id: v.id('conversations'),
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== args.user_id) {
			throw new Error('Conversation not found');
		}

		// Delete all messages in the conversation
		const messages = await ctx.db
			.query('messages')
			.withIndex('by_conversation', (q) => q.eq('conversation_id', args.conversation_id))
			.collect();
		
		for (const message of messages) {
			await ctx.db.delete(message._id);
		}

		// Delete the conversation
		await ctx.db.delete(args.conversation_id);
	},
});