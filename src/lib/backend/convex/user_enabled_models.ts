import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { providerValidator } from './schema';

export const get = mutation({
	args: {
		user_id: v.id('users'),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query('user_enabled_models')
			.withIndex('by_user', (q) => q.eq('user_id', args.user_id))
			.collect();
	},
});

export const set = mutation({
	args: {
		provider: providerValidator,
		model_id: v.string(),
		user_id: v.id('users'),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('user_enabled_models')
			.withIndex('by_model_provider', (q) =>
				q.eq('model_id', args.model_id).eq('provider', args.provider)
			)
			.first();

		if (existing) return;

		await ctx.db.insert('user_enabled_models', { ...args, pinned: null });
	},
});
