import { v } from 'convex/values';
import { Provider } from '../../types';
import { mutation, query } from './_generated/server';
import { providerValidator } from './schema';

export const get = query({
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

export const set = mutation({
	args: {
		provider: providerValidator,
		user_id: v.string(),
		key: v.string(),
	},
	handler: async (ctx, args) => {
		const exisingItem = await ctx.db
			.query('user_keys')
			.withIndex('by_provider_user', (q) =>
				q.eq('provider', args.provider).eq('user_id', args.user_id)
			)
			.first();

		if (exisingItem) {
			await ctx.db.replace(exisingItem._id, args);
		} else {
			await ctx.db.insert('user_keys', args);
		}
	},
});
