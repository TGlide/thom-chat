import { v } from 'convex/values';
import enhancedSearch from '../../utils/fuzzy-search';
import { getFirstSentence } from '../../utils/strings';
import { api } from './_generated/api';
import { type Doc, type Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { type SessionObj } from './betterAuth';
import { mutation } from './functions';
import { messageRoleValidator } from './schema';

export const get = query({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}
		const s = session as SessionObj;

		const conversations = await ctx.db
			.query('conversations')
			.withIndex('by_user', (q) => q.eq('user_id', s.userId))
			.collect();

		return conversations.sort((a, b) => {
			if (a.generating && b.generating) return 0;
			const aTime = a.updated_at ?? 0;
			const bTime = b.updated_at ?? 0;

			return bTime - aTime;
		});
	},
});

export const getById = query({
	args: {
		conversation_id: v.optional(v.id('conversations')),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		if (!args.conversation_id) return null;

		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const conversation = await ctx.db.get(args.conversation_id);

		if (!conversation || (!conversation.public && conversation.user_id !== session.userId)) {
			throw new Error('Conversation not found or unauthorized');
		}

		return conversation;
	},
});

export const create = mutation({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args): Promise<Id<'conversations'>> => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const res = await ctx.db.insert('conversations', {
			title: 'Untitled (for now)',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Id type is janking out
			user_id: session.userId as any,
			updated_at: Date.now(),
			generating: true,
			public: false,
		});

		return res;
	},
});

export const createAndAddMessage = mutation({
	args: {
		content: v.string(),
		content_html: v.optional(v.string()),
		role: messageRoleValidator,
		session_token: v.string(),
		web_search_enabled: v.optional(v.boolean()),
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
	handler: async (
		ctx,
		args
	): Promise<{ conversationId: Id<'conversations'>; messageId: Id<'messages'> }> => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// use first sentence as a placeholder title
		const [firstSentence, full] = getFirstSentence(args.content);

		const conversationId = await ctx.db.insert('conversations', {
			title: firstSentence ?? full.slice(0, 35),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Id type is janking out
			user_id: session.userId as any,
			updated_at: Date.now(),
			generating: true,
			public: false,
		});

		const messageId = await ctx.runMutation(api.messages.create, {
			content: args.content,
			content_html: args.content_html,
			role: args.role,
			conversation_id: conversationId,
			session_token: args.session_token,
			web_search_enabled: args.web_search_enabled,
			images: args.images,
		});

		return {
			conversationId,
			messageId,
		};
	},
});

export const updateTitle = mutation({
	args: {
		conversation_id: v.id('conversations'),
		title: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// Verify the conversation belongs to the user
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== session.userId) {
			throw new Error('Conversation not found or unauthorized');
		}

		await ctx.db.patch(args.conversation_id, {
			title: args.title,
			updated_at: Date.now(),
		});
	},
});

export const updateGenerating = mutation({
	args: {
		conversation_id: v.id('conversations'),
		generating: v.boolean(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// Verify the conversation belongs to the user
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== session.userId) {
			throw new Error('Conversation not found or unauthorized');
		}

		await ctx.db.patch(args.conversation_id, {
			generating: args.generating,
			updated_at: Date.now(),
		});
	},
});

export const updateCostUsd = mutation({
	args: {
		conversation_id: v.id('conversations'),
		cost_usd: v.number(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) throw new Error('Unauthorized');

		// Verify the conversation belongs to the user
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== session.userId) {
			throw new Error('Conversation not found or unauthorized');
		}

		await ctx.db.patch(args.conversation_id, {
			cost_usd: (conversation.cost_usd ?? 0) + args.cost_usd,
		});
	},
});

export const setPublic = mutation({
	args: {
		conversation_id: v.id('conversations'),
		public: v.boolean(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) throw new Error('Unauthorized');

		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== session.userId) {
			throw new Error('Conversation not found or unauthorized');
		}

		await ctx.db.patch(args.conversation_id, {
			public: args.public,
		});
	},
});

export const togglePin = mutation({
	args: {
		conversation_id: v.id('conversations'),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// Verify the conversation belongs to the user
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== session.userId) {
			throw new Error('Conversation not found or unauthorized');
		}

		await ctx.db.patch(args.conversation_id, {
			pinned: !conversation.pinned,
			updated_at: Date.now(),
		});

		return { pinned: !conversation.pinned };
	},
});

export const remove = mutation({
	args: {
		conversation_id: v.id('conversations'),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// Verify the conversation belongs to the user
		const conversation = await ctx.db.get(args.conversation_id);
		if (!conversation || conversation.user_id !== session.userId) {
			throw new Error('Conversation not found or unauthorized');
		}

		await ctx.db.delete(args.conversation_id);
	},
});

export const getPublicById = query({
	args: {
		conversation_id: v.id('conversations'),
	},
	handler: async (ctx, args) => {
		const conversation = await ctx.db.get(args.conversation_id);

		if (!conversation || !conversation.public) {
			return null;
		}

		return conversation;
	},
});

export const search = query({
	args: {
		session_token: v.string(),
		search_term: v.string(),
		search_mode: v.optional(v.union(v.literal('exact'), v.literal('words'), v.literal('fuzzy'))),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		type ConversationSearchResult = {
			conversation: Doc<'conversations'>;
			messages: Doc<'messages'>[];
			score: number;
			titleMatch: boolean;
		};

		if (!args.search_term.trim()) return [];

		const searchMode = args.search_mode || 'words';
		const results: ConversationSearchResult[] = [];

		// Get all conversations for the user
		const conversations = await ctx.db
			.query('conversations')
			.withIndex('by_user', (q) => q.eq('user_id', session.userId))
			.collect();

		// Search through conversations and messages
		for (const conversation of conversations) {
			// Get messages for this conversation
			const conversationMessages = await ctx.db
				.query('messages')
				.withIndex('by_conversation', (q) => q.eq('conversation_id', conversation._id))
				.collect();

			// Search title
			const titleResults = enhancedSearch({
				needle: args.search_term,
				haystack: [conversation],
				property: 'title',
				mode: searchMode,
				minScore: 0.3,
			});

			// Search messages
			const messageResults = enhancedSearch({
				needle: args.search_term,
				haystack: conversationMessages,
				property: 'content',
				mode: searchMode,
				minScore: 0.3,
			});

			// If we have matches in title or messages, add to results
			if (titleResults.length > 0 || messageResults.length > 0) {
				const titleScore = titleResults.length > 0 ? (titleResults[0]?.score ?? 0) : 0;
				const messageScore =
					messageResults.length > 0 ? Math.max(...messageResults.map((r) => r.score)) : 0;

				results.push({
					conversation,
					messages: messageResults.map((r) => r.item),
					score: Math.max(titleScore, messageScore),
					titleMatch: titleResults.length > 0,
				});
			}
		}

		// Sort by score (highest first)
		return results.sort((a, b) => b.score - a.score);
	},
});
