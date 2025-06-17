import { v } from 'convex/values';
import { api } from './_generated/api';
import { query } from './_generated/server';
import { type Id } from './_generated/dataModel';
import { type SessionObj } from './betterAuth';
import { messageRoleValidator } from './schema';
import { mutation } from './functions';

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
			const aTime = a.updated_at ?? 0;
			const bTime = b.updated_at ?? 0;

			return bTime - aTime;
		});
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
		});

		return res;
	},
});

export const createAndAddMessage = mutation({
	args: {
		content: v.string(),
		role: messageRoleValidator,
		session_token: v.string(),
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

		const conversationId = await ctx.db.insert('conversations', {
			title: 'Untitled (for now)',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Id type is janking out
			user_id: session.userId as any,
			updated_at: Date.now(),
		});

		const messageId = await ctx.runMutation(api.messages.create, {
			content: args.content,
			role: args.role,
			conversation_id: conversationId,
			session_token: args.session_token,
		});

		return {
			conversationId,
			messageId,
		};
	},
});
