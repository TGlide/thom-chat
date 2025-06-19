import { internal } from './_generated/api';
import { query } from './_generated/server';
import { type SessionObj } from './betterAuth';
import { mutation } from './functions';
import { v } from 'convex/values';

export const get = query({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Invalid session token');
		}

		const s = session as SessionObj;

		return await ctx.db
			.query('user_settings')
			.withIndex('by_user', (q) => q.eq('user_id', s.userId))
			.first();
	},
});

export const incrementFreeMessageCount = mutation({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Invalid session token');
		}

		const s = session as SessionObj;

		const existing = await ctx.db
			.query('user_settings')
			.withIndex('by_user', (q) => q.eq('user_id', s.userId))
			.first();

		if (!existing) {
			await ctx.db.insert('user_settings', {
				user_id: s.userId,
				privacy_mode: false,
				free_messages_used: 1,
			});
		} else {
			const currentCount = existing.free_messages_used || 0;
			await ctx.db.patch(existing._id, {
				free_messages_used: currentCount + 1,
			});
		}
	},
});

export const set = mutation({
	args: {
		privacy_mode: v.boolean(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Invalid session token');
		}

		const s = session as SessionObj;

		const existing = await ctx.db
			.query('user_settings')
			.withIndex('by_user', (q) => q.eq('user_id', s.userId))
			.first();

		if (!existing) {
			await ctx.db.insert('user_settings', {
				user_id: s.userId,
				privacy_mode: args.privacy_mode,
				free_messages_used: 0,
			});
		} else {
			await ctx.db.patch(existing._id, {
				privacy_mode: args.privacy_mode,
			});
		}
	},
});

/** Never call this from the client */
export const create = mutation({
	args: {
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.insert('user_settings', {
			user_id: args.user_id,
			privacy_mode: false,
			free_messages_used: 0,
		});
	},
});
