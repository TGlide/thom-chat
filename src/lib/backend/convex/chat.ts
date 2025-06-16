import { v } from 'convex/values';
import { Provider } from '../../types';
import { internal } from './_generated/api';
import { mutation, query } from './_generated/server';
import { providerValidator } from './schema';

export const all = query({
	args: {
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		const allKeys = await ctx.db
			.query('user_keys')
			.withIndex('by_user', (q) => q.eq('user_id', args.user_id))
			.collect();

		return Object.values(Provider).reduce(
			(acc, key) => {
				acc[key] = allKeys.find((item) => item.provider === key)?.key;
				return acc;
			},
			{} as Record<Provider, string | undefined>
		);
	},
});

export const get = query({
	args: {
		user_id: v.string(),
		provider: providerValidator,
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const key = await ctx.db
			.query('user_keys')
			.withIndex('by_provider_user', (q) =>
				q.eq('provider', args.provider).eq('user_id', args.user_id)
			)
			.first();

		return key?.key;
	},
});

export const set = mutation({
	args: {
		provider: providerValidator,
		user_id: v.string(),
		key: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		const existing = await ctx.db
			.query('user_keys')
			.withIndex('by_provider_user', (q) =>
				q.eq('provider', args.provider).eq('user_id', args.user_id)
			)
			.first();

		if (existing) {
			await ctx.db.replace(existing._id, args);
		} else {
			await ctx.db.insert('user_keys', args);
		}
	},
});
