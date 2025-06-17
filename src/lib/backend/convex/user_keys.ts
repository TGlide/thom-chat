import { v } from 'convex/values';
import { Provider } from '../../types';
import { api, internal } from './_generated/api';
import { query } from './_generated/server';
import { mutation } from './functions';
import { providerValidator } from './schema';
import { type SessionObj } from './betterAuth';

export const all = query({
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

		const allKeys = await ctx.db
			.query('user_keys')
			.withIndex('by_user', (q) => q.eq('user_id', s.userId))
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
		provider: providerValidator,
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

		const key = await ctx.db
			.query('user_keys')
			.withIndex('by_provider_user', (q) => q.eq('provider', args.provider).eq('user_id', s.userId))
			.first();

		return key?.key;
	},
});

export const set = mutation({
	args: {
		provider: providerValidator,
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
				q.eq('provider', args.provider).eq('user_id', session.userId)
			)
			.first();

		const userKey = { ...args, session_token: undefined, user_id: session.userId };

		if (existing) {
			await ctx.db.replace(existing._id, userKey);
		} else {
			await ctx.db.insert('user_keys', userKey);

			if (args.provider === Provider.OpenRouter) {
				const defaultModels = [
					'google/gemini-2.5-flash',
					'anthropic/claude-sonnet-4',
					'openai/o3-mini',
					'deepseek/deepseek-chat-v3-0324:free',
				];

				await Promise.all(
					defaultModels.map((model) =>
						ctx.db.insert('user_enabled_models', {
							user_id: session.userId,
							provider: Provider.OpenRouter,
							model_id: model,
							pinned: null,
						})
					)
				);
			}
		}
	},
});
