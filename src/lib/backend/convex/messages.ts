import { v } from 'convex/values';
import { api } from './_generated/api';
import { type Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { messageRoleValidator, providerValidator } from './schema';
import { mutation } from './functions';

export const getAllFromConversation = query({
	args: {
		conversation_id: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const messages = await ctx.db
			.query('messages')
			.withIndex('by_conversation', (q) => q.eq('conversation_id', args.conversation_id))
			.order('asc')
			.collect();

		return messages;
	},
});

export const create = mutation({
	args: {
		conversation_id: v.string(),
		content: v.string(),
		role: messageRoleValidator,
		session_token: v.string(),

		// Optional, coming from SK API route
		model_id: v.optional(v.string()),
		provider: v.optional(providerValidator),
		token_count: v.optional(v.number()),
		web_search_enabled: v.optional(v.boolean()),
		// Optional image attachments
		images: v.optional(v.array(v.object({
			url: v.string(),
			storage_id: v.string(),
			fileName: v.optional(v.string()),
		}))),
	},
	handler: async (ctx, args): Promise<Id<'messages'>> => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// I think this just slows us down

		// const messages = await ctx.runQuery(api.messages.getAllFromConversation, {
		// 	conversation_id: args.conversation_id,
		// 	session_token: args.session_token,
		// });

		// const lastMessage = messages[messages.length - 1];

		// if (lastMessage?.role === args.role) {
		// 	throw new Error('Last message has the same role, forbidden');
		// }

		const [id] = await Promise.all([
			ctx.db.insert('messages', {
				conversation_id: args.conversation_id,
				content: args.content,
				role: args.role,
				// Optional, coming from SK API route
				model_id: args.model_id,
				provider: args.provider,
				token_count: args.token_count,
				web_search_enabled: args.web_search_enabled,
				// Optional image attachments
				images: args.images,
			}),
			ctx.db.patch(args.conversation_id as Id<'conversations'>, {
				generating: true,
				updated_at: Date.now(),
			}),
		]);

		return id;
	},
});

export const updateContent = mutation({
	args: {
		session_token: v.string(),
		message_id: v.string(),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const message = await ctx.db.get(args.message_id as Id<'messages'>);

		if (!message) {
			throw new Error('Message not found');
		}

		await ctx.db.patch(message._id, {
			content: args.content,
		});
	},
});

export const updateMessage = mutation({
	args: {
		session_token: v.string(),
		message_id: v.string(),
		token_count: v.optional(v.number()),
		cost_usd: v.optional(v.number()),
		generation_id: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const message = await ctx.db.get(args.message_id as Id<'messages'>);

		if (!message) {
			throw new Error('Message not found');
		}

		await ctx.db.patch(message._id, {
			token_count: args.token_count,
			cost_usd: args.cost_usd,
			generation_id: args.generation_id,
		});
	},
});
