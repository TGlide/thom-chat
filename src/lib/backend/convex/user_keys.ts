import { v } from 'convex/values';
import { Provider } from '../../types';
import { api, internal } from './_generated/api';
import { query } from './_generated/server';
import { mutation } from './functions';
import { providerValidator } from './schema';
import { type SessionObj } from './betterAuth';
import { CryptoService } from '../../utils/encrypt';

const crypto = new CryptoService();

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
				const encryptedKey = allKeys.find((item) => item.provider === key)?.key;
				if (!encryptedKey) return acc;

				const decryptedKey = crypto.decrypt(encryptedKey);
				if (decryptedKey.isErr()) return acc;

				acc[key] = decryptedKey.value;
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

		if (!key) return undefined;

		const decryptedKey = crypto.decrypt(key.key);
		if (decryptedKey.isErr()) return undefined;

		return decryptedKey.value;
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

		const encryptedKey = crypto.encrypt(args.key);

		console.log('encryptedKey', encryptedKey);

		const userKey = {
			...args,
			key: encryptedKey,
			session_token: undefined,
			user_id: session.userId,
		};

		console.log('userKey', userKey);

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
