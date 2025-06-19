import { query } from './_generated/server';
import { mutation } from './functions';
import { v } from 'convex/values';
import { providerValidator } from './schema';
import * as array from '../../utils/array';
import * as object from '../../utils/object';
import { api, internal } from './_generated/api';
import { Provider } from '../../types';
import type { Doc } from './_generated/dataModel';

export const getModelKey = (args: { provider: Provider; model_id: string }) => {
	return `${args.provider}:${args.model_id}`;
};

export const get_enabled = query({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args): Promise<Record<string, Doc<'user_enabled_models'>>> => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) throw new Error('Invalid session token');

		const models = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_user', (q) => q.eq('user_id', session.userId))
			.collect();

		return array.toMap(models, (m) => [getModelKey(m), m]);
	},
});

export const is_enabled = query({
	args: {
		sessionToken: v.string(),
		provider: providerValidator,
		model_id: v.string(),
	},
	handler: async (ctx, args): Promise<boolean> => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.sessionToken,
		});

		if (!session) throw new Error('Invalid session token');

		const model = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_model_provider_user', (q) =>
				q.eq('model_id', args.model_id).eq('provider', args.provider).eq('user_id', session.userId)
			)
			.first();

		return !!model;
	},
});

export const get = query({
	args: {
		provider: providerValidator,
		model_id: v.string(),
		session_token: v.string(),
	},
	handler: async (ctx, args): Promise<Doc<'user_enabled_models'> | null> => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) throw new Error('Invalid session token');

		const model = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_model_provider_user', (q) =>
				q.eq('model_id', args.model_id).eq('provider', args.provider).eq('user_id', session.userId)
			)
			.first();

		return model;
	},
});

export const set = mutation({
	args: {
		provider: providerValidator,
		model_id: v.string(),
		enabled: v.boolean(),
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(api.betterAuth.publicGetSession, {
			session_token: args.session_token,
		});
		console.log('Session', session);

		if (!session) throw new Error('Invalid session token');

		const existing = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_model_provider', (q) =>
				q.eq('model_id', args.model_id).eq('provider', args.provider)
			)
			.first();

		console.log('Trying to set', args.model_id, 'for', session.userId);
		console.log('Existing', !!existing);

		if (args.enabled && existing) return; // nothing to do here

		if (existing) {
			await ctx.db.delete(existing._id);
		} else {
			await ctx.db.insert('user_enabled_models', {
				...object.pick(args, ['provider', 'model_id']),
				user_id: session.userId,
				pinned: null,
			});
		}
	},
});

export const enable_initial = mutation({
	args: {
		session_token: v.string(),
	},
	handler: async (ctx, args) => {
		const session = await ctx.runQuery(internal.betterAuth.getSession, {
			sessionToken: args.session_token,
		});

		if (!session) {
			throw new Error('Unauthorized');
		}

		// Check if any models are enabled
		const enabledModels = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_user', (q) => q.eq('user_id', session.userId))
			.collect();

		if (enabledModels.length > 0) {
			return;
		}

		const initialModels = [
			'google/gemini-2.5-flash',
			'deepseek/deepseek-chat-v3-0324:free',
			'microsoft/phi-4:free',
		];

		await Promise.all(
			initialModels.map((model) =>
				ctx.db.insert('user_enabled_models', {
					user_id: session.userId,
					provider: Provider.OpenRouter,
					model_id: model,
					pinned: null,
				})
			)
		);
	},
});
