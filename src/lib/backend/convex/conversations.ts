import { v } from 'convex/values';
import { api } from './_generated/api';
import { mutation, query } from './_generated/server';
import { type Id } from './_generated/dataModel';
import { type SessionObj } from './betterAuth';

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

		return conversations;
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
		});

		return res;
	},
});
