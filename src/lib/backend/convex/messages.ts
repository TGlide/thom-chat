import { v } from 'convex/values';
import { api } from './_generated/api';
import { type Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { messageRoleValidator, providerValidator, reasoningEffortValidator } from './schema';
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

		if (!session) throw new Error('Unauthorized');

		const [messages, conversation] = await Promise.all([
			ctx.db
				.query('messages')
				.withIndex('by_conversation', (q) => q.eq('conversation_id', args.conversation_id))
				.order('asc')
				.collect(),
			ctx.db.get(args.conversation_id as Id<'conversations'>),
		]);

		if (!conversation?.public && conversation?.user_id !== session.userId) {
			throw new Error('Unauthorized');
		}

		return messages;
	},
});

export const create = mutation({
	args: {
		conversation_id: v.string(),
		content: v.string(),
		content_html: v.optional(v.string()),
		role: messageRoleValidator,
		session_token: v.string(),

		// Optional, coming from SK API route
		model_id: v.optional(v.string()),
		provider: v.optional(providerValidator),
		token_count: v.optional(v.number()),
		web_search_enabled: v.optional(v.boolean()),
		reasoning_effort: v.optional(reasoningEffortValidator),
		// Optional image attachments
		images: v.optional(
			v.array(
				v.object({
					url: v.string(),
					storage_id: v.string(),
					fileName: v.optional(v.string()),
				})
			)
		),
	},
	handler: async (ctx, args): Promise<Id<'messages'>> => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const conversation = await ctx.db.get(args.conversation_id as Id<'conversations'>);
		if (conversation?.user_id !== session.userId) throw new Error('Unauthorized');

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
				content_html: args.content_html,
				role: args.role,
				// Optional, coming from SK API route
				model_id: args.model_id,
				provider: args.provider,
				token_count: args.token_count,
				web_search_enabled: args.web_search_enabled,
				reasoning_effort: args.reasoning_effort,
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
		reasoning: v.optional(v.string()),
		content_html: v.optional(v.string()),
		generation_id: v.optional(v.string()),
		reasoning_effort: v.optional(reasoningEffortValidator),
		annotations: v.optional(v.array(v.record(v.string(), v.any()))),
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
			reasoning: args.reasoning,
			content_html: args.content_html,
			generation_id: args.generation_id,
			annotations: args.annotations,
			reasoning_effort: args.reasoning_effort,
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
		content_html: v.optional(v.string()),
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
			content_html: args.content_html,
		});
	},
});

export const getByConversationPublic = query({
	args: {
		conversation_id: v.id('conversations'),
	},
	handler: async (ctx, args) => {
		// First check if the conversation is public
		const conversation = await ctx.db.get(args.conversation_id);

		if (!conversation || !conversation.public) {
			return null;
		}

		const messages = await ctx.db
			.query('messages')
			.withIndex('by_conversation', (q) => q.eq('conversation_id', args.conversation_id))
			.order('asc')
			.collect();

		return messages;
	},
});

export const updateError = mutation({
	args: {
		session_token: v.string(),
		// optional in case the message hasn't been created yet
		message_id: v.optional(v.string()),
		conversation_id: v.string(),
		error: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		await Promise.all([
			args.message_id
				? ctx.db.patch(args.message_id as Id<'messages'>, {
						error: args.error,
					})
				: Promise.resolve(),

			// reset loading state
			ctx.db.patch(args.conversation_id as Id<'conversations'>, {
				generating: false,
				updated_at: Date.now(),
			}),
		]);
	},
});
