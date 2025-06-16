import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { providerValidator } from './schema';
import * as array from '../../utils/array';
import * as object from '../../utils/object';
import { internal } from './_generated/api';

export const get_enabled = query({
	args: {
		user_id: v.string(),
	},
	handler: async (ctx, args) => {
		const models = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_user', (q) => q.eq('user_id', args.user_id))
			.collect();

		return array.toMap(models, (m) => [`${m.provider}:${m.model_id}`, m]);
	},
});

export const is_enabled = query({
	args: {
		user_id: v.string(),
		provider: providerValidator,
		model_id: v.string(),
	},
	handler: async (ctx, args) => {
		const model = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_model_provider_user', (q) =>
				q.eq('model_id', args.model_id).eq('provider', args.provider).eq('user_id', args.user_id)
			)
			.first();

		return !!model;
	},
});

export const set = mutation({
	args: {
		provider: providerValidator,
		model_id: v.string(),
		user_id: v.string(),
		enabled: v.boolean(),
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
			.query('user_enabled_models')
			.withIndex('by_model_provider', (q) =>
				q.eq('model_id', args.model_id).eq('provider', args.provider)
			)
			.first();

		if (args.enabled && existing) return; // nothing to do here

		if (existing) {
			await ctx.db.delete(existing._id);
		} else {
			await ctx.db.insert('user_enabled_models', {
				...object.pick(args, ['provider', 'model_id', 'user_id']),
				pinned: null,
			});
		}
	},
});
